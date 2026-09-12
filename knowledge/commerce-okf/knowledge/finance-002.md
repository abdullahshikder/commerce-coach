---
type: Product Knowledge
title: Payout Tracking
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.13
tags:
  - finance
  - payout
  - settlement
  - payout tracking
  - payment settlement
  - receive payment
product_status: live
description: How do payouts work?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: finance-002
  feature: Payout Tracking
  domain: finance
  keywords:
    - payout
    - settlement
    - payout tracking
    - payment settlement
    - receive payment
  question: How do payouts work?
  answer: Finance shows received payments based on the merchant's configured payout method. The Product Memo does not define an exact settlement or release timeline, so confirm the current policy with Finance before promising a date.
  howItWorks:
    - Confirm that a payout method is configured.
    - Open Finance and locate the relevant payment or invoice.
    - Check the order source and connected channel.
    - Confirm the current settlement policy with Finance if release timing is unclear.
  edgeCases:
    - Payment release can remain blocked when required payout information is missing.
    - Do not promise a release date that Finance has not confirmed.
  status: live
  source: Product Memo §7.13
---

# How do payouts work?

Finance shows received payments based on the merchant's configured payout method. The Product Memo does not define an exact settlement or release timeline, so confirm the current policy with Finance before promising a date.

Product availability: **live**.

## How it works

- Confirm that a payout method is configured.
- Open Finance and locate the relevant payment or invoice.
- Check the order source and connected channel.
- Confirm the current settlement policy with Finance if release timing is unclear.

## Edge cases

- Payment release can remain blocked when required payout information is missing.
- Do not promise a release date that Finance has not confirmed.
