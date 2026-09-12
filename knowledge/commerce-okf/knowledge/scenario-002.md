---
type: Product Knowledge
title: Daraz + Multi-Warehouse Large Merchant
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.0
tags:
  - general
  - daraz + warehouses
  - large merchant setup
  - 1000 skus
  - multi channel
product_status: live
description: A merchant has Daraz + 3 warehouses + 1,000 SKUs. Give me the recommended setup.
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: scenario-002
  feature: Daraz + Multi-Warehouse Large Merchant
  domain: general
  keywords:
    - daraz + warehouses
    - large merchant setup
    - 1000 skus
    - multi channel
  question: A merchant has Daraz + 3 warehouses + 1,000 SKUs. Give me the recommended setup.
  answer: "Recommended setup: (1) Sign up and complete business profile. (2) Verify all 3 warehouses are approved (primary auto-approved, secondaries need approval). (3) Map couriers to each warehouse. (4) Use Bulk CSV Upload for 1,000 SKUs — do NOT create products manually. (5) Connect Daraz and complete category mapping. (6) Import Daraz products or sync existing catalog. (7) Set up per-warehouse stock allocation. (8) Enable Low Stock Alerts. (9) Publish to Pathao Shop and Online Store."
  howItWorks:
    - "Step 1-3: Account setup with warehouse verification (1-2 days for approvals)."
    - "Step 4: Bulk upload via CSV (plan 1-2 days for CSV preparation)."
    - "Step 5-6: Daraz integration and import (allow 1 day for category mapping)."
    - "Step 7-8: Inventory configuration (1 day)."
    - "Step 9: Channel publishing (1-2 days for review and go-live)."
  edgeCases:
    - Daraz category mapping may take longer if there are many unique categories.
    - Some Daraz products may need manual image uploads if CDN URLs are broken.
    - Warehouse approvals for secondary locations can take 24-48 hours each.
  status: live
  source: Product Memo §7.0
---

# A merchant has Daraz + 3 warehouses + 1,000 SKUs. Give me the recommended setup.

Recommended setup: (1) Sign up and complete business profile. (2) Verify all 3 warehouses are approved (primary auto-approved, secondaries need approval). (3) Map couriers to each warehouse. (4) Use Bulk CSV Upload for 1,000 SKUs — do NOT create products manually. (5) Connect Daraz and complete category mapping. (6) Import Daraz products or sync existing catalog. (7) Set up per-warehouse stock allocation. (8) Enable Low Stock Alerts. (9) Publish to Pathao Shop and Online Store.

Product availability: **live**.

## How it works

- Step 1-3: Account setup with warehouse verification (1-2 days for approvals).
- Step 4: Bulk upload via CSV (plan 1-2 days for CSV preparation).
- Step 5-6: Daraz integration and import (allow 1 day for category mapping).
- Step 7-8: Inventory configuration (1 day).
- Step 9: Channel publishing (1-2 days for review and go-live).

## Edge cases

- Daraz category mapping may take longer if there are many unique categories.
- Some Daraz products may need manual image uploads if CDN URLs are broken.
- Warehouse approvals for secondary locations can take 24-48 hours each.
