# Verification — authentication, RBAC, and RLS (2026-09-06)

- [x] `npm run lint` — TypeScript passed after the authentication/database migration.
- [x] `npm test` — all 58 Coach/legacy-import foundation tests passed.
- [x] `DOTENV_CONFIG_PATH=data/security-test.env npm run test:security` — all 12 tests passed against a disposable real PostgreSQL database. The suite applies migrations twice and removes its database/logins afterward.
- [x] Direct SQL checks — application role cannot access auth tables, create sessions, truncate the feedback table, or disable RLS. Missing/forged session context sees no rows; transaction context does not leak across pool reuse.
- [x] Cross-organization checks — RLS blocks foreign reads, inserts, ownership changes, and reviews; same response IDs from different users remain distinct.
- [x] RBAC checks — members cannot review or administer; reviewers cannot administer; admins can affect only their own organization and cannot remove its last active admin.
- [x] Session checks — HttpOnly/SameSite cookies, hashed stored tokens, CSRF rejection, wrong-origin rejection, mandatory password changes, expiry, logout, and revocation after role/disable/password changes.
- [x] `npm run coach:eval` — all 6 English, typo, and Bangla workflow evaluations passed.
- [x] `npm run build` — production build passed.
- [x] `npm run db:init` — both restricted runtime connections and forced RLS verified.
- [x] Legacy import — 2 original SQLite feedback records imported into `pathao`; SQLite remains untouched for rollback/import.
- [x] `npm run db:backup` with the owner environment — PostgreSQL custom-format backup completed.
- [x] Chrome — sign-in and sign-out worked; member saw no Learning/Team access; authenticated member received the canonical Orders → Processing answer and two screenshots. Admin saw Learning and Team access, including organization-only users, role/access controls, and reset-password fields. No console errors were observed.
- [x] Disposable browser-test organization/accounts were removed; the final app serves the sign-in page on port 4010.
- [x] `docker compose --env-file /tmp/coach-compose-test.env config --quiet` — three-service configuration valid with separate owner/data/auth credentials.
- [ ] Docker container build/run — not tested; local daemon unavailable.
- [ ] Live paid OpenRouter/Gemini generation and embedding rebuild — not run.

Security tests use synthetic accounts. Local first-admin credentials are private and excluded from source/archive output. The ZIP contains schema/migrations and the legacy Coach-only data for import, not PostgreSQL accounts, sessions, credentials, or physical cluster files. `ACCESS_CONTROL.patch` captures this change against the earlier standalone package; `EXTRACTION.patch` is the historical dashboard extraction diff.

- Google integration checks cover state/browser binding, PKCE parameters, callback replay and expiry, nonce and email validation, unknown/wrong-organization/disabled accounts, stable subject binding, temporary-password session behavior, and runtime SQL permissions. Only the external Google token exchange is stubbed. A real Google handshake requires operator-supplied OAuth credentials and was not exercised.

- [x] Conversation API security tests: persistence across sessions, forged ownership ignored, private reads including same-tenant admins, CSRF rejection, invalid payload rejection, immutable ownership, direct RLS enforcement, idempotent retry, and concurrent revision conflict.

- [x] Browser: disposable member sent two questions, received local answers with screenshots, saw Saved status, refreshed and restored a conversation, and retained both chats in history. Checked the signed-in frontend on port 8010 after restarting the backend; the conversation route error is resolved.

- [x] Warehouse spelling regression: exact reported Bengali/Banglish question, alternate spellings, English creation, and negative stock/troubleshooting cases. `npm test`: 58 passed; `coach:eval`: 10/10 passed; lint and build passed.

- [x] Browser verified the exact `অয়ারহাউস কিভাবে bananbo` question returns Bengali warehouse steps, both localized screenshots, high-confidence workflow intent, and Saved status. Temporary test accounts and conversation were removed.

- [x] UI refresh: desktop sign-in/welcome/chat reviewed visually; 390×844 mobile chat and navigation verified; Bengali history filtering and empty-search feedback checked; new-chat and saved conversation controls exercised. 58 tests, TypeScript and production build passed.

- [x] Taste redesign: desktop light/dark and compact dark layout reviewed; drawer and multiline Bengali input checked; production sign-in reviewed. TypeScript, 58 tests, and production build pass. Details and limits: DESIGN_REVIEW.md.

- [x] Security hardening: TypeScript, 58 unit tests, build, protected production/development assets, concurrent PostgreSQL budgets, and rolled-back user/organization quota tests passed. Migration 004 reapplied successfully. npm audit remains approval-blocked.

- [x] Empty states: TypeScript and build pass. Browser verified no matching conversations and Clear search. Added separate loading/error/empty rendering for team access and feedback, and first-use history guidance. Failure and zero-user states reviewed in code; no accounts or data were removed to force these states.

- [x] Admin uploads: 61 unit tests, TypeScript and build pass. Local integration checked keyword/mocked semantic processing, stale-worker protection, source retrieval, unpublished/unauthenticated isolation and removal. Live embedding calls not exercised. See KNOWLEDGE_UPLOADS.md.

- [x] OKF: migration 006 applied; TypeScript, 65 tests, build and local atomic-import/metadata/lifecycle checks pass. Live provider calls remain untested.

- [x] Built-in OKF export: 207 source records round-trip through YAML, all concepts pass parsing, and bundle-local links resolve. 112 referenced screenshots copied. TypeScript checked. See OKF_EXPORT.md.

- [x] Library reader: TypeScript, production build, 65 existing tests and 2 new library tests pass. Browser verified 207 concepts, warehouse search, linked visual guide, and inline screenshot loading. Unauthenticated Library API returns 401.

- Linked built-in visual guides now expand inside the parent Library article. TypeScript and all 3 Library tests pass; warehouse article includes both screenshots without opening the guide.

## Generated chat — 2026-09-08

- [x] `npm run verify` → expected: type-check, unit/integration tests, reference evaluations, and build pass → actual: 84 tests and 10/10 workflow-reference evaluations passed; type-check and production build passed.
- [x] Browser at `http://localhost:8010/` → expected without keys: variant question shows a generation error with no stored guide or screenshots → actual: matched; question and error saved in a separate verification conversation.
- [x] `DOTENV_CONFIG_PATH=data/security-test.env npm run test:security` → expected: authorization suite passes → actual: 11 subtests passed; the attachment-upload subtest returned 500 instead of 201 at `server/security.test.ts:232` (parent also marked failed). Reproduced the identical failure using original files in `/tmp/commerce-coach-generated-only-baseline`, confirming it predates this change.
- [x] Live OpenRouter smoke test after user configured the key and API restart → the browser generated instructions beginning at Has Variants. A combinations follow-up failed once, then succeeded on retry with S/Red, S/Blue, M/Red, M/Blue. A direct provider check also succeeded. This verifies the key and narrow-step responses; the cause of the intermittent failed request remains unconfirmed.

Source diff: `/tmp/commerce-coach-generated-only.diff`. Temporary rollback source: `/tmp/commerce-coach-generated-only-before`.

## Image references — 2026-09-08

- [x] `npm run verify` → 89 tests, 10/10 workflow reference evaluations, type-check, and build passed.
- [x] Live OpenRouter browser test with the original variants question, without requesting images → answer included the attribute/value and generated-combination screenshots. Both images visibly rendered.
- [x] Provider tests cover text-only visual review, explicit selection, no matching images, invalid/duplicate IDs, gallery limit, and preserving the answer if visual review fails.

Visual review adds one model request when the main answer did not select screenshots. Backups: `/tmp/commerce-coach-before-visual-review`; diff: `/tmp/commerce-coach-visual-review.diff`.

## Warehouse image IDs — 2026-09-08

- [x] Live trace of `য়্যারহাউস কীভাবে তৈরি করব?` reproduced `suggest_screenshots({screenshot_ids:["warehouse-001"]})` being rejected but incorrectly treated as reviewed.
- [x] `npm run verify` → 94 tests, 10 reference evaluations, type-check and build passed. Both provider tests recover from invalid feature IDs and preserve deliberate empty selections.
- [x] Browser retest of the exact query returned the warehouse contact/address and approval-status reference cards. The user’s approval follow-up selected only the approval-status reference.

Backup: `/tmp/commerce-coach-before-image-id-fix`; reviewed diff: `/tmp/commerce-coach-image-id-fix.diff`.

## Order follow-up image relevance — 2026-09-08

- [x] Full verification: 96 tests, 10 reference evaluations, type-check and build passed; after final prompt refinements all 19 provider contract tests passed again.
- [x] Both provider regressions replace a valid but unrelated Daraz image and pass complete conversation context to visual review.
- [x] Synthetic live OpenRouter conversation with dummy ID 00000000 replied in English and selected only New Orders (image4.jpg) and Processing (image5.jpg). No browser retest or live Gemini test performed.
- Exact user-data replay was rejected by automatic approval review; successful live checks used synthetic data only.
- Review adds one request for previously explicit selections. Review failure retains text without unreviewed images. Selection remains model-based.

Backup: /tmp/coach-order-before. Reviewed diff: /tmp/coach-order-fix.diff.

## Conversation understanding and answer review — 2026-09-08

- [x] `npm run verify`: 108 tests, 10 reference evaluations, type-check and build pass. Both adapters test understanding, final-answer replacement, grounded image indices, malformed responses, and fallback behavior. Transient retries are bounded and authentication errors do not retry.
- [x] `npm run coach:eval:conversations`: lists eight synthetic scenarios without provider calls.
- [x] Live OpenRouter synthetic acceptance run completed: 6/8 passed. Report: `/tmp/coach-care-acceptance.json`. Earlier runs and manual inspection identified feature-ID confusion, overly broad guides, unsupported Pixel assumptions, and translated quote mismatches; these informed the current architecture.
- [ ] Remaining quality failures: order-ID follow-up omitted image5.jpg; variant answer included image100.jpg. All cases produced text. Passing heuristic checks does not certify every sentence or image.
- [ ] Alternate reviewer comparison (openai/gpt-4.1-mini) was rejected by automatic approval review for sending internal documentation to OpenRouter. Existing model remains default; `COACH_REVIEW_MODEL` override is available but no alternate model was enabled or live-validated.
- [ ] Live Gemini and browser UI checks were not run. The change is in server generation, with the existing UI contract preserved.

Rollback: `/tmp/coach-care-before` and ROLLBACK.md. Reviewed full diff: `/tmp/coach-care.diff`. No DB/schema changes. Two extra stages can add latency/provider cost; model-based semantic accuracy remains imperfect.

## Approved reviewer comparison — 2026-09-08

- [x] User explicitly authorized the previously blocked OpenRouter comparison using synthetic conversations and internal app documentation. A process-local `COACH_REVIEW_MODEL=openai/gpt-4.1-mini` override was used; persistent/default configuration stayed unchanged.
- [x] Eight cases completed: 6/8 original automated checks. Order search omitted image5.jpg; account-access generation failed after transient retries. Variants gallery passed. Median end-to-end time was 19.269 s versus the saved baseline's 12.1175 s.
- [x] Manual inspection caught an unsupported browser-tracking inference in the Pixel answer. Added an evaluation regression; replaying both saved outputs with the same expanded checks gives GPT-4.1 mini 5/8 and baseline 6/8. No provider calls were needed to rescore.
- [x] Targeted evaluation tests: 4/4 passed. `npm test`: 109/109 passed. No new live calls or chat implementation changes were required.

Comparison: /tmp/coach-reviewer-comparison.md. Raw and rescored reports are linked there. One run per model does not establish a general model ranking. The upstream cause of the generation failure was not established. Keep the existing default because this comparison did not demonstrate a sufficient benefit.

## 2026-09-09 — screen context foundation
- [x] `npm run verify`: type-check passed, 118/118 tests passed, 10/10 reference evaluations passed, production build passed.
- [x] Reviewed source changes against /tmp/coach-screen-before; added screenContext to React callback dependencies and both full-page send/retry calls after review.
- [x] Regression coverage: API payload propagation, both providers' draft and review stages, planner outage, expired observations, bounded input, source review labels.
- [ ] Parent dashboard browser integration and live model accuracy: not tested; parent uses a separate implementation and does not supply screen state yet.

## 2026-09-12 — PostgreSQL knowledge and query storage

- [x] `DOTENV_CONFIG_PATH=data/admin.env npm run db:migrate` → expected: additive migration and knowledge upsert succeed → actual: migration 008 applied and the local database reported ready.
- [x] `DOTENV_CONFIG_PATH=data/admin.env npm run db:sync-knowledge` → expected: independently refresh the mirror → actual: synchronized 238 records, including 113 merchant FAQs and 125 Product Memo knowledge records.
- [x] `npm run db:init` → expected: restricted runtime/auth roles and new forced-RLS table pass startup checks → actual: PostgreSQL connection and RLS runtime role verified.
- [x] `npm run verify` → expected: type-check, tests, workflow evaluations, and build pass → actual: 126/126 tests, 10/10 evaluations, TypeScript, and production build passed.
- [x] Disposable PostgreSQL security coverage → expected: shared knowledge is read-only and query logs are author-private → actual: the new subtest passed for member, same-tenant users/reviewer/admin, cross-tenant user, forged ownership, and forbidden deletion. The existing attachment-upload fixture still returned 500 instead of 201 and remains the separately documented baseline failure.
- [ ] Live query row → no paid/provider-backed generation was made solely to populate a test row. The main query table is ready and currently has zero rows; unit and disposable-PostgreSQL tests cover insertion and isolation.

## 2026-09-12 — privacy-safe admin analytics

- [x] `DOTENV_CONFIG_PATH=data/admin.env npm run db:migrate` → expected: install migration 009 and backfill anonymous facts idempotently → actual: local PostgreSQL reported ready on repeated application.
- [x] `npm run verify` → expected: type-check, tests, workflow evaluations, and build pass → actual: 127/127 tests, 10/10 evaluations, TypeScript, and production build passed.
- [x] Disposable PostgreSQL security coverage → expected: only same-tenant admins receive aggregate analytics, while members/reviewers/private-table readers are denied and query text is absent → actual: the analytics subtest passed. The unrelated attachment-upload fixture still returned 500 instead of 201, matching the documented baseline failure.
- [x] `npm run db:init` → expected: application startup requires the analytics function and retains restricted runtime roles → actual: PostgreSQL connection and RLS runtime role verified.
- [x] Chrome at `http://localhost:8010/` → expected: admin navigation and 30-day zero-data dashboard render clearly with privacy disclosure and date-only chart labels → actual: verified visually and through the DOM. The disposable admin organization was removed afterward.
- [ ] Non-zero production-shaped dashboard → not populated solely for the review because that would require a paid provider generation or synthetic persistent data. Trigger counts and tenant aggregation were verified in the disposable PostgreSQL suite.
