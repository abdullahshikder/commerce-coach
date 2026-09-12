import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  COACH_WORKFLOWS,
  findCoachWorkflow,
  getOrderSourceRule,
} from './registry';

test('matches typo-heavy workflow questions to one canonical rule', () => {
  assert.equal(
    findCoachWorkflow('cant find instant check order in new order tab')?.id,
    'find-instant-checkout-order',
  );
  assert.equal(
    findCoachWorkflow('HOW DO I CREATE MY ADD CATELOGUE FOR META ADS')?.id,
    'create-ad-catalogue',
  );
  assert.equal(
    findCoachWorkflow('মেটা অ্যাডের জন্য ক্যাটালগ কীভাবে তৈরি করব?')?.id,
    'create-ad-catalogue',
  );
  assert.equal(
    findCoachWorkflow('ইনস্ট্যান্ট চেকআউট অর্ডার নিউ অর্ডার্সে পাচ্ছি না')?.id,
    'find-instant-checkout-order',
  );
});

test('keeps chat-cart actions outside the order-location workflow', () => {
  assert.notEqual(
    findCoachWorkflow('Open New Order or Instant Checkout from the chat cart')?.id,
    'find-instant-checkout-order',
  );
});

test('stores answer facts, visual order, and evaluations together', () => {
  const workflow = COACH_WORKFLOWS.find(({ id }) => id === 'find-instant-checkout-order');

  assert.equal(workflow?.knowledgeId, 'trouble-001');
  assert.match(workflow?.answer ?? '', /Orders → Processing/);
  assert.deepEqual(workflow?.screenshots.map(({ src }) => src), ['image4.jpg', 'image5.jpg']);
  assert.ok((workflow?.evaluations.length ?? 0) >= 2);
  assert.match(workflow?.translations?.bn.answer ?? '', /Orders → Processing/);
});

test('keeps order-source routing in the same canonical registry', () => {
  assert.deepEqual(getOrderSourceRule('instant-checkout'), {
    id: 'instant-checkout',
    label: 'Instant Checkout',
    firstTab: 'Processing',
    merchantAction: 'No accept or Ready to Ship action required.',
    fulfillment: 'Directly sent to Pathao Courier.',
  });
  assert.equal(getOrderSourceRule('online-store')?.firstTab, 'New Orders');
  assert.equal(getOrderSourceRule('live-chat-manual')?.firstTab, 'Processing');
});
