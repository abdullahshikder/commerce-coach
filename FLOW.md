# Feature flows

## Bilingual merchant FAQ to step-by-step guide

Entry: `src/coach/merchantFaq.ts:MERCHANT_FAQ_ITEMS`
  → `src/coach/additionalMerchantFaq.ts:ADDITIONAL_MERCHANT_FAQ_ITEMS` (extends the supplied set with bilingual, Product Memo-backed FAQs)
  → `src/coach/knowledgeBase.ts:KNOWLEDGE_BASE` (merges the supplied FAQ with existing Product Memo knowledge)
    → `src/coach/knowledgeBase.ts:searchKnowledge` (matches English and Bangla questions/answers)
    → `src/coach/knowledgeBase.ts:buildKnowledgeBasePrompt` (grounds generated answers in both languages and exposes linked guide IDs)
    → `src/coach/embeddings/documents.ts:buildKnowledgeEmbeddingDocuments` (indexes both languages and guide metadata)
  → `scripts/export-knowledge-okf.ts` (exports each FAQ and its linked step-by-step visual guide into the built-in library)
    → `server/coach/library.ts:libraryDetail` (expands linked built-in visual guides when an FAQ is opened)

## PostgreSQL knowledge mirror and query capture

Entry: `scripts/sync-coach-knowledge.ts`
  → `src/coach/knowledgeBase.ts:KNOWLEDGE_BASE` (canonical authored records)
  → `public.coach_knowledge` (upserts the complete searchable record and marks the current mirror active)

Entry: `src/coach/providerClient.ts:generate`
  → `server/app.ts:POST /api/coach/generate` (validates the bounded query metadata and generates an answer)
    → `server/coach/pgQueryStore.ts:save` (stores one successful question/answer row under the authenticated user)
  → `src/coach/responseEngine.ts:processMessageLLM` (uses the stored row ID as the assistant response ID)

## Privacy-safe admin analytics

Entry: successful `public.coach_query_logs` insert
  → `public.coach_query_analytics_capture()` (extracts only date, provider, mode, and matched knowledge domains)
  → `coach_private.analytics_queries` (contains no question, answer, or user ID)

Entry: failed `server/app.ts:POST /api/coach/generate`
  → `server/coach/pgAnalyticsStore.ts:recordGenerationFailure`
  → `public.coach_record_generation_failure()` (increments an organization/day/provider/reason counter)

Entry: admin `src/auth/AnalyticsPanel.tsx`
  → `server/routes/analytics.ts:GET /api/analytics`
  → `public.coach_admin_analytics()` (validates the live admin session and returns tenant-scoped aggregates only)
