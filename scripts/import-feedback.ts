import 'dotenv/config';
import Database from 'better-sqlite3';
import { Pool } from 'pg';
const [sourcePath, organization, email] = process.argv.slice(2);
if (!sourcePath || !organization || !email || !process.env.MIGRATION_DATABASE_URL) throw new Error('Usage: npm run db:import -- /path/to/coach.db organization-slug owner@example.com (set MIGRATION_DATABASE_URL)');
const source = new Database(sourcePath,{readonly:true,fileMustExist:true});
const pool = new Pool({connectionString:process.env.MIGRATION_DATABASE_URL});
const client = await pool.connect();
try {
  const actor = (await client.query(`SELECT u.id,u.organization_id FROM coach_private.users u JOIN coach_private.organizations o ON o.id=u.organization_id WHERE o.slug=$1 AND u.email=$2`,[organization,email.toLowerCase()])).rows[0];
  if (!actor) throw new Error('Create the target organization and owner first.');
  const rows = source.prepare('SELECT * FROM coach_feedback').all() as Record<string,any>[];
  await client.query('BEGIN');
  // This offline migration must use the table owner/superuser, never the web application's login.
  // FORCE RLS is disabled only inside this transaction; a rollback restores it on any failure.
  await client.query('ALTER TABLE public.coach_feedback NO FORCE ROW LEVEL SECURITY');
  let count=0;
  for (const row of rows) {
    const result = await client.query(`INSERT INTO public.coach_feedback(id,organization_id,user_id,response_id,query,answer,rating,issue_type,comment,suggested_answer,screenshot_ids_json,retrieval_document_ids_json,provider,intent_id,status,review_note,created_at,updated_at)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) ON CONFLICT DO NOTHING`,
    [row.id,actor.organization_id,actor.id,row.response_id,row.query,row.answer,row.rating,row.issue_type,row.comment,row.suggested_answer,row.screenshot_ids_json,row.retrieval_document_ids_json,row.provider,row.intent_id || '',row.status,
     [row.review_note,row.reviewer_id ? `Legacy reviewer: ${row.reviewer_id}` : ''].filter(Boolean).join('\n'),row.created_at,row.updated_at]);
    count+=result.rowCount || 0;
  }
  await client.query('ALTER TABLE public.coach_feedback FORCE ROW LEVEL SECURITY');
  await client.query('COMMIT');
  console.log(`Imported ${count} feedback records into ${organization}; source and existing rows were preserved.`);
} catch(error) { await client.query('ROLLBACK'); throw error; }
finally { source.close(); client.release(); await pool.end(); }
