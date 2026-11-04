import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ArrowUpDown, MoreHorizontal, ChevronRight, Inbox, Plus, UserRound } from "lucide-react";
import { Screen, meta } from "@/components/bottom-nav";

export const Route = createFileRoute("/projects")({
  head: () => meta("Projects — EDIT+", "Browse your local projects, spaces, media and trash."),
  component: Projects,
});

const tabs = ["Local", "Spaces", "Media", "Trash"];
const chips = ["All", "Video", "Photo", "Template", "Camera"];

function Projects() {
  const [tab, setTab] = useState("Local");
  const [chip, setChip] = useState("All");
  return (
    <Screen>
      <div className="mt-6 flex items-center justify-between">
        <h1 className="font-display text-2xl">PROJECTS</h1>
        <div className="flex gap-2">
          {[Search, ArrowUpDown, MoreHorizontal].map((I, i) => (
            <span key={i} className="grid h-9 w-9 place-items-center rounded-full bg-surface-2"><I className="h-4 w-4" /></span>
          ))}
        </div>
      </div>
      <button className="mt-5 flex w-full items-center gap-3 rounded-3xl bg-sky p-3 text-left text-sky-ink">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-sky-ink text-sky"><UserRound className="h-7 w-7" /></span>
        <div className="flex-1">
          <p className="font-display text-sm">CREATE AI CHARACTER</p>
          <p className="text-xs opacity-70">Star yourself, pets, and more in videos</p>
        </div>
        <ChevronRight className="h-5 w-5" />
      </button>
      <div className="mt-6 flex gap-6 border-b border-surface-2">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`pb-2 text-sm ${tab === t ? "border-b-2 border-brand text-ink" : "text-ink-dim"}`}>{t}</button>
        ))}
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto [scrollbar-width:none]">
        {chips.map((c) => (
          <button key={c} onClick={() => setChip(c)} className={`shrink-0 rounded-full px-4 py-1.5 text-xs ${chip === c ? "bg-brand text-sky-ink" : "border border-surface-2 text-ink-dim"}`}>{c}</button>
        ))}
      </div>
      <div className="mt-24 flex flex-col items-center text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-surface"><Inbox className="h-8 w-8 text-ink-dim" /></span>
        <p className="mt-4 font-semibold">No projects yet</p>
        <p className="text-xs text-ink-dim">Your projects will appear here.</p>
        <Link to="/editor" className="mt-5 flex items-center gap-2 rounded-full border border-ink/70 px-6 py-2 text-sm"><Plus className="h-4 w-4" />Create</Link>
      </div>
      <Link to="/editor" className="absolute bottom-24 right-5 z-10 flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-sky-ink shadow-lg">
        <Plus className="h-4 w-4" /> Create
      </Link>
    </Screen>
  );
}
