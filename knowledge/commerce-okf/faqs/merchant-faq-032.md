---
type: Merchant FAQ
title: Why do some orders require Accept and Ready to Ship, while others do not
status: stable
generated:
  by: process:commerce-coach-okf-export
  at: 2026-09-12T09:42:55.374Z
sources:
  - resource: knowledge/sources/pathao-commerce-merchant-faq.md
tags:
  - orders
  - merchant faq
  - faq 32
product_status: live
description: Why do some orders require Accept and Ready to Ship, while others do not?
source_record: src/coach/merchantFaq.ts
commerce_record:
  id: merchant-faq-032
  feature: Why do some orders require Accept and Ready to Ship, while others do not
  domain: orders
  keywords:
    - merchant faq
    - faq 32
  question: Why do some orders require Accept and Ready to Ship, while others do not?
  answer: |-
    The process depends on the order source:

    - Online Store and Pathao Shop: The order first appears under New Orders. You need to Accept it and mark it Ready to Ship.
    - Daraz: Order actions and status may appear in Commerce, but fulfilment is handled through Daraz.
    - Live Chat/manual and Instant Checkout: These orders go directly to Processing and do not require separate Accept or Ready to Ship actions because these are confirmed orders.
  translations:
    bn:
      question: কিছু অর্ডারে Accept এবং Ready to Ship করতে হয়, কিন্তু কিছু অর্ডারে হয় না কেন?
      answer: |-
        এটি নির্ভর করে অর্ডারটি কোন মাধ্যম থেকে এসেছে তার ওপর:

        - অনলাইন স্টোর এবং পাঠাও শপ: অর্ডারটি প্রথমে New Orders এ আসে। আপনাকে এটি Accept করতে হবে এবং Ready to Ship মার্ক করতে হবে।
        - দারাজ: অর্ডারের স্ট্যাটাস এখানে দেখা গেলেও এর ফুলফিলমেন্ট বা ডেলিভারি দারাজের নিজস্ব প্রসেসেই সম্পন্ন হয়।
        - লাইভ চ্যাট/ম্যানুয়াল এবং ইনস্ট্যান্ট চেকআউট: এগুলো যেহেতু সরাসরি মার্চেন্ট বা কাস্টমার দ্বারা নিশ্চিত করা অর্ডার, তাই এগুলো সরাসরি Processing সেকশনে চলে যায় এবং আলাদা অ্যাকশনের প্রয়োজন হয় না।
  status: live
  source: knowledge/sources/pathao-commerce-merchant-faq.md
  screenshotIds:
    - orders-001
---

# Why do some orders require Accept and Ready to Ship, while others do not?

The process depends on the order source:

- Online Store and Pathao Shop: The order first appears under New Orders. You need to Accept it and mark it Ready to Ship.
- Daraz: Order actions and status may appear in Commerce, but fulfilment is handled through Daraz.
- Live Chat/manual and Instant Checkout: These orders go directly to Processing and do not require separate Accept or Ready to Ship actions because these are confirmed orders.

## বাংলা

### কিছু অর্ডারে Accept এবং Ready to Ship করতে হয়, কিন্তু কিছু অর্ডারে হয় না কেন?

এটি নির্ভর করে অর্ডারটি কোন মাধ্যম থেকে এসেছে তার ওপর:

- অনলাইন স্টোর এবং পাঠাও শপ: অর্ডারটি প্রথমে New Orders এ আসে। আপনাকে এটি Accept করতে হবে এবং Ready to Ship মার্ক করতে হবে।
- দারাজ: অর্ডারের স্ট্যাটাস এখানে দেখা গেলেও এর ফুলফিলমেন্ট বা ডেলিভারি দারাজের নিজস্ব প্রসেসেই সম্পন্ন হয়।
- লাইভ চ্যাট/ম্যানুয়াল এবং ইনস্ট্যান্ট চেকআউট: এগুলো যেহেতু সরাসরি মার্চেন্ট বা কাস্টমার দ্বারা নিশ্চিত করা অর্ডার, তাই এগুলো সরাসরি Processing সেকশনে চলে যায় এবং আলাদা অ্যাকশনের প্রয়োজন হয় না।

Product availability: **live**.

## Step-by-step guide

[Order management](/visual-guides/orders-001.md)
