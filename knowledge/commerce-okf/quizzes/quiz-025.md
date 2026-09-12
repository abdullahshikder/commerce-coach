---
type: Quiz Question
title: When bulk uploading products via CSV, which field is required for each product?
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.3
tags:
  - product
  - hard
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: quiz-025
  type: mcq
  domain: product
  difficulty: hard
  question: When bulk uploading products via CSV, which field is required for each product?
  options:
    - Description
    - SKU
    - Image URL
    - Weight
  correctAnswer: SKU
  explanation: SKU is a required field for each product in bulk upload. It must be unique across all products. Other fields like description, images, and weight have defaults or are optional.
  source: Product Memo §7.3
---

# When bulk uploading products via CSV, which field is required for each product?

## Options

- Description
- SKU
- Image URL
- Weight

## Correct answer

SKU

## Explanation

SKU is a required field for each product in bulk upload. It must be unique across all products. Other fields like description, images, and weight have defaults or are optional.
