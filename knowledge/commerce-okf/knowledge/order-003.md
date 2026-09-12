---
type: Product Knowledge
title: Order Statuses
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.7
tags:
  - orders
  - order status
  - pending
  - confirmed
  - processing
  - shipped
  - delivered
  - cancelled
product_status: live
description: What are the order statuses?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: order-003
  feature: Order Statuses
  domain: orders
  keywords:
    - order status
    - pending
    - confirmed
    - processing
    - shipped
    - delivered
    - cancelled
  question: What are the order statuses?
  answer: "Order statuses: Pending (new, not yet processed), Confirmed (merchant acknowledged), Processing (being prepared), Shipped (picked up by courier), In Transit (on the way), Delivered (completed), Cancelled (by merchant or customer), Returned (sent back). Statuses update automatically based on courier tracking and merchant actions."
  howItWorks:
    - Pending → Confirmed → Processing → Shipped → In Transit → Delivered.
    - Cancelled can happen at any stage before delivery.
    - Returned occurs after delivery if customer returns.
    - Status updates are triggered by merchant actions and courier tracking.
  edgeCases:
    - Auto-cancellation occurs if order remains Pending for 72 hours.
    - Partial cancellation is not supported — full order cancellation only.
  status: live
  source: Product Memo §7.7
---

# What are the order statuses?

Order statuses: Pending (new, not yet processed), Confirmed (merchant acknowledged), Processing (being prepared), Shipped (picked up by courier), In Transit (on the way), Delivered (completed), Cancelled (by merchant or customer), Returned (sent back). Statuses update automatically based on courier tracking and merchant actions.

Product availability: **live**.

## How it works

- Pending → Confirmed → Processing → Shipped → In Transit → Delivered.
- Cancelled can happen at any stage before delivery.
- Returned occurs after delivery if customer returns.
- Status updates are triggered by merchant actions and courier tracking.

## Edge cases

- Auto-cancellation occurs if order remains Pending for 72 hours.
- Partial cancellation is not supported — full order cancellation only.
