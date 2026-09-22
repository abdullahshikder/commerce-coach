# Commerce Coach

Standalone React/Vite frontend and Express backend with individual authentication, organization-scoped RBAC, and **native PostgreSQL row-level security**. PostgreSQL replaces SQLite for runtime data; the original SQLite file is retained for import and rollback.

Production Kubernetes configuration and its guarded release workflow are documented in [deploy/production/README.md](deploy/production/README.md). The production stack uses a managed PostgreSQL service and is separate from the local Minikube manifest.

## This workspace

The local PostgreSQL cluster has been initialized under `data/postgres-runtime`, listening only on `127.0.0.1:55432`. The app’s separate restricted data/authentication database connections is in the private `.env` file. Two existing Coach feedback records were imported into the `pathao` organization.

```sh
npm ci
npm run dev
```

Open http://localhost:8010, or run `npm run build` then `npm start` and open http://localhost:4010. Local first-sign-in details are in **`data/initial-admin.txt`**, readable only by the local user. Change the temporary password at first sign-in and delete that file afterward. Credentials, PostgreSQL cluster files, and session data are excluded from the distributable ZIP.

If the local database is stopped, start it from this folder with:

```sh
pg_ctl -D data/postgres-runtime -l /tmp/coach-postgres.log -o '-p 55432 -h 127.0.0.1 -k /tmp' start
```

## Roles and isolation

| Capability | Member | Reviewer | Admin |
| --- | --- | --- | --- |
| Use Coach, training, quiz, and screenshots | Yes | Yes | Yes |
| Submit feedback and read own submissions | Yes | Yes | Yes |
| Read and review organization feedback | No | Yes | Yes |
| Create users, change roles, disable accounts, reset passwords | No | No | Yes |
| Access another organization’s private records | No | No | No |

Admins use **Team access** to create users with temporary passwords, assign roles, disable accounts, and reset credentials. New/reset accounts must change their password before using Coach. Admins cannot remove the last active admin. Each account belongs to one organization; the same email may have separate accounts in different organizations.

- Passwords use salted scrypt hashes. Sessions use random opaque tokens; only their SHA-256 hashes are stored in PostgreSQL.
- Session cookies are HttpOnly and SameSite=Strict, expire after 12 hours, and are Secure in production. Use HTTPS for deployed environments.
- State-changing requests require an allowed Origin, a custom request header, and an authenticated CSRF token. Login has origin/header checks and rate limiting; password work has concurrency limits.
- Logout and password changes revoke sessions. Role changes, disabling, and admin password resets also revoke the affected user’s sessions.
- PostgreSQL enables and forces RLS on `public.coach_feedback` and `public.coach_query_logs`. Reads and writes resolve identity from the current live session; query text remains private even from other users and tenant administrators. Forged user/role/tenant headers are ignored.
- Authentication tables are in `coach_private`, inaccessible to the runtime role. Narrow SQL functions implement scoped authentication and user administration; password hashes are never returned to the frontend.
- Login verification has a separate database login/pool. The data role cannot read credential tables or call the functions that create sessions.
- The app refuses database superusers, table owners, CREATEROLE/BYPASSRLS users, and memberships that can inherit elevated privileges.

The curated product knowledge, bilingual FAQs, official tutorial summaries, and screenshots remain shared application content bundled with the application. The Library exposes the 14 reviewed videos from the [Pathao Commerce tutorial playlist](https://www.youtube.com/playlist?list=PLMN1y8VZcPd8) as source-linked walkthroughs. Related chat screenshots show the full official tutorial URL as selectable caption text. Mobile Share sends the clean PNG file with only that URL; desktop users get separate Copy image and Copy URL controls so macOS does not insert a temporary WebShare file path. Downloaded PNGs stay clean, and PDF exports keep the caption URL clickable. `public.coach_knowledge` is a read-only SQL mirror of all current knowledge records; authored TypeScript/OKF stays canonical. Successful generated questions and answers are stored in `public.coach_query_logs`, while full conversation snapshots, feedback, accounts, and uploaded documents use their existing isolated tables. Approval records a review decision; it never rewrites knowledge automatically.

## New installation with PostgreSQL

Requirements: Node.js 22.12+, npm, and PostgreSQL 17+ (local checks also passed on PostgreSQL 18). Use a dedicated database and migration owner; do not point this application at an unrelated database.

1. Copy `.env.example` to `.env`. Set `DATABASE_URL` to a new data login such as `coach_runtime`, and `AUTH_DATABASE_URL` to a different authentication login such as `coach_login`. Give each a different random URL-safe password of at least 20 characters. Set `APP_ORIGINS` to the exact frontend origins, including scheme and port.
2. Provide `MIGRATION_DATABASE_URL` only to administrative commands. Its owner needs schema/role creation privileges. `npm run db:migrate` creates the schema, restricted data/authentication logins, grants, and RLS policies, then synchronizes the built-in knowledge mirror. Re-running is safe. After later knowledge edits, run `npm run db:sync-knowledge` to refresh the mirror without reapplying migrations.
3. Create the first Pathao workspace admin using a private password file:

```sh
npm run db:migrate
npm run admin:create -- pathao "Pathao" admin@example.com /private/path/temporary-password.txt
npm run db:init
npm run build
npm start
```

Set `MIGRATION_DATABASE_URL` in the environment of the first two commands; keep it out of the web process. In this prepared workspace, local administrative configuration is in `data/admin.env`; use `DOTENV_CONFIG_PATH=data/admin.env npm run db:migrate` or the same prefix for other admin commands. That private file is excluded from the ZIP.

There is no public registration or automatic workspace joining. A Pathao admin provisions members; a database operator uses `admin:create` to provision the first Pathao administrator. Password reset is admin-mediated; email reset and MFA are not implemented. Google SSO is optional (setup below).

The sign-in screen is dedicated to the Pathao workspace, so users enter only their email and password. Password and Google authentication both resolve the `pathao` organization on the server.

## AI configuration

Configure `OPENROUTER_API_KEY` and/or `GEMINI_API_KEY` in the server environment to enable chat answers, then restart the API. Keys stay off the frontend. All AI and retrieval endpoints require sign-in. Documentation browsing and feedback remain available without keys; chat shows an explicit error instead of a canned answer when generation is unavailable.

The package still includes the older 239-vector snapshot (125 knowledge passages and 114 screenshot vectors). It predates the current 252 knowledge records, including the FAQ and tutorial additions, so runtime rejects it by fingerprint and uses lexical retrieval until a new snapshot is built. Semantic retrieval requires an OpenRouter key and a current snapshot.

```sh
npm run coach:eval
npm run embeddings:build
```

Rebuilding sends the curated knowledge/screenshots to OpenRouter and may incur API charges. Known workflow changes belong in `src/coach/workflows/registry.ts`; run the evaluations before rebuilding. The snapshot contains shared knowledge, never organization feedback.

## Import and backup

The source ZIP includes the legacy `data/coach.db` with its two original feedback records, for migration only. It contains user-entered feedback and should be treated as internal data. It contains no accounts or credentials.

```sh
npm run db:import -- /path/to/coach.db pathao admin@example.com
npm run db:backup -- /private/path/coach.dump
```

Both commands require `MIGRATION_DATABASE_URL`. Import opens SQLite read-only, explicitly assigns records to the chosen organization/user, preserves legacy reviewer attribution in the review note, and skips existing records. PostgreSQL RLS is restored before the import transaction commits. The original SQLite file remains unchanged.

Backup uses `pg_dump` in custom format with the owner connection, ensuring all organizations are included. Backups contain sensitive accounts/session hashes and feedback: store them privately. Restore into a separate empty database using `pg_restore --no-owner`, then rerun `db:migrate` with the intended migration owner and runtime login. Keep the old database until restoration and RLS tests pass.

## Docker

Set three different random URL-safe passwords in `.env`: `POSTGRES_PASSWORD` for the owner, `COACH_DB_PASSWORD` for data access, and `COACH_AUTH_PASSWORD` for login verification. Set `APP_ORIGINS` to your frontend origin.

```sh
docker compose up --build -d
```

Compose starts PostgreSQL, runs a separate migration service, then starts the web app. Only the migration service receives the database owner connection. PostgreSQL has no published host port; the web port binds to loopback. Put an HTTPS reverse proxy in front for deployment.

Create an administrator through the administrative service, passing the temporary password on stdin:

```sh
docker compose run --rm -T migrate npm run admin:create -- pathao "Pathao" admin@example.com /dev/stdin < /private/path/temporary-password.txt
```

To back up the Docker database with its matching PostgreSQL tools:

```sh
docker compose exec -T db pg_dump -U coach_owner -d commerce_coach --format=custom > /private/path/coach.dump
```

The `postgres-data` volume persists accounts, conversations, query logs, feedback, knowledge metadata, and uploaded documents; `coach-data` persists embeddings. The container starts with a fresh database; local data is excluded from image layers. Build embeddings with `docker compose exec coach npm run embeddings:build` after configuring OpenRouter. Do not remove volumes unless you intend to delete their data.

Docker Compose syntax was checked. Container execution was not tested because the local Docker daemon was unavailable.

## Tests

```sh
npm run lint
npm test
npm run coach:eval
npm run build
```

Security tests run against a real, disposable PostgreSQL database. Provide an administrative test connection that can create/drop databases and roles:

```sh
TEST_DATABASE_ADMIN_URL=postgresql://... npm run test:security
```

In this prepared workspace, `DOTENV_CONFIG_PATH=data/security-test.env npm run test:security` loads the private test connection without exposing it in shell history.

The suite creates a uniquely named database and two runtime logins, verifies RBAC, RLS, session revocation, CSRF, and tenant isolation, then removes them. Do not put a secret connection URL into shell history; load it from a private environment file or your secret manager. `npm run test:all` runs both suites when this variable is configured. See `VERIFICATION.md` for results.

## Google sign-in

Create a **Web application** OAuth client in [Google Cloud](https://developers.google.com/identity/openid-connect/openid-connect), configure its consent screen, and register this exact authorized redirect URI for local use:

```text
http://localhost:4010/api/auth/google/callback
```

Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` in `.env`, then restart the API (or recreate the Compose `coach` service). Production must use your HTTPS hostname and the same `/api/auth/google/callback` path. Include the frontend origin in `APP_ORIGINS`. Use the same hostname for the browser and callback, including during Vite development; do not mix localhost and 127.0.0.1. Run `npm run db:migrate` with the owner environment before starting an upgraded app.

The sign-in page shows **Continue with Google** beneath Organization. It becomes available when all three settings are configured. No Google credentials are bundled. A live Google sign-in still requires your OAuth client and consent-screen configuration.

An admin must first provision the user's account with its Gmail or Google Workspace email in the correct organization. Google sign-in never creates users, joins organizations, or assigns roles. The first sign-in binds Google's verified stable subject to that account; later sign-ins use this subject even if the Google email changes. Google accounts using third-party email without Workspace cannot automatically link by email; those users can use password sign-in. A Workspace domain alone grants no access.

The backend validates Google's signed ID token with Google's library, then checks verified email and the flow nonce. State is single-use, expires after ten minutes, and is bound to an HttpOnly browser cookie; code exchange uses PKCE. OAuth client secrets and tokens never reach frontend code. Google access/refresh tokens are not retained. Existing organization RBAC and PostgreSQL RLS apply to Google sessions. Google authentication bypasses a temporary local password requirement for that session only; it does not change or activate the temporary password.

## Saved conversations

The Coach automatically saves each question and completed reply to PostgreSQL. The **Conversations** sidebar reopens previous chats with screenshots, quiz scores, and training state. **New chat** starts another conversation without deleting history. The latest chat opens after sign-in or refresh; use **Load older conversations** to browse beyond the newest 50.

History is private to the individual user and organization, enforced by forced PostgreSQL RLS; other members, reviewers, and admins cannot browse it. A **Saved** indicator confirms persistence. **Not saved** offers a retry; avoid closing the page until it succeeds. Retrying a saved question resumes its answer. Concurrent tabs use revision checks instead of overwriting newer messages. Each conversation supports up to 200 messages within the API's 256 KB request limit. Data predating this feature existed only in browser memory and cannot be recovered after the page was closed.

Run `db:migrate` before starting the upgraded backend. `npm run dev` now watches backend source changes as well as frontend changes. If the frontend reports **Unknown API route**, restart the backend; Vite updates frontend code independently. Chat answers require a configured AI provider (`OPENROUTER_API_KEY` or `GEMINI_API_KEY`, server-side). Every question is generated using the documentation and conversation history, including follow-ups at a specific step. Provider failures show a retry message; stored workflows are reference material and are never substituted as chat answers.

The workspace uses a searchable conversation sidebar with timestamps, a compact account menu, a responsive mobile navigation panel, and a Bengali-friendly reading area. On mobile, use the navigation button beside the conversation title to open history. Search filters the loaded history; load older conversations to search those too.

The refreshed interface uses a light workspace by default, system-aware dark appearance with a manual toggle, self-hosted English/Bengali fonts, and a multiline composer (Enter sends; Shift+Enter adds a line). See DESIGN_REVIEW.md for design decisions and verification limits.

## Security hardening

Apply migrations before starting this version. Documentation assets now require sign-in; serve the production build through the backend. Shared login throttling, conversation quotas, security headers, and provider deadlines are implemented. Configure HTTPS and explicit TRUSTED_PROXIES for your deployment. See SECURITY_HARDENING.md for limits and verification.

## Admin document processor

Admins can upload reference files from **Knowledge**. UTF-8 text, Markdown, CSV and JSON are supported, up to 64 KB per file and 50 documents per organization. New drafts remain unprocessed until an admin generates an embedding preview, inspects the exact chunks and vector sample, and selects **Save embeddings**. Preview records expire after 30 minutes and never enter retrieval before confirmation. Without an embedding key, the same review gate previews keyword sections. See KNOWLEDGE_UPLOADS.md for setup, processing behavior and limits.

## Admin analytics

Admins can open **Analytics** to view 7, 30, or 90-day query volume, popular knowledge topics, provider and mode usage, feedback quality, pending reviews, and answer-failure reasons. The dashboard is tenant-scoped and built from anonymous facts in `coach_private`; it does not contain or expose question text, answers, or user identities. Members and reviewers cannot access the analytics API.

### Future training-data exports

The Analytics page also provides an admin-only JSONL export for future evaluation or fine-tuning. It includes only answers that a user explicitly rated helpful and corrections explicitly approved by a reviewer. Raw saved conversations, comments, review notes, account details, and dismissed or pending feedback are excluded. Email addresses, Bangladesh phone numbers, labeled transaction IDs, credentials, access tokens, and secret URL parameters are redacted on the server before download.

Each example uses chat `messages` plus metadata for its quality tier, language, provenance, schema version, and deterministic train/validation split. Duplicate question-answer pairs are removed, the dataset gets a content-derived version, and exports are capped at 5,000 source rows. Treat the JSONL as sensitive internal data even after redaction: review the validation holdout manually, store exports in an access-controlled location, and never commit them to this repository. Exporting prepares data; it does not train or upload a model automatically.

### Open Knowledge Format

Knowledge now supports Google OKF v0.2 folder/multi-file imports and batch processing. Metadata and concept paths are retained; draft, deprecated and stale concepts stay out of answers. See OKF_INTEGRATION.md and examples/okf.

The complete built-in knowledge export is available at knowledge/commerce-okf/index.md. Regenerate with npm run knowledge:export-okf. See OKF_EXPORT.md for coverage and import limits.

### In-app Library
Signed-in users can open **Library** to search and read all 207 built-in OKF concepts, with category filters, inline screenshots, related concepts, source references, and complete metadata. Workspace OKF concepts follow existing document RLS permissions. Built-in articles do not consume upload quota. Uploaded image attachments are not yet supported.


### Conversation behavior checks

The Coach resolves short follow-ups before searching documentation, reviews the answer for coverage and grounding, and selects current-step images separately. Numeric replies retain the conversation language. The Coach provides documented guidance; it cannot inspect live merchant orders or approval status.

Run `npm run coach:eval:conversations` to list the synthetic scenarios without calling a provider. Run `npm run coach:eval:conversations -- --live --output /tmp/coach-conversations.json` for live OpenRouter checks. Optional flags: `--provider gemini` or `--case variants-current-step`. Live runs incur provider usage and use synthetic questions with a dummy order ID. Reports include answers, image IDs, elapsed time, and heuristic failures for human review. They do not guarantee semantic accuracy. `npm run verify` includes offline pipeline and evaluation-regression tests.

`COACH_REVIEW_MODEL` optionally selects the OpenRouter model used for request understanding, answer review, and image review. It defaults to `google/gemini-2.5-flash`, matching the existing provider model. A different reviewer model can change latency and usage cost; compare with the synthetic suite before deploying it. Gemini direct generation continues to use its configured model.
