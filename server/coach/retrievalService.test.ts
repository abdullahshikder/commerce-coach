import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import {
  EmbeddingRetriever,
  buildCoachEmbeddingDocuments,
  type EmbeddingProvider,
  type EmbeddingRequestOptions,
  type VectorSearchResult,
} from '../../src/coach/embeddings';
import { CoachRetrievalService, fuseRetrievalRankings } from './retrievalService';
import {
  createCoachEmbeddingSnapshot,
  fingerprintEmbeddingDocuments,
  writeCoachEmbeddingSnapshot,
} from './snapshotStore';

class TestEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'test';
  readonly model = 'test-retrieval-v1';
  requests: EmbeddingRequestOptions[] = [];

  async embed(texts: readonly string[], options: EmbeddingRequestOptions = {}): Promise<number[][]> {
    this.requests.push(options);
    return texts.map((text) => {
      const normalized = text.toLowerCase();
      return [
        Number(normalized.includes('catalog') || normalized.includes('meta')),
        Number(normalized.includes('delivery')),
        1,
      ];
    });
  }
}

test('fuses semantic and lexical ranks so agreement wins', () => {
  const documents = buildCoachEmbeddingDocuments().slice(0, 3);
  const semantic: VectorSearchResult[] = [
    { document: documents[0], score: 0.9 },
    { document: documents[1], score: 0.8 },
  ];
  const fused = fuseRetrievalRankings(semantic, [documents[1], documents[2]], 3);
  assert.equal(fused[0].document.id, documents[1].id);
  assert.equal(fused[0].semanticRank, 2);
  assert.equal(fused[0].lexicalRank, 1);
});

test('uses hybrid retrieval with a current snapshot and caches query vectors', async (context) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'coach-retrieval-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const snapshotPath = path.join(directory, 'vectors.json');
  const documents = buildCoachEmbeddingDocuments();
  const provider = new TestEmbeddingProvider();
  const retriever = await EmbeddingRetriever.create(documents, provider);
  await writeCoachEmbeddingSnapshot(
    createCoachEmbeddingSnapshot(retriever.index, documents),
    snapshotPath,
  );
  provider.requests = [];

  const service = new CoachRetrievalService({
    provider,
    snapshotPath,
    documents,
    sourceFingerprint: fingerprintEmbeddingDocuments(documents),
  });
  const first = await service.retrieve('How do I create an ad catalogue for Meta?', {
    kind: 'knowledge',
    limit: 5,
  });
  const second = await service.retrieve('How do I create an ad catalogue for Meta?', {
    kind: 'knowledge',
    limit: 5,
  });

  assert.equal(first.mode, 'hybrid');
  assert.equal(first.results[0]?.document.id, 'knowledge:catalogue-001');
  assert.equal(second.mode, 'hybrid');
  assert.deepEqual(provider.requests, [{ task: 'retrieval-query' }]);
  assert.equal((await service.getStatus()).semanticReady, true);
});

test('falls back to lexical retrieval when no vector snapshot exists', async (context) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'coach-retrieval-missing-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const service = new CoachRetrievalService({
    provider: new TestEmbeddingProvider(),
    snapshotPath: path.join(directory, 'missing.json'),
  });

  const result = await service.retrieve('create ad catalogue for meta', {
    kind: 'knowledge',
    limit: 3,
  });
  assert.equal(result.mode, 'lexical');
  assert.equal(result.fallbackReason, 'missing-snapshot');
  assert.equal(result.results[0]?.document.id, 'knowledge:catalogue-001');
});
