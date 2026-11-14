import assert from "node:assert/strict";
import "../../scripts/pdf-assets.mjs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { sampleResume } from "../../src/lib/resume-model.ts";
import { rasterizePdf } from "../../src/vendor/reactive-resume/pdf/semantic/test/rasterize-pdf.ts";

const { createResumePdfBlob } = await import("../../src/vendor/reactive-resume/pdf/browser.tsx");
const data = sampleResume();

async function readHeadline(bytes) {
  const loadingTask = getDocument({ data: bytes });
  try {
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const { items } = await page.getTextContent();
    const headline = items.find((item) => item.str?.includes("Game"));
    assert.equal(headline?.str, data.basics.headline, "The original English headline should retain its spaces");
    return { headlineWidth: headline.width, text: items.map((item) => item.str).join("") };
  } finally {
    await loadingTask.destroy();
  }
}

// Render the English sample first, then make the same edit as in the builder.
const initialBlob = await createResumePdfBlob({ data });
const initial = await readHeadline(new Uint8Array(await initialBlob.arrayBuffer()));
data.basics.name = "刘工𠮷";

const blob = await createResumePdfBlob({ data });
const bytes = new Uint8Array(await blob.arrayBuffer());
const edited = await readHeadline(bytes.slice());
assert.ok(edited.text.includes(data.basics.name), "Chinese text should be selectable");
assert.ok(Math.abs(edited.headlineWidth - initial.headlineWidth) < 0.01, "Changing the name should preserve the English headline's spacing");

// Text extraction can pass even when the embedded font's outlines are blank.
const [page] = await rasterizePdf(bytes);
const nameAreaHasInk = page.data.some((value, index) => {
  const pixel = index / 4;
  const x = pixel % page.width;
  const y = Math.floor(pixel / page.width);
  return index % 4 === 0 && x > 180 && x < 260 && y > 30 && y < 65 && value < 120;
});
assert.ok(nameAreaHasInk, "Chinese glyphs should be visible");
