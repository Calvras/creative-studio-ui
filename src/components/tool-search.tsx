import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, CornerDownLeft } from "lucide-react";
import { EDITOR_TOOLS, searchTools, type EditorTool, type ToolCategory } from "@/lib/tool-registry";

const CATEGORIES: Array<"All" | ToolCategory> = [
  "All",
  "Timeline",
  "Audio",
  "Text",
  "Color",
  "Transform",
  "Canvas",
  "Project",
];

export function ToolSearch({
  open,
  onClose,
  onPick,
  hasClip = false,
  hint,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (tool: EditorTool) => void;
  hasClip?: boolean;
  hint?: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCategory("All");
      setCursor(0);
      window.setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  const results = useMemo(() => {
    const searched = query.trim() ? searchTools(query) : EDITOR_TOOLS;
    return category === "All" ? searched : searched.filter((tool) => tool.category === category);
  }, [query, category]);

  useEffect(() => {
    setCursor((value) => Math.min(value, Math.max(0, results.length - 1)));
  }, [results.length]);

  if (!open) return null;

  function pick(tool: EditorTool) {
    onPick(tool);
    onClose();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      onClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((value) => Math.min(results.length - 1, value + 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((value) => Math.max(0, value - 1));
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const tool = results[cursor];
      if (tool) pick(tool);
    }
  }

  const grouped = category === "All" && !query.trim();

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-phone text-ink"
      role="dialog"
      aria-modal="true"
      aria-label="Search editing tools"
    >
      <div
        className="flex items-center gap-3 border-b border-ink/5 px-4 pb-3"
        style={{ paddingTop: "max(0.75rem, calc(env(safe-area-inset-top) + 0.5rem))" }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-surface-2 px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-ink-dim" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search tools — split, filter, speed…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-dim"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search" className="text-ink-dim">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-full border border-surface-2 px-3 py-2 text-xs text-ink-dim"
        >
          Cancel
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none]">
        {CATEGORIES.map((item) => (
          <button
            key={item}
            onClick={() => setCategory(item)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs transition ${
              category === item ? "bg-brand text-sky-ink" : "bg-surface-2 text-ink-dim"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 [scrollbar-width:none]">
        {results.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold">No tool matches “{query}”</p>
            <p className="mt-1 text-xs text-ink-dim">
              Try “cut”, “volume”, “text”, “color” or “rotate”.
            </p>
          </div>
        )}

        {grouped ? (
          CATEGORIES.filter((item): item is ToolCategory => item !== "All").map((group) => {
            const tools = results.filter((tool) => tool.category === group);
            if (tools.length === 0) return null;
            return (
              <section key={group} className="mb-5">
                <h3 className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-dim">
                  {group}
                </h3>
                <div className="overflow-hidden rounded-2xl bg-surface">
                  {tools.map((tool) => {
                    const index = results.indexOf(tool);
                    return (
                      <ToolRow
                        key={tool.id}
                        tool={tool}
                        active={index === cursor}
                        hasClip={hasClip}
                        onPick={pick}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })
        ) : (
          <div className="overflow-hidden rounded-2xl bg-surface">
            {results.map((tool, index) => (
              <ToolRow
                key={tool.id}
                tool={tool}
                active={index === cursor}
                hasClip={hasClip}
                onPick={pick}
              />
            ))}
          </div>
        )}
      </div>

      <div
        className="flex items-center justify-between gap-3 border-t border-ink/5 px-5 pt-2.5 text-[10px] text-ink-dim"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <span>{hint ?? "Tap a tool to open it. Every tool explains how it works."}</span>
        <span className="hidden items-center gap-1 sm:flex">
          <kbd className="rounded border border-ink/15 px-1.5 py-0.5">↵</kbd>
          <CornerDownLeft className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}

function ToolRow({
  tool,
  active,
  hasClip,
  onPick,
}: {
  tool: EditorTool;
  active: boolean;
  hasClip: boolean;
  onPick: (tool: EditorTool) => void;
}) {
  const Icon = tool.icon;
  return (
    <button
      onClick={() => onPick(tool)}
      className={`flex w-full items-start gap-3 border-b border-ink/5 px-4 py-3 text-left transition last:border-0 ${
        active ? "bg-surface-2" : "hover:bg-surface-2/60"
      }`}
    >
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-medium">{tool.label}</span>
          <span className="text-[9px] uppercase tracking-wider text-ink-dim">{tool.category}</span>
          {tool.needsClip && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[8px] ${hasClip ? "bg-surface-2 text-ink-dim" : "bg-amber-500/15 text-amber-400"}`}
            >
              {hasClip ? "clip" : "select a clip"}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-ink-dim">{tool.summary}</span>
        <span className="mt-1 block text-[10px] leading-snug text-brand/90">{tool.how}</span>
      </span>
    </button>
  );
}
