import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Star, Wand2, ImageIcon, Film, MoreHorizontal, Plus, Calendar, Clock, HardDrive,
  Layers, PlaySquare, Folder, User, ArrowLeft, Music, Image as Img, Redo2, Undo2,
  RotateCw, TimerOff, Play, Pause, Scissors, Disc3, Type, ScanLine, Sparkles, Moon,
  Maximize, Shuffle,
} from "lucide-react";
import car from "@/assets/car.jpg";
import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";

const tools = [
  { icon: Wand2, label: "AI editor" },
  { icon: ImageIcon, label: "Photo editor" },
  { icon: Film, label: "Video editor" },
  { icon: MoreHorizontal, label: "More options" },
];

const projects = [
  { img: p1, title: "Project 981", sub: "Mastery template", date: "17 Jan 25", dur: "00:01:12", size: "44MB" },
  { img: p2, title: "My daily lifestyle", sub: "Car star", date: "19 Dec 24", dur: "00:58:45", size: "37MB" },
  { img: p3, title: "Friday_01", sub: "Morning Coffee Vibe", date: "13 Dec 24", dur: "00:01:41", size: "52MB" },
  { img: p2, title: "My day", sub: "Weekend", date: "02 Dec 24", dur: "00:00:58", size: "21MB" },
];

export function HomeScreen() {
  const [tab, setTab] = useState(0);
  return (
    <div className="flex relative h-dvh w-full bg-phone text-ink overflow-hidden flex-col">
      <div className="flex-1 overflow-y-auto px-5 pb-24 [scrollbar-width:none]">
        <div className="mt-5 flex items-center justify-between">
          <h1 className="font-display text-xl">EDIT+</h1>
          <button className="flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-medium">
            <Star className="h-3.5 w-3.5 fill-ink" /> Get premium
          </button>
        </div>
        <div className="mt-5 grid grid-cols-4 gap-3">
          {tools.map((t) => (
            <button key={t.label} className="flex flex-col items-center gap-2">
              <div className="grid aspect-square w-full place-items-center rounded-2xl bg-surface transition hover:bg-surface-2">
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
          <button className="grid h-20 w-20 place-items-center rounded-full border-2 border-dashed border-sky-ink/60">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-sky-ink text-sky"><Plus className="h-4 w-4" /></span>
          </button>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <h2 className="font-display text-lg">PROJECTS</h2>
          <button className="rounded-full border border-ink/70 px-3 py-1 text-xs">Settings</button>
        </div>
        <div className="mt-3 space-y-2">
          {projects.map((p) => (
            <Link key={p.title} to={p.title === "Project 981" ? "/editor" : "/"} className="flex gap-3 rounded-xl bg-surface pr-3 transition hover:bg-surface-2">
              <img src={p.img} alt={p.title} loading="lazy" className="h-20 w-20 rounded-l-xl object-cover" />
              <div className="flex-1 py-2">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold">{p.title}</p>
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-surface-2"><MoreHorizontal className="h-3.5 w-3.5" /></span>
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
      <nav className="absolute inset-x-0 bottom-0 flex justify-around bg-phone/95 pb-6 pt-4">
        {[Layers, PlaySquare, Folder, User].map((I, i) => (
          <button key={i} onClick={() => setTab(i)} className={i === tab ? "text-ink" : "text-ink-dim"}>
            <I className="h-5 w-5" fill={i === tab ? "currentColor" : "none"} />
          </button>
        ))}
      </nav>
    </div>
  );
}

const editTools = [
  { icon: Scissors, label: "Split" }, { icon: Disc3, label: "Audio" }, { icon: Type, label: "Text" },
  { icon: ScanLine, label: "Animate" }, { icon: Sparkles, label: "Effects" }, { icon: Moon, label: "Stickers" },
];

export function EditorScreen() {
  const [playing, setPlaying] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const bars = Array.from({ length: 70 }, (_, i) => 20 + Math.abs(Math.sin(i * 1.7) * 60 + Math.cos(i * 0.6) * 20));
  return (
    <div className="flex relative h-dvh w-full bg-phone text-ink overflow-hidden flex-col">
      <div className="mt-3 flex items-center gap-3 px-4">
        <Link to="/"><ArrowLeft className="h-5 w-5" /></Link>
        <span className="flex-1 text-xs">Vlog city lifestyle | 4:3</span>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-surface-2"><MoreHorizontal className="h-4 w-4" /></span>
        <button className="rounded-full bg-brand-dark px-4 py-1.5 text-xs font-medium text-brand">Export</button>
      </div>
      <div className="relative mx-auto mt-4 w-[78%] max-w-md">
        <img src={car} alt="Vintage car" width={768} height={896} className="aspect-[4/5] w-full object-cover" />
        <div className="absolute bottom-3 left-[-10px] space-y-1.5">
          <span className="flex w-fit items-center gap-1.5 rounded-md bg-phone/70 px-2 py-1 text-[10px]"><Img className="h-3 w-3" />Image o35sd</span>
          <span className="flex w-fit items-center gap-1.5 rounded-md bg-phone/70 px-2 py-1 text-[10px]"><Music className="h-3 w-3" />Audio: cloudy.mp3</span>
        </div>
      </div>
      <div className="mx-3 mt-4 flex items-center justify-between rounded-2xl bg-surface px-4 py-2.5">
        <div className="flex gap-4 text-ink-dim"><RotateCw className="h-4 w-4" /><TimerOff className="h-4 w-4" /></div>
        <button onClick={() => setPlaying(!playing)}>
          {playing ? <Pause className="h-5 w-5 fill-ink" /> : <Play className="h-5 w-5 fill-ink" />}
        </button>
        <div className="flex gap-4 text-ink-dim"><Undo2 className="h-4 w-4" /><Redo2 className="h-4 w-4" /></div>
      </div>
      <p className="mt-3 text-center text-[10px] text-ink-dim">00:00:04 / <span className="text-ink">00:00:39</span></p>
      <div className="relative mt-1 pl-1">
        <div className="absolute left-1/2 top-0 z-10 h-[100px] w-0.5 bg-ink" />
        <div className="flex items-center gap-2">
          <div className="h-14 w-4 rounded-r bg-surface-2" />
          <div className="relative flex h-14 w-[64%] overflow-hidden rounded-md">
            <img src={car} alt="" className="h-full w-1/2 object-cover" />
            <img src={car} alt="" className="h-full w-1/2 object-cover object-right" />
            <Maximize className="absolute left-2 top-4 h-5 w-5" />
            <Shuffle className="absolute right-1 top-1 h-4 w-4 rounded bg-phone/60 p-0.5" />
          </div>
          <button className="ml-auto mr-3 grid h-8 w-8 place-items-center rounded-full bg-sky text-sky-ink"><Plus className="h-4 w-4" /></button>
        </div>
        <div className="mt-1.5 flex h-6 w-[85%] items-center gap-[2px] rounded-sm bg-surface px-1">
          {bars.map((h, i) => <span key={i} className="w-[2px] bg-ink-dim" style={{ height: `${Math.min(h, 100)}%` }} />)}
        </div>
        <div className="mt-2 ml-2 flex w-fit items-center gap-2 rounded bg-surface-2 px-2 py-1.5 text-[9px]">
          <Type className="h-3 w-3" /> A short film that I edit everyday
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-6 flex justify-around px-2">
        {editTools.map((t) => (
          <button key={t.label} onClick={() => setActive(t.label)} className={`flex flex-col items-center gap-1 ${active === t.label ? "text-brand" : "text-ink"}`}>
            <t.icon className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-[9px] text-ink-dim">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

