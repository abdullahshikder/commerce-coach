import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { test } from 'node:test';
import {
  CoachFeedbackStore,
  initializeCoachFeedbackSchema,
} from './feedbackStore';

function createStore() {
  const database = new Database(':memory:');
  initializeCoachFeedbackSchema(database);
  return { database, store: new CoachFeedbackStore(database) };
}

test('records helpful feedback without adding it to the review queue', (context) => {
  const { database, store } = createStore();
  context.after(() => database.close());

  const feedback = store.save({
    responseId: 'response-1',
    query: 'How do I create a catalogue?',
    answer: 'Open Online Stores.',
    rating: 'helpful',
    screenshotIds: ['image30.jpg'],
    retrievalDocumentIds: ['knowledge:catalogue-001'],
    provider: 'openrouter',
    intentId: 'workflow:create-ad-catalogue',
  });

  assert.equal(feedback.status, 'recorded');
  assert.equal(store.list({ status: 'pending' }).length, 0);
  assert.deepEqual(feedback.screenshotIds, ['image30.jpg']);
  assert.equal(feedback.intentId, 'workflow:create-ad-catalogue');
});

test('queues detailed negative feedback and supports approval', (context) => {
  const { database, store } = createStore();
  context.after(() => database.close());

  const pending = store.save({
    responseId: 'response-2',
    query: 'cant find instant check order in new order tab',
    answer: 'Look in chat.',
    rating: 'unhelpful',
    issueType: 'wrong-answer',
    comment: 'It should say Processing.',
    suggestedAnswer: 'Open Orders → Processing.',
    screenshotIds: ['image58.jpg'],
    retrievalDocumentIds: ['knowledge:checkout-003'],
    provider: 'openrouter',
  });

  assert.equal(pending.status, 'pending');
  assert.equal(store.list({ status: 'pending' })[0]?.id, pending.id);

  const approved = store.review(pending.id, {
    status: 'approved',
    reviewerId: 'reviewer-1',
    reviewNote: 'Add as a workflow regression.',
  });
  assert.equal(approved?.status, 'approved');
  assert.equal(approved?.reviewerId, 'reviewer-1');
});

test('updates feedback for the same response instead of duplicating it', (context) => {
  const { database, store } = createStore();
  context.after(() => database.close());

  store.save({
    responseId: 'response-3',
    query: 'Where is my order?',
    answer: 'Orders page.',
    rating: 'helpful',
  });
  const updated = store.save({
    responseId: 'response-3',
    query: 'Where is my order?',
    answer: 'Orders page.',
    rating: 'unhelpful',
    issueType: 'missing-information',
  });

  assert.equal(updated.rating, 'unhelpful');
  assert.equal(updated.status, 'pending');
  assert.equal(store.list({}).length, 1);
});
