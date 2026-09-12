---
type: Product Knowledge
title: Large Catalog Merchant Setup
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.4
tags:
  - general
  - large catalog
  - many skus
  - 500 skus
  - bulk products
  - big merchant
product_status: live
description: A merchant has 500+ SKUs. What setup should I recommend?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: discovery-004
  feature: Large Catalog Merchant Setup
  domain: general
  keywords:
    - large catalog
    - many skus
    - 500 skus
    - bulk products
    - big merchant
  question: A merchant has 500+ SKUs. What setup should I recommend?
  answer: "For merchants with 500+ SKUs: (1) Use Bulk Product Upload via CSV instead of manual entry, (2) set up warehouse stock tracking from day one, (3) enable Low Stock Alerts, (4) consider Daraz Import if they also sell on Daraz, (5) plan category taxonomy before upload. Do NOT create products one by one — it will take days."
  howItWorks:
    - Download the CSV template from Products > Bulk Upload.
    - "Map columns: name, SKU, price, stock, category, images."
    - Upload in batches of 200-300 products at a time.
    - Verify after upload — check for validation errors in failed rows.
    - Set up warehouse and stock allocation before publishing to channels.
  status: live
  source: Product Memo §7.4
---

# A merchant has 500+ SKUs. What setup should I recommend?

For merchants with 500+ SKUs: (1) Use Bulk Product Upload via CSV instead of manual entry, (2) set up warehouse stock tracking from day one, (3) enable Low Stock Alerts, (4) consider Daraz Import if they also sell on Daraz, (5) plan category taxonomy before upload. Do NOT create products one by one — it will take days.

Product availability: **live**.

## How it works

- Download the CSV template from Products > Bulk Upload.
- Map columns: name, SKU, price, stock, category, images.
- Upload in batches of 200-300 products at a time.
- Verify after upload — check for validation errors in failed rows.
- Set up warehouse and stock allocation before publishing to channels.
