import assert from 'node:assert/strict';
import { test } from 'node:test';
import { freshScreenContext, isScreenContext } from './screenContext';

test('bounds host observations and rejects arbitrary form data', () => {
  const valid = { page: 'Product editor', currentStep: 'Variants', observedAt: 1000 };
  assert.ok(isScreenContext(valid));
  for (const value of [null, [], { ...valid, formValues: { password: 'secret' } },
    { ...valid, page: '' }, { ...valid, observedAt: Infinity },
    { ...valid, visibleErrors: Array(11).fill('Error') }, { ...valid, currentStep: 'x'.repeat(301) }]) {
    assert.equal(isScreenContext(value), false);
  }
});

test('omits old and future observations without losing a fresh snapshot', () => {
  const context = { page: 'Orders', completedSteps: ['Search'], observedAt: 1_000_000 };
  assert.equal(freshScreenContext(context, 1_300_001), undefined);
  assert.equal(freshScreenContext(context, 900_000), undefined);
  assert.equal(freshScreenContext(undefined), undefined);
  const snapshot = freshScreenContext(context, 1_000_000)!;
  context.completedSteps.push('Changed');
  assert.deepEqual(snapshot.completedSteps, ['Search']);
});
