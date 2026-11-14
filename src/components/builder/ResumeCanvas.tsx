import { useEffect, useRef, useState } from "react";
import type { ResumeData } from "../../lib/resume-model";
import { exportText, getResumeContactLinks } from "../../lib/resume-model";
import { LoaderCircle, AlertCircle } from "lucide-react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
let queue: Promise<unknown> = Promise.resolve();
export function renderPdf(data: ResumeData): Promise<Blob> {
  const job = queue
    .catch(() => {})
    .then(async () => {
      const { createResumePdfBlob } = await import(
        "../../vendor/reactive-resume/pdf/browser"
      );
      return createResumePdfBlob({
        data: { ...data, basics: { ...data.basics, customFields: getResumeContactLinks(data) } },
      });
    });
  queue = job;
  return job;
}
export default function ResumeCanvas({
  data,
  width,
  onBlob,
  onStatus,
}: {
  data: ResumeData;
  width: number;
  onBlob: (blob: Blob | null) => void;
  onStatus: (status: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [preview, setPreview] = useState<{ data: ResumeData; blob: Blob; pdf: PDFDocumentProxy }>();
  const [pixelRatio, setPixelRatio] = useState(() => window.devicePixelRatio || 1);
  const onBlobRef = useRef(onBlob);
  const onStatusRef = useRef(onStatus);
  onBlobRef.current = onBlob;
  onStatusRef.current = onStatus;

  useEffect(() => {
    const resolution = window.matchMedia(`(resolution: ${pixelRatio}dppx)`);
    const update = () => setPixelRatio(window.devicePixelRatio || 1);
    resolution.addEventListener("change", update);
    return () => resolution.removeEventListener("change", update);
  }, [pixelRatio]);

  function reportError(error: unknown) {
    console.error("Resume rendering failed", error);
    setError("The preview could not be generated. Check your content or choose another template.");
    onStatusRef.current("Preview unavailable");
    setBusy(false);
  }

  useEffect(() => {
    let disposed = false;
    setBusy(true);
    setError("");
    onBlobRef.current(null);
    onStatusRef.current("Updating preview");
    let loadingTask: PDFDocumentLoadingTask | undefined;
    const timeout = setTimeout(async () => {
      try {
        const blob = await renderPdf(structuredClone(data));
        if (disposed) return;
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        const bytes = await blob.arrayBuffer();
        if (disposed) return;
        loadingTask = pdfjs.getDocument({
          data: bytes,
          useSystemFonts: true,
        });
        const pdf = await loadingTask.promise;
        if (!disposed) setPreview({ data, blob, pdf });
      } catch (error) {
        if (!disposed) reportError(error);
      }
    }, 450);
    return () => {
      disposed = true;
      clearTimeout(timeout);
      void loadingTask?.destroy();
    };
  }, [data]);

  useEffect(() => {
    if (preview?.data !== data) return;
    const { blob, pdf } = preview;
    let disposed = false;
    let renderTask: RenderTask | undefined;

    async function paintPages() {
      try {
        const fragment = document.createDocumentFragment();
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          if (disposed) return;
          const pageSize = page.getViewport({ scale: 1 });
          // Keep high-DPI and long free-form pages within browser canvas limits.
          const scale = Math.min(
            (width * pixelRatio) / pageSize.width,
            4096 / Math.max(pageSize.width, pageSize.height),
          );
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          canvas.setAttribute("role", "img");
          canvas.setAttribute("aria-label", `Resume preview, page ${i}`);
          renderTask = page.render({ canvas, viewport });
          await renderTask.promise;
          const wrap = document.createElement("div");
          wrap.className = "resume-sheet";
          wrap.append(canvas);
          const label = document.createElement("span");
          label.className = "sheet-page-number";
          label.textContent = `Page ${i} of ${pdf.numPages}`;
          wrap.append(label);
          fragment.append(wrap);
        }
        if (disposed) return;
        container.current?.replaceChildren(fragment);
        container.current?.setAttribute(
          "data-rendered-template",
          data.metadata.template,
        );
        onBlobRef.current(blob);
        onStatusRef.current(
          `${pdf.numPages} ${pdf.numPages === 1 ? "page" : "pages"}`,
        );
        setError("");
        setBusy(false);
      } catch (error) {
        if (!disposed) reportError(error);
      }
    }

    void paintPages();
    return () => {
      disposed = true;
      renderTask?.cancel();
    };
  }, [data, preview, width, pixelRatio]);
  return (
    <>
      <div className="canvas-render-status" role="status">
        {busy && (
          <>
            <LoaderCircle size={14} className="spin" /> Updating preview…
          </>
        )}
      </div>
      {error && (
        <div className="render-error" role="alert">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      <div ref={container} className="pdf-pages" aria-busy={busy} />
      <div className="sr-only" aria-label="Resume text">
        {exportText(data)}
      </div>
    </>
  );
}
