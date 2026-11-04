import { Link, useNavigate } from "@tanstack/react-router";
import { BottomNav } from "@/components/bottom-nav";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Star, Wand2, ImageIcon, Film, MoreHorizontal, Plus, Calendar, Clock, HardDrive,
  ArrowLeft, Music, Image as Img, Redo2, Undo2, RotateCw, TimerOff, Play, Pause,
  Scissors, Disc3, Type, ScanLine, Sparkles, Moon, Maximize, Shuffle, X, ChevronLeft,
  // Audio panel icons
  FolderOpen, AudioLines, MicVocal, FileAudio,
  // Text panel icons
  AlignLeft, AlignCenter, Bold, Italic, Underline, Baseline,
  // Animate panel icons
  Wind, Zap, RotateCcw, MoveHorizontal, FlipHorizontal, FlipVertical,
  // Effects panel icons
  Sun, Contrast, Droplets, Palette, CircleDot, Layers,
  // Stickers panel icons
  Smile, Heart, Star as StarIcon, Flame, Crown, Ghost,
  // Clip tools (shown when clip selected)
  GaugeCircle, BarChart2, Crop, Copy, RefreshCw, PictureInPicture2,
  SlidersHorizontal, Filter, BotIcon, Eye, BluetoothOff, Volume2, Repeat, Minus,
  // Upload sheet
  Eraser,
} from "lucide-react";
import car from "@/assets/car.jpg";
import {
  PROJECTS,
  MORE_TOOLS,
  PROJECT_MENU_ACTIONS,
  type ProjectMenuAction,
  type Project,
} from "@/data/app-data";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveTool = "Split" | "Audio" | "Text" | "Animate" | "Effects" | "Stickers" | null;

interface ClipState {
  id: number;
  startPct: number; // 0–100 position in timeline
}

interface EditorState {
  clips: ClipState[];
  brightness: number;   // 0–200 (100 = normal)
  contrast: number;     // 0–200
  saturation: number;   // 0–200
  opacity: number;      // 0–100
  volume: number;       // 0–100
  speed: number;        // 0.25–4
  textOverlay: string;
  textSize: number;
  textBold: boolean;
  textItalic: boolean;
  textAlign: "left" | "center" | "right";
  flipH: boolean;
  flipV: boolean;
  activeEffect: string | null;
  activeFilter: string | null;
  activeSticker: string | null;
  activeAnimation: string | null;
}

const INITIAL_STATE: EditorState = {
  clips: [{ id: 1, startPct: 0 }, { id: 2, startPct: 50 }],
  brightness: 100, contrast: 100, saturation: 100,
  opacity: 100, volume: 80, speed: 1,
  textOverlay: "", textSize: 24, textBold: false, textItalic: false, textAlign: "center",
  flipH: false, flipV: false,
  activeEffect: null, activeFilter: null, activeSticker: null, activeAnimation: null,
};

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="pointer-events-none absolute bottom-28 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-surface-2 px-5 py-2.5 text-xs text-ink shadow-lg">
      {message}
    </div>
  );
}

// ─── Rename modal ─────────────────────────────────────────────────────────────

function RenameModal({ initialValue, onConfirm, onCancel }: {
  initialValue: string; onConfirm: (v: string) => void; onCancel: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <div className="absolute inset-0 z-50 flex items-end" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative z-10 w-full rounded-t-3xl bg-surface p-5 pb-10">
        <h2 className="mb-4 font-display text-base">Rename project</h2>
        <input ref={ref} value={value} onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && value.trim()) onConfirm(value.trim()); if (e.key === "Escape") onCancel(); }}
          className="w-full rounded-xl bg-surface-2 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-brand" />
        <div className="mt-4 flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-full border border-surface-2 py-3 text-sm text-ink-dim">Cancel</button>
          <button onClick={() => value.trim() && onConfirm(value.trim())} disabled={!value.trim()}
            className="flex-1 rounded-full bg-brand py-3 text-sm font-semibold text-sky-ink disabled:opacity-50">Rename</button>
        </div>
      </div>
    </div>
  );
}

// ─── More Options Sheet ───────────────────────────────────────────────────────

function MoreOptionsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 rounded-t-3xl bg-surface pb-10 pt-5 px-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-base">More tools</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-surface-2" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {MORE_TOOLS.map((t) => (
            <button key={t.label} onClick={onClose}
              className="flex flex-col items-center gap-2 rounded-2xl bg-surface-2 px-2 py-4 text-center transition hover:bg-surface active:scale-95">
              <t.icon className="h-6 w-6 text-ink-dim" strokeWidth={1.5} />
              <span className="text-[10px] leading-tight text-ink">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Upload Sheet ─────────────────────────────────────────────────────────────

export interface UploadSheetProps {
  open: boolean;
  onClose: () => void;
  onFileSelected: (url: string, type: string, name: string) => void;
}

export function UploadSheet({ open, onClose, onFileSelected }: UploadSheetProps) {
  const videoRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>, mediaType: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const name = file.name.replace(/\.[^.]+$/, ""); // strip extension
    onFileSelected(url, mediaType, name);
    // reset input so same file can be re-selected
    e.target.value = "";
    onClose();
  }

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 rounded-t-3xl bg-surface pb-10 pt-5 px-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-base">New project</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-surface-2" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => videoRef.current?.click()}
            className="flex flex-col items-center gap-3 rounded-2xl bg-surface-2 px-4 py-6 transition active:scale-95 hover:bg-surface"
          >
            <Film className="h-8 w-8 text-brand" strokeWidth={1.5} />
            <span className="text-sm font-medium">Video</span>
            <span className="text-[10px] text-ink-dim">MP4, MOV, AVI…</span>
          </button>
          <button
            onClick={() => photoRef.current?.click()}
            className="flex flex-col items-center gap-3 rounded-2xl bg-surface-2 px-4 py-6 transition active:scale-95 hover:bg-surface"
          >
            <ImageIcon className="h-8 w-8 text-brand" strokeWidth={1.5} />
            <span className="text-sm font-medium">Photo</span>
            <span className="text-[10px] text-ink-dim">JPG, PNG, WEBP…</span>
          </button>
        </div>
        {/* Hidden file inputs */}
        <input
          ref={videoRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleFile(e, "video")}
        />
        <input
          ref={photoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e, "image")}
        />
      </div>
    </div>
  );
}

// ─── Project Menu ─────────────────────────────────────────────────────────────

function ProjectMenu({ project, onAction }: { project: Project; onAction: (a: ProjectMenuAction, p: Project) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
        className="grid h-6 w-6 place-items-center rounded-full bg-surface-2 transition hover:bg-surface"
        aria-label={`Options for ${project.title}`} aria-expanded={open} aria-haspopup="menu">
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 min-w-[140px] overflow-hidden rounded-2xl bg-surface-2 shadow-lg" role="menu">
          {PROJECT_MENU_ACTIONS.map((action) => (
            <button key={action} role="menuitem"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); onAction(action, project); }}
              className={`block w-full px-4 py-3 text-left text-xs transition hover:bg-surface ${action === "Delete" ? "text-red-400" : "text-ink"}`}>
              {action}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Slider row (reusable) ────────────────────────────────────────────────────

function SliderRow({ label, value, min, max, step = 1, onChange, unit = "" }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; unit?: string;
}) {
  return (
    <div className="flex flex-col gap-1 px-5">
      <div className="flex justify-between text-[10px]">
        <span className="text-ink-dim">{label}</span>
        <span className="text-ink">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-2 accent-brand" />
    </div>
  );
}

// ─── Tool panel chip row (scrollable) ─────────────────────────────────────────

function ChipRow({ items, active, onSelect }: {
  items: { icon: React.ElementType; label: string; badge?: string }[];
  active: string | null;
  onSelect: (label: string) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
      {items.map((it) => {
        const Icon = it.icon;
        const isActive = active === it.label;
        return (
          <button key={it.label} onClick={() => onSelect(it.label)}
            className={`relative flex shrink-0 flex-col items-center gap-1.5 rounded-2xl px-4 py-3 transition active:scale-95 ${isActive ? "bg-brand/20 text-brand" : "bg-surface-2 text-ink"}`}>
            {it.badge && (
              <span className="absolute -right-1 -top-1 rounded-full bg-sky px-1.5 py-0.5 text-[8px] font-bold text-sky-ink">{it.badge}</span>
            )}
            <Icon className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-[9px] whitespace-nowrap">{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Audio Panel ──────────────────────────────────────────────────────────────

function AudioPanel({ volume, onChange }: { volume: number; onChange: (v: number) => void }) {
  const audioTools = [
    { icon: FolderOpen,  label: "Extract",      badge: "2 uses" },
    { icon: AudioLines,  label: "Sounds" },
    { icon: Music,       label: "Sound FX" },
    { icon: MicVocal,    label: "Record" },
    { icon: FileAudio,   label: "Text to audio" },
    { icon: Volume2,     label: "Volume" },
    { icon: Disc3,       label: "Audio effects" },
    { icon: Wand2,       label: "Enhance voice" },
    { icon: BluetoothOff, label: "Reduce noise" },
    { icon: Minus,       label: "Freeze" },
    { icon: Repeat,      label: "Reverse" },
  ];
  const [activeSub, setActiveSub] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3 pb-2">
      <ChipRow items={audioTools} active={activeSub} onSelect={setActiveSub} />
      {(activeSub === "Volume" || activeSub === null) && (
        <SliderRow label="Volume" value={volume} min={0} max={100} onChange={onChange} unit="%" />
      )}
    </div>
  );
}

// ─── Text Panel ───────────────────────────────────────────────────────────────

function TextPanel({ state, onChange }: {
  state: Pick<EditorState, "textOverlay" | "textSize" | "textBold" | "textItalic" | "textAlign">;
  onChange: (partial: Partial<EditorState>) => void;
}) {
  const styleTools = [
    { icon: Bold,        label: "Bold" },
    { icon: Italic,      label: "Italic" },
    { icon: Underline,   label: "Underline" },
    { icon: AlignLeft,   label: "Left" },
    { icon: AlignCenter, label: "Center" },
    { icon: Baseline,    label: "Style" },
    { icon: Palette,     label: "Color" },
    { icon: Type,        label: "Font" },
  ];
  return (
    <div className="flex flex-col gap-3 pb-2">
      <div className="px-5">
        <input value={state.textOverlay} onChange={(e) => onChange({ textOverlay: e.target.value })}
          placeholder="Type your text here…"
          className="w-full rounded-xl bg-surface-2 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-brand placeholder:text-ink-dim" />
      </div>
      <ChipRow items={styleTools} active={null} onSelect={(label) => {
        if (label === "Bold")   onChange({ textBold: !state.textBold });
        if (label === "Italic") onChange({ textItalic: !state.textItalic });
        if (label === "Left")   onChange({ textAlign: "left" });
        if (label === "Center") onChange({ textAlign: "center" });
      }} />
      <SliderRow label="Text size" value={state.textSize} min={10} max={80} onChange={(v) => onChange({ textSize: v })} unit="px" />
    </div>
  );
}

// ─── Animate Panel ────────────────────────────────────────────────────────────

function AnimatePanel({ state, onChange }: {
  state: Pick<EditorState, "flipH" | "flipV" | "activeAnimation">;
  onChange: (partial: Partial<EditorState>) => void;
}) {
  const animTools = [
    { icon: Wind,           label: "Fade in" },
    { icon: Zap,            label: "Flash" },
    { icon: RotateCcw,      label: "Spin" },
    { icon: MoveHorizontal, label: "Slide" },
    { icon: FlipHorizontal, label: "Flip H" },
    { icon: FlipVertical,   label: "Flip V" },
    { icon: Maximize,       label: "Zoom in" },
    { icon: Shuffle,        label: "Bounce" },
  ];
  return (
    <div className="flex flex-col gap-3 pb-2">
      <ChipRow items={animTools} active={state.activeAnimation} onSelect={(label) => {
        if (label === "Flip H") onChange({ flipH: !state.flipH, activeAnimation: "Flip H" });
        else if (label === "Flip V") onChange({ flipV: !state.flipV, activeAnimation: "Flip V" });
        else onChange({ activeAnimation: state.activeAnimation === label ? null : label });
      }} />
      <p className="px-5 text-[10px] text-ink-dim">
        {state.activeAnimation ? `Animation: ${state.activeAnimation}` : "Tap an animation to apply it"}
      </p>
    </div>
  );
}

// ─── Effects Panel ────────────────────────────────────────────────────────────

function EffectsPanel({ state, onChange, mediaUrl }: {
  state: Pick<EditorState, "brightness" | "contrast" | "saturation" | "opacity" | "activeEffect" | "activeFilter">;
  onChange: (partial: Partial<EditorState>) => void;
  mediaUrl: string;
}) {
  const [tab, setTab] = useState<"adjust" | "filters" | "retouch" | "ai">("adjust");

  const filterList = ["None", "Vivid", "Matte", "Warm", "Cool", "BW", "Fade", "Drama", "Chrome", "Noir"];
  const retouchTools = [
    { icon: Wand2,     label: "Smooth" },
    { icon: Sun,       label: "Brighten" },
    { icon: Eye,       label: "Eye bags" },
    { icon: CircleDot, label: "Blemish" },
    { icon: Layers,    label: "Reshape" },
  ];
  const aiTools = [
    { icon: BotIcon,   label: "AI remove" },
    { icon: Maximize,  label: "AI expand" },
    { icon: Shuffle,   label: "AI remix" },
    { icon: Zap,       label: "AI extend" },
  ];

  const tabs = ["adjust", "filters", "retouch", "ai"] as const;

  return (
    <div className="flex flex-col gap-3 pb-2">
      {/* Sub-tabs */}
      <div className="flex gap-1 overflow-x-auto px-5 [scrollbar-width:none]">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs capitalize transition ${tab === t ? "bg-brand text-sky-ink" : "bg-surface-2 text-ink-dim"}`}>
            {t === "ai" ? "AI tools" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "adjust" && (
        <div className="flex flex-col gap-2">
          <SliderRow label="Brightness" value={state.brightness} min={0} max={200} onChange={(v) => onChange({ brightness: v })} />
          <SliderRow label="Contrast"   value={state.contrast}   min={0} max={200} onChange={(v) => onChange({ contrast: v })} />
          <SliderRow label="Saturation" value={state.saturation} min={0} max={200} onChange={(v) => onChange({ saturation: v })} />
          <SliderRow label="Opacity"    value={state.opacity}    min={0} max={100} onChange={(v) => onChange({ opacity: v })} unit="%" />
        </div>
      )}

      {tab === "filters" && (
        <div className="flex gap-3 overflow-x-auto px-5 [scrollbar-width:none]">
          {filterList.map((f) => (
            <button key={f} onClick={() => onChange({ activeFilter: state.activeFilter === f ? null : f })}
              className={`flex shrink-0 flex-col items-center gap-1.5 transition active:scale-95`}>
              <div className={`h-14 w-14 rounded-xl border-2 ${state.activeFilter === f ? "border-brand" : "border-transparent"}`}
                style={{
                  backgroundImage: `url(${mediaUrl})`,
                  backgroundSize: "cover",
                  filter: f === "BW" ? "grayscale(1)" : f === "Warm" ? "sepia(0.4)" : f === "Cool" ? "hue-rotate(180deg)" : f === "Vivid" ? "saturate(2)" : f === "Matte" ? "contrast(0.8) brightness(1.1)" : f === "Fade" ? "opacity(0.7)" : f === "Drama" ? "contrast(1.4) brightness(0.9)" : f === "Chrome" ? "contrast(1.2) saturate(1.5)" : f === "Noir" ? "grayscale(1) contrast(1.5)" : "none",
                }} />
              <span className={`text-[9px] ${state.activeFilter === f ? "text-brand" : "text-ink-dim"}`}>{f}</span>
            </button>
          ))}
        </div>
      )}

      {tab === "retouch" && (
        <ChipRow items={retouchTools} active={state.activeEffect} onSelect={(label) => onChange({ activeEffect: state.activeEffect === label ? null : label })} />
      )}

      {tab === "ai" && (
        <ChipRow items={aiTools} active={state.activeEffect} onSelect={(label) => onChange({ activeEffect: state.activeEffect === label ? null : label })} />
      )}
    </div>
  );
}

// ─── Stickers Panel ──────────────────────────────────────────────────────────

function StickersPanel({ active, onSelect }: { active: string | null; onSelect: (s: string) => void }) {
  const categories = [
    { label: "Emoji",   items: ["😂", "🔥", "💯", "✨", "❤️", "🎉", "👀", "💀", "🥶", "😍", "🙏", "💪"] },
    { label: "Shapes",  items: ["⭐", "💠", "🔶", "🔷", "🟢", "🔴", "🟡", "⚡", "🌊", "🍂", "🌸", "🌙"] },
    { label: "Text",    items: ["LOL", "OMG", "WOW", "GG", "FR", "VIBE", "MOOD", "ICONIC", "SLAY", "NO WAY", "FACTS", "LIT"] },
  ];
  const [cat, setCat] = useState("Emoji");
  const current = categories.find((c) => c.label === cat)!;
  return (
    <div className="flex flex-col gap-3 pb-2">
      <div className="flex gap-2 px-5">
        {categories.map((c) => (
          <button key={c.label} onClick={() => setCat(c.label)}
            className={`rounded-full px-3 py-1.5 text-xs transition ${cat === c.label ? "bg-brand text-sky-ink" : "bg-surface-2 text-ink-dim"}`}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-6 gap-2 px-5">
        {current.items.map((s) => (
          <button key={s} onClick={() => onSelect(s)}
            className={`flex aspect-square items-center justify-center rounded-xl text-lg transition active:scale-95 ${active === s ? "bg-brand/20 ring-1 ring-brand" : "bg-surface-2"}`}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Clip Tool Bar (shown when clip is selected in timeline) ──────────────────

function ClipToolBar({ onAction }: { onAction: (label: string) => void }) {
  const clipTools = [
    { icon: Scissors,          label: "Split" },
    { icon: Volume2,           label: "Volume" },
    { icon: ScanLine,          label: "Animations" },
    { icon: Sparkles,          label: "Effects" },
    { icon: X,                 label: "Delete" },
    { icon: GaugeCircle,       label: "Speed" },
    { icon: BarChart2,         label: "Beats" },
    { icon: Crop,              label: "Crop" },
    { icon: Copy,              label: "Duplicate" },
    { icon: RefreshCw,         label: "Replace" },
    { icon: PictureInPicture2, label: "Overlay" },
    { icon: SlidersHorizontal, label: "Adjust" },
    { icon: Filter,            label: "Filters" },
    { icon: Wand2,             label: "Retouch" },
    { icon: Film,              label: "Video quality" },
    { icon: Eraser,            label: "Remove BG" },
  ];
  return (
    <div className="flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
      {clipTools.map((t) => (
        <button key={t.label} onClick={() => onAction(t.label)}
          className={`flex shrink-0 flex-col items-center gap-1.5 rounded-2xl bg-surface-2 px-4 py-3 transition active:scale-95 ${t.label === "Delete" ? "text-red-400" : "text-ink"}`}>
          <t.icon className="h-5 w-5" strokeWidth={1.5} />
          <span className="text-[9px] whitespace-nowrap">{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── MAIN TOOLS row ────────────────────────────────────────────────────────────

const MAIN_TOOLS = [
  { icon: Wand2, label: "AI editor" },
  { icon: ImageIcon, label: "Photo editor" },
  { icon: Film, label: "Video editor" },
  { icon: MoreHorizontal, label: "More options" },
] as const;

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export function HomeScreen() {
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [projects, setProjects] = useState(PROJECTS);
  const [toast, setToast] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<Project | null>(null);

  function showToast(msg: string) { setToast(msg); }

  function handleProjectAction(action: ProjectMenuAction, project: Project) {
    if (action === "Delete") {
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      showToast(`"${project.title}" deleted`);
    } else if (action === "Duplicate") {
      setProjects((prev) => {
        const idx = prev.findIndex((p) => p.id === project.id);
        const copy: Project = { ...project, id: `${project.id}-${Date.now()}`, title: `${project.title} (copy)` };
        const next = [...prev]; next.splice(idx + 1, 0, copy); return next;
      });
      showToast(`"${project.title}" duplicated`);
    } else if (action === "Rename") {
      setRenaming(project);
    } else if (action === "Export") {
      showToast(`Exporting "${project.title}"…`);
    }
  }

  function confirmRename(newTitle: string) {
    if (!renaming) return;
    setProjects((prev) => prev.map((p) => p.id === renaming.id ? { ...p, title: newTitle } : p));
    showToast("Renamed");
    setRenaming(null);
  }

  function handleFileSelected(url: string, type: string, name: string) {
    // Format today as "DD Mon YY"
    const now = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = String(now.getDate()).padStart(2, "0");
    const mon = months[now.getMonth()];
    const yr = String(now.getFullYear()).slice(2);
    const dateStr = `${day} ${mon} ${yr}`;

    const newProject: Project = {
      id: Date.now().toString(),
      img: url,
      title: name,
      sub: "New project",
      date: dateStr,
      dur: "00:00:00",
      size: "—",
    };
    setProjects((prev) => [newProject, ...prev]);
    navigate({ to: "/editor", search: { mediaUrl: url, mediaType: type } });
  }

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-phone text-ink">
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-24 [scrollbar-width:none]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="EDIT+" className="h-8 w-8 rounded-lg object-cover" />
            <h1 className="font-display text-xl">EDIT+</h1>
          </div>
          <Link to="/premium" className="flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-medium">
            <Star className="h-3.5 w-3.5 fill-ink" /> Get premium
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-4 gap-3">
          {MAIN_TOOLS.map((t) => (
            <button key={t.label} onClick={t.label === "More options" ? () => setMoreOpen(true) : undefined}
              className="flex flex-col items-center gap-2" aria-label={t.label}>
              <div className="grid aspect-square w-full place-items-center rounded-2xl bg-surface transition hover:bg-surface-2 active:scale-95">
                <t.icon className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <span className="text-[10px] text-ink">{t.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between rounded-3xl bg-sky p-4 text-sky-ink">
          <div>
            <h2 className="font-display text-xl">NEW PROJECT</h2>
            <p className="mt-1 text-xs"><b>Trial version</b> <span className="opacity-70">2 projects left</span></p>
            <span className="mt-3 inline-block rounded-full bg-brand px-4 py-1.5 text-xs font-medium">Version 3.0</span>
          </div>
          <button
            onClick={() => setUploadOpen(true)}
            className="grid h-20 w-20 place-items-center rounded-full border-2 border-dashed border-sky-ink/60 transition active:scale-95"
            aria-label="Create new project"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-sky-ink text-sky"><Plus className="h-4 w-4" /></span>
          </button>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <h2 className="font-display text-lg">PROJECTS</h2>
          <Link to="/settings" className="rounded-full border border-ink/70 px-3 py-1 text-xs">Settings</Link>
        </div>
        <div className="mt-3 space-y-2">
          {projects.length === 0 && <p className="py-8 text-center text-sm text-ink-dim">No projects yet.</p>}
          {projects.map((p) => (
            <Link key={p.id} to={p.id === "proj-981" ? "/editor" : "/"}
              className="flex gap-3 rounded-xl bg-surface pr-3 transition hover:bg-surface-2">
              <img src={p.img} alt={p.title} loading="lazy" className="h-20 w-20 rounded-l-xl object-cover" />
              <div className="flex flex-1 flex-col py-2">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold">{p.title}</p>
                  <ProjectMenu project={p} onAction={handleProjectAction} />
                </div>
                <p className="text-[11px] text-ink-dim">{p.sub}</p>
                <div className="mt-3 flex gap-3 text-[9px] text-ink-dim">
                  <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{p.date}</span>
                  <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{p.dur}</span>
                  <span className="flex items-center gap-1"><HardDrive className="h-2.5 w-2.5" />{p.size}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <BottomNav />
      <MoreOptionsSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
      <UploadSheet
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onFileSelected={handleFileSelected}
      />
      {renaming && <RenameModal initialValue={renaming.title} onConfirm={confirmRename} onCancel={() => setRenaming(null)} />}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

// ─── EDITOR SCREEN ─────────────────────────────────────────────────────────────

const EDITOR_BOTTOM_TOOLS = [
  { icon: Scissors, label: "Split" },
  { icon: Disc3,    label: "Audio" },
  { icon: Type,     label: "Text" },
  { icon: ScanLine, label: "Animate" },
  { icon: Sparkles, label: "Effects" },
  { icon: Moon,     label: "Stickers" },
] as const;

const EDITOR_MENU_ITEMS = ["Save draft", "Export settings", "Share", "Delete"] as const;

export function EditorScreen({ mediaUrl: mediaUrlProp, mediaType: mediaTypeProp }: {
  mediaUrl?: string;
  mediaType?: string;
}) {
  const mediaUrl = mediaUrlProp || car;
  const mediaType = mediaTypeProp || "image";

  const [playing, setPlaying]           = useState(false);
  const [activeTool, setActiveTool]     = useState<ActiveTool>(null);
  const [menuOpen, setMenuOpen]         = useState(false);
  const [toast, setToast]               = useState<string | null>(null);
  const [selectedClip, setSelectedClip] = useState<number | null>(null);
  const [editorState, setEditorState]   = useState<EditorState>(INITIAL_STATE);
  const [currentTime, setCurrentTime]   = useState(4); // seconds
  const menuRef = useRef<HTMLDivElement>(null);

  const totalDuration = 39;

  // Update editor state partially
  const update = useCallback((partial: Partial<EditorState>) => {
    setEditorState((prev) => ({ ...prev, ...partial }));
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);

  // Playback ticker
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setCurrentTime((t) => { if (t >= totalDuration) { setPlaying(false); return 0; } return t + 0.1; });
    }, 100);
    return () => clearInterval(id);
  }, [playing]);

  // Format seconds as HH:MM:SS
  function fmt(s: number) {
    const h = Math.floor(s / 3600).toString().padStart(2, "0");
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${h}:${m}:${sec}`;
  }

  // Split clip at playhead
  function handleSplit() {
    const pct = (currentTime / totalDuration) * 100;
    // Find which clip contains the playhead
    const sorted = [...editorState.clips].sort((a, b) => a.startPct - b.startPct);
    let splitIdx = -1;
    for (let i = 0; i < sorted.length; i++) {
      const next = sorted[i + 1];
      if (pct >= sorted[i].startPct && (next === undefined || pct < next.startPct)) {
        splitIdx = i;
        break;
      }
    }
    if (splitIdx < 0) { setToast("Nothing to split here"); return; }
    const newClip: ClipState = { id: Date.now(), startPct: pct };
    update({ clips: [...editorState.clips, newClip].sort((a, b) => a.startPct - b.startPct) });
    setToast("Clip split at playhead");
  }

  function handleToolClick(label: string) {
    if (label === "Split") { handleSplit(); return; }
    // Close clip tools when opening a main panel
    setSelectedClip(null);
    setActiveTool((prev) => (prev === label ? null : label as ActiveTool));
  }

  function handleClipAction(label: string) {
    if (label === "Split") { handleSplit(); return; }
    if (label === "Delete" && selectedClip !== null) {
      update({ clips: editorState.clips.filter((c) => c.id !== selectedClip) });
      setSelectedClip(null);
      setToast("Clip deleted");
      return;
    }
    if (label === "Duplicate" && selectedClip !== null) {
      const clip = editorState.clips.find((c) => c.id === selectedClip);
      if (clip) { update({ clips: [...editorState.clips, { id: Date.now(), startPct: clip.startPct + 5 }] }); setToast("Clip duplicated"); }
      return;
    }
    setToast(`${label} applied`);
  }

  function handleEditorMenu(item: string) {
    setMenuOpen(false);
    if (item === "Save draft") setToast("Draft saved");
    else if (item === "Share") setToast("Share link copied");
    else if (item === "Export settings") setToast("Export settings");
    else if (item === "Delete") setToast("Project deleted");
  }

  // Compute CSS filter from editor state
  const previewFilter = [
    `brightness(${editorState.brightness / 100})`,
    `contrast(${editorState.contrast / 100})`,
    `saturate(${editorState.saturation / 100})`,
    editorState.activeFilter === "BW"     ? "grayscale(1)"             : "",
    editorState.activeFilter === "Warm"   ? "sepia(0.4)"               : "",
    editorState.activeFilter === "Cool"   ? "hue-rotate(180deg)"       : "",
    editorState.activeFilter === "Vivid"  ? "saturate(2)"              : "",
    editorState.activeFilter === "Matte"  ? "contrast(0.8)"            : "",
    editorState.activeFilter === "Fade"   ? "opacity(0.7)"             : "",
    editorState.activeFilter === "Drama"  ? "contrast(1.4)"            : "",
    editorState.activeFilter === "Chrome" ? "contrast(1.2) saturate(1.5)" : "",
    editorState.activeFilter === "Noir"   ? "grayscale(1) contrast(1.5)" : "",
  ].filter(Boolean).join(" ");

  const previewTransform = [
    editorState.flipH ? "scaleX(-1)" : "",
    editorState.flipV ? "scaleY(-1)" : "",
    editorState.activeAnimation === "Zoom in" ? "scale(1.05)" : "",
    editorState.activeAnimation === "Spin" ? "rotate(5deg)" : "",
  ].filter(Boolean).join(" ") || "none";

  const bars = Array.from({ length: editorState.clips.length > 1 ? 40 : 70 }, (_, i) =>
    20 + Math.abs(Math.sin(i * 1.7) * 60 + Math.cos(i * 0.6) * 20)
  );

  // When a clip is selected, close the main panel and show clip tools
  const showClipTools = selectedClip !== null;
  const panelOpen = activeTool !== null && !showClipTools;

  return (
    <div
      className="relative flex h-dvh w-full flex-col overflow-hidden bg-phone text-ink"
      onClick={(e) => {
        // clicking the backdrop (not a child tool area) dismisses clip selection
        if (e.currentTarget === e.target) setSelectedClip(null);
      }}
    >

      {/* ── Top bar ── */}
      <div className="mt-3 flex items-center gap-3 px-4">
        <Link to="/" aria-label="Back"><ArrowLeft className="h-5 w-5" /></Link>
        <span className="flex-1 truncate text-xs">Vlog city lifestyle | 4:3</span>
        <div ref={menuRef} className="relative">
          <button onClick={() => setMenuOpen((v) => !v)}
            className="grid h-7 w-7 place-items-center rounded-full bg-surface-2"
            aria-label="Editor options" aria-expanded={menuOpen} aria-haspopup="menu">
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-30 min-w-[150px] overflow-hidden rounded-2xl bg-surface-2 shadow-lg" role="menu">
              {EDITOR_MENU_ITEMS.map((item) => (
                <button key={item} role="menuitem" onClick={() => handleEditorMenu(item)}
                  className={`block w-full px-4 py-3 text-left text-xs transition hover:bg-surface ${item === "Delete" ? "text-red-400" : "text-ink"}`}>
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="rounded-full bg-brand px-4 py-1.5 text-xs font-medium text-sky-ink">Export</button>
      </div>

      {/* ── Preview ── */}
      <div className="relative mx-auto mt-3 w-[78%] max-w-md">
        <div style={{ opacity: editorState.opacity / 100 }} className="overflow-hidden rounded-lg">
          {mediaType === "video" ? (
            <video
              src={mediaUrl}
              autoPlay
              muted
              loop
              playsInline
              style={{ filter: previewFilter, transform: previewTransform }}
              className="aspect-[4/5] w-full object-cover transition-all duration-200"
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Preview"
              width={768}
              height={896}
              style={{ filter: previewFilter, transform: previewTransform }}
              className="aspect-[4/5] w-full object-cover transition-all duration-200"
            />
          )}
        </div>
        {/* Text overlay */}
        {editorState.textOverlay && (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
            <span style={{
              fontSize: editorState.textSize,
              fontWeight: editorState.textBold ? "bold" : "normal",
              fontStyle: editorState.textItalic ? "italic" : "normal",
              textAlign: editorState.textAlign,
            }} className="rounded bg-black/40 px-2 py-1 text-white drop-shadow">
              {editorState.textOverlay}
            </span>
          </div>
        )}
        {/* Sticker overlay */}
        {editorState.activeSticker && (
          <div className="pointer-events-none absolute right-4 top-4 text-3xl">
            {editorState.activeSticker}
          </div>
        )}
        <div className="absolute bottom-3 left-[-10px] space-y-1.5">
          <span className="flex w-fit items-center gap-1.5 rounded-md bg-phone/70 px-2 py-1 text-[10px]"><Img className="h-3 w-3" />Image o35sd</span>
          <span className="flex w-fit items-center gap-1.5 rounded-md bg-phone/70 px-2 py-1 text-[10px]"><Music className="h-3 w-3" />Audio: cloudy.mp3</span>
        </div>
      </div>

      {/* ── Playback controls ── */}
      <div className="mx-3 mt-3 flex items-center justify-between rounded-2xl bg-surface px-4 py-2">
        <div className="flex gap-4 text-ink-dim">
          <RotateCw className="h-4 w-4" />
          <TimerOff className="h-4 w-4" />
        </div>
        <button onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause" : "Play"}>
          {playing ? <Pause className="h-5 w-5 fill-ink" /> : <Play className="h-5 w-5 fill-ink" />}
        </button>
        <div className="flex gap-4 text-ink-dim">
          <Undo2 className="h-4 w-4" />
          <Redo2 className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-1 text-center text-[10px] text-ink-dim">
        {fmt(currentTime)} / <span className="text-ink">{fmt(totalDuration)}</span>
      </p>

      {/* ── Timeline ── */}
      <div className="relative mt-1 pl-1 shrink-0">
        {/* Playhead */}
        <div className="absolute z-10 h-[90px] w-0.5 bg-ink transition-all duration-100"
          style={{ left: `${(currentTime / totalDuration) * 100}%` }} />
        {/* Scrubber */}
        <input type="range" min={0} max={totalDuration} step={0.1} value={currentTime}
          onChange={(e) => { setCurrentTime(Number(e.target.value)); setPlaying(false); }}
          className="absolute inset-x-0 top-0 z-20 h-[90px] w-full cursor-pointer opacity-0" />
        {/* Clips */}
        <div className="flex items-center gap-2">
          <div className="h-14 w-4 shrink-0 rounded-r bg-surface-2" />
          <div className="relative flex h-14 flex-1 overflow-hidden rounded-md mr-2">
            {editorState.clips.map((clip, idx) => {
              const nextPct = editorState.clips[idx + 1]?.startPct ?? 100;
              const width = nextPct - clip.startPct;
              return (
                <button key={clip.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Select clip and close main panel
                    setActiveTool(null);
                    setSelectedClip(selectedClip === clip.id ? null : clip.id);
                  }}
                  className={`relative h-full overflow-hidden border-2 transition ${selectedClip === clip.id ? "border-brand" : "border-transparent"}`}
                  style={{ width: `${width}%` }}>
                  <img src={mediaUrl} alt="" className="h-full w-full object-cover" />
                </button>
              );
            })}
          </div>
          <button className="mr-3 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sky text-sky-ink" aria-label="Add clip">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {/* Audio waveform */}
        <div className="mt-1 flex h-6 w-[85%] items-center gap-[2px] rounded-sm bg-surface px-1">
          {bars.map((h, i) => <span key={i} className="w-[2px] bg-ink-dim" style={{ height: `${Math.min(h, 100)}%` }} />)}
        </div>
        <div className="mt-1 ml-2 flex w-fit items-center gap-2 rounded bg-surface-2 px-2 py-1 text-[9px]">
          <Type className="h-3 w-3" /> A short film that I edit everyday
        </div>
      </div>

      {/* ── Bottom tool area ── */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col bg-phone/95 backdrop-blur">

        {/* Clip tools — shown when a clip is selected (takes priority over main panel) */}
        {showClipTools && (
          <div className="border-t border-surface-2 py-3">
            <div className="mb-2 flex items-center gap-2 px-5">
              <button onClick={() => setSelectedClip(null)} className="text-ink-dim" aria-label="Close clip tools">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-semibold text-ink">Clip tools</span>
            </div>
            <ClipToolBar onAction={handleClipAction} />
          </div>
        )}

        {/* Active panel — shown when no clip is selected */}
        {panelOpen && (
          <div className="border-t border-surface-2 py-3">
            <div className="mb-2 flex items-center gap-2 px-5">
              <button onClick={() => setActiveTool(null)} className="text-ink-dim" aria-label="Close panel">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-semibold text-ink">{activeTool}</span>
            </div>
            {activeTool === "Audio"   && <AudioPanel volume={editorState.volume} onChange={(v) => update({ volume: v })} />}
            {activeTool === "Text"    && <TextPanel state={editorState} onChange={update} />}
            {activeTool === "Animate" && <AnimatePanel state={editorState} onChange={update} />}
            {activeTool === "Effects" && <EffectsPanel state={editorState} onChange={update} mediaUrl={mediaUrl} />}
            {activeTool === "Stickers" && <StickersPanel active={editorState.activeSticker} onSelect={(s) => update({ activeSticker: editorState.activeSticker === s ? null : s })} />}
          </div>
        )}

        {/* Main tool row */}
        <div className="flex justify-around px-2 pb-6 pt-3 border-t border-surface-2">
          {EDITOR_BOTTOM_TOOLS.map((t) => {
            const isActive = activeTool === t.label && !showClipTools;
            return (
              <button key={t.label} onClick={() => handleToolClick(t.label)}
                aria-pressed={isActive}
                className={`flex flex-col items-center gap-1 transition ${isActive ? "text-brand" : "text-ink"}`}>
                <t.icon className="h-5 w-5" strokeWidth={1.5} />
                <span className="text-[9px] text-ink-dim">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
