import type { MediaAsset, MediaKind } from "@/lib/types";
import { baseName, uid } from "@/lib/format";

const DOC_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "txt",
  "md",
  "rtf",
  "csv",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "key",
  "pages",
  "numbers",
  "json",
]);

const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "heic",
  "heif",
  "avif",
  "bmp",
  "svg",
]);
const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "m4v", "webm", "avi", "mkv", "ogv"]);
const AUDIO_EXTENSIONS = new Set(["mp3", "wav", "m4a", "aac", "ogg", "oga", "flac", "opus"]);

export function extensionOf(name: string): string {
  const match = /\.([^.\\/]+)$/.exec(name);
  return match?.[1]?.toLowerCase() ?? "";
}

export function classifyFile(file: File): MediaKind {
  const type = file.type.toLowerCase();
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (type === "application/pdf") return "document";
  const ext = extensionOf(file.name);
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (VIDEO_EXTENSIONS.has(ext)) return "video";
  if (AUDIO_EXTENSIONS.has(ext)) return "audio";
  if (DOC_EXTENSIONS.has(ext)) return "document";
  return type.startsWith("text/") ? "document" : "document";
}

export function acceptFor(kind: MediaKind | "all"): string {
  switch (kind) {
    case "image":
      return "image/*";
    case "video":
      return "video/*";
    case "audio":
      return "audio/*";
    case "document":
      return ".pdf,.doc,.docx,.txt,.md,.rtf,.csv,.ppt,.pptx,.xls,.xlsx,.json,application/pdf,text/plain";
    default:
      return "image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.md,.rtf,.csv,.ppt,.pptx,.xls,.xlsx,.json";
  }
}

export function kindLabel(kind: MediaKind): string {
  return kind === "document" ? "File" : kind.charAt(0).toUpperCase() + kind.slice(1);
}

function waitForEvent(target: HTMLMediaElement, event: string, timeout = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out loading ${event}`));
    }, timeout);
    const onDone = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("The browser could not read this file"));
    };
    function cleanup() {
      window.clearTimeout(timer);
      target.removeEventListener(event, onDone);
      target.removeEventListener("error", onError);
    }
    target.addEventListener(event, onDone, { once: true });
    target.addEventListener("error", onError, { once: true });
  });
}

function drawToDataUrl(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  draw(ctx);
  return canvas.toDataURL("image/jpeg", 0.78);
}

function coverDraw(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sw: number,
  sh: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const scale = Math.max(dw / sw, dh / sh);
  const w = sw * scale;
  const h = sh * scale;
  ctx.drawImage(source, dx + (dw - w) / 2, dy + (dh - h) / 2, w, h);
}

function makeDocumentThumb(file: File): string {
  const ext = (extensionOf(file.name) || "FILE").toUpperCase().slice(0, 4);
  const label = baseName(file.name);
  return drawToDataUrl(360, 360, (ctx) => {
    const gradient = ctx.createLinearGradient(0, 0, 360, 360);
    gradient.addColorStop(0, "#23201e");
    gradient.addColorStop(1, "#151312");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 360, 360);
    ctx.fillStyle = "#f7f3ee";
    ctx.beginPath();
    ctx.roundRect(96, 64, 168, 210, 18);
    ctx.fill();
    ctx.fillStyle = "#e8ded4";
    ctx.beginPath();
    ctx.moveTo(220, 64);
    ctx.lineTo(264, 108);
    ctx.lineTo(220, 108);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#e4682c";
    ctx.font = "bold 44px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(ext, 180, 208);
    ctx.fillStyle = "#7c746d";
    ctx.font = "500 16px system-ui, sans-serif";
    ctx.fillText(label.slice(0, 22), 180, 250, 132);
  });
}

function makeAudioThumb(name: string, peaks: number[]): string {
  return drawToDataUrl(360, 360, (ctx) => {
    const gradient = ctx.createLinearGradient(0, 0, 360, 360);
    gradient.addColorStop(0, "#201a16");
    gradient.addColorStop(1, "#121110");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 360, 360);
    const bars =
      peaks.length > 0
        ? peaks
        : Array.from(
            { length: 36 },
            (_, i) => 0.2 + Math.abs(Math.sin(i * 1.9 + name.length)) * 0.7,
          );
    const count = 36;
    const gap = 4;
    const barWidth = (264 - gap * (count - 1)) / count;
    ctx.fillStyle = "#e4682c";
    for (let i = 0; i < count; i++) {
      const value = bars[Math.floor((i / count) * bars.length)] ?? 0.3;
      const h = Math.max(8, value * 180);
      ctx.beginPath();
      ctx.roundRect(48 + i * (barWidth + gap), 180 - h / 2, barWidth, h, barWidth / 2);
      ctx.fill();
    }
    ctx.fillStyle = "#f7f3ee";
    ctx.font = "600 15px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(baseName(name).slice(0, 24), 180, 300, 260);
  });
}

let audioContext: AudioContext | null = null;
function getAudioContext(): AudioContext {
  if (!audioContext) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioContext = new Ctor();
  }
  return audioContext;
}

async function computePeaks(file: File, count = 48): Promise<number[]> {
  if (file.size > 40 * 1024 * 1024) return [];
  try {
    const buffer = await file.arrayBuffer();
    const ctx = getAudioContext();
    const decoded = await ctx.decodeAudioData(buffer.slice(0));
    const data = decoded.getChannelData(0);
    const block = Math.max(1, Math.floor(data.length / count));
    const peaks: number[] = [];
    for (let i = 0; i < count; i++) {
      let max = 0;
      const start = i * block;
      const end = Math.min(data.length, start + block);
      for (let j = start; j < end; j += 16) {
        const value = Math.abs(data[j] ?? 0);
        if (value > max) max = value;
      }
      peaks.push(Math.min(1, max));
    }
    const loudest = Math.max(0.001, ...peaks);
    return peaks.map((p) => p / loudest);
  } catch {
    return [];
  }
}

async function imageMeta(
  file: File,
): Promise<{ width: number; height: number; thumb: string; duration?: number }> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    const loaded = new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Image could not be decoded"));
    });
    image.src = url;
    await loaded;
    const width = image.naturalWidth || 1;
    const height = image.naturalHeight || 1;
    const thumb = drawToDataUrl(360, 360, (ctx) => {
      ctx.fillStyle = "#121212";
      ctx.fillRect(0, 0, 360, 360);
      coverDraw(ctx, image, width, height, 0, 0, 360, 360);
    });
    return { width, height, thumb };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function videoMeta(
  file: File,
): Promise<{ width: number; height: number; duration: number; thumb: string }> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.src = url;
  try {
    await waitForEvent(video, "loadedmetadata");
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const width = video.videoWidth || 1;
    const height = video.videoHeight || 1;
    let thumb = "";
    try {
      await waitForEvent(video, "loadeddata");
      const seekTo = duration > 0.4 ? Math.min(0.35, duration / 3) : 0;
      if (seekTo > 0) {
        video.currentTime = seekTo;
        await waitForEvent(video, "seeked", 5000);
      }
      thumb = drawToDataUrl(360, 360, (ctx) => {
        ctx.fillStyle = "#121212";
        ctx.fillRect(0, 0, 360, 360);
        coverDraw(ctx, video, width, height, 0, 0, 360, 360);
      });
    } catch {
      thumb = "";
    }
    return { width, height, duration, thumb };
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

async function audioMeta(
  file: File,
): Promise<{ duration: number; peaks: number[]; thumb: string }> {
  const url = URL.createObjectURL(file);
  const audio = document.createElement("audio");
  audio.preload = "metadata";
  audio.src = url;
  let duration = 0;
  try {
    await waitForEvent(audio, "loadedmetadata");
    duration = Number.isFinite(audio.duration) ? audio.duration : 0;
  } catch {
    duration = 0;
  } finally {
    audio.removeAttribute("src");
    audio.load();
    URL.revokeObjectURL(url);
  }
  const peaks = await computePeaks(file);
  return { duration, peaks, thumb: makeAudioThumb(file.name, peaks) };
}

export async function createAssetFromFile(file: File): Promise<MediaAsset> {
  const kind = classifyFile(file);
  const base: MediaAsset = {
    id: uid("media"),
    kind,
    name: file.name,
    mime: file.type || "application/octet-stream",
    size: file.size,
  };

  if (kind === "image") {
    try {
      const meta = await imageMeta(file);
      return { ...base, width: meta.width, height: meta.height, thumb: meta.thumb };
    } catch {
      return base;
    }
  }

  if (kind === "video") {
    try {
      const meta = await videoMeta(file);
      return {
        ...base,
        width: meta.width,
        height: meta.height,
        duration: meta.duration,
        thumb: meta.thumb,
      };
    } catch {
      return base;
    }
  }

  if (kind === "audio") {
    try {
      const meta = await audioMeta(file);
      return { ...base, duration: meta.duration, peaks: meta.peaks, thumb: meta.thumb };
    } catch {
      return base;
    }
  }

  return { ...base, thumb: makeDocumentThumb(file) };
}

export async function readTextPreview(blob: Blob, maxBytes = 200_000): Promise<string> {
  const slice = blob.slice(0, maxBytes);
  const text = await slice.text();
  return text;
}

export function blobMediaKey(assetId: string): string {
  return `asset:${assetId}`;
}

export function projectKindFor(
  assets: MediaAsset[],
): "video" | "photo" | "document" | "mixed" | "audio" | "empty" {
  const kinds = new Set(assets.map((a) => a.kind));
  if (kinds.size === 0) return "empty";
  if (kinds.size === 1) {
    const only = [...kinds][0];
    if (only === "image") return "photo";
    if (only === "video") return "video";
    if (only === "audio") return "audio";
    return "document";
  }
  return "mixed";
}
