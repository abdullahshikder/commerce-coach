---
type: Product Knowledge
title: Product with Variants
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.3
tags:
  - product
  - variants
  - product variants
  - size
  - color
  - variant options
  - sku variant
product_status: live
description: How do I create a product with variants?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: product-002
  feature: Product with Variants
  domain: product
  keywords:
    - variants
    - product variants
    - size
    - color
    - variant options
    - sku variant
  question: How do I create a product with variants?
  answer: When creating a product, toggle "Has Variants". Define option names (e.g., Size, Color) and their values. The system generates a variant matrix. Each variant gets its own SKU, price, weight, and stock. Up to 3 option types per product and up to 100 variant combinations.
  howItWorks:
    - Toggle "Has Variants" on product creation form.
    - "Add option names: e.g., Size (S, M, L), Color (Red, Blue)."
    - System auto-generates variant combinations.
    - "Each combination gets: SKU, price, weight, stock."
    - Up to 3 option types, up to 100 combinations total.
  edgeCases:
    - Max 3 option types (e.g., Size + Color + Material).
    - Max 100 variant combinations per product.
    - Each variant must have a unique SKU.
  status: live
  source: Product Memo §7.3
---

# How do I create a product with variants?

When creating a product, toggle "Has Variants". Define option names (e.g., Size, Color) and their values. The system generates a variant matrix. Each variant gets its own SKU, price, weight, and stock. Up to 3 option types per product and up to 100 variant combinations.

Product availability: **live**.

## How it works

- Toggle "Has Variants" on product creation form.
- Add option names: e.g., Size (S, M, L), Color (Red, Blue).
- System auto-generates variant combinations.
- Each combination gets: SKU, price, weight, stock.
- Up to 3 option types, up to 100 combinations total.

## Edge cases

- Max 3 option types (e.g., Size + Color + Material).
- Max 100 variant combinations per product.
- Each variant must have a unique SKU.
