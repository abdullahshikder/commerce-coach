---
type: Product Knowledge
title: Daraz Import Category Mapping
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.4
tags:
  - product
  - daraz category
  - category mapping
  - daraz import mapping
  - manual mapping
product_status: live
description: Why is a Daraz category asking for manual mapping during import?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: bulk-003
  feature: Daraz Import Category Mapping
  domain: product
  keywords:
    - daraz category
    - category mapping
    - daraz import mapping
    - manual mapping
  question: Why is a Daraz category asking for manual mapping during import?
  answer: Daraz uses its own category tree which may not match Pathao Commerce categories 1:1. When a Daraz category has no direct equivalent, the system prompts for manual mapping. The merchant must select a matching Commerce category for each unmapped Daraz category. Products in unmapped categories will not import until mapping is complete.
  howItWorks:
    - During Daraz import, the system compares Daraz categories to Commerce categories.
    - Direct matches are auto-mapped.
    - Unmatched categories require manual selection from the Commerce category dropdown.
    - Once mapped, the mapping is saved for future imports.
    - Products in unmapped categories are queued until the merchant completes mapping.
  status: live
  source: Product Memo §7.4
---

# Why is a Daraz category asking for manual mapping during import?

Daraz uses its own category tree which may not match Pathao Commerce categories 1:1. When a Daraz category has no direct equivalent, the system prompts for manual mapping. The merchant must select a matching Commerce category for each unmapped Daraz category. Products in unmapped categories will not import until mapping is complete.

Product availability: **live**.

## How it works

- During Daraz import, the system compares Daraz categories to Commerce categories.
- Direct matches are auto-mapped.
- Unmatched categories require manual selection from the Commerce category dropdown.
- Once mapped, the mapping is saved for future imports.
- Products in unmapped categories are queued until the merchant completes mapping.
