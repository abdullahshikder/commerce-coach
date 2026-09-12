import 'dotenv/config';
import {config} from 'dotenv';
import {Pool} from 'pg';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {withSession,closeDb} from '../server/db';
import {importOKF} from '../server/coach/importOKF';
import {processDocument,retrieveDocuments} from '../server/coach/documents';
config({path:'data/admin.env',quiet:true});process.env.OPENROUTER_API_KEY='';process.env.VITE_OPENROUTER_API_KEY='';
const owner=new Pool({connectionString:process.env.MIGRATION_DATABASE_URL});const bundle=`verify-${randomUUID()}`,term=randomUUID().replaceAll('-','');
try{
 const actor=(await owner.query("SELECT s.token_hash FROM coach_private.sessions s JOIN coach_private.users u ON u.id=s.user_id WHERE s.expires_at>now() AND u.active AND u.role='admin' AND (NOT u.must_change_password OR s.auth_method='google') LIMIT 1")).rows[0];assert(actor,'An existing signed-in admin is required; no sessions are created.');
 const files=[{path:'index.md',content:'# Bundle'},...['stable','draft','deprecated'].map(status=>({path:`policies/${status}.md`,content:`---\ntype: Playbook\ntitle: ${status}\nstatus: ${status}\ncustom: {owner: commerce}\nsources: [{resource: /references/policy.md}]\n---\n${term} ${status} policy.`}))];
 await assert.rejects(importOKF(actor.token_hash,bundle,[files[1],{path:'bad.md',content:'bad'}]));
 assert.equal((await owner.query('SELECT id FROM public.coach_documents WHERE bundle_name=$1',[bundle])).rowCount,0);
 const result=await importOKF(actor.token_hash,bundle,files);assert.equal(result.ids.length,3);assert.deepEqual(result.reserved,['index.md']);
 assert.equal((await importOKF(actor.token_hash,bundle,files)).skipped.length,3);
 for(const id of result.ids){const token=randomUUID();const row=await withSession(actor.token_hash,async c=>(await c.query("UPDATE public.coach_documents SET status='processing',processing_token=$2 WHERE id=$1 RETURNING content,okf_metadata,concept_path",[id,token])).rows[0]);assert.equal(row.okf_metadata.custom.owner,'commerce');await processDocument(actor.token_hash,id,token,row.content);}
 const matches=await retrieveDocuments(actor.token_hash,term);assert.equal(matches.length,1);assert.equal(matches[0].document.metadata.conceptPath,'policies/stable.md');assert.equal(matches[0].document.metadata.bundle,bundle);
 await assert.rejects(importOKF('invalid-session',bundle,files));
 console.log('PASS: atomic validation, bundle paths, preserved metadata, duplicate detection, reserved files, lifecycle exclusion and authenticated import');
}finally{await owner.query('DELETE FROM public.coach_documents WHERE bundle_name=$1',[bundle]);await owner.end();await closeDb();}
