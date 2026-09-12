---
type: Product Knowledge
title: Warehouse Approval
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.2
tags:
  - warehouse
  - warehouse approval
  - pending warehouse
  - courier approval
  - approve warehouse
product_status: live
description: What is warehouse approval?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: warehouse-002
  feature: Warehouse Approval
  domain: warehouse
  keywords:
    - warehouse approval
    - pending warehouse
    - courier approval
    - approve warehouse
  question: What is warehouse approval?
  answer: After creating a warehouse it enters "Pending" status. The courier team reviews the address and contact details. Approval typically takes 24–48 hours. Once approved the warehouse status changes to "Active" and can be used for fulfillment. Rejected warehouses receive a reason and can be edited and resubmitted.
  howItWorks:
    - Warehouse created → status "Pending".
    - Courier team reviews address and contact info.
    - Approved → status "Active" (24–48 hours).
    - Rejected → merchant notified with reason; can edit and resubmit.
  edgeCases:
    - If warehouse is rejected, merchant receives notification with rejection reason.
    - Merchant can edit and resubmit rejected warehouses.
    - Warehouse approval time may vary based on location.
  cxNotes:
    - If a merchant asks why their warehouse is pending, explain the 24–48 hour review window.
    - Rejected warehouses can be edited and resubmitted.
  status: live
  source: Product Memo §7.2
---

# What is warehouse approval?

After creating a warehouse it enters "Pending" status. The courier team reviews the address and contact details. Approval typically takes 24–48 hours. Once approved the warehouse status changes to "Active" and can be used for fulfillment. Rejected warehouses receive a reason and can be edited and resubmitted.

Product availability: **live**.

## How it works

- Warehouse created → status "Pending".
- Courier team reviews address and contact info.
- Approved → status "Active" (24–48 hours).
- Rejected → merchant notified with reason; can edit and resubmit.

## Edge cases

- If warehouse is rejected, merchant receives notification with rejection reason.
- Merchant can edit and resubmit rejected warehouses.
- Warehouse approval time may vary based on location.

## Customer experience notes

- If a merchant asks why their warehouse is pending, explain the 24–48 hour review window.
- Rejected warehouses can be edited and resubmitted.
