---
type: Product Knowledge
title: CSV Field Reference
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.4
tags:
  - product
  - csv columns
  - csv fields
  - column mapping
  - template columns
  - bulk upload fields
product_status: live
description: What are the CSV columns for bulk product upload?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: bulk-001
  feature: CSV Field Reference
  domain: product
  keywords:
    - csv columns
    - csv fields
    - column mapping
    - template columns
    - bulk upload fields
  question: What are the CSV columns for bulk product upload?
  answer: "Required columns: Product Name*, SKU*, Price*, Stock*, Category*. Optional columns: Compare-at Price, Weight, Description, Variant Options, Image URLs (comma-separated). The first image URL becomes the cover image. Variant products use multiple rows with the same product name but different option values. Max 10 images per product."
  howItWorks:
    - Download template from Products > Bulk Upload > Download Template.
    - Fill in all required fields (marked with *).
    - "For variants: each variant gets its own row with option values."
    - Image URLs must be publicly accessible URLs (not local file paths).
    - Upload the CSV and wait for validation — errors are shown per row.
  status: live
  source: Product Memo §7.4
  screenshotIds:
    - bulk-001
---

# What are the CSV columns for bulk product upload?

Required columns: Product Name*, SKU*, Price*, Stock*, Category*. Optional columns: Compare-at Price, Weight, Description, Variant Options, Image URLs (comma-separated). The first image URL becomes the cover image. Variant products use multiple rows with the same product name but different option values. Max 10 images per product.

Product availability: **live**.

## How it works

- Download template from Products > Bulk Upload > Download Template.
- Fill in all required fields (marked with *).
- For variants: each variant gets its own row with option values.
- Image URLs must be publicly accessible URLs (not local file paths).
- Upload the CSV and wait for validation — errors are shown per row.

## Screenshots

[Bulk product upload](/visual-guides/bulk-001.md)
