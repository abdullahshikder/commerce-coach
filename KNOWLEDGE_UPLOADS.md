# Admin knowledge uploads

Admins open **Knowledge → Choose a file → Upload draft**. Supported inputs are UTF-8 `.txt`, `.md`, `.csv`, and `.json` files, up to 64 KB each and 50 documents per organization. CSV and JSON are indexed as text; this is not spreadsheet analysis. PDF, Word, scanned images, and cloud imports are not yet supported.

Open **Preview & review**, then select **Generate preview**. The processor splits text into overlapping sections. With `OPENROUTER_API_KEY` configured, previewing sends the draft to the configured provider and shows the model, dimensions, chunk text, vector magnitude, and the first eight vector values. Without a key it previews keyword sections instead. The full preview is held in private staging for 30 minutes, is never searchable, and is removed by the background cleanup. Select **Save embeddings** to promote that exact preview into the document, then submit and publish through the normal review workflow. Generate a new preview after enabling or changing the embedding model.

Uploaded documents supplement the original Commerce playbook. Ready sections are retrieved only for members of the owning organization. Curated workflows and training/quiz flows keep their existing precedence; uploads are used for other questions. With no generation provider, matching excerpts and filenames are returned. Uploading does not fine-tune a model or edit curated workflows.

New and revised documents use the `unprocessed` status until their preview is saved, then become `ready`. Legacy queued, processing, and failed states remain supported while older jobs drain. Each preview provider call has a 15-second timeout and is rate-limited. A revision and content hash prevent an expired or stale preview from overwriting a changed draft. Editing creates another unprocessed draft and removes its previous vectors from retrieval. Remove deletes the source, active vectors, and any pending preview; existing saved answers are retained.

Security: backend admin checks and forced PostgreSQL RLS protect storage and mutations. Owner and organization are derived from the session. Runtime grants prevent changing ownership. Native database quotas, content hashes, upload/process rate limits and body limits bound ingestion. File paths are never accepted; only validated text is stored. Reference excerpts are treated as source data rather than model instructions.

Deployment: run `npm run db:migrate`, build, and restart. Migration 013 adds the private expiring preview store and the `unprocessed` status without changing accounts.

Verification uses the project test suite plus the PostgreSQL security suite to cover preview/apply authorization, tenant isolation, stale-preview rejection, unpublished retrieval isolation, and removal. A live embedding-provider call still requires a configured key.

Google OKF bundle import is now implemented; see OKF_INTEGRATION.md.
