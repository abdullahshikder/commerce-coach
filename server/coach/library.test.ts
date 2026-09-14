import test from 'node:test';
import assert from 'node:assert/strict';
import {builtInLibrary,libraryDetail,resolveConceptLink} from './library';
import {safeWebLink} from '../../src/coach/OKFArticle';
test('built-in reader exposes the complete bundle and resolves concept links',async()=>{
 const library=await builtInLibrary();assert.equal(library.documents.length,334);assert.equal(library.assets.size,112);
 const linked=library.documents.map(doc=>libraryDetail(doc,library.documents)).find(doc=>doc.links.some(link=>link.id));
 assert.ok(linked);assert.ok(linked.links.some(link=>library.documents.some(doc=>doc.id===link.id)));
});
test('official videos are browsable as source-linked tutorials with visual guides',async()=>{
 const {documents}=await builtInLibrary();
 const tutorial=documents.find(doc=>doc.path==='tutorials/tutorial-video-009.md');
 assert.equal(tutorial?.category,'tutorials');
 assert.equal(tutorial?.type,'Tutorial Video');
 assert.equal(tutorial?.metadata.sources?.[0]?.resource,'https://www.youtube.com/watch?v=lngsxYOaWDY&list=PLMN1y8VZcPd8');
 const detail=libraryDetail(tutorial,documents);
 assert.match(detail.body,/Daraz কানেক্ট করে প্রোডাক্ট import করব কীভাবে/);
 assert.ok(detail.links.some(link=>link.id==='builtin:visual-guides/addons-daraz.md'));
 assert.ok(detail.links.some(link=>link.id==='builtin:visual-guides/daraz-001.md'));
});

test('merchant FAQs are browsable and expand their connected step-by-step guides',async()=>{
 const {documents}=await builtInLibrary();
 const faq=documents.find(doc=>doc.path==='faqs/merchant-faq-006.md');
 assert.equal(faq?.category,'faqs');
 assert.equal(faq?.type,'Merchant FAQ');
 const detail=libraryDetail(faq,documents);
 assert.match(detail.body,/আমি কীভাবে সাইনআপ করতে পারি/);
 assert.match(detail.body,/assets\/screenshots\/image89\.jpg/);
 assert.match(detail.body,/assets\/screenshots\/image92\.jpg/);
 assert.match(detail.body,/assets\/screenshots\/image98\.jpg/);
});
test('additional merchant FAQs are included with their connected guides',async()=>{
 const {documents}=await builtInLibrary();
 const faq=documents.find(doc=>doc.path==='faqs/merchant-faq-084.md');
 assert.equal(faq?.category,'faqs');
 assert.equal(faq?.type,'Merchant FAQ');
 const detail=libraryDetail(faq,documents);
 assert.match(detail.body,/বাল্ক প্রোডাক্ট আপলোডে কিছু রো ফেল করেছে কেন/);
 assert.ok(detail.links.some(link=>link.id==='builtin:visual-guides/bulk-001.md'));
});
test('reader links stay in their bundle and unsafe URL schemes are not clickable',()=>{
 assert.equal(resolveConceptLink('knowledge/a.md','../workflows/b.md'),'workflows/b.md');
 assert.equal(resolveConceptLink('knowledge/a.md','javascript:alert(1)'),undefined);
 assert.equal(safeWebLink('javascript:alert(1)'),undefined);assert.equal(safeWebLink('data:text/html,test'),undefined);
 assert.equal(safeWebLink('https://example.com/'),'https://example.com/');
 const current={id:'upload:a',path:'a.md',origin:'upload',bundle:'A',body:'[Other](b.md)',metadata:{type:'Guide'}};
 assert.equal(libraryDetail(current,[{id:'upload:b',path:'b.md',origin:'upload',bundle:'B'}]).links[0].id,undefined);
});

test('warehouse article includes linked screenshots without opening the guide',async()=>{
 const {documents}=await builtInLibrary();
 const article=documents.find(doc=>doc.path==='knowledge/warehouse-001.md');
 const detail=libraryDetail(article,documents);
 assert.match(detail.body,/!\[.*\]\(\/assets\/screenshots\/image96.jpg\)/);
 assert.match(detail.body,/!\[.*\]\(\/assets\/screenshots\/image103.jpg\)/);
 assert.equal((detail.body.match(/image96.jpg/g)??[]).length,1);
 assert.ok(detail.links.some(link=>link.id==='builtin:visual-guides/warehouse-001.md'));
});
