import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronRight,
  Film,
  FolderOpen,
  Gem,
  HardDrive,
  HelpCircle,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Screen, meta } from "@/components/bottom-nav";
import { useProjects } from "@/lib/projects-store";
import { useSettings } from "@/lib/settings";
import { storageUsage } from "@/lib/media-db";
import { formatBytes, formatDate } from "@/lib/format";

export const Route = createFileRoute("/me")({
  head: () => meta("Profile — Edro", "Your Edro profile, on-device storage and plan status."),
  component: Me,
});

function Me() {
  const projects = useProjects();
  const settings = useSettings();
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);

  useEffect(() => {
    let alive = true;
    storageUsage()
      .then((value) => {
        if (alive) setStorage(value);
      })
      .catch(() => {
        if (alive) setStorage({ usage: 0, quota: 0 });
      });
    return () => {
      alive = false;
    };
  }, [projects.length]);

  const clips = projects.reduce((sum, project) => sum + project.clips.length, 0);
  const assets = projects.reduce((sum, project) => sum + project.media.length, 0);
  const projectBytes = projects.reduce(
    (sum, project) => sum + project.media.reduce((inner, asset) => inner + asset.size, 0),
    0,
  );
  const mediaBytes = storage && storage.usage > 0 ? storage.usage : projectBytes;
  const usedPercent =
    storage && storage.quota > 0
      ? Math.min(100, Math.round((storage.usage / storage.quota) * 100))
      : 0;
  const trialStarted = Boolean(settings.trialStartedAt);

  return (
    <Screen>
      <div className="flex justify-end">
        <Link
          to="/settings"
          className="grid h-9 w-9 place-items-center rounded-full bg-surface-2"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-2 flex items-center gap-4">
        <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-brand text-sky-ink">
          <UserRound className="h-10 w-10" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-lg">{settings.displayName}</p>
          <p className="mt-0.5 text-[11px] text-ink-dim">
            Local creator · {projects.length} project{projects.length === 1 ? "" : "s"}
          </p>
          <Link to="/settings" className="mt-1.5 inline-flex items-center text-[11px] text-brand">
            Edit name & preferences <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Stat
          icon={<FolderOpen className="h-4 w-4" />}
          label="Projects"
          value={String(projects.length)}
        />
        <Stat icon={<Film className="h-4 w-4" />} label="Clips" value={String(clips)} />
        <Stat icon={<HardDrive className="h-4 w-4" />} label="Media" value={String(assets)} />
      </div>

      <div className="mt-4 rounded-3xl bg-surface p-4">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <HardDrive className="h-4 w-4 text-brand" /> Device storage
          </p>
          <p className="text-xs text-ink-dim">{formatBytes(mediaBytes)}</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${Math.max(2, usedPercent)}%` }}
          />
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-ink-dim">
          {storage && storage.quota > 0
            ? `${usedPercent}% of the browser storage this device allows. Media never leaves your device.`
            : "Media is stored in this browser. Clearing site data removes your projects."}
        </p>
      </div>

      <div className="mt-4 rounded-3xl bg-sky p-4 text-sky-ink">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 font-display text-lg">
              <Gem className="h-4 w-4" /> {trialStarted ? "CREATOR TRIAL" : "EDRO ULTRA"}
            </p>
            <p className="mt-1 text-xs opacity-75">
              {trialStarted
                ? "All local tools are unlocked while the trial is active."
                : "Try every local tool for 7 days. No card, no uploads."}
            </p>
          </div>
          <Link
            to="/premium"
            className="shrink-0 rounded-full bg-brand px-4 py-1.5 text-xs font-semibold"
          >
            {trialStarted ? "View" : "Start"}
          </Link>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl bg-surface">
        <Row
          to="/projects"
          icon={<FolderOpen className="h-4 w-4" />}
          label="All projects"
          value={`${projects.length}`}
        />
        <Row
          to="/ai-lab"
          icon={<Sparkles className="h-4 w-4" />}
          label="AI Lab"
          value="On-device"
        />
        <Row to="/settings" icon={<Settings className="h-4 w-4" />} label="Settings" />
        <Row to="/settings" icon={<ShieldCheck className="h-4 w-4" />} label="Privacy & data" />
        <Row to="/settings" icon={<HelpCircle className="h-4 w-4" />} label="Help & about" />
      </div>

      <p className="mt-5 text-center text-[10px] text-ink-dim">
        Member since{" "}
        {settings.trialStartedAt
          ? formatDate(settings.trialStartedAt)
          : formatDate(projects[projects.length - 1]?.createdAt ?? new Date().toISOString())}
      </p>
    </Screen>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface px-3 py-3 text-center">
      <span className="mx-auto grid h-8 w-8 place-items-center rounded-xl bg-surface-2 text-brand">
        {icon}
      </span>
      <p className="mt-2 font-display text-base leading-none">{value}</p>
      <p className="mt-1 text-[9px] uppercase tracking-wider text-ink-dim">{label}</p>
    </div>
  );
}

function Row({
  to,
  icon,
  label,
  value,
}: {
  to: "/projects" | "/ai-lab" | "/settings";
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 border-b border-ink/5 px-4 py-3.5 text-sm transition last:border-0 hover:bg-surface-2"
    >
      <span className="text-ink-dim">{icon}</span>
      <span className="flex-1">{label}</span>
      {value && <span className="text-[10px] text-ink-dim">{value}</span>}
      <ChevronRight className="h-4 w-4 text-ink-dim" />
    </Link>
  );
}
