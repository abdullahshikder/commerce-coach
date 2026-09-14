import './secrets';
import { Pool, type PoolClient } from 'pg';
export const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000 });
export const authPool = new Pool({ connectionString: process.env.AUTH_DATABASE_URL, max: 4, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000 });
export async function checkDatabaseConnections() {
  await Promise.all([pool.query('SELECT 1'), authPool.query('SELECT 1')]);
}
export async function checkDatabase() {
  if (!process.env.DATABASE_URL || !process.env.AUTH_DATABASE_URL) throw new Error('DATABASE_URL is required. Run db:migrate with MIGRATION_DATABASE_URL first.');
  const { rows } = await pool.query(`SELECT r.rolsuper,r.rolbypassrls,r.rolcreaterole,
    pg_has_role(current_user,'coach_app','MEMBER') AS app_member,
    pg_has_role(current_user,'coach_auth','MEMBER') AS auth_member,
    pg_has_role(current_user,c.relowner,'MEMBER') AS owns_table,
    EXISTS(SELECT FROM pg_roles elevated WHERE (elevated.rolsuper OR elevated.rolbypassrls OR elevated.rolcreaterole) AND pg_has_role(current_user,elevated.oid,'MEMBER')) AS elevated_membership,
    c.relrowsecurity,c.relforcerowsecurity FROM pg_roles r,pg_class c
    WHERE r.rolname=current_user AND c.oid='public.coach_feedback'::regclass`);
  const row = rows[0];
  if (!row || row.rolsuper || row.rolbypassrls || row.rolcreaterole || row.owns_table || row.auth_member || row.elevated_membership || !row.app_member || !row.relrowsecurity || !row.relforcerowsecurity) {
    throw new Error('Unsafe database role: use a non-owner coach_app member without auth-role membership, superuser, CREATEROLE, or BYPASSRLS.');
  }
  if(!(await authPool.query("SELECT to_regprocedure('public.coach_take_budget(text,integer,integer)') IS NOT NULL AS ready")).rows[0].ready)throw new Error('Run database migrations before starting the hardened application.');
  const history=(await pool.query("SELECT relrowsecurity,relforcerowsecurity,pg_has_role(current_user,relowner,'MEMBER') AS owns FROM pg_class WHERE oid='public.coach_conversations'::regclass")).rows[0];
  if(!history?.relrowsecurity || !history.relforcerowsecurity || history.owns)throw new Error('Unsafe conversation table: forced RLS is required.');
  const queryLogs=(await pool.query("SELECT relrowsecurity,relforcerowsecurity,pg_has_role(current_user,relowner,'MEMBER') AS owns FROM pg_class WHERE oid='public.coach_query_logs'::regclass")).rows[0];
  if(!queryLogs?.relrowsecurity || !queryLogs.relforcerowsecurity || queryLogs.owns)throw new Error('Unsafe query log table: run the latest migrations and require forced RLS.');
  if(!(await pool.query("SELECT to_regclass('public.coach_knowledge') IS NOT NULL AS ready")).rows[0].ready)throw new Error('Knowledge mirror is unavailable. Run the latest database migration.');
  if(!(await pool.query("SELECT to_regprocedure('public.coach_admin_analytics(integer)') IS NOT NULL AS ready")).rows[0].ready)throw new Error('Analytics functions are unavailable. Run the latest database migration.');
  const auth = (await authPool.query(`SELECT pg_has_role(current_user,'coach_auth','MEMBER') AS auth_member, pg_has_role(current_user,'coach_app','MEMBER') AS app_member,
    EXISTS(SELECT FROM pg_roles r WHERE (r.rolsuper OR r.rolbypassrls OR r.rolcreaterole) AND pg_has_role(current_user,r.oid,'MEMBER')) AS elevated,
    pg_has_role(current_user,(SELECT relowner FROM pg_class WHERE oid='public.coach_feedback'::regclass),'MEMBER') AS owns_table`)).rows[0];
  if (!auth.auth_member || auth.app_member || auth.elevated || auth.owns_table) throw new Error('Unsafe authentication database role.');
}
export async function waitForDatabase(timeoutMs = Number(process.env.STARTUP_DATABASE_TIMEOUT_MS || 120000)) {
  const deadline = Date.now() + Math.max(1000, timeoutMs);
  let delayMs = 500;
  for (;;) {
    try { await checkDatabase(); return; }
    catch (error) {
      if (Date.now() >= deadline) throw error;
      console.error(JSON.stringify({ event: 'database_startup_retry', delayMs }));
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs = Math.min(delayMs * 2, 5000);
    }
  }
}
export async function withSession<T>(sessionHash: string, action: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Transaction-local context is cleared on commit/rollback before pooled connections are reused.
    await client.query("SELECT set_config('coach.session_hash',$1,true)", [sessionHash]);
    const result = await action(client);
    await client.query('COMMIT');
    return result;
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
export async function closeDb() { await Promise.all([pool.end(),authPool.end()]); }
