import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ChatMessage } from '../responseEngine';
import { getScreenshots, getScreenshotTutorials } from '../screenshots/manifest';
import { responseImageCaption, responseImageText } from './responseImageText';

test('keeps tutorial URLs outside the copied image text', () => {
  const screenshots = getScreenshots('signup-001');
  const message: ChatMessage = {
    id: 'answer-1',
    role: 'assistant',
    content: '**Create** your account.',
    timestamp: new Date('2026-09-13T00:00:00Z'),
    metadata: { feature: 'Signup', screenshots },
  };
  const imageText = responseImageText(message);
  const caption = responseImageCaption(message);

  assert.match(imageText, /Create your account\./);
  assert.equal(caption, 'https://www.youtube.com/watch?v=weYyy08MafM&list=PLMN1y8VZcPd8');
  for (const tutorial of getScreenshotTutorials(screenshots)) {
    assert.doesNotMatch(imageText, new RegExp(tutorial.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.doesNotMatch(imageText, new RegExp(tutorial.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(caption, new RegExp(tutorial.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.doesNotMatch(caption, new RegExp(tutorial.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('omits the share caption when an answer has no tutorial screenshots', () => {
  assert.equal(responseImageCaption({
    id: 'answer-2',
    role: 'assistant',
    content: 'No visual guide.',
    timestamp: new Date('2026-09-13T00:00:00Z'),
  }), '');
});
