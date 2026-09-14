# Commerce Coach production deployment

This stack is for a production Kubernetes cluster. It deliberately does not deploy PostgreSQL: use a managed PostgreSQL service with multi-zone failover, encrypted storage, point-in-time recovery, automated backups, and tested restores.

## What it provides

- Three application replicas with zero-unavailable rolling updates, topology spreading, autoscaling, and a disruption budget.
- Restricted Pod Security admission, a non-root read-only container, no service-account token, dropped Linux capabilities, and bounded temporary storage.
- Separate liveness and database-aware readiness checks, graceful termination, and database startup retry.
- TLS-only ingress and exact HTTPS origin configuration.
- Default-deny networking with explicit DNS, managed PostgreSQL, HTTPS provider, and ingress-controller access.
- An ordered migration gate. The schema-owner credential is mounted only into the short-lived migration Job and never into web pods.
- Immutable digest-only releases, context confirmation, secret preflight checks, and rollout verification.

## Cluster prerequisites

- Kubernetes with a working CNI NetworkPolicy implementation.
- NGINX Ingress Controller. If you use another controller, update `ingress.yaml` annotations and the ingress settings.
- Metrics Server for the HorizontalPodAutoscaler.
- A pre-provisioned TLS Secret and DNS record for the public hostname.
- A managed PostgreSQL database reachable from the cluster. Every PostgreSQL URL should require TLS and use a provider-supported certificate verification mode.
- At least three schedulable worker nodes across failure domains for meaningful high availability.

## Create secrets

Store each value in a permission-restricted file. Use three different database logins: schema owner, restricted application data login, and restricted authentication login. The migration process creates and validates the restricted roles.

```sh
kubectl --context production-cluster apply -f deploy/production/namespace.yaml

kubectl --context production-cluster -n commerce-coach create secret generic commerce-coach-runtime-database \
  --from-file=database-url=/secure/commerce-coach/database-url \
  --from-file=auth-database-url=/secure/commerce-coach/auth-database-url

kubectl --context production-cluster -n commerce-coach create secret generic commerce-coach-migration-database \
  --from-file=migration-database-url=/secure/commerce-coach/migration-database-url

kubectl --context production-cluster -n commerce-coach create secret generic commerce-coach-providers \
  --from-file=openrouter-api-key=/secure/commerce-coach/openrouter-api-key \
  --from-file=gemini-api-key=/secure/commerce-coach/gemini-api-key \
  --from-file=google-client-id=/secure/commerce-coach/google-client-id \
  --from-file=google-client-secret=/secure/commerce-coach/google-client-secret
```

All four provider files must exist; unused providers should use empty files. Set `GOOGLE_SSO_ENABLED=true` only when both Google credential files are populated. Prefer a cloud secret synchronizer or sealed-secret controller for ongoing rotation. Never commit the files or rendered Secret objects.

Create `COACH_TLS_SECRET` through your certificate manager or your platform's approved certificate workflow. The deploy script requires it to exist before rollout.

## Build and release

Build the multi-stage image in trusted CI, scan it, sign it, push it, and obtain its sha256 digest. Copy `deploy/production.env.example` outside the repository, fill in the values, and export them in the release shell.

`DATABASE_EGRESS_CIDR` must cover only the managed database addresses. Standard Kubernetes NetworkPolicy does not resolve hostnames. `TRUSTED_PROXIES` must be the actual ingress-controller source CIDR, not the public internet. The ingress allow rule expects the standard NGINX controller labels; update it if your installation uses different labels.

Inspect the fully substituted manifests without contacting the cluster:

```sh
set -a
. /secure/commerce-coach/production.env
set +a
npm run --silent production:render > /tmp/commerce-coach-production.yaml
```

Deploy with migration-before-rollout ordering:

```sh
npm run production:deploy
```

The deploy command refuses mutable image tags, a mismatched kubectl context, missing secrets, unresolved placeholders, or a failed migration. Successful migration Jobs are automatically removed after 24 hours.

## Operational acceptance

Before routing all traffic, confirm:

```sh
kubectl --context "$KUBE_CONTEXT" -n commerce-coach get deployment,pods,hpa,ingress
curl --fail --show-error "https://$COACH_DOMAIN/api/live"
curl --fail --show-error "https://$COACH_DOMAIN/api/ready"
```

Configure external uptime checks for both endpoints, centralized structured-log collection, resource and 5xx alerts, database saturation alerts, certificate-expiry alerts, and provider-spend alerts. Run a database restore drill before launch and at least quarterly. Test rollback by deploying the preceding immutable image digest; database migrations must remain backward compatible throughout a rolling release.
