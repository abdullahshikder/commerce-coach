import {authPool} from './db';
export async function pipelineReady(){return Boolean((await authPool.query("SELECT to_regprocedure('public.coach_claim_document(uuid)') IS NOT NULL AS ready")).rows[0].ready);}
export function productionConfiguration(env:NodeJS.ProcessEnv=process.env){
 const origins=(env.APP_ORIGINS??'').split(',').filter(Boolean);
 const google=[env.GOOGLE_CLIENT_ID,env.GOOGLE_CLIENT_SECRET,env.GOOGLE_REDIRECT_URI];
 return {httpsOrigins:origins.length>0&&origins.every(origin=>{try{return new URL(origin).protocol==='https:';}catch{return false;}}),googleConfigured:google.every(Boolean),googlePartial:google.some(Boolean)&&!google.every(Boolean),generationConfigured:Boolean(env.OPENROUTER_API_KEY||env.GEMINI_API_KEY),embeddingsConfigured:Boolean(env.OPENROUTER_API_KEY),workerEnabled:env.DOCUMENT_WORKER!=='false'};
}
export function assertProductionConfiguration(){
 if(process.env.NODE_ENV!=='production')return;
 const config=productionConfiguration();
 if(!config.httpsOrigins)throw new Error('Production APP_ORIGINS must explicitly list HTTPS origins.');
 if(config.googlePartial)throw new Error('Complete all three Google SSO settings or leave all unset.');
 if(config.googleConfigured&&!process.env.GOOGLE_REDIRECT_URI?.startsWith('https://'))throw new Error('Production Google redirect must use HTTPS.');
}
