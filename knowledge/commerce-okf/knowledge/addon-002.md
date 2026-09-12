---
type: Product Knowledge
title: Daraz Connect (Auth)
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.12
tags:
  - integrations
  - daraz connect
  - daraz auth
  - daraz oauth
  - daraz integration setup
product_status: live
description: How do I connect my Daraz seller account?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: addon-002
  feature: Daraz Connect (Auth)
  domain: integrations
  keywords:
    - daraz connect
    - daraz auth
    - daraz oauth
    - daraz integration setup
  question: How do I connect my Daraz seller account?
  answer: Go to Add-ons → Daraz Connect → Connect. You are redirected to the Daraz seller portal for OAuth authentication. Authorize Pathao Commerce. Once connected, you can import products and sync orders. Re-authentication may be required periodically.
  howItWorks:
    - Go to Add-ons → Daraz Connect.
    - Click "Connect".
    - Redirected to Daraz seller portal.
    - Complete OAuth authorization.
    - Connected — can import products and sync orders.
  prerequisites:
    - Active Daraz seller account
  edgeCases:
    - Daraz OAuth tokens expire periodically; re-auth may be needed.
    - If connection fails, check Daraz seller account status.
  status: live
  source: Product Memo §7.12
---

# How do I connect my Daraz seller account?

Go to Add-ons → Daraz Connect → Connect. You are redirected to the Daraz seller portal for OAuth authentication. Authorize Pathao Commerce. Once connected, you can import products and sync orders. Re-authentication may be required periodically.

Product availability: **live**.

## How it works

- Go to Add-ons → Daraz Connect.
- Click "Connect".
- Redirected to Daraz seller portal.
- Complete OAuth authorization.
- Connected — can import products and sync orders.

## Prerequisites

- Active Daraz seller account

## Edge cases

- Daraz OAuth tokens expire periodically; re-auth may be needed.
- If connection fails, check Daraz seller account status.
