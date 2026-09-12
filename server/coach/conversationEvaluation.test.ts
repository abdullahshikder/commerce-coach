import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CONVERSATION_CASES, evaluateConversationAnswer } from './conversationEvaluation';

test('evaluation catches the reported wrong-image and language regression', () => {
  const item = CONVERSATION_CASES.find(c => c.id === 'numeric-order-followup')!;
  const failures = evaluateConversationAnswer(item, { content: 'আপনার অর্ডার খুঁজে পেতে এখানে ক্লিক করুন।', screenshots: [{ src: 'image75.jpg' }] });
  assert.ok(failures.includes('Unexpected switch to Bangla'));
  assert.ok(failures.includes('Unrelated image: image75.jpg'));
  assert.deepEqual(evaluateConversationAnswer(item, { content: 'Search Orders; check New Orders and Processing.', screenshots: [{ src: 'image4.jpg' }, { src: 'image5.jpg' }] }), []);
});

test('a generic tracking answer fails multipart coverage', () => {
  const item = CONVERSATION_CASES.find(c => c.id === 'pixel-six-questions')!;
  const failures = evaluateConversationAnswer(item, { content: 'Meta Pixel is available.' });
  assert.ok(failures.includes('Missing coverage: deduplication'));
  assert.ok(failures.includes('Missing coverage: fake customer data'));
  assert.ok(failures.includes('Missing coverage: evidence gaps'));
});

test('evaluation detects invented account access', () => {
  const item = CONVERSATION_CASES.find(c => c.id === 'account-access-boundary')!;
  assert.ok(evaluateConversationAnswer(item, { content: 'I checked your order. Your order is delivered.' }).some(f => f.startsWith('Forbidden claim')));
});

test('evaluation catches the reviewer inferring browser tracking from automatic installation', () => {
  const item = CONVERSATION_CASES.find(c => c.id === 'pixel-six-questions')!;
  const failures = evaluateConversationAnswer(item, {
    content: 'The pixel is installed on your Online Store, which implies browser-based (client-side) tracking.',
  });
  assert.ok(failures.some(f => f.startsWith('Forbidden claim')));
});
