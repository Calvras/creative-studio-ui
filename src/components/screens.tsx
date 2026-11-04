import { Link } from "@tanstack/react-router";
import { BottomNav } from "@/components/bottom-nav";
import { useState, useRef, useEffect } from "react";
import {
  Star, Wand2, ImageIcon, Film, MoreHorizontal, Plus, Calendar, Clock, HardDrive,
  ArrowLeft, Music, Image as Img, Redo2, Undo2,
  RotateCw, TimerOff, Play, Pause, Scissors, Disc3, Type, ScanLine, Sparkles, Moon,
  Maximize, Shuffle, X,
} from "lucide-react";
import car from "@/assets/car.jpg";
import {
  PROJECTS,
  MORE_TOOLS,
  PROJECT_MENU_ACTIONS,
  type ProjectMenuAction,
  type Project,
} from "@/data/app-data";

// ─── More Options Bottom Sheet ───────────────────────────────────────────────

function MoreOptionsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Close on backdrop click or Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end" aria-modal="true" role="dialog">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      {/* sheet */}
      <div className="relative z-10 rounded-t-3xl bg-surface pb-10 pt-5 px-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base">More tools</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-surface-2"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {MORE_TOOLS.map((t) => (
            <button
              key={t.label}
              className="flex flex-col items-center gap-2 rounded-2xl bg-surface-2 px-2 py-4 text-center transition hover:bg-surface-2/80 active:scale-95"
            >
              <span className="text-2xl leading-none">{t.emoji}</span>
              <span className="text-[10px] leading-tight text-ink">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Project 3-dot dropdown ───────────────────────────────────────────────────

function ProjectMenu({
  project,
  onAction,
}: {
  project: Project;
  onAction: (action: ProjectMenuAction, project: Project) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
        className="grid h-6 w-6 place-items-center rounded-full bg-surface-2 transition hover:bg-surface"
        aria-label="Project options"
        aria-expanded={open}
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 min-w-[140px] overflow-hidden rounded-2xl bg-surface-2 shadow-lg">
          {PROJECT_MENU_ACTIONS.map((action) => (
            <button
              key={action}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
                onAction(action, project);
              }}
              className={`block w-full px-4 py-3 text-left text-xs transition hover:bg-surface ${
                action === "Delete" ? "text-red-400" : "text-ink"
              }`}
            >
              {action}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main tools row (top 4 icons) ─────────────────────────────────────────────

const MAIN_TOOLS = [
  { icon: Wand2,          label: "AI editor" },
  { icon: ImageIcon,      label: "Photo editor" },
  { icon: Film,           label: "Video editor" },
  { icon: MoreHorizontal, label: "More options" },
] as const;

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export function HomeScreen() {
  const [moreOpen, setMoreOpen] = useState(false);
  const [projects, setProjects] = useState(PROJECTS);

  function handleProjectAction(action: ProjectMenuAction, project: Project) {
    if (action === "Delete") {
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
    } else if (action === "Duplicate") {
      setProjects((prev) => {
        const idx = prev.findIndex((p) => p.id === project.id);
        const copy: Project = { ...project, id: `${project.id}-copy-${Date.now()}`, title: `${project.title} (copy)` };
        const next = [...prev];
        next.splice(idx + 1, 0, copy);
        return next;
      });
    } else if (action === "Rename") {
      const newTitle = window.prompt("New name", project.title);
      if (newTitle?.trim()) {
        setProjects((prev) => prev.map((p) => p.id === project.id ? { ...p, title: newTitle.trim() } : p));
      }
    } else if (action === "Export") {
      // In a real app this would trigger an export flow
      alert(`Exporting "${project.title}"…`);
    }
  }

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-phone text-ink">
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-24 [scrollbar-width:none]">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl">EDIT+</h1>
          <Link
            to="/premium"
            className="flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-medium"
          >
            <Star className="h-3.5 w-3.5 fill-ink" /> Get premium
          </Link>
        </div>

        {/* Tool icons */}
        <div className="mt-5 grid grid-cols-4 gap-3">
          {MAIN_TOOLS.map((t) => (
            <button
              key={t.label}
              onClick={t.label === "More options" ? () => setMoreOpen(true) : undefined}
              className="flex flex-col items-center gap-2"
            >
              <div className="grid aspect-square w-full place-items-center rounded-2xl bg-surface transition hover:bg-surface-2 active:scale-95">
                <t.icon className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <span className="text-[10px] text-ink">{t.label}</span>
            </button>
          ))}
        </div>

        {/* New Project banner */}
        <div className="mt-5 flex items-center justify-between rounded-3xl bg-sky p-4 text-sky-ink">
          <div>
            <h2 className="font-display text-xl">NEW PROJECT</h2>
            <p className="mt-1 text-xs">
              <b>Trial version</b>{" "}
              <span className="opacity-70">2 projects left</span>
            </p>
            <span className="mt-3 inline-block rounded-full bg-brand px-4 py-1.5 text-xs font-medium">
              Version 3.0
            </span>
          </div>
          <button className="grid h-20 w-20 place-items-center rounded-full border-2 border-dashed border-sky-ink/60">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-sky-ink text-sky">
              <Plus className="h-4 w-4" />
            </span>
          </button>
        </div>

        {/* Projects list */}
        <div className="mt-6 flex items-center justify-between">
          <h2 className="font-display text-lg">PROJECTS</h2>
          <Link
            to="/settings"
            className="rounded-full border border-ink/70 px-3 py-1 text-xs"
          >
            Settings
          </Link>
        </div>

        <div className="mt-3 space-y-2">
          {projects.length === 0 && (
            <p className="py-8 text-center text-sm text-ink-dim">No projects yet.</p>
          )}
          {projects.map((p) => (
            <Link
              key={p.id}
              to={p.id === "proj-981" ? "/editor" : "/"}
              className="flex gap-3 rounded-xl bg-surface pr-3 transition hover:bg-surface-2"
            >
              <img
                src={p.img}
                alt={p.title}
                loading="lazy"
                className="h-20 w-20 rounded-l-xl object-cover"
              />
              <div className="flex flex-1 flex-col py-2">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold">{p.title}</p>
                  <ProjectMenu project={p} onAction={handleProjectAction} />
                </div>
                <p className="text-[11px] text-ink-dim">{p.sub}</p>
                <div className="mt-3 flex gap-3 text-[9px] text-ink-dim">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" />{p.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />{p.dur}
                  </span>
                  <span className="flex items-center gap-1">
                    <HardDrive className="h-2.5 w-2.5" />{p.size}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <BottomNav />

      {/* More Options bottom sheet — rendered inside the phone frame */}
      <MoreOptionsSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </div>
  );
}

// ─── Editor screen ────────────────────────────────────────────────────────────

const EDIT_TOOLS = [
  { icon: Scissors, label: "Split" },
  { icon: Disc3,    label: "Audio" },
  { icon: Type,     label: "Text" },
  { icon: ScanLine, label: "Animate" },
  { icon: Sparkles, label: "Effects" },
  { icon: Moon,     label: "Stickers" },
] as const;

export function EditorScreen() {
  const [playing, setPlaying]   = useState(false);
  const [active, setActive]     = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef                 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const bars = Array.from({ length: 70 }, (_, i) =>
    20 + Math.abs(Math.sin(i * 1.7) * 60 + Math.cos(i * 0.6) * 20)
  );

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-phone text-ink">

      {/* Top bar */}
      <div className="mt-3 flex items-center gap-3 px-4">
        <Link to="/"><ArrowLeft className="h-5 w-5" /></Link>
        <span className="flex-1 text-xs">Vlog city lifestyle | 4:3</span>
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="grid h-7 w-7 place-items-center rounded-full bg-surface-2"
            aria-label="Editor options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-30 min-w-[140px] overflow-hidden rounded-2xl bg-surface-2 shadow-lg">
              {["Save draft", "Export settings", "Share", "Delete"].map((item) => (
                <button
                  key={item}
                  onClick={() => setMenuOpen(false)}
                  className={`block w-full px-4 py-3 text-left text-xs transition hover:bg-surface ${
                    item === "Delete" ? "text-red-400" : "text-ink"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="rounded-full bg-brand-dark px-4 py-1.5 text-xs font-medium text-brand">
          Export
        </button>
      </div>

      {/* Preview */}
      <div className="relative mx-auto mt-4 w-[78%] max-w-md">
        <img
          src={car}
          alt="Vintage car"
          width={768}
          height={896}
          className="aspect-[4/5] w-full object-cover"
        />
        <div className="absolute bottom-3 left-[-10px] space-y-1.5">
          <span className="flex w-fit items-center gap-1.5 rounded-md bg-phone/70 px-2 py-1 text-[10px]">
            <Img className="h-3 w-3" />Image o35sd
          </span>
          <span className="flex w-fit items-center gap-1.5 rounded-md bg-phone/70 px-2 py-1 text-[10px]">
            <Music className="h-3 w-3" />Audio: cloudy.mp3
          </span>
        </div>
      </div>

      {/* Playback controls */}
      <div className="mx-3 mt-4 flex items-center justify-between rounded-2xl bg-surface px-4 py-2.5">
        <div className="flex gap-4 text-ink-dim">
          <RotateCw className="h-4 w-4" />
          <TimerOff className="h-4 w-4" />
        </div>
        <button onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause" : "Play"}>
          {playing
            ? <Pause className="h-5 w-5 fill-ink" />
            : <Play  className="h-5 w-5 fill-ink" />}
        </button>
        <div className="flex gap-4 text-ink-dim">
          <Undo2 className="h-4 w-4" />
          <Redo2 className="h-4 w-4" />
        </div>
      </div>

      <p className="mt-3 text-center text-[10px] text-ink-dim">
        00:00:04 / <span className="text-ink">00:00:39</span>
      </p>

      {/* Timeline */}
      <div className="relative mt-1 pl-1">
        <div className="absolute left-1/2 top-0 z-10 h-[100px] w-0.5 bg-ink" />
        <div className="flex items-center gap-2">
          <div className="h-14 w-4 rounded-r bg-surface-2" />
          <div className="relative flex h-14 w-[64%] overflow-hidden rounded-md">
            <img src={car} alt="" className="h-full w-1/2 object-cover" />
            <img src={car} alt="" className="h-full w-1/2 object-cover object-right" />
            <Maximize className="absolute left-2 top-4 h-5 w-5" />
            <Shuffle  className="absolute right-1 top-1 h-4 w-4 rounded bg-phone/60 p-0.5" />
          </div>
          <button className="ml-auto mr-3 grid h-8 w-8 place-items-center rounded-full bg-sky text-sky-ink">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-1.5 flex h-6 w-[85%] items-center gap-[2px] rounded-sm bg-surface px-1">
          {bars.map((h, i) => (
            <span key={i} className="w-[2px] bg-ink-dim" style={{ height: `${Math.min(h, 100)}%` }} />
          ))}
        </div>
        <div className="mt-2 ml-2 flex w-fit items-center gap-2 rounded bg-surface-2 px-2 py-1.5 text-[9px]">
          <Type className="h-3 w-3" /> A short film that I edit everyday
        </div>
      </div>

      {/* Edit tools */}
      <div className="absolute inset-x-0 bottom-6 flex justify-around px-2">
        {EDIT_TOOLS.map((t) => (
          <button
            key={t.label}
            onClick={() => setActive(t.label)}
            className={`flex flex-col items-center gap-1 ${active === t.label ? "text-brand" : "text-ink"}`}
          >
            <t.icon className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-[9px] text-ink-dim">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
