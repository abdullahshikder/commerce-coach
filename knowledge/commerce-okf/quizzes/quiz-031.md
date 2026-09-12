---
type: Quiz Question
title: What happens when you delete an image from the Media Gallery that is linked to an active product?
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.14
tags:
  - media
  - medium
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: quiz-031
  type: mcq
  domain: media
  difficulty: medium
  question: What happens when you delete an image from the Media Gallery that is linked to an active product?
  options:
    - Nothing — the image remains on the product
    - The product image may break as the CDN link becomes unavailable
    - The system prevents deletion of linked images
    - The image is replaced with a placeholder
  correctAnswer: The product image may break as the CDN link becomes unavailable
  explanation: CDN URLs are permanent, but deleting from the Gallery may break the link. Always check if an image is "Used" before deleting.
  source: Product Memo §7.14
---

# What happens when you delete an image from the Media Gallery that is linked to an active product?

## Options

- Nothing — the image remains on the product
- The product image may break as the CDN link becomes unavailable
- The system prevents deletion of linked images
- The image is replaced with a placeholder

## Correct answer

The product image may break as the CDN link becomes unavailable

## Explanation

CDN URLs are permanent, but deleting from the Gallery may break the link. Always check if an image is "Used" before deleting.
