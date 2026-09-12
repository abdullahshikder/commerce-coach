---
type: Quiz Question
title: Which of the following requires re-authentication periodically?
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.12
tags:
  - integrations
  - hard
source_record: src/coach/knowledgeBase.ts
commerce_record:
  id: quiz-029
  type: mcq
  domain: integrations
  difficulty: hard
  question: Which of the following requires re-authentication periodically?
  options:
    - Pathao Courier connection
    - Daraz Connect integration
    - Online Store publishing
    - Media Gallery uploads
  correctAnswer: Daraz Connect integration
  explanation: Daraz OAuth tokens expire periodically and require re-authentication. Other connections like Pathao Courier are auto-mapped and do not require periodic re-auth.
  source: Product Memo §7.12
---

# Which of the following requires re-authentication periodically?

## Options

- Pathao Courier connection
- Daraz Connect integration
- Online Store publishing
- Media Gallery uploads

## Correct answer

Daraz Connect integration

## Explanation

Daraz OAuth tokens expire periodically and require re-authentication. Other connections like Pathao Courier are auto-mapped and do not require periodic re-auth.
