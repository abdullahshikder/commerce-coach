import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  evaluateCoachWorkflowCase,
  evaluateCoachWorkflows,
} from './evaluate';

test('passes every approved workflow regression case', () => {
  const summary = evaluateCoachWorkflows();

  assert.equal(summary.total, 10);
  assert.equal(summary.failedCount, 0);
  assert.equal(summary.passed, true);
});

test('reports answer and visual regressions clearly', () => {
  const result = evaluateCoachWorkflowCase({
    id: 'deliberate-failure',
    query: 'cant find instant check order in new order tab',
    expectedKnowledgeId: 'wrong-id',
    expectedScreenshotIds: ['wrong-image.jpg'],
    requiredAnswerPhrases: ['not present in the real answer'],
  });

  assert.equal(result.passed, false);
  assert.equal(result.failures.length, 4);
  assert.match(result.failures[0], /expected knowledge wrong-id/);
  assert.match(result.failures[1], /expected workflow intent for wrong-id/);
  assert.match(result.failures[2], /expected screenshots wrong-image\.jpg/);
  assert.match(result.failures[3], /missing required phrase/);
});
