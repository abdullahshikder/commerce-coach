import '../server/secrets';
import {spawn} from 'node:child_process';
import {Pool} from 'pg';
const dump=process.argv[2],connection=process.env.RESTORE_TEST_DATABASE_URL;
if(!dump||!connection||!process.argv.includes('--execute'))throw new Error('Usage: RESTORE_TEST_DATABASE_URL=<existing empty coach_restore_* database> npm run db:restore-drill -- /private/backup.dump --execute');
const url=new URL(connection);if(!/^\/coach_restore_[a-z0-9_]+$/.test(url.pathname))throw new Error('Restore drills only accept a dedicated coach_restore_* database.');
const pool=new Pool({connectionString:connection});
try{
 const tables=await pool.query("SELECT FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%' AND c.relkind IN ('r','p')");
 if(tables.rowCount)throw new Error('Restore target must be empty. No existing data will be overwritten.');
 await new Promise<void>((resolve,reject)=>{const child=spawn('pg_restore',['--exit-on-error','--single-transaction','--no-owner','--no-privileges','--dbname',url.pathname.slice(1),dump],{stdio:['ignore','ignore','pipe'],env:{...process.env,PGHOST:url.hostname,PGPORT:url.port||'5432',PGUSER:decodeURIComponent(url.username),PGPASSWORD:decodeURIComponent(url.password)}});child.stderr.resume();child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error('Restore failed. Inspect the isolated target; no production database was changed.')));});
 const flags=(await pool.query("SELECT relname,relrowsecurity,relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND relname IN ('coach_documents','coach_attachments','coach_conversations','coach_feedback','coach_query_logs')")).rows;
 if(flags.length!==5||flags.some(row=>!row.relrowsecurity||!row.relforcerowsecurity))throw new Error('Restored RLS configuration is incomplete.');
 await pool.query('SET row_security=off');
 const counts=(await pool.query('SELECT (SELECT count(*) FROM public.coach_documents)::integer AS documents,(SELECT count(*) FROM public.coach_attachments)::integer AS images,(SELECT count(*) FROM public.coach_conversations)::integer AS conversations,(SELECT count(*) FROM public.coach_query_logs)::integer AS queries,(SELECT count(*) FROM public.coach_knowledge WHERE active)::integer AS knowledge,(SELECT count(*) FROM coach_private.analytics_queries)::integer AS analytics_queries,(SELECT count(*) FROM coach_private.analytics_feedback)::integer AS analytics_feedback')).rows[0];
 console.log(JSON.stringify({restoreVerified:true,counts,notice:'Data and RLS flags verified in isolated target. Run migrations and the isolated security suite before promoting a restored database.'}));
}finally{await pool.end();}
