import { useSyncExternalStore } from "react";
import type { MediaAsset, Project, VisualClip } from "@/lib/types";
import { ASPECTS, DEFAULT_ADJUST, type AspectId } from "@/lib/types";
import { baseName, uid } from "@/lib/format";
import { blobMediaKey, createAssetFromFile, projectKindFor } from "@/lib/media";
import { deleteMedia, getMedia, putMedia } from "@/lib/media-db";
import { getSettings } from "@/lib/settings";

const STORAGE_KEY = "editplus.projects.v2";
const EMPTY: Project[] = [];

let cache: Project[] | null = null;
const listeners = new Set<() => void>();

function readStorage(): Project[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter(isProject);
  } catch {
    return EMPTY;
  }
}

function isProject(value: unknown): value is Project {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<Project>;
  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    Array.isArray(p.media) &&
    Array.isArray(p.clips) &&
    Array.isArray(p.audioTracks) &&
    Array.isArray(p.overlays)
  );
}

function ensureLoaded(): Project[] {
  if (!cache) cache = readStorage();
  return cache;
}

function persist(projects: Project[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // Quota exceeded: keep the in-memory state usable for this session.
  }
}

function emit(): void {
  for (const listener of listeners) listener();
}

function setProjects(projects: Project[]): void {
  cache = projects;
  persist(projects);
  emit();
}

export function getProjects(): Project[] {
  return ensureLoaded();
}

export function getProject(id: string | undefined): Project | null {
  if (!id) return null;
  return ensureLoaded().find((p) => p.id === id) ?? null;
}

export function getLatestProject(): Project | null {
  return ensureLoaded()[0] ?? null;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cache = readStorage();
    emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useProjects(): Project[] {
  return useSyncExternalStore(subscribe, getProjects, () => EMPTY);
}

export function computeDuration(clips: VisualClip[], audio: Project["audioTracks"]): number {
  let end = 0;
  for (const clip of clips) end = Math.max(end, clip.start + clip.duration);
  for (const track of audio) end = Math.max(end, track.start + track.duration);
  return Math.round(end * 100) / 100;
}

export function reflowClips(clips: VisualClip[]): VisualClip[] {
  let cursor = 0;
  return clips.map((clip) => {
    const next = { ...clip, start: Math.round(cursor * 1000) / 1000 };
    cursor += clip.duration;
    return next;
  });
}

function clipForAsset(asset: MediaAsset, start: number): VisualClip {
  const duration = Math.max(
    0.4,
    asset.kind === "video" ? (asset.duration ?? 5) : asset.kind === "image" ? 4 : 5,
  );
  return {
    id: uid("clip"),
    assetId: asset.id,
    start,
    duration: Math.round(duration * 100) / 100,
    trimStart: 0,
    speed: 1,
    volume: 100,
    muted: false,
    filter: "none",
    adjust: { ...DEFAULT_ADJUST },
    animation: null,
    scale: 100,
    rotation: 0,
    flipH: false,
    flipV: false,
  };
}

function buildProject(name: string, assets: MediaAsset[], aspect: AspectId): Project {
  let cursor = 0;
  const clips: VisualClip[] = [];
  const audioTracks: Project["audioTracks"] = [];

  for (const asset of assets) {
    if (asset.kind === "audio") {
      audioTracks.push({
        id: uid("audio"),
        assetId: asset.id,
        start: 0,
        duration: Math.max(0.4, asset.duration ?? 5),
        trimStart: 0,
        volume: 80,
        muted: false,
      });
    } else {
      const clip = clipForAsset(asset, cursor);
      clips.push(clip);
      cursor += clip.duration;
    }
  }

  const now = new Date().toISOString();
  const thumbnail = assets.find((a) => a.thumb)?.thumb;
  const project: Project = {
    id: uid("project"),
    name,
    createdAt: now,
    updatedAt: now,
    aspect,
    background: "#0b0b0c",
    media: assets,
    clips,
    audioTracks,
    overlays: [],
    duration: computeDuration(clips, audioTracks),
    kind: projectKindFor(assets),
  };
  if (thumbnail) project.thumbnail = thumbnail;
  return project;
}

export async function createProjectFromFiles(
  files: File[],
  options?: { name?: string; aspect?: AspectId },
): Promise<{ project: Project; urls: Record<string, string> }> {
  const settings = getSettings();
  const assets: MediaAsset[] = [];
  const urls: Record<string, string> = {};

  for (const file of files) {
    const asset = await createAssetFromFile(file);
    await putMedia(blobMediaKey(asset.id), file);
    assets.push(asset);
    urls[asset.id] = URL.createObjectURL(file);
  }

  const first = files[0];
  const fallbackName = first ? baseName(first.name) : "Untitled project";
  const name =
    options?.name?.trim() ||
    (files.length > 1 ? `${fallbackName} +${files.length - 1}` : fallbackName);
  const project = buildProject(name, assets, options?.aspect ?? settings.defaultAspect);
  setProjects([project, ...ensureLoaded()]);
  return { project, urls };
}

export async function addMediaToProject(
  projectId: string,
  files: File[],
): Promise<{ project: Project; urls: Record<string, string> } | null> {
  const current = getProject(projectId);
  if (!current) return null;

  const added: MediaAsset[] = [];
  const urls: Record<string, string> = {};
  for (const file of files) {
    const asset = await createAssetFromFile(file);
    await putMedia(blobMediaKey(asset.id), file);
    added.push(asset);
    urls[asset.id] = URL.createObjectURL(file);
  }

  let cursor = current.clips.reduce((max, clip) => Math.max(max, clip.start + clip.duration), 0);
  const clips = [...current.clips];
  const audioTracks = [...current.audioTracks];

  for (const asset of added) {
    if (asset.kind === "audio") {
      audioTracks.push({
        id: uid("audio"),
        assetId: asset.id,
        start: 0,
        duration: Math.max(0.4, asset.duration ?? 5),
        trimStart: 0,
        volume: 80,
        muted: false,
      });
    } else {
      const clip = clipForAsset(asset, cursor);
      clips.push(clip);
      cursor += clip.duration;
    }
  }

  const media = [...current.media, ...added];
  const next: Project = {
    ...current,
    media,
    clips,
    audioTracks,
    duration: computeDuration(clips, audioTracks),
    kind: projectKindFor(media),
    updatedAt: new Date().toISOString(),
  };
  if (!next.thumbnail) {
    const thumb = added.find((a) => a.thumb)?.thumb;
    if (thumb) next.thumbnail = thumb;
  }
  setProjects(ensureLoaded().map((p) => (p.id === projectId ? next : p)));
  return { project: next, urls };
}

export function updateProject(
  projectId: string,
  updater: (project: Project) => Project,
): Project | null {
  const current = getProject(projectId);
  if (!current) return null;
  const draft = updater(current);
  const next: Project = {
    ...draft,
    duration: computeDuration(draft.clips, draft.audioTracks),
    updatedAt: new Date().toISOString(),
  };
  setProjects(ensureLoaded().map((p) => (p.id === projectId ? next : p)));
  return next;
}

export function renameProject(projectId: string, name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  updateProject(projectId, (p) => ({ ...p, name: trimmed }));
}

export async function deleteProject(projectId: string): Promise<void> {
  const project = getProject(projectId);
  if (!project) return;
  setProjects(ensureLoaded().filter((p) => p.id !== projectId));
  await deleteMedia(project.media.map((asset) => blobMediaKey(asset.id)));
}

export async function duplicateProject(projectId: string): Promise<Project | null> {
  const source = getProject(projectId);
  if (!source) return null;

  const media: MediaAsset[] = [];
  const assetIdMap = new Map<string, string>();
  for (const asset of source.media) {
    const blob = await getMedia(blobMediaKey(asset.id));
    const nextId = uid("media");
    if (blob) await putMedia(blobMediaKey(nextId), blob);
    assetIdMap.set(asset.id, nextId);
    media.push({ ...asset, id: nextId });
  }

  const now = new Date().toISOString();
  const copy: Project = {
    ...source,
    id: uid("project"),
    name: `${source.name} copy`,
    createdAt: now,
    updatedAt: now,
    media,
    clips: source.clips.map((clip) => ({
      ...clip,
      id: uid("clip"),
      assetId: assetIdMap.get(clip.assetId) ?? clip.assetId,
      adjust: { ...clip.adjust },
    })),
    audioTracks: source.audioTracks.map((track) => ({
      ...track,
      id: uid("audio"),
      assetId: assetIdMap.get(track.assetId) ?? track.assetId,
    })),
    overlays: source.overlays.map((overlay) => ({ ...overlay, id: uid("overlay") })),
  };
  setProjects([copy, ...ensureLoaded()]);
  return copy;
}

export async function hydrateProjectMedia(project: Project): Promise<Record<string, string>> {
  const urls: Record<string, string> = {};
  await Promise.all(
    project.media.map(async (asset) => {
      const blob = await getMedia(blobMediaKey(asset.id));
      if (blob) urls[asset.id] = URL.createObjectURL(blob);
    }),
  );
  return urls;
}

export function aspectRatio(aspect: AspectId): number {
  return ASPECTS[aspect]?.ratio ?? 9 / 16;
}
