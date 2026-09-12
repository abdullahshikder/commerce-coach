---
type: Product Knowledge
title: OTP Login
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.1
tags:
  - signup
  - otp
  - one time password
  - phone login
  - sms verification
product_status: live
description: How does OTP login work?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: signup-004
  feature: OTP Login
  domain: signup
  keywords:
    - otp
    - one time password
    - phone login
    - sms verification
  question: How does OTP login work?
  answer: Merchants enter their registered phone number. A 6-digit OTP is sent via SMS. The OTP expires after 5 minutes. After 3 failed attempts the merchant must wait 60 seconds before retrying. On successful OTP the merchant is authenticated and redirected to the dashboard.
  howItWorks:
    - Enter phone number on login page.
    - System sends 6-digit OTP via SMS.
    - Enter OTP within 5 minutes.
    - After 3 failures, 60-second cooldown.
    - Successful entry → dashboard.
  edgeCases:
    - If SMS is not received, merchant can tap "Resend OTP" after 60 seconds.
    - OTP delivery may be delayed due to carrier issues; advise waiting up to 2 minutes.
  status: live
  source: Product Memo §7.1
---

# How does OTP login work?

Merchants enter their registered phone number. A 6-digit OTP is sent via SMS. The OTP expires after 5 minutes. After 3 failed attempts the merchant must wait 60 seconds before retrying. On successful OTP the merchant is authenticated and redirected to the dashboard.

Product availability: **live**.

## How it works

- Enter phone number on login page.
- System sends 6-digit OTP via SMS.
- Enter OTP within 5 minutes.
- After 3 failures, 60-second cooldown.
- Successful entry → dashboard.

## Edge cases

- If SMS is not received, merchant can tap "Resend OTP" after 60 seconds.
- OTP delivery may be delayed due to carrier issues; advise waiting up to 2 minutes.
