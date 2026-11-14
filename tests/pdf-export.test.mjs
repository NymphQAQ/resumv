import { expect, test } from "bun:test";
import { spawnSync } from "bun";

test("Changing an English resume's name to Chinese preserves English spacing in the PDF", () => {
  const result = spawnSync([process.execPath, "run", "tests/fixtures/check-chinese-pdf.mjs"], {
    stderr: "pipe",
    timeout: 15_000,
  });
  expect(result.exitCode, result.stderr.toString()).toBe(0);
}, 15_000);

test("Chinese template copies render localized content in the PDF", () => {
  const result = spawnSync([process.execPath, "run", "tests/fixtures/check-chinese-template-pdf.mjs"], {
    stderr: "pipe",
    timeout: 20_000,
  });
  expect(result.exitCode, result.stderr.toString()).toBe(0);
}, 20_000);
