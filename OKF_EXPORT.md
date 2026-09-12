# Existing knowledge converted to OKF

The full export is in knowledge/commerce-okf/index.md. It contains 320 concepts and 112 referenced screenshots, with directory indexes and a conversion log.

| Category | Concepts |
|---|---:|
| Merchant FAQs | 113 |
| Product knowledge | 125 |
| Workflows | 3 |
| Training modules | 8 |
| Quiz questions | 35 |
| Order-source rules | 6 |
| Visual guides | 30 |

Every original record is preserved in commerce_record frontmatter, including workflow translations, matching rules and evaluation examples. Readable bodies expose the main guidance. Product status is stored separately as product_status; document lifecycle is stable. Generated provenance identifies the export process; no human verification is invented.

Run npm run knowledge:export-okf to regenerate from the source registries. The exporter parses every generated concept, asserts that each original record round-trips unchanged through YAML, and checks every bundle-local link target. All checks passed. The source registries continue to drive the existing application; this bundle is their portable OKF representation.

The full export exceeds the current 50-document admin upload quota. It is provided as a complete archive for sharing and tooling; import selected concepts if needed. Existing built-in knowledge does not need to be uploaded again. Screenshot assets are included in the archive but are not ingested by the current Markdown-only OKF importer.

The development server requires authentication for the knowledge directory. The production build does not publish this export as static assets.
