import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import type {
  EmbeddingDocument,
  EmbeddingImageInput,
  EmbeddingRequestOptions,
  MultimodalEmbeddingProvider,
} from '../../src/coach/embeddings';
import { buildCoachMultimodalEmbeddingIndex } from './buildEmbeddingIndex';
import { fingerprintCoachEmbeddingSources } from './imageEmbeddingSources';

const DOCUMENTS: EmbeddingDocument[] = [
  {
    id: 'knowledge:catalogue',
    kind: 'knowledge',
    text: 'Create an ad catalogue for Meta.',
    metadata: {},
  },
  {
    id: 'screenshot:catalogue:screen.png',
    kind: 'screenshot',
    text: 'The Ad Catalogues tab.',
    metadata: { image: 'screen.png' },
  },
];

class TestMultimodalProvider implements MultimodalEmbeddingProvider {
  readonly name = 'test';
  readonly model = 'multimodal-v1';
  readonly imageRequests: EmbeddingImageInput[][] = [];

  async embed(
    texts: readonly string[],
    _options: EmbeddingRequestOptions = {},
  ): Promise<number[][]> {
    return texts.map(() => [1, 0, 0]);
  }

  async embedImages(
    inputs: readonly EmbeddingImageInput[],
    _options: EmbeddingRequestOptions = {},
  ): Promise<number[][]> {
    this.imageRequests.push([...inputs]);
    return inputs.map(() => [0, 1, 0]);
  }
}

test('builds one index from text passages and actual screenshot bytes', async (context) => {
  const imageDirectory = await mkdtemp(path.join(tmpdir(), 'coach-images-'));
  context.after(() => rm(imageDirectory, { recursive: true, force: true }));
  await writeFile(path.join(imageDirectory, 'screen.png'), Buffer.from('first-image'));
  const provider = new TestMultimodalProvider();

  const built = await buildCoachMultimodalEmbeddingIndex(DOCUMENTS, provider, imageDirectory);

  assert.equal(built.index.size, 2);
  assert.equal(built.textDocumentCount, 1);
  assert.equal(built.imageDocumentCount, 1);
  assert.equal(built.index.search([1, 0, 0])[0]?.document.kind, 'knowledge');
  assert.equal(built.index.search([0, 1, 0])[0]?.document.kind, 'screenshot');
  assert.equal(provider.imageRequests[0]?.[0]?.text, 'The Ad Catalogues tab.');
  assert.equal(provider.imageRequests[0]?.[0]?.image.mimeType, 'image/png');
  assert.equal(
    Buffer.from(provider.imageRequests[0]?.[0]?.image.base64 ?? '', 'base64').toString(),
    'first-image',
  );

  await writeFile(path.join(imageDirectory, 'screen.png'), Buffer.from('changed-image'));
  assert.notEqual(
    built.sourceFingerprint,
    await fingerprintCoachEmbeddingSources(DOCUMENTS, imageDirectory),
  );
});

test('rejects screenshot paths that can escape the image directory', async () => {
  const unsafe = [{
    ...DOCUMENTS[1],
    metadata: { image: '../screen.png' },
  }];
  await assert.rejects(
    () => fingerprintCoachEmbeddingSources(unsafe),
    /unsafe image filename/i,
  );
});
