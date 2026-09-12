---
type: Product Knowledge
title: Real-time Sync
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.0
tags:
  - signup
  - real time
  - real-time
  - live update
  - instant update
  - auto sync
product_status: live
description: Does the dashboard update in real-time?
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: general-014
  feature: Real-time Sync
  domain: signup
  keywords:
    - real time
    - real-time
    - live update
    - instant update
    - auto sync
  question: Does the dashboard update in real-time?
  answer: Yes. The dashboard uses WebSocket connections for real-time updates. New orders, chat messages, stock changes, and status updates appear instantly without manual refresh. A connection indicator in the top bar shows sync status.
  howItWorks:
    - WebSocket connections for real-time data.
    - New orders, messages, stock changes appear instantly.
    - Connection indicator shows sync status.
    - Auto-reconnect on connection loss.
  status: live
  source: Product Memo §7.0
---

# Does the dashboard update in real-time?

Yes. The dashboard uses WebSocket connections for real-time updates. New orders, chat messages, stock changes, and status updates appear instantly without manual refresh. A connection indicator in the top bar shows sync status.

Product availability: **live**.

## How it works

- WebSocket connections for real-time data.
- New orders, messages, stock changes appear instantly.
- Connection indicator shows sync status.
- Auto-reconnect on connection loss.
