---
type: Product Knowledge
title: Order Processing Workflow
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.7
tags:
  - orders
  - order workflow
  - order process
  - fulfillment workflow
  - order steps
product_status: live
description: What is the standard order processing workflow?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: general-003
  feature: Order Processing Workflow
  domain: orders
  keywords:
    - order workflow
    - order process
    - fulfillment workflow
    - order steps
  question: What is the standard order processing workflow?
  answer: "Standard workflow: Order received (Pending) → Merchant confirms (Confirmed) → Merchant processes/prepares (Processing) → Courier assigned and picked up (Shipped) → In transit → Delivered. Each step can include manual merchant actions and automated status updates from courier tracking."
  howItWorks:
    - 1. Order received → "Pending" status.
    - 2. Merchant confirms → "Confirmed".
    - 3. Merchant prepares → "Processing".
    - 4. Courier assigned → "Shipped".
    - 5. In transit (auto-updated by courier).
    - 6. Delivered (auto or manual confirmation).
  status: live
  source: Product Memo §7.7
---

# What is the standard order processing workflow?

Standard workflow: Order received (Pending) → Merchant confirms (Confirmed) → Merchant processes/prepares (Processing) → Courier assigned and picked up (Shipped) → In transit → Delivered. Each step can include manual merchant actions and automated status updates from courier tracking.

Product availability: **live**.

## How it works

- 1. Order received → "Pending" status.
- 2. Merchant confirms → "Confirmed".
- 3. Merchant prepares → "Processing".
- 4. Courier assigned → "Shipped".
- 5. In transit (auto-updated by courier).
- 6. Delivered (auto or manual confirmation).
