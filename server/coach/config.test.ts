import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getCoachEmbeddingConfig } from './config';

test('prefers the server-only OpenRouter key', () => {
  const config = getCoachEmbeddingConfig({
    OPENROUTER_API_KEY: 'server-key',
    VITE_OPENROUTER_API_KEY: 'browser-key',
  });
  assert.equal(config.apiKey, 'server-key');
  assert.equal(config.apiKeySource, 'server');
  assert.equal(config.model, 'google/gemini-embedding-2');
  assert.equal(config.dimensions, 768);
  assert.equal(config.imageBatchSize, 4);
});

test('supports the existing Vite OpenRouter key as a compatibility fallback', () => {
  const config = getCoachEmbeddingConfig({ VITE_OPENROUTER_API_KEY: 'browser-key' });
  assert.equal(config.apiKey, 'browser-key');
  assert.equal(config.apiKeySource, 'vite-compatibility');
});
