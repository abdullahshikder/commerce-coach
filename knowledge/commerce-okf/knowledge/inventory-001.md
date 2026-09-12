---
type: Product Knowledge
title: Warehouse-Aware Stock Tracking
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.4
tags:
  - inventory
  - inventory
  - stock
  - warehouse stock
  - stock tracking
  - inventory management
product_status: live
description: How does inventory tracking work?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: inventory-001
  feature: Warehouse-Aware Stock Tracking
  domain: inventory
  keywords:
    - inventory
    - stock
    - warehouse stock
    - stock tracking
    - inventory management
  question: How does inventory tracking work?
  answer: Inventory is tracked per warehouse. Each product (or variant) has a stock count for each warehouse. When an order is placed, stock is decremented from the assigned warehouse. Stock can be viewed and updated from the Inventory page or from each warehouse detail page.
  howItWorks:
    - Each product/variant has stock per warehouse.
    - Stock is visible on Inventory page (aggregated) and Warehouse Detail (per-warehouse).
    - Order placement decrements stock from assigned warehouse.
    - Stock can be manually adjusted from inventory or warehouse views.
  steps:
    - Navigate to Inventory or Warehouse Detail
    - View stock levels per product/warehouse
    - Adjust stock manually if needed
    - Stock auto-decrements on order placement
  status: live
  source: Product Memo §7.4
  screenshotIds:
    - inventory-001
---

# How does inventory tracking work?

Inventory is tracked per warehouse. Each product (or variant) has a stock count for each warehouse. When an order is placed, stock is decremented from the assigned warehouse. Stock can be viewed and updated from the Inventory page or from each warehouse detail page.

Product availability: **live**.

## How it works

- Each product/variant has stock per warehouse.
- Stock is visible on Inventory page (aggregated) and Warehouse Detail (per-warehouse).
- Order placement decrements stock from assigned warehouse.
- Stock can be manually adjusted from inventory or warehouse views.

## Steps

1. Navigate to Inventory or Warehouse Detail
2. View stock levels per product/warehouse
3. Adjust stock manually if needed
4. Stock auto-decrements on order placement

## Screenshots

[Inventory management](/visual-guides/inventory-001.md)
