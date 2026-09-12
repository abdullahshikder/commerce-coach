---
type: Product Knowledge
title: Inventory Sync with Channels
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.4
tags:
  - inventory
  - inventory sync
  - channel sync
  - stock sync
  - multi-channel inventory
product_status: live
description: Does inventory sync across sales channels?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: inventory-004
  feature: Inventory Sync with Channels
  domain: inventory
  keywords:
    - inventory sync
    - channel sync
    - stock sync
    - multi-channel inventory
  question: Does inventory sync across sales channels?
  answer: Yes. When stock changes (order, manual adjustment, restock), all connected sales channels are updated in near real-time. This prevents overselling. If a product goes out of stock, it is marked as unavailable on all channels simultaneously.
  howItWorks:
    - Stock change triggers sync to all active channels.
    - Near real-time updates (typically < 30 seconds).
    - Out-of-stock product marked unavailable everywhere.
    - Sync works for Pathao Shop, Online Store, and Daraz.
  edgeCases:
    - Channel sync may have slight delays during high traffic.
    - Manual stock adjustments sync immediately.
  status: live
  source: Product Memo §7.4
---

# Does inventory sync across sales channels?

Yes. When stock changes (order, manual adjustment, restock), all connected sales channels are updated in near real-time. This prevents overselling. If a product goes out of stock, it is marked as unavailable on all channels simultaneously.

Product availability: **live**.

## How it works

- Stock change triggers sync to all active channels.
- Near real-time updates (typically < 30 seconds).
- Out-of-stock product marked unavailable everywhere.
- Sync works for Pathao Shop, Online Store, and Daraz.

## Edge cases

- Channel sync may have slight delays during high traffic.
- Manual stock adjustments sync immediately.
