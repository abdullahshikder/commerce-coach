import {resolveAssetPath} from './assetPath';
import {type ReactNode} from 'react';
type Link={href:string;id?:string;title?:string};
export function safeWebLink(href:string){try{const url=new URL(href);return ['https:','http:'].includes(url.protocol)?url.href:undefined;}catch{return undefined;}}
export function OKFArticle({body,links,origin,onOpen,images=[],path=""}:{body:string;links:Link[];origin:string;onOpen:(id:string)=>void;images?:{path:string;url:string}[];path?:string}){
 const inline=(text:string):ReactNode=>{
  const pattern=/(!?\[([^\]]*)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`)/g;const parts:ReactNode[]=[];let start=0;
  for(const match of text.matchAll(pattern)){parts.push(text.slice(start,match.index));const key=match.index!;
   if(match[4])parts.push(<strong key={key}>{match[4]}</strong>);
   else if(match[5])parts.push(<code key={key}>{match[5]}</code>);
   else if(match[1].startsWith('!')){
    const uploaded=images.find(image=>image.path===resolveAssetPath(path,match[3]))?.url;
    const asset=origin==='builtin'&&/^\/assets\/screenshots\/[a-zA-Z0-9._-]+\.(png|jpg)$/.test(match[3])?'/api/library/assets/'+match[3].split('/').pop():uploaded;
    parts.push(asset?<a key={key} href={asset} target="_blank" rel="noopener noreferrer"><img loading="lazy" src={asset} alt={match[2]}/></a>:<span key={key}>[Image: {match[2]}]</span>);
   }else{const internal=links.find(link=>link.href===match[3]&&link.id);const external=safeWebLink(match[3]);parts.push(internal?<button key={key} className="okf-text-link" onClick={()=>onOpen(internal.id!)}>{match[2]}</button>:external?<a key={key} href={external} target="_blank" rel="noopener noreferrer">{match[2]}</a>:<span key={key}>{match[2]} <small>(reference unavailable)</small></span>);}
   start=key+match[0].length;
  }parts.push(text.slice(start));return parts;
 };
 const lines=body.split('\n');const output:ReactNode[]=[];
 for(let i=0;i<lines.length;i++){
  const line=lines[i];if(!line.trim())continue;
  if(/^\s*```/.test(line)){const code:string[]=[];while(++i<lines.length&&!/^\s*```/.test(lines[i]))code.push(lines[i]);output.push(<pre key={i}><code>{code.join('\n')}</code></pre>);continue;}
  const heading=/^(#{1,6})\s+(.+)$/.exec(line);if(heading){const Heading=heading[1].length<=2?'h2':'h3';output.push(<Heading key={i}>{inline(heading[2])}</Heading>);continue;}
  if(/^\s*(?:[-*]|\d+\.)\s+/.test(line)){const ordered=/^\s*\d+\./.test(line);const entries:ReactNode[]=[];const pattern=ordered?/^\s*\d+\.\s+/:/^\s*[-*]\s+/;while(i<lines.length&&pattern.test(lines[i])){entries.push(<li key={i}>{inline(lines[i].replace(pattern,''))}</li>);i++;}i--;const List=ordered?'ol':'ul';output.push(<List key={i}>{entries}</List>);continue;}
  if(line.trim().startsWith('|')){const rows:string[]=[];while(i<lines.length&&lines[i].trim().startsWith('|'))rows.push(lines[i++]);i--;output.push(<div key={i} className="okf-table"><table><tbody>{rows.filter(row=>!/^\|[\s:|\-]+\|$/.test(row.trim())).map((row,index)=><tr key={index}>{row.trim().replace(/^\||\|$/g,'').split('|').map((cell,j)=>index===0?<th key={j}>{inline(cell.trim())}</th>:<td key={j}>{inline(cell.trim())}</td>)}</tr>)}</tbody></table></div>);continue;}
  output.push(<p key={i}>{inline(line)}</p>);
 }
 return <div className="okf-prose">{output}</div>;
}
