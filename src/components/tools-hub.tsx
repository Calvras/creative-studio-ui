import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
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

export function ToolsHub({
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setCategory("All");
    window.setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  const results = useMemo(() => {
    const searched = query.trim() ? searchTools(query) : EDITOR_TOOLS;
    return category === "All" ? searched : searched.filter((tool) => tool.category === category);
  }, [query, category]);

  if (!open) return null;

  function pick(tool: EditorTool) {
    onPick(tool);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-phone text-ink"
      role="dialog"
      aria-modal="true"
      aria-label="All editing tools"
    >
      <div
        className="px-5 pb-2"
        style={{ paddingTop: "max(1rem, calc(env(safe-area-inset-top) + 0.6rem))" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl leading-tight">ALL TOOLS</h1>
            <p className="mt-1 text-[11px] text-ink-dim">
              Everything the editor can do, with a tip on how to use it.
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface text-ink"
            aria-label="Close tools"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-surface/80 px-3.5 py-3">
          <Search className="h-4 w-4 shrink-0 text-ink-dim" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tools — split, volume, filter…"
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
      </div>

      <div className="flex gap-2 overflow-x-auto px-5 py-2 [scrollbar-width:none]">
        {CATEGORIES.map((item) => (
          <button
            key={item}
            onClick={() => setCategory(item)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs transition ${
              category === item ? "bg-brand font-semibold text-sky-ink" : "bg-surface text-ink-dim"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8 [scrollbar-width:none]">
        {results.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-sm font-semibold">No tool matches “{query}”</p>
            <p className="mt-1 text-xs text-ink-dim">
              Try “cut”, “volume”, “text”, “color” or “rotate”.
            </p>
          </div>
        )}

        {category === "All" && !query.trim() ? (
          CATEGORIES.filter((item): item is ToolCategory => item !== "All").map((group) => {
            const tools = results.filter((tool) => tool.category === group);
            if (tools.length === 0) return null;
            return (
              <section key={group} className="mt-4 first:mt-1">
                <div className="mb-2 flex items-center gap-2">
                  <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-dim">
                    {group}
                  </h2>
                  <span className="text-[10px] text-ink-dim/60">{tools.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {tools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} hasClip={hasClip} onPick={pick} />
                  ))}
                </div>
              </section>
            );
          })
        ) : (
          <div className="mt-2 grid grid-cols-2 gap-2.5">
            {results.map((tool) => (
              <ToolCard key={tool.id} tool={tool} hasClip={hasClip} onPick={pick} />
            ))}
          </div>
        )}

        <p className="mt-6 text-center text-[10px] leading-relaxed text-ink-dim">
          {hint ?? "Pick a tool, then add media to use it. Nothing leaves your device."}
        </p>
      </div>
    </div>
  );
}

function ToolCard({
  tool,
  hasClip,
  onPick,
}: {
  tool: EditorTool;
  hasClip: boolean;
  onPick: (tool: EditorTool) => void;
}) {
  const Icon = tool.icon;
  return (
    <button
      onClick={() => onPick(tool)}
      className="flex min-h-[152px] w-full flex-col rounded-3xl bg-surface p-4 text-left transition active:scale-[0.98] hover:bg-surface-2"
    >
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand/15 text-brand">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
      </span>
      <span className="mt-3 text-[13px] font-semibold leading-tight">{tool.label}</span>
      <span className="mt-1 line-clamp-2 text-[10px] leading-snug text-ink-dim">
        {tool.summary}
      </span>
      <span className="mt-auto pt-2 text-[9px] leading-snug text-brand/90">{tool.how}</span>
      {tool.needsClip && !hasClip && (
        <span className="mt-1.5 self-start rounded-full bg-amber-500/15 px-2 py-0.5 text-[8px] font-medium text-amber-400">
          Needs a clip
        </span>
      )}
    </button>
  );
}
