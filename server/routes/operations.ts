import {Router} from 'express';
import {asyncRoute,requireRole} from '../auth/middleware';
import {withSession} from '../db';
import {pipelineReady,productionConfiguration} from '../production';
export const operationRoutes=Router();operationRoutes.use(requireRole('admin'));
operationRoutes.get('/',asyncRoute(async(req,res)=>{
 const migrated=await pipelineReady();
 const jobs=migrated?await withSession(req.sessionHash!,async c=>(await c.query('SELECT status,count(*)::integer AS count,min(created_at) AS oldest FROM public.coach_documents GROUP BY status')).rows):[];
 const audit=migrated?await withSession(req.sessionHash!,async c=>(await c.query('SELECT id,actor_id,action,document_id,revision,created_at FROM public.coach_audit ORDER BY id DESC LIMIT 100')).rows):[];
 res.json({configuration:productionConfiguration(),pipelineReady:migrated,jobs,audit});
}));
