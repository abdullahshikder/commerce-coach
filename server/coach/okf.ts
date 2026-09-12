import {parseDocument} from 'yaml';
import {posix} from 'node:path';
export type OKFMetadata=Record<string,unknown>;
export function safeConceptPath(path:unknown):string {
 if(typeof path!=='string'||!path||path.length>500||path.startsWith('/')||path.includes('\\')||/[\x00-\x1f]/.test(path)||path.split('/').some(part=>!part||part==='.'||part==='..'))throw new Error('Bundle paths must stay inside the selected folder.');
 return path;
}
export function parseOKF(path:string,content:string){
 safeConceptPath(path);
 const text=content.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
 if(Buffer.byteLength(text)>65536||text.includes('\0'))throw new Error(`${path}: use UTF-8 Markdown up to 64 KB.`);
 const reserved=['index.md','log.md'].includes(posix.basename(path));
 const match=/^---\n([\s\S]*?)\n---(?:\n|$)/.exec(text);
 if(reserved)return {reserved:true,path,body:text,metadata:{} as OKFMetadata};
 if(!match)throw new Error(`${path}: OKF concepts require YAML frontmatter with a type.`);
 const document=parseDocument(match[1],{schema:'core',uniqueKeys:true});
 if(document.errors.length)throw new Error(`${path}: invalid YAML frontmatter.`);
 // Disable alias expansion: uploaded metadata must remain bounded and JSON-safe.
 let metadata:OKFMetadata;
 try{metadata=document.toJS({maxAliasCount:0});}catch{throw new Error(`${path}: YAML aliases are not supported.`);}
 if(!metadata||Array.isArray(metadata)||typeof metadata!=='object'||typeof metadata.type!=='string'||!metadata.type.trim())throw new Error(`${path}: type must be a non-empty string.`);
 const serialized=JSON.stringify(metadata);if(serialized.length>24000)throw new Error(`${path}: metadata is too large.`);
 for(const field of ['title','description','resource','status','stale_after'])if(metadata[field]!==undefined&&typeof metadata[field]!=='string')throw new Error(`${path}: ${field} must be text.`);
 if(metadata.status!==undefined&&!['draft','stable','deprecated'].includes(String(metadata.status)))throw new Error(`${path}: invalid lifecycle status.`);
 if(metadata.stale_after!==undefined&&!Number.isFinite(Date.parse(String(metadata.stale_after))))throw new Error(`${path}: stale_after must be an ISO timestamp.`);
 if(metadata.tags!==undefined&&(!Array.isArray(metadata.tags)||metadata.tags.some(tag=>typeof tag!=='string')))throw new Error(`${path}: tags must be a list of strings.`);
 if(metadata.sources!==undefined&&(!Array.isArray(metadata.sources)||metadata.sources.some(source=>!source||typeof source!=='object'||typeof source.resource!=='string')))throw new Error(`${path}: each source needs a resource.`);
 if(metadata.verified!==undefined){const entries=Array.isArray(metadata.verified)?metadata.verified:[metadata.verified];if(entries.some(entry=>!entry||typeof entry!=='object'||typeof entry.by!=='string'||typeof entry.at!=='string'))throw new Error(`${path}: verification entries need by and at.`);}
 return {reserved:false,path,body:text.slice(match[0].length).trim(),metadata};
}
export function okfRetrievable(metadata:OKFMetadata,now=Date.now()){
 return !['draft','deprecated'].includes(String(metadata.status))&&!(typeof metadata.stale_after==='string'&&Date.parse(metadata.stale_after)<=now);
}
export function okfTrust(metadata:OKFMetadata){
 const verified=Array.isArray(metadata.verified)?metadata.verified:metadata.verified?[metadata.verified]:[];
 return verified.some((entry:any)=>typeof entry?.by==='string'&&entry.by.startsWith('human:'))?'human-reviewed':verified.length?'machine-confirmed':'unverified';
}
