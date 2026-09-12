---
type: Quiz Question
title: A customer placed an order via Instant Checkout, paid online, but the merchant wants to cancel it. The order is in "Processing" status. What should the merchant know?
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.7
tags:
  - orders
  - hard
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: quiz-030
  type: scenario
  domain: orders
  difficulty: hard
  question: A customer placed an order via Instant Checkout, paid online, but the merchant wants to cancel it. The order is in "Processing" status. What should the merchant know?
  options:
    - They can cancel freely since the order hasn't shipped yet
    - They can cancel, but a refund will be initiated automatically since payment was online
    - They cannot cancel orders that have been paid online
    - They need to contact support to cancel
  correctAnswer: They can cancel, but a refund will be initiated automatically since payment was online
  explanation: Orders in Pending or Confirmed status can be cancelled. For online payments, a refund is initiated automatically. COD orders are simply marked as cancelled.
  source: Product Memo §7.7
---

# A customer placed an order via Instant Checkout, paid online, but the merchant wants to cancel it. The order is in "Processing" status. What should the merchant know?

## Options

- They can cancel freely since the order hasn't shipped yet
- They can cancel, but a refund will be initiated automatically since payment was online
- They cannot cancel orders that have been paid online
- They need to contact support to cancel

## Correct answer

They can cancel, but a refund will be initiated automatically since payment was online

## Explanation

Orders in Pending or Confirmed status can be cancelled. For online payments, a refund is initiated automatically. COD orders are simply marked as cancelled.
