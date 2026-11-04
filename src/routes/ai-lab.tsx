import { createFileRoute } from "@tanstack/react-router";
import { History, ChevronRight, ImagePlus, Scissors, Clapperboard, Send, Plus, LayoutGrid, Mic } from "lucide-react";
import { Screen, meta } from "@/components/bottom-nav";
import car from "@/assets/car.jpg";
import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";

export const Route = createFileRoute("/ai-lab")({
  head: () => meta("AI Lab — EDIT+", "Create AI videos, quick photo edits and auto cuts."),
  component: AiLab,
});

const actions = [
  { icon: ImagePlus, label: "Quick photo edit" },
  { icon: Scissors, label: "AutoCut" },
  { icon: Clapperboard, label: "Create AI video" },
  { icon: Send, label: "Try Seedance 2.5" },
];

function AiLab() {
  return (
    <Screen>
      <div className="mt-5 flex justify-end">
        <span className="relative grid h-10 w-10 place-items-center rounded-full bg-surface-2">
          <History className="h-5 w-5" />
          <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-brand" />
        </span>
      </div>
      <h1 className="mt-6 font-display text-3xl leading-tight">WHAT ARE WE<br />CREATING TODAY?</h1>
      <div className="mt-5 rounded-3xl bg-surface p-2">
        <div className="relative flex h-40 gap-1 overflow-hidden rounded-2xl">
          {[p2, car, p1, p3, p2].map((src, i) => (
            <img key={i} src={src} alt="" loading="lazy" className="h-full flex-1 object-cover" />
          ))}
          <span className="absolute bottom-2 left-2 rounded bg-phone/70 px-1.5 text-[10px]">00:15</span>
        </div>
        <button className="flex w-full items-center justify-between px-2 py-3 text-sm text-ink-dim">
          Remix viral content <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 flex flex-col items-start gap-2">
        {actions.map((a) => (
          <button key={a.label} className="flex items-center gap-3 rounded-full bg-surface px-4 py-3 text-sm transition hover:bg-surface-2">
            <a.icon className="h-4 w-4 text-brand" /> {a.label}
          </button>
        ))}
      </div>
      <div className="mt-6 rounded-3xl bg-surface p-4">
        <input placeholder="Halloween 🎃" className="w-full bg-transparent text-sm outline-none placeholder:text-ink-dim" />
        <div className="mt-8 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-surface-2"><Plus className="h-4 w-4" /></span>
          <span className="grid h-9 w-9 place-items-center rounded-full border border-surface-2"><LayoutGrid className="h-4 w-4" /></span>
          <span className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-brand text-sky-ink"><Mic className="h-4 w-4" /></span>
        </div>
      </div>
    </Screen>
  );
}
