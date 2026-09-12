import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  detectCoachResponseLanguage,
  getCoachLanguageInstruction,
  resolveCoachQueryIntent,
} from './queryIntent';

test('identifies typo-heavy workflow intent before generic troubleshooting', () => {
  const intent = resolveCoachQueryIntent('cant find instant check order in new order tab');

  assert.equal(intent.kind, 'workflow');
  assert.equal(intent.id, 'workflow:find-instant-checkout-order');
  assert.equal(intent.workflowId, 'find-instant-checkout-order');
  assert.equal(intent.knowledgeId, 'trouble-001');
  assert.equal(intent.confidence, 'high');
  assert.deepEqual(intent.screenshotIds, ['image4.jpg', 'image5.jpg']);
});

test('inherits the last concrete user topic for an ambiguous follow-up', () => {
  const intent = resolveCoachQueryIntent('show me from the start', [
    { role: 'user', content: 'HOW DO I CREATE MY ADD CATELOGUE FOR META ADS' },
    { role: 'assistant', content: 'Here is a short answer.' },
    { role: 'user', content: 'show me from the start' },
  ]);

  assert.equal(intent.workflowId, 'create-ad-catalogue');
  assert.equal(intent.inheritedContext, true);
  assert.match(intent.resolvedQuery, /ADD CATELOGUE/i);
  assert.match(intent.resolvedQuery, /from the start/i);
});

test('keeps chat-cart language outside the order-location workflow', () => {
  const intent = resolveCoachQueryIntent('Open New Order or Instant Checkout from the chat cart');

  assert.notEqual(intent.workflowId, 'find-instant-checkout-order');
  assert.equal(intent.kind, 'product-qa');
});

test('classifies generic Coach modes when no canonical workflow matches', () => {
  assert.equal(resolveCoachQueryIntent('How do I add a warehouse?').kind, 'workflow');
  assert.equal(resolveCoachQueryIntent('My warehouse creation is not working').kind, 'troubleshoot');
  assert.equal(resolveCoachQueryIntent('Quiz me on products').kind, 'quiz');
  assert.equal(resolveCoachQueryIntent('Is this feature available?').kind, 'status');
});

test('detects Bangla script and explicit Bangla response requests', () => {
  assert.equal(detectCoachResponseLanguage('পণ্য কীভাবে তৈরি করব?'), 'bn');
  assert.equal(detectCoachResponseLanguage('Answer in Bangla: how do I add a warehouse?'), 'bn');
  assert.equal(detectCoachResponseLanguage('How do I add a warehouse?'), 'en');
  assert.match(getCoachLanguageInstruction('bn'), /natural Bangla/);
});

test('inherits Bangla for an ambiguous follow-up and honors an explicit English switch', () => {
  const history = [
    { role: 'user', content: 'মেটা অ্যাডের জন্য ক্যাটালগ কীভাবে তৈরি করব?' },
    { role: 'assistant', content: 'আগের উত্তর' },
  ];

  assert.equal(detectCoachResponseLanguage('continue', history), 'bn');
  assert.equal(detectCoachResponseLanguage('ইংরেজিতে উত্তর দিন', history), 'en');

  const followUpIntent = resolveCoachQueryIntent('শুরু থেকে দেখান', history);
  assert.equal(followUpIntent.id, 'workflow:create-ad-catalogue');
  assert.equal(followUpIntent.language, 'bn');
  assert.equal(followUpIntent.inheritedContext, true);
});

test('identifies Bangla workflow queries before generic how-to intent', () => {
  const catalogue = resolveCoachQueryIntent('মেটা অ্যাডের জন্য ক্যাটালগ কীভাবে তৈরি করব?');
  const order = resolveCoachQueryIntent('ইনস্ট্যান্ট চেকআউট অর্ডার নিউ অর্ডার্সে পাচ্ছি না');

  assert.equal(catalogue.id, 'workflow:create-ad-catalogue');
  assert.equal(catalogue.language, 'bn');
  assert.equal(catalogue.label, 'Online Store Ad Catalogue তৈরি');
  assert.equal(order.id, 'workflow:find-instant-checkout-order');
  assert.equal(order.language, 'bn');
});
