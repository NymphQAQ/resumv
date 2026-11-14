// Adapted from Reactive Resume (MIT). Local-only font registration for resumv.
import type { ResumeData, Typography } from "@reactive-resume/schema/resume/data";
import { Font } from "#react-pdf-renderer";
import regular from "@fontsource/lato/files/lato-latin-400-normal.woff?url";
import bold from "@fontsource/lato/files/lato-latin-700-normal.woff?url";
import italic from "@fontsource/lato/files/lato-latin-400-italic.woff?url";
import boldItalic from "@fontsource/lato/files/lato-latin-700-italic.woff?url";
import chineseRegular from "../../../../assets/fonts/NotoSansCJKsc-Regular-PDF.woff2?url";
import chineseBold from "../../../../assets/fonts/NotoSansCJKsc-Bold-PDF.woff2?url";

const chineseFamily = "Noto Sans CJK SC";
const chineseText = /[\p{Script=Han}\u3000-\u303F\u30FB\u3100-\u312F\u31A0-\u31BF\uFE10-\uFE1F\uFE30-\uFE4F\uFF01-\uFF60]/u;
let latoRegistered = false;
let chineseRegistered = false;

type PdfTypography = Omit<Typography, "body" | "heading"> & {
  body: Omit<Typography["body"], "fontFamily"> & { fontFamily: string | string[] };
  heading: Omit<Typography["heading"], "fontFamily"> & { fontFamily: string | string[] };
};

function containsChineseText(value: unknown): boolean {
  if (typeof value === "string") return chineseText.test(value);
  return value !== null && typeof value === "object" && Object.values(value).some(containsChineseText);
}

export function resumeContentContainsChinese({ basics, summary, sections, customSections }: ResumeData): boolean {
  return containsChineseText([basics, summary, sections, customSections]);
}

export function registerFonts(typography: Typography, needsChineseFont: boolean): PdfTypography {
  if (!latoRegistered) {
    Font.register({
      family: "Lato",
      fonts: [
        { src: regular, fontWeight: 400 },
        { src: bold, fontWeight: 700 },
        { src: italic, fontWeight: 400, fontStyle: "italic" },
        { src: boldItalic, fontWeight: 700, fontStyle: "italic" },
      ],
    });
    latoRegistered = true;
  }

  if (needsChineseFont && !chineseRegistered) {
    // The Chinese fallback uses upright glyphs for italic text.
    Font.register({
      family: chineseFamily,
      fonts: [
        { src: chineseRegular, fontWeight: 400 },
        { src: chineseBold, fontWeight: 700 },
        { src: chineseRegular, fontWeight: 400, fontStyle: "italic" },
        { src: chineseBold, fontWeight: 700, fontStyle: "italic" },
      ],
    });
    chineseRegistered = true;
  }

  const fontStack = (family: string) => {
    const primary = ["Lato", "Helvetica", "Times-Roman", "Courier"].includes(family) ? family : "Lato";
    return needsChineseFont ? [primary, chineseFamily] : primary;
  };

  return {
    ...typography,
    body: { ...typography.body, fontFamily: fontStack(typography.body.fontFamily) },
    heading: { ...typography.heading, fontFamily: fontStack(typography.heading.fontFamily) },
  };
}
