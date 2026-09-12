# Security review — 2026-09-06

Verdict: meaningful baseline protections exist, but this review does not establish production readiness. No authentication bypass or cross-tenant access defect was identified in the inspected code. The original findings below are retained as the audit record. See SECURITY_HARDENING.md for the subsequent fixes and remaining verification limits.

## Findings

1. **Potentially high, depending on documentation sensitivity — documentation is public.** `server/app.ts:56` serves the entire production bundle without authentication. `src/coach/screenshotAssets.ts:1` includes the documentation images in that bundle; the local response engine also imports knowledge text. Thus the sign-in screen does not protect these resources. If this material is internal, serve it through authenticated endpoints and remove it from public bundles. User conversation records still have separate API/RLS protection.
2. **Medium — conversation storage abuse.** `server/routes/conversations.ts:27` allows an authenticated user to create unlimited distinct conversations. The request-size and 200-message limits bound one record, not total storage or request volume. Add per-user/organization quotas and write rate limits; bound expensive history offsets.
3. **Medium — incomplete login throttling.** `server/auth/routes.ts:9,26` keeps IP-only counters in process memory. Multiple instances and restarts do not share counters, and distributed IPs bypass account-level protection. With a reverse proxy and no trust-proxy configuration, users can share one IP bucket and block each other's sign-ins. Configure trusted proxy boundaries explicitly and use shared IP-plus-account throttling.
4. **Medium hardening gap — browser security headers absent.** `server/app.ts` supplies neither a Content-Security-Policy nor frame restrictions, X-Content-Type-Options, or HSTS. No reverse proxy policy is bundled. Add a tested production CSP, frame-ancestors policy and other headers; enable HSTS only on the HTTPS deployment. This is missing defense in depth, not proof of an existing XSS exploit; inspected React rendering did not use dangerous HTML insertion.
5. **Medium availability risk — provider calls have no explicit application deadline.** `server/coach/openrouterService.ts:133` fetches without an AbortSignal timeout. Four delayed requests can occupy the global generation slots in `server/app.ts:45` for the upstream/network wait duration and deny other users AI generation. Add bounded provider deadlines and cleanup on cancellation. No provider keys are currently configured, so this path is inactive locally.

## Existing protections inspected

- Server-side authentication, readiness and role middleware protect application APIs.
- Scrypt password hashing; random session tokens stored as hashes; HttpOnly/SameSite cookies, Secure cookies in production.
- Origin/custom-header checks and per-session CSRF validation for mutations.
- Parameterized SQL; transaction-local session context; forced RLS on conversations and feedback.
- Separate restricted data/auth database pools and startup checks rejecting elevated roles.
- Google flow uses state, browser binding, PKCE, nonce and SDK ID-token verification, with existing-account binding.
- Screenshot names resolve through a local asset map rather than loading arbitrary persisted URLs.
- Docker runs as a non-root user and excludes local environment/data files from the image context.

## Verification and limits

- Reran the 58 unit tests: all passed. These are not the database security integration suite.
- Read the SQL policies and integration test coverage. Did not rerun integration tests because they create a database, database roles, and administrative fixture accounts; prior automatic review rejected temporary account creation. No access changes were made.
- The current sandbox could not reach the local HTTP listener, so response-header findings are based on source/configuration, not a fresh live probe.
- npm audit initially failed due to restricted network access. Automatic approval review then rejected escalation because it would send dependency inventory to npm. Dependency CVE status remains unverified; no alternate disclosure route was used.
- No penetration test, load test, live Google OAuth exchange, or production TLS/proxy audit was performed. The previous 58 passing tests alone must not be described as security clearance.
