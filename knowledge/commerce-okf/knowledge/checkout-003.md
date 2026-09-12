---
type: Product Knowledge
title: Checkout Link Order Processing
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.6
tags:
  - checkout
  - checkout order
  - link order
  - instant order
  - checkout process
  - order missing
  - order not showing
  - order not visible
  - where is order
  - order disappeared
  - find instant checkout order
  - instant check order
  - instant checkout order
  - new order tab
  - new orders
  - processing
product_status: live
description: What happens when a customer places an order via a checkout link?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: checkout-003
  feature: Checkout Link Order Processing
  domain: checkout
  keywords:
    - checkout order
    - link order
    - instant order
    - checkout process
    - order missing
    - order not showing
    - order not visible
    - where is order
    - order disappeared
    - find instant checkout order
    - instant check order
    - instant checkout order
    - new order tab
    - new orders
    - processing
  question: What happens when a customer places an order via a checkout link?
  answer: After the customer completes an Instant Checkout order, it appears under Orders → Processing. It bypasses New Orders. No accept or Ready to Ship action required. Directly sent to Pathao Courier.
  howItWorks:
    - Customer completes the shared Instant Checkout link.
    - The order is created in the Commerce Orders dashboard.
    - The order appears first in Processing, not New Orders.
    - No merchant accept or Ready to Ship action is required.
    - The order is sent directly to Pathao Courier.
  edgeCases:
    - If product goes out of stock during checkout, customer sees "Out of Stock" message.
    - Multiple checkout links can be created for the same product.
  status: live
  source: Product Memo §7.6
---

# What happens when a customer places an order via a checkout link?

After the customer completes an Instant Checkout order, it appears under Orders → Processing. It bypasses New Orders. No accept or Ready to Ship action required. Directly sent to Pathao Courier.

Product availability: **live**.

## How it works

- Customer completes the shared Instant Checkout link.
- The order is created in the Commerce Orders dashboard.
- The order appears first in Processing, not New Orders.
- No merchant accept or Ready to Ship action is required.
- The order is sent directly to Pathao Courier.

## Edge cases

- If product goes out of stock during checkout, customer sees "Out of Stock" message.
- Multiple checkout links can be created for the same product.
