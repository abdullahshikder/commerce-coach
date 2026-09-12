# Authentication / RBAC / PostgreSQL RLS rollback

Restore the pre-authentication source and SQLite database from `/tmp/commerce-coach-before-auth.zip` (a local backup made before changes). Stop the new API first. PostgreSQL migration is separate and never deletes the original `data/coach.db`; retain its PostgreSQL backup if users have added new records. Reinstall dependencies, rebuild, and verify SQLite feedback and Coach workflows. The former shared-token app does not provide the new security boundaries.

## Google SSO

Restore source from `/tmp/commerce-coach-before-google.zip` and restart the app. The Google migration is additive (subject binding, session method, and temporary OAuth state); existing password sign-in data is preserved. Disable Google by removing its three server settings. Recheck password login and RBAC/RLS after rollback; do not delete users or existing feedback.

Conversation storage is additive in migration 003. To roll back the UI/API, restore the prior source and rebuild/restart; leave the new table in place to preserve history. Do not drop conversation data during a code rollback.

UI refresh: restore the frontend files from `/tmp/commerce-coach-before-ui.zip` and rebuild. No database migration is involved.

## Production pipeline
Before-change source archive: /tmp/commerce-coach-before-production.zip. Migration 007 is additive and transactional. Stop the worker before rolling back application code. Do not run older migrations over 007: their old document policies would bypass publication gating. Preserve new tables and publication state, restore source selectively, and keep 007 policies active. Verify authentication, unpublished isolation, and existing conversation access before reopening traffic.

## Generated chat answers — 2026-09-08

Restore the source files listed in `/tmp/commerce-coach-generated-only-before` to their matching project paths, and remove the new shared system prompt and generated-chat tests. This snapshot is local and temporary; no Git repository is present. Run `npm run verify` after restoring. No database, credentials, or deployment changes are involved.

## Conversation understanding and review — rollback

Restore changed files from `/tmp/coach-care-before` after comparing for subsequent user edits. The llmTools baseline was reconstructed by removing only this change's ANSWER_TOOL_DECLARATIONS addition. Remove new requestUnderstanding.ts, answerReview.ts, providerRetry.ts, conversationEvaluation.ts, conversationEvaluation.test.ts, and scripts/evaluate-coach-conversations.ts only if they have no later edits. Re-run `npm run verify` and restart the API watcher if needed. No database, credentials, or schema changes are involved. Full diff: `/tmp/coach-care.diff`.

## Bilingual merchant FAQ integration — rollback

**Revert to:** the knowledge-base state before the 2026-09-12 merchant FAQ import.
**Restore:** remove `src/coach/merchantFaq.ts`, `src/coach/additionalMerchantFaq.ts`, and their tests; undo the FAQ localization/merge changes in `src/coach/knowledgeBase.ts`, `src/coach/embeddings/documents.ts`, and `scripts/export-knowledge-okf.ts`; then regenerate `knowledge/commerce-okf` with `npm run knowledge:export-okf`.
**Re-check after rollback:** run `npm run lint`, `npm test`, and `npm run build`; confirm the built-in library count and an existing visual-guide expansion test still pass. No database, credentials, or deployed state are involved.

## PostgreSQL knowledge mirror and query log — rollback

**Revert to:** the application and migration list before migration 008.
**Restore:** stop new application instances, remove the migration-008 code paths and sync command, and deploy the prior application. Preserve `public.coach_query_logs` before any later decision to drop it; query history is user data. `public.coach_knowledge` is a rebuildable mirror and may remain in place while old code runs.
**Re-check after rollback:** verify sign-in, one generated answer, conversation saving, feedback submission, and built-in lexical retrieval. Do not roll back by deleting query rows or uploaded documents.

## Privacy-safe admin analytics — rollback

**Revert to:** the application and migration list before migration 009.
**Restore:** remove the Analytics navigation/page, `/api/analytics` route, generation-failure recording calls, and migration-009 entry, then deploy the prior application. Leave the private anonymous analytics fact tables and capture triggers in place until their retained counts have been backed up or formally expired; they contain no query or answer text.
**Re-check after rollback:** verify admin Operations and Team access, member Coach generation, feedback submission/review, and that admins still cannot read `public.coach_query_logs` or any `coach_private` table.
