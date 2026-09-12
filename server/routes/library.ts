import {pipelineReady} from '../production';
import {withSession} from '../db';
import {Router} from 'express';
import {asyncRoute} from '../auth/middleware';
import {builtInLibrary,bundleRoot,libraryDocuments,libraryDetail} from '../coach/library';
export const libraryRoutes=Router();
libraryRoutes.get('/',asyncRoute(async(req,res)=>{
 const q=typeof req.query.q==='string'?req.query.q.trim().toLowerCase():'';
 if(q.length>200){res.status(400).json({error:'Search must be under 200 characters.'});return;}
 const documents=await libraryDocuments(req.sessionHash!);
 const categories=[...new Set(documents.map(document=>document.category))];
 const filtered=documents.filter(document=>(!req.query.category||document.category===req.query.category)&&(!q||`${document.title} ${document.path} ${document.body} ${JSON.stringify(document.metadata.tags??[])}`.toLowerCase().includes(q)));
 res.json({categories,total:documents.length,items:filtered.map(({id,title,type,category,bundle,path})=>({id,title,type,category,bundle,path}))});
}));
libraryRoutes.get('/document',asyncRoute(async(req,res)=>{
 const documents=await libraryDocuments(req.sessionHash!);const document=documents.find(entry=>entry.id===req.query.id);
 if(!document){res.status(404).json({error:'This concept is unavailable.'});return;}
 const detail=libraryDetail(document,documents);
 const images=document.origin==='upload'&&await pipelineReady()?await withSession(req.sessionHash!,async c=>(await c.query('SELECT id,path FROM public.coach_attachments WHERE document_id=$1',[document.id.slice(7)])).rows):[];
 res.json({...detail,images:images.map(image=>({path:image.path,url:'/api/library/attachments/'+image.id}))});
}));
libraryRoutes.get('/assets/:filename',asyncRoute(async(req,res)=>{
 const {assets}=await builtInLibrary();const name=req.params.filename;
 if(!/^[a-zA-Z0-9._-]+\.(png|jpg)$/i.test(name)||!assets.has(name)){res.sendStatus(404);return;}
 res.setHeader('Cache-Control','private, no-store');res.sendFile(bundleRoot+'assets/screenshots/'+name);
}));

libraryRoutes.get('/attachments/:id',asyncRoute(async(req,res)=>{
 if(!/^[0-9a-f-]{36}$/i.test(req.params.id)){res.sendStatus(404);return;}
 const row=await withSession(req.sessionHash!,async c=>(await c.query('SELECT mime,data FROM public.coach_attachments WHERE id=$1',[req.params.id])).rows[0]);
 if(!row){res.sendStatus(404);return;}res.setHeader('Cache-Control','private, no-store');res.type(row.mime).send(row.data);
}));
