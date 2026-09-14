import { getScreenshotReferencePrompt } from './screenshots/manifest';
import { MERCHANT_FAQ_ITEMS } from './merchantFaq';
import { TUTORIAL_VIDEO_ITEMS } from './tutorialVideos';
import {
  ORDER_SOURCE_RULES,
  findCoachWorkflow,
  getCoachWorkflow,
  getOrderSourceRule,
} from './workflows/registry';

/**
 * Pathao Commerce Coach AI — Knowledge Base
 * Comprehensive product knowledge from the Product Memo (v7.1–7.14)
 * Organized for fast fuzzy search and retrieval.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KnowledgeItem {
  id: string;
  feature: string;
  domain: string;
  keywords: string[];
  question: string;
  answer: string;
  howItWorks?: string[];
  prerequisites?: string[];
  steps?: string[];
  edgeCases?: string[];
  cxNotes?: string[];
  merchantCommunication?: string;
  translations?: Record<string, {
    question: string;
    answer: string;
  }>;
  status: 'live' | 'live-with-dependency' | 'limited' | 'coming-soon' | 'tbd' | 'out-of-scope';
  source: string;
  /** Optional: IDs of screenshots to show with this answer */
  screenshotIds?: string[];
}

export interface TrainingModule {
  id: string;
  level: number;
  title: string;
  description: string;
  domains: string[];
  keyConcepts: string[];
}

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'true-false' | 'scenario' | 'troubleshoot';
  domain: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  source: string;
}

function requireWorkflow(id: string) {
  const workflow = getCoachWorkflow(id);
  if (!workflow) throw new Error(`Missing Coach workflow: ${id}`);
  return workflow;
}

function requireOrderSource(id: string) {
  const source = getOrderSourceRule(id);
  if (!source) throw new Error(`Missing Coach order source: ${id}`);
  return source;
}

function formatList(values: string[]): string {
  if (values.length <= 1) return values[0] ?? '';
  return `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`;
}

const instantCheckoutOrderWorkflow = requireWorkflow('find-instant-checkout-order');
const adCatalogueWorkflow = requireWorkflow('create-ad-catalogue');
const instantCheckoutOrderSource = requireOrderSource('instant-checkout');
const standardOrderSources = ORDER_SOURCE_RULES.filter(({ id }) => id !== 'instant-delivery');
const newOrderSourceLabels = standardOrderSources
  .filter(({ firstTab }) => firstTab === 'New Orders')
  .map(({ label }) => label);
const processingSourceLabels = standardOrderSources
  .filter(({ firstTab }) => firstTab === 'Processing')
  .map(({ label }) => label);

// ---------------------------------------------------------------------------
// 1. KNOWLEDGE BASE
// ---------------------------------------------------------------------------

const PRODUCT_MEMO_KNOWLEDGE_BASE: KnowledgeItem[] = [
  // ── 7.1  Signup & Onboarding ─────────────────────────────────────────────
  {
    id: 'signup-001',
    feature: 'Direct Signup',
    domain: 'signup',
    keywords: ['signup', 'register', 'new merchant', 'create account', 'pathao commerce'],
    question: 'How do I sign up for Pathao Commerce?',
    answer: 'Merchants can sign up directly at commerce.pathao.com using a phone number or email. The flow collects business type (individual/business), business name, and primary product category. After OTP verification the merchant lands inside the dashboard.',
    howItWorks: [
      'Navigate to commerce.pathao.com and click "Get Started".',
      'Choose signup method: phone (OTP) or email (magic link).',
      'Complete business profile: business type, name, category.',
      'Verify identity via OTP.',
      'Merchant is redirected to the onboarding wizard.',
    ],
    steps: [
      'Open commerce.pathao.com',
      'Click "Get Started"',
      'Select phone or email',
      'Enter OTP',
      'Fill business profile',
      'Land on dashboard',
    ],
    status: 'live',
    source: 'Product Memo §7.1',
    screenshotIds: ['signup-001'],
  },
  {
    id: 'signup-002',
    feature: 'Courier Signup',
    domain: 'signup',
    keywords: ['courier signup', 'existing courier', 'login courier', 'pathao courier merchant'],
    question: 'I am already a Pathao Courier merchant. How do I access Pathao Commerce?',
    answer: 'Existing Pathao Courier merchants can log in with their courier credentials at commerce.pathao.com. Their warehouse, parcel history, and payout info are pre-populated. They still need to complete business profile details.',
    howItWorks: [
      'Go to commerce.pathao.com and click "Courier Merchant Login".',
      'Enter existing courier phone/email and password.',
      'System links the courier account to a Commerce profile.',
      'Business profile form is pre-filled with courier data; merchant completes the rest.',
    ],
    prerequisites: ['Active Pathao Courier merchant account'],
    status: 'live',
    source: 'Product Memo §7.1',
    screenshotIds: ['signup-002'],
  },
  {
    id: 'signup-003',
    feature: 'Google OAuth Signup',
    domain: 'signup',
    keywords: ['google signup', 'google login', 'oauth', 'sign in with google'],
    question: 'Can I sign up with my Google account?',
    answer: 'Yes. Google OAuth is supported. Merchants click "Sign in with Google", select their Google account, and are redirected to the profile completion step. The Google email is used as the primary contact email.',
    howItWorks: [
      'Click "Sign in with Google" on the signup page.',
      'Select or enter Google credentials.',
      'Grant permission to Pathao Commerce.',
      'Redirect to business profile completion.',
    ],
    status: 'live',
    source: 'Product Memo §7.1',
    screenshotIds: ['signup-003'],
  },
  {
    id: 'signup-004',
    feature: 'OTP Login',
    domain: 'signup',
    keywords: ['otp', 'one time password', 'phone login', 'sms verification'],
    question: 'How does OTP login work?',
    answer: 'Merchants enter their registered phone number. A 6-digit OTP is sent via SMS. The OTP expires after 5 minutes. After 3 failed attempts the merchant must wait 60 seconds before retrying. On successful OTP the merchant is authenticated and redirected to the dashboard.',
    howItWorks: [
      'Enter phone number on login page.',
      'System sends 6-digit OTP via SMS.',
      'Enter OTP within 5 minutes.',
      'After 3 failures, 60-second cooldown.',
      'Successful entry → dashboard.',
    ],
    edgeCases: [
      'If SMS is not received, merchant can tap "Resend OTP" after 60 seconds.',
      'OTP delivery may be delayed due to carrier issues; advise waiting up to 2 minutes.',
    ],
    status: 'live',
    source: 'Product Memo §7.1',
  },
  {
    id: 'signup-005',
    feature: 'Warehouse Setup During Signup',
    domain: 'signup',
    keywords: ['warehouse setup', 'onboarding wizard', 'first warehouse', 'initial setup', 'onboarding'],
    question: 'Do I need to set up a warehouse during signup?',
    answer: 'Yes. During the onboarding wizard merchants are prompted to create at least one warehouse. They must provide warehouse name, address, contact person, and phone. The warehouse is required before products can be added or orders fulfilled.',
    howItWorks: [
      'Onboarding wizard presents warehouse creation form.',
      'Merchant fills: name, address (with map pin), contact person, phone.',
      'Warehouse is created in "pending" status awaiting courier approval.',
      'Merchant can skip and add warehouse later, but cannot fulfill orders until at least one warehouse is approved.',
    ],
    prerequisites: ['Completed business profile'],
    edgeCases: [
      'Skipping warehouse setup limits dashboard functionality.',
      'Warehouse approval is required before courier assignment.',
    ],
    status: 'live',
    source: 'Product Memo §7.1',
  },

  // ── 7.2  Warehouse Management ────────────────────────────────────────────
  {
    id: 'warehouse-001',
    feature: 'Warehouse Creation',
    domain: 'warehouse',
    keywords: ['warehouse', 'create warehouse', 'add warehouse', 'warehouse setup', 'store location'],
    question: 'How do I create a warehouse?',
    answer: 'Navigate to Warehouse Management in the sidebar. Click "Add Warehouse". Fill in warehouse name, full address (with map location pin), contact person name, and phone number. Submit for courier approval. Warehouse starts in "Pending" status.',
    howItWorks: [
      'Go to sidebar → Warehouse Management.',
      'Click "Add Warehouse".',
      'Fill: name, address, contact person, phone.',
      'Pin location on map.',
      'Submit — warehouse enters "Pending" status.',
    ],
    steps: [
      'Navigate to Warehouse Management',
      'Click "Add Warehouse"',
      'Enter warehouse details',
      'Pin location on map',
      'Submit for approval',
    ],
    status: 'live',
    source: 'Product Memo §7.2',
    screenshotIds: ['warehouse-001'],
  },
  {
    id: 'warehouse-002',
    feature: 'Warehouse Approval',
    domain: 'warehouse',
    keywords: ['warehouse approval', 'pending warehouse', 'courier approval', 'approve warehouse'],
    question: 'What is warehouse approval?',
    answer: 'After creating a warehouse it enters "Pending" status. The courier team reviews the address and contact details. Approval typically takes 24–48 hours. Once approved the warehouse status changes to "Active" and can be used for fulfillment. Rejected warehouses receive a reason and can be edited and resubmitted.',
    howItWorks: [
      'Warehouse created → status "Pending".',
      'Courier team reviews address and contact info.',
      'Approved → status "Active" (24–48 hours).',
      'Rejected → merchant notified with reason; can edit and resubmit.',
    ],
    edgeCases: [
      'If warehouse is rejected, merchant receives notification with rejection reason.',
      'Merchant can edit and resubmit rejected warehouses.',
      'Warehouse approval time may vary based on location.',
    ],
    cxNotes: [
      'If a merchant asks why their warehouse is pending, explain the 24–48 hour review window.',
      'Rejected warehouses can be edited and resubmitted.',
    ],
    status: 'live',
    source: 'Product Memo §7.2',
  },
  {
    id: 'warehouse-003',
    feature: 'Courier Mapping',
    domain: 'warehouse',
    keywords: ['courier mapping', 'assign courier', 'courier connection', 'integrate courier', 'pathao courier'],
    question: 'How does courier mapping work for warehouses?',
    answer: 'Each warehouse can be mapped to one or more courier partners. Pathao Courier is the default and is auto-mapped on approval. Merchants can add additional couriers (e.g., Paperfly,.ecourier) from the Add-ons section. Courier mapping determines which delivery partners serve orders from that warehouse.',
    howItWorks: [
      'Pathao Courier is auto-mapped when warehouse is approved.',
      'Additional couriers added via Add-ons → Connection Hub.',
      'Each warehouse shows mapped couriers.',
      'Orders from a warehouse are dispatched to mapped couriers.',
    ],
    prerequisites: ['Warehouse approved (Active status)'],
    status: 'live',
    source: 'Product Memo §7.2',
  },
  {
    id: 'warehouse-004',
    feature: 'Warehouse Edit & Delete',
    domain: 'warehouse',
    keywords: ['edit warehouse', 'delete warehouse', 'update warehouse', 'remove warehouse'],
    question: 'Can I edit or delete a warehouse?',
    answer: 'Yes. Active warehouses can be edited (address, contact, name) but changes may require re-approval if address changes significantly. Warehouses with pending orders cannot be deleted. Inactive warehouses with no orders can be deleted permanently.',
    howItWorks: [
      'Click warehouse → Edit to modify details.',
      'Address changes may trigger re-approval.',
      'Delete is only available for warehouses with no pending orders.',
    ],
    edgeCases: [
      'Warehouses with pending orders cannot be deleted.',
      'Significant address changes may require courier re-approval.',
    ],
    status: 'live',
    source: 'Product Memo §7.2',
  },

  // ── 7.3  Product / Catalog Management ────────────────────────────────────
  {
    id: 'product-001',
    feature: 'Simple Product Creation',
    domain: 'product',
    keywords: ['create product', 'add product', 'simple product', 'new product', 'product listing'],
    question: 'How do I create a simple product?',
    answer: 'Navigate to Products → Add Product. Fill in: product name, description, category, SKU, price, compare-at price (optional), weight, images (up to 10), and warehouse stock. A simple product has no variants — one SKU, one price, one stock.',
    howItWorks: [
      'Go to Products → Add Product.',
      'Fill: name, description, category, SKU, price.',
      'Optional: compare-at price for showing discounts.',
      'Enter weight (for shipping calculation).',
      'Upload images (up to 10 per product).',
      'Set stock per warehouse.',
      'Save — product is created in "Draft" status.',
    ],
    steps: [
      'Navigate to Products',
      'Click "Add Product"',
      'Fill product details',
      'Upload images',
      'Set warehouse stock',
      'Save product',
    ],
    status: 'live',
    source: 'Product Memo §7.3',
    screenshotIds: ['product-001'],
  },
  {
    id: 'product-002',
    feature: 'Product with Variants',
    domain: 'product',
    keywords: ['variants', 'product variants', 'size', 'color', 'variant options', 'sku variant'],
    question: 'How do I create a product with variants?',
    answer: 'When creating a product, toggle "Has Variants". Define option names (e.g., Size, Color) and their values. The system generates a variant matrix. Each variant gets its own SKU, price, weight, and stock. Up to 3 option types per product and up to 100 variant combinations.',
    howItWorks: [
      'Toggle "Has Variants" on product creation form.',
      'Add option names: e.g., Size (S, M, L), Color (Red, Blue).',
      'System auto-generates variant combinations.',
      'Each combination gets: SKU, price, weight, stock.',
      'Up to 3 option types, up to 100 combinations total.',
    ],
    edgeCases: [
      'Max 3 option types (e.g., Size + Color + Material).',
      'Max 100 variant combinations per product.',
      'Each variant must have a unique SKU.',
    ],
    status: 'live',
    source: 'Product Memo §7.3',
  },
  {
    id: 'product-003',
    feature: 'Bulk Product Upload',
    domain: 'product',
    keywords: ['bulk upload', 'csv upload', 'import products', 'batch upload', 'excel upload'],
    question: 'How do I upload products in bulk?',
    answer: 'Navigate to Products → Bulk Upload. Download the CSV template. Fill in product details (name, description, SKU, price, stock, etc.). Upload the CSV. The system validates data and shows any errors. Fix errors and re-upload. Successfully imported products appear in the product list.',
    howItWorks: [
      'Go to Products → Bulk Upload.',
      'Download CSV template.',
      'Fill in product data row by row.',
      'Upload CSV file.',
      'System validates: required fields, data types, SKU uniqueness.',
      'Errors shown in a table; fix and re-upload.',
      'Valid rows imported; products created in "Draft" status.',
    ],
    steps: [
      'Navigate to Products → Bulk Upload',
      'Download CSV template',
      'Fill in product data',
      'Upload CSV',
      'Review validation results',
      'Fix errors if any',
      'Confirm import',
    ],
    edgeCases: [
      'CSV must follow the exact template format.',
      'Duplicate SKUs will be rejected.',
      'Missing required fields cause row-level errors.',
      'Images must be URLs (not local file paths) in CSV.',
    ],
    status: 'live',
    source: 'Product Memo §7.3',
  },
  {
    id: 'product-004',
    feature: 'Daraz Product Import',
    domain: 'product',
    keywords: ['daraz import', 'import from daraz', 'daraz products', 'import catalog', 'daraz sync'],
    question: 'Can I import products from my Daraz store?',
    answer: 'Yes. Navigate to Products → Daraz Import. Authenticate your Daraz seller account via OAuth. Select products to import. The system fetches product data (title, description, images, variants, pricing) and creates them in your Pathao Commerce catalog. Inventory can be synced or set manually.',
    howItWorks: [
      'Go to Products → Daraz Import.',
      'Click "Connect Daraz Account".',
      'Complete OAuth flow on Daraz seller portal.',
      'Select products to import (individual or bulk).',
      'System maps Daraz fields to Pathao Commerce fields.',
      'Review and confirm import.',
    ],
    prerequisites: ['Active Daraz seller account'],
    edgeCases: [
      'Daraz product images are fetched via URL and stored in Pathao CDN.',
      'Variant mapping may require manual adjustment after import.',
      'Pricing can be imported as-is or adjusted during import.',
    ],
    status: 'live',
    source: 'Product Memo §7.3',
  },
  {
    id: 'product-005',
    feature: 'Product Status & Publishing',
    domain: 'product',
    keywords: ['product status', 'draft', 'active', 'publish product', 'unpublish', 'archive'],
    question: 'What are the product statuses?',
    answer: 'Products have three statuses: Draft (not visible on any channel), Active (visible on selected sales channels), and Archived (hidden everywhere, can be restored). Draft is the default on creation. Activate a product to make it available on selected channels.',
    howItWorks: [
      'Draft: Product exists but not visible anywhere.',
      'Active: Product is live on selected sales channels.',
      'Archived: Product hidden from all channels; can be restored.',
      'Toggle status from product detail page or bulk actions.',
    ],
    edgeCases: [
      'Archiving a product removes it from all active channels.',
      'Draft products still consume SKU uniqueness.',
      'Activating a product with zero stock is allowed but shows "Out of Stock" to customers.',
    ],
    status: 'live',
    source: 'Product Memo §7.3',
  },
  {
    id: 'product-006',
    feature: 'Product Categories',
    domain: 'product',
    keywords: ['categories', 'product category', 'categorize', 'category tree', 'browse category'],
    question: 'How do product categories work?',
    answer: 'Pathao Commerce has a predefined category tree (e.g., Fashion → Men → Shirts). Merchants select the most specific category for each product. Categories affect search discoverability and shipping calculation. Custom categories are not supported.',
    howItWorks: [
      'Categories are predefined by Pathao Commerce.',
      'Merchants select from a dropdown during product creation.',
      'Hierarchical: Level 1 → Level 2 → Level 3.',
      'Most specific category should be selected.',
      'Affects search ranking and shipping rates.',
    ],
    edgeCases: [
      'Custom categories are not supported.',
      'Changing a product category after publishing may affect visibility.',
    ],
    status: 'live',
    source: 'Product Memo §7.3',
  },

  // ── 7.4  Inventory Management ────────────────────────────────────────────
  {
    id: 'inventory-001',
    feature: 'Warehouse-Aware Stock Tracking',
    domain: 'inventory',
    keywords: ['inventory', 'stock', 'warehouse stock', 'stock tracking', 'inventory management'],
    question: 'How does inventory tracking work?',
    answer: 'Inventory is tracked per warehouse. Each product (or variant) has a stock count for each warehouse. When an order is placed, stock is decremented from the assigned warehouse. Stock can be viewed and updated from the Inventory page or from each warehouse detail page.',
    howItWorks: [
      'Each product/variant has stock per warehouse.',
      'Stock is visible on Inventory page (aggregated) and Warehouse Detail (per-warehouse).',
      'Order placement decrements stock from assigned warehouse.',
      'Stock can be manually adjusted from inventory or warehouse views.',
    ],
    steps: [
      'Navigate to Inventory or Warehouse Detail',
      'View stock levels per product/warehouse',
      'Adjust stock manually if needed',
      'Stock auto-decrements on order placement',
    ],
    status: 'live',
    source: 'Product Memo §7.4',
    screenshotIds: ['inventory-001'],
  },
  {
    id: 'inventory-002',
    feature: 'Low Stock Alerts',
    domain: 'inventory',
    keywords: ['low stock', 'out of stock', 'stock alert', 'stock notification', 'reorder'],
    question: 'How do low stock alerts work?',
    answer: 'Merchants can set a low-stock threshold per product. When stock falls below the threshold, a low-stock alert is shown on the dashboard and an optional email notification is sent. The Inventory page highlights low-stock items in yellow and out-of-stock items in red.',
    howItWorks: [
      'Set low-stock threshold on product detail page (default: 5 units).',
      'Dashboard shows low-stock alert banner.',
      'Inventory page highlights: yellow = low stock, red = out of stock.',
      'Optional email notification for low-stock events.',
    ],
    edgeCases: [
      'Default threshold is 5 units if not customized.',
      'Alerts reset when stock is replenished above threshold.',
    ],
    status: 'live',
    source: 'Product Memo §7.4',
  },
  {
    id: 'inventory-003',
    feature: 'Stock Transfer Between Warehouses',
    domain: 'inventory',
    keywords: ['stock transfer', 'transfer stock', 'move inventory', 'warehouse transfer'],
    question: 'Can I transfer stock between warehouses?',
    answer: 'Yes. Navigate to Inventory → Stock Transfer. Select source warehouse, destination warehouse, and product. Enter quantity to transfer. Confirm the transfer. Source warehouse stock decreases and destination warehouse stock increases immediately. No courier movement is triggered — this is an inventory-only adjustment.',
    howItWorks: [
      'Go to Inventory → Stock Transfer.',
      'Select source warehouse.',
      'Select destination warehouse.',
      'Select product and enter quantity.',
      'Confirm — stock is moved instantly.',
    ],
    steps: [
      'Navigate to Inventory → Stock Transfer',
      'Select source warehouse',
      'Select destination warehouse',
      'Choose product and quantity',
      'Confirm transfer',
    ],
    edgeCases: [
      'Transfer is immediate — no transit period.',
      'Cannot transfer more stock than available at source.',
      'Transfer creates an audit log entry.',
    ],
    status: 'live',
    source: 'Product Memo §7.4',
  },
  {
    id: 'inventory-004',
    feature: 'Inventory Sync with Channels',
    domain: 'inventory',
    keywords: ['inventory sync', 'channel sync', 'stock sync', 'multi-channel inventory'],
    question: 'Does inventory sync across sales channels?',
    answer: 'Yes. When stock changes (order, manual adjustment, restock), all connected sales channels are updated in near real-time. This prevents overselling. If a product goes out of stock, it is marked as unavailable on all channels simultaneously.',
    howItWorks: [
      'Stock change triggers sync to all active channels.',
      'Near real-time updates (typically < 30 seconds).',
      'Out-of-stock product marked unavailable everywhere.',
      'Sync works for Pathao Shop, Online Store, and Daraz.',
    ],
    edgeCases: [
      'Channel sync may have slight delays during high traffic.',
      'Manual stock adjustments sync immediately.',
    ],
    status: 'live',
    source: 'Product Memo §7.4',
  },

  // ── 7.5  Sales Channels ─────────────────────────────────────────────────
  {
    id: 'channel-001',
    feature: 'Pathao Shop (Marketplace)',
    domain: 'channels',
    keywords: ['pathao shop', 'marketplace', 'pathao marketplace', 'pathao store'],
    question: 'What is Pathao Shop?',
    answer: 'Pathao Shop is the built-in marketplace within the Pathao app. Merchants list products here and they are discoverable by millions of Pathao users. Products are shown in the "Shop" tab of the Pathao app. Orders come through the Pathao platform.',
    howItWorks: [
      'Products activated for Pathao Shop appear in the Pathao app.',
      'Millions of Pathao users can discover and browse products.',
      'Orders are placed and managed within the Pathao Commerce dashboard.',
      'No additional setup required — activate the channel and list products.',
    ],
    status: 'live',
    source: 'Product Memo §7.5',
  },
  {
    id: 'channel-002',
    feature: 'Daraz Integration',
    domain: 'channels',
    keywords: ['daraz', 'daraz integration', 'daraz channel', 'daraz sync', 'daraz seller'],
    question: 'How does Daraz integration work?',
    answer: 'Connect your Daraz seller account via Add-ons → Daraz Connect. Products can be imported from Daraz and listed on both platforms. Orders from Daraz appear in the unified order management system. Inventory syncs bidirectionally.',
    howItWorks: [
      'Go to Add-ons → Daraz Connect.',
      'Authenticate via Daraz seller portal OAuth.',
      'Import existing Daraz products or create new ones.',
      'Products listed on both Pathao and Daraz.',
      'Orders from both platforms unified in dashboard.',
      'Inventory syncs bidirectionally.',
    ],
    prerequisites: ['Active Daraz seller account'],
    status: 'live',
    source: 'Product Memo §7.5',
  },
  {
    id: 'channel-003',
    feature: 'Online Store',
    domain: 'channels',
    keywords: ['online store', 'ecommerce store', 'website', 'storefront', 'online shop'],
    question: 'What is the Online Store feature?',
    answer: 'Online Store lets merchants create a branded e-commerce website hosted by Pathao. No coding required. Merchants can customize the logo, colors, banners, and domain. Products, checkout, and order management are fully integrated. Published stores are live immediately.',
    howItWorks: [
      'Go to Online Store → Create Store.',
      'Customize: logo, colors, banner images, favicon.',
      'Add products to the store catalog.',
      'Configure payment methods (COD, bKash, card).',
      'Set shipping zones and rates.',
      'Click "Publish" — store is live.',
      'Optional: connect custom domain.',
    ],
    steps: [
      'Navigate to Online Store',
      'Click "Create Store"',
      'Customize branding',
      'Add products',
      'Configure payments and shipping',
      'Publish store',
    ],
    status: 'live',
    source: 'Product Memo §7.10',
  },
  {
    id: 'channel-004',
    feature: 'Social Commerce Channels',
    domain: 'channels',
    keywords: ['social commerce', 'facebook shop', 'instagram shop', 'social media', 'facebook', 'instagram'],
    question: 'Can I sell on social media through Pathao Commerce?',
    answer: 'Yes. Pathao Commerce supports Facebook and Instagram Shop integration via Meta Commerce. Connect your Facebook Business page through Add-ons. Products are synced to Facebook/Instagram shops. Orders from social channels appear in the unified order dashboard.',
    howItWorks: [
      'Go to Add-ons → Facebook Connect.',
      'Authenticate via Facebook Business login.',
      'Select Facebook Business Page to link.',
      'Products sync to Facebook/Instagram Shops.',
      'Orders from social channels appear in Pathao Commerce.',
    ],
    prerequisites: ['Facebook Business Page', 'Instagram Business Account'],
    status: 'live',
    source: 'Product Memo §7.5',
  },

  // ── Screenshot-mapped items ──────────────────────────────────────────────
  {
    id: 'channels-001',
    feature: 'Sales Channel Publishing',
    domain: 'channels',
    keywords: ['publish', 'publishing', 'channel publishing', 'list product'],
    question: 'How do I publish products to sales channels?',
    answer: 'Go to Products, select a product, click "Publish". Choose the channel (Pathao Shop, Daraz, Online Store). Map the product category to the channel category. Set channel-specific pricing if needed. Click "Publish" to list the product.',
    status: 'live',
    source: 'Product Memo §7.5',
    screenshotIds: ['channels-001'],
  },
  {
    id: 'channels-002',
    feature: 'Pathao Shop Setup & Errors',
    domain: 'channels',
    keywords: ['pathao shop error', 'publishing error', 'shop setup'],
    question: 'What do I do if Pathao Shop publishing fails?',
    answer: 'Check the error message on the Pathao Shop page. Common issues: missing payout method, category mapping required, incomplete business profile. Fix the specific error and retry publishing.',
    status: 'live',
    source: 'Product Memo §7.5',
    screenshotIds: ['channels-002'],
  },
  {
    id: 'channels-003',
    feature: 'Daraz Publishing',
    domain: 'channels',
    keywords: ['daraz publish', 'daraz listing', 'publish to daraz'],
    question: 'How do I publish products to Daraz?',
    answer: 'From the product edit page, click "Publish to Daraz". Map the product category to a Daraz category. Set Daraz-specific pricing and attributes. Click "Publish" to list on Daraz.',
    status: 'live',
    source: 'Product Memo §7.5',
    screenshotIds: ['channels-003'],
  },
  {
    id: 'orders-001',
    feature: 'Order Dashboard',
    domain: 'orders',
    keywords: ['order dashboard', 'order management', 'view orders', 'order list', ...instantCheckoutOrderWorkflow.keywords],
    question: 'Where do I see all my orders?',
    answer: `Go to Orders in the sidebar. ${formatList(newOrderSourceLabels)} orders start in New Orders. ${formatList(processingSourceLabels)} orders start in Processing. Use the status tabs, filters, order ID, or customer phone number to find an order.`,
    status: 'live',
    source: 'Product Memo §7.7',
    screenshotIds: ['orders-001'],
  },
  {
    id: 'chats-001',
    feature: 'Unified Inbox',
    domain: 'chats',
    keywords: ['unified inbox', 'inbox', 'chat inbox', 'messages'],
    question: 'What is the Unified Inbox?',
    answer: 'The Unified Inbox consolidates messages from all connected channels (Facebook Messenger, WhatsApp, Instagram DMs) into one place. Merchants can read, reply, and create orders directly from conversations.',
    status: 'live',
    source: 'Product Memo §7.9',
    screenshotIds: ['chats-001'],
  },
  {
    id: 'chats-002',
    feature: 'Chat-to-Order',
    domain: 'chats',
    keywords: ['chat to order', 'create order from chat', 'order from message'],
    question: 'Can I create an order from a chat conversation?',
    answer: 'Yes. In any chat conversation, click "Create Order". Select products discussed, set quantities, confirm delivery details from the conversation, and submit. The order is created with customer info pre-filled from the chat.',
    status: 'live',
    source: 'Product Memo §7.9',
    screenshotIds: ['chats-002'],
  },
  {
    id: 'chats-003',
    feature: 'Customer Context & History',
    domain: 'chats',
    keywords: ['customer history', 'customer context', 'order history', 'customer profile'],
    question: 'Can I see customer history in chats?',
    answer: 'Yes. The right sidebar in any chat shows customer context: saved address, past orders, order status, and customer rating from Pathao Courier lifetime orders. This helps provide personalized support.',
    status: 'live',
    source: 'Product Memo §7.9',
    screenshotIds: ['chats-003'],
  },
  {
    id: 'chats-004',
    feature: 'Quick Actions & Presets',
    domain: 'chats',
    keywords: ['quick actions', 'preset messages', 'quick replies', 'saved replies'],
    question: 'What are Quick Actions in chats?',
    answer: 'Quick Actions are preset messages and shortcuts in the chat interface. Merchants can save common responses, create new orders, or generate Instant Checkout links directly from the chat cart icon.',
    status: 'live',
    source: 'Product Memo §7.9',
    screenshotIds: ['chats-004'],
  },
  {
    id: 'addons-001',
    feature: 'Connection Hub',
    domain: 'addons',
    keywords: ['connection hub', 'add-ons', 'integrations', 'connect channel'],
    question: 'What is the Connection Hub?',
    answer: 'The Connection Hub (Add-ons) is where merchants connect external channels: Facebook, WhatsApp, Daraz, and other sales platforms. Each connection has its own authentication flow and settings.',
    status: 'live',
    source: 'Product Memo §7.12',
    screenshotIds: ['addons-001'],
  },
  {
    id: 'addons-facebook',
    feature: 'Facebook Messenger Integration',
    domain: 'addons',
    keywords: ['facebook connect', 'messenger', 'facebook integration', 'connect facebook'],
    question: 'How do I connect Facebook Messenger?',
    answer: 'Go to Add-ons → Facebook Connect. Click "Connect with Meta" to authenticate. Select your Facebook Business Page. Grant required permissions. Once connected, Facebook messages appear in the Unified Inbox.',
    status: 'live',
    source: 'Product Memo §7.12',
    screenshotIds: ['addons-facebook'],
  },
  {
    id: 'addons-whatsapp-quick',
    feature: 'WhatsApp Quick Connect',
    domain: 'addons',
    keywords: ['whatsapp quick connect', 'whatsapp setup', 'connect whatsapp'],
    question: 'How do I connect WhatsApp via Quick Connect?',
    answer: 'Go to Add-ons → WhatsApp → Quick Connect. Click "Connect with Meta". Select your Business Portfolio and WhatsApp Business App. Scan the QR code. Choose phone numbers to connect. The connection is established automatically.',
    status: 'live',
    source: 'Product Memo §7.12',
    screenshotIds: ['addons-whatsapp-quick'],
  },
  {
    id: 'addons-whatsapp-manual',
    feature: 'WhatsApp Manual Setup',
    domain: 'addons',
    keywords: ['whatsapp manual', 'waba id', 'manual whatsapp setup'],
    question: 'How do I connect WhatsApp via Manual Setup?',
    answer: 'Go to Add-ons → WhatsApp → Manual Setup. Enter your Partner ID and Business Account ID (WABA ID). Find phone numbers and continue the connection. This method is for advanced users who already have a WABA ID.',
    status: 'live',
    source: 'Product Memo §7.12',
    screenshotIds: ['addons-whatsapp-manual'],
  },
  {
    id: 'addons-daraz',
    feature: 'Daraz Connection',
    domain: 'addons',
    keywords: ['daraz connect', 'daraz connection', 'connect daraz'],
    question: 'How do I connect my Daraz account?',
    answer: 'Go to Add-ons → Daraz Connect. Select the warehouse to use for Daraz orders. Click "Connect to Daraz" and log in to your Daraz Seller Center. The connection is established and you can start importing products.',
    status: 'live',
    source: 'Product Memo §7.12',
    screenshotIds: ['addons-daraz'],
  },
  {
    id: 'daraz-001',
    feature: 'Daraz Product Import',
    domain: 'product',
    keywords: ['daraz import', 'import from daraz', 'daraz products'],
    question: 'How do I import products from Daraz?',
    answer: 'Go to Products → Daraz Import. The system fetches your Daraz products. Map Daraz categories to Commerce categories. Select products to import. After validation, products appear in your Commerce catalog.',
    status: 'live',
    source: 'Product Memo §7.4',
    screenshotIds: ['daraz-001'],
  },

  // ── 7.6  Instant Checkout ────────────────────────────────────────────────
  {
    id: 'checkout-001',
    feature: 'Instant Checkout Link Generation',
    domain: 'checkout',
    keywords: ['instant checkout', 'checkout link', 'payment link', 'shareable link', 'checkout url'],
    question: 'What is Instant Checkout?',
    answer: 'Instant Checkout generates a unique, shareable link for a specific product or cart. Merchants share the link via WhatsApp, Facebook Messenger, SMS, or any channel. The customer clicks the link, sees the product/cart, enters delivery info, and places the order. No website or online store needed.',
    howItWorks: [
      'Merchant selects product(s) and generates a checkout link.',
      'System creates a unique URL with product, price, and delivery context.',
      'Merchant shares link via any messaging channel.',
      'Customer clicks link → sees product page → enters delivery details.',
      'Customer places order → order appears in Pathao Commerce dashboard.',
    ],
    steps: [
      'Go to Instant Checkout page',
      'Select product(s)',
      'Click "Generate Link"',
      'Copy the generated link',
      'Share via WhatsApp, Messenger, SMS, etc.',
      'Customer clicks, fills details, places order',
    ],
    status: 'live',
    source: 'Product Memo §7.6',
    screenshotIds: ['checkout-001'],
  },
  {
    id: 'checkout-002',
    feature: 'Checkout Link Sharing',
    domain: 'checkout',
    keywords: ['share link', 'share checkout', 'whatsapp checkout', 'messenger checkout'],
    question: 'How do I share a checkout link?',
    answer: 'After generating an Instant Checkout link, click the share icon. Choose from WhatsApp, Facebook Messenger, copy to clipboard, or SMS. The link includes product details, pricing, and the merchant\'s branding. Merchants can also create QR codes for physical sharing.',
    howItWorks: [
      'After generating link, click share icon.',
      'Options: WhatsApp, Messenger, Copy Link, SMS.',
      'Link includes product info and merchant branding.',
      'QR code generation available for print/physical sharing.',
    ],
    status: 'live',
    source: 'Product Memo §7.6',
  },
  {
    id: 'checkout-003',
    feature: 'Checkout Link Order Processing',
    domain: 'checkout',
    keywords: ['checkout order', 'link order', 'instant order', 'checkout process', ...instantCheckoutOrderWorkflow.keywords],
    question: 'What happens when a customer places an order via a checkout link?',
    answer: `After the customer completes an Instant Checkout order, it appears under Orders → ${instantCheckoutOrderSource.firstTab}. It bypasses New Orders. ${instantCheckoutOrderSource.merchantAction} ${instantCheckoutOrderSource.fulfillment}`,
    howItWorks: [
      'Customer completes the shared Instant Checkout link.',
      'The order is created in the Commerce Orders dashboard.',
      'The order appears first in Processing, not New Orders.',
      'No merchant accept or Ready to Ship action is required.',
      'The order is sent directly to Pathao Courier.',
    ],
    edgeCases: [
      'If product goes out of stock during checkout, customer sees "Out of Stock" message.',
      'Multiple checkout links can be created for the same product.',
    ],
    status: 'live',
    source: 'Product Memo §7.6',
  },

  // ── 7.7  Order Management ────────────────────────────────────────────────
  {
    id: 'order-001',
    feature: 'Unified Order Dashboard',
    domain: 'orders',
    keywords: ['orders', 'order management', 'order dashboard', 'order list', 'view orders'],
    question: 'Where can I see all my orders?',
    answer: 'All orders from all sales channels appear in a single Orders dashboard. Orders are filterable by status, channel, date range, and search term. Each order shows customer info, products, payment method, delivery status, and fulfillment timeline.',
    howItWorks: [
      'Orders page shows all orders from all channels.',
      'Filter by: status, channel, date range.',
      'Search by: order ID, customer name, phone.',
      'Sort by: date, status, amount.',
      'Expand order for full details.',
    ],
    steps: [
      'Navigate to Orders in sidebar',
      'View unified order list',
      'Filter or search as needed',
      'Click order to view details',
    ],
    status: 'live',
    source: 'Product Memo §7.7',
  },
  {
    id: 'order-002',
    feature: 'Order Sources',
    domain: 'orders',
    keywords: ['order source', 'order channel', ...standardOrderSources.map(({ label }) => `${label.toLowerCase()} order`), ...instantCheckoutOrderWorkflow.keywords],
    question: 'What are the different order sources?',
    answer: `Orders from every source are unified in the Orders dashboard, but they enter different status tabs. ${formatList(newOrderSourceLabels)} orders start in New Orders. ${formatList(processingSourceLabels)} orders start in Processing.`,
    howItWorks: standardOrderSources.map(({ label, firstTab, merchantAction, fulfillment }) =>
      `${label}: starts in ${firstTab}. ${merchantAction} ${fulfillment}`,
    ),
    status: 'live',
    source: 'Product Memo §7.7',
  },
  {
    id: 'order-003',
    feature: 'Order Statuses',
    domain: 'orders',
    keywords: ['order status', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    question: 'What are the order statuses?',
    answer: 'Order statuses: Pending (new, not yet processed), Confirmed (merchant acknowledged), Processing (being prepared), Shipped (picked up by courier), In Transit (on the way), Delivered (completed), Cancelled (by merchant or customer), Returned (sent back). Statuses update automatically based on courier tracking and merchant actions.',
    howItWorks: [
      'Pending → Confirmed → Processing → Shipped → In Transit → Delivered.',
      'Cancelled can happen at any stage before delivery.',
      'Returned occurs after delivery if customer returns.',
      'Status updates are triggered by merchant actions and courier tracking.',
    ],
    edgeCases: [
      'Auto-cancellation occurs if order remains Pending for 72 hours.',
      'Partial cancellation is not supported — full order cancellation only.',
    ],
    status: 'live',
    source: 'Product Memo §7.7',
  },
  {
    id: 'order-004',
    feature: 'Order Fulfillment',
    domain: 'orders',
    keywords: ['fulfill order', 'process order', 'ship order', 'dispatch', 'pack order'],
    question: 'How do I fulfill an order?',
    answer: 'Click on an order → click "Confirm" to acknowledge it → click "Process" when preparing → click "Ship" to assign courier and generate parcel. The system auto-assigns the nearest warehouse with stock. Merchant can manually select a different warehouse if needed.',
    howItWorks: [
      'Click order → Confirm → Process → Ship.',
      'System auto-assigns warehouse with available stock.',
      'Merchant can override warehouse selection.',
      'On "Ship", courier is assigned and parcel is created.',
      'Tracking info becomes available to customer.',
    ],
    steps: [
      'Open order from Orders page',
      'Click "Confirm" to acknowledge',
      'Click "Process" when preparing',
      'Select/confirm warehouse',
      'Click "Ship" to dispatch',
    ],
    status: 'live',
    source: 'Product Memo §7.7',
  },
  {
    id: 'order-005',
    feature: 'Manual Order Creation',
    domain: 'orders',
    keywords: ['manual order', 'create order', 'phone order', 'direct order', 'add order manually'],
    question: 'Can I create an order manually?',
    answer: 'Yes. Go to Orders → Create Order. Select or add customer, add products, set quantities, choose warehouse, select payment method, and confirm. This is useful for phone orders or walk-in customers not using online channels.',
    howItWorks: [
      'Go to Orders → Create Order.',
      'Select existing customer or add new one.',
      'Add products with quantities.',
      'Select fulfillment warehouse.',
      'Choose payment method (COD, bKash, etc.).',
      'Confirm — order is created.',
    ],
    status: 'live',
    source: 'Product Memo §7.7',
  },

  // ── 7.9  Instant Delivery ───────────────────────────────────────────────
  {
    id: 'delivery-001',
    feature: 'Instant Delivery Overview',
    domain: 'delivery',
    keywords: ['instant delivery', 'express delivery', 'same day delivery', 'fast delivery', 'quick delivery'],
    question: 'What is Instant Delivery?',
    answer: 'Instant Delivery is a separate Commerce module for merchants who need same-city Instant, 4-Hour, or Same-Day delivery where available. Its order flow is separate from normal Online Store, Pathao Shop, and Instant Checkout order management.',
    howItWorks: [
      'Open the Instant Delivery page.',
      'Complete or skip the first-time business information form.',
      'Create a parcel order with pickup, recipient, delivery, parcel, and payer details.',
      'Review the delivery charge and order details before submitting.',
    ],
    status: 'live',
    source: 'Product Memo §7.9',
    screenshotIds: ['delivery-001'],
  },
  {
    id: 'delivery-002',
    feature: 'Instant Delivery API',
    domain: 'delivery',
    keywords: ['instant delivery api', 'api integration', 'developer api', 'delivery api', 'webhook', 'callback url', 'client id', 'client secret', 'access token'],
    question: 'How do I use the Instant Delivery API and configure its webhook?',
    answer: 'Open Developer API from the Instant Delivery page. The credentials area provides a Client ID, Client Secret, and access token. Under Webhook Integration, enter the Callback URL and Secret, then update the webhook.',
    howItWorks: [
      'Open Instant Delivery and select Developer API.',
      'Generate or review the Client ID, Client Secret, and access token.',
      'Open Webhook Integration.',
      'Enter the Callback URL and Secret, then update the webhook.',
      'Never share the Client Secret or access token with support.',
    ],
    status: 'live',
    source: 'Product Memo §7.9',
    screenshotIds: ['delivery-003'],
  },
  {
    id: 'delivery-005',
    feature: 'Instant Delivery Order Flow',
    domain: 'delivery',
    keywords: ['instant delivery order', 'create instant order', 'instant delivery form'],
    question: 'How do I create an Instant Delivery order?',
    answer: 'Open Create Order in Instant Delivery. Enter the delivery type, pickup, recipient, delivery, parcel, and payer/POD details. Review the delivery charge and order details, then submit the parcel order.',
    steps: [
      'Open Instant Delivery and select Create Order',
      'Choose the delivery type',
      'Enter pickup, recipient, and delivery details',
      'Add parcel size, weight, or photo where applicable',
      'Choose who pays and complete the available POD fields',
      'Review the charge and submit the parcel order',
    ],
    status: 'live',
    source: 'Product Memo §7.9',
    screenshotIds: ['delivery-002'],
  },
  {
    id: 'delivery-003',
    feature: 'Instant Delivery POD and payer rules',
    domain: 'delivery',
    keywords: ['pod', 'amount to collect', 'receiver pays', 'sender pays', 'bkash', 'collection'],
    question: 'When is POD available for Instant Delivery?',
    answer: 'POD is available when the receiver is selected as payer, subject to service conditions. When the sender pays, POD is unavailable and the Item Value field is shown instead.',
    howItWorks: [
      'Select Receiver as payer to use Amount to Collect.',
      'Enter the amount to show the bKash number field.',
      'The saved bKash number is reused; a new entry replaces it.',
      'Turning collection off hides POD fields and shows Item Value.',
      'Selecting Sender as payer shows Item Value without POD.',
    ],
    edgeCases: [
      'The Product Memo does not define an exact POD settlement timeline.',
    ],
    status: 'live',
    source: 'Product Memo §7.9',
  },

  // ── 7.9  Online Store (Detailed) ────────────────────────────────────────
  {
    id: 'store-001',
    feature: 'Online Store Creation',
    domain: 'store',
    keywords: ['create store', 'online store setup', 'store creation', 'build store', 'store builder'],
    question: 'How do I create my online store?',
    answer: 'Go to Online Store → Create Store. Choose a template (minimal, modern, bold). Set store name and tagline. The store is created in "Draft" mode. Customize branding (logo, colors, fonts), add pages (About, Contact), configure payment and shipping, then publish.',
    howItWorks: [
      'Navigate to Online Store → Create Store.',
      'Choose from 3 templates: Minimal, Modern, Bold.',
      'Set store name, tagline, and URL slug.',
      'Store created in "Draft" — not yet public.',
      'Customize branding, pages, payment, shipping.',
      'Publish when ready.',
    ],
    steps: [
      'Go to Online Store → Create Store',
      'Select template',
      'Set store name and tagline',
      'Customize branding',
      'Add pages',
      'Configure payment and shipping',
      'Publish',
    ],
    status: 'live',
    source: 'Product Memo §7.10',
    screenshotIds: ['store-001'],
  },
  {
    id: 'store-002',
    feature: 'Online Store Branding',
    domain: 'store',
    keywords: ['store branding', 'store logo', 'store colors', 'store customization', 'store design'],
    question: 'How do I customize my online store\'s look?',
    answer: 'Navigate to Online Store → Store Settings → Branding. Upload your logo (recommended: 200×50px SVG or PNG). Set primary and accent colors. Upload banner images (recommended: 1200×400px). Choose font pairing. Preview changes in real-time before publishing.',
    howItWorks: [
      'Go to Online Store → Store Settings → Branding.',
      'Upload logo (SVG/PNG, 200×50px recommended).',
      'Set primary color and accent color.',
      'Upload banner images (1200×400px recommended).',
      'Select from 4 font pairings.',
      'Live preview available before publishing.',
    ],
    status: 'live',
    source: 'Product Memo §7.10',
    screenshotIds: ['store-001'],
  },
  {
    id: 'store-003',
    feature: 'Online Store Publishing',
    domain: 'store',
    keywords: ['publish store', 'store live', 'store domain', 'custom domain', 'store url'],
    question: 'How do I publish my online store?',
    answer: 'Click "Publish" in Online Store settings. The store is assigned a default URL: {store-slug}.pathao.shop. Optional: connect a custom domain (CNAME setup required). Store goes live immediately after publishing. Products marked as "Active" and assigned to Online Store channel appear in the store.',
    howItWorks: [
      'Click "Publish" in Online Store settings.',
      'Default URL: {store-slug}.pathao.shop.',
      'Optional: connect custom domain via CNAME.',
      'Store goes live immediately.',
      'Active products assigned to Online Store appear.',
    ],
    edgeCases: [
      'Custom domain requires CNAME record pointing to Pathao.',
      'SSL is auto-provisioned for custom domains.',
      'Store can be unpublished and republished anytime.',
    ],
    status: 'live',
    source: 'Product Memo §7.10',
  },
  {
    id: 'store-004',
    feature: 'Online Store Analytics',
    domain: 'store',
    keywords: ['store analytics', 'store traffic', 'visitor analytics', 'conversion rate', 'store stats'],
    question: 'Can I see analytics for my online store?',
    answer: 'Yes. Online Store → Analytics shows: visitor count, page views, conversion rate, top products, traffic sources, and revenue over time. Data refreshes hourly. No additional tracking code is needed — analytics are built-in.',
    howItWorks: [
      'Go to Online Store → Analytics.',
      'Metrics: visitors, page views, conversion rate, revenue.',
      'Filters: date range, product, traffic source.',
      'Data refreshes hourly.',
      'No additional tracking code needed.',
    ],
    status: 'live',
    source: 'Product Memo §7.10',
    screenshotIds: ['store-analytics'],
  },
  {
    id: 'catalogue-001',
    feature: adCatalogueWorkflow.feature,
    domain: adCatalogueWorkflow.domain,
    keywords: adCatalogueWorkflow.keywords,
    question: adCatalogueWorkflow.question,
    answer: adCatalogueWorkflow.answer,
    prerequisites: adCatalogueWorkflow.prerequisites,
    steps: adCatalogueWorkflow.steps,
    status: 'live',
    source: adCatalogueWorkflow.source,
    screenshotIds: [...new Set(adCatalogueWorkflow.screenshots.map(({ featureId }) => featureId))],
  },

  // ── 7.11  Chats (Facebook Messenger, WhatsApp, Unified Inbox) ────────────
  {
    id: 'chat-001',
    feature: 'Facebook Messenger Integration',
    domain: 'chats',
    keywords: ['facebook chat', 'messenger', 'facebook messenger', 'fb chat', 'messenger integration'],
    question: 'How does Facebook Messenger integration work?',
    answer: 'Connect your Facebook Business Page via Add-ons → Facebook Connect. All Messenger conversations appear in the Pathao Commerce unified inbox. Merchants can reply directly from the dashboard. Chat-to-order is supported — convert a conversation into an order with one click.',
    howItWorks: [
      'Go to Add-ons → Facebook Connect.',
      'Authenticate Facebook Business login.',
      'Select Business Page to connect.',
      'Messenger conversations appear in unified inbox.',
      'Reply directly from dashboard.',
      'Convert chats to orders.',
    ],
    prerequisites: ['Facebook Business Page', 'Admin access to the page'],
    status: 'live',
    source: 'Product Memo §7.11',
  },
  {
    id: 'chat-002',
    feature: 'WhatsApp Integration',
    domain: 'chats',
    keywords: ['whatsapp', 'whatsapp chat', 'whatsapp integration', 'whatsapp business', 'wa chat'],
    question: 'How does WhatsApp integration work?',
    answer: 'Connect WhatsApp Business via Add-ons → WhatsApp Connect. Uses the WhatsApp Business API. All WhatsApp messages appear in the unified inbox. Supports text, images, and documents. Chat-to-order conversion is available.',
    howItWorks: [
      'Go to Add-ons → WhatsApp Connect.',
      'Complete WhatsApp Business API verification.',
      'Link WhatsApp Business phone number.',
      'Messages appear in unified inbox.',
      'Reply directly from dashboard.',
    ],
    prerequisites: ['WhatsApp Business account', 'Verified WhatsApp Business API'],
    status: 'live',
    source: 'Product Memo §7.11',
  },
  {
    id: 'chat-003',
    feature: 'Unified Inbox',
    domain: 'chats',
    keywords: ['unified inbox', 'inbox', 'all chats', 'chat inbox', 'message inbox'],
    question: 'What is the Unified Inbox?',
    answer: 'The Unified Inbox consolidates all conversations from connected channels (Facebook Messenger, WhatsApp, and future channels) into a single view. Merchants can filter by channel, search conversations, and respond without switching between platforms.',
    howItWorks: [
      'All connected channel conversations in one inbox.',
      'Filter by: Facebook, WhatsApp, or All.',
      'Search by customer name, phone, or message content.',
      'Real-time message sync.',
      'Unified conversation timeline per customer.',
    ],
    status: 'live',
    source: 'Product Memo §7.11',
  },
  {
    id: 'chat-004',
    feature: 'Chat-to-Order Conversion',
    domain: 'chats',
    keywords: ['chat to order', 'convert chat', 'order from chat', 'create order from chat'],
    question: 'How do I create an order from a chat?',
    answer: 'In any chat conversation, click the "Create Order" button. Select products discussed, set quantities, confirm delivery details from the conversation, and submit. The order is created with the customer\'s info pre-filled from the chat context.',
    howItWorks: [
      'Open chat conversation.',
      'Click "Create Order" button.',
      'Select products and quantities.',
      'Customer info pre-filled from chat.',
      'Confirm delivery details.',
      'Submit — order created in dashboard.',
    ],
    steps: [
      'Open chat conversation',
      'Click "Create Order"',
      'Select products',
      'Confirm quantities and pricing',
      'Verify delivery details',
      'Submit order',
    ],
    status: 'live',
    source: 'Product Memo §7.11',
  },

  // ── 7.12  Add-ons & Integrations ─────────────────────────────────────────
  {
    id: 'addon-001',
    feature: 'Connection Hub',
    domain: 'integrations',
    keywords: ['connection hub', 'add-ons', 'integrations', 'connect apps', 'third party'],
    question: 'What is the Connection Hub?',
    answer: 'The Connection Hub (Add-ons page) is where merchants manage all third-party integrations. Available connections: Pathao Courier (auto-connected), Daraz Connect, Facebook Connect, WhatsApp Connect, Meta Commerce, and API access. Each connection has its own setup flow and settings.',
    howItWorks: [
      'Navigate to Add-ons in sidebar.',
      'View all available connections.',
      'Each connection shows status (Connected/Disconnected).',
      'Click to set up or manage.',
      'Connection details and settings per integration.',
    ],
    status: 'live',
    source: 'Product Memo §7.12',
  },
  {
    id: 'addon-002',
    feature: 'Daraz Connect (Auth)',
    domain: 'integrations',
    keywords: ['daraz connect', 'daraz auth', 'daraz oauth', 'daraz integration setup'],
    question: 'How do I connect my Daraz seller account?',
    answer: 'Go to Add-ons → Daraz Connect → Connect. You are redirected to the Daraz seller portal for OAuth authentication. Authorize Pathao Commerce. Once connected, you can import products and sync orders. Re-authentication may be required periodically.',
    howItWorks: [
      'Go to Add-ons → Daraz Connect.',
      'Click "Connect".',
      'Redirected to Daraz seller portal.',
      'Complete OAuth authorization.',
      'Connected — can import products and sync orders.',
    ],
    prerequisites: ['Active Daraz seller account'],
    edgeCases: [
      'Daraz OAuth tokens expire periodically; re-auth may be needed.',
      'If connection fails, check Daraz seller account status.',
    ],
    status: 'live',
    source: 'Product Memo §7.12',
  },
  {
    id: 'addon-003',
    feature: 'Meta Commerce (Facebook & Instagram Shops)',
    domain: 'integrations',
    keywords: ['meta commerce', 'facebook shop', 'instagram shop', 'meta integration', 'facebook commerce'],
    question: 'How do I set up Meta Commerce?',
    answer: 'Go to Add-ons → Facebook Connect → Meta Commerce. Authenticate with your Facebook Business account. Select your Facebook Business Page and Instagram Business account. Products sync to Facebook/Instagram Shops. Orders from Meta platforms appear in your dashboard.',
    howItWorks: [
      'Go to Add-ons → Facebook Connect → Meta Commerce.',
      'Authenticate with Facebook Business credentials.',
      'Select Facebook Business Page.',
      'Link Instagram Business account (optional).',
      'Products sync to Facebook/Instagram Shops.',
    ],
    prerequisites: ['Facebook Business Page', 'Instagram Business Account (optional)'],
    status: 'live',
    source: 'Product Memo §7.12',
  },

  // ── 7.13  Finance ────────────────────────────────────────────────────────
  {
    id: 'finance-001',
    feature: 'Invoice Management',
    domain: 'finance',
    keywords: ['invoice', 'invoices', 'billing', 'invoice list', 'view invoices'],
    question: 'Where can I see my invoices?',
    answer: 'Open Finance to view payment and invoice information from Commerce and connected sales channels. Open the relevant invoice to review its details, then download it where that action is available.',
    howItWorks: [
      'Open Finance.',
      'Find the payment or invoice under Commerce or its connected sales channel.',
      'Open the invoice details.',
      'Download the invoice where available.',
    ],
    status: 'live',
    source: 'Product Memo §7.13',
    screenshotIds: ['finance-001'],
  },
  {
    id: 'finance-002',
    feature: 'Payout Tracking',
    domain: 'finance',
    keywords: ['payout', 'settlement', 'payout tracking', 'payment settlement', 'receive payment'],
    question: 'How do payouts work?',
    answer: 'Finance shows received payments based on the merchant\'s configured payout method. The Product Memo does not define an exact settlement or release timeline, so confirm the current policy with Finance before promising a date.',
    howItWorks: [
      'Confirm that a payout method is configured.',
      'Open Finance and locate the relevant payment or invoice.',
      'Check the order source and connected channel.',
      'Confirm the current settlement policy with Finance if release timing is unclear.',
    ],
    edgeCases: [
      'Payment release can remain blocked when required payout information is missing.',
      'Do not promise a release date that Finance has not confirmed.',
    ],
    status: 'live',
    source: 'Product Memo §7.13',
  },
  {
    id: 'finance-003',
    feature: 'Finance Dashboard',
    domain: 'finance',
    keywords: ['finance dashboard', 'revenue', 'earnings', 'financial overview', 'sales summary'],
    question: 'What does the Finance Dashboard show?',
    answer: 'Finance provides a unified view of payment and invoice information from Commerce and connected sales channels, including Pathao Shop and Daraz where applicable. Merchants can open details and download invoices where available.',
    howItWorks: [
      'Open Finance.',
      'Review Commerce and connected-channel payment information.',
      'Open invoice details as needed.',
      'Download an available invoice or report an issue from its detail view.',
    ],
    status: 'live',
    source: 'Product Memo §7.13',
  },

  // ── 7.14  Media Gallery ──────────────────────────────────────────────────
  {
    id: 'media-001',
    feature: 'Media Gallery Upload',
    domain: 'media',
    keywords: ['media gallery', 'upload image', 'upload media', 'image upload', 'media upload'],
    question: 'How does the Media Gallery work?',
    answer: 'Media Gallery is a reusable image library. Upload an image there or through a product or Online Store flow, then reuse it, crop it where needed, link it to a Commerce product, or copy its CDN link.',
    howItWorks: [
      'Open Media Gallery.',
      'Upload an image or select one saved from a product or Online Store flow.',
      'Crop the image where needed.',
      'Reuse it, link it to a product, or copy its CDN link.',
    ],
    steps: [
      'Navigate to Media Gallery',
      'Click "Upload" or drag-and-drop',
      'Select images from device',
      'Wait for upload to complete',
      'Use image in products or store',
    ],
    status: 'live',
    source: 'Product Memo §7.14',
    screenshotIds: ['media-001'],
  },
  {
    id: 'media-002',
    feature: 'Image Cropping & Optimization',
    domain: 'media',
    keywords: ['image crop', 'crop image', 'image resize', 'optimize image', 'image edit'],
    question: 'Can I crop or resize images in the Media Gallery?',
    answer: 'Yes. The Media Gallery provides an image crop action. The Product Memo confirms cropping but does not specify resize presets, rotation, compression, or file-size limits.',
    howItWorks: [
      'Open the image in Media Gallery.',
      'Choose the crop action.',
      'Apply the available crop and continue with the supported workflow.',
    ],
    status: 'live',
    source: 'Product Memo §7.14',
  },
  {
    id: 'media-003',
    feature: 'CDN Links & Product Linking',
    domain: 'media',
    keywords: ['cdn link', 'image url', 'copy url', 'product image', 'link image to product'],
    question: 'How do I link images to products?',
    answer: 'Open an image in Media Gallery and use Link image to uploaded product in Commerce. You can also copy its CDN link for supported workflows such as bulk CSV or XLSX upload. Images uploaded during product or Online Store creation are saved in the gallery for reuse.',
    howItWorks: [
      'Open the image in Media Gallery.',
      'Choose Link image to uploaded product in Commerce.',
      'Select the relevant product.',
      'Use Copy CDN link when a supported upload workflow needs the URL.',
    ],
    edgeCases: [
      'If an image is missing, check whether it was uploaded, selected from Gallery, or linked to the product.',
    ],
    status: 'live',
    source: 'Product Memo §7.14',
  },

  // ── Additional Cross-Cutting Knowledge ──────────────────────────────────
  {
    id: 'general-001',
    feature: 'Pathao Commerce Platform Overview',
    domain: 'signup',
    keywords: ['pathao commerce', 'platform', 'overview', 'what is pathao commerce', 'merchant platform'],
    question: 'What is Pathao Commerce?',
    answer: 'Pathao Commerce is a unified merchant operating platform that enables businesses to sell across multiple channels — Pathao Shop (in-app marketplace), Online Store (hosted website), Daraz, and social media. It provides order management, inventory tracking, delivery (via Pathao Courier and Instant Delivery), finance tracking, and customer engagement tools all in one dashboard.',
    howItWorks: [
      'Single dashboard for all sales channels.',
      'Unified order management from all sources.',
      'Warehouse-aware inventory tracking.',
      'Integrated delivery via Pathao Courier and Instant Delivery.',
      'Finance and payout tracking.',
      'Customer engagement via chats.',
    ],
    status: 'live',
    source: 'Product Memo §7.0',
  },
  {
    id: 'general-002',
    feature: 'Dashboard Navigation',
    domain: 'signup',
    keywords: ['dashboard', 'navigation', 'sidebar', 'menu', 'navigate', 'sidebar menu'],
    question: 'How is the dashboard organized?',
    answer: 'The dashboard has a left sidebar with sections: Home (overview), Orders, Products, Inventory, Warehouses, Online Store, Media Gallery, Instant Delivery, Finance, Chats, Add-ons, and Settings. The top bar shows notifications, search, and profile. Each section has sub-pages for detailed views.',
    howItWorks: [
      'Left sidebar: main navigation.',
      'Sections: Home, Orders, Products, Inventory, Warehouses, Online Store, Media, Instant Delivery, Finance, Chats, Add-ons, Settings.',
      'Top bar: notifications, search, profile.',
      'Each section has sub-pages.',
    ],
    status: 'live',
    source: 'Product Memo §7.0',
  },
  {
    id: 'general-003',
    feature: 'Order Processing Workflow',
    domain: 'orders',
    keywords: ['order workflow', 'order process', 'fulfillment workflow', 'order steps'],
    question: 'What is the standard order processing workflow?',
    answer: 'Standard workflow: Order received (Pending) → Merchant confirms (Confirmed) → Merchant processes/prepares (Processing) → Courier assigned and picked up (Shipped) → In transit → Delivered. Each step can include manual merchant actions and automated status updates from courier tracking.',
    howItWorks: [
      '1. Order received → "Pending" status.',
      '2. Merchant confirms → "Confirmed".',
      '3. Merchant prepares → "Processing".',
      '4. Courier assigned → "Shipped".',
      '5. In transit (auto-updated by courier).',
      '6. Delivered (auto or manual confirmation).',
    ],
    status: 'live',
    source: 'Product Memo §7.7',
  },
  {
    id: 'general-004',
    feature: 'Payment Methods Supported',
    domain: 'finance',
    keywords: ['payment method', 'cod', 'bkash', 'card payment', 'online payment', 'payment option'],
    question: 'What payment methods are supported?',
    answer: 'Pathao Commerce supports: Cash on Delivery (COD), bKash, Nagad, and card payments (Visa/Mastercard). Payment methods vary by channel. Online Store supports all methods. Pathao Shop and Checkout links primarily support COD. Instant Delivery supports COD only.',
    howItWorks: [
      'COD: Supported on all channels.',
      'bKash: Online Store, Checkout links.',
      'Nagad: Online Store, Checkout links.',
      'Card (Visa/Mastercard): Online Store, Checkout links.',
    ],
    edgeCases: [
      'Payment method availability may vary by channel.',
      'COD is the default for Pathao Shop and Instant Delivery.',
    ],
    status: 'live',
    source: 'Product Memo §7.13',
  },
  {
    id: 'general-005',
    feature: 'Customer Management',
    domain: 'orders',
    keywords: ['customer', 'customer list', 'customer management', 'customer detail', 'crm'],
    question: 'Can I manage my customers?',
    answer: 'Yes. Navigate to Customers in the sidebar. The customer list shows all customers who have placed orders. Click a customer to view: contact info, order history, total spend, and last order date. Customers are automatically created when orders are placed. Manual customer creation is available for phone/walk-in orders.',
    howItWorks: [
      'Go to Customers in sidebar.',
      'List shows: name, phone, email, total orders, total spend.',
      'Click customer for detail view.',
      'Detail: contact info, order history, timeline.',
      'Customers auto-created from orders.',
    ],
    status: 'live',
    source: 'Product Memo §7.7',
  },
  {
    id: 'general-006',
    feature: 'Notifications',
    domain: 'signup',
    keywords: ['notifications', 'alert', 'notification', 'bell icon', 'notification center'],
    question: 'How do notifications work?',
    answer: 'The notification bell icon in the top bar shows real-time alerts. Types: new order, order status change, low stock, warehouse approval, payout processed. Merchants can configure email notification preferences in Settings → Notifications.',
    howItWorks: [
      'Bell icon shows unread notification count.',
      'Click to view notification center.',
      'Types: new order, status change, low stock, payout, warehouse.',
      'Email notifications configurable in Settings.',
    ],
    status: 'live',
    source: 'Product Memo §7.0',
  },
  {
    id: 'general-007',
    feature: 'Settings & Profile',
    domain: 'signup',
    keywords: ['settings', 'profile', 'account settings', 'business settings', 'merchant profile'],
    question: 'Where can I update my business settings?',
    answer: 'Navigate to Settings in the sidebar. Settings sections: Profile (business name, contact, logo), Notifications (email preferences), Payment (bank details for payouts), Tax (VAT/TIN info), Security (password, 2FA), and Connected Accounts (channel connections).',
    howItWorks: [
      'Go to Settings in sidebar.',
      'Sections: Profile, Notifications, Payment, Tax, Security, Connected Accounts.',
      'Update business info in Profile.',
      'Configure email notifications.',
      'Add bank details for payouts.',
      'Manage security settings.',
    ],
    status: 'live',
    source: 'Product Memo §7.0',
  },
  {
    id: 'general-008',
    feature: 'Help Center',
    domain: 'signup',
    keywords: ['help center', 'support', 'help', 'customer support', 'contact support', 'documentation'],
    question: 'Where can I get help?',
    answer: 'The Help Center is accessible from the sidebar. It includes: FAQs organized by topic, video tutorials, step-by-step guides, and a contact form for support tickets. For urgent issues, merchants can reach support via in-app chat or the support hotline.',
    howItWorks: [
      'Click Help Center in sidebar.',
      'Browse FAQs by topic.',
      'Watch video tutorials.',
      'Submit support ticket via contact form.',
      'In-app chat for urgent issues.',
    ],
    status: 'live',
    source: 'Product Memo §7.0',
  },
  {
    id: 'product-007',
    feature: 'Product Image Management',
    domain: 'product',
    keywords: ['product image', 'add image', 'product photo', 'image gallery', 'product gallery'],
    question: 'How many images can I add to a product?',
    answer: 'Each product can have up to 10 images. The first image is the primary/cover image. Images can be uploaded directly or linked from the Media Gallery. Drag-and-drop reordering is supported on the product form. Supported formats: JPG, PNG, WebP.',
    howItWorks: [
      'Up to 10 images per product.',
      'First image = primary/cover.',
      'Upload directly or link from Media Gallery.',
      'Drag-and-drop to reorder.',
      'Formats: JPG, PNG, WebP.',
    ],
    status: 'live',
    source: 'Product Memo §7.3',
  },
  {
    id: 'product-008',
    feature: 'Product Search & Filtering',
    domain: 'product',
    keywords: ['product search', 'find product', 'filter product', 'search catalog', 'product list'],
    question: 'How do I search and filter products?',
    answer: 'On the Products page, use the search bar to find products by name, SKU, or description. Filter by: status (Draft/Active/Archived), category, stock level, channel assignment, and price range. Sort by: name, price, stock, date created.',
    howItWorks: [
      'Search bar: name, SKU, description.',
      'Filters: status, category, stock, channel, price.',
      'Sort: name, price, stock, date.',
      'Results update in real-time.',
    ],
    status: 'live',
    source: 'Product Memo §7.3',
  },
  {
    id: 'order-006',
    feature: 'Order Tracking',
    domain: 'orders',
    keywords: ['order tracking', 'tracking', 'track order', 'parcel tracking', 'shipment tracking'],
    question: 'How can customers track their orders?',
    answer: 'Each order has a tracking page accessible via a shareable link. Customers can see real-time status updates, estimated delivery time, and rider details (once assigned). Merchants can also share tracking links via the order detail page.',
    howItWorks: [
      'Order detail page shows tracking link.',
      'Share tracking link with customer.',
      'Customer sees: current status, ETA, rider info.',
      'Updates in real-time from courier API.',
    ],
    status: 'live',
    source: 'Product Memo §7.7',
  },
  {
    id: 'order-007',
    feature: 'Order Cancellation',
    domain: 'orders',
    keywords: ['cancel order', 'order cancellation', 'refund', 'void order'],
    question: 'Can I cancel an order?',
    answer: 'Yes. Orders in Pending or Confirmed status can be cancelled by the merchant. Go to Order Detail → Cancel Order. Select a cancellation reason. If payment was already collected (online payment), a refund is initiated automatically. COD orders are simply marked as cancelled.',
    howItWorks: [
      'Open order → Cancel Order.',
      'Select cancellation reason.',
      'Pending/Confirmed orders can be cancelled.',
      'Online payments: refund initiated automatically.',
      'COD: marked as cancelled, no refund needed.',
    ],
    edgeCases: [
      'Shipped orders cannot be cancelled — must be returned after delivery.',
      'Refund processing may take 3-5 business days.',
    ],
    status: 'live',
    source: 'Product Memo §7.7',
  },
  {
    id: 'warehouse-005',
    feature: 'Warehouse Stock View',
    domain: 'warehouse',
    keywords: ['warehouse stock', 'stock per warehouse', 'view stock', 'warehouse inventory'],
    question: 'How do I view stock per warehouse?',
    answer: 'Navigate to Warehouses → select a warehouse → Stock tab. Shows all products stored in that warehouse with current stock levels. From here you can adjust stock, initiate transfers, and view stock history for the warehouse.',
    howItWorks: [
      'Go to Warehouses → select warehouse → Stock tab.',
      'List: product name, SKU, current stock, last updated.',
      'Actions: adjust stock, transfer, view history.',
      'Stock history shows all changes with timestamps.',
    ],
    status: 'live',
    source: 'Product Memo §7.2',
  },
  {
    id: 'inventory-005',
    feature: 'Bulk Stock Adjustment',
    domain: 'inventory',
    keywords: ['bulk stock', 'bulk adjustment', 'mass update stock', 'bulk inventory update'],
    question: 'Can I adjust stock for multiple products at once?',
    answer: 'Yes. Go to Inventory → Bulk Adjust. Upload a CSV with SKU and new stock quantity. The system validates and applies changes. Alternatively, use the bulk action checkboxes on the Inventory page to set stock for selected products.',
    howItWorks: [
      'Go to Inventory → Bulk Adjust.',
      'Upload CSV: SKU + new quantity.',
      'System validates and applies.',
      'Or: select products → bulk action → set stock.',
    ],
    edgeCases: [
      'CSV must use exact SKU format.',
      'Stock cannot be set below zero.',
    ],
    status: 'live',
    source: 'Product Memo §7.4',
  },
  {
    id: 'channel-005',
    feature: 'Channel Assignment',
    domain: 'channels',
    keywords: ['channel assignment', 'assign channel', 'publish to channel', 'product channel'],
    question: 'How do I assign products to sales channels?',
    answer: 'When creating or editing a product, select the sales channels where the product should be available (Pathao Shop, Online Store, Daraz, etc.). Products can be assigned to multiple channels simultaneously. Channel assignment affects where the product is visible and purchasable.',
    howItWorks: [
      'Product form → Sales Channels section.',
      'Toggle channels: Pathao Shop, Online Store, Daraz, etc.',
      'Multiple channels can be selected.',
      'Product visible only on assigned channels.',
      'Inventory syncs across all assigned channels.',
    ],
    status: 'live',
    source: 'Product Memo §7.5',
  },
  {
    id: 'checkout-004',
    feature: 'Checkout Link Customization',
    domain: 'checkout',
    keywords: ['checkout customization', 'checkout settings', 'checkout options', 'checkout config'],
    question: 'Can I customize the checkout link experience?',
    answer: 'Yes. When generating a checkout link, merchants can set: custom message/note, pre-filled delivery address, expiration time (for limited-time offers), and payment method restrictions. Links can also be branded with the merchant\'s logo and colors.',
    howItWorks: [
      'Generate link → Advanced Options.',
      'Set custom message/note.',
      'Pre-fill delivery address.',
      'Set expiration time.',
      'Restrict payment methods.',
      'Brand with logo and colors.',
    ],
    status: 'live',
    source: 'Product Memo §7.6',
  },
  {
    id: 'finance-004',
    feature: 'Fee Structure',
    domain: 'finance',
    keywords: ['fees', 'commission', 'service fee', 'platform fee', 'transaction fee'],
    question: 'What fees does Pathao Commerce charge?',
    answer: 'The Product Memo does not define a Commerce fee schedule or commission amounts. Review the relevant payment or invoice in Finance and confirm any fee or settlement rule with Finance before quoting it to a merchant.',
    howItWorks: [
      'Open the relevant payment or invoice in Finance.',
      'Confirm its order source and connected channel.',
      'Ask Finance to confirm any fee or settlement rule that is not shown clearly.',
    ],
    status: 'live',
    source: 'Product Memo §7.13',
  },
  {
    id: 'media-004',
    feature: 'Media Gallery Organization',
    domain: 'media',
    keywords: ['media organize', 'media folder', 'media tags', 'organize images', 'media management'],
    question: 'How do I organize images in the Media Gallery?',
    answer: 'Images in the Media Gallery can be filtered by date uploaded and searched by filename. Images linked to products are marked with a product icon. Bulk delete is available for cleanup. A "Used" indicator shows which images are linked to active products.',
    howItWorks: [
      'Filter by upload date.',
      'Search by filename.',
      'Product-linked images show product icon.',
      'Bulk delete available.',
      'Used/Unused indicator for each image.',
    ],
    status: 'live',
    source: 'Product Memo §7.14',
  },
  {
    id: 'delivery-004',
    feature: 'Instant Delivery Tracking',
    domain: 'delivery',
    keywords: ['instant delivery tracking', 'track instant delivery', 'delivery status', 'rider tracking'],
    question: 'Can I track Instant Delivery orders?',
    answer: 'Yes. Merchants can review tracking and order status details from the Instant Delivery order flow. The Product Memo confirms tracking support but does not define a live map, customer sharing, or a fixed status sequence.',
    howItWorks: [
      'Open Instant Delivery order.',
      'Review the order status details.',
      'For a support issue, collect the merchant, endpoint, timestamp, error message, and a non-sensitive request reference.',
    ],
    status: 'live',
    source: 'Product Memo §7.9',
  },
  {
    id: 'addon-004',
    feature: 'API Access (Developers)',
    domain: 'integrations',
    keywords: ['api', 'developer', 'api access', 'rest api', 'developer api', 'api documentation'],
    question: 'Is there an API for developers?',
    answer: 'The Product Memo confirms a Developer API inside Instant Delivery for system-to-system order handling. It provides Client ID, Client Secret, access-token generation, and webhook configuration; it does not list endpoints, rate limits, or broader Commerce APIs.',
    howItWorks: [
      'Open Instant Delivery.',
      'Choose Developer API.',
      'Generate credentials and an access token where needed.',
      'Set the Callback URL and Secret under Webhook Integration.',
      'Do not share Client Secret or access tokens with support.',
    ],
    status: 'live',
    source: 'Product Memo §7.12',
  },
  {
    id: 'general-009',
    feature: 'Bulk Actions',
    domain: 'product',
    keywords: ['bulk action', 'bulk edit', 'bulk update', 'mass edit', 'batch update'],
    question: 'What bulk actions are available?',
    answer: 'Bulk actions are available on Products, Orders, and Inventory pages. Select multiple items via checkboxes, then apply: activate/deactivate products, change order status, adjust stock, export to CSV, or delete. Bulk actions streamline management for large catalogs.',
    howItWorks: [
      'Select items via checkboxes.',
      'Click "Bulk Actions" dropdown.',
      'Available: activate/deactivate, status change, stock adjust, export, delete.',
      'Apply to all selected items.',
    ],
    status: 'live',
    source: 'Product Memo §7.3',
  },
  {
    id: 'general-010',
    feature: 'Data Export',
    domain: 'finance',
    keywords: ['export', 'download', 'csv export', 'data export', 'export data'],
    question: 'Can I export my data?',
    answer: 'Yes. Export options available on: Products (CSV), Orders (CSV), Inventory (CSV), Finance/Payouts (CSV). Click the export icon on any list page. Exports include all filtered data. Large exports may take a few minutes and are available for download from the notification center.',
    howItWorks: [
      'Click export icon on list page.',
      'Exports filtered data as CSV.',
      'Available for: products, orders, inventory, finance.',
      'Large exports: download from notification center.',
    ],
    status: 'live',
    source: 'Product Memo §7.13',
  },
  {
    id: 'general-011',
    feature: 'Search Across Platform',
    domain: 'signup',
    keywords: ['global search', 'search', 'platform search', 'find anything', 'search bar'],
    question: 'Is there a global search?',
    answer: 'Yes. The search bar in the top navigation allows searching across products, orders, customers, and invoices. Results are grouped by type with quick links to the relevant detail pages. Search is instant and works across all dashboard sections.',
    howItWorks: [
      'Click search bar in top navigation.',
      'Type query — results appear instantly.',
      'Results grouped: Products, Orders, Customers, Invoices.',
      'Click result to navigate to detail page.',
    ],
    status: 'live',
    source: 'Product Memo §7.0',
  },
  {
    id: 'signup-006',
    feature: 'Two-Factor Authentication',
    domain: 'signup',
    keywords: ['2fa', 'two factor', 'two-factor authentication', 'security', 'otp login security'],
    question: 'Does Pathao Commerce support two-factor authentication?',
    answer: 'The Product Memo confirms phone OTP verification during signup, but it does not document an account-level two-factor authentication setting. Confirm current 2FA availability with Product before communicating it as live.',
    status: 'tbd',
    source: 'Product Memo §7.1',
  },
  {
    id: 'general-012',
    feature: 'Multi-User Access',
    domain: 'signup',
    keywords: ['team', 'multi user', 'team member', 'staff access', 'user roles', 'permissions'],
    question: 'Can I add team members to my account?',
    answer: 'The Product Memo does not cover team-member invitations as a live feature. Its role and permission model is planned and still needs Product or Engineering confirmation.',
    status: 'coming-soon',
    source: 'Product Memo §7.1',
  },
  {
    id: 'product-009',
    feature: 'Product Duplication',
    domain: 'product',
    keywords: ['duplicate product', 'copy product', 'clone product', 'product copy'],
    question: 'Can I duplicate a product?',
    answer: 'Yes. On the Products page, click the three-dot menu on any product and select "Duplicate". A new product is created as a copy with the same details (name + "Copy", description, images, pricing). The duplicated product is in "Draft" status and can be edited before publishing.',
    howItWorks: [
      'Products page → three-dot menu → "Duplicate".',
      'New product created as copy.',
      'Name gets "Copy" suffix.',
      'Same details: description, images, pricing, variants.',
      'Created in "Draft" status.',
    ],
    status: 'live',
    source: 'Product Memo §7.3',
  },
  {
    id: 'order-008',
    feature: 'Order Notes',
    domain: 'orders',
    keywords: ['order notes', 'add note', 'order memo', 'internal note', 'order comment'],
    question: 'Can I add notes to an order?',
    answer: 'Yes. Open an order → click "Add Note". Notes are internal and not visible to customers. Use notes for internal coordination, special instructions, or tracking order-related communications. Notes are timestamped and attributed to the team member who added them.',
    howItWorks: [
      'Open order detail → click "Add Note".',
      'Enter note text.',
      'Note is internal — not visible to customer.',
      'Timestamped with team member name.',
      'All notes shown in order timeline.',
    ],
    status: 'live',
    source: 'Product Memo §7.7',
  },
  {
    id: 'inventory-006',
    feature: 'Stock History & Audit Log',
    domain: 'inventory',
    keywords: ['stock history', 'audit log', 'inventory history', 'stock change log', 'inventory audit'],
    question: 'Can I see the history of stock changes?',
    answer: 'Yes. Each product and warehouse has a stock history log. It shows all stock changes with: timestamp, type (manual adjustment, order, transfer, restock), quantity change, and the team member who made the change. Useful for auditing and troubleshooting discrepancies.',
    howItWorks: [
      'Product detail → Stock History tab.',
      'Warehouse detail → Stock History tab.',
      'Shows: timestamp, type, quantity change, user.',
      'Types: manual, order, transfer, restock.',
    ],
    status: 'live',
    source: 'Product Memo §7.4',
  },
  {
    id: 'store-005',
    feature: 'Online Store Pages',
    domain: 'store',
    keywords: ['store pages', 'about page', 'contact page', 'custom pages', 'store content'],
    question: 'Can I add custom pages to my online store?',
    answer: 'Yes. Go to Online Store → Pages. Create custom pages like About Us, Contact, FAQ, Shipping Policy, or Return Policy. Each page supports rich text formatting, images, and custom URLs. Pages appear in the store navigation menu.',
    howItWorks: [
      'Go to Online Store → Pages.',
      'Click "Add Page".',
      'Enter title, content (rich text editor), URL slug.',
      'Add images if needed.',
      'Page appears in store navigation.',
    ],
    status: 'live',
    source: 'Product Memo §7.10',
  },
  {
    id: 'finance-005',
    feature: 'Payout Methods',
    domain: 'finance',
    keywords: ['payout method', 'bank account', 'payment method', 'payout account', 'bank details'],
    question: 'How do I set up my payout method?',
    answer: 'Go to Settings and add a payout method, such as bKash or a bank account where available. Received payments then appear in Finance based on the configured method. The Product Memo does not define the exact release timeline.',
    howItWorks: [
      'Open Settings.',
      'Choose Add Payout Method.',
      'Complete the payout-method form.',
      'Review received payments in Finance.',
    ],
    status: 'live',
    source: 'Product Memo §7.13',
  },
  {
    id: 'chat-005',
    feature: 'Chat Quick Replies',
    domain: 'chats',
    keywords: ['quick reply', 'saved reply', 'chat template', 'canned response'],
    question: 'Are there quick replies for chat?',
    answer: 'Yes. Merchants can save quick reply templates for common responses (e.g., "Thank you for your order!", "Delivery within 24 hours"). In any chat, type "/" to see saved quick replies. Templates can be managed from Settings → Chat Templates.',
    howItWorks: [
      'In chat, type "/" to see quick replies.',
      'Select template — it populates the message field.',
      'Manage templates in Settings → Chat Templates.',
      'Supports variables like {customer_name}.',
    ],
    status: 'live',
    source: 'Product Memo §7.11',
  },
  {
    id: 'addon-005',
    feature: 'Meta Pixel Tracking',
    domain: 'integrations',
    keywords: ['meta pixel', 'facebook pixel', 'tracking pixel', 'ad tracking', 'conversion tracking'],
    question: 'Can I set up Meta Pixel tracking?',
    answer: 'Set it up from the specific Online Store, not Add-ons. Go to Online Stores, open the store, and choose Edit. In the Analytics Account section, click Add new, choose the appropriate analytics type, and paste the Meta Pixel ID — not the full Meta Pixel JavaScript code. You can also enter the Pixel Conversion API Key if you use Conversion API. Set the account to Active, save it, select it for the store if prompted, and click Save Changes. Verify the received events in Meta Events Manager before using the data for campaigns.',
    howItWorks: [
      'Go to Online Stores and open the store you want to track.',
      'Click Edit and find the Analytics Account section.',
      'Click Add new and choose the appropriate analytics type.',
      'Paste the Meta Pixel ID only; do not paste the full JavaScript pixel code.',
      'Optionally add the Pixel Conversion API Key, set Status to Active, and save.',
      'Select the saved analytics account for the store if prompted, then click Save Changes.',
      'Confirm event receipt in Meta Events Manager before relying on campaign reporting.',
    ],
    translations: {
      bn: {
        question: 'Meta Pixel tracking সেট আপ করব কীভাবে?',
        answer: 'Add-ons থেকে নয়, যে Online Store-এ pixel বসাবেন সেটি থেকেই সেটআপ করুন। Online Stores থেকে স্টোরটি খুলে Edit করুন। Analytics Account সেকশনে Add new চাপুন, সঠিক analytics type নির্বাচন করুন এবং Meta Pixel-এর শুধু Pixel ID দিন—পুরো JavaScript pixel code নয়। Conversion API ব্যবহার করলে Pixel Conversion API Key-ও দিতে পারেন। Status Active রেখে Save করুন, প্রয়োজন হলে স্টোরের জন্য account-টি নির্বাচন করে Save Changes চাপুন। Campaign চালানোর আগে Meta Events Manager-এ event আসছে কি না যাচাই করুন।',
      },
    },
    screenshotIds: ['store-analytics'],
    status: 'live',
    source: 'Product screenshot: Online Stores → Edit → Analytics Account',
  },
  {
    id: 'product-010',
    feature: 'Product SEO',
    domain: 'product',
    keywords: ['seo', 'search engine', 'meta title', 'meta description', 'product seo'],
    question: 'Can I set SEO details for my products?',
    answer: 'Yes. When editing a product, expand the "SEO" section. Set: meta title, meta description, and URL slug. These affect how the product appears in search engine results. Defaults are auto-generated from the product title and description if not customized.',
    howItWorks: [
      'Product edit → expand "SEO" section.',
      'Set: meta title, meta description, URL slug.',
      'Defaults auto-generated if left empty.',
      'Affects search engine visibility.',
    ],
    status: 'live',
    source: 'Product Memo §7.3',
  },
  {
    id: 'general-013',
    feature: 'Mobile Responsive Dashboard',
    domain: 'signup',
    keywords: ['mobile', 'responsive', 'mobile app', 'phone', 'tablet', 'mobile view'],
    question: 'Can I use Pathao Commerce on my phone?',
    answer: 'Yes. The Pathao Commerce dashboard is fully responsive and works on mobile browsers. Key features like order management, inventory checks, and chat responses are optimized for mobile. A dedicated mobile app is coming soon.',
    howItWorks: [
      'Access via mobile browser at commerce.pathao.com.',
      'Responsive design adapts to screen size.',
      'Key features optimized for mobile.',
      'Mobile app coming soon.',
    ],
    status: 'live',
    source: 'Product Memo §7.0',
  },
  {
    id: 'general-014',
    feature: 'Real-time Sync',
    domain: 'signup',
    keywords: ['real time', 'real-time', 'live update', 'instant update', 'auto sync'],
    question: 'Does the dashboard update in real-time?',
    answer: 'Yes. The dashboard uses WebSocket connections for real-time updates. New orders, chat messages, stock changes, and status updates appear instantly without manual refresh. A connection indicator in the top bar shows sync status.',
    howItWorks: [
      'WebSocket connections for real-time data.',
      'New orders, messages, stock changes appear instantly.',
      'Connection indicator shows sync status.',
      'Auto-reconnect on connection loss.',
    ],
    status: 'live',
    source: 'Product Memo §7.0',
  },

  // ── 2. MERCHANT-FIT / DISCOVERY ──────────────────────────────────────────
  {
    id: 'discovery-001',
    feature: 'Commerce Value Proposition',
    domain: 'general',
    keywords: ['what is commerce', 'value proposition', 'why commerce', 'what problem', 'what does it solve', 'pitch'],
    question: 'What is Pathao Commerce and what problem does it solve?',
    answer: 'Pathao Commerce is a unified merchant operating platform that replaces the need for separate tools for inventory, orders, delivery, storefronts, and marketing. It lets merchants sell across multiple channels (Pathao Shop, Online Store, Facebook, Instagram, Daraz) from a single dashboard, with built-in Pathao delivery, instant checkout links, and real-time analytics. For Courier merchants, it pre-populates warehouse and parcel data so they can start selling immediately.',
    howItWorks: [
      'Merchants get a single dashboard for products, orders, inventory, delivery, and finance.',
      'Multi-channel selling: Pathao Shop, Online Store, Facebook/Instagram, Daraz.',
      'Built-in Pathao delivery with COD and tracking.',
      'Instant Checkout links for social commerce without a website.',
      'Courier merchants get pre-populated data from their existing account.',
    ],
    status: 'live',
    source: 'Product Memo §7.0',
  },
  {
    id: 'discovery-002',
    feature: 'Merchant Qualification Checklist',
    domain: 'general',
    keywords: ['qualify', 'which merchant', 'fit', 'good fit', 'onboard', 'who should use', 'business type'],
    question: 'How do I determine if a merchant is a good fit for Pathao Commerce?',
    answer: 'A merchant is a good fit if they: (1) sell across multiple channels (Facebook + physical store, Daraz + own website), (2) have 50+ SKUs that need centralized inventory, (3) use Pathao Courier already and want to expand to online selling, (4) need instant checkout for social media orders, or (5) want to create an online store without technical skills. Merchants who only sell on one channel with <20 products may not need the full platform yet.',
    howItWorks: [
      'Ask about current sales channels and order volume.',
      'Check if they use Pathao Courier (pre-populated data = faster onboarding).',
      'Assess SKU count and whether inventory management is a pain point.',
      'Determine if they need an online store or just checkout links.',
      'For single-channel small sellers, recommend starting with Instant Checkout only.',
    ],
    status: 'live',
    source: 'Product Memo §7.0',
  },
  {
    id: 'discovery-003',
    feature: 'Facebook-Only Merchant Onboarding',
    domain: 'general',
    keywords: ['facebook only', 'social seller', 'facebook orders', 'social commerce'],
    question: 'A merchant sells only on Facebook. What should I pitch first?',
    answer: 'For Facebook-only merchants, pitch Instant Checkout first — it lets them create shareable checkout links for every product and post them directly in Facebook comments/DMs. No website needed. They can process orders from the Commerce dashboard instead of manually tracking in spreadsheets. Once comfortable, introduce Pathao Shop and Online Store as growth channels.',
    howItWorks: [
      'Start with Instant Checkout for quick wins (links in FB posts/comments).',
      'Show how orders flow into the unified Commerce dashboard.',
      'Once they see the value, introduce Online Store for a permanent storefront.',
      'Later, connect their Facebook Page for Messenger integration.',
    ],
    status: 'live',
    source: 'Product Memo §7.0',
  },
  {
    id: 'discovery-004',
    feature: 'Large Catalog Merchant Setup',
    domain: 'general',
    keywords: ['large catalog', 'many skus', '500 skus', 'bulk products', 'big merchant'],
    question: 'A merchant has 500+ SKUs. What setup should I recommend?',
    answer: 'For merchants with 500+ SKUs: (1) Use Bulk Product Upload via CSV instead of manual entry, (2) set up warehouse stock tracking from day one, (3) enable Low Stock Alerts, (4) consider Daraz Import if they also sell on Daraz, (5) plan category taxonomy before upload. Do NOT create products one by one — it will take days.',
    howItWorks: [
      'Download the CSV template from Products > Bulk Upload.',
      'Map columns: name, SKU, price, stock, category, images.',
      'Upload in batches of 200-300 products at a time.',
      'Verify after upload — check for validation errors in failed rows.',
      'Set up warehouse and stock allocation before publishing to channels.',
    ],
    status: 'live',
    source: 'Product Memo §7.4',
  },
  {
    id: 'discovery-005',
    feature: 'Multi-Warehouse Merchant Setup',
    domain: 'general',
    keywords: ['multiple warehouses', 'multi warehouse', 'several locations'],
    question: 'A merchant has multiple warehouses. What should I check before onboarding?',
    answer: 'Before onboarding a multi-warehouse merchant: (1) Confirm each warehouse location and approval status, (2) verify courier mapping covers all locations, (3) check if stock will be split or centralized, (4) ensure the primary warehouse is approved first (secondaries can be pending). Commerce supports per-warehouse stock allocation and transfers between warehouses.',
    howItWorks: [
      'Primary warehouse is auto-approved during signup.',
      'Additional warehouses go through approval — merchant cannot use them until approved.',
      'Stock can be allocated per warehouse or per product across warehouses.',
      'Stock transfers between warehouses are available from the Inventory page.',
      'Courier mapping should cover each warehouse pickup address.',
    ],
    status: 'live',
    source: 'Product Memo §7.2',
  },

  // ── 6. BULK UPLOAD / DARAZ EXPANDED ──────────────────────────────────────
  {
    id: 'bulk-001',
    feature: 'CSV Field Reference',
    domain: 'product',
    keywords: ['csv columns', 'csv fields', 'column mapping', 'template columns', 'bulk upload fields'],
    question: 'What are the CSV columns for bulk product upload?',
    answer: 'Required columns: Product Name*, SKU*, Price*, Stock*, Category*. Optional columns: Compare-at Price, Weight, Description, Variant Options, Image URLs (comma-separated). The first image URL becomes the cover image. Variant products use multiple rows with the same product name but different option values. Max 10 images per product.',
    howItWorks: [
      'Download template from Products > Bulk Upload > Download Template.',
      'Fill in all required fields (marked with *).',
      'For variants: each variant gets its own row with option values.',
      'Image URLs must be publicly accessible URLs (not local file paths).',
      'Upload the CSV and wait for validation — errors are shown per row.',
    ],
    status: 'live',
    source: 'Product Memo §7.4',
    screenshotIds: ['bulk-001'],
  },
  {
    id: 'bulk-002',
    feature: 'Bulk Upload Error Handling',
    domain: 'product',
    keywords: ['upload failed', 'validation error', 'row failed', 'import error', 'csv error'],
    question: 'Why did some rows fail validation during bulk upload?',
    answer: 'Common reasons for row failures: (1) Missing required fields (name, SKU, price, stock, category), (2) duplicate SKU within the same upload, (3) price or stock is not a valid number, (4) category name doesn\'t match any existing category, (5) image URL is broken or unreachable. Fix the failed rows and re-upload only those rows. Successfully imported rows are not affected.',
    howItWorks: [
      'After upload, review the error report showing failed rows and reasons.',
      'Fix only the failed rows — do not re-upload successful ones.',
      'Common fixes: add missing SKU, fix category names, validate image URLs.',
      'Re-upload the corrected rows as a new CSV batch.',
      'Check Products list to verify all products were created correctly.',
    ],
    status: 'live',
    source: 'Product Memo §7.4',
  },
  {
    id: 'bulk-003',
    feature: 'Daraz Import Category Mapping',
    domain: 'product',
    keywords: ['daraz category', 'category mapping', 'daraz import mapping', 'manual mapping'],
    question: 'Why is a Daraz category asking for manual mapping during import?',
    answer: 'Daraz uses its own category tree which may not match Pathao Commerce categories 1:1. When a Daraz category has no direct equivalent, the system prompts for manual mapping. The merchant must select a matching Commerce category for each unmapped Daraz category. Products in unmapped categories will not import until mapping is complete.',
    howItWorks: [
      'During Daraz import, the system compares Daraz categories to Commerce categories.',
      'Direct matches are auto-mapped.',
      'Unmatched categories require manual selection from the Commerce category dropdown.',
      'Once mapped, the mapping is saved for future imports.',
      'Products in unmapped categories are queued until the merchant completes mapping.',
    ],
    status: 'live',
    source: 'Product Memo §7.4',
  },

  // ── 16. TROUBLESHOOTING PLAYBOOKS ────────────────────────────────────────
  {
    id: 'trouble-001',
    feature: instantCheckoutOrderWorkflow.feature,
    domain: instantCheckoutOrderWorkflow.domain,
    keywords: instantCheckoutOrderWorkflow.keywords,
    question: instantCheckoutOrderWorkflow.question,
    answer: instantCheckoutOrderWorkflow.answer,
    howItWorks: instantCheckoutOrderWorkflow.steps,
    edgeCases: [
      'Instant Checkout orders do not appear in New Orders by design.',
    ],
    status: 'live',
    source: instantCheckoutOrderWorkflow.source,
    screenshotIds: [...new Set(instantCheckoutOrderWorkflow.screenshots.map(({ featureId }) => featureId))],
  },
  {
    id: 'trouble-002',
    feature: 'Product Not Visible on Sales Channel',
    domain: 'product',
    keywords: ['product not showing', 'product not visible', 'not appearing on shop', 'product missing from channel'],
    question: 'A product exists but isn\'t showing on a sales channel. What do I check?',
    answer: 'Step 1: Verify product status is "Active" (not Draft or Archived). Step 2: Check if the product is assigned to the correct warehouse with stock > 0. Step 3: Verify the product is published to that specific channel (Products > select product > Channels). Step 4: Check if category mapping between Commerce and the channel is correct. Step 5: For Pathao Shop, verify payout method is configured. Step 6: For Online Store, confirm the store is published.',
    howItWorks: [
      'Open the product and check Status is "Active".',
      'Go to Inventory and verify stock is available in the assigned warehouse.',
      'Open the product > Channels tab and confirm the target channel is enabled.',
      'For Pathao Shop: check Account Settings > Payout Method is set.',
      'For Online Store: check Online Stores > the store status is Published.',
    ],
    edgeCases: [
      'Products with 0 stock show as "Out of Stock" but are still visible.',
      'Products in Draft status are invisible to all channels.',
      'Category mismatch can cause products to appear in wrong sections or not at all.',
    ],
    status: 'live',
    source: 'Product Memo §7.4',
  },
  {
    id: 'trouble-003',
    feature: 'Warehouse Approval Pending',
    domain: 'warehouse',
    keywords: ['warehouse pending', 'warehouse not approved', 'warehouse rejected', 'new warehouse pending'],
    question: 'A merchant created a new warehouse but it\'s still pending. Why?',
    answer: 'Primary warehouses created during signup are auto-approved. Additional warehouses require manual approval by the Commerce team. The merchant cannot use a pending warehouse for order fulfillment or stock allocation. Typical approval time is 24-48 hours. If pending longer, escalate to the Warehouse Operations team.',
    howItWorks: [
      'Primary warehouse: auto-approved on signup.',
      'Secondary warehouses: submitted for review, approval within 24-48 hours.',
      'Merchant sees "Pending" status in Warehouses tab.',
      'Cannot assign products or fulfill orders from a pending warehouse.',
      'If rejected: merchant receives notification with reason and can re-submit.',
    ],
    edgeCases: [
      'Courier warehouses from Pathao Courier are pre-mapped but may show as "Commerce warehouses".',
      'If the wrong warehouse is selected during order creation, stock is deducted from the wrong location.',
    ],
    status: 'live',
    source: 'Product Memo §7.2',
  },
  {
    id: 'trouble-004',
    feature: 'WhatsApp Connection Failed',
    domain: 'chats',
    keywords: ['whatsapp failed', 'whatsapp error', 'whatsapp not connecting', 'waba issue'],
    question: 'WhatsApp connection failed. What information should I collect for escalation?',
    answer: 'Collect: (1) Merchant phone number used for WhatsApp, (2) WABA ID (from WhatsApp Business Manager), (3) exact error message shown in Connection Hub, (4) whether the merchant has an active WhatsApp Business API subscription, (5) screenshot of the error. Check if the phone number is already linked to another WABA. Verify the merchant has Meta Business Manager access.',
    howItWorks: [
      'Ask for the WABA ID from WhatsApp Business Manager.',
      'Check if the phone number is already registered with another WABA.',
      'Verify Meta Business Manager access and permissions.',
      'Check if the WhatsApp Business API subscription is active.',
      'Collect error screenshot and exact error text.',
      'Escalate to Integration team with all collected info.',
    ],
    status: 'live',
    source: 'Product Memo §7.9',
  },
  {
    id: 'trouble-005',
    feature: 'Daraz Import Failed',
    domain: 'product',
    keywords: ['daraz import failed', 'daraz sync error', 'daraz products not importing'],
    question: 'Daraz products aren\'t importing. Is this a bug or setup issue?',
    answer: 'First check: (1) Is Daraz connected in Connection Hub? (2) Are there unmapped categories? (3) Is the Daraz OAuth token expired? (4) Are there validation errors in the import log? Most import failures are due to expired OAuth tokens (re-authenticate) or unmapped categories (complete manual mapping). If both are fine, escalate to Product team with the import log.',
    howItWorks: [
      'Check Connection Hub > Daraz status is "Connected".',
      'If token expired: click "Re-authenticate" and complete OAuth flow.',
      'Check for unmapped categories and complete mapping.',
      'Review import log for per-product error messages.',
      'Common errors: category mismatch, missing images, price format issues.',
    ],
    edgeCases: [
      'Daraz products with variants require correct variant attribute mapping.',
      'Some Daraz categories have no Commerce equivalent — these must be mapped manually.',
      'Re-sync after import to update stock and price changes from Daraz.',
    ],
    status: 'live',
    source: 'Product Memo §7.4',
  },
  {
    id: 'trouble-006',
    feature: 'Payout Not Released',
    domain: 'finance',
    keywords: ['payout pending', 'payout not released', 'payment missing', 'payout delay'],
    question: 'A merchant\'s payout hasn\'t been released. What should I check before escalating?',
    answer: 'Before escalating, check the Finance page, invoice source, configured payout method, and any Finance-confirmed settlement rules. The Product Memo does not define an exact payout release timeline. If the payment is still unexplained, escalate with the invoice ID and merchant ID.',
    howItWorks: [
      'Open Finance and find the relevant payment or invoice.',
      'Confirm the invoice source and payout method.',
      'Check the settlement rule currently confirmed by Finance.',
      'Escalate with the invoice ID and merchant ID if the payment remains unexplained.',
    ],
    edgeCases: [
      'Pathao Shop finance data may appear separately from other channel data.',
      'Exact payout settlement timing is an open item for Finance and Business confirmation.',
    ],
    status: 'live',
    source: 'Product Memo §7.13',
  },

  // ── 18. SCENARIO-BASED KNOWLEDGE ─────────────────────────────────────────
  {
    id: 'scenario-001',
    feature: 'Facebook-Only Merchant Onboarding Path',
    domain: 'general',
    keywords: ['facebook orders', 'no website', 'social seller onboarding', '30 orders a day'],
    question: 'A merchant has no website, 30 Facebook orders/day, and uses Courier. What should I onboard first?',
    answer: 'Recommended onboarding order: (1) Sign up for Commerce — their Courier account auto-maps warehouse data. (2) Set up Instant Checkout — create product links for Facebook posts/comments immediately. (3) Enable Facebook Messenger integration for chat-to-order. (4) Once comfortable, create an Online Store for a permanent storefront. (5) Later, connect Facebook Shop via Meta Commerce for product catalog sync.',
    howItWorks: [
      'Signup takes 5 minutes with pre-populated courier data.',
      'Instant Checkout links can be shared in Facebook posts and comments.',
      'Messenger integration lets them manage FB orders in the Unified Inbox.',
      'Online Store creation is optional but provides a permanent web presence.',
      'Facebook Shop syncs product catalog directly to their FB page.',
    ],
    status: 'live',
    source: 'Product Memo §7.0',
  },
  {
    id: 'scenario-002',
    feature: 'Daraz + Multi-Warehouse Large Merchant',
    domain: 'general',
    keywords: ['daraz + warehouses', 'large merchant setup', '1000 skus', 'multi channel'],
    question: 'A merchant has Daraz + 3 warehouses + 1,000 SKUs. Give me the recommended setup.',
    answer: 'Recommended setup: (1) Sign up and complete business profile. (2) Verify all 3 warehouses are approved (primary auto-approved, secondaries need approval). (3) Map couriers to each warehouse. (4) Use Bulk CSV Upload for 1,000 SKUs — do NOT create products manually. (5) Connect Daraz and complete category mapping. (6) Import Daraz products or sync existing catalog. (7) Set up per-warehouse stock allocation. (8) Enable Low Stock Alerts. (9) Publish to Pathao Shop and Online Store.',
    howItWorks: [
      'Step 1-3: Account setup with warehouse verification (1-2 days for approvals).',
      'Step 4: Bulk upload via CSV (plan 1-2 days for CSV preparation).',
      'Step 5-6: Daraz integration and import (allow 1 day for category mapping).',
      'Step 7-8: Inventory configuration (1 day).',
      'Step 9: Channel publishing (1-2 days for review and go-live).',
    ],
    edgeCases: [
      'Daraz category mapping may take longer if there are many unique categories.',
      'Some Daraz products may need manual image uploads if CDN URLs are broken.',
      'Warehouse approvals for secondary locations can take 24-48 hours each.',
    ],
    status: 'live',
    source: 'Product Memo §7.0',
  },
  {
    id: 'scenario-003',
    feature: 'WhatsApp + Manual Courier Merchant',
    domain: 'general',
    keywords: ['whatsapp orders', 'manual courier', 'workflow change', 'chat orders'],
    question: 'A merchant takes orders through WhatsApp and manually books Courier. How should Commerce change their workflow?',
    answer: 'Commerce transforms their workflow: (1) Connect WhatsApp to Unified Inbox — messages appear alongside Facebook/Messenger. (2) Use chat-to-order: create orders directly from WhatsApp conversations with auto-filled customer details. (3) Orders auto-flow to Pathao delivery — no manual courier booking needed. (4) Customer address and order history are saved for repeat orders. (5) Instant Checkout links can be sent in WhatsApp for faster conversion.',
    howItWorks: [
      'Connect WhatsApp via Connection Hub (Quick Connect or Manual Setup).',
      'In Unified Inbox, click "Create Order" from any WhatsApp conversation.',
      'Customer name, phone, and address are auto-extracted from the chat.',
      'Order is created and can be fulfilled via Pathao delivery in one click.',
      'No more manual courier booking — the entire flow is automated.',
    ],
    status: 'live',
    source: 'Product Memo §7.9',
  },
  {
    id: 'scenario-004',
    feature: 'Merchant with Existing Online Presence',
    domain: 'general',
    keywords: ['existing website', 'shopify', 'woocommerce', 'has online store'],
    question: 'A merchant already has a Shopify/WooCommerce store. Should they switch to Commerce?',
    answer: 'They don\'t need to fully switch — Commerce can complement their existing setup: (1) Use Commerce for Pathao delivery integration (if they use Pathao Courier). (2) Use Instant Checkout for social media orders alongside their existing store. (3) Use Commerce\'s Online Store as a secondary channel. (4) Keep their existing store as primary if it\'s working well. Commerce is not an all-or-nothing proposition.',
    howItWorks: [
      'Assess what they\'re currently paying for (hosting, plugins, delivery).',
      'Identify gaps: delivery integration, social commerce, inventory sync.',
      'Recommend Commerce features that fill those gaps.',
      'Let them keep their existing store while adding Commerce for delivery.',
      'Over time, they may consolidate if Commerce meets all their needs.',
    ],
    status: 'live',
    source: 'Product Memo §7.0',
  },

  // ── 17. FEATURE STATUS UPDATES ───────────────────────────────────────────
  {
    id: 'status-001',
    feature: 'Instagram Shop',
    domain: 'channels',
    keywords: ['instagram', 'instagram shop', 'ig shop', 'instagram commerce'],
    question: 'Is Instagram Shop live on Commerce?',
    answer: 'No. The Product Memo lists Facebook and WhatsApp as live chat channels and Instagram as coming soon. Do not present Instagram connection or shop sync as currently available.',
    status: 'coming-soon',
    source: 'Product Memo §5, §7.11',
  },
  {
    id: 'status-002',
    feature: 'Shopify Integration',
    domain: 'channels',
    keywords: ['shopify', 'shopify sync', 'shopify integration'],
    question: 'Is Shopify supported on Pathao Commerce?',
    answer: 'Shopify is not documented in the Product Memo as a live, planned, or unsupported integration. Confirm its current status with Product before making a commitment.',
    status: 'tbd',
    source: 'Product Memo scope and limitations',
  },
  {
    id: 'status-003',
    feature: 'Staff Roles and Permissions',
    domain: 'general',
    keywords: ['staff roles', 'permissions', 'team access', 'different roles', 'staff access'],
    question: 'Can merchant staff have different roles and permissions?',
    answer: 'Not as a documented live feature. The Product Memo says the role and permission model is planned for next quarter and requires Product or Engineering confirmation.',
    status: 'coming-soon',
    source: 'Product Memo §7.1',
  },
  {
    id: 'status-004',
    feature: 'Instant Delivery Coverage',
    domain: 'delivery',
    keywords: ['instant delivery area', 'instant delivery coverage', 'instant delivery location', 'outside dhaka'],
    question: 'Where is Instant Delivery available?',
    answer: 'Instant Delivery is for same-city deliveries, with Instant, 4-Hour, and Same-Day options where available. The Product Memo does not define a city or zone list, so confirm current coverage before promising availability.',
    status: 'limited',
    source: 'Product Memo §7.9',
  },
  {
    id: 'status-005',
    feature: 'Custom Online Store Domain',
    domain: 'store',
    keywords: ['custom domain', 'online store domain', 'change domain', 'store url'],
    question: 'Can the merchant change the Online Store domain after publishing?',
    answer: 'The subdomain (e.g., merchantname.pathao.com) can be changed once from Online Store Settings before publishing. After publishing, the subdomain is locked. Custom domains (e.g., www.merchantstore.com) are supported but require DNS configuration and SSL setup, which may take 24-48 hours to propagate.',
    status: 'live',
    source: 'Product Memo §7.10',
  },
];

export const KNOWLEDGE_BASE: KnowledgeItem[] = [
  // The supplied customer-facing FAQ wording must precede legacy records when topics overlap.
  ...MERCHANT_FAQ_ITEMS,
  // Official video tutorials add source-linked, task-focused walkthroughs before legacy memo records.
  ...TUTORIAL_VIDEO_ITEMS,
  ...PRODUCT_MEMO_KNOWLEDGE_BASE,
];

// ---------------------------------------------------------------------------
// 2. TRAINING MODULES
// ---------------------------------------------------------------------------

export const TRAINING_MODULES: TrainingModule[] = [
  {
    id: 'level-1',
    level: 1,
    title: 'Fundamentals',
    description: 'Core concepts of Pathao Commerce as a unified merchant operating platform.',
    domains: ['signup'],
    keyConcepts: [
      'Pathao Commerce overview and value proposition',
      'Multi-channel selling model',
      'Dashboard navigation and layout',
      'Account types and roles',
      'Key terminology (warehouse, SKU, channel, fulfillment)',
    ],
  },
  {
    id: 'level-2',
    level: 2,
    title: 'Account Setup',
    description: 'Signup flows, warehouse creation, courier mapping, and profile configuration.',
    domains: ['signup', 'warehouse'],
    keyConcepts: [
      'Direct signup, courier signup, Google OAuth, OTP login',
      'Business profile setup and verification',
      'Warehouse creation and approval process',
      'Courier mapping (Pathao Courier, Paperfly, etc.)',
      'Settings and profile management',
      'Team member invites and roles',
    ],
  },
  {
    id: 'level-3',
    level: 3,
    title: 'Product Catalog',
    description: 'Product creation, variants, bulk upload, Daraz import, and category management.',
    domains: ['product'],
    keyConcepts: [
      'Simple product creation (name, SKU, price, images)',
      'Product variants (options, matrix, per-variant SKU)',
      'Bulk product upload via CSV',
      'Daraz product import and sync',
      'Product statuses (Draft, Active, Archived)',
      'Category tree and SEO settings',
      'Media Gallery for product images',
    ],
  },
  {
    id: 'level-4',
    level: 4,
    title: 'Selling Channels',
    description: 'Sales channel setup: Pathao Shop, Daraz, Online Store, Social Commerce.',
    domains: ['channels', 'store'],
    keyConcepts: [
      'Pathao Shop (in-app marketplace)',
      'Daraz integration and product sync',
      'Online Store creation and customization',
      'Store branding (logo, colors, fonts)',
      'Store publishing and custom domains',
      'Facebook and Instagram Shop via Meta Commerce',
      'Channel assignment and cross-channel inventory',
    ],
  },
  {
    id: 'level-5',
    level: 5,
    title: 'Social Commerce & Checkout',
    description: 'Instant Checkout links, chat-to-order, Facebook/WhatsApp integrations.',
    domains: ['checkout', 'chats', 'integrations'],
    keyConcepts: [
      'Instant Checkout link generation and sharing',
      'Checkout link customization and expiration',
      'Facebook Messenger integration',
      'WhatsApp Business integration',
      'Unified Inbox management',
      'Chat-to-order conversion',
      'Connection Hub and add-on management',
    ],
  },
  {
    id: 'level-6',
    level: 6,
    title: 'Orders & Fulfillment',
    description: 'Order processing, fulfillment workflow, delivery tracking, and returns.',
    domains: ['orders', 'delivery'],
    keyConcepts: [
      'Unified order dashboard',
      'Order sources (Pathao Shop, Online Store, Checkout, Direct)',
      'Order statuses and workflow',
      'Order fulfillment (Confirm → Process → Ship)',
      'Warehouse assignment and stock allocation',
      'Instant Delivery module (same-day, COD)',
      'Order tracking and customer notifications',
      'Cancellation and returns',
    ],
  },
  {
    id: 'level-7',
    level: 7,
    title: 'Finance & Operations',
    description: 'Invoices, payouts, inventory management, low stock alerts, and analytics.',
    domains: ['finance', 'inventory'],
    keyConcepts: [
      'Invoice management and breakdown',
      'Payout tracking and settlement',
      'Finance dashboard and revenue analytics',
      'Fee structure (commission, COD fee, processing)',
      'Warehouse-aware inventory tracking',
      'Low stock alerts and thresholds',
      'Stock transfers between warehouses',
      'Inventory sync across channels',
      'Data export (CSV)',
    ],
  },
  {
    id: 'level-8',
    level: 8,
    title: 'Certification',
    description: 'Comprehensive assessment covering all Pathao Commerce features and troubleshooting.',
    domains: [
      'signup', 'warehouse', 'product', 'inventory', 'channels',
      'checkout', 'orders', 'chats', 'delivery', 'finance',
      'integrations', 'media', 'store',
    ],
    keyConcepts: [
      'End-to-end merchant journey walkthrough',
      'Troubleshooting common issues',
      'Edge cases and limitations',
      'Customer communication best practices',
      'Platform updates and feature roadmap',
      'Certification exam preparation',
    ],
  },
];

// ---------------------------------------------------------------------------
// 3. QUIZ QUESTIONS
// ---------------------------------------------------------------------------

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // ── Easy ─────────────────────────────────────────────────────────────────
  {
    id: 'quiz-001',
    type: 'mcq',
    domain: 'signup',
    difficulty: 'easy',
    question: 'What is the primary purpose of Pathao Commerce?',
    options: [
      'A social media management tool',
      'A unified merchant operating platform for multi-channel selling',
      'A delivery rider management app',
      'An accounting software',
    ],
    correctAnswer: 'A unified merchant operating platform for multi-channel selling',
    explanation: 'Pathao Commerce is designed as a single dashboard for merchants to sell across Pathao Shop, Online Store, Daraz, and social channels.',
    source: 'Product Memo §7.0',
  },
  {
    id: 'quiz-002',
    type: 'true-false',
    domain: 'signup',
    difficulty: 'easy',
    question: 'Existing Pathao Courier merchants can use their courier credentials to log into Pathao Commerce.',
    correctAnswer: 'True',
    explanation: 'Courier merchants can log in at commerce.pathao.com with their existing credentials. Their warehouse and parcel data is pre-populated.',
    source: 'Product Memo §7.1',
  },
  {
    id: 'quiz-003',
    type: 'mcq',
    domain: 'warehouse',
    difficulty: 'easy',
    question: 'What is the typical approval time for a new warehouse?',
    options: [
      'Instant approval',
      '24-48 hours',
      '5-7 business days',
      '1 week',
    ],
    correctAnswer: '24-48 hours',
    explanation: 'Warehouse approval typically takes 24-48 hours as the courier team reviews the address and contact details.',
    source: 'Product Memo §7.2',
  },
  {
    id: 'quiz-004',
    type: 'mcq',
    domain: 'product',
    difficulty: 'easy',
    question: 'What is the maximum number of images allowed per product?',
    options: ['3', '5', '10', '20'],
    correctAnswer: '10',
    explanation: 'Each product can have up to 10 images, with the first image serving as the primary/cover image.',
    source: 'Product Memo §7.3',
  },
  {
    id: 'quiz-005',
    type: 'mcq',
    domain: 'inventory',
    difficulty: 'easy',
    question: 'What does the red highlight indicate on the Inventory page?',
    options: ['Low stock items', 'Out of stock items', 'Newly added items', 'Popular items'],
    correctAnswer: 'Out of stock items',
    explanation: 'Red highlight indicates out-of-stock items, while yellow highlight indicates low-stock items.',
    source: 'Product Memo §7.4',
  },
  {
    id: 'quiz-006',
    type: 'true-false',
    domain: 'channels',
    difficulty: 'easy',
    question: 'Pathao Shop is a built-in marketplace within the Pathao app.',
    correctAnswer: 'True',
    explanation: 'Pathao Shop is the in-app marketplace where millions of Pathao users can discover and purchase merchant products.',
    source: 'Product Memo §7.5',
  },
  {
    id: 'quiz-007',
    type: 'mcq',
    domain: 'orders',
    difficulty: 'easy',
    question: 'What are the four main order sources in Pathao Commerce?',
    options: [
      'Pathao Shop, Online Store, WhatsApp, Phone',
      'Pathao Shop, Online Store, Instant Checkout, Direct',
      'Pathao Shop, Daraz, Facebook, Instagram',
      'Pathao Shop, Online Store, Daraz, Courier',
    ],
    correctAnswer: 'Pathao Shop, Online Store, Instant Checkout, Direct',
    explanation: 'Orders come from Pathao Shop (in-app), Online Store (website), Instant Checkout (shared links), and Direct (manually created).',
    source: 'Product Memo §7.7',
  },
  {
    id: 'quiz-008',
    type: 'mcq',
    domain: 'delivery',
    difficulty: 'easy',
    question: 'When is POD available for an Instant Delivery order?',
    options: ['When the receiver pays', 'When the sender pays', 'For every order', 'POD is not available'],
    correctAnswer: 'When the receiver pays',
    explanation: 'The Product Memo ties POD to the Receiver paying flow. Sender-payer orders show Item Value instead.',
    source: 'Product Memo §7.9',
  },
  {
    id: 'quiz-009',
    type: 'true-false',
    domain: 'store',
    difficulty: 'easy',
    question: 'Online Store requires coding knowledge to set up.',
    correctAnswer: 'False',
    explanation: 'Online Store is a no-code solution. Merchants customize branding, add products, and publish without any coding.',
    source: 'Product Memo §7.10',
  },
  {
    id: 'quiz-010',
    type: 'mcq',
    domain: 'media',
    difficulty: 'easy',
    question: 'What is the maximum file size for an image upload to the Media Gallery?',
    options: ['1MB', '3MB', '5MB', '10MB'],
    correctAnswer: '5MB',
    explanation: 'The Media Gallery supports images up to 5MB in JPG, PNG, or WebP format.',
    source: 'Product Memo §7.14',
  },

  // ── Medium ───────────────────────────────────────────────────────────────
  {
    id: 'quiz-011',
    type: 'mcq',
    domain: 'signup',
    difficulty: 'medium',
    question: 'What happens if a warehouse is rejected during the approval process?',
    options: [
      'The warehouse is permanently deleted',
      'The merchant is notified with the rejection reason and can edit and resubmit',
      'The merchant must create a new warehouse from scratch',
      'The warehouse is automatically approved after 7 days',
    ],
    correctAnswer: 'The merchant is notified with the rejection reason and can edit and resubmit',
    explanation: 'Rejected warehouses receive a notification with the rejection reason. The merchant can edit the details and resubmit for approval.',
    source: 'Product Memo §7.2',
  },
  {
    id: 'quiz-012',
    type: 'mcq',
    domain: 'product',
    difficulty: 'medium',
    question: 'How many option types and variant combinations are supported for a product with variants?',
    options: [
      '2 option types, 50 combinations',
      '3 option types, 100 combinations',
      '5 option types, 200 combinations',
      '4 option types, 150 combinations',
    ],
    correctAnswer: '3 option types, 100 combinations',
    explanation: 'Products support up to 3 option types (e.g., Size + Color + Material) and up to 100 variant combinations total.',
    source: 'Product Memo §7.3',
  },
  {
    id: 'quiz-013',
    type: 'scenario',
    domain: 'inventory',
    difficulty: 'medium',
    question: 'A merchant wants to move 50 units of Product A from Warehouse 1 to Warehouse 2. What is the correct process?',
    options: [
      'Create a new order for the transfer',
      'Use the Stock Transfer feature in Inventory',
      'Contact support to process the transfer',
      'Update stock manually in both warehouses',
    ],
    correctAnswer: 'Use the Stock Transfer feature in Inventory',
    explanation: 'Navigate to Inventory → Stock Transfer, select source and destination warehouses, choose the product and quantity, and confirm. The transfer is immediate.',
    source: 'Product Memo §7.4',
  },
  {
    id: 'quiz-014',
    type: 'mcq',
    domain: 'channels',
    difficulty: 'medium',
    question: 'What is the default URL format for a published Online Store?',
    options: [
      'www.mystore.com',
      '{store-slug}.pathao.com',
      '{store-slug}.pathao.shop',
      'store.pathao.com/{store-slug}',
    ],
    correctAnswer: '{store-slug}.pathao.shop',
    explanation: 'Published stores are assigned the URL {store-slug}.pathao.shop. Custom domains can be connected optionally.',
    source: 'Product Memo §7.10',
  },
  {
    id: 'quiz-015',
    type: 'mcq',
    domain: 'orders',
    difficulty: 'medium',
    question: 'What is the standard order fulfillment workflow?',
    options: [
      'Received → Shipped → Delivered',
      'Pending → Confirmed → Processing → Shipped → In Transit → Delivered',
      'Created → Assigned → Delivered',
      'New → Processing → Complete',
    ],
    correctAnswer: 'Pending → Confirmed → Processing → Shipped → In Transit → Delivered',
    explanation: 'The standard workflow progresses through Pending, Confirmed, Processing, Shipped, In Transit, and Delivered stages.',
    source: 'Product Memo §7.7',
  },
  {
    id: 'quiz-016',
    type: 'true-false',
    domain: 'checkout',
    difficulty: 'medium',
    question: 'Instant Checkout links can be shared via WhatsApp, Facebook Messenger, SMS, or any messaging channel.',
    correctAnswer: 'True',
    explanation: 'Checkout links are universal URLs that can be shared via any messaging platform or communication channel.',
    source: 'Product Memo §7.6',
  },
  {
    id: 'quiz-017',
    type: 'mcq',
    domain: 'chats',
    difficulty: 'medium',
    question: 'What feature allows merchants to create an order directly from a chat conversation?',
    options: [
      'Chat Export',
      'Chat-to-Order Conversion',
      'Quick Reply',
      'Chat Archive',
    ],
    correctAnswer: 'Chat-to-Order Conversion',
    explanation: 'The Chat-to-Order feature lets merchants click "Create Order" in any chat, select products, and confirm delivery details from the conversation.',
    source: 'Product Memo §7.11',
  },
  {
    id: 'quiz-018',
    type: 'mcq',
    domain: 'finance',
    difficulty: 'medium',
    question: 'What should you say when a merchant asks for the exact payout release time?',
    options: [
      'Confirm the current settlement policy with Finance',
      'Promise a weekly release',
      'Promise a next-day release',
      'Tell the merchant that invoices do not affect payout questions',
    ],
    correctAnswer: 'Confirm the current settlement policy with Finance',
    explanation: 'The Product Memo does not define an exact release timeline. Check payout-method status and confirm the current settlement policy with Finance.',
    source: 'Product Memo §7.13',
  },
  {
    id: 'quiz-019',
    type: 'mcq',
    domain: 'product',
    difficulty: 'medium',
    question: 'What happens when a product is set to "Archived" status?',
    options: [
      'Product is permanently deleted from the system',
      'Product is hidden from all sales channels but can be restored',
      'Product remains visible but cannot be purchased',
      'Product is moved to a separate archive folder',
    ],
    correctAnswer: 'Product is hidden from all sales channels but can be restored',
    explanation: 'Archived products are hidden everywhere but remain in the system. They can be restored to Active or Draft status at any time.',
    source: 'Product Memo §7.3',
  },
  {
    id: 'quiz-020',
    type: 'scenario',
    domain: 'delivery',
    difficulty: 'medium',
    question: 'A merchant selects Sender as payer and expects to use POD. What should you tell them?',
    options: [
      'POD is available for sender-payer orders',
      'Select Receiver as payer if the order needs POD',
      'Turn collection off to enable POD',
      'POD is available only through the Developer API',
    ],
    correctAnswer: 'Select Receiver as payer if the order needs POD',
    explanation: 'POD is tied to the Receiver paying flow. Sender-payer orders use Item Value instead.',
    source: 'Product Memo §7.9',
  },

  // ── Hard ─────────────────────────────────────────────────────────────────
  {
    id: 'quiz-021',
    type: 'troubleshoot',
    domain: 'inventory',
    difficulty: 'hard',
    question: 'A merchant reports that a product shows "Out of Stock" on their Online Store even though they have 50 units in their warehouse. What could be the issue?',
    options: [
      'The product is not assigned to the Online Store channel',
      'The warehouse stock was not synced properly',
      'The product status is set to "Draft"',
      'All of the above could be the cause',
    ],
    correctAnswer: 'All of the above could be the cause',
    explanation: 'Multiple factors could cause this: product not assigned to Online Store channel, stock sync issues, or product in Draft status. Check all three.',
    source: 'Product Memo §7.4, §7.5',
  },
  {
    id: 'quiz-022',
    type: 'troubleshoot',
    domain: 'orders',
    difficulty: 'hard',
    question: 'A merchant created a checkout link, shared it with a customer, but the customer sees "Product Unavailable". What should the merchant check first?',
    options: [
      'Whether the product is set to "Active" status',
      'Whether the product is assigned to the Instant Checkout channel',
      'Whether the product has sufficient stock',
      'All of the above',
    ],
    correctAnswer: 'All of the above',
    explanation: 'The merchant should verify: product status is Active, product is assigned to the checkout channel, and stock is available. Any of these could cause the "Unavailable" message.',
    source: 'Product Memo §7.6, §7.3',
  },
  {
    id: 'quiz-023',
    type: 'scenario',
    domain: 'channels',
    difficulty: 'hard',
    question: 'A merchant sells on both Daraz and Pathao Commerce. An order comes in on Daraz for a product with only 2 units left. What happens to the Pathao Commerce inventory?',
    options: [
      'Nothing — inventory is separate for each channel',
      'Pathao Commerce inventory is reduced by 2 units in near real-time',
      'The merchant must manually update Pathao Commerce stock',
      'Only the Daraz stock is reduced',
    ],
    correctAnswer: 'Pathao Commerce inventory is reduced by 2 units in near real-time',
    explanation: 'Inventory syncs bidirectionally between Daraz and Pathao Commerce. When a Daraz order is placed, Pathao Commerce stock is updated in near real-time.',
    source: 'Product Memo §7.4, §7.5',
  },
  {
    id: 'quiz-024',
    type: 'troubleshoot',
    domain: 'chats',
    difficulty: 'hard',
    question: 'A merchant connected their Facebook Page but is not receiving Messenger messages in the unified inbox. What should you check?',
    options: [
      'Whether the Facebook Page connection is still active',
      'Whether the page admin has granted message permissions',
      'Whether the Facebook app is in Live mode (not Development)',
      'All of the above',
    ],
    correctAnswer: 'All of the above',
    explanation: 'Check: active connection status, page admin permissions for messaging, and Facebook app mode. All are required for message sync to work.',
    source: 'Product Memo §7.11, §7.12',
  },
  {
    id: 'quiz-025',
    type: 'mcq',
    domain: 'product',
    difficulty: 'hard',
    question: 'When bulk uploading products via CSV, which field is required for each product?',
    options: [
      'Description',
      'SKU',
      'Image URL',
      'Weight',
    ],
    correctAnswer: 'SKU',
    explanation: 'SKU is a required field for each product in bulk upload. It must be unique across all products. Other fields like description, images, and weight have defaults or are optional.',
    source: 'Product Memo §7.3',
  },
  {
    id: 'quiz-026',
    type: 'scenario',
    domain: 'finance',
    difficulty: 'hard',
    question: 'A merchant cannot find an invoice from a connected sales channel. What should you check first?',
    options: [
      'The order source, channel, and whether invoice data is available for that channel',
      'Whether payouts always run weekly',
      'Whether the merchant has enabled two-factor authentication',
      'Whether the product image has a CDN link',
    ],
    correctAnswer: 'The order source, channel, and whether invoice data is available for that channel',
    explanation: 'The Product Memo says to check the order source, connected channel, and invoice availability before escalating a missing-invoice issue.',
    source: 'Product Memo §7.13',
  },
  {
    id: 'quiz-027',
    type: 'true-false',
    domain: 'store',
    difficulty: 'hard',
    question: 'A merchant can connect a custom domain to their Pathao Online Store without any additional setup.',
    correctAnswer: 'False',
    explanation: 'Connecting a custom domain requires CNAME configuration pointing to Pathao. SSL is auto-provisioned, but DNS setup is required on the merchant\'s end.',
    source: 'Product Memo §7.10',
  },
  {
    id: 'quiz-028',
    type: 'troubleshoot',
    domain: 'warehouse',
    difficulty: 'hard',
    question: 'A merchant has 3 warehouses but orders are always assigned to the same warehouse even when it\'s out of stock of the ordered product. What is happening?',
    options: [
      'The system only supports one warehouse per merchant',
      'Warehouse auto-assignment is based on nearest warehouse with stock; the other warehouses may not have the product',
      'The merchant needs to manually assign warehouses to each order',
      'There is a bug in the system',
    ],
    correctAnswer: 'Warehouse auto-assignment is based on nearest warehouse with stock; the other warehouses may not have the product',
    explanation: 'The system auto-assigns the nearest warehouse with available stock. If only one warehouse has the product, it will always be assigned there regardless of distance.',
    source: 'Product Memo §7.2, §7.7',
  },
  {
    id: 'quiz-029',
    type: 'mcq',
    domain: 'integrations',
    difficulty: 'hard',
    question: 'Which of the following requires re-authentication periodically?',
    options: [
      'Pathao Courier connection',
      'Daraz Connect integration',
      'Online Store publishing',
      'Media Gallery uploads',
    ],
    correctAnswer: 'Daraz Connect integration',
    explanation: 'Daraz OAuth tokens expire periodically and require re-authentication. Other connections like Pathao Courier are auto-mapped and do not require periodic re-auth.',
    source: 'Product Memo §7.12',
  },
  {
    id: 'quiz-030',
    type: 'scenario',
    domain: 'orders',
    difficulty: 'hard',
    question: 'A customer placed an order via Instant Checkout, paid online, but the merchant wants to cancel it. The order is in "Processing" status. What should the merchant know?',
    options: [
      'They can cancel freely since the order hasn\'t shipped yet',
      'They can cancel, but a refund will be initiated automatically since payment was online',
      'They cannot cancel orders that have been paid online',
      'They need to contact support to cancel',
    ],
    correctAnswer: 'They can cancel, but a refund will be initiated automatically since payment was online',
    explanation: 'Orders in Pending or Confirmed status can be cancelled. For online payments, a refund is initiated automatically. COD orders are simply marked as cancelled.',
    source: 'Product Memo §7.7',
  },
  {
    id: 'quiz-031',
    type: 'mcq',
    domain: 'media',
    difficulty: 'medium',
    question: 'What happens when you delete an image from the Media Gallery that is linked to an active product?',
    options: [
      'Nothing — the image remains on the product',
      'The product image may break as the CDN link becomes unavailable',
      'The system prevents deletion of linked images',
      'The image is replaced with a placeholder',
    ],
    correctAnswer: 'The product image may break as the CDN link becomes unavailable',
    explanation: 'CDN URLs are permanent, but deleting from the Gallery may break the link. Always check if an image is "Used" before deleting.',
    source: 'Product Memo §7.14',
  },
  {
    id: 'quiz-032',
    type: 'true-false',
    domain: 'inventory',
    difficulty: 'medium',
    question: 'Activating a product with zero stock is allowed, and it will show as "Out of Stock" to customers.',
    correctAnswer: 'True',
    explanation: 'Merchants can activate products with zero stock. The product will be visible on channels but marked as "Out of Stock" for customers.',
    source: 'Product Memo §7.4',
  },
  {
    id: 'quiz-033',
    type: 'mcq',
    domain: 'general',
    difficulty: 'easy',
    question: 'What is the default low-stock threshold for products?',
    options: ['1 unit', '5 units', '10 units', '20 units'],
    correctAnswer: '5 units',
    explanation: 'The default low-stock threshold is 5 units if not customized by the merchant.',
    source: 'Product Memo §7.4',
  },
  {
    id: 'quiz-034',
    type: 'mcq',
    domain: 'signup',
    difficulty: 'medium',
    question: 'How many failed OTP attempts before a merchant must wait before retrying?',
    options: ['2 attempts', '3 attempts', '5 attempts', '10 attempts'],
    correctAnswer: '3 attempts',
    explanation: 'After 3 failed OTP attempts, the merchant must wait 60 seconds before retrying.',
    source: 'Product Memo §7.1',
  },
  {
    id: 'quiz-035',
    type: 'troubleshoot',
    domain: 'store',
    difficulty: 'hard',
    question: 'A merchant published their Online Store but it shows a "Not Found" error. What should you check?',
    options: [
      'Whether the store is actually published (not in Draft)',
      'Whether the URL slug is correct',
      'Whether custom domain CNAME is properly configured (if using custom domain)',
      'All of the above',
    ],
    correctAnswer: 'All of the above',
    explanation: 'Check: publish status, correct URL slug, and custom domain CNAME configuration if applicable.',
    source: 'Product Memo §7.10',
  },
];

// ---------------------------------------------------------------------------
// 4. HELPER FUNCTIONS
// ---------------------------------------------------------------------------

/**
 * Fuzzy keyword search across the knowledge base.
 * Scores results by number of keyword matches.
 */
export function searchKnowledge(query: string, domain?: string): KnowledgeItem[] {
  const normalizeSearchText = (value: string) => value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, ' ')
    .trim();
  const normalizedQuery = normalizeSearchText(query);
  const terms = normalizedQuery
    .split(/\s+/)
    .filter((t) => t.length > 1);

  if (terms.length === 0) return [];
  const workflow = findCoachWorkflow(query);

  let items = KNOWLEDGE_BASE;
  if (domain) {
    items = items.filter((item) => item.domain === domain);
  }

  const scored = items.map((item) => {
    let score = item.id === workflow?.knowledgeId ? 100 : 0;
    const featureLower = item.feature.toLowerCase();
    const questionLower = item.question.toLowerCase();
    const answerLower = item.answer.toLowerCase();
    const translations = Object.values(item.translations ?? {});
    const translatedText = translations
      .flatMap(({ question, answer }) => [question, answer])
      .join(' ')
      .toLowerCase();
    const normalizedQuestions = [item.question, ...translations.map(({ question }) => question)]
      .map(normalizeSearchText);

    if (normalizedQuestions.includes(normalizedQuery)) score += 200;
    else if (normalizedQuestions.some((question) => question.includes(normalizedQuery))) score += 20;
    const domainLower = item.domain.toLowerCase();

    for (const term of terms) {
      // Highest weight: feature name match
      if (featureLower.includes(term)) score += 5;
      // High weight: keyword match
      if (item.keywords.some((k) => k.toLowerCase().includes(term))) score += 3;
      // Medium weight: question match
      if (questionLower.includes(term)) score += 2;
      // Lower weight: answer text match
      if (answerLower.includes(term)) score += 1;
      // Localized FAQ text should be retrievable without duplicating knowledge records.
      if (translatedText.includes(term)) score += 2;
      // Lowest weight: domain match
      if (domainLower.includes(term)) score += 1;
    }
    return { item, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.item);
}

/**
 * Get all knowledge items for a specific domain.
 */
export function getKnowledgeByDomain(domain: string): KnowledgeItem[] {
  return KNOWLEDGE_BASE.filter((item) => item.domain === domain);
}

/**
 * Get all knowledge items for a specific feature.
 */
export function getKnowledgeByFeature(feature: string): KnowledgeItem[] {
  const lower = feature.toLowerCase();
  return KNOWLEDGE_BASE.filter((item) =>
    item.feature.toLowerCase().includes(lower),
  );
}

/**
 * Get a training module by level (1-8).
 */
export function getTrainingModule(level: number): TrainingModule | undefined {
  return TRAINING_MODULES.find((m) => m.level === level);
}

/**
 * Get quiz questions, optionally filtered by domain and/or difficulty.
 */
export function getQuizQuestions(
  domain?: string,
  difficulty?: string,
): QuizQuestion[] {
  return QUIZ_QUESTIONS.filter((q) => {
    if (domain && q.domain !== domain) return false;
    if (difficulty && q.difficulty !== difficulty) return false;
    return true;
  });
}

/**
 * Serialize the entire knowledge base into a system-prompt-friendly string.
 * This gives the LLM full context of every feature, answer, and edge case.
 */
export function buildKnowledgeBasePrompt(): string {
  const lines: string[] = [];

  lines.push('## PATHAO COMMERCE KNOWLEDGE BASE');
  lines.push(`Total items: ${KNOWLEDGE_BASE.length}`);
  lines.push('Merchant FAQ entries are the current customer-facing launch reference and take precedence over conflicting legacy Product Memo entries.');
  lines.push('');

  // Group by domain for readability
  const byDomain: Record<string, KnowledgeItem[]> = {};
  for (const item of KNOWLEDGE_BASE) {
    if (!byDomain[item.domain]) byDomain[item.domain] = [];
    byDomain[item.domain].push(item);
  }

  for (const [domain, items] of Object.entries(byDomain)) {
    lines.push(`### Domain: ${domain.toUpperCase()}`);
    for (const item of items) {
      lines.push(`- **${item.feature}** [${item.status}] (id: ${item.id})`);
      lines.push(`  Q: ${item.question}`);
      lines.push(`  A: ${item.answer}`);
      for (const [language, translation] of Object.entries(item.translations ?? {})) {
        lines.push(`  Q (${language}): ${translation.question}`);
        lines.push(`  A (${language}): ${translation.answer}`);
      }
      if (item.howItWorks && item.howItWorks.length > 0) {
        lines.push(`  How it works: ${item.howItWorks.join(' | ')}`);
      }
      if (item.steps && item.steps.length > 0) {
        lines.push(`  Steps: ${item.steps.join(' → ')}`);
      }
      if (item.edgeCases && item.edgeCases.length > 0) {
        lines.push(`  Edge cases: ${item.edgeCases.join('; ')}`);
      }
      if (item.cxNotes && item.cxNotes.length > 0) {
        lines.push(`  CX notes: ${item.cxNotes.join('; ')}`);
      }
      if (item.merchantCommunication) {
        lines.push(`  Merchant communication: ${item.merchantCommunication}`);
      }
      if (item.screenshotIds && item.screenshotIds.length > 0) {
        lines.push(`  Screenshot feature IDs (look up with get_screenshots; these are not image filenames): ${item.screenshotIds.join(', ')}`);
      }
      lines.push(`  Source: ${item.source}`);
      lines.push('');
    }
  }

  // Append training modules
  lines.push('## TRAINING MODULES');
  for (const mod of TRAINING_MODULES) {
    lines.push(`### Level ${mod.level}: ${mod.title}`);
    lines.push(`Description: ${mod.description}`);
    lines.push(`Domains: ${mod.domains.join(', ')}`);
    lines.push(`Key concepts: ${mod.keyConcepts.join('; ')}`);
    lines.push('');
  }

  // Append screenshot reference table
  lines.push('## SCREENSHOT REFERENCE');
  lines.push('Search for the current step to find screenshot candidates, then select exact references with suggest_screenshots only when they help the answer.');
  lines.push('Available screenshot sets:');
  lines.push(getScreenshotReferencePrompt());
  lines.push('');

  // Append quiz questions (without answers — LLM uses tools to fetch them)
  lines.push('## QUIZ QUESTIONS (use get_quiz_questions tool for answers)');
  for (const q of QUIZ_QUESTIONS) {
    lines.push(`- [${q.difficulty}] [${q.domain}] ${q.question}`);
    if (q.options) lines.push(`  Options: ${q.options.join(' | ')}`);
  }

  return lines.join('\n');
}
