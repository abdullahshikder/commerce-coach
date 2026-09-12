export interface CoachWorkflowScreenshot {
  featureId: string;
  src: string;
}

export interface CoachWorkflowTranslation {
  feature: string;
  question: string;
  answer: string;
  prerequisites?: string[];
  steps: string[];
  screenshotCaptions: Record<string, string>;
}

export interface CoachWorkflowEvaluation {
  id: string;
  query: string;
  expectedKnowledgeId: string;
  expectedScreenshotIds: string[];
  requiredAnswerPhrases: string[];
}

interface CoachWorkflowMatcher {
  all: string[][];
  any?: string[];
  none?: string[];
}

export interface CoachWorkflow {
  id: string;
  feature: string;
  domain: string;
  source: string;
  knowledgeId: string;
  question: string;
  answer: string;
  keywords: string[];
  prerequisites?: string[];
  steps: string[];
  screenshots: CoachWorkflowScreenshot[];
  translations?: {
    bn: CoachWorkflowTranslation;
  };
  evaluations: CoachWorkflowEvaluation[];
  matcher: CoachWorkflowMatcher;
}

export interface OrderSourceRule {
  id: string;
  label: string;
  firstTab: string;
  merchantAction: string;
  fulfillment: string;
}

export const ORDER_SOURCE_RULES: OrderSourceRule[] = [
  {
    id: 'online-store',
    label: 'Online Store',
    firstTab: 'New Orders',
    merchantAction: 'Accept or reject, then mark Ready to Ship.',
    fulfillment: 'Pathao Courier after Ready to Ship.',
  },
  {
    id: 'pathao-shop',
    label: 'Pathao Shop',
    firstTab: 'New Orders',
    merchantAction: 'Accept or reject, then mark Ready to Ship.',
    fulfillment: 'Pathao Courier after Ready to Ship.',
  },
  {
    id: 'daraz',
    label: 'Daraz',
    firstTab: 'New Orders',
    merchantAction: 'Merchant action and status sync as applicable.',
    fulfillment: 'Daraz handles delivery; Commerce reflects status.',
  },
  {
    id: 'live-chat-manual',
    label: 'Live Chat / Manual Order',
    firstTab: 'Processing',
    merchantAction: 'No accept or Ready to Ship action required.',
    fulfillment: 'Directly sent to Pathao Courier.',
  },
  {
    id: 'instant-checkout',
    label: 'Instant Checkout',
    firstTab: 'Processing',
    merchantAction: 'No accept or Ready to Ship action required.',
    fulfillment: 'Directly sent to Pathao Courier.',
  },
  {
    id: 'instant-delivery',
    label: 'Instant Delivery module',
    firstTab: 'Instant Delivery order list/details',
    merchantAction: 'Uses the separate instant parcel order flow.',
    fulfillment: 'Pathao Instant parcel delivery, outside the normal Commerce order tabs.',
  },
];

export const COACH_WORKFLOWS: CoachWorkflow[] = [
  {
    id: 'create-warehouse', feature: 'Warehouse Creation', domain: 'warehouse',
    source: 'Product Memo §7.2', knowledgeId: 'warehouse-001',
    question: 'How do I create a warehouse?',
    answer: 'Open Warehouse Management in the sidebar and click "Add Warehouse". Enter the warehouse name, full address, map location, contact person, and phone number, then submit for approval. The new warehouse appears with Pending status.',
    keywords: ['warehouse', 'create warehouse', 'add warehouse', 'ওয়্যারহাউস', 'অয়ারহাউস', 'গুদাম'],
    steps: ['Open Warehouse Management from the sidebar.', 'Click "Add Warehouse".', 'Enter the warehouse name, full address, contact person, and phone number.', 'Pin the location on the map.', 'Submit for approval and check the Pending status in the warehouse list.'],
    screenshots: [{featureId:'warehouse-001',src:'image96.jpg'},{featureId:'warehouse-001',src:'image103.jpg'}],
    translations: {bn: {
      feature: 'ওয়্যারহাউস তৈরি', question: 'ওয়্যারহাউস কীভাবে তৈরি করব?',
      answer: 'বাম পাশের মেনু থেকে Warehouse Management খুলে "Add Warehouse" চাপুন। ওয়্যারহাউসের নাম, পূর্ণ ঠিকানা, মানচিত্রে অবস্থান, যোগাযোগের ব্যক্তির নাম ও ফোন নম্বর দিয়ে অনুমোদনের জন্য জমা দিন। নতুন ওয়্যারহাউসটি তালিকায় Pending অবস্থায় দেখা যাবে।',
      steps: ['বাম পাশের মেনু থেকে Warehouse Management খুলুন।', '"Add Warehouse" চাপুন।', 'ওয়্যারহাউসের নাম, পূর্ণ ঠিকানা, যোগাযোগের ব্যক্তির নাম ও ফোন নম্বর লিখুন।', 'মানচিত্রে সঠিক অবস্থান পিন করুন।', 'অনুমোদনের জন্য জমা দিন। তালিকায় ওয়্যারহাউসটির Pending অবস্থা দেখুন।'],
      screenshotCaptions: {'image96.jpg':'ওয়্যারহাউসের যোগাযোগ ও ঠিকানার তথ্য পূরণ করুন।','image103.jpg':'তালিকায় তৈরি করা ওয়্যারহাউস ও অনুমোদনের অবস্থা দেখুন।'},
    }},
    evaluations: ['অয়ারহাউস কিভাবে bananbo','ওয়্যারহাউস কীভাবে তৈরি করব?','warehouse kivabe banabo','How do I add a warehouse?'].map((query,index)=>({
      id:`warehouse-create-${index+1}`,query,expectedKnowledgeId:'warehouse-001',expectedScreenshotIds:['image96.jpg','image103.jpg'],requiredAnswerPhrases:['Warehouse Management','Add Warehouse','Pending'],
    })),
    // Explicit aliases preserve Bengali marks and handle mixed-script questions without fuzzy matching unrelated features.
    matcher: {
      all: [['warehouse','warehouses','ওয়্যারহাউস','ওয়্যারহাউস','ওয়ারহাউস','ওয়ারহাউস','ওয়্যারহাউজ','ওয়ারহাউজ','অয়ারহাউস','অয়ারহাউস','গুদাম'],['create','add','setup','set up','তৈরি','বানাবো','বানাব','খুলব','খুলবো','banabo','bananbo','banate']],
      none: ['not working','cannot','failed','error','delete','remove','edit','transfer','stock','quiz','সমস্যা','পাচ্ছি না','কাজ করছে না','ডিলিট','মুছব','স্টক','কুইজ'],
    },
  },
  {
    id: 'find-instant-checkout-order',
    feature: 'Instant Checkout Order Missing from New Orders',
    domain: 'orders',
    source: 'Product Memo §7.7',
    knowledgeId: 'trouble-001',
    question: 'A merchant cannot find an Instant Checkout order in New Orders. Where is it?',
    answer: 'Open Orders → Processing. Instant Checkout orders bypass New Orders and appear directly in Processing because no merchant acceptance or Ready to Ship action is required. If the order is not there, clear filters, search by order ID or customer phone number, and confirm that the customer completed checkout.',
    keywords: [
      'order missing',
      'order not showing',
      'order not visible',
      'where is order',
      'order disappeared',
      'find instant checkout order',
      'instant check order',
      'instant checkout order',
      'new order tab',
      'new orders',
      'processing',
    ],
    steps: [
      'Navigate to Orders in the sidebar.',
      'Open Processing for Instant Checkout, manual, and chat-created orders.',
      'Use New Orders for Online Store, Pathao Shop, and Daraz orders that require action.',
      'Clear status, source, and date filters if the expected order is hidden.',
      'Search by order ID or customer phone number.',
      'Confirm that the customer finished placing the order through the checkout link.',
    ],
    screenshots: [
      { featureId: 'orders-001', src: 'image4.jpg' },
      { featureId: 'orders-001', src: 'image5.jpg' },
    ],
    translations: {
      bn: {
        feature: 'New Orders-এ Instant Checkout অর্ডার দেখা যাচ্ছে না',
        question: 'একজন merchant New Orders-এ Instant Checkout অর্ডার খুঁজে পাচ্ছেন না। অর্ডারটি কোথায়?',
        answer: 'Orders → Processing খুলুন। Instant Checkout অর্ডার New Orders-এ আসে না; এটি সরাসরি Processing-এ দেখা যায়, কারণ এতে merchant acceptance বা Ready to Ship action লাগে না। সেখানে অর্ডারটি না থাকলে filters সরিয়ে দিন, order ID বা customer phone number দিয়ে search করুন এবং customer checkout সম্পন্ন করেছেন কি না নিশ্চিত করুন।',
        steps: [
          'Sidebar থেকে Orders-এ যান।',
          'Instant Checkout, manual এবং chat থেকে তৈরি অর্ডারের জন্য Processing খুলুন।',
          'যেসব Online Store, Pathao Shop এবং Daraz অর্ডারে action দরকার, সেগুলোর জন্য New Orders ব্যবহার করুন।',
          'অর্ডারটি লুকিয়ে থাকলে status, source এবং date filters সরিয়ে দিন।',
          'Order ID বা customer phone number দিয়ে search করুন।',
          'Customer checkout link দিয়ে অর্ডারটি সম্পন্ন করেছেন কি না নিশ্চিত করুন।',
        ],
        screenshotCaptions: {
          'image4.jpg': 'New Orders-এ যেসব অর্ডারে action দরকার, সেগুলো দেখুন।',
          'image5.jpg': 'Processing-এ accepted, manual এবং Instant Checkout অর্ডারগুলো দেখুন।',
        },
      },
    },
    evaluations: [
      {
        id: 'instant-checkout-order-typo',
        query: 'cant find instant check order in new order tab',
        expectedKnowledgeId: 'trouble-001',
        expectedScreenshotIds: ['image4.jpg', 'image5.jpg'],
        requiredAnswerPhrases: ['Orders → Processing', 'bypass New Orders'],
      },
      {
        id: 'instant-checkout-order-correct-spelling',
        query: 'Where is my Instant Checkout order? It is not in New Orders.',
        expectedKnowledgeId: 'trouble-001',
        expectedScreenshotIds: ['image4.jpg', 'image5.jpg'],
        requiredAnswerPhrases: ['Orders → Processing', 'bypass New Orders'],
      },
      {
        id: 'instant-checkout-order-bangla',
        query: 'ইনস্ট্যান্ট চেকআউট অর্ডার নিউ অর্ডার্সে পাচ্ছি না',
        expectedKnowledgeId: 'trouble-001',
        expectedScreenshotIds: ['image4.jpg', 'image5.jpg'],
        requiredAnswerPhrases: ['Orders → Processing', 'bypass New Orders'],
      },
    ],
    matcher: {
      all: [
        ['instant checkout', 'instant check', 'ইনস্ট্যান্ট চেকআউট', 'ইনস্ট্যান্ট চেক'],
        ['order', 'orders', 'অর্ডার'],
      ],
      any: ['find', 'missing', 'not in', 'new order', 'new orders', 'processing', 'showing', 'tab', 'where', 'পাচ্ছি না', 'খুঁজে পাচ্ছি না', 'দেখাচ্ছে না', 'কোথায়', 'নিউ অর্ডার', 'প্রসেসিং'],
      none: ['chat', 'cart', 'conversation', 'চ্যাট', 'কার্ট', 'কনভারসেশন'],
    },
  },
  {
    id: 'create-ad-catalogue',
    feature: 'Online Store Ad Catalogue',
    domain: 'store',
    source: 'Product Memo §7.10',
    knowledgeId: 'catalogue-001',
    question: 'How do I create an ad catalogue from my Online Store products?',
    answer: 'Select Online Stores from the left navigation, find the store you want to use, and click "Manage". On the store Edit page, select the Ad Catalogues tab, click "Create Catalogue", enter a name, and use "Add Products" to choose the products to include. Create the catalogue, then copy its generated Catalogue Link for Meta Ads.',
    keywords: [
      'ad catalogue',
      'ad catalog',
      'add catalogue',
      'add catalog',
      'ad catelogue',
      'create catalogue',
      'online stores tab',
      'manage website',
      'catalog link',
      'catalogue link',
      'add products',
      'select products',
      'meta ads',
      'meta business manager',
    ],
    prerequisites: [
      'An Online Store has already been created.',
      'The products to advertise already exist in Pathao Commerce.',
    ],
    steps: [
      'Select Online Stores from the left navigation.',
      'Find the store you want to use and click "Manage".',
      'On the store Edit page, select the Ad Catalogues tab.',
      'Click "Create Catalogue" and enter a catalogue name.',
      'Click "Add Products", choose the products, review prices, and click "Create Ad catalogue".',
      'Copy the generated Catalogue Link and use it in Meta Ads.',
    ],
    screenshots: [
      { featureId: 'catalogue-001', src: 'image30.jpg' },
      { featureId: 'catalogue-001', src: 'image31.jpg' },
      { featureId: 'catalogue-001', src: 'image69.jpg' },
      { featureId: 'catalogue-001', src: 'image26.jpg' },
    ],
    translations: {
      bn: {
        feature: 'Online Store Ad Catalogue তৈরি',
        question: 'Online Store-এর products দিয়ে Meta Ads-এর জন্য ad catalogue কীভাবে তৈরি করব?',
        answer: 'বাম পাশের navigation থেকে Online Stores নির্বাচন করুন, যে store ব্যবহার করবেন সেটি খুঁজে "Manage"-এ click করুন। Store Edit page-এ Ad Catalogues tab নির্বাচন করে "Create Catalogue"-এ click করুন, একটি নাম দিন এবং "Add Products" দিয়ে products বেছে নিন। Catalogue তৈরি হলে Meta Ads-এর জন্য generated Catalogue Link copy করুন।',
        prerequisites: [
          'আগে একটি Online Store তৈরি থাকতে হবে।',
          'যে products advertise করবেন, সেগুলো Pathao Commerce-এ আগে থেকে থাকতে হবে।',
        ],
        steps: [
          'বাম পাশের navigation থেকে Online Stores নির্বাচন করুন।',
          'যে store ব্যবহার করবেন সেটি খুঁজে "Manage"-এ click করুন।',
          'Store Edit page-এ Ad Catalogues tab নির্বাচন করুন।',
          '"Create Catalogue"-এ click করে catalogue-এর নাম লিখুন।',
          '"Add Products"-এ click করে products বেছে নিন, prices review করুন এবং "Create Ad catalogue"-এ click করুন।',
          'Generated Catalogue Link copy করে Meta Ads-এ ব্যবহার করুন।',
        ],
        screenshotCaptions: {
          'image30.jpg': 'Online Stores খুলে যে store ব্যবহার করবেন, সেটির Manage-এ click করুন।',
          'image31.jpg': 'Store Edit page-এ Ad Catalogues tab নির্বাচন করুন।',
          'image69.jpg': 'Ad Catalogues tab থেকে Create Catalogue-এ click করুন।',
          'image26.jpg': 'Catalogue-এর নাম দিন, products যোগ করুন, prices review করুন এবং Create Ad catalogue-এ click করুন।',
        },
      },
    },
    evaluations: [
      {
        id: 'ad-catalogue-standard',
        query: 'How do I create an ad catalogue from my Online Store products?',
        expectedKnowledgeId: 'catalogue-001',
        expectedScreenshotIds: ['image30.jpg', 'image31.jpg', 'image69.jpg', 'image26.jpg'],
        requiredAnswerPhrases: ['Online Stores', 'Manage', 'Ad Catalogues', 'Add Products', 'Catalogue Link'],
      },
      {
        id: 'ad-catalogue-typos',
        query: 'HOW DO I CREATE MY ADD CATELOGUE FOR META ADS',
        expectedKnowledgeId: 'catalogue-001',
        expectedScreenshotIds: ['image30.jpg', 'image31.jpg', 'image69.jpg', 'image26.jpg'],
        requiredAnswerPhrases: ['Online Stores', 'Manage', 'Ad Catalogues', 'Add Products', 'Catalogue Link'],
      },
      {
        id: 'ad-catalogue-bangla',
        query: 'মেটা অ্যাডের জন্য ক্যাটালগ কীভাবে তৈরি করব?',
        expectedKnowledgeId: 'catalogue-001',
        expectedScreenshotIds: ['image30.jpg', 'image31.jpg', 'image69.jpg', 'image26.jpg'],
        requiredAnswerPhrases: ['Online Stores', 'Manage', 'Ad Catalogues', 'Add Products', 'Catalogue Link'],
      },
    ],
    matcher: {
      all: [
        ['catalogue', 'catalog', 'catelogue', 'ক্যাটালগ', 'ক্যাটালগটি'],
        ['ad', 'ads', 'meta', 'অ্যাড', 'মেটা', 'বিজ্ঞাপন'],
      ],
      any: ['add products', 'create', 'from the start', 'manage website', 'online store', 'products', 'তৈরি', 'কীভাবে', 'কিভাবে', 'অনলাইন স্টোর', 'পণ্য'],
    },
  },
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ')
    .trim();
}

function containsPhrase(normalizedQuery: string, phrase: string): boolean {
  return ` ${normalizedQuery} `.includes(` ${normalize(phrase)} `);
}

function matchesWorkflow(query: string, workflow: CoachWorkflow): boolean {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return false;

  const matchesAllGroups = workflow.matcher.all.every((alternatives) =>
    alternatives.some((phrase) => containsPhrase(normalizedQuery, phrase)),
  );
  const matchesAny = !workflow.matcher.any?.length
    || workflow.matcher.any.some((phrase) => containsPhrase(normalizedQuery, phrase));
  const matchesNone = !workflow.matcher.none?.some((phrase) =>
    containsPhrase(normalizedQuery, phrase),
  );

  return matchesAllGroups && matchesAny && matchesNone;
}

export function findCoachWorkflow(query: string): CoachWorkflow | undefined {
  return COACH_WORKFLOWS.find((workflow) => matchesWorkflow(query, workflow));
}

export function getCoachWorkflow(id: string): CoachWorkflow | undefined {
  return COACH_WORKFLOWS.find((workflow) => workflow.id === id);
}

export function getOrderSourceRule(id: string): OrderSourceRule | undefined {
  return ORDER_SOURCE_RULES.find((rule) => rule.id === id);
}

export function getCoachWorkflowEvaluations(): CoachWorkflowEvaluation[] {
  return COACH_WORKFLOWS.flatMap((workflow) => workflow.evaluations);
}
