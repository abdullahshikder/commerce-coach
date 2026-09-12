---
type: Playbook
title: Warehouse Creation
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.2
tags:
  - warehouse
  - warehouse
  - create warehouse
  - add warehouse
  - ওয়্যারহাউস
  - অয়ারহাউস
  - গুদাম
source_record: src/coach/workflows/registry.ts
commerce_record:
  id: create-warehouse
  feature: Warehouse Creation
  domain: warehouse
  source: Product Memo §7.2
  knowledgeId: warehouse-001
  question: How do I create a warehouse?
  answer: Open Warehouse Management in the sidebar and click "Add Warehouse". Enter the warehouse name, full address, map location, contact person, and phone number, then submit for approval. The new warehouse appears with Pending status.
  keywords:
    - warehouse
    - create warehouse
    - add warehouse
    - ওয়্যারহাউস
    - অয়ারহাউস
    - গুদাম
  steps:
    - Open Warehouse Management from the sidebar.
    - Click "Add Warehouse".
    - Enter the warehouse name, full address, contact person, and phone number.
    - Pin the location on the map.
    - Submit for approval and check the Pending status in the warehouse list.
  screenshots:
    - featureId: warehouse-001
      src: image96.jpg
    - featureId: warehouse-001
      src: image103.jpg
  translations:
    bn:
      feature: ওয়্যারহাউস তৈরি
      question: ওয়্যারহাউস কীভাবে তৈরি করব?
      answer: বাম পাশের মেনু থেকে Warehouse Management খুলে "Add Warehouse" চাপুন। ওয়্যারহাউসের নাম, পূর্ণ ঠিকানা, মানচিত্রে অবস্থান, যোগাযোগের ব্যক্তির নাম ও ফোন নম্বর দিয়ে অনুমোদনের জন্য জমা দিন। নতুন ওয়্যারহাউসটি তালিকায় Pending অবস্থায় দেখা যাবে।
      steps:
        - বাম পাশের মেনু থেকে Warehouse Management খুলুন।
        - '"Add Warehouse" চাপুন।'
        - ওয়্যারহাউসের নাম, পূর্ণ ঠিকানা, যোগাযোগের ব্যক্তির নাম ও ফোন নম্বর লিখুন।
        - মানচিত্রে সঠিক অবস্থান পিন করুন।
        - অনুমোদনের জন্য জমা দিন। তালিকায় ওয়্যারহাউসটির Pending অবস্থা দেখুন।
      screenshotCaptions:
        image96.jpg: ওয়্যারহাউসের যোগাযোগ ও ঠিকানার তথ্য পূরণ করুন।
        image103.jpg: তালিকায় তৈরি করা ওয়্যারহাউস ও অনুমোদনের অবস্থা দেখুন।
  evaluations:
    - id: warehouse-create-1
      query: অয়ারহাউস কিভাবে bananbo
      expectedKnowledgeId: warehouse-001
      expectedScreenshotIds:
        - image96.jpg
        - image103.jpg
      requiredAnswerPhrases:
        - Warehouse Management
        - Add Warehouse
        - Pending
    - id: warehouse-create-2
      query: ওয়্যারহাউস কীভাবে তৈরি করব?
      expectedKnowledgeId: warehouse-001
      expectedScreenshotIds:
        - image96.jpg
        - image103.jpg
      requiredAnswerPhrases:
        - Warehouse Management
        - Add Warehouse
        - Pending
    - id: warehouse-create-3
      query: warehouse kivabe banabo
      expectedKnowledgeId: warehouse-001
      expectedScreenshotIds:
        - image96.jpg
        - image103.jpg
      requiredAnswerPhrases:
        - Warehouse Management
        - Add Warehouse
        - Pending
    - id: warehouse-create-4
      query: How do I add a warehouse?
      expectedKnowledgeId: warehouse-001
      expectedScreenshotIds:
        - image96.jpg
        - image103.jpg
      requiredAnswerPhrases:
        - Warehouse Management
        - Add Warehouse
        - Pending
  matcher:
    all:
      - - warehouse
        - warehouses
        - ওয়্যারহাউস
        - ওয়্যারহাউস
        - ওয়ারহাউস
        - ওয়ারহাউস
        - ওয়্যারহাউজ
        - ওয়ারহাউজ
        - অয়ারহাউস
        - অয়ারহাউস
        - গুদাম
      - - create
        - add
        - setup
        - set up
        - তৈরি
        - বানাবো
        - বানাব
        - খুলব
        - খুলবো
        - banabo
        - bananbo
        - banate
    none:
      - not working
      - cannot
      - failed
      - error
      - delete
      - remove
      - edit
      - transfer
      - stock
      - quiz
      - সমস্যা
      - পাচ্ছি না
      - কাজ করছে না
      - ডিলিট
      - মুছব
      - স্টক
      - কুইজ
---

# How do I create a warehouse?

Open Warehouse Management in the sidebar and click "Add Warehouse". Enter the warehouse name, full address, map location, contact person, and phone number, then submit for approval. The new warehouse appears with Pending status.

## Steps

1. Open Warehouse Management from the sidebar.
2. Click "Add Warehouse".
3. Enter the warehouse name, full address, contact person, and phone number.
4. Pin the location on the map.
5. Submit for approval and check the Pending status in the warehouse list.

## Product knowledge

[Warehouse Creation](/knowledge/warehouse-001.md)

## Visual guide

![warehouse-001](/assets/screenshots/image96.jpg)

![warehouse-001](/assets/screenshots/image103.jpg)

## বাংলা

### ওয়্যারহাউস কীভাবে তৈরি করব?

বাম পাশের মেনু থেকে Warehouse Management খুলে "Add Warehouse" চাপুন। ওয়্যারহাউসের নাম, পূর্ণ ঠিকানা, মানচিত্রে অবস্থান, যোগাযোগের ব্যক্তির নাম ও ফোন নম্বর দিয়ে অনুমোদনের জন্য জমা দিন। নতুন ওয়্যারহাউসটি তালিকায় Pending অবস্থায় দেখা যাবে।

## Steps

1. বাম পাশের মেনু থেকে Warehouse Management খুলুন।
2. "Add Warehouse" চাপুন।
3. ওয়্যারহাউসের নাম, পূর্ণ ঠিকানা, যোগাযোগের ব্যক্তির নাম ও ফোন নম্বর লিখুন।
4. মানচিত্রে সঠিক অবস্থান পিন করুন।
5. অনুমোদনের জন্য জমা দিন। তালিকায় ওয়্যারহাউসটির Pending অবস্থা দেখুন।
