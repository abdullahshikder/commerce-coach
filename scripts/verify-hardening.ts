import 'dotenv/config';
import { config } from 'dotenv';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';
import { app } from '../server/app';
import { takeBudget, publicAssets } from '../server/security';
import { digest } from '../server/auth/password';
import { closeDb, checkDatabase } from '../server/db';
config({path:'data/admin.env',quiet:true});
const owner=new Pool({connectionString:process.env.MIGRATION_DATABASE_URL});
const server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));
const base=`http://127.0.0.1:${(server.address() as {port:number}).port}`;
const key=`security-check:${randomUUID()}`;
try {
 await checkDatabase();
 const manifest=JSON.parse(await readFile('dist/.vite/manifest.json','utf8'));
 const entry=manifest['index.html'].file;const workspace=manifest['src/auth/AppShell.tsx'].file;
 const image=Object.values(manifest).find((value:any)=>value.file?.endsWith('.jpg')) as {file:string};
 assert(image);
 for(const path of [`/${workspace}`,`/${image.file}`,`/%61ssets/${workspace.split('/').pop()}`,`//${workspace}`]) {
   const response=await fetch(base+path);assert.equal(response.status,401,path);assert.match(response.headers.get('cache-control')||'',/no-store/);
 }
 for(const path of ['/',`/${entry}`])assert.equal((await fetch(base+path)).status,200,path);
 const response=await fetch(base+'/');
 assert.match(response.headers.get('content-security-policy')||'',/frame-ancestors 'none'/);
 assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.equal(response.headers.get('x-frame-options'),'DENY');
 assert.equal((await fetch(base+'/api/conversations')).status,401);
 const publicFiles=publicAssets('dist/.vite/manifest.json');assert(!publicFiles.has('/'+workspace));
 // Documentation-specific content must not occur in the public entry or its static imports.
 for(const file of publicFiles)if(file.endsWith('.js'))assert(!(await readFile('dist'+file,'utf8')).includes('Instant Checkout'));
 if(process.env.VERIFY_DEV==='true'){
  for(const path of ['/src/coach/knowledgeBase.ts','/src/auth/AppShell.tsx','/%73rc/coach/knowledgeBase.ts'])assert.equal((await fetch('http://127.0.0.1:8010'+path)).status,401,path);
  assert.equal((await fetch('http://127.0.0.1:8010/src/main.tsx')).status,200);
  console.log('PASS: development source protection and public sign-in entry');
 }
 console.log('PASS: public sign-in, protected workspace/images, encoded paths, security headers, and API authentication');
 const results=await Promise.all(Array.from({length:10},()=>takeBudget(key,3,60)));
 assert.equal(results.filter(Boolean).length,3);
 assert.equal(await takeBudget(key,3,60),false);
 console.log('PASS: shared PostgreSQL rate budget is atomic under concurrent requests');
 const client=await owner.connect();
 try {
  const user=(await client.query('SELECT id,organization_id FROM coach_private.users LIMIT 1')).rows[0];assert(user,'An existing local user is required; this check never creates accounts.');
  for(const [scope,limit] of [['user',200],['org',2000]] as const){
   await client.query('BEGIN');
   try {
    await client.query('INSERT INTO coach_private.conversation_usage(key,total) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET total=excluded.total',[`${scope}:${scope==='user'?user.id:user.organization_id}`,limit]);
    await assert.rejects(client.query('INSERT INTO public.coach_conversations(id,organization_id,user_id,title,messages,state) VALUES($1,$2,$3,$4,$5,$6)',[randomUUID(),user.organization_id,user.id,'quota test',JSON.stringify([{role:'user',content:'test'}]),'{}']),{code:'P0001'});
   } finally {await client.query('ROLLBACK');}
  }
 }finally{client.release();}
 console.log('PASS: per-user and organization storage quotas reject inserts; all quota-test changes rolled back');
} finally {
 await owner.query('DELETE FROM coach_private.request_budgets WHERE key=$1',[digest(key)]);
 await new Promise<void>(resolve=>server.close(()=>resolve()));await closeDb();await owner.end();
}
