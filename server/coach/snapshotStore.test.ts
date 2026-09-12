import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import {
  InMemoryVectorIndex,
  type EmbeddingDocument,
} from '../../src/coach/embeddings';
import {
  createCoachEmbeddingSnapshot,
  fingerprintEmbeddingDocuments,
  readCoachEmbeddingSnapshot,
  writeCoachEmbeddingSnapshot,
} from './snapshotStore';

const DOCUMENTS: EmbeddingDocument[] = [
  { id: 'knowledge:one', kind: 'knowledge', text: 'First document', metadata: {} },
  { id: 'knowledge:two', kind: 'knowledge', text: 'Second document', metadata: {} },
];

test('writes and reloads an atomic, validated Coach snapshot', async (context) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'coach-snapshot-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, 'vectors.json');
  const index = new InMemoryVectorIndex({
    provider: { name: 'test', model: 'test-v1' },
    entries: [
      { document: DOCUMENTS[0], vector: [1, 0] },
      { document: DOCUMENTS[1], vector: [0, 1] },
    ],
  });

  const snapshot = createCoachEmbeddingSnapshot(index, DOCUMENTS);
  await writeCoachEmbeddingSnapshot(snapshot, filePath);
  const loaded = await readCoachEmbeddingSnapshot(filePath);

  assert.equal(loaded?.index.size, 2);
  assert.equal(loaded?.index.provider.model, 'test-v1');
  assert.equal(loaded?.file.sourceFingerprint, fingerprintEmbeddingDocuments([...DOCUMENTS].reverse()));
});

test('fingerprints embedding text changes and rejects invalid snapshot JSON', async (context) => {
  const changed = DOCUMENTS.map((document) => ({ ...document }));
  changed[0] = { ...changed[0], text: 'Changed document' };
  assert.notEqual(fingerprintEmbeddingDocuments(DOCUMENTS), fingerprintEmbeddingDocuments(changed));

  const directory = await mkdtemp(path.join(tmpdir(), 'coach-snapshot-invalid-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, 'vectors.json');
  await writeFile(filePath, '{"schemaVersion":2}', 'utf8');
  await assert.rejects(() => readCoachEmbeddingSnapshot(filePath), /unsupported/i);
});
