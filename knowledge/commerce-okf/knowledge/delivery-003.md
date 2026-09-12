---
type: Product Knowledge
title: Instant Delivery POD and payer rules
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.9
tags:
  - delivery
  - pod
  - amount to collect
  - receiver pays
  - sender pays
  - bkash
  - collection
product_status: live
description: When is POD available for Instant Delivery?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: delivery-003
  feature: Instant Delivery POD and payer rules
  domain: delivery
  keywords:
    - pod
    - amount to collect
    - receiver pays
    - sender pays
    - bkash
    - collection
  question: When is POD available for Instant Delivery?
  answer: POD is available when the receiver is selected as payer, subject to service conditions. When the sender pays, POD is unavailable and the Item Value field is shown instead.
  howItWorks:
    - Select Receiver as payer to use Amount to Collect.
    - Enter the amount to show the bKash number field.
    - The saved bKash number is reused; a new entry replaces it.
    - Turning collection off hides POD fields and shows Item Value.
    - Selecting Sender as payer shows Item Value without POD.
  edgeCases:
    - The Product Memo does not define an exact POD settlement timeline.
  status: live
  source: Product Memo §7.9
---

# When is POD available for Instant Delivery?

POD is available when the receiver is selected as payer, subject to service conditions. When the sender pays, POD is unavailable and the Item Value field is shown instead.

Product availability: **live**.

## How it works

- Select Receiver as payer to use Amount to Collect.
- Enter the amount to show the bKash number field.
- The saved bKash number is reused; a new entry replaces it.
- Turning collection off hides POD fields and shows Item Value.
- Selecting Sender as payer shows Item Value without POD.

## Edge cases

- The Product Memo does not define an exact POD settlement timeline.
