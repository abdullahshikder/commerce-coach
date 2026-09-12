---
type: Product Knowledge
title: Bulk Stock Adjustment
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.4
tags:
  - inventory
  - bulk stock
  - bulk adjustment
  - mass update stock
  - bulk inventory update
product_status: live
description: Can I adjust stock for multiple products at once?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: inventory-005
  feature: Bulk Stock Adjustment
  domain: inventory
  keywords:
    - bulk stock
    - bulk adjustment
    - mass update stock
    - bulk inventory update
  question: Can I adjust stock for multiple products at once?
  answer: Yes. Go to Inventory → Bulk Adjust. Upload a CSV with SKU and new stock quantity. The system validates and applies changes. Alternatively, use the bulk action checkboxes on the Inventory page to set stock for selected products.
  howItWorks:
    - Go to Inventory → Bulk Adjust.
    - "Upload CSV: SKU + new quantity."
    - System validates and applies.
    - "Or: select products → bulk action → set stock."
  edgeCases:
    - CSV must use exact SKU format.
    - Stock cannot be set below zero.
  status: live
  source: Product Memo §7.4
---

# Can I adjust stock for multiple products at once?

Yes. Go to Inventory → Bulk Adjust. Upload a CSV with SKU and new stock quantity. The system validates and applies changes. Alternatively, use the bulk action checkboxes on the Inventory page to set stock for selected products.

Product availability: **live**.

## How it works

- Go to Inventory → Bulk Adjust.
- Upload CSV: SKU + new quantity.
- System validates and applies.
- Or: select products → bulk action → set stock.

## Edge cases

- CSV must use exact SKU format.
- Stock cannot be set below zero.
