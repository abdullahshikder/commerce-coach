import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveCoachQueryIntent } from './queryIntent';
import { buildCoachWorkflowResponse } from './workflowResponse';

test('keeps registry-backed catalogue content available as reference material', () => {
  const query = 'HOW DO I CREATE MY ADD CATELOGUE FOR META ADS';
  const intent = resolveCoachQueryIntent(query);
  const response = buildCoachWorkflowResponse(intent);

  assert.equal(intent.id, 'workflow:create-ad-catalogue');
  assert.equal(response?.source, 'Product Memo §7.10');
  assert.match(response?.content ?? '', /Select Online Stores from the left navigation/);
  assert.match(response?.content ?? '', /click "Manage"/);
  assert.deepEqual(
    response?.screenshots.map(({ src }) => src),
    ['image30.jpg', 'image31.jpg', 'image69.jpg', 'image26.jpg'],
  );
});

test('uses prior user context to return the actual workflow for a follow-up', () => {
  const current = 'show me from the start';
  const history = [
    { role: 'user', content: 'How do I create my ad catalogue for Meta Ads?' },
    { role: 'assistant', content: 'A vague previous answer.' },
    { role: 'user', content: current },
  ];
  const intent = resolveCoachQueryIntent(current, history);
  const response = buildCoachWorkflowResponse(intent);

  assert.equal(intent.id, 'workflow:create-ad-catalogue');
  assert.equal(intent.inheritedContext, true);
  assert.match(response?.content ?? '', /\*\*Steps\*\*/);
});

test('does not build a canonical workflow response for unrelated chat-cart intent', () => {
  const query = 'Open New Order or Instant Checkout from the chat cart';
  const intent = resolveCoachQueryIntent(query);

  assert.equal(intent.id, 'product-qa');
  assert.equal(buildCoachWorkflowResponse(intent), undefined);
});

test('builds approved Bangla workflow content and localized visual captions', () => {
  const intent = resolveCoachQueryIntent('মেটা অ্যাডের জন্য ক্যাটালগ কীভাবে তৈরি করব?');
  const response = buildCoachWorkflowResponse(intent);

  assert.equal(intent.language, 'bn');
  assert.equal(response?.feature, 'Online Store Ad Catalogue তৈরি');
  assert.match(response?.content ?? '', /বাম পাশের navigation থেকে Online Stores নির্বাচন করুন/);
  assert.match(response?.content ?? '', /\*\*ধাপগুলো\*\*/);
  assert.match(response?.screenshots[0]?.caption ?? '', /Online Stores খুলে/);
  assert.deepEqual(
    response?.screenshots.map(({ src }) => src),
    ['image30.jpg', 'image31.jpg', 'image69.jpg', 'image26.jpg'],
  );
});


test('answers warehouse spelling variants in Bangla with the correct visual guide',()=>{
  for(const query of ['অয়ারহাউস কিভাবে bananbo','ওয়্যারহাউস কীভাবে তৈরি করব?','ওয়ারহাউস বানাবো','গুদাম কিভাবে বানাবো','warehouse kivabe banabo']){
    const intent=resolveCoachQueryIntent(query);const response=buildCoachWorkflowResponse(intent);
    assert.equal(intent.workflowId,'create-warehouse');assert.equal(intent.language,'bn');
    assert.match(response?.content??'',/Warehouse Management/);assert.match(response?.content??'',/Add Warehouse/);
    assert.match(response?.content??'',/ধাপগুলো/);assert.match(response?.content??'',/ফোন নম্বর/);
    assert.doesNotMatch(response?.content??'',/don't have a specific guide/);
    assert.deepEqual(response?.screenshots.map(s=>s.src),['image96.jpg','image103.jpg']);
  }
});

test('warehouse creation does not replace stock, troubleshooting or unrelated setup questions',()=>{
  for(const query of ['warehouse stock transfer kivabe korbo','My warehouse creation is not working','warehouse delete korbo','প্রোডাক্ট কিভাবে বানাবো']){
    assert.notEqual(resolveCoachQueryIntent(query).workflowId,'create-warehouse');
  }
});
