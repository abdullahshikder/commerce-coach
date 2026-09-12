import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chunkDocument,cosine} from './documents';
test('document chunks preserve bilingual content with bounded overlap',()=>{
 const text=('Warehouse policy. গুদাম কিভাবে তৈরি করতে হয়\n').repeat(160);
 const chunks=chunkDocument(text);assert(chunks.length>1);assert(chunks.every(chunk=>chunk.length<=1800));
 let rebuilt=chunks[0];for(const chunk of chunks.slice(1)){assert(rebuilt.endsWith(chunk.slice(0,160)));rebuilt+=chunk.slice(160);}
 assert.equal(rebuilt,text.trim());
});
test('empty, binary, and oversized documents are rejected',()=>{for(const text of ['  ','a\0b','x'.repeat(65537),'অ'.repeat(30000)])assert.throws(()=>chunkDocument(text));});
test('semantic similarity excludes mismatched dimensions and zero vectors',()=>{assert.equal(cosine([1,0],[1,0]),1);assert.equal(cosine([1,0],[0,1]),0);assert.equal(cosine([1],[1,0]),0);assert.equal(cosine([0],[0]),0);});
