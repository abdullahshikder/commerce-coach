---
type: Product Knowledge
title: Payout Not Released
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.13
tags:
  - finance
  - payout pending
  - payout not released
  - payment missing
  - payout delay
product_status: live
description: A merchant's payout hasn't been released. What should I check before escalating?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: trouble-006
  feature: Payout Not Released
  domain: finance
  keywords:
    - payout pending
    - payout not released
    - payment missing
    - payout delay
  question: A merchant's payout hasn't been released. What should I check before escalating?
  answer: Before escalating, check the Finance page, invoice source, configured payout method, and any Finance-confirmed settlement rules. The Product Memo does not define an exact payout release timeline. If the payment is still unexplained, escalate with the invoice ID and merchant ID.
  howItWorks:
    - Open Finance and find the relevant payment or invoice.
    - Confirm the invoice source and payout method.
    - Check the settlement rule currently confirmed by Finance.
    - Escalate with the invoice ID and merchant ID if the payment remains unexplained.
  edgeCases:
    - Pathao Shop finance data may appear separately from other channel data.
    - Exact payout settlement timing is an open item for Finance and Business confirmation.
  status: live
  source: Product Memo §7.13
---

# A merchant's payout hasn't been released. What should I check before escalating?

Before escalating, check the Finance page, invoice source, configured payout method, and any Finance-confirmed settlement rules. The Product Memo does not define an exact payout release timeline. If the payment is still unexplained, escalate with the invoice ID and merchant ID.

Product availability: **live**.

## How it works

- Open Finance and find the relevant payment or invoice.
- Confirm the invoice source and payout method.
- Check the settlement rule currently confirmed by Finance.
- Escalate with the invoice ID and merchant ID if the payment remains unexplained.

## Edge cases

- Pathao Shop finance data may appear separately from other channel data.
- Exact payout settlement timing is an open item for Finance and Business confirmation.
