import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  EmbeddingRetriever,
  InMemoryVectorIndex,
  buildCoachEmbeddingDocuments,
  buildKnowledgeEmbeddingDocuments,
  buildScreenshotEmbeddingDocuments,
  cosineSimilarity,
  type EmbeddingDocument,
  type EmbeddingProvider,
} from './index';
import { KNOWLEDGE_BASE } from '../knowledgeBase';
import { SCREENSHOT_INDEX } from '../screenshots/manifest';
import type { EmbeddingRequestOptions } from './types';

const DOCUMENTS: EmbeddingDocument[] = [
  {
    id: 'knowledge:catalogue',
    kind: 'knowledge',
    text: 'Create an ad catalogue and add products for Meta Ads.',
    metadata: { domain: 'store' },
  },
  {
    id: 'knowledge:delivery',
    kind: 'knowledge',
    text: 'Create an Instant Delivery order.',
    metadata: { domain: 'delivery' },
  },
];

class DeterministicEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'test';
  readonly model = 'keyword-v1';
  readonly requests: EmbeddingRequestOptions[] = [];

  async embed(texts: readonly string[], options: EmbeddingRequestOptions = {}): Promise<number[][]> {
    this.requests.push(options);
    return texts.map((text) => {
      const normalized = text.toLowerCase();
      return [
        Number(normalized.includes('catalogue') || normalized.includes('meta')),
        Number(normalized.includes('delivery')),
      ];
    });
  }
}

test('builds embedding documents for every knowledge item and screenshot record', () => {
  const knowledgeDocuments = buildKnowledgeEmbeddingDocuments();
  const screenshotDocuments = buildScreenshotEmbeddingDocuments();
  const allDocuments = buildCoachEmbeddingDocuments();

  assert.equal(knowledgeDocuments.length, KNOWLEDGE_BASE.length);
  assert.equal(screenshotDocuments.length, SCREENSHOT_INDEX.length);
  assert.equal(allDocuments.length, KNOWLEDGE_BASE.length + SCREENSHOT_INDEX.length);
  assert.equal(new Set(allDocuments.map((document) => document.id)).size, allDocuments.length);

  const catalogue = knowledgeDocuments.find((document) => document.id === 'knowledge:catalogue-001');
  assert.match(catalogue?.text ?? '', /Add Products/);
  assert.deepEqual(catalogue?.metadata.screenshotIds, ['catalogue-001']);

  const navigation = screenshotDocuments.find(
    (document) => document.id === 'screenshot:catalogue-001:image30.jpg',
  );
  assert.match(navigation?.text ?? '', /click Manage/);
  assert.equal(navigation?.metadata.step, 1);
});

test('computes cosine similarity and ranks the nearest vectors first', () => {
  assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);

  const index = new InMemoryVectorIndex({
    provider: { name: 'test', model: 'manual-v1' },
    entries: [
      { document: DOCUMENTS[0], vector: [1, 0] },
      { document: DOCUMENTS[1], vector: [0, 1] },
    ],
  });

  assert.deepEqual(
    index.search([0.9, 0.1]).map((result) => result.document.id),
    ['knowledge:catalogue', 'knowledge:delivery'],
  );
});

test('supports score thresholds, limits, and document filters', () => {
  const index = new InMemoryVectorIndex({
    provider: { name: 'test', model: 'manual-v1' },
    entries: [
      { document: DOCUMENTS[0], vector: [1, 0] },
      { document: DOCUMENTS[1], vector: [0, 1] },
    ],
  });

  const results = index.search([1, 0], {
    limit: 1,
    minScore: 0.8,
    filter: (document) => document.metadata.domain === 'store',
  });

  assert.deepEqual(results.map((result) => result.document.id), ['knowledge:catalogue']);
});

test('rejects empty, non-finite, and mismatched vectors', () => {
  assert.throws(() => cosineSimilarity([], []), /empty/i);
  assert.throws(() => cosineSimilarity([1, Number.NaN], [1, 0]), /finite/i);
  assert.throws(() => cosineSimilarity([1, 0], [1, 0, 0]), /dimension/i);

  const index = new InMemoryVectorIndex({
    provider: { name: 'test', model: 'manual-v1' },
    entries: [{ document: DOCUMENTS[0], vector: [1, 0] }],
  });
  assert.throws(() => index.search([1, 0, 0]), /dimension/i);
});

test('creates a provider-backed retriever and restores its index snapshot', async () => {
  const provider = new DeterministicEmbeddingProvider();
  const retriever = await EmbeddingRetriever.create(DOCUMENTS, provider);

  const results = await retriever.search('How do I create a Meta catalogue?');
  assert.equal(results[0]?.document.id, 'knowledge:catalogue');

  const snapshot = retriever.index.toSnapshot();
  const restored = InMemoryVectorIndex.fromSnapshot(JSON.parse(JSON.stringify(snapshot)));
  assert.equal(restored.size, 2);
  assert.equal(restored.dimensions, 2);
  assert.equal(restored.provider.model, 'keyword-v1');
  assert.equal(restored.search([1, 0])[0]?.document.id, 'knowledge:catalogue');
  assert.deepEqual(provider.requests, [
    { task: 'retrieval-document' },
    { task: 'retrieval-query' },
  ]);
});

test('rejects a provider response with the wrong number of vectors', async () => {
  const provider: EmbeddingProvider = {
    name: 'broken',
    model: 'broken-v1',
    embed: async () => [[1, 0]],
  };

  await assert.rejects(
    () => EmbeddingRetriever.create(DOCUMENTS, provider),
    /returned 1 vector for 2 documents/i,
  );
});
