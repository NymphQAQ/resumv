import assert from "node:assert/strict";
import "../../scripts/pdf-assets.mjs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { sampleResume } from "../../src/lib/resume-model.ts";

const { createResumePdfBlob } = await import("../../src/vendor/reactive-resume/pdf/browser.tsx");
const data = sampleResume("zh-CN");
assert.equal(data.metadata.template, "onyx-zh");
assert.equal(data.metadata.page.locale, "zh-CN");

const blob = await createResumePdfBlob({ data });
const loadingTask = getDocument({ data: new Uint8Array(await blob.arrayBuffer()) });
try {
  const pdf = await loadingTask.promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const { items } = await page.getTextContent();
    pages.push(items.map((item) => item.str).join(""));
  }
  const text = pages.join("\n");
  assert.ok(text.includes("戴维·科瓦尔斯基"), "The Chinese template should render its localized name");
  assert.ok(text.includes("个人简介"), "The Chinese template should render localized section headings");
  assert.ok(text.includes("高级游戏开发工程师"), "The Chinese template should render translated sample content");
  assert.ok(text.includes("工作经历"), "The Chinese template should render localized experience headings");
} finally {
  await loadingTask.destroy();
}
