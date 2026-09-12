import 'dotenv/config';
import { Pool } from 'pg';
import { buildKnowledgeMirrorRecords, syncKnowledgeMirror } from '../server/coach/knowledgeMirror';

async function main(): Promise<void> {
  if (!process.env.MIGRATION_DATABASE_URL) {
    throw new Error('MIGRATION_DATABASE_URL is required to synchronize built-in knowledge.');
  }
  const pool = new Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('commerce-coach-knowledge-sync'))");
    const result = await syncKnowledgeMirror(client, buildKnowledgeMirrorRecords());
    await client.query('COMMIT');
    console.log(`Synchronized ${result.active} knowledge records (${result.merchantFaqs} merchant FAQs).`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
