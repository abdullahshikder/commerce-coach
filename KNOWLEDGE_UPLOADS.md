# Admin knowledge uploads

Admins open **Knowledge → Choose a file → Upload and process**. Supported inputs are UTF-8 `.txt`, `.md`, `.csv`, and `.json` files, up to 64 KB each and 50 documents per organization. CSV and JSON are indexed as text; this is not spreadsheet analysis. PDF, Word, scanned images, and cloud imports are not yet supported.

The processor splits text into overlapping sections. With OPENROUTER_API_KEY configured, it generates and stores vectors using OPENROUTER_EMBEDDING_MODEL and OPENROUTER_EMBEDDING_DIMENSIONS. The upload screen explains that processing sends document content to the configured provider. Without a key it publishes sections for keyword retrieval and labels the document accordingly. Reprocess documents after enabling or changing the embedding model.

Uploaded documents supplement the original Commerce playbook. Ready sections are retrieved only for members of the owning organization. Curated workflows and training/quiz flows keep their existing precedence; uploads are used for other questions. With no generation provider, matching excerpts and filenames are returned. Uploading does not fine-tune a model or edit curated workflows.

Status is persisted as queued, processing, ready, or failed. Processing is requested by the admin and completes within that request; this is not a background queue. Each provider call has a 15-second timeout, with up to three batches per document. Interrupted jobs can be retried after their two-minute lease expires. A token prevents an older attempt from overwriting a newer result. Reprocessing temporarily removes a document from retrieval until it completes. Remove deletes the source and vectors; existing saved answers are retained.

Security: backend admin checks and forced PostgreSQL RLS protect storage and mutations. Owner and organization are derived from the session. Runtime grants prevent changing ownership. Native database quotas, content hashes, upload/process rate limits and body limits bound ingestion. File paths are never accepted; only validated text is stored. Reference excerpts are treated as source data rather than model instructions.

Deployment: run db:migrate, build, and restart. Migration 005 adds document storage and quota counters without changing accounts. Existing local migration was applied through scripts/apply-documents.ts.

Verification: 61 unit tests, TypeScript and production build pass. scripts/verify-documents.ts checked keyword processing, semantic processing with a local mock provider, stale-worker rejection, source-bearing retrieval, unpublished/unauthenticated isolation and removal. Synthetic data was cleaned up; no accounts or sessions were created. A live embedding-provider call has not been exercised because no key is configured. Admin navigation and the initial upload screen were checked in the browser.

Google OKF bundle import is now implemented; see OKF_INTEGRATION.md.
