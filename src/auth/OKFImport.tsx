import {resolveAssetPath} from '../coach/assetPath';
import {useRef,useState} from 'react';
import {api} from './client';
export function OKFImport({disabled,onImported}:{disabled:boolean;onImported:()=>Promise<void>}){
 const [files,setFiles]=useState<File[]>([]);const [bundle,setBundle]=useState('merchant-knowledge');const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState('');
 const fileInput=useRef<HTMLInputElement>(null),folderInput=useRef<HTMLInputElement>(null);
 return <form className="knowledge-upload" onSubmit={async event=>{event.preventDefault();setBusy(true);setMessage('');setError('');try{
  const concepts=files.filter(file=>file.name.endsWith('.md')),images=files.filter(file=>/\.(png|jpe?g)$/i.test(file.name));
  if(concepts.length>52||images.length>100)throw new Error('Choose up to 50 concepts plus index and log files.');
  const data=[];for(const file of concepts){if(file.size>65536)throw new Error(`${file.name} exceeds 64 KB.`);const path=file.webkitRelativePath?file.webkitRelativePath.split('/').slice(1).join('/'):file.name;data.push({path,content:new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer())});}
  const result=await api('/api/documents/import',{bundle,files:data});
  let attached=0;const failedImages:string[]=[];
  for(const document of result.imported??[]){const raw=data.find(file=>file.path===document.path);if(!raw)continue;
   const referenced=new Set([...raw.content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map(match=>resolveAssetPath(document.path,match[1])));
   for(const image of images){const imagePath=image.webkitRelativePath?image.webkitRelativePath.split('/').slice(1).join('/'):image.name;if(!referenced.has(imagePath))continue;
    try{if(image.size>5242880)throw new Error('Image too large');const bytes=new Uint8Array(await image.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));await api(`/api/documents/${document.id}/attachments`,{path:imagePath,base64:btoa(binary)});attached++;}catch{failedImages.push(imagePath);}
   }
  }
  if(failedImages.length)setError(`Concepts were imported, but ${failedImages.length} images failed: ${failedImages.slice(0,5).join(', ')}. Add them from Preview & review.`);
  setMessage(`Imported ${result.ids.length} concepts and ${attached} images. ${result.skipped.length} existing or duplicate files skipped. ${result.reserved.length} index/log files excluded. Preview and save each draft’s embeddings before submitting it for review.`);setFiles([]);if(fileInput.current)fileInput.current.value='';if(folderInput.current)folderInput.current.value='';await onImported();
 }catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>
  <h2>Import an OKF bundle</h2><p>Open Knowledge Format v0.2 · Markdown concepts with YAML metadata. Folder imports preserve concept paths, links, and referenced PNG/JPEG screenshots (5 MB each; 100 images / 50 MB per workspace).</p>
  <label htmlFor="okf-bundle">Bundle name</label><input id="okf-bundle" value={bundle} maxLength={80} required disabled={busy||disabled} onChange={event=>setBundle(event.target.value)}/>
  <div className="knowledge-document-actions"><button type="button" disabled={busy||disabled} onClick={()=>fileInput.current?.click()}>Choose Markdown files</button><button type="button" disabled={busy||disabled} onClick={()=>folderInput.current?.click()}>Choose folder</button></div>
  <input ref={fileInput} hidden type="file" multiple accept=".md" aria-label="OKF Markdown files" onChange={event=>{setFiles(Array.from(event.target.files??[]));setError('');}}/>
  <input ref={folderInput} hidden type="file" {...({webkitdirectory:'',directory:''} as any)} aria-label="OKF bundle folder" onChange={event=>{setFiles(Array.from(event.currentTarget.files as FileList).filter(file=>/\.(md|png|jpe?g)$/i.test(file.name)));setError('');}}/>
  {files.length>0&&<p>{files.length} files selected</p>}
  <p>Only stable, current concepts are used in answers. Import preserves declared provenance and verification; it does not run referenced code or fetch external links.</p>
  {error&&<p role="alert" className="knowledge-error">{error}</p>}{message&&<p role="status">{message}</p>}
  <button disabled={busy||disabled||!files.length} type="submit">{busy?'Importing…':'Import bundle'}</button>
 </form>;
}
