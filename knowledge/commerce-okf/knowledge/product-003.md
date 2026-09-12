---
type: Product Knowledge
title: Bulk Product Upload
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.3
tags:
  - product
  - bulk upload
  - csv upload
  - import products
  - batch upload
  - excel upload
product_status: live
description: How do I upload products in bulk?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: product-003
  feature: Bulk Product Upload
  domain: product
  keywords:
    - bulk upload
    - csv upload
    - import products
    - batch upload
    - excel upload
  question: How do I upload products in bulk?
  answer: Navigate to Products → Bulk Upload. Download the CSV template. Fill in product details (name, description, SKU, price, stock, etc.). Upload the CSV. The system validates data and shows any errors. Fix errors and re-upload. Successfully imported products appear in the product list.
  howItWorks:
    - Go to Products → Bulk Upload.
    - Download CSV template.
    - Fill in product data row by row.
    - Upload CSV file.
    - "System validates: required fields, data types, SKU uniqueness."
    - Errors shown in a table; fix and re-upload.
    - Valid rows imported; products created in "Draft" status.
  steps:
    - Navigate to Products → Bulk Upload
    - Download CSV template
    - Fill in product data
    - Upload CSV
    - Review validation results
    - Fix errors if any
    - Confirm import
  edgeCases:
    - CSV must follow the exact template format.
    - Duplicate SKUs will be rejected.
    - Missing required fields cause row-level errors.
    - Images must be URLs (not local file paths) in CSV.
  status: live
  source: Product Memo §7.3
---

# How do I upload products in bulk?

Navigate to Products → Bulk Upload. Download the CSV template. Fill in product details (name, description, SKU, price, stock, etc.). Upload the CSV. The system validates data and shows any errors. Fix errors and re-upload. Successfully imported products appear in the product list.

Product availability: **live**.

## How it works

- Go to Products → Bulk Upload.
- Download CSV template.
- Fill in product data row by row.
- Upload CSV file.
- System validates: required fields, data types, SKU uniqueness.
- Errors shown in a table; fix and re-upload.
- Valid rows imported; products created in "Draft" status.

## Steps

1. Navigate to Products → Bulk Upload
2. Download CSV template
3. Fill in product data
4. Upload CSV
5. Review validation results
6. Fix errors if any
7. Confirm import

## Edge cases

- CSV must follow the exact template format.
- Duplicate SKUs will be rejected.
- Missing required fields cause row-level errors.
- Images must be URLs (not local file paths) in CSV.
