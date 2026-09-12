---
type: Product Knowledge
title: Low Stock Alerts
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.4
tags:
  - inventory
  - low stock
  - out of stock
  - stock alert
  - stock notification
  - reorder
product_status: live
description: How do low stock alerts work?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: inventory-002
  feature: Low Stock Alerts
  domain: inventory
  keywords:
    - low stock
    - out of stock
    - stock alert
    - stock notification
    - reorder
  question: How do low stock alerts work?
  answer: Merchants can set a low-stock threshold per product. When stock falls below the threshold, a low-stock alert is shown on the dashboard and an optional email notification is sent. The Inventory page highlights low-stock items in yellow and out-of-stock items in red.
  howItWorks:
    - "Set low-stock threshold on product detail page (default: 5 units)."
    - Dashboard shows low-stock alert banner.
    - "Inventory page highlights: yellow = low stock, red = out of stock."
    - Optional email notification for low-stock events.
  edgeCases:
    - Default threshold is 5 units if not customized.
    - Alerts reset when stock is replenished above threshold.
  status: live
  source: Product Memo §7.4
---

# How do low stock alerts work?

Merchants can set a low-stock threshold per product. When stock falls below the threshold, a low-stock alert is shown on the dashboard and an optional email notification is sent. The Inventory page highlights low-stock items in yellow and out-of-stock items in red.

Product availability: **live**.

## How it works

- Set low-stock threshold on product detail page (default: 5 units).
- Dashboard shows low-stock alert banner.
- Inventory page highlights: yellow = low stock, red = out of stock.
- Optional email notification for low-stock events.

## Edge cases

- Default threshold is 5 units if not customized.
- Alerts reset when stock is replenished above threshold.
