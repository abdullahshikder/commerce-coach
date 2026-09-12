---
type: Playbook
title: Instant Checkout Order Missing from New Orders
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: Product Memo §7.7
tags:
  - orders
  - order missing
  - order not showing
  - order not visible
  - where is order
  - order disappeared
  - find instant checkout order
  - instant check order
  - instant checkout order
  - new order tab
  - new orders
  - processing
source_record: src/coach/workflows/registry.ts
commerce_record:
  id: find-instant-checkout-order
  feature: Instant Checkout Order Missing from New Orders
  domain: orders
  source: Product Memo §7.7
  knowledgeId: trouble-001
  question: A merchant cannot find an Instant Checkout order in New Orders. Where is it?
  answer: Open Orders → Processing. Instant Checkout orders bypass New Orders and appear directly in Processing because no merchant acceptance or Ready to Ship action is required. If the order is not there, clear filters, search by order ID or customer phone number, and confirm that the customer completed checkout.
  keywords:
    - order missing
    - order not showing
    - order not visible
    - where is order
    - order disappeared
    - find instant checkout order
    - instant check order
    - instant checkout order
    - new order tab
    - new orders
    - processing
  steps:
    - Navigate to Orders in the sidebar.
    - Open Processing for Instant Checkout, manual, and chat-created orders.
    - Use New Orders for Online Store, Pathao Shop, and Daraz orders that require action.
    - Clear status, source, and date filters if the expected order is hidden.
    - Search by order ID or customer phone number.
    - Confirm that the customer finished placing the order through the checkout link.
  screenshots:
    - featureId: orders-001
      src: image4.jpg
    - featureId: orders-001
      src: image5.jpg
  translations:
    bn:
      feature: New Orders-এ Instant Checkout অর্ডার দেখা যাচ্ছে না
      question: একজন merchant New Orders-এ Instant Checkout অর্ডার খুঁজে পাচ্ছেন না। অর্ডারটি কোথায়?
      answer: Orders → Processing খুলুন। Instant Checkout অর্ডার New Orders-এ আসে না; এটি সরাসরি Processing-এ দেখা যায়, কারণ এতে merchant acceptance বা Ready to Ship action লাগে না। সেখানে অর্ডারটি না থাকলে filters সরিয়ে দিন, order ID বা customer phone number দিয়ে search করুন এবং customer checkout সম্পন্ন করেছেন কি না নিশ্চিত করুন।
      steps:
        - Sidebar থেকে Orders-এ যান।
        - Instant Checkout, manual এবং chat থেকে তৈরি অর্ডারের জন্য Processing খুলুন।
        - যেসব Online Store, Pathao Shop এবং Daraz অর্ডারে action দরকার, সেগুলোর জন্য New Orders ব্যবহার করুন।
        - অর্ডারটি লুকিয়ে থাকলে status, source এবং date filters সরিয়ে দিন।
        - Order ID বা customer phone number দিয়ে search করুন।
        - Customer checkout link দিয়ে অর্ডারটি সম্পন্ন করেছেন কি না নিশ্চিত করুন।
      screenshotCaptions:
        image4.jpg: New Orders-এ যেসব অর্ডারে action দরকার, সেগুলো দেখুন।
        image5.jpg: Processing-এ accepted, manual এবং Instant Checkout অর্ডারগুলো দেখুন।
  evaluations:
    - id: instant-checkout-order-typo
      query: cant find instant check order in new order tab
      expectedKnowledgeId: trouble-001
      expectedScreenshotIds:
        - image4.jpg
        - image5.jpg
      requiredAnswerPhrases:
        - Orders → Processing
        - bypass New Orders
    - id: instant-checkout-order-correct-spelling
      query: Where is my Instant Checkout order? It is not in New Orders.
      expectedKnowledgeId: trouble-001
      expectedScreenshotIds:
        - image4.jpg
        - image5.jpg
      requiredAnswerPhrases:
        - Orders → Processing
        - bypass New Orders
    - id: instant-checkout-order-bangla
      query: ইনস্ট্যান্ট চেকআউট অর্ডার নিউ অর্ডার্সে পাচ্ছি না
      expectedKnowledgeId: trouble-001
      expectedScreenshotIds:
        - image4.jpg
        - image5.jpg
      requiredAnswerPhrases:
        - Orders → Processing
        - bypass New Orders
  matcher:
    all:
      - - instant checkout
        - instant check
        - ইনস্ট্যান্ট চেকআউট
        - ইনস্ট্যান্ট চেক
      - - order
        - orders
        - অর্ডার
    any:
      - find
      - missing
      - not in
      - new order
      - new orders
      - processing
      - showing
      - tab
      - where
      - পাচ্ছি না
      - খুঁজে পাচ্ছি না
      - দেখাচ্ছে না
      - কোথায়
      - নিউ অর্ডার
      - প্রসেসিং
    none:
      - chat
      - cart
      - conversation
      - চ্যাট
      - কার্ট
      - কনভারসেশন
---

# A merchant cannot find an Instant Checkout order in New Orders. Where is it?

Open Orders → Processing. Instant Checkout orders bypass New Orders and appear directly in Processing because no merchant acceptance or Ready to Ship action is required. If the order is not there, clear filters, search by order ID or customer phone number, and confirm that the customer completed checkout.

## Steps

1. Navigate to Orders in the sidebar.
2. Open Processing for Instant Checkout, manual, and chat-created orders.
3. Use New Orders for Online Store, Pathao Shop, and Daraz orders that require action.
4. Clear status, source, and date filters if the expected order is hidden.
5. Search by order ID or customer phone number.
6. Confirm that the customer finished placing the order through the checkout link.

## Product knowledge

[Instant Checkout Order Missing from New Orders](/knowledge/trouble-001.md)

## Visual guide

![orders-001](/assets/screenshots/image4.jpg)

![orders-001](/assets/screenshots/image5.jpg)

## বাংলা

### একজন merchant New Orders-এ Instant Checkout অর্ডার খুঁজে পাচ্ছেন না। অর্ডারটি কোথায়?

Orders → Processing খুলুন। Instant Checkout অর্ডার New Orders-এ আসে না; এটি সরাসরি Processing-এ দেখা যায়, কারণ এতে merchant acceptance বা Ready to Ship action লাগে না। সেখানে অর্ডারটি না থাকলে filters সরিয়ে দিন, order ID বা customer phone number দিয়ে search করুন এবং customer checkout সম্পন্ন করেছেন কি না নিশ্চিত করুন।

## Steps

1. Sidebar থেকে Orders-এ যান।
2. Instant Checkout, manual এবং chat থেকে তৈরি অর্ডারের জন্য Processing খুলুন।
3. যেসব Online Store, Pathao Shop এবং Daraz অর্ডারে action দরকার, সেগুলোর জন্য New Orders ব্যবহার করুন।
4. অর্ডারটি লুকিয়ে থাকলে status, source এবং date filters সরিয়ে দিন।
5. Order ID বা customer phone number দিয়ে search করুন।
6. Customer checkout link দিয়ে অর্ডারটি সম্পন্ন করেছেন কি না নিশ্চিত করুন।
