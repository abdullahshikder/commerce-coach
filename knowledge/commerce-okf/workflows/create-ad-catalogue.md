---
type: Playbook
title: Online Store Ad Catalogue
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.10
tags:
  - store
  - ad catalogue
  - ad catalog
  - add catalogue
  - add catalog
  - ad catelogue
  - create catalogue
  - online stores tab
  - manage website
  - catalog link
  - catalogue link
  - add products
  - select products
  - meta ads
  - meta business manager
source_record: src/coach/workflows/registry.ts
commerce_record:
  id: create-ad-catalogue
  feature: Online Store Ad Catalogue
  domain: store
  source: Product Memo §7.10
  knowledgeId: catalogue-001
  question: How do I create an ad catalogue from my Online Store products?
  answer: Select Online Stores from the left navigation, find the store you want to use, and click "Manage". On the store Edit page, select the Ad Catalogues tab, click "Create Catalogue", enter a name, and use "Add Products" to choose the products to include. Create the catalogue, then copy its generated Catalogue Link for Meta Ads.
  keywords:
    - ad catalogue
    - ad catalog
    - add catalogue
    - add catalog
    - ad catelogue
    - create catalogue
    - online stores tab
    - manage website
    - catalog link
    - catalogue link
    - add products
    - select products
    - meta ads
    - meta business manager
  prerequisites:
    - An Online Store has already been created.
    - The products to advertise already exist in Pathao Commerce.
  steps:
    - Select Online Stores from the left navigation.
    - Find the store you want to use and click "Manage".
    - On the store Edit page, select the Ad Catalogues tab.
    - Click "Create Catalogue" and enter a catalogue name.
    - Click "Add Products", choose the products, review prices, and click "Create Ad catalogue".
    - Copy the generated Catalogue Link and use it in Meta Ads.
  screenshots:
    - featureId: catalogue-001
      src: image30.jpg
    - featureId: catalogue-001
      src: image31.jpg
    - featureId: catalogue-001
      src: image69.jpg
    - featureId: catalogue-001
      src: image26.jpg
  translations:
    bn:
      feature: Online Store Ad Catalogue তৈরি
      question: Online Store-এর products দিয়ে Meta Ads-এর জন্য ad catalogue কীভাবে তৈরি করব?
      answer: বাম পাশের navigation থেকে Online Stores নির্বাচন করুন, যে store ব্যবহার করবেন সেটি খুঁজে "Manage"-এ click করুন। Store Edit page-এ Ad Catalogues tab নির্বাচন করে "Create Catalogue"-এ click করুন, একটি নাম দিন এবং "Add Products" দিয়ে products বেছে নিন। Catalogue তৈরি হলে Meta Ads-এর জন্য generated Catalogue Link copy করুন।
      prerequisites:
        - আগে একটি Online Store তৈরি থাকতে হবে।
        - যে products advertise করবেন, সেগুলো Pathao Commerce-এ আগে থেকে থাকতে হবে।
      steps:
        - বাম পাশের navigation থেকে Online Stores নির্বাচন করুন।
        - যে store ব্যবহার করবেন সেটি খুঁজে "Manage"-এ click করুন।
        - Store Edit page-এ Ad Catalogues tab নির্বাচন করুন।
        - '"Create Catalogue"-এ click করে catalogue-এর নাম লিখুন।'
        - '"Add Products"-এ click করে products বেছে নিন, prices review করুন এবং "Create Ad catalogue"-এ click করুন।'
        - Generated Catalogue Link copy করে Meta Ads-এ ব্যবহার করুন।
      screenshotCaptions:
        image30.jpg: Online Stores খুলে যে store ব্যবহার করবেন, সেটির Manage-এ click করুন।
        image31.jpg: Store Edit page-এ Ad Catalogues tab নির্বাচন করুন।
        image69.jpg: Ad Catalogues tab থেকে Create Catalogue-এ click করুন।
        image26.jpg: Catalogue-এর নাম দিন, products যোগ করুন, prices review করুন এবং Create Ad catalogue-এ click করুন।
  evaluations:
    - id: ad-catalogue-standard
      query: How do I create an ad catalogue from my Online Store products?
      expectedKnowledgeId: catalogue-001
      expectedScreenshotIds:
        - image30.jpg
        - image31.jpg
        - image69.jpg
        - image26.jpg
      requiredAnswerPhrases:
        - Online Stores
        - Manage
        - Ad Catalogues
        - Add Products
        - Catalogue Link
    - id: ad-catalogue-typos
      query: HOW DO I CREATE MY ADD CATELOGUE FOR META ADS
      expectedKnowledgeId: catalogue-001
      expectedScreenshotIds:
        - image30.jpg
        - image31.jpg
        - image69.jpg
        - image26.jpg
      requiredAnswerPhrases:
        - Online Stores
        - Manage
        - Ad Catalogues
        - Add Products
        - Catalogue Link
    - id: ad-catalogue-bangla
      query: মেটা অ্যাডের জন্য ক্যাটালগ কীভাবে তৈরি করব?
      expectedKnowledgeId: catalogue-001
      expectedScreenshotIds:
        - image30.jpg
        - image31.jpg
        - image69.jpg
        - image26.jpg
      requiredAnswerPhrases:
        - Online Stores
        - Manage
        - Ad Catalogues
        - Add Products
        - Catalogue Link
  matcher:
    all:
      - - catalogue
        - catalog
        - catelogue
        - ক্যাটালগ
        - ক্যাটালগটি
      - - ad
        - ads
        - meta
        - অ্যাড
        - মেটা
        - বিজ্ঞাপন
    any:
      - add products
      - create
      - from the start
      - manage website
      - online store
      - products
      - তৈরি
      - কীভাবে
      - কিভাবে
      - অনলাইন স্টোর
      - পণ্য
---

# How do I create an ad catalogue from my Online Store products?

Select Online Stores from the left navigation, find the store you want to use, and click "Manage". On the store Edit page, select the Ad Catalogues tab, click "Create Catalogue", enter a name, and use "Add Products" to choose the products to include. Create the catalogue, then copy its generated Catalogue Link for Meta Ads.

## Prerequisites

- An Online Store has already been created.
- The products to advertise already exist in Pathao Commerce.

## Steps

1. Select Online Stores from the left navigation.
2. Find the store you want to use and click "Manage".
3. On the store Edit page, select the Ad Catalogues tab.
4. Click "Create Catalogue" and enter a catalogue name.
5. Click "Add Products", choose the products, review prices, and click "Create Ad catalogue".
6. Copy the generated Catalogue Link and use it in Meta Ads.

## Product knowledge

[Online Store Ad Catalogue](/knowledge/catalogue-001.md)

## Visual guide

![catalogue-001](/assets/screenshots/image30.jpg)

![catalogue-001](/assets/screenshots/image31.jpg)

![catalogue-001](/assets/screenshots/image69.jpg)

![catalogue-001](/assets/screenshots/image26.jpg)

## বাংলা

### Online Store-এর products দিয়ে Meta Ads-এর জন্য ad catalogue কীভাবে তৈরি করব?

বাম পাশের navigation থেকে Online Stores নির্বাচন করুন, যে store ব্যবহার করবেন সেটি খুঁজে "Manage"-এ click করুন। Store Edit page-এ Ad Catalogues tab নির্বাচন করে "Create Catalogue"-এ click করুন, একটি নাম দিন এবং "Add Products" দিয়ে products বেছে নিন। Catalogue তৈরি হলে Meta Ads-এর জন্য generated Catalogue Link copy করুন।

## পূর্বশর্ত

- আগে একটি Online Store তৈরি থাকতে হবে।
- যে products advertise করবেন, সেগুলো Pathao Commerce-এ আগে থেকে থাকতে হবে।

## Steps

1. বাম পাশের navigation থেকে Online Stores নির্বাচন করুন।
2. যে store ব্যবহার করবেন সেটি খুঁজে "Manage"-এ click করুন।
3. Store Edit page-এ Ad Catalogues tab নির্বাচন করুন।
4. "Create Catalogue"-এ click করে catalogue-এর নাম লিখুন।
5. "Add Products"-এ click করে products বেছে নিন, prices review করুন এবং "Create Ad catalogue"-এ click করুন।
6. Generated Catalogue Link copy করে Meta Ads-এ ব্যবহার করুন।
