import { useEffect, useRef } from "react";
import { Bold, Italic, List, ListOrdered, Underline } from "lucide-react";
import { cleanHtml } from "../../lib/resume-model";
export default function RichText({
  value,
  onChange,
  label = "描述",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (
      ref.current &&
      document.activeElement !== ref.current &&
      ref.current.innerHTML !== value
    )
      ref.current.innerHTML = cleanHtml(value);
  }, [value]);
  const update = () => onChange(cleanHtml(ref.current?.innerHTML || ""));
  const command = (cmd: string) => {
    ref.current?.focus();
    document.execCommand(cmd);
    update();
  };
  return (
    <div className="rich-text">
      <div
        className="rich-toolbar"
        role="toolbar"
        aria-label={`${label}格式工具栏`}
      >
        {[
          ["bold", Bold, "加粗"],
          ["italic", Italic, "斜体"],
          ["underline", Underline, "下划线"],
          ["insertUnorderedList", List, "无序列表"],
          ["insertOrderedList", ListOrdered, "编号列表"],
        ].map(([cmd, Icon, title]) => {
          const I = Icon as typeof Bold;
          return (
            <button
              key={String(cmd)}
              type="button"
              title={String(title)}
              aria-label={String(title)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => command(String(cmd))}
            >
              <I size={15} />
            </button>
          );
        })}
      </div>
      <div
        ref={ref}
        role="textbox"
        aria-label={label}
        aria-multiline="true"
        className="rich-content"
        contentEditable
        suppressContentEditableWarning
        onInput={update}
        onPaste={(e) => {
          e.preventDefault();
          document.execCommand(
            "insertText",
            false,
            e.clipboardData.getData("text/plain"),
          );
          update();
        }}
      />
    </div>
  );
}
