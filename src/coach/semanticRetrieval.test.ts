import assert from 'node:assert/strict';
import { test } from 'node:test';
import { retrieveCoachContext } from './semanticRetrieval';

test('turns retrieval API passages into source-labeled LLM context', async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => new Response(JSON.stringify({
    mode: 'hybrid',
    results: [{
      document: {
        id: 'knowledge:catalogue-001',
        kind: 'knowledge',
        text: 'Feature: Online Store Ad Catalogue\nSteps: Open Online Stores and click Manage.',
        metadata: { source: 'Product Memo §7.10' },
      },
      score: 0.99,
    }],
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  const result = await retrieveCoachContext('create ad catalogue');
  assert.equal(result?.mode, 'hybrid');
  assert.deepEqual(result?.documentIds, ['knowledge:catalogue-001']);
  assert.match(result?.context ?? '', /Verification: unverified/);
  assert.match(result?.context ?? '', /Product Memo §7\.10/);
  assert.match(result?.context ?? '', /Open Online Stores and click Manage/);
});

test('fails open when the retrieval API is unavailable', async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => { throw new Error('offline'); };
  assert.equal(await retrieveCoachContext('create catalogue'), undefined);
});

test('preserves reviewed source labels without treating unknown labels as verified', async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => Response.json({ mode: 'lexical', results: ['human-reviewed', 'machine-confirmed', 'trusted'].map((trust, i) => ({ document: { id: `upload:${i}`, text: 'Reference', metadata: { trust } }, score: 1 })) });
  const result = await retrieveCoachContext('variants');
  assert.match(result!.context, /Verification: human-reviewed/);
  assert.match(result!.context, /Verification: machine-confirmed/);
  assert.match(result!.context, /Verification: unverified/);
});
