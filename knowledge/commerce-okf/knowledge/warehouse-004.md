---
type: Product Knowledge
title: Warehouse Edit & Delete
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.2
tags:
  - warehouse
  - edit warehouse
  - delete warehouse
  - update warehouse
  - remove warehouse
product_status: live
description: Can I edit or delete a warehouse?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: warehouse-004
  feature: Warehouse Edit & Delete
  domain: warehouse
  keywords:
    - edit warehouse
    - delete warehouse
    - update warehouse
    - remove warehouse
  question: Can I edit or delete a warehouse?
  answer: Yes. Active warehouses can be edited (address, contact, name) but changes may require re-approval if address changes significantly. Warehouses with pending orders cannot be deleted. Inactive warehouses with no orders can be deleted permanently.
  howItWorks:
    - Click warehouse → Edit to modify details.
    - Address changes may trigger re-approval.
    - Delete is only available for warehouses with no pending orders.
  edgeCases:
    - Warehouses with pending orders cannot be deleted.
    - Significant address changes may require courier re-approval.
  status: live
  source: Product Memo §7.2
---

# Can I edit or delete a warehouse?

Yes. Active warehouses can be edited (address, contact, name) but changes may require re-approval if address changes significantly. Warehouses with pending orders cannot be deleted. Inactive warehouses with no orders can be deleted permanently.

Product availability: **live**.

## How it works

- Click warehouse → Edit to modify details.
- Address changes may trigger re-approval.
- Delete is only available for warehouses with no pending orders.

## Edge cases

- Warehouses with pending orders cannot be deleted.
- Significant address changes may require courier re-approval.
