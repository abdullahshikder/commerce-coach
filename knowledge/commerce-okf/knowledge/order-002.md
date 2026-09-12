---
type: Product Knowledge
title: Order Sources
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.7
tags:
  - orders
  - order source
  - order channel
  - online store order
  - pathao shop order
  - daraz order
  - live chat / manual order order
  - instant checkout order
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
description: What are the different order sources?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: order-002
  feature: Order Sources
  domain: orders
  keywords:
    - order source
    - order channel
    - online store order
    - pathao shop order
    - daraz order
    - live chat / manual order order
    - instant checkout order
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
  question: What are the different order sources?
  answer: Orders from every source are unified in the Orders dashboard, but they enter different status tabs. Online Store, Pathao Shop, and Daraz orders start in New Orders. Live Chat / Manual Order, and Instant Checkout orders start in Processing.
  howItWorks:
    - "Online Store: starts in New Orders. Accept or reject, then mark Ready to Ship. Pathao Courier after Ready to Ship."
    - "Pathao Shop: starts in New Orders. Accept or reject, then mark Ready to Ship. Pathao Courier after Ready to Ship."
    - "Daraz: starts in New Orders. Merchant action and status sync as applicable. Daraz handles delivery; Commerce reflects status."
    - "Live Chat / Manual Order: starts in Processing. No accept or Ready to Ship action required. Directly sent to Pathao Courier."
    - "Instant Checkout: starts in Processing. No accept or Ready to Ship action required. Directly sent to Pathao Courier."
  status: live
  source: Product Memo §7.7
---

# What are the different order sources?

Orders from every source are unified in the Orders dashboard, but they enter different status tabs. Online Store, Pathao Shop, and Daraz orders start in New Orders. Live Chat / Manual Order, and Instant Checkout orders start in Processing.

Product availability: **live**.

## How it works

- Online Store: starts in New Orders. Accept or reject, then mark Ready to Ship. Pathao Courier after Ready to Ship.
- Pathao Shop: starts in New Orders. Accept or reject, then mark Ready to Ship. Pathao Courier after Ready to Ship.
- Daraz: starts in New Orders. Merchant action and status sync as applicable. Daraz handles delivery; Commerce reflects status.
- Live Chat / Manual Order: starts in Processing. No accept or Ready to Ship action required. Directly sent to Pathao Courier.
- Instant Checkout: starts in Processing. No accept or Ready to Ship action required. Directly sent to Pathao Courier.
