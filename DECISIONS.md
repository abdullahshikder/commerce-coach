
## 2026-09-08 — Generate all conversational answers

**Chose:** One generated chat path for product help, follow-ups, training, quizzes, and report review, using a shared provider prompt and exact model-selected screenshots.
**Why:** The user explicitly rejected keyword-triggered answers and whole-guide restarts. Documentation/workflow registries remain factual reference data. Persisted quiz/course modes no longer determine replies or scores; quizzes are conversational. Failed generation returns an error, so a configured provider is required for answers.
**Validation:** Client and provider tests use intercepted responses; live model quality requires configured provider credentials.
**Model:** GPT-6 · 2026-09-08

## 2026-09-08 — Review image references for text-only answers

A completed answer without an explicit screenshot selection gets a short AI review using the screenshot catalogue and the answer. This makes relevant UI visuals discoverable without restoring keyword-driven galleries. Explicit selections, including no images, are preserved. The extra model request can add latency; failures preserve the text answer. Model: GPT-6.

## 2026-09-08 — Understand follow-ups and review answers before selecting images

**Chose:** Shared structured request understanding for both providers, focused documentation searches from the resolved request, a full answer review, then a separate compact visual review. The same conversation remains available throughout; generated interpretations never count as product evidence.
**Why:** Raw numeric retrieval loses the task, and filename validity does not establish image relevance. Live evaluation showed that combining evidence review with gallery selection reintroduced feature IDs and broad guides. The compact visual pass receives only conversation, current request, corrected answer, and canonical captions. Drafting no longer requests image tools.
**Tradeoff:** Two additional review/understanding requests relative to the earlier screenshot-only pipeline, with fewer redundant image-tool requests. Failures preserve original conversation-based generation or reviewed text, without unreviewed image candidates. Structured schemas are validated locally, with one bounded correction for invalid image IDs.
**Validation:** Synthetic conversation smoke tests are separate from deterministic provider contract tests; heuristic coverage is not proof of semantic accuracy. OpenRouter structured output format follows its official documentation: https://openrouter.ai/docs/guides/features/structured-outputs.
**Model:** GPT-6 · 2026-09-08.

Image selections reference numbered answer instructions, validated locally. This avoids rejecting Bangla references because the model translated a quote or omitted Markdown. A single transport retry handles timeout/network/temporary server failures; authentication failures are not retried.

`COACH_REVIEW_MODEL` is optional and defaults to the existing OpenRouter model. The proposed GPT-4.1 mini comparison was not run because automatic approval review blocked transmission of internal documentation. Do not infer approval from earlier successful synthetic calls; the specific comparison remains pending.


## 2026-09-08 — Retain the reviewer default after the approved comparison

The user approved the previously blocked synthetic/internal-documentation OpenRouter comparison. GPT-4.1 mini passed 6/8 original checks, equal to the saved Gemini Flash baseline, but had a slower median (19.3 s versus 12.1 s). Manual inspection identified a Pixel architecture inference; the expanded regression gives it 5/8 versus 6/8. Its variant gallery improved, but the order-search reference remained incomplete and one generation failed. This small sample does not support switching the default. No persistent model change was made. Report: /tmp/coach-reviewer-comparison.md. Model/session: GPT-6, 2026-09-08.

## 2026-09-12 — Keep bilingual FAQs as single records linked to visual guides

**Chose:** Store each supplied English/Bangla FAQ pair as one knowledge item, prioritize the Merchant FAQ when it conflicts with older Product Memo text, and connect actionable FAQs to the existing visual-guide IDs.
**Over:** Duplicating each language as separate knowledge records or importing the Markdown only as a passive document.
**Why:** One record prevents language variants from drifting, makes exact Bangla retrieval deterministic, keeps source provenance explicit, and lets the same answer-review pipeline attach only the relevant step-by-step screens. FAQ status wording must remain authoritative where legacy records disagree.
**Model:** GPT-5 · 2026-09-12

## 2026-09-12 — Build admin analytics from anonymous private facts

**Chose:** Capture date, provider, mode, knowledge topic, feedback category, and failure counters in `coach_private`, then expose only tenant aggregates through an admin-only function and API.
**Over:** Granting admins read access to `public.coach_query_logs` or aggregating raw questions in the web process.
**Why:** Operational trends and quality signals do not require query text, answers, or user identities. Keeping those fields out of the analytics facts preserves the existing author-private RLS promise and makes accidental disclosure through the dashboard structurally harder.
**Model:** GPT-5 · 2026-09-12

## 2026-09-12 — Mirror knowledge and capture successful queries in PostgreSQL

**Chose:** Keep TypeScript/OKF as the canonical authored knowledge source, upsert its records into a shared read-only PostgreSQL mirror, and store each successful generated question/answer as a user-owned query row.
**Over:** Moving FAQ authoring entirely into PostgreSQL or relying only on conversation snapshots for query history.
**Why:** The built-in help remains available during database or sync problems, while the database becomes directly queryable and records retrieval provenance. Query rows use forced RLS and omit the full internal retrieval prompt to limit sensitive duplication.
**Model:** GPT-5 · 2026-09-12

## 2026-09-13 — Derive richer analytics from anonymous daily facts

**Chose:** Extend the admin aggregate with previous-period totals and a grounded-query count, then derive rates, daily averages, active days, and busiest day in the client.
**Over:** Copying query text or user identifiers into new reporting tables, or adding decorative metrics without a defensible denominator.
**Why:** Admins gain comparable adoption, reliability, grounding, and feedback signals while the database continues to expose only tenant-level anonymous facts. The immediately preceding equal-length window is a consistent baseline for every 7/30/90-day view.
**Model:** GPT-5 · 2026-09-13

## 2026-09-13 — Pair official tutorial evidence with visual guides

**Chose:** Review every video in the official Pathao Commerce playlist, store one bilingual task guide per video, and attach each official YouTube URL to the matching screenshot guide and answer export.
**Over:** Inferring steps from video titles, importing raw transcripts, or showing an untraceable image without its relevant tutorial source.
**Why:** Concise authored summaries are searchable and maintainable, while direct source links preserve provenance. A set-level screenshot mapping lets the chat, copied/downloaded PNG, and PDF all carry one deduplicated tutorial reference without duplicating URLs on every image record.
**Model:** GPT-5 · 2026-09-13
