import GitHubLink from "../GitHubLink";
import ProjectFooter from "../ProjectFooter";
import { createRoleResume } from "../../lib/role-resume";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Plus,
  Download,
  FileText,
  Undo2,
  Redo2,
  Check,
  ChevronDown,
  ChevronRight,
  Settings2,
  LayoutTemplate,
  Type,
  Palette,
  Columns2,
  BookOpen,
  UserRound,
  BriefcaseBusiness,
  GraduationCap,
  Wrench,
  FolderKanban,
  Globe,
  Award,
  HeartHandshake,
  Languages,
  Quote,
  Sparkles,
  ImagePlus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  X,
  Upload,
  Minus,
  Maximize,
  GripVertical,
  LoaderCircle,
  PanelLeftClose,
  PanelRightClose,
} from "lucide-react";
import {
  newResume,
  sampleResume,
  sanitizeResume,
  readStorage,
  writeResume,
  emptyItem,
  downloadBlob,
  exportText,
  textToHtml,
  type ResumeData,
} from "../../lib/resume-model";
import { roleLabels, sectionLabels } from "../../data/ui-labels";
import { reactiveTemplates } from "../../data/templates";
import { examples } from "../../data/content";
import { createTemplateResume } from "../../lib/template-resume";
import { flowResumeSections } from "../../lib/resume-flow";
import { exportMarkdown } from "../../lib/markdown-export";
import ResumeCanvas from "./ResumeCanvas";
import RichText from "./RichText";
import { useReorderDrag } from "./useReorderDrag";
import "../../styles/builder.css";

type SectionKey = keyof ResumeData["sections"];
type LayoutColumn = "main" | "sidebar";
const sectionLabel = (id: string, section?: { title: string; type?: string }) => {
  if (id === "basics") return "个人资料";
  if (section?.type === "cover-letter" && (!section.title || section.title === "Cover Letter")) return "求职信";
  return section?.title || sectionLabels[id] || "自定义章节";
};
const icons: Record<string, typeof UserRound> = {
  basics: UserRound,
  summary: FileText,
  profiles: Globe,
  experience: BriefcaseBusiness,
  education: GraduationCap,
  skills: Wrench,
  projects: FolderKanban,
  languages: Languages,
  awards: Award,
  certifications: Award,
  publications: BookOpen,
  volunteer: HeartHandshake,
  interests: HeartHandshake,
  references: Quote,
};
const fields: Record<string, [string, string][]> = {
  experience: [
    ["company", "公司"],
    ["position", "职位"],
    ["location", "所在地"],
    ["period", "起止时间"],
  ],
  education: [
    ["school", "学校"],
    ["degree", "学位"],
    ["area", "专业"],
    ["grade", "成绩 / GPA"],
    ["location", "所在地"],
    ["period", "起止时间"],
  ],
  projects: [
    ["name", "项目名称"],
    ["period", "起止时间"],
  ],
  skills: [
    ["name", "技能分类"],
    ["proficiency", "熟练程度"],
    ["keywords", "关键词，用逗号分隔"],
  ],
  languages: [
    ["language", "语言"],
    ["fluency", "流利程度"],
  ],
  profiles: [
    ["network", "平台"],
    ["username", "用户名"],
  ],
  interests: [
    ["name", "兴趣"],
    ["keywords", "关键词，用逗号分隔"],
  ],
  awards: [
    ["title", "奖项名称"],
    ["awarder", "颁奖机构"],
    ["date", "日期"],
  ],
  certifications: [
    ["title", "证书名称"],
    ["issuer", "发证机构"],
    ["date", "日期"],
  ],
  publications: [
    ["title", "出版物名称"],
    ["publisher", "出版机构"],
    ["date", "日期"],
  ],
  volunteer: [
    ["organization", "组织"],
    ["location", "所在地"],
    ["period", "起止时间"],
  ],
  references: [
    ["name", "姓名"],
    ["position", "职位"],
    ["phone", "电话"],
  ],
};
const hasDescription = new Set([
  "experience",
  "education",
  "projects",
  "awards",
  "certifications",
  "publications",
  "volunteer",
  "references",
]);
const makeId = () => crypto.randomUUID();
const safeFilename = (s: string) =>
  s.replace(/[^\p{L}\p{N}\s_-]/gu, "").trim() || "简历";
function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="b-field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
function Range({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="b-range">
      <span>
        {label}
        <output>
          {value}
          {suffix}
        </output>
      </span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
export default function ResumeBuilder({
  kind = "resume",
}: {
  kind?: "resume" | "cv";
}) {
  const [data, setData] = useState<ResumeData | null>(null);
  const [title, setTitle] = useState("未命名简历");
  const [id, setId] = useState("");
  const [active, setActive] = useState("basics");
  const [settings, setSettings] = useState("templates");
  const [mobile, setMobile] = useState("content");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState("本地草稿");
  const [message, setMessage] = useState("");
  const [previewStatus, setPreviewStatus] = useState("正在准备预览");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [zoom, setZoom] = useState(75);
  const previewWidth = (794 * zoom) / 100;
  const [sample, setSample] = useState(false);
  const [ready, setReady] = useState(false);
  const [fatal, setFatal] = useState("");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [historyCount, setHistoryCount] = useState(0);
  const [futureCount, setFutureCount] = useState(0);
  const past = useRef<ResumeData[]>([]);
  const future = useRef<ResumeData[]>([]);
  const dirty = useRef(false);
  const latest = useRef<{ data: ResumeData; title: string; id: string } | null>(
    null,
  );
  const canvas = useRef<HTMLDivElement>(null);
  const inputFile = useRef<HTMLInputElement>(null);
  const photoFile = useRef<HTMLInputElement>(null);
  const sectionDrag = useReorderDrag("layout");
  const entryDrag = useReorderDrag(active);
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snapshotTime = useRef(0);
  const notify = useCallback((msg: string) => {
    setMessage(msg);
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMessage(""), 5000);
  }, []);
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const docs = readStorage();
      const existing =
        docs.find((d) => d.id === params.get("id") && d.kind !== 'letter') ||
        (!params.has("id") &&
        !params.has("new") &&
        !params.has("template") &&
        !params.has("example")
          ? docs
              .filter((d) => d.kind !== 'letter')
              .sort((a, b) =>
                String(b.updated).localeCompare(String(a.updated)),
              )[0]
          : null);
      let d: ResumeData;
      let name: string;
      let documentId: string;
      if (existing) {
        d = sanitizeResume(existing.reactive);
        const previousLayout = JSON.stringify(d);
        flowResumeSections(d);
        dirty.current = previousLayout !== JSON.stringify(d);
        name = existing.title;
        documentId = existing.id;
        setSaveStatus(dirty.current ? "正在更新布局…" : "所有更改已保存");
      } else {
        const blank = params.has("new");
        d = blank ? newResume() : sampleResume();
        name = blank ? (kind === "cv" ? "未命名履历" : "未命名简历") : "示例简历";
        documentId = makeId();
        setSample(!blank);
        const template = params.get("template");
        if (template) {
          d = createTemplateResume(template, blank);
          name = `${reactiveTemplates.find(t => t.id === d.metadata.template)!.name} 简历`;
        }
        const example = examples.find((e) => e.slug === params.get("example"));
        if (example) {
          d = createRoleResume(example.slug, params.get("preset") === "blank");
          if (template) {
            const design = newResume(template);
            d.metadata.template = design.metadata.template;
            d.metadata.page.locale = design.metadata.page.locale;
            d.metadata.design.colors.primary = design.metadata.design.colors.primary;
          }
          name = `${roleLabels[example.slug] ?? example.title}简历`;
          setSample(params.get("preset") !== "blank");
        }
      }
      setData(d);
      setId(documentId);
      setTitle(name);
      setReady(true);
      if (params.has("id") && !existing)
        notify("找不到该文档，已打开一份新草稿。");
    } catch (e) {
      setFatal(
        "无法打开已保存的文档。原有数据仍保存在浏览器中，请导入有效的备份或返回「我的文档」。",
      );
      console.error(e);
    }
  }, [kind, notify]);
  useEffect(() => {
    if (!data || !ready) return;
    latest.current = { data, title, id };
    if (!dirty.current) return;
    setSaveStatus("正在保存…");
    const timer = setTimeout(() => {
      try {
        writeResume(data, id, title, kind);
        dirty.current = false;
        setSaveStatus("所有更改已保存");
        history.replaceState(
          null,
          "",
          `${location.pathname}?id=${encodeURIComponent(id)}`,
        );
      } catch {
        setSaveStatus("保存失败，请导出备份");
        notify(
          "浏览器存储不可用或空间不足，请导出 JSON 备份。",
        );
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [data, title, id, ready, kind, notify]);
  useEffect(() => {
    const flush = () => {
      if (!dirty.current || !latest.current) return;
      const v = latest.current;
      try {
        writeResume(v.data, v.id, v.title, kind);
        dirty.current = false;
      } catch {}
    };
    const leave = (e: BeforeUnloadEvent) => {
      flush();
      if (dirty.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", leave);
    return () => {
      flush();
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", leave);
    };
  }, [kind]);
  const update = (fn: (draft: ResumeData) => void, checkpoint = false) => {
    if (!data) return;
    const now = Date.now();
    if (checkpoint || now - snapshotTime.current > 650) {
      past.current.push(structuredClone(data));
      if (past.current.length > 50) past.current.shift();
      snapshotTime.current = now;
    }
    future.current = [];
    setHistoryCount(past.current.length);
    setFutureCount(0);
    const next = structuredClone(data);
    fn(next);
    dirty.current = true;
    setData(next);
  };
  const undo = () => {
    if (!data || !past.current.length) return;
    future.current.push(data);
    setData(past.current.pop()!);
    dirty.current = true;
    setHistoryCount(past.current.length);
    setFutureCount(future.current.length);
  };
  const redo = () => {
    if (!data || !future.current.length) return;
    past.current.push(data);
    setData(future.current.pop()!);
    dirty.current = true;
    setHistoryCount(past.current.length);
    setFutureCount(future.current.length);
  };
  const setTemplate = (template: string) => {
    update((d) => {
      // Use the same complete sample that generates the gallery thumbnail.
      Object.assign(d, createTemplateResume(template));
    }, true);
    setExpanded(null);
    setSample(true);
  };
  const onBlob = useCallback((v: Blob | null) => setBlob(v), []);
  const onStatus = useCallback((v: string) => setPreviewStatus(v), []);
  const fit = () => {
    if (canvas.current)
      setZoom(
        Math.max(
          25,
          Math.min(
            125,
            Math.round(((canvas.current.clientWidth - 72) / 794) * 100),
          ),
        ),
      );
  };
  useEffect(() => {
    if (ready) fit();
  }, [ready, leftOpen, rightOpen, mobile]);
  const saveFile = async (format: "pdf" | "json" | "txt" | "docx" | "md") => {
    if (!data) return;
    const filename = safeFilename(title);
    if (format === "docx") {
      try {
        const { createDocx } = await import("../../lib/docx-export");
        downloadBlob(await createDocx(data), filename + ".docx");
        notify("已开始下载 DOCX。");
      } catch {
        notify(
          "无法生成 Word 文件，请尝试导出 PDF 或 JSON。",
        );
      }
      return;
    }
    if (format === "pdf") {
      if (!blob) {
        notify("请等待预览更新后再下载。");
        return;
      }
      downloadBlob(blob, filename + ".pdf");
    } else if (format === "json")
      downloadBlob(
        new Blob(
          [
            JSON.stringify(
              { format: "resumv-reactive-v1", title, kind, data },
              null,
              2,
            ),
          ],
          { type: "application/json" },
        ),
        filename + ".json",
      );
    else if (format === "md")
      downloadBlob(
        new Blob([exportMarkdown(data)], { type: "text/markdown;charset=utf-8" }),
        filename + ".md",
      );
    else
      downloadBlob(
        new Blob([exportText(data)], { type: "text/plain;charset=utf-8" }),
        filename + ".txt",
      );
    notify(`已开始下载 ${format.toUpperCase()}。`);
  };
  const importFile = async (file: File) => {
    try {
      if (file.size > 5_000_000)
        throw Error("请选择小于 5 MB 的 JSON 文件。");
      const input = JSON.parse(await file.text());
      const imported = input.data?.basics
        ? sanitizeResume(input.data)
        : input.basics
          ? sanitizeResume(input)
          : null;
      if (!imported)
        throw Error(
          "不支持此文件，请选择 Reactive Resume 或 resumv 的 JSON 备份。",
        );
      const newId = makeId();
      const name = String(
        input.title || input.name || file.name.replace(/\.json$/i, ""),
      ).slice(0, 150);
      writeResume(imported, newId, name, kind);
      setId(newId);
      setTitle(name);
      setData(imported);
      setSample(false);
      past.current = [];
      future.current = [];
      setHistoryCount(0);
      setFutureCount(0);
      dirty.current = false;
      history.replaceState(null, "", `${location.pathname}?id=${newId}`);
      notify("已导入为新文档，原简历仍可在「我的文档」中打开。");
    } catch (e) {
      notify(
        e instanceof SyntaxError ? "JSON 文件格式无效。" : e instanceof Error ? e.message : "无法导入此文件。",
      );
    }
  };
  const photo = async (file: File) => {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 5_000_000) {
      notify("请选择小于 5 MB 的 PNG、JPG 或 WebP 图片。");
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const c = document.createElement("canvas");
      const scale = Math.min(1, 600 / Math.max(bitmap.width, bitmap.height));
      c.width = bitmap.width * scale;
      c.height = bitmap.height * scale;
      c.getContext("2d")!.drawImage(bitmap, 0, 0, c.width, c.height);
      const url = c.toDataURL("image/jpeg", 0.85);
      bitmap.close();
      update((d) => {
        d.picture.url = url;
        d.picture.hidden = false;
      }, true);
    } catch {
      notify("无法读取此图片。");
    }
  };
  if (fatal)
    return (
      <div className="builder-error">
        <h1>无法打开文档</h1>
        <p>{fatal}</p>
        <a href="/documents/">返回我的文档</a>
      </div>
    );
  if (!data)
    return (
      <div className="builder-loading">
        <LoaderCircle className="spin" />
        <p>正在打开编辑器…</p>
      </div>
    );
  const section =
    active === "summary"
      ? data.summary
      : active in data.sections
        ? data.sections[active as SectionKey]
        : data.customSections.find((s) => s.id === active);
  const custom =
    active !== "basics" && active !== "summary" && !(active in data.sections);
  const sectionTitle = sectionLabel(active, section);
  const changeSection = (d: ResumeData) =>
    active === "summary"
      ? d.summary
      : active in d.sections
        ? d.sections[active as SectionKey]
        : d.customSections.find((s) => s.id === active)!;
  const itemType = custom ? (section as any)?.type : active;
  const items =
    section && "items" in section
      ? (section.items as Record<string, any>[])
      : [];
  const editItem = (index: number, key: string, value: unknown) =>
    update((d) => {
      const s = changeSection(d) as any;
      s.items[index][key] = value;
    });
  const moveEntry = (entryId: string, slot: number) => {
    const from = items.findIndex((item) => item.id === entryId);
    const to = from < slot ? slot - 1 : slot;
    if (from < 0 || from === to || to < 0 || to >= items.length) return;
    update((draft) => {
      const list = (changeSection(draft) as { items: typeof items }).items;
      const [entry] = list.splice(from, 1);
      list.splice(to, 0, entry);
    }, true);
  };
  const moveSection = (sectionId: string, pageIndex: number, column: LayoutColumn, to: number) => {
    const pages = data.metadata.layout.pages;
    const fromPage = pages.findIndex((page) => page.main.includes(sectionId) || page.sidebar.includes(sectionId));
    if (fromPage === -1) return;
    const fromColumn = pages[fromPage].main.includes(sectionId) ? "main" : "sidebar";
    const from = pages[fromPage][fromColumn].indexOf(sectionId);
    const sameColumn = fromPage === pageIndex && fromColumn === column;
    const index = sameColumn && from < to ? to - 1 : to;
    if (sameColumn && from === index) return;
    update((draft) => {
      const pages = draft.metadata.layout.pages;
      pages[fromPage][fromColumn].splice(from, 1);
      pages[pageIndex][column].splice(index, 0, sectionId);
    }, true);
  };
  const sectionLinks = [
    "basics",
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
    "profiles",
    "languages",
    "certifications",
    "awards",
    "publications",
    "volunteer",
    "interests",
    "references",
    ...data.customSections.map((s) => s.id),
  ];
  return (
    <div
      className={`builder-app ${leftOpen ? "" : "left-closed"} ${rightOpen ? "" : "right-closed"}`}
      data-mobile={mobile}
    >
      <header className="builder-topbar">
        <div className="builder-identity">
          <a
            className="back-docs"
            href="/documents/"
            aria-label="返回我的文档"
          >
            <ArrowLeft size={19} />
          </a>
          <a className="builder-logo" href="/">
            resumv<span>.</span>
          </a>
          <span className="top-separator" />
          <input
            className="document-title-input"
            aria-label="文档名称"
            value={title}
            onChange={(e) => {
              dirty.current = true;
              setTitle(e.target.value);
            }}
          />
          <span className="saved-label">
            <Check size={13} />
            {saveStatus}
          </span>
        </div>
        <div className="builder-top-actions">
          <GitHubLink />
          <button
            title="撤销"
            aria-label="撤销"
            disabled={!historyCount}
            onClick={undo}
          >
            <Undo2 size={17} />
          </button>
          <button
            title="重做"
            aria-label="重做"
            disabled={!futureCount}
            onClick={redo}
          >
            <Redo2 size={17} />
          </button>
          <span className="top-separator" />
          <a
            className="builder-new"
            href="/builder/?new=1"
          >
            <Plus size={16} />
            新建
          </a>
          <div className="builder-download-group">
          <button
            className="builder-download"
            aria-label="下载 PDF"
            disabled={!blob}
            onClick={() => saveFile("pdf")}
          >
            <Download size={16} />
            <span>下载 PDF</span>
          </button>
          <button className="builder-download builder-download-toggle" popoverTarget="download-formats" aria-label="下载格式" title="更多下载格式">
            <ChevronDown size={16} />
          </button>
          <div id="download-formats" className="builder-download-menu" popover="auto">
            <p>选择下载格式</p>
            {([
              ["pdf", "PDF", ".pdf", "与预览版式一致"],
              ["docx", "Word", ".docx", "可编辑文档"],
              ["md", "Markdown", ".md", "带格式的纯文本"],
              ["json", "JSON", ".json", "备份内容与设计"],
            ] as const).map(([format, label, extension, description]) => (
              <button key={format} disabled={format === "pdf" && !blob} onClick={(event) => {
                event.currentTarget.closest<HTMLElement>("[popover]")?.hidePopover();
                void saveFile(format);
              }}>
                <FileText size={18} />
                <span><strong>{label} <small>{extension}</small></strong><small>{description}</small></span>
                {format === "pdf" && <span className="download-default">默认</span>}
              </button>
            ))}
          </div>
          </div>
        </div>
      </header>
      <div
        className="builder-mobile-tabs"
        role="tablist"
        aria-label="编辑器面板"
      >
        {[
          ["content", "内容"],
          ["preview", "预览"],
          ["design", "设计"],
        ].map(([value, label]) => (
          <button
            role="tab"
            aria-selected={mobile === value}
            key={value}
            className={mobile === value ? "active" : ""}
            onClick={() => {
              setMobile(value);
              if (value === "content") setLeftOpen(true);
              if (value === "design") setRightOpen(true);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="builder-workspace">
        <aside
          id="resume-content-panel"
          className="builder-left"
          aria-label="简历内容"
        >
          <div className="panel-heading">
            <div>
              <span className="panel-eyebrow">编辑简历</span>
              <h2>内容</h2>
            </div>
            <button
              className="desktop-only"
              aria-label="收起内容面板"
              onClick={() => setLeftOpen(false)}
            >
              <PanelLeftClose size={18} />
            </button>
          </div>
          <div className="content-panel-body">
            <div className="section-navigation">
              <button
                className="section-order-button"
                onClick={() => {
                  setRightOpen(true);
                  setSettings("layout");
                  setMobile("design");
                }}
              >
                <Columns2 size={16} />
                调整章节顺序
              </button>
              {sectionLinks.map((key) => {
                const s =
                  key === "summary"
                    ? data.summary
                    : key in data.sections
                      ? data.sections[key as SectionKey]
                      : data.customSections.find((s) => s.id === key);
                const I = icons[key] || FileText;
                const count = s && "items" in s ? s.items.length : 0;
                return (
                  <button
                    key={key}
                    className={`section-nav ${active === key ? "active" : ""}`}
                    onClick={() => {
                      setActive(key);
                      setExpanded(null);
                    }}
                  >
                    <I size={17} />
                    <span>
                      {sectionLabel(key, s)}
                    </span>
                    {s?.hidden ? (
                      <EyeOff size={13} />
                    ) : count > 0 ? (
                      <span className="section-count">{count}</span>
                    ) : null}
                    {active === key ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </button>
                );
              })}
              <button
                className="add-section-button"
                onClick={() => {
                  const sectionId = makeId();
                  update((d) => {
                    d.customSections.push({
                      id: sectionId,
                      type: "summary",
                      title: "自定义章节",
                      icon: "",
                      columns: 1,
                      hidden: false,
                      showHeading: true,
                      keepTogether: false,
                      startOnNewPage: false,
                      items: [{ id: makeId(), hidden: false, content: "" }],
                    });
                    d.metadata.layout.pages[0].main.push(sectionId);
                  }, true);
                  setActive(sectionId);
                }}
              >
                <Plus size={16} />
                添加自定义章节
              </button>
            </div>
            <div className="section-editor" key={active}>
              <div className="section-editor-heading">
                <h3>{sectionTitle}</h3>
                {active !== "basics" && (
                  <button
                    title={section?.hidden ? "显示章节" : "隐藏章节"}
                    aria-label={
                      section?.hidden ? "显示章节" : "隐藏章节"
                    }
                    onClick={() =>
                      update((d) => {
                        changeSection(d).hidden = !section?.hidden;
                      }, true)
                    }
                  >
                    {section?.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
              {active === "basics" ? (
                <>
                  <div className="photo-control">
                    <button
                      className="photo-upload"
                      aria-label="上传头像"
                      onClick={() => photoFile.current?.click()}
                    >
                      {data.picture.url ? (
                        <img src={data.picture.url} alt="头像" />
                      ) : (
                        <ImagePlus size={24} />
                      )}
                    </button>
                    <div>
                      <strong>头像</strong>
                      <p>选填 · JPG、PNG 或 WebP</p>
                      <button onClick={() => photoFile.current?.click()}>
                        上传照片
                      </button>
                      {data.picture.url && (
                        <button
                          onClick={() =>
                            update((d) => {
                              d.picture.url = "";
                            }, true)
                          }
                        >
                          移除
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    ref={photoFile}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    hidden
                    onChange={(e) => {
                      if (e.target.files?.[0]) void photo(e.target.files[0]);
                      e.target.value = "";
                    }}
                  />
                  {[
                    ["name", "姓名", "张晓"],
                    ["headline", "职业头衔", "资深产品设计师"],
                    ["email", "电子邮箱", "alex@example.com"],
                    ["phone", "电话", "+1 (415) 555-0128"],
                    ["location", "所在地", "广东省深圳市"],
                  ].map(([key, label, placeholder]) => (
                    <Field
                      key={key}
                      label={label}
                      value={String(
                        data.basics[key as keyof typeof data.basics] || "",
                      )}
                      placeholder={placeholder}
                      type={key === "email" ? "email" : "text"}
                      onChange={(value) =>
                        update((d) => {
                          (d.basics as any)[key] = value;
                        })
                      }
                    />
                  ))}
                  <Field
                    label="个人网站"
                    value={data.basics.website.url}
                    placeholder="https://yourportfolio.com"
                    onChange={(v) =>
                      update((d) => {
                        d.basics.website.url = v;
                      })
                    }
                  />
                  <Field
                    label="网站显示文字"
                    value={data.basics.website.label}
                    placeholder="yourportfolio.com"
                    onChange={(v) =>
                      update((d) => {
                        d.basics.website.label = v;
                      })
                    }
                  />
                  <div className="contact-links">
                    <h4>其他联系方式</h4>
                    {data.basics.customFields.map((field, index) => {
                      const label = field.icon === "github-logo" || /^https?:\/\/github\.com(?:\/|$)/i.test(field.link.trim())
                        ? "GitHub"
                        : `联系方式 ${index + 1}`;
                      return (
                        <div key={field.id} className="contact-link-fields">
                          <Field
                            label={`${label} 网址`}
                            type="url"
                            value={field.link}
                            placeholder={label === "GitHub" ? "https://github.com/username" : "https://example.com"}
                            onChange={(value) => update((draft) => {
                              const link = draft.basics.customFields[index];
                              const previousUrl = link.link.trim();
                              if (link.text === previousUrl || link.text === previousUrl.replace(/^https?:\/\//i, "")) {
                                link.text = "";
                              }
                              link.link = value;
                            })}
                          />
                          <Field
                            label={`${label} 显示文字（选填）`}
                            value={field.text}
                            onChange={(value) => update((draft) => {
                              draft.basics.customFields[index].text = value;
                            })}
                          />
                          <button
                            type="button"
                            className="remove-contact-link"
                            aria-label={`删除${label}`}
                            onClick={() => update((draft) => {
                              draft.basics.customFields.splice(index, 1);
                            }, true)}
                          >
                            <Trash2 size={14} /> 删除链接
                          </button>
                        </div>
                      );
                    })}
                    <button type="button" className="b-add" onClick={() => {
                      const id = makeId();
                      update((draft) => {
                        draft.basics.customFields.push({ id, icon: "link", text: "", link: "" });
                      }, true);
                    }}>
                      <Plus size={15} /> 添加联系方式
                    </button>
                  </div>
                  {data.picture.url && (
                    <>
                      <Range
                        label="照片尺寸"
                        value={data.picture.size}
                        min={32}
                        max={160}
                        suffix=" pt"
                        onChange={(v) =>
                          update((d) => {
                            d.picture.size = v;
                          })
                        }
                      />
                      <Range
                        label="照片圆角"
                        value={data.picture.borderRadius}
                        min={0}
                        max={100}
                        onChange={(v) =>
                          update((d) => {
                            d.picture.borderRadius = v;
                          })
                        }
                      />
                    </>
                  )}
                </>
              ) : (
                <>
                  <Field
                    label="章节标题"
                    value={section?.title || ""}
                    placeholder={sectionLabels[active]}
                    onChange={(value) =>
                      update((d) => {
                        changeSection(d).title = value;
                      })
                    }
                  />
                  {active === "summary" ? (
                    <>
                      <p className="b-hint">
                        简要介绍你的相关经历和擅长的领域。
                      </p>
                      <RichText
                        label="个人简介"
                        value={data.summary.content}
                        onChange={(value) =>
                          update((d) => {
                            d.summary.content = value;
                          })
                        }
                      />
                    </>
                  ) : (
                    <>
                      <div className="entry-list">
                        {items.map((item, i) => (
                          <div
                            key={item.id}
                            className={`entry-card ${item.hidden ? "entry-hidden" : ""}`}
                          >
                            <div
                              className="entry-bar"
                              data-reorder-row
                              {...entryDrag.dropTarget(item.id, item.id, (sourceId, edge) =>
                                moveEntry(sourceId, i + (edge === "after" ? 1 : 0)),
                              )}
                            >
                              {items.length > 1 && (
                                <span
                                  className="reorder-handle"
                                  title="拖动调整条目顺序"
                                  aria-hidden="true"
                                  {...entryDrag.handle(item.id)}
                                >
                                  <GripVertical size={15} />
                                </span>
                              )}
                              <button
                                className="entry-heading"
                                aria-expanded={expanded === item.id}
                                onClick={() =>
                                  setExpanded(
                                    expanded === item.id ? null : item.id,
                                  )
                                }
                              >
                                <span>
                                  <strong>
                                    {item.company ||
                                      item.school ||
                                      item.name ||
                                      item.title ||
                                      item.language ||
                                      item.network ||
                                      item.organization ||
                                      `条目 ${i + 1}`}
                                  </strong>
                                  <small>
                                    {item.position ||
                                      item.degree ||
                                      item.period ||
                                      item.proficiency ||
                                      item.fluency ||
                                      ""}
                                  </small>
                                </span>
                                {expanded === item.id ? (
                                  <ChevronDown size={15} />
                                ) : (
                                  <ChevronRight size={15} />
                                )}
                              </button>
                              {items.length > 1 && (
                                <div className="reorder-arrows">
                                  <button
                                    title="上移条目"
                                    aria-label={`上移条目 ${i + 1}`}
                                    disabled={i === 0}
                                    onClick={() => moveEntry(item.id, i - 1)}
                                  >
                                    <ArrowUp size={14} />
                                  </button>
                                  <button
                                    title="下移条目"
                                    aria-label={`下移条目 ${i + 1}`}
                                    disabled={i === items.length - 1}
                                    onClick={() => moveEntry(item.id, i + 2)}
                                  >
                                    <ArrowDown size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                            {expanded === item.id && (
                              <div className="entry-fields">
                                {(fields[itemType] || []).map(
                                  ([key, label]) => (
                                    <Field
                                      key={key}
                                      label={label}
                                      value={
                                        Array.isArray(item[key])
                                          ? item[key].join(", ")
                                          : item[key] || ""
                                      }
                                      onChange={(v) =>
                                        editItem(
                                          i,
                                          key,
                                          key === "keywords"
                                            ? v.split(/[,，]/).map((s) => s.trim())
                                            : v,
                                        )
                                      }
                                    />
                                  ),
                                )}
                                {itemType === "summary" ? (
                                  <RichText
                                    label="章节内容"
                                    value={item.content || ""}
                                    onChange={(v) => editItem(i, "content", v)}
                                  />
                                ) : null}
                                {hasDescription.has(itemType) && (
                                  <>
                                    <span className="b-label">描述</span>
                                    <RichText
                                      label={`${sectionTitle}描述`}
                                      value={item.description || ""}
                                      onChange={(v) =>
                                        editItem(i, "description", v)
                                      }
                                    />
                                  </>
                                )}
                                {item.website && (
                                  <Field
                                    label="链接"
                                    value={item.website.url}
                                    placeholder="https://"
                                    onChange={(v) =>
                                      editItem(i, "website", {
                                        ...item.website,
                                        url: v,
                                      })
                                    }
                                  />
                                )}
                                {["skills", "languages"].includes(itemType) && (
                                  <Range
                                    label="熟练度等级（0 为隐藏）"
                                    min={0}
                                    max={5}
                                    value={item.level || 0}
                                    onChange={(v) => editItem(i, "level", v)}
                                  />
                                )}
                                <div className="entry-actions">
                                  <button
                                    title="复制条目"
                                    aria-label="复制条目"
                                    onClick={() =>
                                      update((d) => {
                                        (changeSection(d) as any).items.splice(
                                          i + 1,
                                          0,
                                          {
                                            ...structuredClone(item),
                                            id: makeId(),
                                          },
                                        );
                                      }, true)
                                    }
                                  >
                                    <Copy size={14} />
                                  </button>
                                  <button
                                    title={
                                      item.hidden ? "显示条目" : "隐藏条目"
                                    }
                                    aria-label={
                                      item.hidden ? "显示条目" : "隐藏条目"
                                    }
                                    onClick={() =>
                                      editItem(i, "hidden", !item.hidden)
                                    }
                                  >
                                    {item.hidden ? (
                                      <EyeOff size={14} />
                                    ) : (
                                      <Eye size={14} />
                                    )}
                                  </button>
                                  <button
                                    className="delete-entry"
                                    title="删除条目"
                                    aria-label="删除条目"
                                    onClick={() => {
                                      update((d) => {
                                        (changeSection(d) as any).items.splice(
                                          i,
                                          1,
                                        );
                                      }, true);
                                      notify(
                                        "已删除条目，可以撤销恢复。",
                                      );
                                    }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        className="b-add"
                        onClick={() => {
                          const item = emptyItem(itemType);
                          update((d) => {
                            (changeSection(d) as any).items.push(item);
                          }, true);
                          setExpanded(item.id);
                        }}
                      >
                        <Plus size={15} />
                        {itemType === "summary" ? "添加文本块" : "添加条目"}
                      </button>
                    </>
                  )}
                  {custom && (
                    <button
                      className="remove-section"
                      onClick={() => {
                        update((d) => {
                          d.customSections = d.customSections.filter(
                            (s) => s.id !== active,
                          );
                          for (const p of d.metadata.layout.pages) {
                            p.main = p.main.filter((s) => s !== active);
                            p.sidebar = p.sidebar.filter((s) => s !== active);
                          }
                        }, true);
                        setActive("basics");
                        notify("已删除章节，可以撤销恢复。");
                      }}
                    >
                      <Trash2 size={14} />
                      删除章节
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="panel-footer">
            <span className="privacy-dot" /> 简历数据保存在当前浏览器。
          </div>
        </aside>
        <section
          className="builder-canvas"
          ref={canvas}
          aria-label="简历预览区"
        >
          <div className="canvas-top">
            {!leftOpen && (
              <div className="canvas-panel-toggles">
                <button
                  aria-label="展开内容面板"
                  aria-controls="resume-content-panel"
                  aria-expanded={leftOpen}
                  onClick={() => {
                    setLeftOpen(true);
                    setMobile("content");
                  }}
                >
                  <BookOpen size={17} />
                  <span>显示内容</span>
                </button>
              </div>
            )}
            <div className="canvas-breadcrumb">
              <FileText size={14} />
              <span>{title}</span>
              <span>/</span>
              <strong>
                {
                  reactiveTemplates.find((t) => t.id === data.metadata.template)
                    ?.name
                }
              </strong>
            </div>
            <div className="canvas-panel-toggles">
              {!rightOpen && (
                <button
                  aria-label="展开设计面板"
                  onClick={() => {
                    setRightOpen(true);
                    setMobile("design");
                  }}
                >
                  <Settings2 size={17} />
                  <span>显示设计</span>
                </button>
              )}
            </div>
          </div>
          {sample && (
            <div className="sample-banner">
              <Sparkles size={14} />
              <span>当前为英文示例，请替换为你的实际经历。</span>
              <a href="/builder/?new=1">
                从空白简历开始
              </a>
            </div>
          )}
          <div className="canvas-scroll">
            <div
              className="canvas-paper-width"
              style={{ width: `${previewWidth}px` }}
            >
              <ResumeCanvas data={data} width={previewWidth} onBlob={onBlob} onStatus={onStatus} />
            </div>
            <div className="canvas-end">
              已显示全部页面
            </div>
          </div>
          <div className="canvas-dock">
            <span className="dock-status">
              <span />
              {previewStatus}
            </span>
            <span className="dock-divider" />
            <button
              aria-label="缩小"
              onClick={() => setZoom((z) => Math.max(25, z - 10))}
            >
              <Minus size={16} />
            </button>
            <span className="zoom-label">{zoom}%</span>
            <button
              aria-label="放大"
              onClick={() => setZoom((z) => Math.min(150, z + 10))}
            >
              <Plus size={16} />
            </button>
            <span className="dock-divider" />
            <button
              aria-label="适应宽度"
              title="适应宽度"
              onClick={fit}
            >
              <Maximize size={16} />
            </button>
          </div>
        </section>
        <aside className="builder-right" aria-label="简历设计">
          <div className="panel-heading">
            <div>
              <span className="panel-eyebrow">设置版式</span>
              <h2>设计</h2>
            </div>
            <button
              className="desktop-only"
              aria-label="收起设计面板"
              onClick={() => setRightOpen(false)}
            >
              <PanelRightClose size={18} />
            </button>
          </div>
          <div
            className="design-tabs"
            role="tablist"
            aria-label="设计设置"
          >
            {[
              ["templates", LayoutTemplate, "模板"],
              ["typography", Type, "字体排版"],
              ["layout", Columns2, "布局"],
              ["design", Palette, "配色"],
              ["page", Settings2, "页面"],
              ["export", Download, "导出"],
            ].map(([key, Icon, label]) => {
              const I = Icon as typeof Type;
              return (
                <button
                  key={String(key)}
                  className={settings === key ? "active" : ""}
                  role="tab"
                  aria-selected={settings === key}
                  title={String(label)}
                  aria-label={String(label)}
                  onClick={() => setSettings(String(key))}
                >
                  <I size={17} />
                </button>
              );
            })}
          </div>
          <div className="design-panel-content">
            {settings === "templates" && (
              <>
                <div className="settings-title">
                  <h3>模板</h3>
                  <span>30 款模板 · 15 种版式，中英文各一份</span>
                </div>
                <p className="b-hint">选用模板会载入对应语言的示例内容和照片，点击撤销可恢复原简历。中文版是英文原版的独立副本。</p>
                <div className="builder-template-grid">
                  {reactiveTemplates.map((t) => (
                    <button
                      key={t.id}
                      className={`builder-template ${data.metadata.template === t.id ? "selected" : ""}`}
                      aria-label={`使用 ${t.name} 模板`}
                      aria-pressed={data.metadata.template === t.id}
                      onClick={() => setTemplate(t.id)}
                    >
                      <span className="template-thumb">
                        <img
                          src={`/templates/${t.previewId}.jpg`}
                          alt={`${t.name} 模板预览`}
                          loading="lazy"
                        />
                        {data.metadata.template === t.id && (
                          <span className="template-check">
                            <Check size={12} />
                          </span>
                        )}
                      </span>
                      <span>{t.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {settings === "typography" && (
              <>
                <h3>字体排版</h3>
                <p className="b-hint">设置正文和标题的字体、字号与行高。</p>
                {(["body", "heading"] as const).map((part) => (
                  <div className="settings-group" key={part}>
                    <h4>{part === "body" ? "正文" : "标题"}</h4>
                    <label className="b-field">
                      <span>字体</span>
                      <select
                        aria-label={part === "body" ? "正文字体" : "标题字体"}
                        value={data.metadata.typography[part].fontFamily}
                        onChange={(e) =>
                          update((d) => {
                            d.metadata.typography[part].fontFamily =
                              e.target.value;
                          }, true)
                        }
                      >
                        {["Lato", "Helvetica", "Times-Roman", "Courier"].map(
                          (font) => (
                            <option key={font}>{font}</option>
                          ),
                        )}
                      </select>
                    </label>
                    <Range
                      label={part === "body" ? "正文字号" : "标题字号"}
                      min={7}
                      max={part === "body" ? 16 : 24}
                      value={data.metadata.typography[part].fontSize}
                      suffix=" pt"
                      onChange={(v) =>
                        update((d) => {
                          d.metadata.typography[part].fontSize = v;
                        })
                      }
                    />
                    <Range
                      label={part === "body" ? "正文行高" : "标题行高"}
                      min={1}
                      max={2}
                      step={0.1}
                      value={data.metadata.typography[part].lineHeight}
                      onChange={(v) =>
                        update((d) => {
                          d.metadata.typography[part].lineHeight = v;
                        })
                      }
                    />
                  </div>
                ))}
              </>
            )}
            {settings === "design" && (
              <>
                <h3>配色</h3>
                <p className="b-hint">选择强调色，或自定义文字和纸张颜色。</p>
                <div className="color-palette">
                  {[
                    "#111827",
                    "#2563eb",
                    "#0e7490",
                    "#15803d",
                    "#7c3aed",
                    "#be123c",
                    "#b45309",
                    "#475569",
                  ].map((c) => (
                    <button
                      key={c}
                      aria-label={`设置强调色 ${c}`}
                      aria-pressed={data.metadata.design.colors.primary === c}
                      style={{ background: c }}
                      onClick={() =>
                        update((d) => {
                          d.metadata.design.colors.primary = c;
                        }, true)
                      }
                    >
                      {data.metadata.design.colors.primary === c && (
                        <Check size={16} />
                      )}
                    </button>
                  ))}
                </div>
                {[
                  ["primary", "强调色"],
                  ["text", "文字"],
                  ["background", "纸张"],
                ].map(([key, label]) => (
                  <label className="b-color-field" key={key}>
                    <span>{label}</span>
                    <input
                      aria-label={`${label}颜色`}
                      type="color"
                      value={
                        /^#[\da-f]{6}$/i.test(
                          data.metadata.design.colors[key as "primary"],
                        )
                          ? data.metadata.design.colors[key as "primary"]
                          : key === "background"
                            ? "#ffffff"
                            : "#111827"
                      }
                      onChange={(e) =>
                        update((d) => {
                          d.metadata.design.colors[key as "primary"] =
                            e.target.value;
                        })
                      }
                    />
                  </label>
                ))}
                <h4>技能等级标记</h4>
                <label className="b-field">
                  <span>标记样式</span>
                  <select
                    value={data.metadata.design.level.type}
                    onChange={(e) =>
                      update((d) => {
                        d.metadata.design.level.type = e.target.value as any;
                      }, true)
                    }
                  >
                    {[
                      ["hidden", "隐藏"],
                      ["circle", "圆形"],
                      ["square", "正方形"],
                      ["rectangle", "矩形"],
                      ["progress-bar", "进度条"],
                    ].map(([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            {settings === "page" && (
              <>
                <h3>页面</h3>
                <p className="b-hint">
                  预览与导出的 PDF 一致，包括分页位置。
                </p>
                <label className="b-field">
                  <span>纸张尺寸</span>
                  <select
                    value={data.metadata.page.format}
                    onChange={(e) =>
                      update((d) => {
                        d.metadata.page.format = e.target.value as
                          | "a4"
                          | "letter";
                      }, true)
                    }
                  >
                    <option value="a4">A4 · 210 × 297 mm</option>
                    <option value="letter">美国信纸（Letter）· 8.5 × 11 英寸</option>
                  </select>
                </label>
                <Range
                  label="左右页边距"
                  value={data.metadata.page.marginX}
                  min={12}
                  max={60}
                  suffix=" pt"
                  onChange={(v) =>
                    update((d) => {
                      d.metadata.page.marginX = v;
                    })
                  }
                />
                <Range
                  label="上下页边距"
                  value={data.metadata.page.marginY}
                  min={12}
                  max={60}
                  suffix=" pt"
                  onChange={(v) =>
                    update((d) => {
                      d.metadata.page.marginY = v;
                    })
                  }
                />
                <Range
                  label="条目间距"
                  value={data.metadata.page.gapY}
                  min={0}
                  max={18}
                  suffix=" pt"
                  onChange={(v) =>
                    update((d) => {
                      d.metadata.page.gapY = v;
                    })
                  }
                />
                <label className="b-checkbox">
                  <input
                    type="checkbox"
                    checked={!data.metadata.page.hideSectionIcons}
                    onChange={(e) =>
                      update((d) => {
                        d.metadata.page.hideSectionIcons = !e.target.checked;
                      }, true)
                    }
                  />
                  显示章节图标
                </label>
                <label className="b-checkbox">
                  <input
                    type="checkbox"
                    checked={!data.metadata.page.hideIcons}
                    onChange={(e) =>
                      update((d) => {
                        d.metadata.page.hideIcons = !e.target.checked;
                      }, true)
                    }
                  />
                  显示联系方式图标
                </label>
              </>
            )}
            {settings === "layout" && (
              <>
                <h3>布局</h3>
                <button className="b-button" onClick={() => update(d => flowResumeSections(d), true)}>
                  连续排版
                </button>
                <p className="b-hint">取消手动分页，让所有章节（含求职信）连续排版，页面排满后自动换页。</p>
                <p className="b-hint">
                  拖动手柄可调整章节顺序或移动到另一栏，也可以点击上下箭头排序。
                </p>
                <Range
                  label="侧栏宽度"
                  min={20}
                  max={45}
                  suffix="%"
                  value={data.metadata.layout.sidebarWidth}
                  onChange={(v) =>
                    update((d) => {
                      d.metadata.layout.sidebarWidth = v;
                    })
                  }
                />
                {data.metadata.layout.pages.map((page, pi) => (
                  <div className="layout-page" key={pi}>
                    <h4>第 {pi + 1} 组页面布局</h4>
                    <label className="b-checkbox">
                      <input
                        type="checkbox"
                        checked={page.fullWidth}
                        onChange={(e) =>
                          update((d) => {
                            const p = d.metadata.layout.pages[pi];
                            p.fullWidth = e.target.checked;
                            if (p.fullWidth) {
                              p.main.push(...p.sidebar);
                              p.sidebar = [];
                            }
                          }, true)
                        }
                      />
                      单栏排版
                    </label>
                    {(["main", "sidebar"] as const)
                      .filter((col) => !page.fullWidth || col === "main")
                      .map((col) => (
                        <div
                          className="layout-column"
                          key={col}
                          {...sectionDrag.dropTarget(`${pi}:${col}`, undefined, (sourceId) =>
                            moveSection(sourceId, pi, col, page[col].length),
                          )}
                        >
                          <h5>{col === "main" ? "主栏" : "侧栏"}</h5>
                          {page[col].map((sid, index) => {
                            const s =
                              sid === "summary"
                                ? data.summary
                                : sid in data.sections
                                  ? data.sections[sid as SectionKey]
                                  : data.customSections.find(
                                      (x) => x.id === sid,
                                    );
                            const label = sectionLabel(sid, s);
                            const otherColumn = col === "main" ? "sidebar" : "main";
                            return (
                              <div
                                className="layout-row"
                                key={sid}
                                data-reorder-row
                                {...sectionDrag.dropTarget(sid, sid, (sourceId, edge) =>
                                  moveSection(sourceId, pi, col, index + (edge === "after" ? 1 : 0)),
                                )}
                              >
                                <span
                                  className="reorder-handle"
                                  title="拖动调整章节顺序"
                                  aria-hidden="true"
                                  {...sectionDrag.handle(sid)}
                                >
                                  <GripVertical size={15} />
                                </span>
                                <span className="layout-row-title">{label}</span>
                                <div className="reorder-arrows">
                                  <button
                                    title="上移章节"
                                    aria-label={`上移${label}`}
                                    disabled={index === 0}
                                    onClick={() => moveSection(sid, pi, col, index - 1)}
                                  >
                                    <ArrowUp size={14} />
                                  </button>
                                  <button
                                    title="下移章节"
                                    aria-label={`下移${label}`}
                                    disabled={index === page[col].length - 1}
                                    onClick={() => moveSection(sid, pi, col, index + 2)}
                                  >
                                    <ArrowDown size={14} />
                                  </button>
                                </div>
                                {!page.fullWidth && (
                                  <button
                                    title="移至另一栏"
                                    aria-label={`将${label}移到${otherColumn === "sidebar" ? "侧栏" : "主栏"}`}
                                    onClick={() => moveSection(sid, pi, otherColumn, page[otherColumn].length)}
                                  >
                                    <Columns2 size={14} />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                  </div>
                ))}
              </>
            )}
            {settings === "export" && (
              <>
                <h3>导出与导入</h3>
                <p className="b-hint">下载简历或导入备份。</p>
                <button
                  className="export-option"
                  disabled={!blob}
                  onClick={() => saveFile("pdf")}
                >
                  <FileText size={21} />
                  <span>
                    <strong>下载 PDF</strong>
                    <small>保留预览中的版式。</small>
                  </span>
                  <Download size={16} />
                </button>
                <button
                  className="export-option"
                  onClick={() => saveFile("docx")}
                >
                  <FileText size={21} />
                  <span>
                    <strong>下载 Word（.docx）</strong>
                    <small>
                      保留主栏和侧栏，可在 Word 中编辑。
                    </small>
                  </span>
                  <Download size={16} />
                </button>
                <button
                  className="export-option"
                  onClick={() => saveFile("json")}
                >
                  <FileText size={21} />
                  <span>
                    <strong>导出 JSON 备份</strong>
                    <small>包含全部内容、布局与设计设置。</small>
                  </span>
                  <Download size={16} />
                </button>
                <button
                  className="export-option"
                  onClick={() => saveFile("md")}
                >
                  <FileText size={21} />
                  <span>
                    <strong>下载 Markdown（.md）</strong>
                    <small>保留标题、列表和链接的文本文件。</small>
                  </span>
                  <Download size={16} />
                </button>
                <button
                  className="export-option"
                  onClick={() => inputFile.current?.click()}
                >
                  <Upload size={21} />
                  <span>
                    <strong>导入 JSON</strong>
                    <small>支持 Reactive Resume 和 resumv 的备份文件。</small>
                  </span>
                  <Plus size={16} />
                </button>
                <p className="b-hint">
                  导入 JSON 会创建新文档。此处支持 JSON 备份。
                </p>
              </>
            )}
          </div>
          <div className="template-attribution">
            <a href="/licenses/">模板来自 Reactive Resume ↗</a>
            <span>开源 · MIT 许可</span>
          </div>
        </aside>
      </div>
      <input
        ref={inputFile}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => {
          if (e.target.files?.[0]) void importFile(e.target.files[0]);
          e.target.value = "";
        }}
      />
      <ProjectFooter />
      {message && (
        <div className="builder-toast" role="status">
          {message}
          <button
            aria-label="关闭通知"
            onClick={() => setMessage("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

