import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Settings, ChevronRight, Gem, ImagePlus, LayoutGrid, Sparkles, Wand2, Trophy, Bookmark, History, HelpCircle, ScanLine, UserRound } from "lucide-react";
import { Screen, meta } from "@/components/bottom-nav";

export const Route = createFileRoute("/me")({
  head: () => meta("Profile — EDIT+", "Your EDIT+ profile, plan and favourites."),
  component: Me,
});

const perks = [
  { icon: ImagePlus, label: "Materials" }, { icon: LayoutGrid, label: "Pro tools" },
  { icon: Sparkles, label: "AI effects" }, { icon: Wand2, label: "Retouch" },
];
const groups = [
  [{ icon: Trophy, label: "Events" }, { icon: Bookmark, label: "Likes & Favorites" }, { icon: History, label: "View history" }],
  [{ icon: HelpCircle, label: "Help Center" }],
  [{ icon: ScanLine, label: "Scan" }],
];

function Me() {
  return (
    <Screen>
      <div className="mt-5 flex justify-end gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2"><Bell className="h-4 w-4" /></span>
        <Link to="/settings" className="grid h-9 w-9 place-items-center rounded-full bg-surface-2"><Settings className="h-4 w-4" /></Link>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-brand text-sky-ink"><UserRound className="h-10 w-10" /></span>
        <div>
          <p className="font-display text-lg">USER9616831</p>
          <button className="flex items-center text-xs text-ink-dim">View profile <ChevronRight className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="mt-6 rounded-3xl bg-sky p-4 text-sky-ink">
        <div className="flex items-start justify-between">
          <div>
            <p className="flex items-center gap-1.5 font-display text-lg"><Gem className="h-4 w-4" />STANDARD</p>
            <p className="text-xs opacity-70">Start Standard for only $0.49</p>
          </div>
          <Link to="/premium" className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold">Claim offer</Link>
        </div>
        <div className="mt-5 grid grid-cols-4">
          {perks.map((p) => (
            <div key={p.label} className="flex flex-col items-center gap-1.5">
              <p.icon className="h-5 w-5" /><span className="text-[10px]">{p.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {groups.map((g, i) => (
          <div key={i} className="overflow-hidden rounded-2xl bg-surface">
            {g.map((it) => (
              <button key={it.label} className="flex w-full items-center gap-3 px-4 py-3.5 text-sm transition hover:bg-surface-2">
                <it.icon className="h-5 w-5" /> <span className="flex-1 text-left">{it.label}</span>
                <ChevronRight className="h-4 w-4 text-ink-dim" />
              </button>
            ))}
          </div>
        ))}
      </div>
    </Screen>
  );
}
