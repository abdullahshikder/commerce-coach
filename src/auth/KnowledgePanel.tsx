import {useEffect,useRef,useState} from 'react';
import {OKFImport} from './OKFImport';
import {api} from './client';
import {useAuth} from './AuthContext';
import {EmptyState} from '../components/EmptyState';
import {DocumentReview,type KnowledgeDocument} from './DocumentReview';
export function KnowledgePanel(){
 const {user}=useAuth();const admin=user.role==='admin';
 const [items,setItems]=useState<KnowledgeDocument[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[configured,setConfigured]=useState(false),[selected,setSelected]=useState('');
 const [file,setFile]=useState<File|null>(null),[filter,setFilter]=useState('all');const input=useRef<HTMLInputElement>(null);
 const load=async()=>{try{const data=await api('/api/documents');setItems(data.items);setConfigured(data.embeddingConfigured);setError('');}catch(e){setError((e as Error).message);}finally{setLoading(false);}};
 useEffect(()=>{void load();const timer=setInterval(()=>void load(),5000);return()=>clearInterval(timer);},[]);
 const queue=async(ids:string[])=>{setBusy(true);setError('');let queued=0;try{for(const id of ids){await api(`/api/documents/${id}/process`,{});queued++;}setNotice(`${queued} documents queued. Processing continues when you leave this page.`);}catch(e){setError(`${queued} queued. ${(e as Error).message}`);}finally{setBusy(false);await load();}};
 const visible=items.filter(doc=>filter==='all'||doc.publication===filter);const selectedDoc=items.find(doc=>doc.id===selected);
 return <div className="knowledge-page"><div className="knowledge-content">
 <div><h1>Knowledge</h1><p>{admin?'Add and maintain your team’s reference material.':'Review reference material before it reaches your team.'} Only published, current documents are used in answers.</p></div>
 {error&&<p role="alert" className="knowledge-error">{error}</p>}{notice&&<p role="status" className="knowledge-notice">{notice}</p>}
 {admin&&<><form className="knowledge-upload" onSubmit={async e=>{e.preventDefault();if(!file||busy)return;setBusy(true);setError('');try{if(file.size>65536)throw new Error('Choose a file up to 64 KB.');await api('/api/documents',{name:file.name,content:new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer())});setFile(null);if(input.current)input.current.value='';setNotice('Uploaded as a draft. Processing continues in the background; review it when ready.');await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>
 <h2>Add a document</h2><p>Text, Markdown, CSV, or JSON · 64 KB each · 50 documents per workspace</p>
 <label htmlFor="knowledge-file">Choose a file</label><input ref={input} id="knowledge-file" type="file" accept=".txt,.md,.csv,.json" disabled={busy} onChange={e=>setFile(e.target.files?.[0]??null)}/>
 <p>{configured?'Semantic processing is configured. Documents are sent to your configured embedding provider.':'Documents will use keyword search until semantic processing is configured.'}</p><button disabled={!file||busy}>Upload draft</button></form><OKFImport disabled={busy} onImported={load}/></>}
 <div className="knowledge-list-heading"><h2>Documents <span>{items.length}/50</span></h2><button disabled={loading||busy} onClick={()=>void load()}>Refresh</button></div>
 <div className="knowledge-document-actions"><label htmlFor="publication-filter">Show</label><select id="publication-filter" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All documents</option><option value="draft">Drafts</option><option value="review">Awaiting review</option><option value="published">Published</option></select>{admin&&<button disabled={busy||!items.some(d=>d.status==='failed')} onClick={()=>void queue(items.filter(d=>d.status==='failed').map(d=>d.id))}>Retry failed jobs</button>}</div>
 {loading?<p role="status">Loading documents…</p>:!visible.length&&!error?<EmptyState title={items.length?'No documents in this view':'Build your team’s knowledge'} description={items.length?'Choose another publication status.':'Upload a document, let it process, then review and publish it.'}/>:null}
 <div className="knowledge-documents">{visible.map(doc=><article key={doc.id}><div><h3>{doc.name}</h3><p>{doc.publication} · Revision {doc.revision} · {doc.status==='ready'?`${doc.chunk_count} sections · ${doc.model?'Semantic':'Keyword'}`:doc.status==='processing'?`Processing · attempt ${doc.attempts}/3`:doc.status==='failed'?doc.error:'Queued for background processing'}</p>{doc.concept_path&&<p>{doc.bundle_name} / {doc.concept_path}</p>}</div>
 <div className="knowledge-document-actions"><button onClick={()=>setSelected(doc.id)}>Preview & review</button>{admin&&<><button disabled={busy||['processing','queued'].includes(doc.status)} onClick={()=>void queue([doc.id])}>{doc.status==='failed'?'Retry':'Reprocess'}</button><button disabled={busy} onClick={async()=>{if(!window.confirm(`Remove “${doc.name}”, its revisions and images? Saved answers remain.`))return;setBusy(true);try{await api(`/api/documents/${doc.id}`,undefined,'DELETE');await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>Remove</button></>}</div></article>)}</div>
 {selectedDoc&&<DocumentReview doc={selectedDoc} admin={admin} onClose={()=>setSelected('')} onChange={load}/>}
 </div></div>;
}
