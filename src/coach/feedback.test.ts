import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ChatMessage } from './responseEngine';
import { findFeedbackQuery } from './feedback';

function message(id: string, role: ChatMessage['role'], content: string): ChatMessage {
  return {
    id,
    role,
    content,
    timestamp: new Date('2026-09-02T00:00:00Z'),
    type: 'text',
  };
}

test('associates assistant feedback with the nearest preceding merchant question', () => {
  const messages = [
    message('welcome', 'assistant', 'Welcome'),
    message('question-1', 'user', 'How do I create an ad catalogue?'),
    message('answer-1', 'assistant', 'Open Online Stores.'),
    message('system', 'system', 'Training mode started'),
    message('question-2', 'user', 'Where is my Instant Checkout order?'),
    message('answer-2', 'assistant', 'Open Orders, then Processing.'),
  ];

  assert.equal(
    findFeedbackQuery(messages, 'answer-2'),
    'Where is my Instant Checkout order?',
  );
  assert.equal(
    findFeedbackQuery(messages, 'answer-1'),
    'How do I create an ad catalogue?',
  );
});

test('does not invent a question when an assistant message has no preceding user message', () => {
  assert.equal(findFeedbackQuery([message('welcome', 'assistant', 'Welcome')], 'welcome'), undefined);
});
