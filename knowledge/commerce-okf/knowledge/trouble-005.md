---
type: Product Knowledge
title: Daraz Import Failed
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.4
tags:
  - product
  - daraz import failed
  - daraz sync error
  - daraz products not importing
product_status: live
description: Daraz products aren't importing. Is this a bug or setup issue?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: trouble-005
  feature: Daraz Import Failed
  domain: product
  keywords:
    - daraz import failed
    - daraz sync error
    - daraz products not importing
  question: Daraz products aren't importing. Is this a bug or setup issue?
  answer: "First check: (1) Is Daraz connected in Connection Hub? (2) Are there unmapped categories? (3) Is the Daraz OAuth token expired? (4) Are there validation errors in the import log? Most import failures are due to expired OAuth tokens (re-authenticate) or unmapped categories (complete manual mapping). If both are fine, escalate to Product team with the import log."
  howItWorks:
    - Check Connection Hub > Daraz status is "Connected".
    - 'If token expired: click "Re-authenticate" and complete OAuth flow.'
    - Check for unmapped categories and complete mapping.
    - Review import log for per-product error messages.
    - "Common errors: category mismatch, missing images, price format issues."
  edgeCases:
    - Daraz products with variants require correct variant attribute mapping.
    - Some Daraz categories have no Commerce equivalent — these must be mapped manually.
    - Re-sync after import to update stock and price changes from Daraz.
  status: live
  source: Product Memo §7.4
---

# Daraz products aren't importing. Is this a bug or setup issue?

First check: (1) Is Daraz connected in Connection Hub? (2) Are there unmapped categories? (3) Is the Daraz OAuth token expired? (4) Are there validation errors in the import log? Most import failures are due to expired OAuth tokens (re-authenticate) or unmapped categories (complete manual mapping). If both are fine, escalate to Product team with the import log.

Product availability: **live**.

## How it works

- Check Connection Hub > Daraz status is "Connected".
- If token expired: click "Re-authenticate" and complete OAuth flow.
- Check for unmapped categories and complete mapping.
- Review import log for per-product error messages.
- Common errors: category mismatch, missing images, price format issues.

## Edge cases

- Daraz products with variants require correct variant attribute mapping.
- Some Daraz categories have no Commerce equivalent — these must be mapped manually.
- Re-sync after import to update stock and price changes from Daraz.
