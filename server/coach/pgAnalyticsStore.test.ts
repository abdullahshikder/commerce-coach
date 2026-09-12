import assert from 'node:assert/strict';
import test from 'node:test';
import { PgAnalyticsStore } from './pgAnalyticsStore';

test('uses narrow database functions for anonymous analytics', async () => {
  const calls: Array<{ sql: string; values: unknown[] }> = [];
  const client = { async query(sql: string, values: unknown[] = []) {
    calls.push({ sql, values });
    return { rows: [{ analytics: { totals: { queries: 4 } } }] };
  } };
  const store = new PgAnalyticsStore(client as never);
  await store.recordGenerationFailure('gemini', 'provider-request');
  assert.deepEqual(await store.readDashboard(30), { totals: { queries: 4 } });
  assert.match(calls[0].sql, /coach_record_generation_failure/);
  assert.deepEqual(calls[0].values, ['gemini', 'provider-request']);
  assert.match(calls[1].sql, /coach_admin_analytics/);
  assert.deepEqual(calls[1].values, [30]);
  assert.ok(calls.every(call => !/coach_query_logs|query|answer/i.test(call.sql.replace('coach_admin_analytics','').replace('coach_record_generation_failure',''))));
});
