---
type: Product Knowledge
title: Instant Checkout Link Generation
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.6
tags:
  - checkout
  - instant checkout
  - checkout link
  - payment link
  - shareable link
  - checkout url
product_status: live
description: What is Instant Checkout?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: checkout-001
  feature: Instant Checkout Link Generation
  domain: checkout
  keywords:
    - instant checkout
    - checkout link
    - payment link
    - shareable link
    - checkout url
  question: What is Instant Checkout?
  answer: Instant Checkout generates a unique, shareable link for a specific product or cart. Merchants share the link via WhatsApp, Facebook Messenger, SMS, or any channel. The customer clicks the link, sees the product/cart, enters delivery info, and places the order. No website or online store needed.
  howItWorks:
    - Merchant selects product(s) and generates a checkout link.
    - System creates a unique URL with product, price, and delivery context.
    - Merchant shares link via any messaging channel.
    - Customer clicks link → sees product page → enters delivery details.
    - Customer places order → order appears in Pathao Commerce dashboard.
  steps:
    - Go to Instant Checkout page
    - Select product(s)
    - Click "Generate Link"
    - Copy the generated link
    - Share via WhatsApp, Messenger, SMS, etc.
    - Customer clicks, fills details, places order
  status: live
  source: Product Memo §7.6
  screenshotIds:
    - checkout-001
---

# What is Instant Checkout?

Instant Checkout generates a unique, shareable link for a specific product or cart. Merchants share the link via WhatsApp, Facebook Messenger, SMS, or any channel. The customer clicks the link, sees the product/cart, enters delivery info, and places the order. No website or online store needed.

Product availability: **live**.

## How it works

- Merchant selects product(s) and generates a checkout link.
- System creates a unique URL with product, price, and delivery context.
- Merchant shares link via any messaging channel.
- Customer clicks link → sees product page → enters delivery details.
- Customer places order → order appears in Pathao Commerce dashboard.

## Steps

1. Go to Instant Checkout page
2. Select product(s)
3. Click "Generate Link"
4. Copy the generated link
5. Share via WhatsApp, Messenger, SMS, etc.
6. Customer clicks, fills details, places order

## Screenshots

[Instant Checkout links](/visual-guides/checkout-001.md)
