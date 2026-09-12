/**
 * Searchable screenshot index for Pathao Commerce Coach.
 *
 * Every image and caption below is sourced from ProductMemoPathaoCommerce.html.
 * An image may be reused across workflows for shared navigation, but only once per guide.
 * Keep this registry aligned with the memo so visual answers remain trustworthy.
 */

import {
  findCoachWorkflow,
  getCoachWorkflow,
} from '../workflows/registry';
import { resolveCoachContextualQuery } from '../queryIntent';

export interface Screenshot {
  src: string;
  caption: string;
  step?: number;
  featureId?: string;
  feature?: string;
}

export interface ScreenshotSet {
  featureId: string;
  feature: string;
  keywords: string[];
  screenshots: Screenshot[];
}

export interface ScreenshotSearchOptions {
  featureIds?: string[];
  limit?: number;
}

interface ScreenshotConversationMessage {
  role: string;
  content: string;
}

function requireWorkflow(id: string) {
  const workflow = getCoachWorkflow(id);
  if (!workflow) throw new Error(`Missing Coach workflow: ${id}`);
  return workflow;
}

const instantCheckoutOrderWorkflow = requireWorkflow('find-instant-checkout-order');
const adCatalogueWorkflow = requireWorkflow('create-ad-catalogue');

export const SCREENSHOT_REGISTRY: ScreenshotSet[] = [
  {
    featureId: 'signup-001',
    feature: 'Direct signup',
    keywords: ['signup', 'register', 'create account', 'independent merchant', 'otp verification', 'dashboard'],
    screenshots: [
      { src: 'image89.jpg', caption: 'Choose independent, Courier, or Google signup.', step: 1 },
      { src: 'image90.jpg', caption: 'Enter merchant information for independent signup.', step: 2 },
      { src: 'image94.jpg', caption: 'Verify the signup with the one-time password.', step: 3 },
      { src: 'image87.jpg', caption: 'Open the Commerce dashboard after signup.', step: 4 },
    ],
  },
  {
    featureId: 'signup-002',
    feature: 'Courier account signup',
    keywords: ['courier login', 'existing courier account', 'store import', 'warehouse address', 'account linking'],
    screenshots: [
      { src: 'image92.jpg', caption: 'Sign up or log in with a Pathao Courier account.', step: 1 },
      { src: 'image88.jpg', caption: 'Import an existing Courier store as a Commerce warehouse.', step: 2 },
      { src: 'image91.jpg', caption: 'Add a warehouse address when the Courier account has no store.', step: 3 },
    ],
  },
  {
    featureId: 'signup-003',
    feature: 'Google signup',
    keywords: ['google authentication', 'google oauth', 'sign in with google', 'google account'],
    screenshots: [
      { src: 'image98.jpg', caption: 'Authenticate with Google to continue signup.', step: 1 },
    ],
  },
  {
    featureId: 'warehouse-001',
    feature: 'Warehouse setup',
    keywords: ['warehouse', 'create warehouse', 'address', 'contact details', 'approval', 'warehouse list'],
    screenshots: [
      { src: 'image96.jpg', caption: 'Enter the warehouse contact and address details.', step: 1 },
      { src: 'image103.jpg', caption: 'Review created warehouses and their approval status.', step: 2 },
    ],
  },
  {
    featureId: 'product-001',
    feature: 'Product creation and variants',
    keywords: ['product', 'catalog', 'create product', 'variant', 'attribute', 'sku'],
    screenshots: [
      { src: 'image100.jpg', caption: 'Create a single product from Products.', step: 1 },
      { src: 'image102.jpg', caption: 'Add product variant attributes and values.', step: 2 },
      { src: 'image105.jpg', caption: 'Review the generated variant combinations.', step: 3 },
      { src: 'image106.jpg', caption: 'View the created product and its variants.', step: 4 },
    ],
  },
  {
    featureId: 'bulk-001',
    feature: 'Bulk product upload',
    keywords: ['bulk upload', 'csv', 'xlsx', 'spreadsheet', 'column mapping', 'validation', 'import products'],
    screenshots: [
      { src: 'image107.jpg', caption: 'Choose CSV, XLSX, or Daraz import and select a warehouse.', step: 1 },
      { src: 'image108.jpg', caption: 'Upload the bulk product file.', step: 2 },
      { src: 'image109.jpg', caption: 'Map uploaded columns to Commerce product fields.', step: 3 },
      { src: 'image110.jpg', caption: 'Review validation errors and correct invalid rows.', step: 4 },
      { src: 'image111.jpg', caption: 'Review validated rows and import the products.', step: 5 },
    ],
  },
  {
    featureId: 'daraz-001',
    feature: 'Daraz product import',
    keywords: ['daraz import', 'connect daraz', 'fetch products', 'category mapping', 'validation'],
    screenshots: [
      { src: 'image112.jpg', caption: 'Start a Daraz import when the account is not connected.', step: 1 },
      { src: 'image75.jpg', caption: 'Start a Daraz import after connecting the account.', step: 2 },
      { src: 'image76.jpg', caption: 'Review products fetched from the connected Daraz account.', step: 3 },
      { src: 'image77.jpg', caption: 'Map Daraz categories that were not matched automatically.', step: 4 },
      { src: 'image79.jpg', caption: 'Import the Daraz products after successful validation.', step: 5 },
      { src: 'image80.jpg', caption: 'View the imported products in Commerce.', step: 6 },
    ],
  },
  {
    featureId: 'inventory-001',
    feature: 'Inventory management',
    keywords: ['inventory', 'stock', 'warehouse stock', 'variant stock', 'edit inventory'],
    screenshots: [
      { src: 'image81.jpg', caption: 'Open inventory from a product card.', step: 1 },
      { src: 'image82.jpg', caption: 'Review warehouse and variant stock in the inventory sheet.', step: 2 },
      { src: 'image84.jpg', caption: 'Edit inventory from the right-side sheet.', step: 3 },
    ],
  },
  {
    featureId: 'channels-001',
    feature: 'Publish to Pathao Shop',
    keywords: ['pathao shop', 'publish product', 'bulk publish', 'category mapping', 'sales channel'],
    screenshots: [
      { src: 'image85.jpg', caption: 'Bulk publish selected products to Pathao Shop.', step: 1 },
      { src: 'image86.jpg', caption: 'Map product categories in the Pathao Shop publish dialog.', step: 2 },
      { src: 'image23.png', caption: 'Publish products from Pathao Shop All Products.', step: 3 },
      { src: 'image15.jpg', caption: 'Publish to Pathao Shop from the product edit page.', step: 4 },
    ],
  },
  {
    featureId: 'channels-002',
    feature: 'Pathao Shop settings and errors',
    keywords: ['pathao shop error', 'sync issue', 'shop information', 'payout method', 'publishing error'],
    screenshots: [
      { src: 'image16.jpg', caption: 'Review Pathao Shop publishing errors and sync issues.', step: 1 },
      { src: 'image17.jpg', caption: 'Update Pathao Shop information.', step: 2 },
      { src: 'image18.jpg', caption: 'Configure the Pathao Shop payout method.', step: 3 },
    ],
  },
  {
    featureId: 'channels-003',
    feature: 'Publish to Daraz',
    keywords: ['daraz publish', 'daraz error', 'daraz sync', 'sales channel', 'product edit'],
    screenshots: [
      { src: 'image19.jpg', caption: 'Publish to Daraz from the product edit page.', step: 1 },
      { src: 'image20.jpg', caption: 'Review Daraz publishing errors and sync issues.', step: 2 },
    ],
  },
  {
    featureId: 'checkout-001',
    feature: 'Instant Checkout links',
    keywords: ['instant checkout', 'checkout link', 'share link', 'multiple products', 'custom product', 'add to cart'],
    screenshots: [
      { src: 'image21.jpg', caption: 'Choose Instant Checkout from the header, product card, or chat.', step: 1 },
      { src: 'image10.png', caption: 'Generate a checkout link for one product.', step: 2 },
      { src: 'image73.png', caption: 'Start an Instant Checkout link from the header.', step: 3 },
      { src: 'image59.png', caption: 'Search for another product or create a custom product.', step: 4 },
      { src: 'image11.png', caption: 'Review multiple products added to the checkout link.', step: 5 },
      { src: 'image78.png', caption: 'Create a custom product and generate its checkout link.', step: 6 },
    ],
  },
  {
    featureId: 'orders-001',
    feature: 'Order management',
    keywords: [...instantCheckoutOrderWorkflow.keywords, 'orders', 'order tab', 'find order', 'order source', 'in transit', 'delivered', 'cancelled', 'order details'],
    screenshots: [
      { src: 'image4.jpg', caption: 'Review orders that require action in New Orders.', step: 1 },
      { src: 'image5.jpg', caption: 'Review accepted, manual, and Instant Checkout orders in Processing.', step: 2 },
      { src: 'image6.jpg', caption: 'Track orders after pickup in In Transit.', step: 3 },
      { src: 'image7.jpg', caption: 'Review delivered and cancelled orders.', step: 4 },
      { src: 'image9.jpg', caption: 'Open the full details for an order.', step: 5 },
    ],
  },
  {
    featureId: 'delivery-001',
    feature: 'Instant Delivery setup',
    keywords: ['instant delivery', 'business information', 'onboarding form', 'same day delivery', 'setup'],
    screenshots: [
      { src: 'image39.jpg', caption: 'Open Instant Delivery from its direct link.', step: 1 },
      { src: 'image40.jpg', caption: 'Complete the first-time Instant Delivery form.', step: 2 },
      { src: 'image41.jpg', caption: 'Review the completed business information form.', step: 3 },
      { src: 'image42.jpg', caption: 'View Instant Delivery after the form is submitted.', step: 4 },
    ],
  },
  {
    featureId: 'delivery-002',
    feature: 'Instant Delivery orders',
    keywords: ['instant delivery order', 'create order', 'receiver pays', 'sender pays', 'pod', 'collection', 'order status'],
    screenshots: [
      { src: 'image43.jpg', caption: 'Return to business information after skipping the setup form.', step: 1 },
      { src: 'image44.jpg', caption: 'Create an Instant Delivery order.', step: 2 },
      { src: 'image46.jpg', caption: 'Configure a receiver-payer order with POD enabled.', step: 3 },
      { src: 'image47.jpg', caption: 'Turn collection off for a receiver-payer order.', step: 4 },
      { src: 'image83.png', caption: 'Configure a sender-payer order with item value only.', step: 5 },
      { src: 'image48.jpg', caption: 'Review the order after completing the required information.', step: 6 },
      { src: 'image37.jpg', caption: 'Review Instant Delivery order status details.', step: 7 },
    ],
  },
  {
    featureId: 'delivery-003',
    feature: 'Instant Delivery API and webhooks',
    keywords: ['developer api', 'api credentials', 'access token', 'webhook', 'callback url', 'secret'],
    screenshots: [
      { src: 'image27.jpg', caption: 'Open the Developer API from Instant Delivery.', step: 1 },
      { src: 'image28.jpg', caption: 'Generate API credentials and an access token.', step: 2 },
      { src: 'image29.jpg', caption: 'Configure the webhook callback URL and secret.', step: 3 },
    ],
  },
  {
    featureId: 'store-001',
    feature: 'Online Store setup',
    keywords: ['online store', 'create store', 'subdomain', 'branding', 'layout', 'theme', 'publish store'],
    screenshots: [
      { src: 'image30.jpg', caption: 'Create an Online Store with a subdomain and warehouse.', step: 1 },
      { src: 'image31.jpg', caption: 'Open Manage Website after creating the store.', step: 2 },
      { src: 'image32.jpg', caption: 'Configure store branding and information.', step: 3 },
      { src: 'image33.jpg', caption: 'Choose a store layout and preview it.', step: 4 },
      { src: 'image34.jpg', caption: 'Customize the theme, color, font, and product cards.', step: 5 },
      { src: 'image35.jpg', caption: 'Publish and save the Online Store.', step: 6 },
    ],
  },
  {
    featureId: 'store-analytics',
    feature: 'Online Store Pixel and tracking',
    keywords: ['meta pixel', 'conversion api', 'analytics account', 'pixel id', 'tracking'],
    screenshots: [
      { src: 'image25.jpg', caption: 'Configure a Pixel and Conversion API analytics account.', step: 1 },
    ],
  },
  {
    featureId: 'catalogue-001',
    feature: 'Online Store ad catalogue',
    keywords: adCatalogueWorkflow.keywords,
    screenshots: [
      { src: 'image30.jpg', caption: 'Open Online Stores and click Manage on the store you want to use.', step: 1 },
      { src: 'image31.jpg', caption: 'On the store Edit page, select the Ad Catalogues tab.', step: 2 },
      { src: 'image69.jpg', caption: 'Click Create Catalogue from the Ad Catalogues tab.', step: 3 },
      { src: 'image26.jpg', caption: 'Name the catalogue, add products, review prices, and click Create Ad catalogue.', step: 4 },
    ],
  },
  {
    featureId: 'chats-001',
    feature: 'Chats and unified inbox',
    keywords: ['chats', 'unified inbox', 'connect channel', 'create customer', 'create order', 'conversation'],
    screenshots: [
      { src: 'image70.jpg', caption: 'View the Chats empty state before connecting a channel.', step: 1 },
      { src: 'image71.jpg', caption: 'Use the unified inbox after connecting a channel.', step: 2 },
      { src: 'image72.jpg', caption: 'Open Create Customer or Create Order from a conversation.', step: 3 },
      { src: 'image14.png', caption: 'Review order information prefilled from the chat.', step: 4 },
    ],
  },
  {
    featureId: 'chats-002',
    feature: 'Create an order from chat',
    keywords: ['chat order', 'recipient', 'select product', 'variant', 'warehouse', 'cart', 'confirmation'],
    screenshots: [
      { src: 'image24.png', caption: 'Enter recipient information and select products.', step: 1 },
      { src: 'image68.png', caption: 'Add the product, variant, and warehouse to the cart.', step: 2 },
      { src: 'image51.png', caption: 'Add more products and create the order.', step: 3 },
      { src: 'image66.jpg', caption: 'Send the successful order confirmation to the customer.', step: 4 },
    ],
  },
  {
    featureId: 'chats-003',
    feature: 'Chat customer context',
    keywords: ['save customer', 'customer history', 'customer rating', 'courier orders', 'sidebar'],
    screenshots: [
      { src: 'image67.jpg', caption: 'Save the customer for future order history.', step: 1 },
      { src: 'image63.png', caption: 'Continue an order without saving the customer.', step: 2 },
      { src: 'image55.jpg', caption: 'Review the customer rating from Courier order history.', step: 3 },
      { src: 'image56.jpg', caption: 'Review customer context and order history in the sidebar.', step: 4 },
    ],
  },
  {
    featureId: 'chats-004',
    feature: 'Chat quick actions',
    keywords: ['quick action', 'preset message', 'chat cart', 'create order from chat', 'new order from chat', 'instant checkout from chat'],
    screenshots: [
      { src: 'image57.jpg', caption: 'Send a preset message with Quick Actions.', step: 1 },
      { src: 'image58.jpg', caption: 'Open New Order or Instant Checkout from the chat cart.', step: 2 },
    ],
  },
  {
    featureId: 'addons-001',
    feature: 'Add-ons',
    keywords: ['add-ons', 'connection hub', 'channel connection', 'integration', 'authentication'],
    screenshots: [
      { src: 'image60.jpg', caption: 'Choose a channel to connect from Add-ons.', step: 1 },
    ],
  },
  {
    featureId: 'addons-facebook',
    feature: 'Facebook connection',
    keywords: ['facebook', 'meta', 'business portfolio', 'facebook page', 'permissions', 'connect channel'],
    screenshots: [
      { src: 'image61.jpg', caption: 'Continue the Facebook connection after Meta authentication.', step: 1 },
      { src: 'image62.jpg', caption: 'Select the Facebook page and business.', step: 2 },
      { src: 'image45.png', caption: 'Select a Meta Business Portfolio.', step: 3 },
      { src: 'image52.jpg', caption: 'Review Facebook permissions and save the connection.', step: 4 },
    ],
  },
  {
    featureId: 'addons-whatsapp-quick',
    feature: 'WhatsApp Quick Connect',
    keywords: ['whatsapp', 'quick connect', 'meta', 'business portfolio', 'phone number', 'qr code', 'timezone'],
    screenshots: [
      { src: 'image64.png', caption: 'Start Quick Connect with a WhatsApp Business Account.', step: 1 },
      { src: 'image36.png', caption: 'Continue the WhatsApp connection after Meta authentication.', step: 2 },
      { src: 'image1.png', caption: 'Select the portfolio and Connect a WhatsApp Business App.', step: 3 },
      { src: 'image8.png', caption: 'Enter the phone number to connect.', step: 4 },
      { src: 'image49.png', caption: 'Review the requested access and continue.', step: 5 },
      { src: 'image22.png', caption: 'Scan the WhatsApp QR code.', step: 6 },
      { src: 'image50.png', caption: 'Select the WhatsApp account timezone.', step: 7 },
      { src: 'image12.png', caption: 'Review and confirm the WhatsApp connection.', step: 8 },
      { src: 'image38.png', caption: 'Finish the Meta flow and return to Commerce.', step: 9 },
      { src: 'image65.png', caption: 'Choose the phone numbers to connect to Commerce.', step: 10 },
    ],
  },
  {
    featureId: 'addons-whatsapp-manual',
    feature: 'WhatsApp manual setup',
    keywords: ['whatsapp manual', 'partner setup', 'business account id', 'waba id', 'find phone numbers'],
    screenshots: [
      { src: 'image53.jpg', caption: 'Enter the partner and WhatsApp Business Account ID.', step: 1 },
      { src: 'image13.png', caption: 'Find phone numbers and continue the manual connection.', step: 2 },
    ],
  },
  {
    featureId: 'addons-daraz',
    feature: 'Daraz connection',
    keywords: ['daraz', 'connect daraz', 'warehouse', 'asc login', 'channel connection'],
    screenshots: [
      { src: 'image54.jpg', caption: 'Choose a warehouse for the Daraz connection.', step: 1 },
      { src: 'image93.jpg', caption: 'Log in to Daraz ASC and return to Commerce.', step: 2 },
      { src: 'image95.jpg', caption: 'Review the successfully connected Daraz account.', step: 3 },
    ],
  },
  {
    featureId: 'finance-001',
    feature: 'Finance and payout methods',
    keywords: ['finance', 'payout method', 'payment', 'invoice', 'download invoice', 'report issue'],
    screenshots: [
      { src: 'image3.png', caption: 'Open payout methods from Finance settings.', step: 1 },
      { src: 'image74.png', caption: 'Add a payout method.', step: 2 },
      { src: 'image2.png', caption: 'Configure the payout method in the modal.', step: 3 },
      { src: 'image97.jpg', caption: 'Review Commerce and connected-channel payments.', step: 4 },
      { src: 'image99.jpg', caption: 'Open finance details, download invoices, or report an issue.', step: 5 },
    ],
  },
  {
    featureId: 'media-001',
    feature: 'Media Gallery',
    keywords: ['media gallery', 'image library', 'crop image', 'link product', 'cdn link', 'reuse image'],
    screenshots: [
      { src: 'image101.jpg', caption: 'Browse the Media Gallery image library.', step: 1 },
      { src: 'image104.jpg', caption: 'Crop an image, link it to a product, or copy its CDN URL.', step: 2 },
    ],
  },
];

const SEARCH_STOP_WORDS = new Set([
  'a', 'about', 'an', 'and', 'commerce', 'for', 'from', 'give', 'help', 'how',
  'i', 'image', 'images', 'in', 'me', 'of', 'on', 'pathao', 'photo', 'photos',
  'picture', 'pictures', 'please', 'screen', 'screenshot', 'screenshots', 'see',
  'show', 'the', 'this', 'to', 'want', 'with',
]);

const SEARCH_ALIASES: Record<string, string[]> = {
  catalogue: ['catalog'],
  catalog: ['catalogue'],
  stock: ['inventory'],
  inventory: ['stock'],
  shop: ['store'],
  store: ['shop'],
  register: ['signup'],
  login: ['signup'],
  payment: ['payout', 'finance'],
  payout: ['payment', 'finance'],
  callback: ['webhook'],
  api: ['developer'],
  product: ['catalog'],
  products: ['product', 'catalog'],
  variants: ['variant'],
  orders: ['order'],
  addons: ['integration'],
  integrations: ['integration', 'addons'],
  পণ্য: ['product'],
  অর্ডার: ['order'],
  ডেলিভারি: ['delivery'],
  গুদাম: ['warehouse'],
  পেমেন্ট: ['payment'],
  ছবি: [],
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ')
    .trim();
}

function tokenize(value: string): string[] {
  const raw = normalize(value)
    .split(/\s+/)
    .filter((term) => term.length > 1 && !SEARCH_STOP_WORDS.has(term));

  return [...new Set(raw.flatMap((term) => [term, ...(SEARCH_ALIASES[term] ?? [])]))];
}

function tokenizePhrase(value: string): string[] {
  return normalize(value)
    .split(/\s+/)
    .filter((term) => term.length > 1 && !SEARCH_STOP_WORDS.has(term));
}

function containsTokenSequence(tokens: string[], sequence: string[]): boolean {
  if (sequence.length === 0 || sequence.length > tokens.length) return false;
  return tokens.some((_, start) =>
    sequence.every((term, offset) => tokens[start + offset] === term),
  );
}

export function buildScreenshotSearchQuery(
  userMessage: string,
  messageHistory: ScreenshotConversationMessage[],
): string {
  return resolveCoachContextualQuery(userMessage, messageHistory).query;
}

function isWorkflowQuery(value: string): boolean {
  const normalized = normalize(value);
  return /\b(create|setup|steps?|guide|walkthrough)\b/.test(normalized)
    || /\bset up\b/.test(normalized)
    || /\bfrom (?:the )?start\b/.test(normalized);
}

function fieldMatchScore(term: string, fieldTokens: string[], exactScore: number): number {
  if (fieldTokens.includes(term)) return exactScore;
  if (term.length >= 4 && fieldTokens.some((token) => token.startsWith(term) || term.startsWith(token))) {
    return Math.max(1, Math.floor(exactScore / 2));
  }
  return 0;
}

export const SCREENSHOT_INDEX: Screenshot[] = SCREENSHOT_REGISTRY.flatMap((set) =>
  set.screenshots.map((screenshot) => ({
    ...screenshot,
    featureId: set.featureId,
    feature: set.feature,
  })),
);

export function getScreenshots(featureId: string): Screenshot[] {
  return SCREENSHOT_INDEX.filter((screenshot) => screenshot.featureId === featureId);
}

export function getScreenshotsForFeatures(featureIds: string[]): Screenshot[] {
  const requested = new Set(featureIds);
  const seen = new Set<string>();

  return SCREENSHOT_INDEX.filter((screenshot) => {
    if (!screenshot.featureId || !requested.has(screenshot.featureId) || seen.has(screenshot.src)) {
      return false;
    }
    seen.add(screenshot.src);
    return true;
  });
}

export function selectResponseScreenshots(
  indexed: Screenshot[],
  suggested: Screenshot[],
  limit: number = 4,
): Screenshot[] {
  // Curated query matches are complete; model suggestions are only a no-match fallback.
  const candidates = indexed.length > 0 ? indexed : suggested;
  const seen = new Set<string>();

  return candidates.filter((screenshot) => {
    if (seen.has(screenshot.src) || seen.size >= limit) return false;
    seen.add(screenshot.src);
    return true;
  });
}

export function searchScreenshots(
  query: string,
  options: ScreenshotSearchOptions = {},
): Screenshot[] {
  const terms = tokenize(query);
  const preferred = new Set(options.featureIds ?? []);
  const limit = Math.max(1, Math.min(options.limit ?? 4, 12));
  const workflow = findCoachWorkflow(query);

  if (workflow?.screenshots.length) {
    return workflow.screenshots
      .map((reference) => SCREENSHOT_INDEX.find((screenshot) =>
        screenshot.featureId === reference.featureId && screenshot.src === reference.src,
      ))
      .filter((screenshot): screenshot is Screenshot => Boolean(screenshot))
      .slice(0, limit);
  }

  if (terms.length === 0) {
    return getScreenshotsForFeatures([...preferred]).slice(0, limit);
  }

  const sets = new Map(SCREENSHOT_REGISTRY.map((set) => [set.featureId, set]));
  const phrase = normalize(query);
  const phraseTokens = tokenizePhrase(query);

  const ranked = SCREENSHOT_INDEX
    .map((screenshot, index) => {
      const set = sets.get(screenshot.featureId ?? '');
      if (!set) return { screenshot, index, queryScore: 0, score: 0, exactKeywordWordCount: 0 };

      const caption = normalize(screenshot.caption);
      const captionTokens = tokenize(screenshot.caption);
      const featureTokens = tokenize(set.feature);
      const keywordTokens = tokenize(set.keywords.join(' '));
      const idTokens = tokenize(set.featureId);
      const exactKeywordWordCount = set.keywords.reduce((longest, keyword) => {
        const keywordTokens = tokenizePhrase(keyword);
        if (keywordTokens.length < 2 || !containsTokenSequence(phraseTokens, keywordTokens)) return longest;
        return Math.max(longest, keywordTokens.length);
      }, 0);

      let queryScore = terms.length > 1 && caption.includes(phrase) ? 18 : 0;
      queryScore += exactKeywordWordCount * 10;
      let setMatches = 0;
      for (const term of terms) {
        const keywordScore = fieldMatchScore(term, keywordTokens, 6);
        const featureScore = fieldMatchScore(term, featureTokens, 5);
        if (keywordScore > 0 || featureScore > 0) setMatches += 1;

        queryScore += fieldMatchScore(term, captionTokens, 7);
        queryScore += keywordScore;
        queryScore += featureScore;
        queryScore += fieldMatchScore(term, idTokens, 3);
      }
      queryScore += setMatches * 3;

      return {
        screenshot,
        index,
        queryScore,
        score: queryScore + (preferred.has(set.featureId) ? 10 : 0),
        exactKeywordWordCount,
      };
    })
    .filter((result) => result.queryScore > 0 || preferred.has(result.screenshot.featureId ?? ''))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  // Prefer the narrowest matched intent so "create ad catalogue" outranks "online store".
  const mostSpecificIntent = Math.max(...ranked.map((result) => result.exactKeywordWordCount), 0);
  const candidates = mostSpecificIntent > 0
    ? ranked.filter((result) => result.exactKeywordWordCount === mostSpecificIntent)
    : ranked;

  if (isWorkflowQuery(query) && candidates.length > 0) {
    const featureId = candidates[0].screenshot.featureId;
    return candidates
      .filter((result) => result.screenshot.featureId === featureId)
      .sort((a, b) => (a.screenshot.step ?? 0) - (b.screenshot.step ?? 0) || a.index - b.index)
      .slice(0, limit)
      .map((result) => result.screenshot);
  }

  // Keep the gallery focused by dropping weak matches relative to the best result.
  const minimumScore = (candidates[0]?.score ?? 0) * 0.5;
  return candidates
    .filter((result) => result.score >= minimumScore)
    .slice(0, limit)
    .map((result) => result.screenshot);
}

export function getScreenshotReferencePrompt(): string {
  return SCREENSHOT_REGISTRY.map((set) =>
    `- ${set.featureId}: ${set.feature}. Search terms: ${set.keywords.join(', ')}.`,
  ).join('\n');
}
