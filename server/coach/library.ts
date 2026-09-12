import {readFile,stat,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {posix} from 'node:path';
import {parseOKF,okfTrust,okfRetrievable} from './okf';
import {withSession} from '../db';
export const bundleRoot=fileURLToPath(new URL('../../knowledge/commerce-okf/',import.meta.url));
let cached:{mtime:number;documents:any[];assets:Set<string>}|undefined;
export async function builtInLibrary(){
 const mtime=(await stat(bundleRoot+'export-manifest.json')).mtimeMs;
 if(cached?.mtime===mtime)return cached;
 const manifest=JSON.parse(await readFile(bundleRoot+'export-manifest.json','utf8'));
 const documents=await Promise.all(manifest.concepts.map(async(entry:any)=>{
  const parsed=parseOKF(entry.path,await readFile(bundleRoot+entry.path,'utf8'));
  return {id:'builtin:'+entry.path,title:entry.title,type:entry.type,category:entry.path.split('/')[0],path:entry.path,bundle:'Commerce playbook',origin:'builtin',body:parsed.body,metadata:parsed.metadata};
 }));
 cached={mtime,documents,assets:new Set(await readdir(bundleRoot+'assets/screenshots'))};return cached;
}
export async function libraryDocuments(session:string){
 const builtIn=await builtInLibrary();
 const rows=await withSession(session,async c=>(await c.query(`SELECT id,name,content,concept_path,bundle_name,okf_metadata,status,to_jsonb(coach_documents)->>'publication' AS publication FROM public.coach_documents WHERE concept_path IS NOT NULL ORDER BY created_at DESC`)).rows);
 const imported=rows.map(row=>({id:'upload:'+row.id,title:row.name,type:row.okf_metadata.type,category:'workspace',path:row.concept_path,bundle:row.bundle_name,origin:'upload',body:parseOKF(row.concept_path,row.content).body,metadata:row.okf_metadata,processingStatus:row.status,publication:row.publication??'draft'}));
 return [...builtIn.documents,...imported];
}
export function resolveConceptLink(currentPath:string,target:string){
 if(!target||/^[a-z][a-z0-9+.-]*:/i.test(target)||target.startsWith('//'))return undefined;
 const path=target.split('#')[0];
 return posix.normalize(path.startsWith('/')?path.slice(1):posix.join(posix.dirname(currentPath),path));
}
export function libraryDetail(document:any,documents:any[]){
 const links=[...document.body.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)].map(match=>{
  const path=resolveConceptLink(document.path,match[1]);
  const found=documents.find(other=>other.origin===document.origin&&other.bundle===document.bundle&&other.path===path);
  return {href:match[1],id:found?.id,title:found?.title};
 });
 // Expand only trusted bundled visual guides, once, without following recursive links.
 const expanded=new Set<string>();
 const body=document.body.replace(/(?<!!)\[([^\]]*)\]\(([^)]+)\)/g,(original:string,_label:string,href:string)=>{
  const target=links.find(link=>link.href===href)?.id;
  const guide=documents.find(other=>other.id===target&&other.origin==='builtin'&&other.category==='visual-guides');
  if(document.origin!=='builtin'||!guide||guide.id===document.id)return original;
  if(expanded.has(guide.id))return '';
  expanded.add(guide.id);
  return '\n'+guide.body.replace(/^# .+\n*/, '')+'\n';
 });
 return {...document,body,links,trust:okfTrust(document.metadata),current:okfRetrievable(document.metadata)&&(document.origin==='builtin'||document.publication==='published')};
}
