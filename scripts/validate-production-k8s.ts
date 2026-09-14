import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseAllDocuments } from 'yaml';

const directory = resolve(dirname(fileURLToPath(import.meta.url)), '../deploy/production');
const resources = readdirSync(directory)
  .filter(file => file.endsWith('.yaml') && file !== 'kustomization.yaml')
  .flatMap(file => parseAllDocuments(readFileSync(resolve(directory, file), 'utf8')).map(document => {
    if (document.errors.length) throw new Error(`${file}: ${document.errors.map(error => error.message).join('; ')}`);
    return document.toJS() as Record<string, any>;
  }));

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function resource(kind: string, name?: string) {
  const found = resources.find(item => item.kind === kind && (!name || item.metadata?.name === name));
  assert(found, `Missing ${kind}${name ? `/${name}` : ''}.`);
  return found;
}

assert(!resources.some(item => item.kind === 'Secret'), 'Production secrets must never be committed as manifests.');
const namespace = resource('Namespace', 'commerce-coach');
assert(namespace.metadata.labels['pod-security.kubernetes.io/enforce'] === 'restricted', 'Namespace must enforce restricted Pod Security.');

const deployment = resource('Deployment', 'commerce-coach');
assert(deployment.spec.replicas >= 3, 'Production requires at least three replicas.');
assert(deployment.spec.strategy.rollingUpdate.maxUnavailable === 0, 'Rolling updates must remain available.');
const pod = deployment.spec.template.spec;
const container = pod.containers[0];
assert(/@sha256:[a-f0-9]{64}$/.test(container.image), 'The production image placeholder must be digest-pinned.');
assert(container.startupProbe.httpGet.path === '/api/live', 'Startup must use the process-only health endpoint.');
assert(container.livenessProbe.httpGet.path === '/api/live', 'Liveness must not depend on PostgreSQL.');
assert(container.readinessProbe.httpGet.path === '/api/ready', 'Readiness must check PostgreSQL.');
assert(container.securityContext.readOnlyRootFilesystem === true, 'The application root filesystem must be read-only.');
assert(container.securityContext.capabilities.drop.includes('ALL'), 'The application must drop all Linux capabilities.');
assert(pod.automountServiceAccountToken === false, 'The application must not mount a Kubernetes API token.');
assert(pod.securityContext.seccompProfile.type === 'RuntimeDefault', 'The application must use the runtime-default seccomp profile.');
assert(!JSON.stringify(pod.volumes).includes('commerce-coach-migration-database'), 'Web pods must never mount the migration-owner credential.');

const migration = resources.find(item => item.kind === 'Job' && item.metadata?.generateName === 'commerce-coach-migrate-');
assert(migration, 'Missing generated migration Job.');
assert(migration.spec.ttlSecondsAfterFinished > 0, 'Completed migration Jobs need automatic cleanup.');
assert(JSON.stringify(migration.spec.template.spec.volumes).includes('commerce-coach-migration-database'), 'Migration Job must mount its dedicated credential.');

const config = resource('ConfigMap', 'commerce-coach-config');
assert(config.data.NODE_ENV === 'production', 'Production must set NODE_ENV=production.');
assert(config.data.APP_ORIGINS.startsWith('https://'), 'Production origin must use HTTPS.');
const ingress = resource('Ingress', 'commerce-coach');
assert(ingress.spec.tls?.[0]?.secretName, 'Ingress must terminate TLS.');
assert(resource('PodDisruptionBudget', 'commerce-coach').spec.minAvailable >= 2, 'Disruption budget must keep two replicas available.');
assert(resource('HorizontalPodAutoscaler', 'commerce-coach').spec.minReplicas >= 3, 'Autoscaling must keep three replicas.');
assert(resources.filter(item => item.kind === 'NetworkPolicy').length >= 3, 'Default-deny and explicit allow NetworkPolicies are required.');

console.log(`Validated ${resources.length} production Kubernetes resources.`);
