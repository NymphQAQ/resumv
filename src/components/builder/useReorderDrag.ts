import { useRef, useState } from "react";
import type { DragEvent } from "react";

type Edge = "before" | "after";

export function useReorderDrag(scope: string) {
  const source = useRef<{ id: string; scope: string } | null>(null);
  const [target, setTarget] = useState<{ key: string; edge: Edge } | null>(null);

  function clear() {
    source.current = null;
    setTarget(null);
  }

  function handle(id: string) {
    return {
      draggable: true,
      onDragStart(event: DragEvent<HTMLElement>) {
        source.current = { id, scope };
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("application/x-resumv-reorder", id);
        const row = event.currentTarget.closest("[data-reorder-row]");
        if (row) event.dataTransfer.setDragImage(row, 12, 12);
      },
      onDragEnd: clear,
    };
  }

  function dropTarget(key: string, id: string | undefined, move: (sourceId: string, edge: Edge) => void) {
    function edgeAt(event: DragEvent<HTMLElement>): Edge {
      if (!id) return "after";
      const { top, height } = event.currentTarget.getBoundingClientRect();
      return event.clientY < top + height / 2 ? "before" : "after";
    }

    return {
      "data-drop-edge": target?.key === key ? target.edge : undefined,
      onDragOver(event: DragEvent<HTMLElement>) {
        if (source.current?.scope !== scope) return;
        event.stopPropagation();
        event.preventDefault();
        if (source.current.id === id) {
          event.dataTransfer.dropEffect = "none";
          setTarget(null);
          return;
        }
        event.dataTransfer.dropEffect = "move";
        const edge = edgeAt(event);
        setTarget((current) => current?.key === key && current.edge === edge ? current : { key, edge });
      },
      onDragLeave(event: DragEvent<HTMLElement>) {
        if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
        setTarget((current) => current?.key === key ? null : current);
      },
      onDrop(event: DragEvent<HTMLElement>) {
        const dragged = source.current;
        if (dragged?.scope !== scope) return;
        event.stopPropagation();
        event.preventDefault();
        clear();
        if (dragged.id !== id) move(dragged.id, edgeAt(event));
      },
    };
  }

  return { handle, dropTarget };
}
