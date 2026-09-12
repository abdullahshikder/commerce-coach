---
type: Product Knowledge
title: Multi-Warehouse Merchant Setup
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.2
tags:
  - general
  - multiple warehouses
  - multi warehouse
  - several locations
product_status: live
description: A merchant has multiple warehouses. What should I check before onboarding?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: discovery-005
  feature: Multi-Warehouse Merchant Setup
  domain: general
  keywords:
    - multiple warehouses
    - multi warehouse
    - several locations
  question: A merchant has multiple warehouses. What should I check before onboarding?
  answer: "Before onboarding a multi-warehouse merchant: (1) Confirm each warehouse location and approval status, (2) verify courier mapping covers all locations, (3) check if stock will be split or centralized, (4) ensure the primary warehouse is approved first (secondaries can be pending). Commerce supports per-warehouse stock allocation and transfers between warehouses."
  howItWorks:
    - Primary warehouse is auto-approved during signup.
    - Additional warehouses go through approval — merchant cannot use them until approved.
    - Stock can be allocated per warehouse or per product across warehouses.
    - Stock transfers between warehouses are available from the Inventory page.
    - Courier mapping should cover each warehouse pickup address.
  status: live
  source: Product Memo §7.2
---

# A merchant has multiple warehouses. What should I check before onboarding?

Before onboarding a multi-warehouse merchant: (1) Confirm each warehouse location and approval status, (2) verify courier mapping covers all locations, (3) check if stock will be split or centralized, (4) ensure the primary warehouse is approved first (secondaries can be pending). Commerce supports per-warehouse stock allocation and transfers between warehouses.

Product availability: **live**.

## How it works

- Primary warehouse is auto-approved during signup.
- Additional warehouses go through approval — merchant cannot use them until approved.
- Stock can be allocated per warehouse or per product across warehouses.
- Stock transfers between warehouses are available from the Inventory page.
- Courier mapping should cover each warehouse pickup address.
