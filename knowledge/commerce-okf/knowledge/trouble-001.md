---
type: Product Knowledge
title: Instant Checkout Order Missing from New Orders
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.7
tags:
  - orders
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
description: A merchant cannot find an Instant Checkout order in New Orders. Where is it?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: trouble-001
  feature: Instant Checkout Order Missing from New Orders
  domain: orders
  keywords:
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
  question: A merchant cannot find an Instant Checkout order in New Orders. Where is it?
  answer: Open Orders → Processing. Instant Checkout orders bypass New Orders and appear directly in Processing because no merchant acceptance or Ready to Ship action is required. If the order is not there, clear filters, search by order ID or customer phone number, and confirm that the customer completed checkout.
  howItWorks:
    - Navigate to Orders in the sidebar.
    - Open Processing for Instant Checkout, manual, and chat-created orders.
    - Use New Orders for Online Store, Pathao Shop, and Daraz orders that require action.
    - Clear status, source, and date filters if the expected order is hidden.
    - Search by order ID or customer phone number.
    - Confirm that the customer finished placing the order through the checkout link.
  edgeCases:
    - Instant Checkout orders do not appear in New Orders by design.
  status: live
  source: Product Memo §7.7
  screenshotIds:
    - orders-001
---

# A merchant cannot find an Instant Checkout order in New Orders. Where is it?

Open Orders → Processing. Instant Checkout orders bypass New Orders and appear directly in Processing because no merchant acceptance or Ready to Ship action is required. If the order is not there, clear filters, search by order ID or customer phone number, and confirm that the customer completed checkout.

Product availability: **live**.

## How it works

- Navigate to Orders in the sidebar.
- Open Processing for Instant Checkout, manual, and chat-created orders.
- Use New Orders for Online Store, Pathao Shop, and Daraz orders that require action.
- Clear status, source, and date filters if the expected order is hidden.
- Search by order ID or customer phone number.
- Confirm that the customer finished placing the order through the checkout link.

## Edge cases

- Instant Checkout orders do not appear in New Orders by design.

## Related workflow

[Instant Checkout Order Missing from New Orders](/workflows/find-instant-checkout-order.md)

## Screenshots

[Order management](/visual-guides/orders-001.md)
