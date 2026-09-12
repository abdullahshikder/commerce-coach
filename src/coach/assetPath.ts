// Resolve bundle paths only. External URLs never become attachment requests.
export function resolveAssetPath(documentPath:string,href:string){
 if(!href||/^[a-z][a-z0-9+.-]*:/i.test(href)||href.startsWith('//')||href.includes('\\'))return undefined;
 const path=href.startsWith('/')?href.slice(1):documentPath.split('/').slice(0,-1).concat(href).join('/');
 const parts:string[]=[];for(const part of path.split('/')){if(part==='..'){if(!parts.length)return undefined;parts.pop();}else if(part&&part!=='.')parts.push(part);}
 return parts.join('/');
}
