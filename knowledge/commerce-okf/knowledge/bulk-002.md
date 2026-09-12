---
type: Product Knowledge
title: Bulk Upload Error Handling
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.4
tags:
  - product
  - upload failed
  - validation error
  - row failed
  - import error
  - csv error
product_status: live
description: Why did some rows fail validation during bulk upload?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: bulk-002
  feature: Bulk Upload Error Handling
  domain: product
  keywords:
    - upload failed
    - validation error
    - row failed
    - import error
    - csv error
  question: Why did some rows fail validation during bulk upload?
  answer: "Common reasons for row failures: (1) Missing required fields (name, SKU, price, stock, category), (2) duplicate SKU within the same upload, (3) price or stock is not a valid number, (4) category name doesn't match any existing category, (5) image URL is broken or unreachable. Fix the failed rows and re-upload only those rows. Successfully imported rows are not affected."
  howItWorks:
    - After upload, review the error report showing failed rows and reasons.
    - Fix only the failed rows — do not re-upload successful ones.
    - "Common fixes: add missing SKU, fix category names, validate image URLs."
    - Re-upload the corrected rows as a new CSV batch.
    - Check Products list to verify all products were created correctly.
  status: live
  source: Product Memo §7.4
---

# Why did some rows fail validation during bulk upload?

Common reasons for row failures: (1) Missing required fields (name, SKU, price, stock, category), (2) duplicate SKU within the same upload, (3) price or stock is not a valid number, (4) category name doesn't match any existing category, (5) image URL is broken or unreachable. Fix the failed rows and re-upload only those rows. Successfully imported rows are not affected.

Product availability: **live**.

## How it works

- After upload, review the error report showing failed rows and reasons.
- Fix only the failed rows — do not re-upload successful ones.
- Common fixes: add missing SKU, fix category names, validate image URLs.
- Re-upload the corrected rows as a new CSV batch.
- Check Products list to verify all products were created correctly.
