---
type: Product Knowledge
title: Stock History & Audit Log
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.4
tags:
  - inventory
  - stock history
  - audit log
  - inventory history
  - stock change log
  - inventory audit
product_status: live
description: Can I see the history of stock changes?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: inventory-006
  feature: Stock History & Audit Log
  domain: inventory
  keywords:
    - stock history
    - audit log
    - inventory history
    - stock change log
    - inventory audit
  question: Can I see the history of stock changes?
  answer: "Yes. Each product and warehouse has a stock history log. It shows all stock changes with: timestamp, type (manual adjustment, order, transfer, restock), quantity change, and the team member who made the change. Useful for auditing and troubleshooting discrepancies."
  howItWorks:
    - Product detail → Stock History tab.
    - Warehouse detail → Stock History tab.
    - "Shows: timestamp, type, quantity change, user."
    - "Types: manual, order, transfer, restock."
  status: live
  source: Product Memo §7.4
---

# Can I see the history of stock changes?

Yes. Each product and warehouse has a stock history log. It shows all stock changes with: timestamp, type (manual adjustment, order, transfer, restock), quantity change, and the team member who made the change. Useful for auditing and troubleshooting discrepancies.

Product availability: **live**.

## How it works

- Product detail → Stock History tab.
- Warehouse detail → Stock History tab.
- Shows: timestamp, type, quantity change, user.
- Types: manual, order, transfer, restock.
