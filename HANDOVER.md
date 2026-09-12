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
