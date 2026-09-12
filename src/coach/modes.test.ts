import assert from 'node:assert/strict';
import { test } from 'node:test';
import { processMessageLLM, type ConversationState, type ChatMessage } from './responseEngine';
import { providers } from './providerClient';

const fresh = (): ConversationState => ({ mode: 'normal', quizScore: { correct: 0, total: 0 }, quizHistory: [] });
const message = (role: ChatMessage['role'], content: string): ChatMessage => ({ id: crypto.randomUUID(), role, content, timestamp: new Date() });

const pixelQuestions = `one merchant has queries regarding pixel & tracking
1.How do server-side and browser-side tracking work?
2.Which events will be fired?
3.Will cancelled orders or fake customer data be tracked?
4.Will incomplete orders be tracked?
5.Will delivery and return data be available?
6.Will the data be properly deduplicated?`;

test('all questions go to generation, including former workflow and mode triggers', async () => {
  const previousFetch = globalThis.fetch;
  const previousProviders = { ...providers };
  Object.assign(providers, { openrouter: true, gemini: false });
  const requests: any[] = [];
  const storedResponseId = '11111111-1111-4111-8111-111111111111';
  globalThis.fetch = async (url, init) => {
    if (String(url).includes('/retrieve')) return Response.json({ mode: 'lexical', results: [] });
    requests.push(JSON.parse(String(init?.body)));
    return Response.json({ content: 'A freshly generated answer.', toolResults: [], responseId: storedResponseId });
  };
  try {
    for (const query of [
      'How do I add a warehouse?', 'HOW DO I CREATE MY ADD CATELOGUE FOR META ADS',
      'অয়ারহাউস কিভাবে bananbo', pixelQuestions, 'Train me on Commerce basics', 'Quiz me',
      'I have an issue to troubleshoot', 'Help me review this reported Commerce answer\nMerchant question: How do I create products?\nReported answer: Start training.',
    ]) {
      const { response, newState } = await processMessageLLM(query, fresh());
      assert.equal(response.content, 'A freshly generated answer.');
      assert.equal(response.metadata?.provider, 'openrouter');
      assert.equal(response.metadata?.intent, undefined);
      assert.equal(response.metadata?.screenshots, undefined);
      assert.equal(response.id, storedResponseId);
      assert.equal(requests.at(-1).messages.at(-1).content, query);
      assert.equal(requests.at(-1).responseId, undefined);
      assert.deepEqual(requests.at(-1).retrievalDocumentIds, []);
      assert.equal(newState.mode, 'normal');
    }
    assert.equal(requests.length, 8);
  } finally { globalThis.fetch = previousFetch; Object.assign(providers, previousProviders); }
});

test('a variant follow-up preserves conversation, retrieves the current step, and respects selected images', async () => {
  const previousFetch = globalThis.fetch;
  const previousProviders = { ...providers };
  Object.assign(providers, { openrouter: true, gemini: false });
  const history = [
    message('user', 'How do I create a product?'),
    message('assistant', 'Fill the product details, then add variants.'),
    message('user', 'I am at variant and confused how to do that?'),
  ];
  let retrievalQuery = '';
  let request: any;
  globalThis.fetch = async (url, init) => {
    const body = JSON.parse(String(init?.body));
    if (String(url).includes('/retrieve')) {
      retrievalQuery = body.query;
      return Response.json({ mode: 'lexical', results: [] });
    }
    request = body;
    return Response.json({ content: 'At Variants, add an attribute such as Size, then enter its values.',
      screenshots: [{ src: 'image102.jpg', caption: 'Untrusted caption' }, { src: 'image102.jpg' }, { src: '../bad.jpg' }] });
  };
  try {
    const legacyState: ConversationState = { ...fresh(), mode: 'training', currentTrainingLevel: 3 };
    const screenContext = { page: 'Product editor', currentStep: 'Variants', observedAt: Date.now() };
    const { response, newState } = await processMessageLLM(history.at(-1)!.content, legacyState, history, 'openrouter', screenContext);
    assert.deepEqual(request.screenContext, screenContext);
    assert.equal(retrievalQuery, history.at(-1)!.content);
    assert.deepEqual(request.messages.map((m: ChatMessage) => m.content), history.map(m => m.content));
    assert.equal(request.state.mode, 'normal');
    assert.equal(newState.mode, 'normal');
    assert.equal(newState.currentTrainingLevel, undefined);
    assert.deepEqual(response.metadata?.screenshots?.map(s => s.src), ['image102.jpg']);
    assert.equal(response.metadata?.screenshots?.[0].caption, 'Add product variant attributes and values.');
    assert.doesNotMatch(response.content, /Open Products/);
  } finally { globalThis.fetch = previousFetch; Object.assign(providers, previousProviders); }
});

test('provider failure, empty output, and missing configuration never return stored answers', async () => {
  const previousFetch = globalThis.fetch;
  const previousProviders = { ...providers };
  try {
    for (const failure of ['offline', 'empty', 'unconfigured']) {
      Object.assign(providers, { openrouter: failure !== 'unconfigured', gemini: false });
      globalThis.fetch = async url => {
        if (String(url).includes('/api/config')) return Response.json({ openrouter: false, gemini: false });
        if (String(url).includes('/retrieve')) return Response.json({ mode: 'lexical', results: [] });
        if (failure === 'offline') throw new Error('offline');
        return Response.json({ content: '' });
      };
      const { response } = await processMessageLLM('How do I create an ad catalogue?', fresh());
      assert.equal(response.type, 'error');
      assert.match(response.content, /couldn't generate.*try again/is);
      assert.equal(response.metadata?.screenshots, undefined);
      assert.doesNotMatch(response.content, /Online Stores|Manage/);
    }
  } finally { globalThis.fetch = previousFetch; Object.assign(providers, previousProviders); }
});

test('a configured second provider can generate after the preferred provider fails', async () => {
  const previousFetch = globalThis.fetch;
  const previousProviders = { ...providers };
  Object.assign(providers, { openrouter: true, gemini: true });
  const attempted: string[] = [];
  globalThis.fetch = async (url, init) => {
    if (String(url).includes('/retrieve')) return Response.json({ mode: 'lexical', results: [] });
    const body = JSON.parse(String(init?.body));
    attempted.push(body.provider);
    if (body.provider === 'openrouter') return new Response('', { status: 502 });
    return Response.json({ content: 'Generated by the available provider.' });
  };
  try {
    const { response } = await processMessageLLM('What about the next step?', fresh());
    assert.deepEqual(attempted, ['openrouter', 'gemini']);
    assert.equal(response.metadata?.provider, 'gemini');
  } finally { globalThis.fetch = previousFetch; Object.assign(providers, previousProviders); }
});

test('provider discovery can recover and old error/local replies do not become evidence', async () => {
  const previousFetch = globalThis.fetch;
  const previousProviders = { ...providers };
  Object.assign(providers, { openrouter: false, gemini: false });
  let request: any;
  globalThis.fetch = async (url, init) => {
    if (String(url).includes('/api/config')) return Response.json({ openrouter: true, gemini: false });
    if (String(url).includes('/retrieve')) return new Response('', { status: 503 });
    request = JSON.parse(String(init?.body));
    return Response.json({ content: 'A generated follow-up.' });
  };
  try {
    await processMessageLLM('What about returns?', fresh(), [
      message('user', pixelQuestions),
      { ...message('assistant', 'Instant Delivery Tracking: Live'), metadata: { provider: 'local' } },
      { ...message('assistant', 'Connection failed'), type: 'error' },
    ]);
    assert.deepEqual(request.messages.map((m: ChatMessage) => m.content), [pixelQuestions, 'What about returns?']);
  } finally { globalThis.fetch = previousFetch; Object.assign(providers, previousProviders); }
});
