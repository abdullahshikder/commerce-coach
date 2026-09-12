import assert from 'node:assert/strict';
import test from 'node:test';
import { buildKnowledgeMirrorRecords, syncKnowledgeMirror } from './knowledgeMirror';

test('builds a deterministic SQL mirror for all knowledge and merchant FAQs', () => {
  const records = buildKnowledgeMirrorRecords();
  assert.equal(records.length, 238);
  assert.equal(records.filter(({ recordType }) => recordType === 'merchant-faq').length, 113);
  assert.equal(new Set(records.map(({ id }) => id)).size, records.length);
  const faq = records.find(({ id }) => id === 'merchant-faq-084');
  assert.equal(faq?.translations?.bn?.question, 'বাল্ক প্রোডাক্ট আপলোডে কিছু রো ফেল করেছে কেন?');
  assert.match(faq?.contentHash ?? '', /^[a-f0-9]{64}$/);
  assert.equal(buildKnowledgeMirrorRecords().find(({ id }) => id === faq?.id)?.contentHash, faq?.contentHash);
});

test('marks the prior mirror inactive and upserts current records', async () => {
  const calls: { sql: string; values?: unknown[] }[] = [];
  const client = {
    async query(sql: string, values?: unknown[]) {
      calls.push({ sql, values });
      return { rowCount: 1 };
    },
  };
  const records = buildKnowledgeMirrorRecords().slice(0, 2);
  const result = await syncKnowledgeMirror(client, records);
  assert.match(calls[0].sql, /SET active=false/);
  assert.equal(calls.length, 3);
  assert.match(calls[1].sql, /ON CONFLICT\(id\) DO UPDATE/);
  assert.equal(calls[1].values?.[0], records[0].id);
  assert.deepEqual(result, { active: 2, merchantFaqs: records.filter(record => record.recordType === 'merchant-faq').length });
});
