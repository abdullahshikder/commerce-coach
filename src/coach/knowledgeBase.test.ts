import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildKnowledgeBasePrompt, searchKnowledge } from './knowledgeBase';
import { MERCHANT_FAQ_ITEMS } from './merchantFaq';
import { SCREENSHOT_REGISTRY } from './screenshots/manifest';
import { TUTORIAL_VIDEO_ITEMS } from './tutorialVideos';

test('adds every supplied and Product Memo-backed merchant FAQ and keeps guide references valid', () => {
  assert.equal(MERCHANT_FAQ_ITEMS.length, 113);
  assert.equal(MERCHANT_FAQ_ITEMS.filter((item) => item.translations?.bn).length, 111);

  const guideIds = new Set(SCREENSHOT_REGISTRY.map((guide) => guide.featureId));
  for (const item of MERCHANT_FAQ_ITEMS) {
    for (const guideId of item.screenshotIds ?? []) assert.ok(guideIds.has(guideId), `${item.id}: ${guideId}`);
  }
});

test('retrieves supplied FAQs in Bangla and connects how-to answers to focused guides', () => {
  const signup = searchKnowledge('আমি কীভাবে সাইনআপ করতে পারি?')[0];
  assert.equal(signup?.id, 'merchant-faq-006');
  assert.deepEqual(signup?.screenshotIds, ['signup-001', 'signup-002', 'signup-003']);

  const video = searchKnowledge('Can I upload product videos?')[0];
  assert.equal(video?.id, 'merchant-faq-065');
  assert.equal(video?.status, 'coming-soon');
  assert.deepEqual(video?.screenshotIds, ['media-001']);

  const prompt = buildKnowledgeBasePrompt();
  assert.match(prompt, /Merchant FAQ entries.*take precedence/);
  assert.match(prompt, /Q \(bn\): আমি কীভাবে সাইনআপ করতে পারি\?/);
});

test('retrieves additional bilingual FAQs and their focused guides', () => {
  const bulkUpload = searchKnowledge('বাল্ক প্রোডাক্ট আপলোডে কিছু রো ফেল করেছে কেন?')[0];
  assert.equal(bulkUpload?.id, 'merchant-faq-084');
  assert.deepEqual(bulkUpload?.screenshotIds, ['bulk-001']);

  const fees = searchKnowledge('Where can I confirm Pathao Commerce fees or commission?')[0];
  assert.equal(fees?.id, 'merchant-faq-113');
  assert.match(fees?.answer ?? '', /does not define one universal fee or commission schedule/);
});

test('includes every official tutorial video with bilingual, source-linked steps and visual guides', () => {
  assert.equal(TUTORIAL_VIDEO_ITEMS.length, 14);
  const guideIds = new Set(SCREENSHOT_REGISTRY.map((guide) => guide.featureId));

  for (const item of TUTORIAL_VIDEO_ITEMS) {
    assert.match(item.source, /^https:\/\/www\.youtube\.com\/watch\?v=/);
    assert.ok(item.translations?.bn, `${item.id}: Bangla translation`);
    assert.ok((item.steps?.length ?? 0) >= 5, `${item.id}: task steps`);
    for (const guideId of item.screenshotIds ?? []) {
      assert.ok(guideIds.has(guideId), `${item.id}: ${guideId}`);
    }
  }

  const daraz = searchKnowledge('How do I connect Daraz and import its products?')[0];
  assert.equal(daraz?.id, 'tutorial-video-009');
  assert.deepEqual(daraz?.screenshotIds, ['addons-daraz', 'daraz-001']);

  const warehouse = searchKnowledge('নতুন warehouse তৈরি ও select করব কীভাবে?')[0];
  assert.equal(warehouse?.id, 'tutorial-video-012');
  assert.equal(warehouse?.status, 'live-with-dependency');
});

test('finds the dedicated ad catalogue creation guide before generic store guidance', () => {
  const result = searchKnowledge(
    'How do I create an ad catalogue from my Online Store products?',
  )[0];

  assert.equal(result?.id, 'catalogue-001');
  assert.deepEqual(result?.screenshotIds, ['catalogue-001']);
  assert.match(result?.answer ?? '', /Ad Catalogues/);
  assert.match(result?.answer ?? '', /Manage/);
  assert.match(result?.answer ?? '', /Add Products/);
  assert.doesNotMatch(result?.answer ?? '', /Branding/);
});

test('routes Meta Pixel setup to the Online Store analytics account', () => {
  const result = searchKnowledge('Meta pixel code ta Pathao Commerce er kothai boshate hobe?')[0];

  assert.equal(result?.id, 'addon-005');
  assert.match(result?.answer ?? '', /Online Stores/);
  assert.match(result?.answer ?? '', /not Add-ons/);
  assert.match(result?.answer ?? '', /not the full Meta Pixel JavaScript code/);
  assert.deepEqual(result?.screenshotIds, ['store-analytics']);
});

test('routes a missing Instant Checkout order to Orders Processing', () => {
  const result = searchKnowledge(
    'cant find instant check order in new order tab',
  )[0];

  assert.equal(result?.id, 'trouble-001');
  assert.deepEqual(result?.screenshotIds, ['orders-001']);
  assert.match(result?.answer ?? '', /Orders[^.]*Processing/i);
  assert.match(result?.answer ?? '', /bypass(?:es)? New Orders/i);
  assert.doesNotMatch(result?.answer ?? '', /Instant Checkout tab/i);
});
