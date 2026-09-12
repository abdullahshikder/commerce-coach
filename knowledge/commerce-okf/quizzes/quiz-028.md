---
type: Quiz Question
title: A merchant has 3 warehouses but orders are always assigned to the same warehouse even when it's out of stock of the ordered product. What is happening?
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.2, §7.7
tags:
  - warehouse
  - hard
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: quiz-028
  type: troubleshoot
  domain: warehouse
  difficulty: hard
  question: A merchant has 3 warehouses but orders are always assigned to the same warehouse even when it's out of stock of the ordered product. What is happening?
  options:
    - The system only supports one warehouse per merchant
    - Warehouse auto-assignment is based on nearest warehouse with stock; the other warehouses may not have the product
    - The merchant needs to manually assign warehouses to each order
    - There is a bug in the system
  correctAnswer: Warehouse auto-assignment is based on nearest warehouse with stock; the other warehouses may not have the product
  explanation: The system auto-assigns the nearest warehouse with available stock. If only one warehouse has the product, it will always be assigned there regardless of distance.
  source: Product Memo §7.2, §7.7
---

# A merchant has 3 warehouses but orders are always assigned to the same warehouse even when it's out of stock of the ordered product. What is happening?

## Options

- The system only supports one warehouse per merchant
- Warehouse auto-assignment is based on nearest warehouse with stock; the other warehouses may not have the product
- The merchant needs to manually assign warehouses to each order
- There is a bug in the system

## Correct answer

Warehouse auto-assignment is based on nearest warehouse with stock; the other warehouses may not have the product

## Explanation

The system auto-assigns the nearest warehouse with available stock. If only one warehouse has the product, it will always be assigned there regardless of distance.
