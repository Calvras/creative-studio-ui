export type MediaKind = "image" | "video" | "audio" | "document";

export type AspectId = "9:16" | "4:5" | "1:1" | "4:3" | "16:9" | "3:4";

export const ASPECTS: Record<AspectId, { label: string; ratio: number }> = {
  "9:16": { label: "9:16 · Reels", ratio: 9 / 16 },
  "4:5": { label: "4:5 · Feed", ratio: 4 / 5 },
  "1:1": { label: "1:1 · Square", ratio: 1 },
  "4:3": { label: "4:3 · Classic", ratio: 4 / 3 },
  "3:4": { label: "3:4 · Portrait", ratio: 3 / 4 },
  "16:9": { label: "16:9 · Wide", ratio: 16 / 9 },
};

export interface MediaAsset {
  id: string;
  kind: MediaKind;
  name: string;
  mime: string;
  size: number;
  duration?: number;
  width?: number;
  height?: number;
  thumb?: string;
  peaks?: number[];
}

export interface ClipAdjust {
  brightness: number;
  contrast: number;
  saturation: number;
  opacity: number;
}

export const DEFAULT_ADJUST: ClipAdjust = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  opacity: 100,
};

export interface VisualClip {
  id: string;
  assetId: string;
  start: number;
  duration: number;
  trimStart: number;
  speed: number;
  volume: number;
  muted: boolean;
  filter: string;
  adjust: ClipAdjust;
  animation: string | null;
  scale: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

export interface AudioTrack {
  id: string;
  assetId: string;
  start: number;
  duration: number;
  trimStart: number;
  volume: number;
  muted: boolean;
}

export type TextAlign = "left" | "center" | "right";

export interface Overlay {
  id: string;
  kind: "text" | "sticker";
  content: string;
  x: number;
  y: number;
  size: number;
  color: string;
  bold: boolean;
  italic: boolean;
  align: TextAlign;
  font: "sans" | "display" | "serif";
}

export type ProjectKind = "video" | "photo" | "document" | "mixed" | "audio" | "empty";

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  aspect: AspectId;
  background: string;
  media: MediaAsset[];
  clips: VisualClip[];
  audioTracks: AudioTrack[];
  overlays: Overlay[];
  duration: number;
  thumbnail?: string;
  kind: ProjectKind;
}

export interface Settings {
  displayName: string;
  defaultAspect: AspectId;
  autoSave: boolean;
  confirmDelete: boolean;
  trialStartedAt: string | null;
}

export const DEFAULT_SETTINGS: Settings = {
  displayName: "Creator",
  defaultAspect: "9:16",
  autoSave: true,
  confirmDelete: true,
  trialStartedAt: null,
};
