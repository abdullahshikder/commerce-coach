# Production release preparation

## Status

This is prepared application code, not a production deployment. Migration 007 has **not** been applied: automatic approval review rejected changing this local database's access-control permissions and existing document visibility without explicit approval. Knowledge mutations return a clear maintenance response until it is installed. Built-in Library reading and existing authentication remain available. Uploaded retrieval pauses until publication gating is installed.

The approval is specifically for `node --import tsx scripts/apply-production.ts` against the existing local Commerce Coach database. It creates no accounts or login roles. Its effects are:
- Existing uploads become private drafts, readable by the same workspace's admins and reviewers. Members and retrieval see published, processed material only.
- Admins upload, edit, restore and submit; admins/reviewers may publish or return documents to draft. Self-review by an admin is allowed; there is no mandatory two-person rule.
- Direct runtime document UPDATE is revoked. Narrow checked functions perform revisions and publication. The auth pool receives bounded claim/finish job capabilities; job content is not exposed through public API endpoints.
- New attachment/version/audit tables use forced RLS. Knowledge and account-access changes are audited without recording passwords or document content in the audit log.

## Knowledge workflow

Upload/import creates a draft and queues work. The server claims one job at a time; a database lock caps all server instances at three active jobs. A two-minute lease allows restart recovery, with at most three attempts and retry delays. Jobs survive navigation and logout. In-flight edits invalidate old worker tokens. Processing does not publish.

Open **Knowledge → Preview & review**, check the source/images, then submit. A reviewer/admin publishes the current revision. Editing or restoring creates a new draft and temporarily removes that document from answers. Versions are capped at 100 per document; deleting a document removes its versions and attachments, while the audit event remains.

Folder imports upload referenced PNG/JPEG files after concept import. Individual images can also be attached from a draft preview. Limits: 5 MB per image, 40 megapixels, 100 images / 50 MB per workspace. File signature, dimensions, extension, path and encoding are checked. Images are stored in PostgreSQL and served only through authenticated RLS-protected routes. No SVG, remote fetching or arbitrary HTML. Existing attachment paths cannot be overwritten; use a new filename for a replacement. Folder image upload is sequential and not atomic with concept import; partial failures are shown and can be repaired from the preview. Browser closure can interrupt image upload, but not processing jobs already queued.

Built-in articles continue displaying linked visual-guide screenshots inline. Imported Markdown resolves document-relative/root-relative attached image paths. This renderer supports the application's Markdown subset, not every CommonMark extension.

## Verification

Run `npm run verify` for TypeScript, unit tests, workflow evaluations and the production build. The new tests check attachment safety, real screenshot signatures, bilingual indexing, malformed vectors, readiness and Library behavior.

`npm run test:security` uses an isolated disposable PostgreSQL database with temporary test accounts and roles. Its expanded cases cover member/reviewer/admin APIs, cross-tenant documents/images, publication, stale revisions, restoration, expired worker leases and old-token rejection. This expanded suite has not been executed locally in this change; previous approval restrictions prohibit creating the fixtures without explicit permission. The prepared GitHub Actions workflow runs it against an ephemeral PostgreSQL service when this standalone app becomes a GitHub repository. No workflow has been published or run. Dependency auditing remains unperformed; the prior inventory-disclosure approval is still pending.

`npm run production:check` prints booleans only. Add `-- --live` to send a small paid embedding/generation check after configuring server secrets. Real Google SSO must be checked by signing in with an existing invited account and the configured HTTPS callback. Local checks currently find no generation, embedding or Google credentials. Do not paste secrets in chat.

## Deployment

1. Select a server/domain and point DNS to it. Create the eight files named under `secrets:` in `compose.production.yaml` in `deploy/secrets/`, with private permissions. Database URLs use host `db`, database `commerce_coach`, and distinct owner/runtime/authentication credentials. Empty provider/Google files disable those integrations; never put owner credentials in the web service.
2. Copy `deploy/production.env.example` to the ignored `deploy/production.env`. Choose an immutable release image tag and public domain. Set the HTTPS Google callback only when its client credentials are configured.
3. Build the chosen release image with `docker build -t commerce-coach:<release> .`. The build excludes data, secrets, backups and environment files. Configure `COACH_IMAGE` to that exact tag.
4. Run `docker compose --env-file deploy/production.env -f compose.production.yaml up -d`. Caddy exposes 80/443 and obtains certificates for the domain. The application and database have no public port mappings. Migration runs before the application.
5. Check service health, run provider readiness in the container, verify invited Google/password sign-in and role boundaries in the browser. Configure external alert delivery for unhealthy services, failed backups, sustained HTTP 5xx, worker errors and queue age. No alerting destination is currently connected.

Keep secret mounts separate from release images. `*_FILE` variables support the listed mounted secrets. Runtime is non-root, drops Linux capabilities and uses `no-new-privileges`. Configure exact trusted proxy addresses if per-client IP throttling is needed; with none configured, clients share the proxy's IP budget. Production startup rejects non-HTTPS origins and partial SSO configuration.

References: [GitHub PostgreSQL service containers](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers), [Caddy automatic HTTPS](https://caddyserver.com/docs/automatic-https).

## Backup and recovery

The production backup sidecar creates a custom-format PostgreSQL dump daily, verifies its archive listing, writes it with private permissions and retains 14 days. Attachments are included because they live in PostgreSQL. The sidecar health check fails if no recent successful dump exists. Its host `backups/` directory is excluded from releases. This is a scheduled local backup, not off-site disaster recovery or point-in-time recovery. Provision encrypted off-site replication and choose recovery time/data-loss targets before launch. No backup schedule has been deployed yet.

For a restore drill, provide an existing **empty** database named `coach_restore_<name>` using `RESTORE_TEST_DATABASE_URL`, on an isolated test cluster with the policy roles `coach_app` and `coach_auth` available. Run:

```
npm run db:restore-drill -- /private/coach-backup.dump --execute
```

The tool refuses other database names and nonempty targets, restores transactionally, then checks core table RLS flags and data counts. It does not create or drop databases/roles. Restored grants are intentionally omitted; run migrations and the isolated security checks before any promotion. The restored database contains sensitive accounts/session hashes and must remain isolated. The drill has not been executed. See [PostgreSQL pg_restore](https://www.postgresql.org/docs/17/app-pgrestore.html).

## Monitoring and rollback

**Operations** shows configuration booleans, workspace job totals and the latest 100 audit events. JSON logs contain request IDs, status/duration, job outcomes, and provider-reported token/cost usage when available. Prompts, responses, cookies, query strings, credentials and raw provider errors are excluded. Gemini logs token counts but no inferred dollar cost; missing provider costs remain unknown. Log aggregation, alerts and budget dashboards are external deployment tasks.

Keep the previous release image and a verified database backup. Stop workers during rollback. Do not blindly restore old document policies: retain migration 007 publication controls, or restore the full pre-change database in an isolated environment and verify it before switching traffic. See ROLLBACK.md. Load testing, a successful restore drill, live SSO/AI tests and the expanded isolation suite remain launch gates.
