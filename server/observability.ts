import type {RequestHandler} from 'express';
import {randomUUID} from 'node:crypto';
// Never log URLs, query strings, headers, bodies, cookies or provider errors.
export const requestLog:RequestHandler=(req,res,next)=>{
 const id=randomUUID(),start=Date.now();res.setHeader('X-Request-ID',id);
 res.on('finish',()=>{if(req.path.startsWith('/api/'))console.log(JSON.stringify({event:'request',requestId:id,method:req.method,status:res.statusCode,durationMs:Date.now()-start,area:req.path.startsWith('/api/auth/')?'auth':req.path.startsWith('/api/documents')?'knowledge':req.path.startsWith('/api/coach')?'coach':'api'}));});next();
};
export function providerUsage(provider:string,usage:{phase?:unknown;inputTokens?:unknown;outputTokens?:unknown;costUsd?:unknown}){
 const number=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)&&value>=0?value:undefined;
 const phase=typeof usage.phase==='string'&&usage.phase.length<=40?usage.phase:undefined;
 console.log(JSON.stringify({event:'provider_usage',provider,phase,inputTokens:number(usage.inputTokens),outputTokens:number(usage.outputTokens),costUsd:number(usage.costUsd)}));
}
