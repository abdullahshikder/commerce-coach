import {pipelineReady} from '../production';
import { parseOKF, okfRetrievable, okfTrust } from './okf';
import type { EmbeddingProvider } from '../../src/coach/embeddings';
import { withSession } from '../db';
import { getCoachEmbeddingConfig } from './config';
import { OpenRouterEmbeddingProvider } from './openrouterEmbeddingProvider';

export function chunkDocument(content:string):string[] {
  const text=content.replace(/\r\n?/g,'\n').trim();
  if(!text||text.includes('\0')||Buffer.byteLength(text)>65536)throw new Error('Upload a non-empty UTF-8 text file up to 64 KB.');
  const chunks:string[]=[];
  for(let start=0;start<text.length;){
    let end=Math.min(start+1800,text.length);
    if(end<text.length){const boundary=text.lastIndexOf('\n',end);if(boundary>start+900)end=boundary;}
    chunks.push(text.slice(start,end));if(end===text.length)break;start=end-160;
  }
  if(chunks.length>48)throw new Error('This document has too many sections. Split it into smaller files.');
  return chunks;
}
export function documentProvider(){const c=getCoachEmbeddingConfig();return c.apiKey?new OpenRouterEmbeddingProvider({apiKey:c.apiKey,model:c.model,dimensions:c.dimensions,batchSize:16,maxAttempts:1,requestTimeoutMs:15000}):undefined;}
export function cosine(a:number[],b:number[]){if(a.length!==b.length||!a.length)return 0;let dot=0,aa=0,bb=0;for(let i=0;i<a.length;i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i];}return aa&&bb?dot/Math.sqrt(aa*bb):0;}
function tokens(text:string){return new Set(text.toLowerCase().match(/[\p{L}\p{N}\p{M}]+/gu)?.filter(word=>word.length>1)??[]);}
export async function retrieveDocuments(sessionHash:string,query:string,limit=4,provider:EmbeddingProvider|undefined=documentProvider()){
  if(!await pipelineReady())return [];
  const rows=await withSession(sessionHash,async client=>(await client.query("SELECT id,name,chunks,model,okf_metadata,concept_path,bundle_name FROM public.coach_documents WHERE status='ready' AND publication='published' ORDER BY created_at DESC LIMIT 50")).rows);
  if(!rows.length)return [];
  let vector:number[]|undefined;
  if(provider&&rows.some(row=>row.model===provider.model)){try{vector=(await provider.embed([query],{task:'retrieval-query'}))[0];}catch{/* Keyword search remains available if the provider is unavailable. */}}
  const terms=tokens(query);
  return rows.filter(row=>okfRetrievable(row.okf_metadata??{})).flatMap(row=>(row.chunks as {text:string;vector?:number[]}[]).map((chunk,index)=>{
    const words=tokens(chunk.text);const matched=[...terms].filter(term=>words.has(term)).length;
    const lexical=terms.size?matched/terms.size:0;
    const semantic=vector&&chunk.vector&&row.model===provider?.model?cosine(vector,chunk.vector):0;
    return {document:{id:`upload:${row.id}:${index}`,kind:'knowledge' as const,text:chunk.text,metadata:{source:row.name,uploaded:true,conceptPath:row.concept_path??'',bundle:row.bundle_name??'',okf:row.okf_metadata,trust:okfTrust(row.okf_metadata??{})}},score:Math.max(lexical,semantic),matched,semantic};
  })).filter(result=>(result.matched>0&&result.score>=0.2)||result.semantic>=0.55).sort((a,b)=>b.score-a.score).slice(0,limit);
}

export async function processDocument(sessionHash:string,id:string,token:string,content:string,provider:EmbeddingProvider|undefined=documentProvider()){
  const source=await withSession(sessionHash,async c=>(await c.query('SELECT concept_path,okf_metadata FROM public.coach_documents WHERE id=$1',[id])).rows[0]);
  if(!source)return {saved:false,chunks:0,mode:'keyword'};
  const parsed=source.concept_path?parseOKF(source.concept_path,content):undefined;
  const indexText=parsed?`${parsed.metadata.title??source.concept_path}\n${parsed.metadata.description??''}\n${JSON.stringify(parsed.metadata)}\n\n${parsed.body}`:content;
  const texts=chunkDocument(indexText);
  const vectors=provider?await provider.embed(texts,{task:'retrieval-document'}):undefined;
  const chunks=texts.map((text,index)=>({text,...(vectors?{vector:vectors[index]}:{})}));
  const result=await withSession(sessionHash,c=>c.query(`UPDATE public.coach_documents SET chunks=$3,model=$4,dimensions=$5,status='ready',lease_until=NULL,processing_token=NULL,updated_at=now() WHERE id=$1 AND processing_token=$2 RETURNING id`,[id,token,JSON.stringify(chunks),provider?.model??null,vectors?.[0].length??null]));
  return {saved:Boolean(result.rowCount),chunks:chunks.length,mode:provider?'semantic':'keyword'};
}
