import './secrets';
import { Pool } from 'pg';
import { readFile } from 'node:fs/promises';
import { syncKnowledgeMirror } from './coach/knowledgeMirror';
export async function migrate() {
  if (!process.env.MIGRATION_DATABASE_URL || !process.env.DATABASE_URL || !process.env.AUTH_DATABASE_URL) throw new Error('Set MIGRATION_DATABASE_URL (owner) and DATABASE_URL and AUTH_DATABASE_URL (separate restricted logins).');
  const runtime = new URL(process.env.DATABASE_URL);
  const auth = new URL(process.env.AUTH_DATABASE_URL);
  if (runtime.username === auth.username) throw new Error('Data and authentication logins must be different.');
  const admin = new Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
  const client = await admin.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('commerce-coach-migrate'))");
    for (const file of ['001_security.sql', '002_google_sso.sql', '003_conversations.sql', '004_hardening.sql', '005_documents.sql', '006_okf.sql', '007_production.sql', '008_knowledge_queries.sql', '009_analytics.sql', '010_analytics_insights.sql', '011_feedback_corrections.sql', '012_token_usage_analytics.sql']) {
      await client.query(await readFile(new URL(`./migrations/${file}`, import.meta.url), 'utf8'));
    }
    await syncKnowledgeMirror(client);
    for (const [connection, group] of [[runtime, 'coach_app'], [auth, 'coach_auth']] as const) {
      const username = decodeURIComponent(connection.username);
      const password = decodeURIComponent(connection.password);
      if (!/^[a-z][a-z0-9_]{0,62}$/.test(username) || ['coach_app','coach_auth'].includes(username) || password.length < 20) throw new Error('Use separate named logins with passwords of at least 20 characters.');
      const existing = await client.query('SELECT rolsuper,rolbypassrls,rolcreaterole FROM pg_roles WHERE rolname=$1', [username]);
      if (existing.rows.some(row => row.rolsuper || row.rolbypassrls || row.rolcreaterole)) throw new Error('Refusing a privileged application login.');
      const action = existing.rowCount ? 'ALTER' : 'CREATE';
      const sql = (await client.query(`SELECT format('${action} ROLE %I LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD %L', $1::text, $2::text) AS sql`, [username,password])).rows[0].sql;
      await client.query(sql);
      await client.query(`GRANT ${group} TO "${username}"`);
    }
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); await admin.end(); }
}
