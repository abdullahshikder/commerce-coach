import '../server/secrets';
import {productionConfiguration} from '../server/production';
import {documentProvider} from '../server/coach/documents';
import {generateOpenRouterResponse} from '../server/coach/openrouterService';
import {generateLLMResponse} from '../server/coach/geminiService';
import {closeDb} from '../server/db';
const live=process.argv.includes('--live');
try{
 console.log(JSON.stringify(productionConfiguration(),null,2));
 if(live){
  const provider=documentProvider();if(!provider)throw new Error('Configure embeddings before running the live release check.');
  const vectors=await provider.embed(['Commerce Coach deployment readiness.'],{task:'retrieval-document'});
  if(!vectors[0]?.length||vectors[0].some(n=>!Number.isFinite(n)))throw new Error('Embedding verification failed.');
  const state={mode:'normal',quizScore:{correct:0,total:0}} as any;
  const generate=process.env.OPENROUTER_API_KEY?generateOpenRouterResponse:generateLLMResponse;
  const result=await generate([{role:'user',content:'Reply with a short readiness acknowledgement.'}] as any,state,'Deployment test; no merchant data.');
  if(!result?.content?.trim()||/No response from model|unable to complete/i.test(result.content))throw new Error('Generation verification failed.');
  console.log('Live embedding and generation calls completed. Google SSO still requires a browser sign-in with an invited account.');
 }else console.log('Configuration only. Use --live to send a small paid provider test; no credentials are printed.');
}finally{await closeDb();}
