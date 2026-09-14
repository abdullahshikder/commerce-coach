import {mkdir,writeFile,copyFile,readFile} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {stringify} from 'yaml';
import assert from 'node:assert/strict';
import {KNOWLEDGE_BASE,TRAINING_MODULES,QUIZ_QUESTIONS} from '../src/coach/knowledgeBase';
import {COACH_WORKFLOWS,ORDER_SOURCE_RULES} from '../src/coach/workflows/registry';
import {SCREENSHOT_REGISTRY} from '../src/coach/screenshots/manifest';
import {parseOKF} from '../server/coach/okf';

const output=resolve(process.argv[2]??'knowledge/commerce-okf');
// A pinned export time keeps generated bundles reviewable and reproducible in release automation.
const timestamp=new Date(process.env.SOURCE_DATE_EPOCH||Date.now()).toISOString();
const concepts:{path:string;title:string;type:string}[]=[];
const images=new Set<string>();
const slug=(text:string)=>text.toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-|-$/g,'');
const list=(title:string,values?:string[])=>values?.length?`\n## ${title}\n\n${values.map(value=>`- ${value}`).join('\n')}\n`:'';
const steps=(values?:string[])=>values?.length?`\n## Steps\n\n${values.map((value,index)=>`${index+1}. ${value}`).join('\n')}\n`:'';
async function concept(path:string,type:string,title:string,record:any,body:string,extra:Record<string,unknown>={}){
 const metadata={type,title,status:'stable',generated:{by:'process:commerce-coach-okf-export',at:timestamp},
  ...(record.source?{sources:[{resource:record.source}]}:{}),...extra,commerce_record:record};
 const content=`---\n${stringify(metadata,{lineWidth:0,aliasDuplicateObjects:false})}---\n\n${body.trim()}\n`;
 const parsed=parseOKF(path,content);
 assert.deepEqual(parsed.metadata.commerce_record,JSON.parse(JSON.stringify(record)),`Record round-trip failed: ${path}`);
 const file=join(output,path);await mkdir(dirname(file),{recursive:true});await writeFile(file,content);
 concepts.push({path,title,type});
}
for(const item of KNOWLEDGE_BASE){
 const merchantFaq=item.id.startsWith('merchant-faq-');
 const tutorialVideo=item.id.startsWith('tutorial-video-');
 const workflow=COACH_WORKFLOWS.find(value=>value.knowledgeId===item.id);
 const translation=item.translations?.bn;
 const refs=item.screenshotIds?.map(id=>{
  const set=SCREENSHOT_REGISTRY.find(value=>value.featureId===id);
  if(set)return `[${set.feature}](/visual-guides/${slug(set.featureId)}.md)`;
  if(/\.(png|jpg)$/.test(id)){images.add(id);return `![${item.feature}](/assets/screenshots/${id})`;}
  return `Screenshot reference: ${id}`;
 }).join('\n\n')??'';
 await concept(`${merchantFaq?'faqs':tutorialVideo?'tutorials':'knowledge'}/${item.id}.md`,merchantFaq?'Merchant FAQ':tutorialVideo?'Tutorial Video':'Product Knowledge',item.feature,item,
  `# ${item.question}\n\n${item.answer}\n`+
  (translation?`\n## বাংলা\n\n### ${translation.question}\n\n${translation.answer}\n`:'')+
  `\nProduct availability: **${item.status}**.\n`+
  list('How it works',item.howItWorks)+list('Prerequisites',item.prerequisites)+steps(item.steps)+list('Edge cases',item.edgeCases)+list('Customer experience notes',item.cxNotes)+
  (item.merchantCommunication?`\n## Merchant communication\n\n${item.merchantCommunication}\n`:'')+
  (workflow?`\n## Related workflow\n\n[${workflow.feature}](/workflows/${workflow.id}.md)\n`:'')+
  (refs?`\n## ${merchantFaq||tutorialVideo?'Step-by-step guide':'Screenshots'}\n\n${refs}\n`:''),
  {tags:[item.domain,...item.keywords],product_status:item.status,description:item.question,source_record:merchantFaq?'src/coach/merchantFaq.ts':tutorialVideo?'src/coach/tutorialVideos.ts':'src/coach/knowledgeBase.ts'});
}
for(const workflow of COACH_WORKFLOWS){
 const translation=workflow.translations?.bn;
 for(const screenshot of workflow.screenshots)images.add(screenshot.src);
 await concept(`workflows/${workflow.id}.md`,'Playbook',workflow.feature,workflow,
  `# ${workflow.question}\n\n${workflow.answer}\n`+list('Prerequisites',workflow.prerequisites)+steps(workflow.steps)+
  `\n## Product knowledge\n\n[${workflow.feature}](/knowledge/${workflow.knowledgeId}.md)\n`+
  `\n## Visual guide\n\n${workflow.screenshots.map(image=>`![${image.featureId}](/assets/screenshots/${image.src})`).join('\n\n')}\n`+
  (translation?`\n## বাংলা\n\n### ${translation.question}\n\n${translation.answer}\n`+list('পূর্বশর্ত',translation.prerequisites)+steps(translation.steps):''),
  {tags:[workflow.domain,...workflow.keywords],source_record:'src/coach/workflows/registry.ts'});
}
for(const module of TRAINING_MODULES)await concept(`training/${module.id}.md`,'Training Module',module.title,module,
 `# ${module.title}\n\n${module.description}\n\nLevel: ${module.level}\n`+list('Key concepts',module.keyConcepts),{tags:module.domains,source_record:'src/coach/knowledgeBase.ts'});
for(const question of QUIZ_QUESTIONS)await concept(`quizzes/${question.id}.md`,'Quiz Question',question.question,question,
 `# ${question.question}\n`+list('Options',question.options)+`\n## Correct answer\n\n${question.correctAnswer}\n\n## Explanation\n\n${question.explanation}\n`,{tags:[question.domain,question.difficulty],source_record:'src/coach/knowledgeBase.ts'});
for(const rule of ORDER_SOURCE_RULES)await concept(`order-sources/${rule.id}.md`,'Order Routing Rule',rule.label,rule,
 `# ${rule.label}\n\nFirst tab: ${rule.firstTab}\n\nMerchant action: ${rule.merchantAction}\n\nFulfillment: ${rule.fulfillment}\n`,{source_record:'src/coach/workflows/registry.ts'});
for(const set of SCREENSHOT_REGISTRY){
 for(const image of set.screenshots)images.add(image.src);
 await concept(`visual-guides/${slug(set.featureId)}.md`,'Visual Guide',set.feature,set,
 `# ${set.feature}\n\n${set.screenshots.map(image=>`## ${image.step?`Step ${image.step}: `:''}${image.caption}\n\n![${image.caption}](/assets/screenshots/${image.src})`).join('\n\n')}`,
 {tags:set.keywords,sources:[{resource:'ProductMemoPathaoCommerce.html'}],source_record:'src/coach/screenshots/manifest.ts'});
}
await mkdir(join(output,'assets/screenshots'),{recursive:true});
for(const image of images){if(!/^[a-zA-Z0-9._-]+$/.test(image))throw new Error(`Unsafe screenshot filename: ${image}`);await copyFile(resolve('src/coach/screenshots',image),join(output,'assets/screenshots',image));}
const groups=[...new Set(concepts.map(item=>item.path.split('/')[0]))];
const rootIndex=['---',"okf_version: '0.2'",'---','# Commerce Coach knowledge','',...groups.map(group=>`- [${group}](${group}/index.md)`)];
await writeFile(join(output,'index.md'),rootIndex.join('\n')+'\n');
for(const group of groups)await writeFile(join(output,group,'index.md'),`# ${group}\n\n`+concepts.filter(item=>item.path.startsWith(group+'/')).map(item=>`- [${item.title.replace(/[\[\]\n]/g,' ')}](${item.path.split('/').pop()})`).join('\n')+'\n');
await writeFile(join(output,'log.md'),`# Conversion log\n\n## ${timestamp.slice(0,10)}\n\n- Exported ${concepts.length} concepts and ${images.size} screenshots from the existing Commerce Coach registries. Original records are retained in commerce_record frontmatter.\n- Product availability is preserved separately from document lifecycle. No human verification is asserted.\n`);
const counts={knowledge:KNOWLEDGE_BASE.length,merchantFaqs:KNOWLEDGE_BASE.filter(item=>item.id.startsWith('merchant-faq-')).length,workflows:COACH_WORKFLOWS.length,training:TRAINING_MODULES.length,quizzes:QUIZ_QUESTIONS.length,orderSources:ORDER_SOURCE_RULES.length,visualGuides:SCREENSHOT_REGISTRY.length,concepts:concepts.length,screenshots:images.size};
await writeFile(join(output,'export-manifest.json'),JSON.stringify({generatedAt:timestamp,counts,concepts},null,2)+'\n');
// Every source record was round-trip checked above; now verify bundle-local link targets.
for(const entry of concepts){const content=await readFile(join(output,entry.path),'utf8');for(const match of content.matchAll(/\]\(\/(.*?)\)/g)){await readFile(join(output,match[1]));}}
console.log(JSON.stringify({output,...counts},null,2));
