---
type: Quiz Question
title: A merchant sells on both Daraz and Pathao Commerce. An order comes in on Daraz for a product with only 2 units left. What happens to the Pathao Commerce inventory?
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.4, §7.5
tags:
  - channels
  - hard
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: quiz-023
  type: scenario
  domain: channels
  difficulty: hard
  question: A merchant sells on both Daraz and Pathao Commerce. An order comes in on Daraz for a product with only 2 units left. What happens to the Pathao Commerce inventory?
  options:
    - Nothing — inventory is separate for each channel
    - Pathao Commerce inventory is reduced by 2 units in near real-time
    - The merchant must manually update Pathao Commerce stock
    - Only the Daraz stock is reduced
  correctAnswer: Pathao Commerce inventory is reduced by 2 units in near real-time
  explanation: Inventory syncs bidirectionally between Daraz and Pathao Commerce. When a Daraz order is placed, Pathao Commerce stock is updated in near real-time.
  source: Product Memo §7.4, §7.5
---

# A merchant sells on both Daraz and Pathao Commerce. An order comes in on Daraz for a product with only 2 units left. What happens to the Pathao Commerce inventory?

## Options

- Nothing — inventory is separate for each channel
- Pathao Commerce inventory is reduced by 2 units in near real-time
- The merchant must manually update Pathao Commerce stock
- Only the Daraz stock is reduced

## Correct answer

Pathao Commerce inventory is reduced by 2 units in near real-time

## Explanation

Inventory syncs bidirectionally between Daraz and Pathao Commerce. When a Daraz order is placed, Pathao Commerce stock is updated in near real-time.
