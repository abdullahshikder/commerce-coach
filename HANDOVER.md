# Current handover

- All chat remains generated from documentation/history with no keyword-driven response modes. Request understanding now extracts current step, language, subquestions, supplied details, and focused search queries for both providers.
- Answer review checks per-question evidence, then a compact image review maps canonical filenames to numbered answer instructions. Drafting does not select images. Transport timeouts/temporary server failures get one retry; review failures retain generated text without unreviewed images.
- Offline verification: 108 tests, 10 reference evaluations, type-check/build pass. Synthetic live acceptance: 6/8 passed. Outstanding: numeric order follow-up omitted the Processing reference; variant help included the basic creation image. Full results: /tmp/coach-care-acceptance.json. Do not claim complete semantic accuracy.
- The user explicitly approved the GPT-4.1 mini comparison with synthetic conversations and internal documentation through OpenRouter. It completed: 6/8 original checks, 5/8 after adding a Pixel-inference regression (baseline remains 6/8). Median 19.3 s vs 12.1 s. Default remains google/gemini-2.5-flash; no persistent override. Summary: /tmp/coach-reviewer-comparison.md. The earlier approval block is resolved; do not ask for the same authorization again.
- Rollback snapshot: /tmp/coach-care-before; diff: /tmp/coach-care.diff. No Git repo, credentials or DB changes. See VERIFICATION.md for existing baseline attachment-security-test failure. GPT-6 · 2026-09-08.

- Comparison follow-up added an evaluation-only regression for inferring browser architecture from installation wording. No chat implementation change. `npm test` passes 109/109; results are in /tmp/coach-reviewer-comparison-tests.log.

## 2026-09-09 — screen context foundation
- Optional bounded ScreenContext now travels from all three chat components through the API and both providers' understanding/draft/answer/visual stages. Stale observations are discarded; corrections have priority in instructions.
- Retrieval preserves source review labels; absent/unknown is unverified. No sources newly verified.
- This standalone app has no merchant forms. Parent dashboard has a separate older Coach implementation and is NOT connected yet. See SCREEN-CONTEXT.md for host contract and next integration work.
- Offline contract tests cover both providers, planning failure, expiry, validation, source labels, and client transport. No live-model or real host UI verification this phase.

## 2026-09-12 — bilingual merchant FAQs and visual-guide links
- Added the supplied FAQ source plus 69 runtime knowledge records, then extended it with 44 bilingual Product Memo-backed FAQs covering dashboard navigation, products, inventory, channels, orders, delivery, chats, integrations, media, store analytics, marketing, and finance. FAQ wording takes precedence over conflicting legacy Product Memo records.
- Bangla/English text is included in lexical search, the full model prompt, embedding documents, and OKF export. Exact normalized question matches now outrank common-word fuzzy matches.
- Actionable FAQs reference focused existing visual guides. The OKF library has a dedicated Merchant FAQs category; opening a linked FAQ expands its step screenshots inline. Export now contains 320 concepts (113 FAQs) and 112 screenshots.
- `npm run verify` passes: TypeScript lint, all 123 tests, 10/10 workflow evaluations, and the production build. Browser exercise reached the sign-in page but could not open the authenticated Library because local PostgreSQL on 127.0.0.1:55432 was unavailable.
- `data/coach-embeddings.json` remains intentionally untouched and stale (239 vectors versus the updated sources). Runtime falls back to lexical retrieval. Rebuilding requires explicit approval because it sends FAQ text and screenshot-derived data to OpenRouter.
**Model:** GPT-5 · 2026-09-12

## 2026-09-12 — PostgreSQL knowledge mirror and query capture
- Migration 008 is applied to the local `commerce_coach` database. `public.coach_knowledge` contains 238 active records: 113 merchant FAQs and 125 Product Memo knowledge records. TypeScript/OKF remains the canonical authored source; `npm run db:sync-knowledge` refreshes the SQL mirror.
- Every successful `/api/coach/generate` response is stored in `public.coach_query_logs` with its question, answer, provider, mode, retrieval document IDs, screenshot IDs, organization, and user. The server-issued row ID is reused as the assistant response ID for conversation/feedback linkage.
- Query logs use forced PostgreSQL RLS and are readable only by the author, including against same-tenant reviewers/admins. The knowledge mirror is shared read-only application content; only the migration-owner sync can change it.
- `npm run verify` passes: TypeScript, 126/126 tests, 10/10 workflow evaluations, and production build. The new disposable-PostgreSQL security subtest passes; the suite still has the previously documented unrelated attachment-upload fixture failure. `npm run db:init` passes against the migrated local database.
- The local PostgreSQL cluster was started on `127.0.0.1:55432`. Query-log count is currently zero because no real post-migration Coach generation was issued during verification.
**Model:** GPT-5 · 2026-09-12

## 2026-09-12 — privacy-safe admin analytics
- Admins now have an **Analytics** workspace page with 7/30/90-day query trends, knowledge topics, provider/mode usage, helpful rate, pending feedback, reported-issue categories, and generation-failure reasons.
- Migration 009 stores only anonymous query/feedback facts and daily failure counters in `coach_private`. Query text, answers, and user IDs never enter the analytics tables; the admin API returns live-tenant aggregates only. Members and reviewers receive 403, and existing author-private query-log RLS is unchanged.
- The local migration and startup check pass. `npm run verify` passes with 127/127 tests and 10/10 workflow evaluations. The new disposable-PostgreSQL analytics security subtest passes; the pre-existing attachment-upload fixture remains the suite's only failure.
- Browser verification covered the real admin navigation, zero-data dashboard, privacy notice, totals, trend, breakdown empty states, and corrected date-only labels. The disposable browser-test account/organization was removed and the dev server stopped. No paid provider generation was made.
**Model:** GPT-5 · 2026-09-12

## 2026-09-12 — deployment-readiness verification
- Commit `4606942` is pushed to `origin/main`. Local `npm run verify` passes: TypeScript, 127/127 tests, 10/10 workflow evaluations, and production build. Migration, 238-record knowledge sync, restricted-role startup checks, backup creation, and `pg_restore --list` validation also pass.
- A local-only API/store exercise passed login, lexical FAQ retrieval, conversation persistence, helpful feedback, private query capture, and admin analytics. The resulting dashboard showed one query, one helpful feedback item, one expected provider/mode/topic, and one deliberately induced not-configured failure. All disposable tenant data and the temporary dump were removed; the dev server is stopped.
- `npm run production:check -- --live` separately confirmed configured OpenRouter embedding and generation connectivity using its synthetic probes (reported provider cost about US$0.0288). No retrieved FAQ/document context was sent during the local end-to-end flow.
- GitHub Actions run `34700597391` is red only at `npm run test:security`: PostgreSQL 17 reports ambiguous `a.id` in `public.coach_attachment_quota()` because the PL/pgSQL record variable and `FROM public.coach_actor() a` use the same name. Fix migration 007's alias, then rerun CI before deployment.
- Production HTTPS origins and Google SSO are not configured locally; no staging host is connected. `data/coach-embeddings.json` remains the intentionally stale 239-vector snapshot and requires explicit approval before rebuilding from FAQ/screenshot-derived content.
**Model:** GPT-5 · 2026-09-12

## 2026-09-13 — second local administrator
- A second persistent local administrator, `admin2@coach.local`, now belongs to the `pathao` organization. The account is active and its temporary password has already been changed (`must_change_password=false`). The current plaintext password is not stored in the repository or handover.
**Model:** GPT-5 · 2026-09-13

## 2026-09-13 — richer analytics and official tutorial library
- Migration 010 expands the existing aggregate-only Analytics API with current-versus-previous 7/30/90-day totals and grounded-query counts. The admin view now shows recorded success-event share, knowledge-grounding and helpfulness rates, ratings, pending reviews, a three-series daily chart, active days, average volume, busiest day, and failure comparison. No query text, answers, or user identities were added to analytics facts.
- All 14 videos in the official Pathao Commerce tutorial playlist were reviewed through their captions and, where captions were sparse, the demonstrated UI. `src/coach/tutorialVideos.ts` stores bilingual summaries, exact steps, official YouTube URLs, and matching visual-guide IDs. The OKF Library has a dedicated Tutorial videos category.
- Related screenshots carry deduplicated official tutorial metadata. Chat surfaces show the full official URL as selectable video-caption text. Touch/mobile Share sends the clean PNG file with only the URL; desktop users get separate Copy image and Copy URL controls because macOS Share → Copy adds Chrome's temporary WebShare path. PNG downloads do not rasterize the link, while PDF exports retain a clickable caption URL.
- The local database migration and knowledge sync pass and contain 252 active mirror rows: 113 merchant FAQs and 139 product-knowledge records. `npm run verify` passes with 130/130 tests, 10/10 workflow evaluations, typecheck, and production build. The database-backed analytics/RBAC subtest passes; the full security suite still has only the previously documented migration-007 attachment quota failure.
- `data/coach-embeddings.json` remains the older 239-vector snapshot. No OpenRouter API key is configured in `data/admin.env`, so no paid rebuild was attempted; runtime uses lexical retrieval until a current snapshot is built.
**Model:** GPT-5 · 2026-09-13

## 2026-09-13 — Pathao-only sign-in
- The sign-in form no longer asks for an organization. Password and Google login send no tenant selection, and both server routes resolve the shared `pathao` workspace constant.
- A real local API login without an organization field returned 200 and bound the disposable account to `pathao`; the account, session, and plaintext test password were removed afterward. `npm run verify` passes (127/127 tests and 10/10 evaluations). The PostgreSQL security suite passes all auth/Google/RLS checks and still fails only at the previously documented migration 007 attachment-trigger defect.
- Automated browser inspection was unavailable because the browser request-header policy could not load. The production build and compiled bundle contain no Organization form field or label.
**Model:** GPT-5 · 2026-09-13
