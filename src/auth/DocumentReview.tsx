import {useEffect,useState} from 'react';
import {api} from './client';
import {OKFArticle} from '../coach/OKFArticle';
export type KnowledgeDocument={id:string;name:string;status:string;publication:string;revision:number;attempts:number;model:string|null;error:string;chunk_count:number;concept_path?:string;bundle_name?:string;okf_metadata?:Record<string,any>};
type EmbeddingPreview={id:string;expiresAt:string;model:string|null;dimensions:number|null;mode:'semantic'|'keyword';chunks:{index:number;text:string;characters:number;vectorSample?:number[];magnitude?:number}[]};
export function DocumentReview({doc,admin,onClose,onChange}:{doc:KnowledgeDocument;admin:boolean;onClose:()=>void;onChange:()=>Promise<void>}){
 const [source,setSource]=useState(''),[original,setOriginal]=useState(''),[versions,setVersions]=useState<{revision:number;created_at:string}[]>([]),[preview,setPreview]=useState<any>(null);
 const [embeddingPreview,setEmbeddingPreview]=useState<EmbeddingPreview>(),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[imagePath,setImagePath]=useState('assets/screenshot.png');
 const load=async()=>{setError('');setEmbeddingPreview(undefined);try{const [raw,history]=await Promise.all([api(`/api/documents/${doc.id}/source`),api(`/api/documents/${doc.id}/versions`)]);setSource(raw.content);setOriginal(raw.content);setVersions(history.items);
 if(doc.concept_path)setPreview(await api(`/api/library/document?id=upload:${doc.id}`));
 }catch(e){setError((e as Error).message);}finally{setLoading(false);}};
 useEffect(()=>{void load();},[doc.id,doc.revision]);
 const action=async(action:string,extra={})=>{setBusy(true);setError('');try{await api(`/api/documents/${doc.id}/action`,{action,revision:doc.revision,...extra});await onChange();onClose();}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
 const generateEmbeddingPreview=async()=>{setBusy(true);setError('');setNotice('');try{setEmbeddingPreview(await api(`/api/documents/${doc.id}/embedding-preview`,{revision:doc.revision}));}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
 const saveEmbeddingPreview=async()=>{if(!embeddingPreview)return;setBusy(true);setError('');try{await api(`/api/documents/${doc.id}/embedding-preview/${embeddingPreview.id}/apply`,{revision:doc.revision});setEmbeddingPreview(undefined);setNotice('Embeddings saved. This draft is now ready to submit for review.');await onChange();}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
 return <section className="knowledge-review" aria-label={`Review ${doc.name}`}>
 <div className="knowledge-list-heading"><h2>{doc.name}</h2><button onClick={onClose}>Close preview</button></div>
 <p>Revision {doc.revision} · {doc.publication} · {doc.status}</p>
 {error&&<p role="alert" className="knowledge-error">{error}</p>}{notice&&<p role="status" className="knowledge-notice">{notice}</p>}
 {loading?<p role="status">Loading source…</p>:<>
 {preview?<OKFArticle body={preview.body} origin="upload" links={[]} images={preview.images} path={doc.concept_path} onOpen={()=>{}}/>:<pre className="knowledge-source-preview">{original}</pre>}
 {admin&&doc.publication==='draft'&&<section className="embedding-preview"><div><h3>Embedding preview</h3><p>Inspect the exact sections before they become searchable. Semantic previewing sends this draft to the configured provider.</p></div><button disabled={busy||source!==original||doc.status==='processing'} onClick={()=>void generateEmbeddingPreview()}>{busy?'Preparing…':embeddingPreview?'Regenerate preview':'Generate preview'}</button>
 {embeddingPreview&&<><div className="embedding-preview-summary"><span>{embeddingPreview.mode==='semantic'?'Semantic embedding':'Keyword sections'}</span><strong>{embeddingPreview.chunks.length} chunks</strong><span>{embeddingPreview.model??'No embedding model'}{embeddingPreview.dimensions?` · ${embeddingPreview.dimensions} dimensions`:''}</span><small>Expires {new Date(embeddingPreview.expiresAt).toLocaleTimeString()}</small></div>
 <div className="embedding-preview-chunks">{embeddingPreview.chunks.map(chunk=><details key={chunk.index}><summary>Chunk {chunk.index} · {chunk.characters} characters</summary><pre>{chunk.text}</pre>{chunk.vectorSample&&<p><strong>Vector sample:</strong> <code>[{chunk.vectorSample.join(', ')}]</code>{chunk.magnitude!==undefined&&<> · magnitude {chunk.magnitude}</>}</p>}</details>)}</div>
 <div className="knowledge-document-actions"><button className="embedding-save" disabled={busy} onClick={()=>void saveEmbeddingPreview()}>Save embeddings</button><p>Only this reviewed preview will be saved. Regenerating replaces the pending preview.</p></div></>}
 </section>}
 <details><summary>{admin?'Edit source':'View source'}</summary><label htmlFor="knowledge-source">Document source</label><textarea id="knowledge-source" value={source} readOnly={!admin} onChange={e=>setSource(e.target.value)}/>
 {admin&&<button disabled={busy||source===original} onClick={()=>void action('edit',{content:source})}>Save as new draft</button>}<p>Saving or restoring creates an unprocessed draft and removes the previous embeddings from answers.</p></details>
 <div className="knowledge-document-actions">
 {admin&&doc.publication==='draft'&&<button disabled={busy||doc.status!=='ready'||source!==original} onClick={()=>void action('submit')}>Submit for review</button>}
 {doc.publication==='review'&&<button disabled={busy||doc.status!=='ready'||source!==original} onClick={()=>void action('publish')}>Publish reviewed revision</button>}
 {doc.publication!=='draft'&&<button disabled={busy} onClick={()=>void action('unpublish')}>{doc.publication==='review'?'Return to draft':'Unpublish'}</button>}
 </div>
 {admin&&doc.concept_path&&doc.publication==='draft'&&<div className="knowledge-attachment"><h3>Add a screenshot</h3><p>PNG or JPEG, up to 5 MB. Match its path in Markdown, for example <code>![Screenshot](/assets/screenshot.png)</code>. Existing image paths are immutable.</p>
 <label htmlFor="attachment-path">Image path in bundle</label><input id="attachment-path" value={imagePath} onChange={e=>setImagePath(e.target.value)}/>
 <label htmlFor="attachment-file">Screenshot file</label><input id="attachment-file" disabled={busy} type="file" accept="image/png,image/jpeg" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;setBusy(true);setError('');try{if(file.size>5242880)throw new Error('Choose an image up to 5 MB.');const bytes=new Uint8Array(await file.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));await api(`/api/documents/${doc.id}/attachments`,{path:imagePath,base64:btoa(binary)});await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);e.target.value='';}}}/></div>}
 <details><summary>Revision history ({versions.length})</summary>{versions.map(v=><p key={v.revision}>Revision {v.revision} · {new Date(v.created_at).toLocaleString()} {admin&&v.revision!==doc.revision&&<button disabled={busy} onClick={()=>void action('restore',{restoreRevision:v.revision})}>Restore as draft</button>}</p>)}</details>
 </>}
 </section>;
}
