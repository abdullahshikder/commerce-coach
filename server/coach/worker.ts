import {randomUUID} from 'node:crypto';
import {pipelineReady} from '../production';
import {authPool} from '../db';
import {chunkDocument,documentProvider} from './documents';
import {parseOKF} from './okf';
let nextPreviewCleanup=0;
export async function prepareDocument(content:string,path?:string,provider=documentProvider()){
 const parsed=path?parseOKF(path,content):undefined;
 // Index meaningful prose, not the full metadata/source record duplicated in OKF exports.
 const text=parsed?`${parsed.metadata.title??path}\n${parsed.metadata.description??''}\n${Array.isArray(parsed.metadata.tags)?parsed.metadata.tags.join(' '):''}\n\n${parsed.body}`:content;
 const texts=chunkDocument(text);const vectors=provider?await provider.embed(texts,{task:'retrieval-document'}):undefined;
 if(vectors&&(vectors.length!==texts.length||vectors.some(v=>!v.length||v.some(n=>!Number.isFinite(n))||v.length!==vectors[0].length)))throw new Error('Invalid embedding response');
 return {chunks:texts.map((text,i)=>({text,...(vectors?{vector:vectors[i]}:{})})),model:provider?.model??null,dimensions:vectors?.[0].length??null};
}
export async function runDocumentJob(){
 if(!await pipelineReady())return false;
 if(Date.now()>=nextPreviewCleanup){await authPool.query('SELECT public.coach_cleanup_embedding_previews()');nextPreviewCleanup=Date.now()+60000;}
 const token=randomUUID();const doc=(await authPool.query('SELECT * FROM public.coach_claim_document($1)',[token])).rows[0];
 if(!doc)return false;const started=Date.now();
 try{const result=await prepareDocument(doc.content,doc.concept_path);
 const saved=await authPool.query('SELECT public.coach_finish_document($1,$2,$3,$4,$5) AS saved',[doc.id,token,JSON.stringify(result.chunks),result.model,result.dimensions]);
 console.log(JSON.stringify({event:'document_job',documentId:doc.id,outcome:saved.rows[0].saved?'processed':'discarded',durationMs:Date.now()-started}));
 }catch{await authPool.query('SELECT public.coach_finish_document($1,$2,NULL,NULL,NULL)',[doc.id,token]);console.error(JSON.stringify({event:'document_job',documentId:doc.id,outcome:'retry_or_failed',durationMs:Date.now()-started}));}
 return true;
}
export function startDocumentWorker(){
 let stopped=false;let timer:ReturnType<typeof setTimeout>|undefined;let running=Promise.resolve();
 const tick=()=>{running=(async()=>{try{await runDocumentJob();}catch{console.error(JSON.stringify({event:'worker_unavailable'}));}finally{if(!stopped)timer=setTimeout(tick,2000);}})();};tick();
 return async()=>{stopped=true;if(timer)clearTimeout(timer);await running;};
}
