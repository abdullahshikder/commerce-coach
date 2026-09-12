---
type: Product Knowledge
title: Warehouse Approval Pending
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.2
tags:
  - warehouse
  - warehouse pending
  - warehouse not approved
  - warehouse rejected
  - new warehouse pending
product_status: live
description: A merchant created a new warehouse but it's still pending. Why?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: trouble-003
  feature: Warehouse Approval Pending
  domain: warehouse
  keywords:
    - warehouse pending
    - warehouse not approved
    - warehouse rejected
    - new warehouse pending
  question: A merchant created a new warehouse but it's still pending. Why?
  answer: Primary warehouses created during signup are auto-approved. Additional warehouses require manual approval by the Commerce team. The merchant cannot use a pending warehouse for order fulfillment or stock allocation. Typical approval time is 24-48 hours. If pending longer, escalate to the Warehouse Operations team.
  howItWorks:
    - "Primary warehouse: auto-approved on signup."
    - "Secondary warehouses: submitted for review, approval within 24-48 hours."
    - Merchant sees "Pending" status in Warehouses tab.
    - Cannot assign products or fulfill orders from a pending warehouse.
    - "If rejected: merchant receives notification with reason and can re-submit."
  edgeCases:
    - Courier warehouses from Pathao Courier are pre-mapped but may show as "Commerce warehouses".
    - If the wrong warehouse is selected during order creation, stock is deducted from the wrong location.
  status: live
  source: Product Memo §7.2
---

# A merchant created a new warehouse but it's still pending. Why?

Primary warehouses created during signup are auto-approved. Additional warehouses require manual approval by the Commerce team. The merchant cannot use a pending warehouse for order fulfillment or stock allocation. Typical approval time is 24-48 hours. If pending longer, escalate to the Warehouse Operations team.

Product availability: **live**.

## How it works

- Primary warehouse: auto-approved on signup.
- Secondary warehouses: submitted for review, approval within 24-48 hours.
- Merchant sees "Pending" status in Warehouses tab.
- Cannot assign products or fulfill orders from a pending warehouse.
- If rejected: merchant receives notification with reason and can re-submit.

## Edge cases

- Courier warehouses from Pathao Courier are pre-mapped but may show as "Commerce warehouses".
- If the wrong warehouse is selected during order creation, stock is deducted from the wrong location.
