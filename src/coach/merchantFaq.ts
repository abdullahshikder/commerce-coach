import type { KnowledgeItem } from './knowledgeBase';
import { ADDITIONAL_MERCHANT_FAQ_ITEMS } from './additionalMerchantFaq';

/**
 * Customer-facing FAQ content supplied in Pathao Commerce - Merchant FAQ [CONTENT].
 * Items stay separate from Product Memo records so their provenance and guide mappings remain explicit.
 */
const SUPPLIED_MERCHANT_FAQ_ITEMS = [
  {
    "id": "merchant-faq-001",
    "feature": "What is Pathao Commerce",
    "domain": "general",
    "keywords": [
      "merchant faq",
      "faq 1"
    ],
    "question": "What is Pathao Commerce?",
    "answer": "Pathao Commerce is a platform for managing an online business. You can manage products, stock, orders, payments, customer conversations, your online store, and delivery from one dashboard.",
    "translations": {
      "bn": {
        "question": "পাঠাও কমার্স (Pathao Commerce) কী?",
        "answer": "পাঠাও কমার্স হলো আপনার অনলাইন ব্যবসা পরিচালনা করার একটি অল-ইন-ওয়ান প্ল্যাটফর্ম। একটি মাত্র ড্যাশবোর্ড থেকেই আপনি আপনার প্রোডাক্ট, স্টক, অর্ডার, পেমেন্ট, কাস্টমার চ্যাট, অনলাইন স্টোর এবং ডেলিভারি, সবকিছু একসাথে ম্যানেজ করতে পারবেন।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md"
  },
  {
    "id": "merchant-faq-002",
    "feature": "Who is Pathao Commerce for",
    "domain": "general",
    "keywords": [
      "merchant faq",
      "faq 2"
    ],
    "question": "Who is Pathao Commerce for?",
    "answer": "It is for businesses that sell through Facebook, WhatsApp, Daraz, their own website, or other online channels. It can be used by both new sellers and established businesses managing multiple channels or warehouses.",
    "translations": {
      "bn": {
        "question": "পাঠাও কমার্স কাদের জন্য?",
        "answer": "যারা ফেসবুক, হোয়াটসঅ্যাপ, দারাজ, নিজস্ব ওয়েবসাইট বা অন্যান্য অনলাইন মাধ্যমে প্রোডাক্ট বিক্রি করেন, তাদের সবার জন্যই এটি তৈরি। নতুন বিক্রেতা থেকে শুরু করে একাধিক চ্যানেল বা ওয়্যারহাউস পরিচালনাকারী প্রতিষ্ঠিত ব্যবসা, সবাই এটি ব্যবহার করতে পারবেন।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md"
  },
  {
    "id": "merchant-faq-003",
    "feature": "I only sell through Facebook. Will Pathao Commerce still be useful for me",
    "domain": "general",
    "keywords": [
      "merchant faq",
      "faq 3"
    ],
    "question": "I only sell through Facebook. Will Pathao Commerce still be useful for me?",
    "answer": "Yes. You can create an online store without building a separate website, or send customers an Instant Checkout link directly through Facebook or WhatsApp.",
    "translations": {
      "bn": {
        "question": "আমি শুধু ফেসবুকে বিক্রি করি। পাঠাও কমার্স কি আমার কোনো কাজে আসবে?",
        "answer": "অবশ্যই আসবে! কোনো আলাদা ওয়েবসাইট তৈরি করার ঝামেলা ছাড়াই আপনি একটি অনলাইন স্টোর বানিয়ে ফেলতে পারবেন। আপনার Facebook  বা WhatsApp একাউন্ট কানেক্ট করে ইনবক্স থেকেই কুরিয়ার-এ অর্ডার দিতে পারবেন, আলাদা করে এন্ট্রি করতে হবেনা। এছাড়া ফেসবুক বা হোয়াটসঅ্যাপে কাস্টমারকে সরাসরি ইনস্ট্যান্ট চেকআউট (Instant Checkout) লিংক পাঠিয়ে অর্ডার কনফার্ম করতে পারবেন।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md"
  },
  {
    "id": "merchant-faq-004",
    "feature": "Do I need coding or technical knowledge",
    "domain": "general",
    "keywords": [
      "merchant faq",
      "faq 4"
    ],
    "question": "Do I need coding or technical knowledge?",
    "answer": "No. You do not need coding knowledge to create a store, add products, generate checkout links, or manage orders. You may need access to your external accounts when connecting services such as Daraz, Facebook, or WhatsApp.",
    "translations": {
      "bn": {
        "question": "এটি ব্যবহার করতে আমার কি কোডিং বা টেকনিক্যাল জ্ঞান লাগবে?",
        "answer": "একদমই না। স্টোর তৈরি করা, প্রোডাক্ট যোগ করা, চেকআউট লিংক তৈরি বা অর্ডার ম্যানেজ করার জন্য কোনো কোডিং জানার প্রয়োজন নেই। তবে দারাজ, ফেসবুক বা হোয়াটসঅ্যাপের মতো বাইরের অ্যাকাউন্টগুলো কানেক্ট করার সময় শুধু আপনার ওই অ্যাকাউন্টগুলোর অ্যাক্সেস লাগবে।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md"
  },
  {
    "id": "merchant-faq-005",
    "feature": "Can I sign up without a Pathao Courier account",
    "domain": "signup",
    "keywords": [
      "merchant faq",
      "faq 5"
    ],
    "question": "Can I sign up without a Pathao Courier account?",
    "answer": "Yes. You can sign up directly for Pathao Commerce. If your email address or phone number matches an existing Pathao Courier account, Commerce will reuse the relevant account and store information.\n\nIf no Courier account exists, the required Courier-linked setup will be created for Commerce-related fulfillment.",
    "translations": {
      "bn": {
        "question": "পাঠাও কুরিয়ার অ্যাকাউন্ট না থাকলে কি সাইনআপ করা যাবে?",
        "answer": "হ্যাঁ, যাবে। আপনি সরাসরি পাঠাও কমার্সে সাইনআপ করতে পারেন। যদি আপনার ইমেইল বা ফোন নম্বর কোনো বিদ্যমান পাঠাও কুরিয়ার অ্যাকাউন্টের সাথে মিলে যায়, তবে কমার্স স্বয়ংক্রিয়ভাবে সেই অ্যাকাউন্টের তথ্য নিয়ে নেবে। আর যদি কোনো কুরিয়ার অ্যাকাউন্ট না থাকে, তবে কমার্সের ডেলিভারি সুবিধার জন্য একটি নতুন কুরিয়ার লিংকড সেটআপ তৈরি হয়ে যাবে।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "signup-001"
    ]
  },
  {
    "id": "merchant-faq-006",
    "feature": "How can I sign up",
    "domain": "signup",
    "keywords": [
      "merchant faq",
      "faq 6"
    ],
    "question": "How can I sign up?",
    "answer": "You can sign up using:\n\n- Your email address\n- Your Google account\n- Your existing Pathao Courier account\n\nYour phone number must be verified through OTP before you can access the dashboard.",
    "translations": {
      "bn": {
        "question": "আমি কীভাবে সাইনআপ করতে পারি?",
        "answer": "আপনি নিচের যেকোনো একটির মাধ্যমে সাইনআপ করতে পারেন:\n\n- আপনার বর্তমান পাঠাও কুরিয়ার অ্যাকাউন্ট দিয়ে\n- আপনার ইমেইল অ্যাড্রেস দিয়ে\n- আপনার গুগল (Google) অ্যাকাউন্ট দিয়ে\n\nনোট: ড্যাশবোর্ডে প্রবেশ করার আগে ওটিপি (OTP)-এর মাধ্যমে আপনার ফোন নম্বরটি ভেরিফাই করতে হবে।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "signup-001",
      "signup-002",
      "signup-003"
    ]
  },
  {
    "id": "merchant-faq-007",
    "feature": "Can I use Commerce if my email verification is still pending",
    "domain": "signup",
    "keywords": [
      "merchant faq",
      "faq 7"
    ],
    "question": "Can I use Commerce if my email verification is still pending?",
    "answer": "Yes. Pending email verification alone will not block dashboard access if the required phone verification has been completed.",
    "translations": {
      "bn": {
        "question": "ইমেইল ভেরিফিকেশন পেন্ডিং থাকলেও কি আমি কমার্স ব্যবহার করতে পারব?",
        "answer": "হ্যাঁ, পারবেন। ফোন নম্বর ভেরিফিকেশন সফলভাবে সম্পন্ন হলে, শুধু ইমেইল ভেরিফিকেশন পেন্ডিং থাকার কারণে ড্যাশবোর্ডের অ্যাক্সেস আটকে থাকবে না।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md"
  },
  {
    "id": "merchant-faq-008",
    "feature": "What do I need to get started",
    "domain": "signup",
    "keywords": [
      "merchant faq",
      "faq 8"
    ],
    "question": "What do I need to get started?",
    "answer": "You will need:\n\n- An active mobile number\n- Basic business information\n- At least one pickup address or warehouse\n- Product name, price, stock, and image to start adding products",
    "translations": {
      "bn": {
        "question": "শুরু করার জন্য আমার কী কী লাগবে?",
        "answer": "আপনার প্রয়োজন হবে:\n\n- একটি সচল মোবাইল নম্বর\n- ব্যবসার বেসিক কিছু তথ্য\n- অন্তত একটি পিকআপ অ্যাড্রেস বা ওয়্যারহাউস\n- প্রোডাক্টের নাম, দাম, স্টক এবং ছবি (প্রোডাক্ট আপলোড শুরু করার জন্য)"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md"
  },
  {
    "id": "merchant-faq-009",
    "feature": "Can I create my own online store",
    "domain": "store",
    "keywords": [
      "merchant faq",
      "faq 9"
    ],
    "question": "Can I create my own online store?",
    "answer": "Yes. You can create and publish a mobile-friendly online store without arranging separate hosting or hiring a developer.",
    "translations": {
      "bn": {
        "question": "আমি কি নিজের অনলাইন স্টোর তৈরি করতে পারব?",
        "answer": "হ্যাঁ! আলাদা হোস্টিং কেনা বা ডেভেলপার হায়ার করার ঝামেলা ছাড়াই আপনি নিজের একটি মোবাইল ফ্রেন্ডলি অনলাইন স্টোর তৈরি ও পাবলিশ করতে পারবেন।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "store-001"
    ]
  },
  {
    "id": "merchant-faq-010",
    "feature": "Can I add my own logo, banner, and business information",
    "domain": "store",
    "keywords": [
      "merchant faq",
      "faq 10"
    ],
    "question": "Can I add my own logo, banner, and business information?",
    "answer": "Yes. You can update your store name, logo, banner, layout, theme, social links, return policy, and refund policy.",
    "translations": {
      "bn": {
        "question": "আমি কি নিজের লোগো, ব্যানার এবং ব্যবসার তথ্য যোগ করতে পারব?",
        "answer": "হ্যাঁ, পারবেন। আপনার স্টোরের নাম, লোগো, ব্যানার, লেআউট, থিম, সোশ্যাল মিডিয়া লিংক, রিটার্ন এবং রিফান্ড পলিসি সহজেই আপডেট করতে পারবেন।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "store-001"
    ]
  },
  {
    "id": "merchant-faq-011",
    "feature": "Can I change my store address or subdomain later",
    "domain": "store",
    "keywords": [
      "merchant faq",
      "faq 11"
    ],
    "question": "Can I change my store address or subdomain later?",
    "answer": "The current flow does not support changing the selected store address after creation. Check the spelling carefully before confirming it.",
    "translations": {
      "bn": {
        "question": "আমি কি পরে স্টোরের অ্যাড্রেস বা সাবডোমেন পরিবর্তন করতে পারব?",
        "answer": "বর্তমান সিস্টেমে স্টোর তৈরির পর তার অ্যাড্রেস (Subdomain) পরিবর্তন করা যায় না। তাই কনফার্ম করার আগে বানানটি ভালোভাবে দেখে নিন।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "store-001"
    ]
  },
  {
    "id": "merchant-faq-012",
    "feature": "Can I connect my own .com domain",
    "domain": "store",
    "keywords": [
      "merchant faq",
      "faq 12"
    ],
    "question": "Can I connect my own .com domain?",
    "answer": "Not yet. Custom domain support is coming soon. For now, your store will use a free Pathao Commerce address, such as yourstore.pathao.shop.",
    "translations": {
      "bn": {
        "question": "আমি কি আমার নিজস্ব ডটকম (.com) ডোমেন কানেক্ট করতে পারব?",
        "answer": "এখনই নয়। কাস্টম ডোমেন সাপোর্ট ফিচারটি খুব শীঘ্রই আসছে। আপাতত আপনার স্টোরটি একটি ফ্রি পাঠাও কমার্স অ্যাড্রেস ব্যবহার করবে (যেমন: yourstore.pathao.shop)।"
      }
    },
    "status": "coming-soon",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md"
  },
  {
    "id": "merchant-faq-013",
    "feature": "Can I edit the store after publishing it",
    "domain": "store",
    "keywords": [
      "merchant faq",
      "faq 13"
    ],
    "question": "Can I edit the store after publishing it?",
    "answer": "Yes. You can update the store’s branding, design, policies, social links, and other information after publishing.",
    "translations": {
      "bn": {
        "question": "স্টোর পাবলিশ করার পর কি কোনো তথ্য এডিট করা যাবে?",
        "answer": "হ্যাঁ, যাবে। পাবলিশ করার পরেও আপনি স্টোরের ব্র্যান্ডিং, ডিজাইন, পলিসি এবং সোশ্যাল লিংকসহ যেকোনো তথ্য আপডেট করতে পারবেন।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "store-001"
    ]
  },
  {
    "id": "merchant-faq-014",
    "feature": "Can I start selling before completing my full catalogue",
    "domain": "store",
    "keywords": [
      "merchant faq",
      "faq 14"
    ],
    "question": "Can I start selling before completing my full catalogue?",
    "answer": "Yes. With Instant Checkout, you can create a product when needed and immediately generate a checkout link. You do not have to complete an entire catalogue or website first.",
    "translations": {
      "bn": {
        "question": "পুরো ক্যাটালগ তৈরি করার আগেই কি আমি বিক্রি শুরু করতে পারব?",
        "answer": "হ্যাঁ! ইনস্ট্যান্ট চেকআউট ফিচারের মাধ্যমে আপনি যেকোনো সময় তাৎক্ষণিকভাবে একটি প্রোডাক্ট তৈরি করে তার চেকআউট লিংক কাস্টমারকে পাঠিয়ে দিতে পারেন। এর জন্য আগে থেকে পুরো ওয়েবসাইট বা ক্যাটালগ সাজিয়ে রাখার প্রয়োজন নেই।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "checkout-001"
    ]
  },
  {
    "id": "merchant-faq-015",
    "feature": "How can I add products",
    "domain": "product",
    "keywords": [
      "merchant faq",
      "faq 15"
    ],
    "question": "How can I add products?",
    "answer": "You can add products individually. For larger catalogues, you can upload products using a CSV or XLSX file.",
    "translations": {
      "bn": {
        "question": "প্রোডাক্ট কীভাবে যোগ করব?",
        "answer": "আপনি একটি একটি করে ম্যানুয়ালি প্রোডাক্ট যোগ করতে পারেন। আবার আপনার ক্যাটালগ যদি অনেক বড় হয়, তবে CSV বা XLSX ফাইলের মাধ্যমে একবারে অনেক প্রোডাক্ট বাল্ক আপলোড করতে পারবেন।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "product-001",
      "bulk-001"
    ]
  },
  {
    "id": "merchant-faq-016",
    "feature": "Can I create product variants such as size and colour",
    "domain": "product",
    "keywords": [
      "merchant faq",
      "faq 16"
    ],
    "question": "Can I create product variants such as size and colour?",
    "answer": "Yes. You can add variants such as:\n\n- Size: M, L, XL\n- Colour: Black, Blue, Red\n\nEach variant can have its own SKU, price, image, and stock quantity.",
    "translations": {
      "bn": {
        "question": "আমি কি সাইজ বা কালারের মতো প্রোডাক্ট ভ্যারিয়েন্ট তৈরি করতে পারব?",
        "answer": "হ্যাঁ, পারবেন। যেমন:\n\n- সাইজ: M, L, XL\n- কালার: Black, Blue, Red\n\nপ্রতিটি ভ্যারিয়েন্টের জন্য আলাদা SKU, দাম, ছবি এবং স্টক সংখ্যা নির্ধারণ করা সম্ভব।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "product-001"
    ]
  },
  {
    "id": "merchant-faq-017",
    "feature": "Can I manage stock separately for different warehouses",
    "domain": "inventory",
    "keywords": [
      "merchant faq",
      "faq 17"
    ],
    "question": "Can I manage stock separately for different warehouses?",
    "answer": "Yes. Stock can be viewed and updated by product, variant, and warehouse.",
    "translations": {
      "bn": {
        "question": "আমি কি আলাদা আলাদা ওয়্যারহাউসের স্টক আলাদাভাবে ম্যানেজ করতে পারব?",
        "answer": "হ্যাঁ। প্রোডাক্ট, ভ্যারিয়েন্ট এবং ওয়্যারহাউস অনুযায়ী আলাদাভাবে স্টক দেখতে ও আপডেট করতে পারবেন।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "inventory-001"
    ]
  },
  {
    "id": "merchant-faq-018",
    "feature": "Will I receive an alert when my stock is running low",
    "domain": "inventory",
    "keywords": [
      "merchant faq",
      "faq 18"
    ],
    "question": "Will I receive an alert when my stock is running low?",
    "answer": "You can already see low-stock and out-of-stock products from your Commerce dashboard.",
    "translations": {
      "bn": {
        "question": "স্টক কমে গেলে কি আমি কোনো অ্যালার্ট পাব?",
        "answer": "আপনার কমার্স ড্যাশবোর্ড থেকেই আপনি লো স্টক (Low stock) এবং আউট অফ স্টক (Out of stock) প্রোডাক্টগুলো সরাসরি দেখে নিতে পারবেন।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "inventory-001"
    ]
  },
  {
    "id": "merchant-faq-019",
    "feature": "Can I import products from Daraz",
    "domain": "product",
    "keywords": [
      "merchant faq",
      "faq 19"
    ],
    "question": "Can I import products from Daraz?",
    "answer": "Yes. After connecting your Daraz account, Commerce can fetch your products for import.\n\nIf a category cannot be matched automatically, you will need to select the correct Commerce category before importing the product.",
    "translations": {
      "bn": {
        "question": "আমি কি দারাজ (Daraz) থেকে প্রোডাক্ট ইম্পোর্ট করতে পারব?",
        "answer": "হ্যাঁ। আপনার দারাজ অ্যাকাউন্টটি কানেক্ট করার পর, পাঠাও কমার্স স্বয়ংক্রিয়ভাবে আপনার দারাজের প্রোডাক্টগুলো ইম্পোর্ট করার জন্য নিয়ে আসবে। যদি কোনো ক্যাটাগরি নিজে থেকে ম্যাচ না করে, তবে ইম্পোর্ট করার আগে আপনাকে সঠিক কমার্স ক্যাটাগরি সিলেক্ট করে দিতে হবে।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "daraz-001"
    ]
  },
  {
    "id": "merchant-faq-020",
    "feature": "Can I download my current product list",
    "domain": "product",
    "keywords": [
      "merchant faq",
      "faq 20"
    ],
    "question": "Can I download my current product list?",
    "answer": "Yes. You can download the current Commerce product list in XLSX format from the product list page.",
    "translations": {
      "bn": {
        "question": "আমি কি আমার বর্তমান প্রোডাক্ট লিস্ট ডাউনলোড করতে পারব?",
        "answer": "হ্যাঁ। প্রোডাক্ট লিস্ট পেজ থেকে আপনার বর্তমান কমার্স প্রোডাক্ট লিস্টটি XLSX ফরম্যাটে ডাউনলোড করতে পারবেন।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md"
  },
  {
    "id": "merchant-faq-021",
    "feature": "Do I need to connect Pathao Shop separately",
    "domain": "channels",
    "keywords": [
      "merchant faq",
      "faq 21"
    ],
    "question": "Do I need to connect Pathao Shop separately?",
    "answer": "No. Pathao Shop is connected automatically during Commerce onboarding. If your business is eligible for Pathao Shop, the Pathao Shop team will contact you and guide you through publishing your products. You can later update your shop name, logo, cover image, and other shop information.",
    "translations": {
      "bn": {
        "question": "পাঠাও শপ (Pathao Shop) কি আলাদাভাবে কানেক্ট করতে হবে?",
        "answer": "না। পাঠাও কমার্সের অনবোর্ডিংয়ের সময়ই পাঠাও শপ স্বয়ংক্রিয়ভাবে কানেক্ট হয়ে যায়। আপনার বিজনেস যদি পাঠাও শপের জন্য উপযুক্ত হয়, তবে পাঠাও শপ টিম আপনার সাথে যোগাযোগ করে প্রোডাক্ট পাবলিশ করার বিষয়ে গাইড করবে। পরবর্তীতে আপনি শপের নাম, লোগো, কাভার ইমেজ ইত্যাদি পরিবর্তন করতে পারবেন।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md"
  },
  {
    "id": "merchant-faq-022",
    "feature": "Can I publish Commerce products to Pathao Shop",
    "domain": "channels",
    "keywords": [
      "merchant faq",
      "faq 22"
    ],
    "question": "Can I publish Commerce products to Pathao Shop?",
    "answer": "Yes. You can select one or more products and publish them to Pathao Shop. You may need to confirm the category and channel-specific price before publishing.",
    "translations": {
      "bn": {
        "question": "আমি কি কমার্সের প্রোডাক্টগুলো পাঠাও শপে পাবলিশ করতে পারব?",
        "answer": "হ্যাঁ। আপনি এক বা একাধিক প্রোডাক্ট সিলেক্ট করে পাঠাও শপে পাবলিশ করতে পারবেন। পাবলিশ করার আগে ক্যাটাগরি এবং ওই চ্যানেলের জন্য নির্দিষ্ট দাম কনফার্ম করার প্রয়োজন হতে পারে।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "channels-001"
    ]
  },
  {
    "id": "merchant-faq-023",
    "feature": "Do I need to connect Daraz separately",
    "domain": "channels",
    "keywords": [
      "merchant faq",
      "faq 23"
    ],
    "question": "Do I need to connect Daraz separately?",
    "answer": "Yes. You must authenticate and connect your Daraz account before using Daraz product import, publishing, or related order features.",
    "translations": {
      "bn": {
        "question": "দারাজ (Daraz) কি আলাদাভাবে কানেক্ট করতে হবে?",
        "answer": "হ্যাঁ। দারাজের প্রোডাক্ট ইম্পোর্ট, পাবলিশিং বা অর্ডার ফিচারগুলো ব্যবহার করতে প্রথমে আপনার দারাজ অ্যাকাউন্টটি অথেনটিকেট ও কানেক্ট করতে হবে।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "addons-daraz"
    ]
  },
  {
    "id": "merchant-faq-024",
    "feature": "Can I use different prices on Daraz and Pathao Shop",
    "domain": "channels",
    "keywords": [
      "merchant faq",
      "faq 24"
    ],
    "question": "Can I use different prices on Daraz and Pathao Shop?",
    "answer": "Yes. You can use the same global product price across channels or set a separate price for a specific sales channel.",
    "translations": {
      "bn": {
        "question": "আমি কি দারাজ এবং পাঠাও শপে আলাদা আলাদা দাম ব্যবহার করতে পারব?",
        "answer": "হ্যাঁ, পারবেন। আপনি চাইলে সব চ্যানেলে একটি কমন  মূল্য (Global Pricing)  রাখতে পারেন, অথবা নির্দিষ্ট কোনো সেলস চ্যানেলের জন্য আলাদা দাম সেট করতে পারেন।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md"
  },
  {
    "id": "merchant-faq-025",
    "feature": "Can I connect Shopify or WooCommerce",
    "domain": "channels",
    "keywords": [
      "merchant faq",
      "faq 25"
    ],
    "question": "Can I connect Shopify or WooCommerce?",
    "answer": "Not yet. Shopify and WooCommerce integrations are coming soon. For now, you can use the Pathao Commerce Online Store, Instant Checkout, Pathao Shop, and available Daraz features.",
    "translations": {
      "bn": {
        "question": "আমি কি শপিফাই (Shopify) বা উকমার্স (WooCommerce) কানেক্ট করতে পারব?",
        "answer": "এখনই নয়। শপিফাই এবং উকমার্স ইন্টিগ্রেশন খুব শীঘ্রই আসছে। আপাতত আপনি পাঠাও কমার্স অনলাইন স্টোর, ইনস্ট্যান্ট চেকআউট, পাঠাও শপ এবং দারাজের ফিচারগুলো ব্যবহার করতে পারবেন।"
      }
    },
    "status": "coming-soon",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md"
  },
  {
    "id": "merchant-faq-026",
    "feature": "What is Instant Checkout",
    "domain": "checkout",
    "keywords": [
      "merchant faq",
      "faq 26"
    ],
    "question": "What is Instant Checkout?",
    "answer": "Instant Checkout creates a shareable order link. You can send the link to customers through Facebook, WhatsApp, Messenger, SMS, or any other communication channel.",
    "translations": {
      "bn": {
        "question": "ইনস্ট্যান্ট চেকআউট (Instant Checkout) কী?",
        "answer": "ইনস্ট্যান্ট চেকআউট হলো একটি শেয়ারযোগ্য অর্ডার লিংক (Shareable Link)। এই লিংকটি আপনি ফেসবুক, হোয়াটসঅ্যাপ, মেসেঞ্জার, এসএমএস বা যেকোনো মাধ্যমে কাস্টমারকে পাঠাতে পারেন।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "checkout-001"
    ]
  },
  {
    "id": "merchant-faq-027",
    "feature": "Can one checkout link include multiple products",
    "domain": "checkout",
    "keywords": [
      "merchant faq",
      "faq 27"
    ],
    "question": "Can one checkout link include multiple products?",
    "answer": "Yes. When creating the link from the main Instant Checkout flow or from chat, you can add multiple products to the cart before generating the link.",
    "translations": {
      "bn": {
        "question": "একটি চেকআউট লিংকে কি একাধিক প্রোডাক্ট যোগ করা সম্ভব?",
        "answer": "হ্যাঁ। ইনস্ট্যান্ট চেকআউট ফ্লো বা চ্যাট থেকে লিংক তৈরি করার সময় আপনি কার্টে (Cart) একাধিক প্রোডাক্ট অ্যাড করে একটি সিঙ্গেল লিংক জেনারেট করতে পারবেন।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "checkout-001"
    ]
  },
  {
    "id": "merchant-faq-028",
    "feature": "What if the product is not already in my catalogue",
    "domain": "checkout",
    "keywords": [
      "merchant faq",
      "faq 28"
    ],
    "question": "What if the product is not already in my catalogue?",
    "answer": "You can create a product on the spot using the required basic information and generate a checkout link without adding it to a complete catalogue first.",
    "translations": {
      "bn": {
        "question": "প্রোডাক্টটি যদি আগে থেকে আমার ক্যাটালগে না থাকে?",
        "answer": "কোনো সমস্যা নেই! আপনি অন দ্য স্পট (তাৎক্ষণিকভাবে) প্রোডাক্টের বেসিক তথ্য দিয়ে একটি প্রোডাক্ট তৈরি করে লিংক জেনারেট করতে পারবেন। এর জন্য আগে থেকে ক্যাটালগে প্রোডাক্ট থাকার বাধ্যবাকতা নেই।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "checkout-001"
    ]
  },
  {
    "id": "merchant-faq-029",
    "feature": "Where will orders from Instant Checkout appear",
    "domain": "checkout",
    "keywords": [
      "merchant faq",
      "faq 29"
    ],
    "question": "Where will orders from Instant Checkout appear?",
    "answer": "Instant Checkout orders go directly to the Processing section. They do not appear under New Orders.",
    "translations": {
      "bn": {
        "question": "ইনস্ট্যান্ট চেকআউট থেকে আসা অর্ডারগুলো কোথায় দেখব?",
        "answer": "ইনস্ট্যান্ট চেকআউটের অর্ডারগুলো সরাসরি Processing সেকশনে চলে যায়। এগুলো New Orders ট্যাবে দেখাবে না।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "orders-001"
    ]
  },
  {
    "id": "merchant-faq-030",
    "feature": "Do I need to Accept or mark Instant Checkout orders as Ready to Ship",
    "domain": "checkout",
    "keywords": [
      "merchant faq",
      "faq 30"
    ],
    "question": "Do I need to Accept or mark Instant Checkout orders as Ready to Ship?",
    "answer": "No. Instant Checkout orders go directly to Processing and are routed into the applicable Pathao Courier flow.",
    "translations": {
      "bn": {
        "question": "ইনস্ট্যান্ট চেকআউট অর্ডারের ক্ষেত্রে কি আমার Accept বা Ready to Ship করার দরকার আছে?",
        "answer": "না। যেহেতু এগুলো কনফার্মড অর্ডার, তাই এগুলো সরাসরি Processing এ চলে যায় এবং স্বয়ংক্রিয়ভাবে পাঠাও কুরিয়ারের ডেলিভারি প্রসেসে যুক্ত হয়ে যায়।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "orders-001"
    ]
  },
  {
    "id": "merchant-faq-031",
    "feature": "Can I see orders from different channels in one place",
    "domain": "orders",
    "keywords": [
      "merchant faq",
      "faq 31"
    ],
    "question": "Can I see orders from different channels in one place?",
    "answer": "Yes. Orders from the Online Store, Pathao Shop, Daraz, Live Chat or manual orders, and Instant Checkout can be viewed in the Commerce Orders section.\n\nThe order source is also shown so you can identify where the order came from.",
    "translations": {
      "bn": {
        "question": "আমি কি সব চ্যানেলের অর্ডার এক জায়গায় দেখতে পারব?",
        "answer": "হ্যাঁ, পারবেন। অনলাইন স্টোর, পাঠাও শপ, দারাজ, লাইভ চ্যাট, ম্যানুয়াল অর্ডার এবং ইনস্ট্যান্ট চেকআউট—সব উৎসের অর্ডার আপনি কমার্সের Orders সেকশনে একসাথে দেখতে পাবেন। অর্ডারের সোর্স (Source) বা উৎসও সেখানে উল্লেখ থাকবে।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "orders-001"
    ]
  },
  {
    "id": "merchant-faq-032",
    "feature": "Why do some orders require Accept and Ready to Ship, while others do not",
    "domain": "orders",
    "keywords": [
      "merchant faq",
      "faq 32"
    ],
    "question": "Why do some orders require Accept and Ready to Ship, while others do not?",
    "answer": "The process depends on the order source:\n\n- Online Store and Pathao Shop: The order first appears under New Orders. You need to Accept it and mark it Ready to Ship.\n- Daraz: Order actions and status may appear in Commerce, but fulfilment is handled through Daraz.\n- Live Chat/manual and Instant Checkout: These orders go directly to Processing and do not require separate Accept or Ready to Ship actions because these are confirmed orders.",
    "translations": {
      "bn": {
        "question": "কিছু অর্ডারে Accept এবং Ready to Ship করতে হয়, কিন্তু কিছু অর্ডারে হয় না কেন?",
        "answer": "এটি নির্ভর করে অর্ডারটি কোন মাধ্যম থেকে এসেছে তার ওপর:\n\n- অনলাইন স্টোর এবং পাঠাও শপ: অর্ডারটি প্রথমে New Orders এ আসে। আপনাকে এটি Accept করতে হবে এবং Ready to Ship মার্ক করতে হবে।\n- দারাজ: অর্ডারের স্ট্যাটাস এখানে দেখা গেলেও এর ফুলফিলমেন্ট বা ডেলিভারি দারাজের নিজস্ব প্রসেসেই সম্পন্ন হয়।\n- লাইভ চ্যাট/ম্যানুয়াল এবং ইনস্ট্যান্ট চেকআউট: এগুলো যেহেতু সরাসরি মার্চেন্ট বা কাস্টমার দ্বারা নিশ্চিত করা অর্ডার, তাই এগুলো সরাসরি Processing সেকশনে চলে যায় এবং আলাদা অ্যাকশনের প্রয়োজন হয় না।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "orders-001"
    ]
  },
  {
    "id": "merchant-faq-033",
    "feature": "Do I need to enter the customer address again in the Courier panel",
    "domain": "orders",
    "keywords": [
      "merchant faq",
      "faq 33"
    ],
    "question": "Do I need to enter the customer address again in the Courier panel?",
    "answer": "No customer places their information during order.",
    "translations": {
      "bn": {
        "question": "আমাকে কি কুরিয়ার প্যানেলে কাস্টমারের ঠিকানা আবার এন্ট্রি করতে হবে?",
        "answer": "না। কাস্টমার চেকআউট করার সময়ই তার প্রয়োজনীয় তথ্য দিয়ে দেন, যা সরাসরি সিস্টেমে চলে আসে।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "orders-001"
    ]
  },
  {
    "id": "merchant-faq-034",
    "feature": "When is an order sent to Pathao Courier",
    "domain": "orders",
    "keywords": [
      "merchant faq",
      "faq 34"
    ],
    "question": "When is an order sent to Pathao Courier?",
    "answer": "For Online Store and Pathao Shop orders, the order moves to the Pathao Courier flow after it has been Accepted and marked Ready to Ship.\n\nManual, chat, and Instant Checkout orders move directly into Processing based on their relevant flow.",
    "translations": {
      "bn": {
        "question": "একটি অর্ডার কখন পাঠাও কুরিয়ারে পাঠানো হয়?",
        "answer": "অনলাইন স্টোর এবং পাঠাও শপের অর্ডারগুলো Accept এবং Ready to Ship মার্ক করার পর পাঠাও কুরিয়ারের ফ্লোতে চলে যায়। অন্যদিকে ম্যানুয়াল, চ্যাট এবং ইনস্ট্যান্ট চেকআউটের অর্ডারগুলো সরাসরি Processing এ যাওয়ার সাথে সাথেই কুরিয়ার সিস্টেমে চলে যায়।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "orders-001"
    ]
  },
  {
    "id": "merchant-faq-035",
    "feature": "Who delivers a Daraz order",
    "domain": "orders",
    "keywords": [
      "merchant faq",
      "faq 35"
    ],
    "question": "Who delivers a Daraz order?",
    "answer": "Daraz orders are fulfilled through the Daraz delivery process. Pathao Commerce reflects the relevant order and status information and updates the inventory.",
    "translations": {
      "bn": {
        "question": "দারাজের অর্ডার কে ডেলিভারি করবে?",
        "answer": "দারাজের অর্ডারগুলো দারাজের নিজস্ব ডেলিভারি নেটওয়ার্কের মাধ্যমেই সম্পন্ন হয়। পাঠাও কমার্স শুধু সেই অর্ডারের তথ্য ও স্ট্যাটাস দেখায় এবং ইনভেন্টরি বা স্টক আপডেট করে।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "orders-001"
    ]
  },
  {
    "id": "merchant-faq-036",
    "feature": "Where can I find cancelled orders",
    "domain": "orders",
    "keywords": [
      "merchant faq",
      "faq 36"
    ],
    "question": "Where can I find cancelled orders?",
    "answer": "Cancelled orders appear under the Cancelled tab. Cancellation options may vary depending on the order’s current status.",
    "translations": {
      "bn": {
        "question": "বাতিল হওয়া অর্ডারগুলো কোথায় পাব?",
        "answer": "বাতিল বা ক্যানসেল হওয়া অর্ডারগুলো Cancelled ট্যাবে পাওয়া যাবে। অর্ডারের বর্তমান অবস্থার ওপর ভিত্তি করে ক্যানসেলেশনের অপশনগুলো পরিবর্তিত হতে পারে।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "orders-001"
    ]
  },
  {
    "id": "merchant-faq-037",
    "feature": "Are Pathao Courier and Instant Delivery the same service",
    "domain": "delivery",
    "keywords": [
      "merchant faq",
      "faq 37"
    ],
    "question": "Are Pathao Courier and Instant Delivery the same service?",
    "answer": "No.\n\nRegular Commerce orders generally use the Pathao Courier fulfilment flow. Instant Delivery is a separate module for same-city, faster delivery requirements.",
    "translations": {
      "bn": {
        "question": "পাঠাও কুরিয়ার এবং ইনস্ট্যান্ট ডেলিভারি কি একই সেবা?",
        "answer": "না, দুটি আলাদা। রেগুলার কমার্স অর্ডারগুলো সাধারণত পাঠাও কুরিয়ার সার্ভিসের মাধ্যমে ডেলিভারি করা হয়। অন্যদিকে, একই শহরের ভেতর আরও দ্রুত ডেলিভারির প্রয়োজনে ইনস্ট্যান্ট ডেলিভারি (Instant Delivery) একটি আলাদা মডিউল হিসেবে কাজ করে।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md"
  },
  {
    "id": "merchant-faq-038",
    "feature": "Can payment be collected through Instant Delivery",
    "domain": "delivery",
    "keywords": [
      "merchant faq",
      "faq 38"
    ],
    "question": "Can payment be collected through Instant Delivery?",
    "answer": "Payment on Delivery may be available when the receiver is selected as the payer and the applicable flow supports it. It does not apply when the sender is paying.",
    "translations": {
      "bn": {
        "question": "ইনস্ট্যান্ট ডেলিভারির মাধ্যমে কি পেমেন্ট কালেক্ট করা যায়?",
        "answer": "যদি প্রাপক (Receiver) ডেলিভারি চার্জ বা পেমেন্ট দেওয়ার জন্য সিলেক্টেড থাকে এবং সিস্টেমের ফ্লোতে সেটি সাপোর্ট করে, তবে পেমেন্ট অন ডেলিভারি পাওয়া যেতে পারে। তবে প্রেরক (Sender) নিজে পে করলে এটি প্রযোজ্য নয়।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "delivery-002"
    ]
  },
  {
    "id": "merchant-faq-039",
    "feature": "Can I track delivery from Commerce",
    "domain": "delivery",
    "keywords": [
      "merchant faq",
      "faq 39"
    ],
    "question": "Can I track delivery from Commerce?",
    "answer": "Delivery status can be followed from the Commerce dashboard. The exact tracking information available depends on the order and delivery source.",
    "translations": {
      "bn": {
        "question": "আমি কি কমার্স থেকেই ডেলিভারি ট্র্যাক করতে পারব?",
        "answer": "হ্যাঁ। পাঠাও কমার্স ড্যাশবোর্ড থেকেই ডেলিভারি স্ট্যাটাস ট্র্যাক করা সম্ভব। তবে কতটুকু নিখুঁত ট্র্যাকিং তথ্য দেখা যাবে তা অর্ডার ও ডেলিভারির মাধ্যমের ওপর নির্ভর করে।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "orders-001"
    ]
  },
  {
    "id": "merchant-faq-040",
    "feature": "How can customers pay",
    "domain": "finance",
    "keywords": [
      "merchant faq",
      "faq 40"
    ],
    "question": "How can customers pay?",
    "answer": "Depending on the supported checkout flow, customers may be able to pay using:\n\n- bKash\n- Nagad\n- Debit or credit card\n- Cash on Delivery",
    "translations": {
      "bn": {
        "question": "কাস্টমাররা কীভাবে পেমেন্ট করতে পারবেন?",
        "answer": "চেকআউট মাধ্যমের ওপর ভিত্তি করে কাস্টমাররা নিচের মাধ্যমগুলো ব্যবহার করে পেমেন্ট করতে পারবেন:\n\n- বিকাশ (bKash)\n- নগদ (Nagad)\n- ডেবিট বা ক্রেডিট কার্ড\n- ক্যাশ অন ডেলিভারি (Cash on Delivery)"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md"
  },
  {
    "id": "merchant-faq-041",
    "feature": "Do I need a separate payment gateway account or developer",
    "domain": "finance",
    "keywords": [
      "merchant faq",
      "faq 41"
    ],
    "question": "Do I need a separate payment gateway account or developer?",
    "answer": "You do not need to arrange a separate gateway integration to use the built-in payment flow.\n\nThe available payment methods may vary by channel or checkout flow.",
    "translations": {
      "bn": {
        "question": "পেমেন্ট গেটওয়ের জন্য কি আমার আলাদা অ্যাকাউন্ট বা ডেভেলপারের প্রয়োজন আছে?",
        "answer": "না। ইনবিল্ট পেমেন্ট ফ্লো ব্যবহার করার জন্য আপনার আলাদা কোনো গেটওয়ে ইন্টিগ্রেশনের ঝামেলা পোহাতে হবে না। তবে চ্যানেল বা চেকআউট ভেদে পেমেন্ট মেথড পরিবর্তিত হতে পারে।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md"
  },
  {
    "id": "merchant-faq-042",
    "feature": "Where can I check whether a payment was completed",
    "domain": "finance",
    "keywords": [
      "merchant faq",
      "faq 42"
    ],
    "question": "Where can I check whether a payment was completed?",
    "answer": "Payment status and related transaction or invoice information can be viewed from the order and Finance sections.",
    "translations": {
      "bn": {
        "question": "পেমেন্ট সফল হয়েছে কিনা তা কোথায় চেক করব?",
        "answer": "যেকোনো অর্ডারের পেমেন্ট স্ট্যাটাস, ট্রানজেকশন এবং ইনভয়েসের তথ্য আপনি Order এবং Finance সেকশনে দেখতে পাবেন।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "finance-001"
    ]
  },
  {
    "id": "merchant-faq-043",
    "feature": "Can I download finance invoices",
    "domain": "finance",
    "keywords": [
      "merchant faq",
      "faq 43"
    ],
    "question": "Can I download finance invoices?",
    "answer": "Yes. Available invoices can be downloaded from the Finance section.",
    "translations": {
      "bn": {
        "question": "আমি কি ফিন্যান্স ইনভয়েস ডাউনলোড করতে পারব?",
        "answer": "হ্যাঁ। ফিন্যান্স সেকশন থেকে আপনার প্রয়োজনীয় ইনভয়েসগুলো ডাউনলোড করে নিতে পারবেন।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "finance-001"
    ]
  },
  {
    "id": "merchant-faq-044",
    "feature": "What do I need to receive earnings from Pathao Shop",
    "domain": "finance",
    "keywords": [
      "merchant faq",
      "faq 44"
    ],
    "question": "What do I need to receive earnings from Pathao Shop?",
    "answer": "You must set up a payout method, such as an applicable bKash or bank account. Payment release may remain blocked until the required payout information has been provided.",
    "translations": {
      "bn": {
        "question": "পাঠাও শপ থেকে আমার আয় বা আর্নিং পাওয়ার জন্য কী লাগবে?",
        "answer": "আপনাকে একটি পেআউট মেথড (Payout method) সেটআপ করতে হবে, যেমন—বিকাশ বা ব্যাংক অ্যাকাউন্ট। সঠিক পেআউট তথ্য না দেওয়া পর্যন্ত পেমেন্ট রিলিজ বা সেটেলমেন্ট ব্লক থাকতে পারে।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "finance-001"
    ]
  },
  {
    "id": "merchant-faq-045",
    "feature": "How long does settlement take",
    "domain": "finance",
    "keywords": [
      "merchant faq",
      "faq 45"
    ],
    "question": "How long does settlement take?",
    "answer": "Same as pathao courier existing method.",
    "translations": {
      "bn": {
        "question": "পেমেন্ট সেটেলমেন্ট হতে কতদিন সময় লাগে?",
        "answer": "পাঠাও কুরিয়ারের বর্তমান বা বিদ্যমান সেটেলমেন্ট নিয়ম অনুযায়ী এটি সম্পন্ন হবে।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md"
  },
  {
    "id": "merchant-faq-046",
    "feature": "Can I see Facebook and WhatsApp messages in one place",
    "domain": "chats",
    "keywords": [
      "merchant faq",
      "faq 46"
    ],
    "question": "Can I see Facebook and WhatsApp messages in one place?",
    "answer": "Yes. Conversations from connected Facebook and WhatsApp accounts can appear in the unified Chats inbox.",
    "translations": {
      "bn": {
        "question": "আমি কি ফেসবুক এবং হোয়াটসঅ্যাপের মেসেজ এক জায়গায় দেখতে পাব?",
        "answer": "হ্যাঁ। আপনার কানেক্টেড ফেসবুক পেজ এবং হোয়াটসঅ্যাপ অ্যাকাউন্টের সব মেসেজ একটি সিঙ্গেল বা ইউনিফাইড Chats Inbox এ দেখা যাবে।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "chats-001"
    ]
  },
  {
    "id": "merchant-faq-047",
    "feature": "Can I create an order while chatting with a customer",
    "domain": "chats",
    "keywords": [
      "merchant faq",
      "faq 47"
    ],
    "question": "Can I create an order while chatting with a customer?",
    "answer": "Yes. You can create an order directly from a conversation using an existing product or a newly created product.",
    "translations": {
      "bn": {
        "question": "কাস্টমারের সাথে চ্যাট করার সময়ই কি অর্ডার তৈরি করা সম্ভব?",
        "answer": "হ্যাঁ! চ্যাট চলাকালীন অবস্থায় চ্যাট বক্স থেকেই আপনি ক্যাটালগের কোনো প্রোডাক্ট সিলেক্ট করে বা নতুন প্রোডাক্ট তৈরি করে সরাসরি অর্ডার প্লেস করতে পারবেন।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "chats-002"
    ]
  },
  {
    "id": "merchant-faq-048",
    "feature": "Do I need to enter the customer’s name, phone number, and address again",
    "domain": "chats",
    "keywords": [
      "merchant faq",
      "faq 48"
    ],
    "question": "Do I need to enter the customer’s name, phone number, and address again?",
    "answer": "Where information is available from the conversation, some customer details may be prefilled. You should review the details before confirming the order.",
    "translations": {
      "bn": {
        "question": "আমাকে কি কাস্টমারের নাম, ফোন নম্বর ও ঠিকানা আবার টাইপ করতে হবে?",
        "answer": "চ্যাটের কনভার্সেশনে যদি কাস্টমারের তথ্য আগে থেকে থাকে, তবে কিছু ডিটেইলস স্বয়ংক্রিয়ভাবে ফিলআপ (Prefilled) হয়ে যেতে পারে। তবে অর্ডার কনফার্ম করার আগে তথ্যগুলো একবার যাচাই করে নেওয়া ভালো।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "chats-003"
    ]
  },
  {
    "id": "merchant-faq-049",
    "feature": "Where do orders created from chat appear",
    "domain": "chats",
    "keywords": [
      "merchant faq",
      "faq 49"
    ],
    "question": "Where do orders created from chat appear?",
    "answer": "Live Chat or manual orders go directly to Processing and are sent into the applicable Pathao Courier flow.",
    "translations": {
      "bn": {
        "question": "চ্যাট থেকে তৈরি করা অর্ডারগুলো কোথায় দেখাবে?",
        "answer": "লাইভ চ্যাট বা ম্যানুয়ালি তৈরি করা অর্ডারগুলো সরাসরি Processing সেকশনে চলে যায় এবং পাঠাও কুরিয়ারের ফ্লোতে যুক্ত হয়।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "orders-001"
    ]
  },
  {
    "id": "merchant-faq-050",
    "feature": "Can I manage Instagram messages from Pathao Commerce",
    "domain": "chats",
    "keywords": [
      "merchant faq",
      "faq 50"
    ],
    "question": "Can I manage Instagram messages from Pathao Commerce?",
    "answer": "Not yet. Instagram chat integration is coming soon. For now, you can manage supported Facebook and WhatsApp conversations from the Commerce inbox.",
    "translations": {
      "bn": {
        "question": "আমি কি পাঠাও কমার্স থেকে ইনস্টাগ্রাম (Instagram) মেসেজ ম্যানেজ করতে পারব?",
        "answer": "এখনই নয়। ইনস্টাগ্রাম চ্যাট ইন্টিগ্রেশন ফিচারটি খুব শীঘ্রই আসছে। আপাতত ফেসবুক এবং হোয়াটসঅ্যাপ চ্যাট ম্যানেজ করা যাবে।"
      }
    },
    "status": "coming-soon",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md"
  },
  {
    "id": "merchant-faq-051",
    "feature": "What does “warehouse” mean in Pathao Commerce",
    "domain": "warehouse",
    "keywords": [
      "merchant faq",
      "faq 51"
    ],
    "question": "What does “warehouse” mean in Pathao Commerce?",
    "answer": "A warehouse is the pickup location from which products are collected or dispatched. Inventory and fulfilment processes are connected to the selected warehouse.",
    "translations": {
      "bn": {
        "question": "পাঠাও কমার্সে \"ওয়্যারহাউস\" (Warehouse) বলতে কী বোঝায়?",
        "answer": "ওয়্যারহাউস হলো আপনার পিকআপ লোকেশন বা ঠিকানা, যেখান থেকে কুরিয়ার আপনার প্রোডাক্ট সংগ্রহ বা ডিসপ্যাচ করবে। আপনার ইনভেন্টরি এবং ডেলিভারি প্রক্রিয়া এই সিলেক্টেড ওয়্যারহাউসের সাথেই যুক্ত থাকে।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "warehouse-001"
    ]
  },
  {
    "id": "merchant-faq-052",
    "feature": "If I already have a Pathao Courier store, do I need to create another warehouse",
    "domain": "warehouse",
    "keywords": [
      "merchant faq",
      "faq 52"
    ],
    "question": "If I already have a Pathao Courier store, do I need to create another warehouse?",
    "answer": "Usually not. If the account is matched correctly, existing Courier stores are shown or imported as Commerce warehouses.",
    "translations": {
      "bn": {
        "question": "আমার যদি আগে থেকেই পাঠাও কুরিয়ার স্টোর থাকে, তবে কি নতুন ওয়্যারহাউস খুলতে হবে?",
        "answer": "সাধারণত প্রয়োজন নেই। অ্যাকাউন্ট সঠিকভাবে ম্যাচ করলে আপনার বিদ্যমান কুরিয়ার স্টোরটিই কমার্সে ওয়্যারহাউস হিসেবে ইম্পোর্ট হয়ে যাবে।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "warehouse-001"
    ]
  },
  {
    "id": "merchant-faq-053",
    "feature": "Does the first warehouse need approval",
    "domain": "warehouse",
    "keywords": [
      "merchant faq",
      "faq 53"
    ],
    "question": "Does the first warehouse need approval?",
    "answer": "The first warehouse created during signup is expected to be approved automatically on the Courier side.\n\nAdditional warehouses may require Courier-side approval.",
    "translations": {
      "bn": {
        "question": "প্রথম ওয়্যারহাউসটির জন্য কি অনুমোদনের (Approval) প্রয়োজন আছে?",
        "answer": "সাইনআপের সময় তৈরি করা প্রথম ওয়্যারহাউসটি কুরিয়ার এন্ড থেকে স্বয়ংক্রিয়ভাবে অনুমোদিত হয়ে যাওয়ার কথা। তবে পরবর্তী অতিরিক্ত ওয়্যারহাউসগুলোর জন্য অ্যাপ্রুভালের প্রয়োজন হতে পারে।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "warehouse-001"
    ]
  },
  {
    "id": "merchant-faq-054",
    "feature": "How long does it take to approve an additional warehouse",
    "domain": "warehouse",
    "keywords": [
      "merchant faq",
      "faq 54"
    ],
    "question": "How long does it take to approve an additional warehouse?",
    "answer": "Your first warehouse is approved automatically during signup. Additional warehouses require approval from Pathao Courier. You can check the approval status from the Warehouses section, and a standard approval timeline will be shared soon.",
    "translations": {
      "bn": {
        "question": "অতিরিক্ত ওয়্যারহাউস অ্যাপ্রুভ হতে কত সময় লাগে?",
        "answer": "প্রথমটি অটো অ্যাপ্রুভ হলেও পরবর্তী ওয়্যারহাউসগুলোর জন্য পাঠাও কুরিয়ারের অনুমোদনের প্রয়োজন হয়। আপনি Warehouses সেকশন থেকে এর স্ট্যাটাস দেখতে পারবেন। এর স্ট্যান্ডার্ড টাইমলাইন শীঘ্রই জানিয়ে দেওয়া হবে।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "warehouse-001"
    ]
  },
  {
    "id": "merchant-faq-055",
    "feature": "Can I give my employees separate access",
    "domain": "warehouse",
    "keywords": [
      "merchant faq",
      "faq 55"
    ],
    "question": "Can I give my employees separate access?",
    "answer": "Not yet. Team access and separate staff permissions are coming soon. For now, the business is managed through the main Commerce account.",
    "translations": {
      "bn": {
        "question": "আমি কি আমার কর্মীদের (Employees) আলাদা অ্যাক্সেস দিতে পারব?",
        "answer": "এখনই নয়। টিম অ্যাক্সেস এবং স্টাফ পারমিশন ফিচারটি নিয়ে কাজ চলছে, যা শীঘ্রই আসবে। আপাতত মূল কমার্স অ্যাকাউন্ট দিয়েই ব্যবসা পরিচালনা করতে হবে।"
      }
    },
    "status": "coming-soon",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md"
  },
  {
    "id": "merchant-faq-056",
    "feature": "Can I use an API for Instant Delivery",
    "domain": "delivery",
    "keywords": [
      "merchant faq",
      "faq 56"
    ],
    "question": "Can I use an API for Instant Delivery?",
    "answer": "Developer API references and webhook configuration are available for eligible technical merchants.",
    "translations": {
      "bn": {
        "question": "আমি কি ইনস্ট্যান্ট ডেলিভারির জন্য এপিআই (API) ব্যবহার করতে পারব?",
        "answer": "হ্যাঁ। যোগ্য টেকনিক্যাল মার্চেন্টদের জন্য ডেভেলপার API রেফারেন্স এবং ওয়েবহুক (Webhook) কনফিগারেশনের সুবিধা রয়েছে।"
      }
    },
    "status": "limited",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "delivery-003"
    ]
  },
  {
    "id": "merchant-faq-057",
    "feature": "Where can I configure the webhook",
    "domain": "delivery",
    "keywords": [
      "merchant faq",
      "faq 57"
    ],
    "question": "Where can I configure the webhook?",
    "answer": "The Callback URL and Secret can be configured from the Developer API section.",
    "translations": {
      "bn": {
        "question": "ওয়েবহুক (Webhook) কোথায় কনফিগার করব?",
        "answer": "আপনার Callback URL এবং Secret কি টি Developer API সেকশন থেকে কনফিগার করতে পারবেন।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "delivery-003"
    ]
  },
  {
    "id": "merchant-faq-058",
    "feature": "Should I share my Client Secret or access token with support",
    "domain": "delivery",
    "keywords": [
      "merchant faq",
      "faq 58"
    ],
    "question": "Should I share my Client Secret or access token with support?",
    "answer": "No. Never share your Client Secret, access token, or other sensitive credentials with anyone.",
    "translations": {
      "bn": {
        "question": "আমি কি আমার Client Secret বা অ্যাক্সেস টোকেন সাপোর্ট টিমের সাথে শেয়ার করতে পারি?",
        "answer": "কখনোই নয়। আপনার Client Secret, অ্যাক্সেস টোকেন বা যেকোনো সেনসিটিভ ক্রেডেনশিয়াল কদাচ কারও সাথে শেয়ার করবেন না।"
      }
    },
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md"
  },
  {
    "id": "merchant-faq-059",
    "feature": "আপনাদের কোনো ইউজার ম্যানুয়াল থাকলে প্লিজ শেয়ার করবেন।",
    "domain": "general",
    "keywords": [
      "merchant faq",
      "faq 59",
      "user manual",
      "ইউজার ম্যানুয়াল",
      "ভিডিও গাইড"
    ],
    "question": "আপনাদের কোনো ইউজার ম্যানুয়াল থাকলে প্লিজ শেয়ার করবেন।",
    "answer": "https://www.youtube.com/playlist?list=PLMN1y8VZcPd8",
    "status": "live",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md"
  },
  {
    "id": "merchant-faq-060",
    "feature": "Can I process customer refunds automatically",
    "domain": "finance",
    "keywords": [
      "merchant faq",
      "faq 60",
      "future feature"
    ],
    "question": "Can I process customer refunds automatically?",
    "answer": "Not yet. Automated refunds are coming soon. For now, approved refunds need to be processed through the available manual process.",
    "translations": {
      "bn": {
        "question": "আমি কি কাস্টমারের রিফান্ড অটোমেটিকভাবে প্রসেস করতে পারব?",
        "answer": "এখনই নয়। অটোমেটেড রিফান্ড ফিচারটি শীঘ্রই আসছে। আপাতত অনুমোদিত রিফান্ডগুলো ম্যানুয়ালি প্রসেস করতে হবে।"
      }
    },
    "status": "coming-soon",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md"
  },
  {
    "id": "merchant-faq-061",
    "feature": "Can I edit multiple products at once",
    "domain": "product",
    "keywords": [
      "merchant faq",
      "faq 61",
      "future feature"
    ],
    "question": "Can I edit multiple products at once?",
    "answer": "Not yet. Bulk product editing is coming soon. For now, product prices, stock, discounts, and status need to be updated individually.",
    "translations": {
      "bn": {
        "question": "আমি কি একসাথে একাধিক প্রোডাক্ট এডিট (Bulk Edit) করতে পারব?",
        "answer": "এখনই নয়। বাল্ক প্রোডাক্ট এডিটিং ফিচারটি শীঘ্রই আসছে। আপাতত দাম, স্টক বা ডিসকাউন্ট আলাদাভাবে আপডেট করতে হবে।"
      }
    },
    "status": "coming-soon",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md"
  },
  {
    "id": "merchant-faq-062",
    "feature": "Can I schedule a price change for a campaign",
    "domain": "product",
    "keywords": [
      "merchant faq",
      "faq 62",
      "future feature"
    ],
    "question": "Can I schedule a price change for a campaign?",
    "answer": "Not yet. Scheduled price changes are coming soon. For now, you will need to update the product price manually before and after a campaign.",
    "translations": {
      "bn": {
        "question": "আমি কি ক্যাম্পেইনের জন্য আগে থেকে প্রাইস চেঞ্জ শিডিউল করে রাখতে পারব?",
        "answer": "এখনই নয়। শিডিউলড প্রাইস চেঞ্জ ফিচারটি সামনে আসবে। আপাতত ক্যাম্পেইনের আগে ও পরে ম্যানুয়ালি দাম পরিবর্তন করতে হবে।"
      }
    },
    "status": "coming-soon",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md"
  },
  {
    "id": "merchant-faq-063",
    "feature": "Can I set an expiry date for an Instant Checkout link",
    "domain": "checkout",
    "keywords": [
      "merchant faq",
      "faq 63",
      "future feature"
    ],
    "question": "Can I set an expiry date for an Instant Checkout link?",
    "answer": "Not yet. Checkout-link expiry controls are coming soon. For now, avoid sharing an old link once the offer or campaign has ended.",
    "translations": {
      "bn": {
        "question": "ইনস্ট্যান্ট চেকআউট লিংকের কি এক্সপায়ারি ডেট সেট করা যায়?",
        "answer": "এখনই নয়। লিংক এক্সপায়ারি কন্ট্রোল ফিচারটি শীঘ্রই আসছে। আপাতত অফার শেষ হয়ে গেলে পুরোনো লিংকটি আর শেয়ার না করার অনুরোধ রইল।"
      }
    },
    "status": "coming-soon",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md"
  },
  {
    "id": "merchant-faq-064",
    "feature": "Will Commerce remind me when I need to restock",
    "domain": "inventory",
    "keywords": [
      "merchant faq",
      "faq 64",
      "future feature"
    ],
    "question": "Will Commerce remind me when I need to restock?",
    "answer": "Automated restock reminders are coming soon. For now, you can check low-stock and out-of-stock products from the Commerce dashboard.",
    "translations": {
      "bn": {
        "question": "স্টক শেষ হওয়ার মুখে থাকলে কমার্স কি আমাকে রিমাইন্ডার দেবে?",
        "answer": "অটোমেটেড রিস্টক রিমাইন্ডার ফিচারটি শীঘ্রই আসছে। আপাতত ড্যাশবোর্ডের Low stock সেকশন থেকে এটি দেখে নিতে হবে।"
      }
    },
    "status": "coming-soon",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "inventory-001"
    ]
  },
  {
    "id": "merchant-faq-065",
    "feature": "Can I upload product videos",
    "domain": "media",
    "keywords": [
      "merchant faq",
      "faq 65",
      "future feature"
    ],
    "question": "Can I upload product videos?",
    "answer": "Not yet. Product video support is coming soon. For now, you can add product images from your device or Media Gallery.",
    "translations": {
      "bn": {
        "question": "আমি কি প্রোডাক্টের ভিডিও আপলোড করতে পারব?",
        "answer": "এখনই নয়। প্রোডাক্ট ভিডিও সাপোর্ট ফিচারটি সামনে আসবে। আপাতত ডিভাইস বা মিডিয়া গ্যালারি থেকে ছবি আপলোড করতে পারবেন।"
      }
    },
    "status": "coming-soon",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "media-001"
    ]
  },
  {
    "id": "merchant-faq-066",
    "feature": "Will more online-store designs be available",
    "domain": "store",
    "keywords": [
      "merchant faq",
      "faq 66",
      "future feature"
    ],
    "question": "Will more online-store designs be available?",
    "answer": "Yes. More store templates are coming soon. For now, you can customize the available templates with your logo, banner, theme, and business information.",
    "translations": {
      "bn": {
        "question": "ভবিষ্যতে কি আরও অনলাইন স্টোর ডিজাইন পাওয়া যাবে?",
        "answer": "হ্যাঁ। আরও নতুন নতুন স্টোর টেমপ্লেট শীঘ্রই যুক্ত হবে। আপাতত বর্তমান টেমপ্লেটগুলো লোগো, ব্যানার ও থিম দিয়ে কাস্টমাইজ করতে পারবেন।"
      }
    },
    "status": "coming-soon",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "store-001"
    ]
  },
  {
    "id": "merchant-faq-067",
    "feature": "Can I see detailed payment analytics",
    "domain": "finance",
    "keywords": [
      "merchant faq",
      "faq 67",
      "future feature"
    ],
    "question": "Can I see detailed payment analytics?",
    "answer": "Not yet. Detailed payment analytics are coming soon. For now, you can view available transaction, payment, and invoice information from the Finance section.",
    "translations": {
      "bn": {
        "question": "আমি কি বিস্তারিত পেমেন্ট অ্যানালিটিক্স দেখতে পারব?",
        "answer": "এখনই নয়। বিস্তারিত পেমেন্ট অ্যানালিটিক্স ফিচারটি শীঘ্রই আসছে। আপাতত ফিন্যান্স সেকশন থেকে ট্রানজেকশন ও ইনভয়েসের তথ্য দেখতে পারবেন।"
      }
    },
    "status": "coming-soon",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "finance-001"
    ]
  },
  {
    "id": "merchant-faq-068",
    "feature": "Can I see how each checkout link is performing",
    "domain": "checkout",
    "keywords": [
      "merchant faq",
      "faq 68",
      "future feature"
    ],
    "question": "Can I see how each checkout link is performing?",
    "answer": "Not yet. Checkout-link analytics are coming soon. For now, orders placed through your links will appear in the Commerce Orders section.",
    "translations": {
      "bn": {
        "question": "প্রতিটি চেকআউট লিংক কেমন পারফর্ম করছে তা কি ট্র্যাক করা যাবে?",
        "answer": "এখনই নয়। চেকআউট লিংক অ্যানালিটিক্স ফিচারটি সামনে আসবে। আপাতত ওই লিংকগুলোর মাধ্যমে আসা অর্ডারগুলো Orders সেকশনে দেখতে পাবেন।"
      }
    },
    "status": "coming-soon",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md",
    "screenshotIds": [
      "orders-001"
    ]
  },
  {
    "id": "merchant-faq-069",
    "feature": "আমি কি একটার বেশি শপ এড করতে পারবো?  যেমন আমার দারাজে ৩ টা শপ আমি কি শুধু একটাই এড করতে পারব? আমার ই-কমার্স যেটা আছে সেটা কি আমি এড করতে পারবো?  যেহেতু দারাজের ১ টা শপ already add করেছি।",
    "domain": "channels",
    "keywords": [
      "merchant faq",
      "faq 69",
      "multiple shops",
      "multiple daraz shops",
      "একাধিক শপ",
      "দারাজ শপ"
    ],
    "question": "আমি কি একটার বেশি শপ এড করতে পারবো?  যেমন আমার দারাজে ৩ টা শপ আমি কি শুধু একটাই এড করতে পারব? আমার ই-কমার্স যেটা আছে সেটা কি আমি এড করতে পারবো?  যেহেতু দারাজের ১ টা শপ already add করেছি।",
    "answer": "এখনই নয়, একাধিক শপ এড করার সুবিধাটি খুব শীঘ্রই আসছে।",
    "status": "coming-soon",
    "source": "knowledge/sources/pathao-commerce-merchant-faq.md"
  }
] satisfies KnowledgeItem[];

export const MERCHANT_FAQ_ITEMS = [
  ...SUPPLIED_MERCHANT_FAQ_ITEMS,
  ...ADDITIONAL_MERCHANT_FAQ_ITEMS,
] satisfies KnowledgeItem[];
