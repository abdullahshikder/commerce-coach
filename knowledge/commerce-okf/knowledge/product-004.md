---
type: Product Knowledge
title: Daraz Product Import
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.3
tags:
  - product
  - daraz import
  - import from daraz
  - daraz products
  - import catalog
  - daraz sync
product_status: live
description: Can I import products from my Daraz store?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: product-004
  feature: Daraz Product Import
  domain: product
  keywords:
    - daraz import
    - import from daraz
    - daraz products
    - import catalog
    - daraz sync
  question: Can I import products from my Daraz store?
  answer: Yes. Navigate to Products → Daraz Import. Authenticate your Daraz seller account via OAuth. Select products to import. The system fetches product data (title, description, images, variants, pricing) and creates them in your Pathao Commerce catalog. Inventory can be synced or set manually.
  howItWorks:
    - Go to Products → Daraz Import.
    - Click "Connect Daraz Account".
    - Complete OAuth flow on Daraz seller portal.
    - Select products to import (individual or bulk).
    - System maps Daraz fields to Pathao Commerce fields.
    - Review and confirm import.
  prerequisites:
    - Active Daraz seller account
  edgeCases:
    - Daraz product images are fetched via URL and stored in Pathao CDN.
    - Variant mapping may require manual adjustment after import.
    - Pricing can be imported as-is or adjusted during import.
  status: live
  source: Product Memo §7.3
---

# Can I import products from my Daraz store?

Yes. Navigate to Products → Daraz Import. Authenticate your Daraz seller account via OAuth. Select products to import. The system fetches product data (title, description, images, variants, pricing) and creates them in your Pathao Commerce catalog. Inventory can be synced or set manually.

Product availability: **live**.

## How it works

- Go to Products → Daraz Import.
- Click "Connect Daraz Account".
- Complete OAuth flow on Daraz seller portal.
- Select products to import (individual or bulk).
- System maps Daraz fields to Pathao Commerce fields.
- Review and confirm import.

## Prerequisites

- Active Daraz seller account

## Edge cases

- Daraz product images are fetched via URL and stored in Pathao CDN.
- Variant mapping may require manual adjustment after import.
- Pricing can be imported as-is or adjusted during import.
