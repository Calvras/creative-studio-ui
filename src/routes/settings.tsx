import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, HardDrive, RotateCcw } from "lucide-react";
import { meta } from "@/components/bottom-nav";
import { ConfirmDialog, Toast } from "@/components/ui/overlays";
import { useSettings, updateSettings } from "@/lib/settings";
import { useProjects } from "@/lib/projects-store";
import { clearMedia, storageUsage } from "@/lib/media-db";
import { formatBytes } from "@/lib/format";
import { ASPECTS, type AspectId } from "@/lib/types";

export const Route = createFileRoute("/settings")({
  head: () => meta("Settings — Edro", "Account name, default canvas, storage and app data."),
  component: SettingsPage,
});

const APP_VERSION = "1.0.0";
const PROJECT_KEY = "editplus.projects.v2";
const SETTINGS_KEY = "editplus.settings.v1";

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`relative h-6 w-11 rounded-full transition ${on ? "bg-brand" : "bg-surface-2"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-ink transition-all ${on ? "left-[22px]" : "left-0.5"}`}
      />
    </button>
  );
}

function SettingsPage() {
  const settings = useSettings();
  const projects = useProjects();
  const [name, setName] = useState(settings.displayName);
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    storageUsage()
      .then(setStorage)
      .catch(() => setStorage({ usage: 0, quota: 0 }));
  }, [projects.length]);

  const projectBytes = projects.reduce(
    (sum, project) => sum + project.media.reduce((inner, asset) => inner + asset.size, 0),
    0,
  );
  const usage = storage && storage.usage > 0 ? storage.usage : projectBytes;

  function commitName() {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(settings.displayName);
      return;
    }
    if (trimmed !== settings.displayName) {
      updateSettings({ displayName: trimmed });
      setToast("Name updated");
    }
  }

  async function resetData() {
    try {
      await clearMedia();
    } catch {
      // Storage may already be empty or unavailable.
    }
    try {
      window.localStorage.removeItem(PROJECT_KEY);
      window.localStorage.removeItem(SETTINGS_KEY);
    } catch {
      // Ignore storage failures.
    }
    setConfirmReset(false);
    window.location.reload();
  }

  return (
    <div
      className="min-h-dvh w-full bg-phone px-5 text-ink"
      style={{
        paddingTop: "max(1.25rem, calc(env(safe-area-inset-top) + 0.5rem))",
        paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom))",
      }}
    >
      <div className="relative flex items-center justify-center py-5">
        <Link
          to="/me"
          className="absolute left-0 grid h-9 w-9 place-items-center rounded-full bg-surface-2"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-lg">SETTINGS</h1>
      </div>

      <h2 className="mb-2 mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-dim">
        Account
      </h2>
      <div className="overflow-hidden rounded-2xl bg-surface">
        <div className="flex items-center justify-between gap-4 px-4 py-3.5">
          <span className="text-sm">Display name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={commitName}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            maxLength={32}
            className="w-40 rounded-lg bg-surface-2 px-3 py-1.5 text-right text-sm outline-none ring-brand/60 focus:ring-1"
          />
        </div>
      </div>

      <h2 className="mb-2 mt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-dim">
        Editor
      </h2>
      <div className="overflow-hidden rounded-2xl bg-surface">
        <div className="px-4 py-3.5">
          <p className="text-sm">Default canvas</p>
          <p className="mt-0.5 text-[10px] text-ink-dim">Used when a new project is created.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(ASPECTS) as AspectId[]).map((aspect) => (
              <button
                key={aspect}
                onClick={() => updateSettings({ defaultAspect: aspect })}
                className={`rounded-full px-3 py-1.5 text-[11px] transition ${
                  settings.defaultAspect === aspect
                    ? "bg-brand text-sky-ink"
                    : "bg-surface-2 text-ink-dim"
                }`}
              >
                {ASPECTS[aspect].label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-ink/5 px-4 py-3.5 text-sm">
          <span>Confirm before deleting</span>
          <Toggle
            label="Confirm before deleting"
            on={settings.confirmDelete}
            onClick={() => updateSettings({ confirmDelete: !settings.confirmDelete })}
          />
        </div>
      </div>

      <h2 className="mb-2 mt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-dim">
        Storage
      </h2>
      <div className="overflow-hidden rounded-2xl bg-surface">
        <div className="flex items-center justify-between px-4 py-3.5 text-sm">
          <span className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" /> Media on this device
          </span>
          <span className="text-xs text-ink-dim">{formatBytes(usage)}</span>
        </div>
        <button
          onClick={() => setConfirmReset(true)}
          className="flex w-full items-center gap-2 border-t border-ink/5 px-4 py-3.5 text-left text-sm text-red-400 transition hover:bg-surface-2"
        >
          <RotateCcw className="h-4 w-4" /> Clear all app data
        </button>
      </div>
      <p className="mt-2 px-1 text-[10px] leading-relaxed text-ink-dim">
        Projects and media live in this browser only. Clearing site data or app data removes them
        permanently.
      </p>

      <h2 className="mb-2 mt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-dim">
        About
      </h2>
      <div className="divide-y divide-ink/5 overflow-hidden rounded-2xl bg-surface">
        <Link
          to="/premium"
          className="flex items-center justify-between px-4 py-3.5 text-sm transition hover:bg-surface-2"
        >
          <span>Edro Ultra</span>
          <ChevronRight className="h-4 w-4 text-ink-dim" />
        </Link>
        <div className="flex items-center justify-between px-4 py-3.5 text-sm">
          <span>Version</span>
          <span className="text-xs text-ink-dim">{APP_VERSION}</span>
        </div>
        <a
          href="https://support.apple.com/guide/iphone/add-a-website-to-your-home-screen-iph42e4a1f1d/ios"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-4 py-3.5 text-sm transition hover:bg-surface-2"
        >
          <span>Add to Home Screen</span>
          <ChevronRight className="h-4 w-4 text-ink-dim" />
        </a>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Clear all app data?"
        message={`This removes ${projects.length} project${projects.length === 1 ? "" : "s"} and every imported file from this device. It cannot be undone.`}
        confirmLabel="Clear everything"
        destructive
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => void resetData()}
      />

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
