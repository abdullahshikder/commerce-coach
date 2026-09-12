---
type: Product Knowledge
title: Order Cancellation
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.7
tags:
  - orders
  - cancel order
  - order cancellation
  - refund
  - void order
product_status: live
description: Can I cancel an order?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: order-007
  feature: Order Cancellation
  domain: orders
  keywords:
    - cancel order
    - order cancellation
    - refund
    - void order
  question: Can I cancel an order?
  answer: Yes. Orders in Pending or Confirmed status can be cancelled by the merchant. Go to Order Detail → Cancel Order. Select a cancellation reason. If payment was already collected (online payment), a refund is initiated automatically. COD orders are simply marked as cancelled.
  howItWorks:
    - Open order → Cancel Order.
    - Select cancellation reason.
    - Pending/Confirmed orders can be cancelled.
    - "Online payments: refund initiated automatically."
    - "COD: marked as cancelled, no refund needed."
  edgeCases:
    - Shipped orders cannot be cancelled — must be returned after delivery.
    - Refund processing may take 3-5 business days.
  status: live
  source: Product Memo §7.7
---

# Can I cancel an order?

Yes. Orders in Pending or Confirmed status can be cancelled by the merchant. Go to Order Detail → Cancel Order. Select a cancellation reason. If payment was already collected (online payment), a refund is initiated automatically. COD orders are simply marked as cancelled.

Product availability: **live**.

## How it works

- Open order → Cancel Order.
- Select cancellation reason.
- Pending/Confirmed orders can be cancelled.
- Online payments: refund initiated automatically.
- COD: marked as cancelled, no refund needed.

## Edge cases

- Shipped orders cannot be cancelled — must be returned after delivery.
- Refund processing may take 3-5 business days.
