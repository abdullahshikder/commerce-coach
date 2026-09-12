import assert from 'node:assert/strict';
import { test } from 'node:test';
import { OpenRouterEmbeddingProvider } from './openrouterEmbeddingProvider';

interface CapturedRequest {
  url: string;
  init?: RequestInit;
}

function jsonResponse(value: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(value), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
}

test('sends OpenRouter document batches and restores response index order', async () => {
  const requests: CapturedRequest[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    requests.push({ url: String(input), init });
    const body = JSON.parse(String(init?.body)) as { input: string[] };
    const data = body.input.map((_, index) => ({
      index,
      object: 'embedding',
      embedding: index === 0 ? [3, 0, 0] : [0, 4, 0],
    })).reverse();
    return jsonResponse({ object: 'list', model: 'google/gemini-embedding-2', data });
  };
  const provider = new OpenRouterEmbeddingProvider({
    apiKey: 'test-key',
    dimensions: 3,
    batchSize: 2,
    maxAttempts: 1,
    requestTimeoutMs: 1_000,
    fetchImpl,
  });

  const vectors = await provider.embed(['first document', 'second document', 'third document'], {
    task: 'retrieval-document',
  });

  assert.equal(requests.length, 2);
  assert.equal(requests[0].url, 'https://openrouter.ai/api/v1/embeddings');
  assert.equal(new Headers(requests[0].init?.headers).get('Authorization'), 'Bearer test-key');
  assert.equal(new Headers(requests[0].init?.headers).get('X-OpenRouter-Title'), 'Pathao Commerce Coach');
  const body = JSON.parse(String(requests[0].init?.body));
  assert.deepEqual(body.input, ['first document', 'second document']);
  assert.equal(body.input_type, 'search_document');
  assert.equal(body.encoding_format, 'float');
  assert.equal(body.dimensions, 3);
  assert.deepEqual(body.provider, { data_collection: 'deny', allow_fallbacks: true });
  assert.deepEqual(vectors[0], [1, 0, 0]);
  assert.deepEqual(vectors[1], [0, 1, 0]);
  assert.equal(vectors.length, 3);
});

test('uses the OpenRouter query input type', async () => {
  let body: Record<string, unknown> | undefined;
  const provider = new OpenRouterEmbeddingProvider({
    apiKey: 'test-key',
    dimensions: 3,
    maxAttempts: 1,
    requestTimeoutMs: 1_000,
    fetchImpl: async (_input, init) => {
      body = JSON.parse(String(init?.body));
      return jsonResponse({ data: [{ index: 0, embedding: [1, 0, 0] }] });
    },
  });

  await provider.embed(['catalogue question'], { task: 'retrieval-query' });
  assert.equal(body?.input_type, 'search_query');
  assert.deepEqual(body?.input, ['catalogue question']);
});

test('sends image and text together as an OpenRouter multimodal embedding input', async () => {
  let body: Record<string, unknown> | undefined;
  const provider = new OpenRouterEmbeddingProvider({
    apiKey: 'test-key',
    dimensions: 3,
    imageBatchSize: 1,
    maxAttempts: 1,
    requestTimeoutMs: 1_000,
    fetchImpl: async (_input, init) => {
      body = JSON.parse(String(init?.body));
      return jsonResponse({ data: [{ index: 0, embedding: [0, 1, 0] }] });
    },
  });

  const vectors = await provider.embedImages([{
    text: 'Ad Catalogues tab',
    image: { mimeType: 'image/png', base64: 'aW1hZ2U=' },
  }], { task: 'retrieval-document' });

  assert.deepEqual(body?.input, [{
    content: [
      { type: 'text', text: 'Ad Catalogues tab' },
      {
        type: 'image_url',
        image_url: { url: 'data:image/png;base64,aW1hZ2U=' },
      },
    ],
  }]);
  assert.equal(body?.input_type, 'search_document');
  assert.deepEqual(vectors, [[0, 1, 0]]);
});

test('retries a rate limit response and honors response indexes', async () => {
  let attempts = 0;
  const provider = new OpenRouterEmbeddingProvider({
    apiKey: 'test-key',
    dimensions: 3,
    maxAttempts: 2,
    requestTimeoutMs: 1_000,
    fetchImpl: async () => {
      attempts += 1;
      if (attempts === 1) return jsonResponse({ error: 'rate limited' }, {
        status: 429,
        headers: { 'Retry-After': '0' },
      });
      return jsonResponse({ data: [{ index: 0, embedding: [1, 0, 0] }] });
    },
  });

  assert.deepEqual(await provider.embed(['retry me']), [[1, 0, 0]]);
  assert.equal(attempts, 2);
});

test('rejects missing, encoded, and dimensionally invalid embeddings', async () => {
  const missing = new OpenRouterEmbeddingProvider({
    apiKey: 'test-key',
    dimensions: 3,
    maxAttempts: 1,
    requestTimeoutMs: 1_000,
    fetchImpl: async () => jsonResponse({ data: [] }),
  });
  await assert.rejects(() => missing.embed(['one']), /returned 0 vectors/i);

  const encoded = new OpenRouterEmbeddingProvider({
    apiKey: 'test-key',
    dimensions: 3,
    maxAttempts: 1,
    requestTimeoutMs: 1_000,
    fetchImpl: async () => jsonResponse({ data: [{ index: 0, embedding: 'base64' }] }),
  });
  await assert.rejects(() => encoded.embed(['one']), /non-float/i);

  const wrongDimensions = new OpenRouterEmbeddingProvider({
    apiKey: 'test-key',
    dimensions: 3,
    maxAttempts: 1,
    requestTimeoutMs: 1_000,
    fetchImpl: async () => jsonResponse({ data: [{ index: 0, embedding: [1, 0] }] }),
  });
  await assert.rejects(() => wrongDimensions.embed(['one']), /expected 3/i);
});
