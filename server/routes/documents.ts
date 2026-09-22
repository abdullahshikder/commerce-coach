import {pipelineReady} from '../production';
import express, { Router } from 'express';
import { parseOKF } from '../coach/okf';
import { validateImage } from '../coach/attachments';
import { importOKF } from '../coach/importOKF';
import { randomUUID } from 'node:crypto';
import { withSession } from '../db';
import { asyncRoute, requireRole } from '../auth/middleware';
import { digest } from '../auth/password';
import { takeBudget } from '../security';
import { chunkDocument, documentProvider } from '../coach/documents';
import { prepareDocument } from '../coach/worker';
export const documentRoutes=Router();
documentRoutes.use(requireRole('admin','reviewer'));
documentRoutes.use((_req,res,next)=>{void pipelineReady().then(ready=>{if(!ready){res.status(503).json({error:'Knowledge upgrades are prepared. Apply the latest database migration to enable embedding previews.'});return;}next();}).catch(next);});
documentRoutes.use((req,res,next)=>{if(req.method!=='GET'&&!req.path.endsWith('/action')&&req.actor!.role!=='admin'){res.status(403).json({error:'Administrator access required.'});return;}next();});
documentRoutes.get('/',asyncRoute(async(req,res)=>{
 const items=await withSession(req.sessionHash!,async c=>(await c.query('SELECT id,name,status,model,error,publication,revision,attempts,okf_metadata,concept_path,bundle_name,jsonb_array_length(chunks) AS chunk_count,created_at,lease_until FROM public.coach_documents ORDER BY created_at DESC')).rows);
 res.json({items,embeddingConfigured:Boolean(documentProvider()),maxBytes:65536,maxDocuments:50});
}));
documentRoutes.post('/import',express.json({limit:'4mb'}),asyncRoute(async(req,res)=>{
 if(!await takeBudget(`okf-import:${req.actor!.organization_id}`,5,60)){res.status(429).json({error:'Too many imports. Try again in a minute.'});return;}
 try{res.status(201).json(await importOKF(req.sessionHash!,req.body?.bundle,req.body?.files));}
 catch(error){if((error as any).code)throw error;res.status(400).json({error:(error as Error).message});}
}));
documentRoutes.get('/:id/source',asyncRoute(async(req,res)=>{
 const row=await withSession(req.sessionHash!,async c=>(await c.query('SELECT content,okf_metadata,concept_path,bundle_name,revision FROM public.coach_documents WHERE id=$1',[req.params.id])).rows[0]);
 res.status(row?200:404).json(row??{error:'Document not found.'});
}));
documentRoutes.post('/', asyncRoute(async(req,res)=>{
 if(!await takeBudget(`document-upload:${req.actor!.organization_id}`,10,60)){res.status(429).json({error:'Too many uploads. Try again in a minute.'});return;}
 const {name,content}=req.body??{};
 if(typeof name!=='string'||name.length>150||!name.trim()||! /\.(txt|md|csv|json)$/i.test(name)||typeof content!=='string'){res.status(400).json({error:'Choose a text, Markdown, CSV, or JSON file.'});return;}
 try{chunkDocument(content);}catch(e){res.status(400).json({error:(e as Error).message});return;}
 const row=await withSession(req.sessionHash!,async c=>(await c.query(`INSERT INTO public.coach_documents(id,organization_id,created_by,name,content,content_hash) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(organization_id,content_hash) DO NOTHING RETURNING id`,[randomUUID(),req.actor!.organization_id,req.actor!.id,name.trim(),content,digest(content.trim())])).rows[0]);
 if(!row){res.status(409).json({error:'This document is already uploaded.'});return;}res.status(201).json(row);
}));
documentRoutes.param('id',(req,res,next)=>{if(!/^[0-9a-f-]{36}$/i.test(req.params.id)){res.status(400).json({error:'Invalid document ID.'});return;}next();});
documentRoutes.post('/:id/process',asyncRoute(async(req,res)=>{
 res.status(409).json({error:'Generate and review an embedding preview before saving.'});
}));
documentRoutes.post('/:id/embedding-preview',asyncRoute(async(req,res)=>{
 if(!await takeBudget(`embedding-preview:${req.actor!.organization_id}`,10,600)){res.status(429).json({error:'Too many embedding previews. Try again later.'});return;}
 const revision=req.body?.revision;
 if(!Number.isSafeInteger(revision)||revision<1){res.status(400).json({error:'A valid document revision is required.'});return;}
 const document=await withSession(req.sessionHash!,async c=>(await c.query('SELECT content,concept_path,revision,publication FROM public.coach_documents WHERE id=$1',[req.params.id])).rows[0]);
 if(!document){res.status(404).json({error:'Document not found.'});return;}
 if(document.revision!==revision||document.publication!=='draft'){res.status(409).json({error:'Refresh the draft before generating a preview.'});return;}
 const result=await prepareDocument(document.content,document.concept_path);
 const previewId=randomUUID();
 const saved=await withSession(req.sessionHash!,async c=>(await c.query(
  'SELECT public.coach_save_embedding_preview($1,$2,$3,$4,$5,$6) AS expires_at',
  [previewId,req.params.id,revision,JSON.stringify(result.chunks),result.model,result.dimensions],
 )).rows[0]);
 // Full vectors remain in private staging; the browser only receives enough coordinates to inspect their shape.
 res.status(201).json({
  id:previewId,expiresAt:saved.expires_at,model:result.model,dimensions:result.dimensions,
  mode:result.model?'semantic':'keyword',
  chunks:result.chunks.map((chunk,index)=>({index:index+1,text:chunk.text,characters:chunk.text.length,
   ...(chunk.vector?{vectorSample:chunk.vector.slice(0,8).map(value=>Number(value.toFixed(6))),magnitude:Number(Math.sqrt(chunk.vector.reduce((sum,value)=>sum+value*value,0)).toFixed(6))}:{}),
  })),
 });
}));
documentRoutes.post('/:id/embedding-preview/:previewId/apply',asyncRoute(async(req,res)=>{
 const revision=req.body?.revision;
 if(!/^[0-9a-f-]{36}$/i.test(req.params.previewId)||!Number.isSafeInteger(revision)||revision<1){res.status(400).json({error:'A valid embedding preview and revision are required.'});return;}
 const applied=await withSession(req.sessionHash!,async c=>(await c.query(
  'SELECT public.coach_apply_embedding_preview($1,$2,$3) AS applied',[req.params.previewId,req.params.id,revision],
 )).rows[0]?.applied as boolean);
 if(!applied){res.status(409).json({error:'This preview expired or the draft changed. Generate a new preview.'});return;}
 res.json({ok:true,status:'ready'});
}));
documentRoutes.post('/:id/action',asyncRoute(async(req,res)=>{
 const {action,revision,content,restoreRevision}=req.body??{};
 if(!['edit','restore','submit','publish','unpublish'].includes(action)||!Number.isSafeInteger(revision)||revision<1){res.status(400).json({error:'Invalid action or revision.'});return;}
 if(req.actor!.role!=='admin'&&!['publish','unpublish'].includes(action)){res.status(403).json({error:'Administrator access required.'});return;}
 const current=await withSession(req.sessionHash!,async c=>(await c.query('SELECT concept_path FROM public.coach_documents WHERE id=$1',[req.params.id])).rows[0]);
 if(!current){res.status(404).json({error:'Document not found.'});return;}
 let metadata={};
 if(action==='edit'){try{if(typeof content!=='string')throw new Error('Source text is required.');chunkDocument(content);if(current.concept_path)metadata=parseOKF(current.concept_path,content).metadata;}catch(e){res.status(400).json({error:(e as Error).message});return;}}
 if(action==='restore'&&(!Number.isSafeInteger(restoreRevision)||restoreRevision<1)){res.status(400).json({error:'Choose a source revision.'});return;}
 const result=await withSession(req.sessionHash!,c=>c.query('SELECT public.coach_document_action($1,$2,$3,$4,$5,$6) AS revision',[req.params.id,revision,action,content??null,JSON.stringify(metadata),restoreRevision??null]));res.json(result.rows[0]);
}));
documentRoutes.get('/:id/versions',asyncRoute(async(req,res)=>{
 const items=await withSession(req.sessionHash!,async c=>(await c.query('SELECT revision,created_at,actor_id FROM public.coach_document_versions WHERE document_id=$1 ORDER BY revision DESC',[req.params.id])).rows);res.json({items});
}));
documentRoutes.post('/:id/attachments',express.json({limit:'7mb'}),asyncRoute(async(req,res)=>{
 if(!await takeBudget(`attachments:${req.actor!.organization_id}`,30,60)){res.status(429).json({error:'Too many image uploads.'});return;}
 let image;try{image=validateImage(req.body?.base64,req.body?.path);}catch(e){res.status(400).json({error:(e as Error).message});return;}
 const result=await withSession(req.sessionHash!,c=>c.query('INSERT INTO public.coach_attachments(id,document_id,organization_id,path,mime,data) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(document_id,path) DO NOTHING RETURNING id',[randomUUID(),req.params.id,req.actor!.organization_id,image.path,image.mime,image.data]));
 res.status(result.rowCount?201:409).json(result.rowCount?result.rows[0]:{error:'That image path already exists. Use a new filename to preserve published references.'});
}));
documentRoutes.delete('/:id',asyncRoute(async(req,res)=>{
 const result=await withSession(req.sessionHash!,c=>c.query('DELETE FROM public.coach_documents WHERE id=$1 RETURNING id',[req.params.id]));
 res.status(result.rowCount?200:404).json(result.rowCount?{ok:true}:{error:'Document not found.'});
}));
