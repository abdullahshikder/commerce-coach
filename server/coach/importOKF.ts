import {randomUUID} from 'node:crypto';
import {withSession} from '../db';
import {digest} from '../auth/password';
import {parseOKF} from './okf';
export async function importOKF(sessionHash:string,bundle:unknown,files:unknown){
 if(typeof bundle!=='string'||! /^[a-zA-Z0-9][a-zA-Z0-9 _.-]{0,79}$/.test(bundle))throw new Error('Use a bundle name of 1–80 letters, numbers, spaces, dots, underscores or hyphens.');
 if(!Array.isArray(files)||!files.length||files.length>52)throw new Error('Choose up to 50 concepts plus index.md and log.md.');
 const seen=new Set<string>();
 const parsed=files.map(file=>{
  if(!file||typeof file.path!=='string'||!file.path.endsWith('.md')||typeof file.content!=='string')throw new Error('OKF bundles contain UTF-8 Markdown files.');
  if(seen.has(file.path))throw new Error(`Duplicate path: ${file.path}`);seen.add(file.path);
  return {...parseOKF(file.path,file.content),content:file.content};
 });
 const concepts=parsed.filter(file=>!file.reserved);if(!concepts.length||concepts.length>50)throw new Error('Choose between 1 and 50 concept documents. Index and log files are not concepts.');
 // Validate the complete batch before inserting, then commit all concepts atomically.
 return withSession(sessionHash,async client=>{
  const actor=(await client.query('SELECT * FROM public.coach_actor()')).rows[0];
  if(!actor||actor.role!=='admin'||actor.must_change_password)throw new Error('Administrator access is required.');
  const ids:string[]=[],skipped:string[]=[],imported:{id:string;path:string}[]=[];
  for(const file of concepts){
   const title=typeof file.metadata.title==='string'?file.metadata.title:file.path;
   const result=await client.query(`INSERT INTO public.coach_documents(id,organization_id,created_by,name,content,content_hash,okf_metadata,concept_path,bundle_name) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING RETURNING id`,[randomUUID(),actor.organization_id,actor.id,title.slice(0,150)||file.path.slice(0,150),file.content,digest(file.content.trim()),JSON.stringify(file.metadata),file.path,bundle.trim()]);
   if(result.rows[0]){ids.push(result.rows[0].id);imported.push({id:result.rows[0].id,path:file.path});}else skipped.push(file.path);
  }
  return {ids,imported,skipped,reserved:parsed.filter(file=>file.reserved).map(file=>file.path)};
 });
}
