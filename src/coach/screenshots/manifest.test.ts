import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  SCREENSHOT_INDEX,
  SCREENSHOT_REGISTRY,
  buildScreenshotSearchQuery,
  getScreenshots,
  searchScreenshots,
  selectResponseScreenshots,
} from './manifest';

const memoImagesDirectory = fileURLToPath(
  new URL('./', import.meta.url),
);

test('indexes every Product Memo image and avoids duplicates within a guide', () => {
  const memoImages = readdirSync(memoImagesDirectory)
    .filter((name) => /\.(jpg|png)$/i.test(name))
    .sort();
  const indexedImages = [...new Set(SCREENSHOT_INDEX.map((screenshot) => screenshot.src))].sort();

  assert.deepEqual(indexedImages, memoImages);
  for (const guide of SCREENSHOT_REGISTRY) {
    const images = guide.screenshots.map((screenshot) => screenshot.src);
    assert.equal(new Set(images).size, images.length, `${guide.featureId} contains a duplicate image`);
  }
});

test('keeps the corrected memo sequence for previously omitted images', () => {
  assert.deepEqual(
    getScreenshots('checkout-001').map((screenshot) => screenshot.src),
    ['image21.jpg', 'image10.png', 'image73.png', 'image59.png', 'image11.png', 'image78.png'],
  );
  assert.equal(getScreenshots('delivery-001').at(-1)?.src, 'image42.jpg');
  assert.equal(getScreenshots('delivery-003').at(-1)?.src, 'image29.jpg');
});

test('ranks specific Product Memo screens from natural-language searches', () => {
  assert.equal(searchScreenshots('webhook callback URL and secret')[0]?.src, 'image29.jpg');
  assert.equal(searchScreenshots('submitted Instant Delivery form')[0]?.src, 'image42.jpg');
  assert.equal(searchScreenshots('crop image and copy CDN URL')[0]?.src, 'image104.jpg');
  assert.equal(searchScreenshots('Facebook permissions')[0]?.src, 'image52.jpg');
});

test('keeps ad catalogue guidance focused and in workflow order', () => {
  const results = searchScreenshots(
    'How do I create an ad catalogue from my Online Store products?',
    { limit: 4 },
  );

  assert.deepEqual(
    results.map(({ src, step }) => ({ src, step })),
    [
      { src: 'image30.jpg', step: 1 },
      { src: 'image31.jpg', step: 2 },
      { src: 'image69.jpg', step: 3 },
      { src: 'image26.jpg', step: 4 },
    ],
  );
});

test('orders a typoed ad catalogue workflow from the first step', () => {
  const results = searchScreenshots(
    'HOW DO I CREATE MY ADD CATELOGUE FOR META ADS',
    { limit: 4 },
  );

  assert.deepEqual(
    results.map(({ src, step }) => ({ src, step })),
    [
      { src: 'image30.jpg', step: 1 },
      { src: 'image31.jpg', step: 2 },
      { src: 'image69.jpg', step: 3 },
      { src: 'image26.jpg', step: 4 },
    ],
  );
});

test('shows the Orders tabs when Instant Checkout is missing from New Orders', () => {
  const results = searchScreenshots(
    'cant find instant check order in new order tab',
    { limit: 2 },
  );

  assert.deepEqual(
    results.map(({ featureId, src, step }) => ({ featureId, src, step })),
    [
      { featureId: 'orders-001', src: 'image4.jpg', step: 1 },
      { featureId: 'orders-001', src: 'image5.jpg', step: 2 },
    ],
  );
});

test('keeps New Order and Instant Checkout chat actions in the chat guide', () => {
  const result = searchScreenshots(
    'Open New Order or Instant Checkout from the chat cart',
    { limit: 1 },
  )[0];

  assert.equal(result?.featureId, 'chats-004');
  assert.equal(result?.src, 'image58.jpg');
});

test('does not let model suggestions expand a deterministic visual guide', () => {
  const indexed = searchScreenshots(
    'cant find instant check order in new order tab',
    { limit: 4 },
  );
  const suggested = getScreenshots('orders-001');

  assert.deepEqual(
    selectResponseScreenshots(indexed, suggested).map(({ src }) => src),
    ['image4.jpg', 'image5.jpg'],
  );
});

test('carries the previous user topic into an ambiguous screenshot follow-up', () => {
  const query = buildScreenshotSearchQuery(
    'tell me how create from the start',
    [
      { role: 'user', content: 'HOW DO I CREATE MY ADD CATELOGUE FOR META ADS' },
      { role: 'assistant', content: 'Open the Ad Catalogues tab.' },
      { role: 'user', content: 'tell me how create from the start' },
    ],
  );

  assert.deepEqual(
    searchScreenshots(query, { limit: 4 }).map(({ src, step }) => ({ src, step })),
    [
      { src: 'image30.jpg', step: 1 },
      { src: 'image31.jpg', step: 2 },
      { src: 'image69.jpg', step: 3 },
      { src: 'image26.jpg', step: 4 },
    ],
  );
});

test('returns a small, unique visual result set', () => {
  const results = searchScreenshots('create a product with variants');

  assert.ok(results.length > 0 && results.length <= 4);
  assert.equal(new Set(results.map((result) => result.src)).size, results.length);
  assert.ok(results.every((result) => !/[—–]/.test(result.caption)));
});
