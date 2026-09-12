import 'dotenv/config';
import {config} from 'dotenv';
import {Pool} from 'pg';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {withSession,closeDb} from '../server/db';
import {processDocument,retrieveDocuments} from '../server/coach/documents';
config({path:'data/admin.env',quiet:true});
// Synthetic verification content must not leave the local machine.
process.env.OPENROUTER_API_KEY='';process.env.VITE_OPENROUTER_API_KEY='';
const owner=new Pool({connectionString:process.env.MIGRATION_DATABASE_URL});
const id=randomUUID(),token=randomUUID(),term=`verification${randomUUID().replaceAll('-','')}`;
try{
 const actor=(await owner.query("SELECT s.token_hash,u.id,u.organization_id FROM coach_private.sessions s JOIN coach_private.users u ON u.id=s.user_id WHERE s.expires_at>now() AND u.active AND u.role='admin' AND (NOT u.must_change_password OR s.auth_method='google') LIMIT 1")).rows[0];
 assert(actor,'Sign in as an existing local admin before running this check. No accounts or sessions are created.');
 const content=`${term} policy: returns are accepted within fourteen days.`;
 await withSession(actor.token_hash,c=>c.query("INSERT INTO public.coach_documents(id,organization_id,created_by,name,content,content_hash,status,processing_token,lease_until) VALUES($1,$2,$3,'processor-check.txt',$4,$5,'processing',$6,now()+interval '2 minutes')",[id,actor.organization_id,actor.id,content,term,token]));
 assert.equal((await retrieveDocuments(actor.token_hash,term)).length,0,'Unprocessed content must not be searchable');
 assert.equal((await withSession('invalid-session',c=>c.query('SELECT id FROM public.coach_documents WHERE id=$1',[id]))).rowCount,0);
 assert.equal((await processDocument(actor.token_hash,id,randomUUID(),content)).saved,false,'Stale workers cannot publish');
 assert.equal((await processDocument(actor.token_hash,id,token,content)).mode,'keyword');
 const results=await retrieveDocuments(actor.token_hash,term);assert(results.some(result=>result.document.id===`upload:${id}:0`&&result.document.text===content));
 assert.equal((await retrieveDocuments('invalid-session',term)).length,0,'Unauthenticated callers cannot retrieve uploads');
 const embeddedToken=randomUUID();
 await withSession(actor.token_hash,c=>c.query("UPDATE public.coach_documents SET status='processing',processing_token=$2 WHERE id=$1",[id,embeddedToken]));
 const fakeProvider={name:'test',model:'test-model',embed:async(texts:readonly string[])=>texts.map(()=>[1,0,0])};
 assert.equal((await processDocument(actor.token_hash,id,embeddedToken,content,fakeProvider)).mode,'semantic');
 const semantic=await retrieveDocuments(actor.token_hash,'different phrasing',4,fakeProvider);
 assert(semantic.some(result=>result.document.id===`upload:${id}:0`&&result.semantic===1));
 await withSession(actor.token_hash,c=>c.query('DELETE FROM public.coach_documents WHERE id=$1',[id]));
 assert.equal((await retrieveDocuments(actor.token_hash,term)).length,0);
 console.log('PASS: keyword and mocked semantic processing, stale-job protection, retrieval with source, unpublished/unauthenticated isolation, and removal');
}finally{await owner.query('DELETE FROM public.coach_documents WHERE id=$1',[id]);await owner.end();await closeDb();}
