---
type: Product Knowledge
title: Warehouse Setup During Signup
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.1
tags:
  - signup
  - warehouse setup
  - onboarding wizard
  - first warehouse
  - initial setup
  - onboarding
product_status: live
description: Do I need to set up a warehouse during signup?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: signup-005
  feature: Warehouse Setup During Signup
  domain: signup
  keywords:
    - warehouse setup
    - onboarding wizard
    - first warehouse
    - initial setup
    - onboarding
  question: Do I need to set up a warehouse during signup?
  answer: Yes. During the onboarding wizard merchants are prompted to create at least one warehouse. They must provide warehouse name, address, contact person, and phone. The warehouse is required before products can be added or orders fulfilled.
  howItWorks:
    - Onboarding wizard presents warehouse creation form.
    - "Merchant fills: name, address (with map pin), contact person, phone."
    - Warehouse is created in "pending" status awaiting courier approval.
    - Merchant can skip and add warehouse later, but cannot fulfill orders until at least one warehouse is approved.
  prerequisites:
    - Completed business profile
  edgeCases:
    - Skipping warehouse setup limits dashboard functionality.
    - Warehouse approval is required before courier assignment.
  status: live
  source: Product Memo §7.1
---

# Do I need to set up a warehouse during signup?

Yes. During the onboarding wizard merchants are prompted to create at least one warehouse. They must provide warehouse name, address, contact person, and phone. The warehouse is required before products can be added or orders fulfilled.

Product availability: **live**.

## How it works

- Onboarding wizard presents warehouse creation form.
- Merchant fills: name, address (with map pin), contact person, phone.
- Warehouse is created in "pending" status awaiting courier approval.
- Merchant can skip and add warehouse later, but cannot fulfill orders until at least one warehouse is approved.

## Prerequisites

- Completed business profile

## Edge cases

- Skipping warehouse setup limits dashboard functionality.
- Warehouse approval is required before courier assignment.
