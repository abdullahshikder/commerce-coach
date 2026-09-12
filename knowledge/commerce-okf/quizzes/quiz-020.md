---
type: Quiz Question
title: A merchant selects Sender as payer and expects to use POD. What should you tell them?
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.9
tags:
  - delivery
  - medium
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: quiz-020
  type: scenario
  domain: delivery
  difficulty: medium
  question: A merchant selects Sender as payer and expects to use POD. What should you tell them?
  options:
    - POD is available for sender-payer orders
    - Select Receiver as payer if the order needs POD
    - Turn collection off to enable POD
    - POD is available only through the Developer API
  correctAnswer: Select Receiver as payer if the order needs POD
  explanation: POD is tied to the Receiver paying flow. Sender-payer orders use Item Value instead.
  source: Product Memo §7.9
---

# A merchant selects Sender as payer and expects to use POD. What should you tell them?

## Options

- POD is available for sender-payer orders
- Select Receiver as payer if the order needs POD
- Turn collection off to enable POD
- POD is available only through the Developer API

## Correct answer

Select Receiver as payer if the order needs POD

## Explanation

POD is tied to the Receiver paying flow. Sender-payer orders use Item Value instead.
