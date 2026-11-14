import { newResume, sampleResume } from './resume-model';

// Shared by the template gallery previews and the builder's template links.
export function createTemplateResume(template: string, blank = false) {
  const design = newResume(template);
  if (blank) return design;
  const data = sampleResume(design.metadata.page.locale === "zh-CN" ? "zh-CN" : "en-US");
  data.metadata.template = design.metadata.template;
  data.metadata.page.locale = design.metadata.page.locale;
  data.metadata.design.colors.primary = design.metadata.design.colors.primary;
  return data;
}
