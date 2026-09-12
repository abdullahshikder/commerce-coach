import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateImage,attachmentPath} from './attachments';
import {prepareDocument} from './worker';
import {productionConfiguration} from '../production';
import {resolveAssetPath} from '../../src/coach/assetPath';
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
test('attachments reject traversal, executable content, wrong extensions and oversized images',()=>{
 assert.equal(validateImage(png,'assets/step.png').mime,'image/png');
 for(const path of ['../secret.png','https://example.com/a.png','//example.com/a.png','a\\b.png','a.svg'])assert.throws(()=>attachmentPath(path));
 assert.throws(()=>validateImage(Buffer.from('<svg onload="alert(1)"/>').toString('base64'),'a.png'));
 assert.throws(()=>validateImage(png,'a.jpg'));
 const huge=Buffer.from(png,'base64');huge.writeUInt32BE(50000,16);assert.throws(()=>validateImage(huge.toString('base64'),'a.png'));
 assert.equal(resolveAssetPath('guides/start.md','../assets/step.png'),'assets/step.png');
 assert.equal(resolveAssetPath('guides/start.md','../../secret.png'),undefined);
 assert.equal(resolveAssetPath('guide.md','https://example.com/a.png'),undefined);
});
test('real bundled JPEG and PNG screenshots pass attachment validation',async()=>{
 for(const name of ['image96.jpg','image1.png']){const bytes=await readFile(new URL(`../../knowledge/commerce-okf/assets/screenshots/${name}`,import.meta.url));assert.ok(validateImage(bytes.toString('base64'),'assets/'+name).data.length);}
});
test('worker prepares bilingual prose, preserves grounding and validates vectors',async()=>{
 const provider={model:'test',embed:async(texts:string[])=>texts.map(()=>[1,0,0])} as any;
 const result=await prepareDocument('---\ntype: Guide\ntitle: গুদাম\ntags: [warehouse]\n---\nWarehouse Management থেকে Add Warehouse খুলুন।','guide.md',provider);
 assert.equal(result.model,'test');assert.match(result.chunks[0].text,/Add Warehouse/);assert.deepEqual(result.chunks[0].vector,[1,0,0]);
 await assert.rejects(prepareDocument('source',undefined,{model:'bad',embed:async()=>[[NaN]]} as any));
});
test('readiness distinguishes HTTPS origins, partial SSO and configured providers',()=>{
 const config=productionConfiguration({APP_ORIGINS:'http://localhost:4010',GOOGLE_CLIENT_ID:'present'});
 assert.equal(config.httpsOrigins,false);assert.equal(config.googlePartial,true);assert.equal(config.googleConfigured,false);assert.equal(config.generationConfigured,false);
 assert.equal(productionConfiguration({APP_ORIGINS:'https://coach.example.com',OPENROUTER_API_KEY:'present'}).embeddingsConfigured,true);
});
