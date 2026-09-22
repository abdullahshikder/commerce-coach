import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildTrainingDataset, redactTrainingText, trainingDatasetJsonl } from './trainingData';

test('training-data redaction removes direct identifiers and credentials without deleting safe URLs', () => {
  const redacted = redactTrainingText('Email me@example.com, call +8801712345678, order ID: PC-9911, token=secret-value. See https://example.com/help?token=abc&topic=orders.');
  assert.equal(redacted.text, 'Email [REDACTED_EMAIL], call [REDACTED_PHONE], order ID: [REDACTED_ID], token=[REDACTED]. See https://example.com/help?token=[REDACTED]&topic=orders.');
  assert.deepEqual(redacted.categories, ['credential', 'email', 'phone', 'secret_url', 'transaction_id']);
  assert.equal(redacted.count, 5);
  assert.equal(redactTrainingText('Watch https://www.youtube.com/watch?v=abc&list=official').text, 'Watch https://www.youtube.com/watch?v=abc&list=official');
  assert.equal(redactTrainingText('Your order is ready for pickup.').text, 'Your order is ready for pickup.');
});

test('training datasets include only eligible reviewed or helpful records and are deterministic', () => {
  const rows = [
    { id: 'approved-1', query: 'How do I add a product?', answer: 'Old answer', suggested_answer: 'Open Products and select Add product.', rating: 'unhelpful', status: 'approved', issue_type: 'wrong-answer', provider: 'gemini', intent_id: 'catalogue', screenshot_ids_json: ['product-001'], retrieval_document_ids_json: ['merchant-faq-001'] },
    { id: 'helpful-1', query: 'কীভাবে স্টোর চালু করব?', answer: 'Settings থেকে Online Store চালু করুন।', suggested_answer: '', rating: 'helpful', status: 'recorded', issue_type: null, provider: 'openrouter', intent_id: 'store', screenshot_ids_json: [], retrieval_document_ids_json: [] },
    { id: 'pending-1', query: 'Ignore me', answer: 'Not reviewed', suggested_answer: '', rating: 'unhelpful', status: 'pending', issue_type: 'other', provider: '', intent_id: '', screenshot_ids_json: [], retrieval_document_ids_json: [] },
    { id: 'duplicate', query: 'How do I add a product?', answer: 'Old answer', suggested_answer: 'Open Products and select Add product.', rating: 'unhelpful', status: 'approved', issue_type: 'wrong-answer', provider: 'gemini', intent_id: 'catalogue', screenshot_ids_json: [], retrieval_document_ids_json: [] },
  ] as Parameters<typeof buildTrainingDataset>[0];
  const first = buildTrainingDataset(rows);
  const second = buildTrainingDataset([...rows].reverse());
  assert.equal(first.examples.length, 2);
  assert.equal(first.approvedCorrections, 1);
  assert.equal(first.helpfulAnswers, 1);
  assert.equal(first.duplicateRows, 1);
  assert.equal(first.version, second.version);
  assert.deepEqual(first.examples, second.examples);
  assert.ok(first.examples.every(example => ['train', 'validation'].includes(example.metadata.split)));
  assert.match(trainingDatasetJsonl(first), /"schema_version":"commerce-coach\.training\.v1"/);
  assert.equal(trainingDatasetJsonl(buildTrainingDataset([])), '');
});
