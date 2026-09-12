import { takeBudget } from '../security';
import { Router } from 'express';
import { withSession } from '../db';
import { asyncRoute } from '../auth/middleware';

export const conversationRoutes=Router();
conversationRoutes.use((req,res,next)=>{void takeBudget(`history:${req.method}:${req.actor!.id}`,req.method==='GET'?120:60,60).then(allowed=>{
  if(!allowed){res.status(429).json({error:'Too many history requests. Try again shortly.'});return;}next();
}).catch(next);});
const object=(value:any)=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const strings=(value:any,keys:string[])=>object(value)&&keys.every(key=>value[key]===undefined||typeof value[key]==='string');
function validMetadata(value:any){
  if(value===undefined)return true;
  return strings(value,['domain','feature','confidence','source','status','provider'])
    && (value.screenshots===undefined || (Array.isArray(value.screenshots)&&value.screenshots.every((s:any)=>object(s)&&typeof s.src==='string'&&typeof s.caption==='string')))
    && ['retrievalDocumentIds'].every(key=>value[key]===undefined||(Array.isArray(value[key])&&value[key].every((v:any)=>typeof v==='string')))
    && (value.intent===undefined||strings(value.intent,['id','kind','label','confidence','language']));
}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
conversationRoutes.get('/',asyncRoute(async(req,res)=>{
  const offset=Number(req.query.offset || 0);
  if(!Number.isSafeInteger(offset)||offset<0||offset>2000){res.status(400).json({error:'Invalid history offset.'});return;}
  const rows=await withSession(req.sessionHash!,async client=>(await client.query('SELECT id,title,updated_at,revision FROM public.coach_conversations ORDER BY updated_at DESC,id LIMIT 51 OFFSET $1',[offset])).rows);
  res.json({items:rows.slice(0,50),hasMore:rows.length>50});
}));
conversationRoutes.get('/:id',asyncRoute(async(req,res)=>{
  if(!uuid.test(req.params.id)){res.status(400).json({error:'Invalid conversation ID.'});return;}
  const row=await withSession(req.sessionHash!,async client=>(await client.query('SELECT id,title,messages,state,revision,updated_at FROM public.coach_conversations WHERE id=$1',[req.params.id])).rows[0]);
  res.status(row?200:404).json(row?{conversation:row}:{error:'Conversation not found.'});
}));
conversationRoutes.put('/:id',asyncRoute(async(req,res)=>{
  const {messages,state,revision}=req.body || {};
  if(!uuid.test(req.params.id)||!Number.isSafeInteger(revision)||revision<0||revision>=2147483647
    ||!Array.isArray(messages)||!messages.length||messages.length>200
    ||messages.some(m=>!m||typeof m.id!=='string'||!m.id||m.id.length>100||!['user','assistant'].includes(m.role)||typeof m.content!=='string'||m.content.length>50000||typeof m.timestamp!=='string'||!Number.isFinite(Date.parse(m.timestamp))||!validMetadata(m.metadata))
    ||new Set(messages.map(m=>m.id)).size!==messages.length
    ||!state||!['normal','training','quiz','troubleshoot','merchant-sim'].includes(state.mode)
    ||!state.quizScore||!Number.isSafeInteger(state.quizScore.correct)||!Number.isSafeInteger(state.quizScore.total)||state.quizScore.correct<0||state.quizScore.total<state.quizScore.correct
    ||!Array.isArray(state.quizHistory)||state.quizHistory.some((entry:any)=>!entry||typeof entry.domain!=='string'||typeof entry.correct!=='boolean')
    ||(state.lastDomain!==undefined&&typeof state.lastDomain!=='string')
    ||(state.currentTrainingLevel!==undefined&&(!Number.isSafeInteger(state.currentTrainingLevel)||state.currentTrainingLevel<0))
    ||(state.currentQuiz!==undefined&&(!Array.isArray(state.currentQuiz)||state.currentQuiz.some((q:any)=>!object(q)||!['id','type','domain','difficulty','question','correctAnswer','explanation','source'].every(key=>typeof q[key]==='string')||(q.options!==undefined&&(!Array.isArray(q.options)||q.options.some((v:any)=>typeof v!=='string'))))))){
    res.status(400).json({error:'Invalid conversation. Keep each conversation under 200 messages.'});return;
  }
  const title=(messages.find(m=>m.role==='user')?.content.trim() || 'New conversation').slice(0,120);
  const result=await withSession(req.sessionHash!,async client=>{
    // Lock existing snapshots so retries are idempotent and concurrent tabs cannot overwrite newer turns.
    const existing=(await client.query('SELECT revision,messages,state FROM public.coach_conversations WHERE id=$1 FOR UPDATE',[req.params.id])).rows[0];
    if(existing){
      const same=(await client.query('SELECT $1::jsonb=$2::jsonb AND $3::jsonb=$4::jsonb AS same',[JSON.stringify(existing.messages),JSON.stringify(messages),JSON.stringify(existing.state),JSON.stringify(state)])).rows[0].same;
      if(same)return {revision:existing.revision};
      if(existing.revision!==revision)return null;
      return (await client.query('UPDATE public.coach_conversations SET title=$2,messages=$3,state=$4,revision=revision+1,updated_at=now() WHERE id=$1 RETURNING revision',[req.params.id,title,JSON.stringify(messages),JSON.stringify(state)])).rows[0];
    }
    if(revision!==0)return null;
    return (await client.query('INSERT INTO public.coach_conversations(id,organization_id,user_id,title,messages,state) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO NOTHING RETURNING revision',[req.params.id,req.actor!.organization_id,req.actor!.id,title,JSON.stringify(messages),JSON.stringify(state)])).rows[0] || null;
  });
  res.status(result?200:409).json(result || {error:'This conversation changed in another tab. Reload to open the saved version; your current text has not been overwritten.'});
}));
