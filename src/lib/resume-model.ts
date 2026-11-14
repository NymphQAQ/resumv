import DOMPurify from "dompurify";
import { flowResumeSections } from './resume-flow';
import {
  parseResumeData,
  type ResumeData,
} from "../vendor/reactive-resume/schema/resume/data";
import { sampleResumeData } from "../vendor/reactive-resume/schema/resume/sample";
import samplePicture from "../vendor/reactive-resume/schema/resume/sample-picture.json";
import { defaultResumeData } from "../vendor/reactive-resume/schema/resume/default";
import { reactiveTemplates } from "../data/templates";
import { translateSampleResumeToChinese } from "../data/chinese-sample";

export type { ResumeData };
export const STORAGE_KEY = "resumv.documents.v1";
export type SavedResume = {
  version: 1;
  id: string;
  kind: "resume" | "cv";
  title: string;
  updated: string;
  reactive: ResumeData;
  [key: string]: unknown;
};
export const sectionNames: Record<string, string> = {
  summary: "Summary",
  profiles: "Profiles",
  experience: "Experience",
  education: "Education",
  projects: "Projects",
  skills: "Skills",
  languages: "Languages",
  interests: "Interests",
  awards: "Awards",
  certifications: "Certifications",
  publications: "Publications",
  volunteer: "Volunteering",
  references: "References",
};

const chineseSectionNames: Record<string, string> = {
  summary: "个人简介",
  profiles: "个人资料",
  experience: "工作经历",
  education: "教育经历",
  projects: "项目经历",
  skills: "专业技能",
  languages: "语言能力",
  interests: "兴趣爱好",
  awards: "荣誉奖项",
  certifications: "证书",
  publications: "出版成果",
  volunteer: "志愿经历",
  references: "推荐人",
  "cover-letter": "求职信",
};

export const getSectionName = (id: string, locale = "en-US") =>
  /^zh(?:-|$)/i.test(locale)
    ? chineseSectionNames[id] ?? "其他信息"
    : sectionNames[id] ?? "Additional information";

export const getSummarySectionName = (locale = "en-US") =>
  /^zh(?:-|$)/i.test(locale) ? chineseSectionNames.summary : sectionNames.summary;
export const escapeHtml = (s: unknown) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export const textToHtml = (s: unknown) =>
  String(s ?? "")
    .split("\n")
    .map((line) => `<p>${escapeHtml(line) || "<br>"}</p>`)
    .join("");
export const stripHtml = (html: string) => {
  const el = document.createElement("div");
  el.innerHTML = cleanHtml(html);
  el.querySelectorAll("br").forEach((n) => n.replaceWith("\n"));
  el.querySelectorAll("p,li").forEach((n) => n.append("\n"));
  return (el.textContent || "").trim();
};
export function cleanHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "ul",
      "ol",
      "li",
      "a",
    ],
    ALLOWED_ATTR: ["href"],
    ALLOW_DATA_ATTR: false,
  });
}
const safeUrl = (url: unknown) =>
  /^(https?:\/\/|mailto:|tel:)/i.test(String(url)) ? String(url) : "";

export function getResumeContactLinks(data: ResumeData) {
  return data.basics.customFields.flatMap((field) => {
    const link = safeUrl(field.link.trim());
    const text = field.text.trim() || link.replace(/^https?:\/\//i, "");
    return text ? [{ ...field, text, link }] : [];
  });
}

export function newResume(template = "onyx"): ResumeData {
  const d = structuredClone(defaultResumeData);
  const selectedTemplate = reactiveTemplates.find((t) => t.id === template);
  d.metadata.template = (selectedTemplate?.id || "onyx") as ResumeData["metadata"]["template"];
  d.metadata.page.locale = selectedTemplate?.language ?? "en-US";
  d.metadata.design.colors.primary =
    selectedTemplate?.color ??
    reactiveTemplates.find((t) => t.id === "onyx")!.color;
  d.metadata.typography = {
    body: {
      fontFamily: "Lato",
      fontWeights: ["400", "700"],
      fontSize: 10,
      lineHeight: 1.5,
    },
    heading: {
      fontFamily: "Lato",
      fontWeights: ["700"],
      fontSize: 14,
      lineHeight: 1.4,
    },
  };
  d.metadata.page.marginX = 32;
  d.metadata.page.marginY = 18;
  d.metadata.layout.pages[0].main = [
    "summary",
    "experience",
    "education",
    "projects",
    "volunteer",
    "references",
  ];
  d.metadata.layout.pages[0].sidebar = [
    "profiles",
    "skills",
    "languages",
    "certifications",
    "awards",
    "interests",
    "publications",
  ];
  return d;
}
export function sampleResume(locale: "en-US" | "zh-CN" = "en-US"): ResumeData {
  const d = structuredClone(sampleResumeData);
  // Keep the source sample structure and let sections flow across physical PDF pages.
  d.picture.url = samplePicture;
  d.metadata.template = "onyx";
  d.metadata.page.locale = locale;
  d.metadata.typography.body.fontFamily = "Lato";
  d.metadata.typography.body.fontWeights = ["400", "700"];
  d.metadata.typography.heading.fontFamily = "Lato";
  d.metadata.typography.heading.fontWeights = ["700"];
  if (locale === "zh-CN") translateSampleResumeToChinese(d);
  flowResumeSections(d);
  return parseResumeData(d);
}
export function emptyItem(section: string): Record<string, any> {
  const base = {
    id: crypto.randomUUID(),
    hidden: false,
    website: { url: "", label: "", inlineLink: false },
    description: "",
  };
  const map: Record<string, object> = {
    experience: {
      company: "",
      position: "",
      location: "",
      period: "",
      roles: [],
    },
    education: {
      school: "",
      degree: "",
      area: "",
      grade: "",
      location: "",
      period: "",
    },
    projects: { name: "", period: "" },
    skills: {
      name: "",
      proficiency: "",
      level: 0,
      keywords: [],
      icon: "",
      iconColor: "",
    },
    languages: { language: "", fluency: "", level: 0 },
    profiles: { network: "", username: "", icon: "", iconColor: "" },
    interests: { name: "", keywords: [], icon: "", iconColor: "" },
    awards: { title: "", awarder: "", date: "" },
    certifications: { title: "", issuer: "", date: "" },
    publications: { title: "", publisher: "", date: "" },
    volunteer: { organization: "", location: "", period: "" },
    references: { name: "", position: "", phone: "" },
    summary: { content: "" },
  };
  return { ...base, ...map[section] };
}
export function sanitizeResume(input: unknown): ResumeData {
  const d = parseResumeData(input);
  // No remote image loads or imported executable markup/CSS. Preserve only local raster photos.
  d.picture.url =
    /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(
      d.picture.url,
    ) && d.picture.url.length < 2_500_000
      ? d.picture.url
      : "";
  d.summary.content = cleanHtml(d.summary.content);
  d.basics.website.url = safeUrl(d.basics.website.url);
  d.basics.customFields.forEach((f) => (f.link = safeUrl(f.link)));
  for (const section of [...Object.values(d.sections), ...d.customSections]) {
    if (section.items.length > 100)
      throw Error("每个章节最多包含 100 个条目。");
    for (const item of section.items as Record<string, any>[]) {
      for (const key of ["description", "content", "recipient"])
        if (typeof item[key] === "string") item[key] = cleanHtml(item[key]);
      if (item.website) item.website.url = safeUrl(item.website.url);
      if (item.roles)
        for (const role of item.roles)
          role.description = cleanHtml(role.description);
    }
  }
  for (const name of ["body", "heading"] as const) {
    const t = d.metadata.typography[name];
    if (!["Lato", "Helvetica", "Times-Roman", "Courier"].includes(t.fontFamily))
      t.fontFamily = "Lato";
  }
  d.metadata.page.locale = "en-US";
  d.metadata.styleRules = [];
  delete d.metadata.stylesheet;
  const known = new Set([
    "summary",
    ...Object.keys(d.sections),
    ...d.customSections.map((s) => s.id),
  ]);
  const seen = new Set<string>();
  if (!d.metadata.layout.pages.length)
    d.metadata.layout.pages = structuredClone(
      defaultResumeData.metadata.layout.pages,
    );
  if (d.metadata.layout.pages.length > 20)
    throw Error("一份简历最多可设置 20 组页面布局。");
  for (const p of d.metadata.layout.pages) {
    for (const col of ["main", "sidebar"] as const)
      p[col] = p[col].filter((id) => {
        if (!known.has(id) || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    if (p.fullWidth) {
      p.main.push(...p.sidebar);
      p.sidebar = [];
    }
  }
  for (const id of known)
    if (!seen.has(id)) d.metadata.layout.pages[0].main.push(id);
  return d;
}
export function saveEnvelope(
  data: ResumeData,
  id: string,
  title: string,
  kind: "resume" | "cv",
): SavedResume {
  return {
    version: 1,
    id,
    kind,
    title,
    updated: new Date().toISOString(),
    reactive: data,
  };
}
export function readStorage(): Record<string, any>[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const docs = JSON.parse(raw);
  if (!Array.isArray(docs)) throw Error("已保存的数据不是有效的文档列表。");
  return docs.filter(
    (d) =>
      d &&
      (d.kind === "letter" ||
        ((d.kind === "resume" || d.kind === "cv") && d.reactive)),
  );
}
export function writeResume(
  data: ResumeData,
  id: string,
  title: string,
  kind: "resume" | "cv",
) {
  const all = readStorage();
  const i = all.findIndex((d) => d.id === id);
  const doc = saveEnvelope(data, id, title, kind);
  if (i >= 0) all[i] = doc;
  else all.unshift(doc);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return doc;
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
export function exportText(d: ResumeData): string {
  return [
    d.basics.name,
    d.basics.headline,
    [
      d.basics.email,
      d.basics.phone,
      d.basics.location,
      d.basics.website.url,
    ]
      .filter(Boolean)
      .join(" · "),
    ...getResumeContactLinks(d).map(({ text, link }) => link || text),
    ...d.metadata.layout.pages
      .flatMap((p) => [...p.main, ...p.sidebar])
      .map((id) => {
        if (id === "summary") return d.summary.hidden ? "" : stripHtml(d.summary.content);
        const s =
          id in d.sections
            ? d.sections[id as keyof ResumeData["sections"]]
            : d.customSections.find((s) => s.id === id);
        if (!s || s.hidden || !s.items.some((i) => !i.hidden)) return "";
        return [
          s.title || getSectionName(id, d.metadata.page.locale),
          ...s.items
            .filter((i) => !i.hidden)
            .map((i) =>
              Object.entries(i)
                .filter(
                  ([k]) =>
                    ![
                      "id",
                      "hidden",
                      "icon",
                      "iconColor",
                      "level",
                      "website",
                      "roles",
                    ].includes(k),
                )
                .map(([, v]) =>
                  Array.isArray(v)
                    ? v.join(", ")
                    : typeof v === "string"
                      ? stripHtml(v)
                      : "",
                )
                .filter(Boolean)
                .join("\n"),
            ),
        ].join("\n");
      }),
  ]
    .filter(Boolean)
    .join("\n\n");
}

