---
type: Product Knowledge
title: Online Store Publishing
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.10
tags:
  - store
  - publish store
  - store live
  - store domain
  - custom domain
  - store url
product_status: live
description: How do I publish my online store?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: store-003
  feature: Online Store Publishing
  domain: store
  keywords:
    - publish store
    - store live
    - store domain
    - custom domain
    - store url
  question: How do I publish my online store?
  answer: 'Click "Publish" in Online Store settings. The store is assigned a default URL: {store-slug}.pathao.shop. Optional: connect a custom domain (CNAME setup required). Store goes live immediately after publishing. Products marked as "Active" and assigned to Online Store channel appear in the store.'
  howItWorks:
    - Click "Publish" in Online Store settings.
    - "Default URL: {store-slug}.pathao.shop."
    - "Optional: connect custom domain via CNAME."
    - Store goes live immediately.
    - Active products assigned to Online Store appear.
  edgeCases:
    - Custom domain requires CNAME record pointing to Pathao.
    - SSL is auto-provisioned for custom domains.
    - Store can be unpublished and republished anytime.
  status: live
  source: Product Memo §7.10
---

# How do I publish my online store?

Click "Publish" in Online Store settings. The store is assigned a default URL: {store-slug}.pathao.shop. Optional: connect a custom domain (CNAME setup required). Store goes live immediately after publishing. Products marked as "Active" and assigned to Online Store channel appear in the store.

Product availability: **live**.

## How it works

- Click "Publish" in Online Store settings.
- Default URL: {store-slug}.pathao.shop.
- Optional: connect custom domain via CNAME.
- Store goes live immediately.
- Active products assigned to Online Store appear.

## Edge cases

- Custom domain requires CNAME record pointing to Pathao.
- SSL is auto-provisioned for custom domains.
- Store can be unpublished and republished anytime.
