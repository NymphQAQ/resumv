export function draftSummary(role: string, skills: string, evidence: string, starting=false, locale: 'en' | 'zh-CN' = 'en') {
 const clean=(s:string)=>s.trim().replace(/\s+/g,' ').replace(/[.!?。！？]+$/,'');
 const r=clean(role), s=clean(skills), e=clean(evidence);
 if(locale==='zh-CN') {
   if(!r||!s||!e) throw new Error('请填写职业方向、相关技能和一项真实成果。');
   return `${starting?`希望从事${r}相关工作，具备${s}方面的能力`:`职业方向为${r}，擅长${s}`}。${e}。`;
 }
 if(!r||!s||!e) throw new Error('Add a role, relevant skills, and one factual contribution.');
 return `${starting?'Seeking a role as a ':''}${r}${starting?'': ' with experience in'}${starting?', bringing skills in':' '} ${s}. ${e}.`.replace(/ {2,}/g,' ');
}
