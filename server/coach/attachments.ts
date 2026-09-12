import {posix} from 'node:path';
export function attachmentPath(path:unknown){
 if(typeof path!=='string'||!path||path.length>500||path.includes('\\')||/[\x00-\x1f]/.test(path)||/^[a-z][a-z0-9+.-]*:/i.test(path)||path.startsWith('//'))throw new Error('Invalid image path.');
 const normalized=posix.normalize(path.replace(/^\//,''));
 if(normalized==='..'||normalized.startsWith('../')||! /\.(png|jpe?g)$/i.test(normalized))throw new Error('Choose a PNG or JPEG path within the bundle.');
 return normalized;
}
export function validateImage(base64:unknown,path:unknown){
 const normalized=attachmentPath(path);
 if(typeof base64!=='string'||base64.length>6990508||! /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64))throw new Error('Invalid image encoding.');
 const data=Buffer.from(base64,'base64');if(!data.length||data.length>5242880)throw new Error('Images must be at most 5 MB.');
 let mime='',width=0,height=0;
 if(data.length>=33&&data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&data.toString('ascii',12,16)==='IHDR'){
 mime='image/png';width=data.readUInt32BE(16);height=data.readUInt32BE(20);
 }else if(data[0]===255&&data[1]===216&&data[data.length-2]===255&&data[data.length-1]===217){
 mime='image/jpeg';let offset=2;
 while(offset+4<data.length){if(data[offset]!==255)break;const marker=data[offset+1];if(marker===218)break;const size=data.readUInt16BE(offset+2);if(size<2||offset+2+size>data.length)break;
 if([192,193,194].includes(marker)&&size>=8){height=data.readUInt16BE(offset+5);width=data.readUInt16BE(offset+7);break;}offset+=2+size;}
 }
 if(!mime||!width||!height||width*height>40000000||width>16000||height>16000||((mime==='image/png')!==normalized.toLowerCase().endsWith('.png')))throw new Error('Choose a valid PNG or JPEG under 40 megapixels.');
 return {path:normalized,data,mime};
}
