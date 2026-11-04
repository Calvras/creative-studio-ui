import { useSyncExternalStore } from "react";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/types";

const STORAGE_KEY = "editplus.settings.v1";

let cache: Settings | null = null;
const listeners = new Set<() => void>();

function read(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      displayName:
        typeof parsed.displayName === "string" && parsed.displayName.trim()
          ? parsed.displayName
          : DEFAULT_SETTINGS.displayName,
      defaultAspect: parsed.defaultAspect ?? DEFAULT_SETTINGS.defaultAspect,
      autoSave: parsed.autoSave ?? DEFAULT_SETTINGS.autoSave,
      confirmDelete: parsed.confirmDelete ?? DEFAULT_SETTINGS.confirmDelete,
      trialStartedAt: typeof parsed.trialStartedAt === "string" ? parsed.trialStartedAt : null,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function getSettings(): Settings {
  if (!cache) cache = read();
  return cache;
}

export function updateSettings(patch: Partial<Settings>): Settings {
  const next = { ...getSettings(), ...patch };
  cache = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage failures
    }
  }
  for (const listener of listeners) listener();
  return next;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, () => DEFAULT_SETTINGS);
}

export function trialDaysLeft(): number {
  const started = getSettings().trialStartedAt;
  if (!started) return 0;
  const startedAt = new Date(started).getTime();
  if (Number.isNaN(startedAt)) return 0;
  const endsAt = startedAt + 7 * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((endsAt - Date.now()) / (24 * 60 * 60 * 1000)));
}

export function startTrial(): void {
  if (!getSettings().trialStartedAt) updateSettings({ trialStartedAt: new Date().toISOString() });
}
