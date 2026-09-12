# Security hardening — 2026-09-06

Implemented the five code findings from SECURITY_REVIEW.md.

- Sign-in is a separate public entry bundle. Workspace chunks and documentation images require a ready authenticated session. Production paths are normalized before access checks, including encoded paths. Private assets use no-store. Vite development source routes are also protected; the development launch command binds to loopback.
- PostgreSQL enforces 200 conversations per user and 2,000 per organization using atomic private counters. Existing records are preserved. History requests are limited to 120 reads and 60 writes per minute per user; offsets are bounded. There is no automatic deletion at the quota: an administrator must arrange retention/archiving before further new conversations can be created.
- Password sign-in uses shared PostgreSQL budgets for both IP and organization/email: 20 attempts per 15 minutes. Budgets survive application restarts. TRUSTED_PROXIES accepts explicitly configured proxy IPs/CIDRs; forwarded headers remain untrusted by default.
- Production responses set CSP, frame restrictions, nosniff, referrer and permissions policies. HSTS is enabled with NODE_ENV=production; deployment still requires HTTPS. CSP permits inline styles for existing React styling, but not inline scripts.
- OpenRouter and Gemini calls use 15-second per-call deadlines. A tool-driven answer can require several bounded calls. Live provider calls were not tested because provider credentials are not configured.

## Deployment

Run db:migrate before restarting an upgraded deployment, then npm run build and npm start. Migration 004 is additive, preserves existing conversations, and locks inserts while rebuilding quota counters on repeat deployments. Its migration owner must be able to read all existing records; runtime logins remain restricted by FORCE RLS. Deploy through the supplied backend, not a public static-file host. Previously downloaded documentation cannot be recalled; purge any previous publicly cached assets/CDN copies.

For the existing local installation, scripts/apply-hardening.ts applies only migration 004 using owner configuration in data/admin.env without creating accounts or roles. scripts/verify-hardening.ts tests the changes against the existing database, uses temporary rate keys, and rolls back quota changes. VERIFY_DEV=true additionally checks the running development server.

## Verification

- Initial focused verification passed: public sign-in remains available, workspace/images and encoded paths return 401 without a session, security headers are present, and conversation API access requires authentication.
- Concurrent budget test admitted exactly three of ten requests against a three-request budget.
- Both user and organization quota tests rejected excess inserts; all quota-test changes rolled back.
- Existing authenticated workspace and history loaded in the browser on production and development ports.
- No new users or database roles were created.
- Full original account-creating security integration suite was not rerun.
- npm vulnerability audit remains pending: automatic approval review requires explicit permission to send package names and versions to npm. No dependency CVE clearance is claimed.

See SECURITY_HARDENING.patch for the source diff and ROLLBACK_SECURITY.md for rollback instructions.

Final verification: TypeScript, all 58 unit tests, and production build pass. Reapplying migration 004 and VERIFY_DEV=true focused security verification both pass, including development source access checks.
