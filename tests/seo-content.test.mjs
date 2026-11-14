import { test, expect } from 'bun:test';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
const dom = new JSDOM('');
for (const key of ['window','document','Node','Element','HTMLElement','DOMParser']) globalThis[key]=dom.window[key];
const { examples } = await import('../src/data/content.ts');
const { createRoleResume } = await import('../src/lib/role-resume.ts');
const { sanitizeResume, exportText } = await import('../src/lib/resume-model.ts');
const { draftSummary } = await import('../src/lib/summary-generator.ts');
const { createTemplateResume } = await import('../src/lib/template-resume.ts');
const { reactiveTemplates } = await import('../src/data/templates.ts');
const { getTemplatePage, getTemplateSemanticManifest } = await import('../src/vendor/reactive-resume/pdf/templates/index.ts');

test('gallery presets retain their original layouts and localized sample content',()=>{
 const manifest=JSON.parse(readFileSync('public/templates/preview-manifest.json','utf8'));
 for(const template of reactiveTemplates){
  const data=createTemplateResume(template.id);
  const preview=manifest.items.find(p=>p.path===`/templates/${template.previewId}.jpg`);
  expect(preview).toBeDefined();
  if(template.language==='zh-CN'){
   expect(data.basics.name).toBe('戴维·科瓦尔斯基');
   expect(data.basics.headline).toContain('游戏开发工程师');
   expect(data.metadata.page.locale).toBe('zh-CN');
   expect(data.summary.content).toContain('专业经验');
   expect(data.sections.experience.items[0].description).toContain('负责一款');
  }else{
   expect(data.basics.name).toBe(preview.name);
   expect(data.basics.headline).toBe(preview.headline);
   expect(data.metadata.page.locale).toBe('en-US');
  }
  expect(data.metadata.template).toBe(template.id);
  expect(data.metadata.design.colors.primary).toBe(template.color);
  const blank=createTemplateResume(template.id,true);
  expect(blank.basics.name).toBe('');
  expect(blank.metadata.template).toBe(template.id);
  expect(blank.metadata.page.locale).toBe(template.language);
 }
 for(const role of examples){
  const preview=manifest.items.find(p=>p.path===`/templates/roles/${role.slug}.jpg`);
  expect(preview.headline).toBe(createRoleResume(role.slug).basics.headline);
  expect(preview.template).toBe(role.template);
 }
});

test('Chinese variants reuse the matching English layout and semantic manifest',()=>{
 for(const template of reactiveTemplates.filter(item=>item.language==='zh-CN')){
  const baseId=template.id.replace(/-zh$/,'');
  expect(getTemplatePage(template.id)).toBe(getTemplatePage(baseId));
  expect(getTemplateSemanticManifest(template.id).template).toBe(template.id);
  expect(getTemplateSemanticManifest(template.id).parts).toEqual(getTemplateSemanticManifest(baseId).parts);
 }
});

test('all role examples survive schema validation with their substantive content',()=>{
 for(const role of examples){
  const resume=sanitizeResume(createRoleResume(role.slug));
  const text=exportText(resume);
  expect(text).toContain(role.bullets[2]);
  expect(text).toContain(role.projectDescription);
  expect(text).toContain(role.educationDate);
  expect(resume.metadata.template).toBe(role.template);
 }
});
test('blank role presets never carry fictional candidate facts into an application',()=>{
 for(const role of examples){
  const resume=sanitizeResume(createRoleResume(role.slug,true));
  expect(resume.basics.name).toBe('');
  expect(resume.summary.content).toBe('');
  expect(exportText(resume)).not.toMatch(/Jordan Taylor|Example School|2023|2027/);
 }
});
test('keyword mapping preserves the requested measured thresholds',()=>{
 const rows=JSON.parse(readFileSync('src/data/seo/keyword-map.json','utf8'));
 expect(rows).toHaveLength(152);
 expect(new Set(rows.map(r=>r.keyword)).size).toBe(rows.length);
 for(const r of rows){expect(r.volume_us_monthly).toBeGreaterThanOrEqual(1000);expect(r.kd).toBeLessThan(29);}
});
test('summary drafts use supplied evidence and distinguish entry-level intent',()=>{
 expect(draftSummary('数据分析师','SQL','实现周报自动化。',false,'zh-CN')).toBe('职业方向为数据分析师，擅长SQL。实现周报自动化。');
 expect(draftSummary('Data analyst','SQL and Excel','Validated 12 reports.')).toBe('Data analyst with experience in SQL and Excel. Validated 12 reports.');
 const entry=draftSummary('Data analyst','SQL','Completed a class project',true);
 expect(entry).toStartWith('Seeking a role as a Data analyst');
 expect(entry).not.toContain('with experience');
 expect(()=>draftSummary('','SQL','Project')).toThrow();
});
