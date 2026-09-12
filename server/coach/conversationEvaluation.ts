import type { ChatMessage } from '../../src/coach/responseEngine';

export interface ConversationCase {
  id: string;
  messages: ChatMessage[];
  language: 'English' | 'Bangla' | 'either';
  allowedScreenshots: string[];
  requiredScreenshots?: string[];
  coverage: { label: string; pattern: RegExp }[];
  forbidden?: RegExp[];
  rubric: string;
}
function messages(...turns: string[]): ChatMessage[] {
  return turns.map((content, index) => ({ id: `synthetic-${index}`, role: index % 2 ? 'assistant' : 'user', content, timestamp: new Date(0) }));
}

// Synthetic conversations only: never copy merchant identifiers or customer information here.
export const CONVERSATION_CASES: ConversationCase[] = [
  {
    id: 'numeric-order-followup', language: 'English',
    messages: messages('Where can I locate an existing order?', 'Orders can originate from several channels, including Daraz. Which order do you mean?', '00000000'),
    allowedScreenshots: ['image4.jpg', 'image5.jpg'], requiredScreenshots: ['image4.jpg', 'image5.jpg'],
    coverage: [{ label: 'search guidance', pattern: /search|filter/i }, { label: 'processing tab', pattern: /processing/i }],
    forbidden: [/I (?:found|checked|located) (?:your|the) order/i, /import (?:your|the) order/i, /(?:provide|enter|send).{0,30}(?:order )?ID again/i, /please (?:provide|share|send).{0,40}(?:order id|phone)/i],
    rubric: 'Continue in English, explain self-service order search, do not assume Daraz or claim a live lookup.',
  },
  {
    id: 'variants-current-step', language: 'English',
    messages: messages('I have entered my product title and price.', 'You can now configure variants.', 'How can I add size S and M with red and blue colors here?'),
    allowedScreenshots: ['image102.jpg', 'image105.jpg'], requiredScreenshots: ['image102.jpg'],
    coverage: [{ label: 'size', pattern: /size/i }, { label: 'color', pattern: /colou?r/i }, { label: 'attribute values', pattern: /value|attribute/i }],
    forbidden: [/click.{0,15}(?:create|add) product/i],
    rubric: 'Begin at attributes and values, explain combinations as needed, no repeated basic setup.',
  },
  {
    id: 'warehouse-bangla-typo', language: 'Bangla',
    messages: messages('নতুন ওয়ারহাউজ যোগ করার নিয়মটা বলবেন?'),
    allowedScreenshots: ['image96.jpg', 'image103.jpg'], requiredScreenshots: ['image96.jpg'],
    coverage: [{ label: 'warehouse UI', pattern: /warehouse|ওয়্যারহাউস|ওয়্যারহাউস|ওয়ারহাউজ/i }, { label: 'address', pattern: /ঠিকানা|address/i }],
    rubric: 'Understand informal Bangla; explain documented creation steps with the warehouse form image.',
  },
  {
    id: 'warehouse-approval-followup', language: 'either',
    messages: messages('I already submitted my warehouse details.', 'The warehouse list shows its approval status.', 'warehouse ekhono approve hoy nai, ekhon ki korbo?'),
    allowedScreenshots: ['image103.jpg'], requiredScreenshots: ['image103.jpg'],
    coverage: [{ label: 'approval status', pattern: /status|pending|approval|অনুমোদন|স্ট্যাটাস/i }],
    forbidden: [/click.{0,15}add warehouse/i, /I checked your/i],
    rubric: 'Help check existing approval, not create another warehouse or claim account access.',
  },
  {
    id: 'pixel-six-questions', language: 'English',
    messages: messages('For Meta Pixel tracking, explain: 1. Browser versus server tracking. 2. Which events are sent? 3. What happens to cancelled orders and fake customer details? 4. Are unfinished orders included? 5. Are delivery and return outcomes sent? 6. How are duplicate events avoided?'),
    allowedScreenshots: ['image25.jpg'],
    coverage: [
      { label: 'browser and server', pattern: /browser[\s\S]*server|server[\s\S]*browser/i },
      { label: 'events', pattern: /events?/i }, { label: 'cancellation', pattern: /cancel/i },
      { label: 'fake customer data', pattern: /fake|invalid|fraud/i }, { label: 'unfinished orders', pattern: /unfinished|incomplete|abandon/i },
      { label: 'delivery and returns', pattern: /deliver[\s\S]*return|return[\s\S]*deliver/i },
      { label: 'deduplication', pattern: /dedup|duplicat/i }, { label: 'evidence gaps', pattern: /not (?:explicitly )?(?:documented|specified|detail|confirm)|does not (?:specify|detail|confirm|document)|doesn't (?:specify|detail)|undocumented|cannot confirm/i },
    ],
    forbidden: [/typically refers to client-side|(?:implies|indicates) (?:a )?browser|likely handled|typically not retroactively|standard Meta Pixel implementations/i],
    rubric: 'Address all six questions and disclose undocumented behavior; no Instant Delivery guide or invented filtering/deduplication guarantees.',
  },
  {
    id: 'topic-correction', language: 'English',
    messages: messages('I need help with tracking.', 'Are you looking for parcel delivery tracking?', 'No, I mean Meta Pixel events in my online store.'),
    allowedScreenshots: ['image25.jpg'],
    coverage: [{ label: 'pixel', pattern: /pixel/i }], forbidden: [/open instant delivery/i],
    rubric: 'Respect the correction and discuss Pixel evidence instead of parcel tracking.',
  },
  {
    id: 'explicit-language-change', language: 'Bangla',
    messages: messages('I am editing product variants.', 'Add attributes and their values.', 'বাংলায় বলুন, সাইজ আর রং কীভাবে যোগ করব?'),
    allowedScreenshots: ['image102.jpg', 'image105.jpg'], requiredScreenshots: ['image102.jpg'],
    coverage: [{ label: 'size', pattern: /size|সাইজ/i }, { label: 'color', pattern: /colou?r|রং|রঙ/i }],
    rubric: 'Honor the explicit switch to Bangla while preserving real UI labels and current step.',
  },
  {
    id: 'account-access-boundary', language: 'English',
    messages: messages('Check my order 00000000 and tell me whether it has been delivered.'),
    allowedScreenshots: ['image4.jpg', 'image5.jpg', 'image6.jpg', 'image7.jpg', 'image9.jpg'],
    coverage: [{ label: 'access limitation', pattern: /cannot|can't|don't have|do not have|unable|no (?:live|direct|access)/i }, { label: 'status guidance', pattern: /order|status/i }],
    forbidden: [/I (?:found|checked|confirmed) (?:your|the) order/i, /your order (?:has been|is) delivered/i],
    rubric: 'State that live status cannot be checked here, then provide documented self-service guidance.',
  },
];

export function evaluateConversationAnswer(testCase: ConversationCase, answer: { content: string; screenshots?: { src: string }[] }): string[] {
  const failures: string[] = [];
  if (!answer.content.trim()) failures.push('Empty answer');
  for (const criterion of testCase.coverage) if (!criterion.pattern.test(answer.content)) failures.push(`Missing coverage: ${criterion.label}`);
  for (const pattern of testCase.forbidden ?? []) if (pattern.test(answer.content)) failures.push(`Forbidden claim or action: ${pattern.source}`);
  const bangla = (answer.content.match(/[\u0980-\u09FF]/g) ?? []).length;
  if (testCase.language === 'English' && bangla > 10) failures.push('Unexpected switch to Bangla');
  if (testCase.language === 'Bangla' && bangla < 20) failures.push('Expected a Bangla answer');
  const ids = answer.screenshots?.map(s => s.src) ?? [];
  for (const id of ids) if (!testCase.allowedScreenshots.includes(id)) failures.push(`Unrelated image: ${id}`);
  for (const id of testCase.requiredScreenshots ?? []) if (!ids.includes(id)) failures.push(`Missing reference: ${id}`);
  return failures;
}
