---
type: Product Knowledge
title: Product Status & Publishing
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.3
tags:
  - product
  - product status
  - draft
  - active
  - publish product
  - unpublish
  - archive
product_status: live
description: What are the product statuses?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: product-005
  feature: Product Status & Publishing
  domain: product
  keywords:
    - product status
    - draft
    - active
    - publish product
    - unpublish
    - archive
  question: What are the product statuses?
  answer: "Products have three statuses: Draft (not visible on any channel), Active (visible on selected sales channels), and Archived (hidden everywhere, can be restored). Draft is the default on creation. Activate a product to make it available on selected channels."
  howItWorks:
    - "Draft: Product exists but not visible anywhere."
    - "Active: Product is live on selected sales channels."
    - "Archived: Product hidden from all channels; can be restored."
    - Toggle status from product detail page or bulk actions.
  edgeCases:
    - Archiving a product removes it from all active channels.
    - Draft products still consume SKU uniqueness.
    - Activating a product with zero stock is allowed but shows "Out of Stock" to customers.
  status: live
  source: Product Memo §7.3
---

# What are the product statuses?

Products have three statuses: Draft (not visible on any channel), Active (visible on selected sales channels), and Archived (hidden everywhere, can be restored). Draft is the default on creation. Activate a product to make it available on selected channels.

Product availability: **live**.

## How it works

- Draft: Product exists but not visible anywhere.
- Active: Product is live on selected sales channels.
- Archived: Product hidden from all channels; can be restored.
- Toggle status from product detail page or bulk actions.

## Edge cases

- Archiving a product removes it from all active channels.
- Draft products still consume SKU uniqueness.
- Activating a product with zero stock is allowed but shows "Out of Stock" to customers.
