---
type: Product Knowledge
title: Product Not Visible on Sales Channel
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.4
tags:
  - product
  - product not showing
  - product not visible
  - not appearing on shop
  - product missing from channel
product_status: live
description: A product exists but isn't showing on a sales channel. What do I check?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: trouble-002
  feature: Product Not Visible on Sales Channel
  domain: product
  keywords:
    - product not showing
    - product not visible
    - not appearing on shop
    - product missing from channel
  question: A product exists but isn't showing on a sales channel. What do I check?
  answer: 'Step 1: Verify product status is "Active" (not Draft or Archived). Step 2: Check if the product is assigned to the correct warehouse with stock > 0. Step 3: Verify the product is published to that specific channel (Products > select product > Channels). Step 4: Check if category mapping between Commerce and the channel is correct. Step 5: For Pathao Shop, verify payout method is configured. Step 6: For Online Store, confirm the store is published.'
  howItWorks:
    - Open the product and check Status is "Active".
    - Go to Inventory and verify stock is available in the assigned warehouse.
    - Open the product > Channels tab and confirm the target channel is enabled.
    - "For Pathao Shop: check Account Settings > Payout Method is set."
    - "For Online Store: check Online Stores > the store status is Published."
  edgeCases:
    - Products with 0 stock show as "Out of Stock" but are still visible.
    - Products in Draft status are invisible to all channels.
    - Category mismatch can cause products to appear in wrong sections or not at all.
  status: live
  source: Product Memo §7.4
---

# A product exists but isn't showing on a sales channel. What do I check?

Step 1: Verify product status is "Active" (not Draft or Archived). Step 2: Check if the product is assigned to the correct warehouse with stock > 0. Step 3: Verify the product is published to that specific channel (Products > select product > Channels). Step 4: Check if category mapping between Commerce and the channel is correct. Step 5: For Pathao Shop, verify payout method is configured. Step 6: For Online Store, confirm the store is published.

Product availability: **live**.

## How it works

- Open the product and check Status is "Active".
- Go to Inventory and verify stock is available in the assigned warehouse.
- Open the product > Channels tab and confirm the target channel is enabled.
- For Pathao Shop: check Account Settings > Payout Method is set.
- For Online Store: check Online Stores > the store status is Published.

## Edge cases

- Products with 0 stock show as "Out of Stock" but are still visible.
- Products in Draft status are invisible to all channels.
- Category mismatch can cause products to appear in wrong sections or not at all.
