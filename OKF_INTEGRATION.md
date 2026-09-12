# Open Knowledge Format integration — 2026-09-07

The requested repository's `okf/README.md` identifies GoogleCloudPlatform/open-knowledge-format as the maintained home. This implementation targets its v0.2 document structure; it does not install or run the upstream reference agent.

Sources:
- https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf
- https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md

## Use

Open Knowledge → Import an OKF bundle. Choose a folder to preserve nested concept paths, or select individual Markdown files. Give the bundle a name, import, then select Process pending. The batch shows progress and can stop after the current document. Individual retries remain available. Selecting the same bundle again skips existing paths/content; it does not overwrite them. Remove an existing concept before importing its replacement.

Limits: 50 concepts per workspace, 64 KB per file, up to 52 Markdown files in one import (including optional index/log files), and a 4 MB authenticated request limit. Other folder files are ignored; ZIP archives are not accepted. Import validates every concept before writing and commits atomically. Quota failure rolls back the whole batch. Three processing requests can run per app instance; tenant processing is limited to 60 requests per minute. Browser-driven batches are sequential and do not automatically resume after closing the page.

## Behavior

Concept paths, original Markdown, and extension metadata are retained. Metadata is available in the document list; the admin-only source endpoint returns the original source. Reserved index/log files are skipped. The folder name is stripped once; internal paths are retained. No files are written to disk from uploaded paths, external links are not fetched, and referenced computations are not executed.

Only stable, non-stale concepts participate in retrieval. Draft/deprecated content remains visible to admins. Declared verification is advisory and cannot change application permissions. Original source links and metadata are included in indexed context. This is a bounded consumer profile: YAML aliases are rejected; no claim of exhaustive OKF validator conformance is made.

The existing embedding processor is reused. Without an embedding key, search uses keyword matching. With the configured OpenRouter provider, document vectors and query vectors enable semantic retrieval. No Google Cloud credentials are required simply to import OKF files. Live provider calls were not exercised locally.

## Verification and deployment

Migration 006 adds metadata/path columns and a tenant/bundle/path index without deleting existing records. Run db:migrate on other installations, then build and restart. Local migration applied successfully.

TypeScript, 65 unit tests, and production build pass. Local integration checked all-or-nothing validation, paths, extension metadata, duplicates, reserved files, lifecycle filtering, and authenticated import. Synthetic documents were removed. No users or sessions were created. See scripts/verify-okf.ts.

An editable draft example is in examples/okf. It is not automatically imported. Roll back source/package manifests from /tmp/commerce-coach-before-okf.zip and rebuild if needed; retain metadata columns to avoid losing imported information.
