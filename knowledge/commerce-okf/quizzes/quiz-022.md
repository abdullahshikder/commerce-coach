---
type: Quiz Question
title: A merchant created a checkout link, shared it with a customer, but the customer sees "Product Unavailable". What should the merchant check first?
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.6, §7.3
tags:
  - orders
  - hard
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: quiz-022
  type: troubleshoot
  domain: orders
  difficulty: hard
  question: A merchant created a checkout link, shared it with a customer, but the customer sees "Product Unavailable". What should the merchant check first?
  options:
    - Whether the product is set to "Active" status
    - Whether the product is assigned to the Instant Checkout channel
    - Whether the product has sufficient stock
    - All of the above
  correctAnswer: All of the above
  explanation: 'The merchant should verify: product status is Active, product is assigned to the checkout channel, and stock is available. Any of these could cause the "Unavailable" message.'
  source: Product Memo §7.6, §7.3
---

# A merchant created a checkout link, shared it with a customer, but the customer sees "Product Unavailable". What should the merchant check first?

## Options

- Whether the product is set to "Active" status
- Whether the product is assigned to the Instant Checkout channel
- Whether the product has sufficient stock
- All of the above

## Correct answer

All of the above

## Explanation

The merchant should verify: product status is Active, product is assigned to the checkout channel, and stock is available. Any of these could cause the "Unavailable" message.
