---
type: Product Knowledge
title: Stock Transfer Between Warehouses
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.4
tags:
  - inventory
  - stock transfer
  - transfer stock
  - move inventory
  - warehouse transfer
product_status: live
description: Can I transfer stock between warehouses?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: inventory-003
  feature: Stock Transfer Between Warehouses
  domain: inventory
  keywords:
    - stock transfer
    - transfer stock
    - move inventory
    - warehouse transfer
  question: Can I transfer stock between warehouses?
  answer: Yes. Navigate to Inventory → Stock Transfer. Select source warehouse, destination warehouse, and product. Enter quantity to transfer. Confirm the transfer. Source warehouse stock decreases and destination warehouse stock increases immediately. No courier movement is triggered — this is an inventory-only adjustment.
  howItWorks:
    - Go to Inventory → Stock Transfer.
    - Select source warehouse.
    - Select destination warehouse.
    - Select product and enter quantity.
    - Confirm — stock is moved instantly.
  steps:
    - Navigate to Inventory → Stock Transfer
    - Select source warehouse
    - Select destination warehouse
    - Choose product and quantity
    - Confirm transfer
  edgeCases:
    - Transfer is immediate — no transit period.
    - Cannot transfer more stock than available at source.
    - Transfer creates an audit log entry.
  status: live
  source: Product Memo §7.4
---

# Can I transfer stock between warehouses?

Yes. Navigate to Inventory → Stock Transfer. Select source warehouse, destination warehouse, and product. Enter quantity to transfer. Confirm the transfer. Source warehouse stock decreases and destination warehouse stock increases immediately. No courier movement is triggered — this is an inventory-only adjustment.

Product availability: **live**.

## How it works

- Go to Inventory → Stock Transfer.
- Select source warehouse.
- Select destination warehouse.
- Select product and enter quantity.
- Confirm — stock is moved instantly.

## Steps

1. Navigate to Inventory → Stock Transfer
2. Select source warehouse
3. Select destination warehouse
4. Choose product and quantity
5. Confirm transfer

## Edge cases

- Transfer is immediate — no transit period.
- Cannot transfer more stock than available at source.
- Transfer creates an audit log entry.
