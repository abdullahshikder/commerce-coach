import assert from 'node:assert/strict';
import test from 'node:test';
import { PgQueryStore } from './pgQueryStore';

test('stores a successful query under the authenticated actor with bounded metadata', async () => {
  let sql = '';
  let values: unknown[] = [];
  const client = {
    async query(statement: string, parameters?: unknown[]) {
      sql = statement;
      values = parameters ?? [];
      return { rows: [{ id: '11111111-1111-4111-8111-111111111111' }] };
    },
  };
  const actor = {
    id: '22222222-2222-4222-8222-222222222222',
    organization_id: '33333333-3333-4333-8333-333333333333',
    email: 'merchant@example.com',
    name: 'Merchant',
    role: 'member' as const,
    organization_name: 'Pathao',
    organization_slug: 'pathao',
    must_change_password: false,
    csrf_token: 'token',
  };
  const store = new PgQueryStore(client as never, actor);
  const id = await store.save({
    id: '11111111-1111-4111-8111-111111111111',
    query: 'How do I upload products?',
    answer: 'Open Products and choose Bulk Upload.',
    provider: 'gemini',
    mode: 'normal',
    retrievalDocumentIds: ['knowledge:bulk-001'],
    screenshotIds: ['image57.jpg'],
  });
  assert.match(sql, /INSERT INTO public\.coach_query_logs/);
  assert.equal(values[1], actor.organization_id);
  assert.equal(values[2], actor.id);
  assert.equal(values[7], JSON.stringify(['knowledge:bulk-001']));
  assert.equal(values[8], JSON.stringify(['image57.jpg']));
  assert.equal(id, '11111111-1111-4111-8111-111111111111');
});
