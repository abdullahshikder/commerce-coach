import {useEffect,useState} from 'react';
import {api} from './client';
export function OperationsPanel(){
 const [data,setData]=useState<any>(null),[error,setError]=useState('');
 const load=async()=>{try{setData(await api('/api/operations'));setError('');}catch(e){setError((e as Error).message);}};
 useEffect(()=>{void load();const timer=setInterval(()=>void load(),15000);return()=>clearInterval(timer);},[]);
 return <div className="knowledge-page"><div className="knowledge-content"><div className="knowledge-list-heading"><h1>Operations</h1><button onClick={()=>void load()}>Refresh</button></div>
 <p>Workspace processing and configuration. Configured providers still require a live verification before launch.</p>{error&&<p role="alert">{error}</p>}
 {!data&&!error?<p role="status">Loading operations…</p>:data&&<><section className="knowledge-review"><h2>Readiness</h2><dl>{Object.entries({...data.configuration,pipelineReady:data.pipelineReady}).map(([key,value])=><div key={key}><dt>{({httpsOrigins:'HTTPS origins',googleConfigured:'Google SSO configured',googlePartial:'Incomplete Google configuration',generationConfigured:'AI generation configured',embeddingsConfigured:'Embeddings configured',workerEnabled:'Background worker enabled',pipelineReady:'Database pipeline installed'} as any)[key]}</dt><dd>{value?'Yes':'No'}</dd></div>)}</dl></section>
 <section className="knowledge-review"><h2>Processing</h2>{data.jobs.length?data.jobs.map((job:any)=><p key={job.status}>{job.status}: {job.count}</p>):<p>No processing jobs.</p>}</section>
 <section className="knowledge-review"><h2>Recent knowledge activity</h2><p>Most recent 100 events in this workspace.</p>{data.audit.length?<div className="okf-table"><table><thead><tr><th>When</th><th>Action</th><th>Document</th><th>Revision</th></tr></thead><tbody>{data.audit.map((event:any)=><tr key={event.id}><td>{new Date(event.created_at).toLocaleString()}</td><td>{event.action}</td><td>{event.document_id}</td><td>{event.revision??'—'}</td></tr>)}</tbody></table></div>:<p>No knowledge changes recorded yet.</p>}</section></>}
 </div></div>;
}
