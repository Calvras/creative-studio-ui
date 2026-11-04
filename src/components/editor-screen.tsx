import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Download,
  FileText,
  FolderOpen,
  LayoutGrid,
  Loader2,
  Maximize2,
  Minimize2,
  Music,
  Pause,
  Play,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Type,
  Undo2,
  Redo2,
  Volume2,
  VolumeX,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { ToolSearch } from "@/components/tool-search";
import { UploadSheet } from "@/components/upload-sheet";
import { EditorPanel, type EditorPanelActions } from "@/components/editor-panels";
import { BottomSheet, ConfirmDialog, EmptyState, Toast } from "@/components/ui/overlays";
import { animationClass, cssFilterForClip, transformForClip } from "@/lib/effects";
import {
  addMediaToProject,
  deleteProject,
  duplicateProject,
  getProject,
  hydrateProjectMedia,
  renameProject,
  reflowClips,
  updateProject,
  useProjects,
} from "@/lib/projects-store";
import { getSettings } from "@/lib/settings";
import type { MediaAsset, Overlay, Project, VisualClip } from "@/lib/types";
import { ASPECTS } from "@/lib/types";
import type { EditorTool, PanelId } from "@/lib/tool-registry";
import { CLIP_TOOL_IDS, MAIN_TOOL_IDS, PANEL_TITLE, getTool, toolById } from "@/lib/tool-registry";
import { clamp, formatClock, formatTime, uid } from "@/lib/format";
import { blobMediaKey, readTextPreview } from "@/lib/media";
import { getMedia } from "@/lib/media-db";

const BASE_PREVIEW_WIDTH = 390;
const MIN_CLIP = 0.3;

const DOCK_LABELS: Record<string, string> = {
  split: "Split",
  audio: "Volume",
  text: "Text",
  animate: "Animations",
  effects: "Effects",
  stickers: "Stickers",
  filters: "Filters",
  adjust: "Adjust",
  speed: "Speed",
  crop: "Crop",
  "duplicate-clip": "Duplicate",
  "extract-audio": "Extract",
  "delete-clip": "Delete",
};

function safeFileName(name: string): string {
  return (
    name
      .replace(/[^a-z0-9-_ ]/gi, "")
      .trim()
      .replace(/\s+/g, "-") || "editplus-export"
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function fontFamily(font: Overlay["font"]): string {
  if (font === "display") return '"Archivo Black", system-ui, sans-serif';
  if (font === "serif") return 'Georgia, "Times New Roman", serif';
  return '"Inter Tight", system-ui, sans-serif';
}

function usePreviewSize(
  hostRef: React.RefObject<HTMLDivElement | null>,
  ratio: number,
  layoutKey: string,
) {
  const [box, setBox] = useState({ width: 0, height: 0 });
  useEffect(() => {
    // The host mounts with the project and resizes when the timeline dock changes,
    // so re-measure for both. ResizeObserver is a safety net, not the only trigger.
    const host = hostRef.current;
    if (!host) return;
    const measure = () => {
      const availableWidth = Math.max(0, host.clientWidth - 24);
      const availableHeight = Math.max(0, host.clientHeight - 20);
      let width = Math.min(availableWidth, availableHeight * ratio);
      let height = width / ratio;
      if (height > availableHeight) {
        height = availableHeight;
        width = height * ratio;
      }
      setBox({ width: Math.floor(width), height: Math.floor(height) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [hostRef, ratio, layoutKey]);
  return box;
}

export function EditorScreen({
  projectId,
  initialTool,
}: {
  projectId?: string | undefined;
  initialTool?: string | undefined;
}) {
  const navigate = useNavigate();
  const projects = useProjects();
  const project = projectId ? (projects.find((item) => item.id === projectId) ?? null) : null;
  const [booted, setBooted] = useState(false);
  useEffect(() => setBooted(true), []);

  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const urlsRef = useRef<Record<string, string>>({});
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [panel, setPanel] = useState<PanelId | null>(null);
  const [immersive, setImmersive] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [pxPerSec, setPxPerSec] = useState(44);
  const [historyTick, setHistoryTick] = useState(0);

  const undoRef = useRef<Project[]>([]);
  const redoRef = useRef<Project[]>([]);
  const lastSnapshot = useRef(0);
  const timeRef = useRef(0);
  timeRef.current = currentTime;

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewHostRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRefs = useRef(new Map<string, HTMLAudioElement>());
  const audioInput = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ id: string; moved: boolean } | null>(null);
  const trimRef = useRef<{
    clipId: string;
    edge: "left" | "right";
    startX: number;
    original: VisualClip;
    prevEnd: number;
    nextStart: number;
    sourceLimit: number;
  } | null>(null);
  const appliedInitialTool = useRef(false);

  const clips = project?.clips ?? [];
  const audioTracks = project?.audioTracks ?? [];
  const overlays = project?.overlays ?? [];
  const ratio = project ? (ASPECTS[project.aspect]?.ratio ?? 9 / 16) : 9 / 16;
  const previewBox = usePreviewSize(
    previewHostRef,
    ratio,
    `${project?.id ?? ""}|${panel}|${selectedClipId ?? ""}|${immersive}`,
  );

  const activeClip = useMemo(() => {
    const hit = clips.find(
      (clip) => currentTime >= clip.start && currentTime < clip.start + clip.duration,
    );
    if (hit) return hit;
    // The playhead lands exactly on the timeline end after playback; keep the last
    // clip on screen instead of dropping to the empty state.
    const last = clips[clips.length - 1];
    return last && currentTime >= last.start + last.duration - 0.05 ? last : null;
  }, [clips, currentTime]);
  const selectedClip = clips.find((clip) => clip.id === selectedClipId) ?? null;
  const targetClip = selectedClip ?? activeClip ?? clips[0] ?? null;
  const targetAsset = project?.media.find((asset) => asset.id === targetClip?.assetId) ?? null;
  const activeAsset = project?.media.find((asset) => asset.id === activeClip?.assetId) ?? null;
  const activeAudio =
    audioTracks.find(
      (track) => currentTime >= track.start && currentTime < track.start + track.duration,
    ) ?? null;
  const previewAsset =
    activeAsset ??
    (activeAudio
      ? (project?.media.find((asset) => asset.id === activeAudio.assetId) ?? null)
      : null);
  const previewUrl = previewAsset ? mediaUrls[previewAsset.id] : undefined;

  // ── Load media blobs into object URLs ──────────────────────────────────────
  useEffect(() => {
    if (!project) return;
    let cancelled = false;
    void hydrateProjectMedia(project).then((urls) => {
      if (cancelled) {
        for (const url of Object.values(urls)) URL.revokeObjectURL(url);
        return;
      }
      Object.assign(urlsRef.current, urls);
      setMediaUrls((previous) => ({ ...previous, ...urls }));
    });
    return () => {
      cancelled = true;
    };
  }, [project?.id]);

  useEffect(() => {
    return () => {
      for (const url of Object.values(urlsRef.current)) URL.revokeObjectURL(url);
      urlsRef.current = {};
    };
  }, []);

  function mergeUrls(urls: Record<string, string>) {
    Object.assign(urlsRef.current, urls);
    setMediaUrls((previous) => ({ ...previous, ...urls }));
  }

  // ── History ───────────────────────────────────────────────────────────────
  const pushHistory = useCallback(() => {
    if (!projectId) return;
    const current = getProject(projectId);
    if (!current) return;
    undoRef.current.push(current);
    if (undoRef.current.length > 60) undoRef.current.shift();
    redoRef.current = [];
    lastSnapshot.current = Date.now();
    setHistoryTick((tick) => tick + 1);
  }, [projectId]);

  const apply = useCallback(
    (updater: (project: Project) => Project, history = true) => {
      if (!projectId) return;
      const current = getProject(projectId);
      if (!current) return;
      if (history && Date.now() - lastSnapshot.current > 250) pushHistory();
      updateProject(projectId, updater);
    },
    [projectId, pushHistory],
  );

  const undo = useCallback(() => {
    if (!projectId) return;
    const current = getProject(projectId);
    const previous = undoRef.current.pop();
    if (!current || !previous) {
      setToast("Nothing to undo");
      return;
    }
    redoRef.current.push(current);
    updateProject(projectId, () => previous);
    setCurrentTime((time) => Math.min(time, previous.duration));
    setSelectedClipId((id) => (previous.clips.some((clip) => clip.id === id) ? id : null));
    setHistoryTick((tick) => tick + 1);
    setToast("Undone");
  }, [projectId]);

  const redo = useCallback(() => {
    if (!projectId) return;
    const current = getProject(projectId);
    const next = redoRef.current.pop();
    if (!current || !next) {
      setToast("Nothing to redo");
      return;
    }
    undoRef.current.push(current);
    updateProject(projectId, () => next);
    setCurrentTime((time) => Math.min(time, next.duration));
    setHistoryTick((tick) => tick + 1);
    setToast("Redone");
  }, [projectId]);

  // ── Actions on the project ─────────────────────────────────────────────────
  const patchClip = useCallback(
    (clipId: string, patch: Partial<VisualClip>) => {
      apply((project) => ({
        ...project,
        clips: project.clips.map((clip) => (clip.id === clipId ? { ...clip, ...patch } : clip)),
      }));
    },
    [apply],
  );

  const patchOverlay = useCallback(
    (overlayId: string, patch: Partial<Overlay>) => {
      apply((project) => ({
        ...project,
        overlays: project.overlays.map((overlay) =>
          overlay.id === overlayId ? { ...overlay, ...patch } : overlay,
        ),
      }));
    },
    [apply],
  );

  const patchAudioTrack = useCallback(
    (trackId: string, patch: Partial<Project["audioTracks"][number]>) => {
      apply((project) => ({
        ...project,
        audioTracks: project.audioTracks.map((track) =>
          track.id === trackId ? { ...track, ...patch } : track,
        ),
      }));
    },
    [apply],
  );

  const addText = useCallback(() => {
    if (!projectId) return;
    const overlay: Overlay = {
      id: uid("text"),
      kind: "text",
      content: "Your text",
      x: 50,
      y: 50,
      size: 30,
      color: "#ffffff",
      bold: true,
      italic: false,
      align: "center",
      font: "display",
    };
    apply((project) => ({ ...project, overlays: [...project.overlays, overlay] }));
    setSelectedOverlayId(overlay.id);
    setSelectedClipId(null);
    setPanel("text");
  }, [apply, projectId]);

  const addSticker = useCallback(
    (emoji: string) => {
      const overlay: Overlay = {
        id: uid("sticker"),
        kind: "sticker",
        content: emoji,
        x: 50,
        y: 46,
        size: 54,
        color: "#ffffff",
        bold: false,
        italic: false,
        align: "center",
        font: "sans",
      };
      apply((project) => ({ ...project, overlays: [...project.overlays, overlay] }));
      setSelectedOverlayId(overlay.id);
      setSelectedClipId(null);
    },
    [apply],
  );

  const removeOverlay = useCallback(
    (overlayId: string) => {
      apply((project) => ({
        ...project,
        overlays: project.overlays.filter((overlay) => overlay.id !== overlayId),
      }));
      setSelectedOverlayId((id) => (id === overlayId ? null : id));
    },
    [apply],
  );

  const deleteClip = useCallback(() => {
    if (!selectedClipId) return;
    apply((project) => {
      const remaining = project.clips.filter((clip) => clip.id !== selectedClipId);
      return { ...project, clips: reflowClips(remaining) };
    });
    setSelectedClipId(null);
    setPanel(null);
    setToast("Clip deleted");
  }, [apply, selectedClipId]);

  const duplicateClip = useCallback(() => {
    if (!selectedClip) return;
    const copy: VisualClip = {
      ...selectedClip,
      id: uid("clip"),
      adjust: { ...selectedClip.adjust },
    };
    apply((project) => {
      const index = project.clips.findIndex((clip) => clip.id === selectedClip.id);
      const next = [...project.clips];
      next.splice(index + 1, 0, copy);
      return { ...project, clips: reflowClips(next) };
    });
    setSelectedClipId(copy.id);
    setToast("Clip duplicated");
  }, [apply, selectedClip]);

  const splitAtPlayhead = useCallback(() => {
    if (!project) return;
    const clip = project.clips.find(
      (item) => currentTime > item.start + 0.06 && currentTime < item.start + item.duration - 0.06,
    );
    if (!clip) {
      setToast("Move the playhead inside a clip, then tap Split");
      return;
    }
    const offset = currentTime - clip.start;
    const first: VisualClip = { ...clip, duration: Math.round(offset * 100) / 100 };
    const second: VisualClip = {
      ...clip,
      id: uid("clip"),
      start: Math.round(currentTime * 100) / 100,
      duration: Math.round((clip.duration - offset) * 100) / 100,
      trimStart: clip.trimStart + offset * clip.speed,
    };
    apply((project) => ({
      ...project,
      clips: project.clips.flatMap((item) => (item.id === clip.id ? [first, second] : [item])),
    }));
    setSelectedClipId(second.id);
    setToast("Clip split at the playhead");
  }, [apply, currentTime, project]);

  const setSpeed = useCallback(
    (speed: number) => {
      if (!targetClip) {
        setToast("Select a clip first");
        return;
      }
      const safeSpeed = clamp(Math.round(speed * 100) / 100, 0.25, 4);
      const sourceRemaining = targetClip.duration * targetClip.speed;
      const duration = Math.max(0.1, Math.round((sourceRemaining / safeSpeed) * 100) / 100);
      apply((project) => ({
        ...project,
        clips: reflowClips(
          project.clips.map((clip) =>
            clip.id === targetClip.id ? { ...clip, speed: safeSpeed, duration } : clip,
          ),
        ),
      }));
    },
    [apply, targetClip],
  );

  const resetClip = useCallback(() => {
    if (!targetClip) return;
    patchClip(targetClip.id, {
      adjust: { brightness: 100, contrast: 100, saturation: 100, opacity: 100 },
      filter: "none",
      rotation: 0,
      scale: 100,
      flipH: false,
      flipV: false,
      animation: null,
    });
  }, [patchClip, targetClip]);

  const extractAudio = useCallback(() => {
    if (!targetClip || targetAsset?.kind !== "video") {
      setToast("Select a video clip to extract audio");
      return;
    }
    if (project?.audioTracks.some((track) => track.assetId === targetAsset.id)) {
      setToast("That audio is already on a track");
      return;
    }
    apply((project) => ({
      ...project,
      audioTracks: [
        ...project.audioTracks,
        {
          id: uid("audio"),
          assetId: targetAsset.id,
          start: 0,
          duration: Math.max(0.3, targetClip.duration * targetClip.speed),
          trimStart: targetClip.trimStart,
          volume: targetClip.volume,
          muted: targetClip.muted,
        },
      ],
      clips: project.clips.map((clip) =>
        clip.id === targetClip.id ? { ...clip, muted: true } : clip,
      ),
    }));
    setPanel("audio");
    setToast("Audio extracted to a new track");
  }, [apply, project, targetAsset, targetClip]);

  // ── Playback ───────────────────────────────────────────────────────────────
  const duration = project?.duration ?? 0;

  useEffect(() => {
    setCurrentTime((time) => (project ? Math.min(time, project.duration) : 0));
  }, [project?.duration]);

  useEffect(() => {
    if (!playing || duration <= 0) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = (now - last) / 1000;
      last = now;
      setCurrentTime((time) => {
        const next = time + delta;
        if (next >= duration) {
          setPlaying(false);
          return duration;
        }
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, duration]);

  const togglePlay = useCallback(() => {
    if (duration <= 0) {
      setToast("Add media to the timeline first");
      return;
    }
    if (!playing && currentTime >= duration - 0.03) {
      setCurrentTime(0);
      timeRef.current = 0;
    }
    setPlaying((value) => !value);
  }, [currentTime, duration, playing]);

  // Seek the preview video when paused or when the playhead jumps.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeClip || activeAsset?.kind !== "video" || !activeAsset.duration) return;
    const sourceTime =
      activeClip.trimStart + Math.max(0, currentTime - activeClip.start) * activeClip.speed;
    const safe = clamp(sourceTime, 0, Math.max(0, activeAsset.duration - 0.05));
    if (Math.abs(video.currentTime - safe) > 0.35) {
      try {
        video.currentTime = safe;
      } catch {
        // metadata may not be ready yet
      }
    }
  }, [activeAsset, activeClip, currentTime]);

  // Play / pause the preview video.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeClip) return;
    video.volume = activeClip.muted ? 0 : activeClip.volume / 100;
    video.playbackRate = clamp(activeClip.speed, 0.25, 4);
    if (playing) void video.play().catch(() => undefined);
    else video.pause();
  }, [playing, activeClip?.id, activeClip?.muted, activeClip?.volume, activeClip?.speed]);

  // Audio tracks: start/stop at playhead, seek when paused.
  useEffect(() => {
    for (const track of audioTracks) {
      const element = audioRefs.current.get(track.id);
      const url = mediaUrls[track.assetId];
      if (!element || !url) continue;
      element.volume = track.muted ? 0 : track.volume / 100;
    }
  }, [audioTracks, mediaUrls]);

  useEffect(() => {
    const time = timeRef.current;
    for (const track of audioTracks) {
      const element = audioRefs.current.get(track.id);
      if (!element) continue;
      const within = time >= track.start && time < track.start + track.duration;
      if (playing && within) {
        const offset = track.trimStart + Math.max(0, time - track.start);
        if (Math.abs(element.currentTime - offset) > 0.4) {
          try {
            element.currentTime = offset;
          } catch {
            // ignore
          }
        }
        void element.play().catch(() => undefined);
      } else {
        element.pause();
      }
    }
  }, [playing, audioTracks]);

  // When paused, seek all tracks to the playhead.
  useEffect(() => {
    if (playing) return;
    for (const track of audioTracks) {
      const element = audioRefs.current.get(track.id);
      if (!element) continue;
      const within = currentTime >= track.start && currentTime < track.start + track.duration;
      if (!within) continue;
      const offset = track.trimStart + Math.max(0, currentTime - track.start);
      if (Math.abs(element.currentTime - offset) > 0.2) {
        try {
          element.currentTime = offset;
        } catch {
          // ignore
        }
      }
    }
  }, [currentTime, playing, audioTracks]);

  // Keep the playhead in view while playing.
  useEffect(() => {
    if (!playing) return;
    const scroll = scrollRef.current;
    if (!scroll) return;
    const x = currentTime * pxPerSec;
    const left = scroll.scrollLeft;
    const right = left + scroll.clientWidth;
    if (x < left + 24) scroll.scrollLeft = Math.max(0, x - 40);
    else if (x > right - 48) scroll.scrollLeft = x - scroll.clientWidth + 64;
  }, [currentTime, playing, pxPerSec]);

  // ── Tools ──────────────────────────────────────────────────────────────────
  const openPanelFor = useCallback((tool: EditorTool) => {
    if (tool.panel) {
      setPanel(tool.panel);
      if (tool.panel === "more") setSelectedClipId(null);
      return true;
    }
    return false;
  }, []);

  const runTool = useCallback(
    (tool: EditorTool) => {
      if (tool.needsClip && clips.length === 0) {
        setToast("Add media first, then select a clip");
        return;
      }
      if (tool.needsClip && !selectedClip && targetClip) setSelectedClipId(targetClip.id);
      if (tool.command) {
        switch (tool.command) {
          case "split":
            splitAtPlayhead();
            return;
          case "trim": {
            if (!targetClip) return;
            setSelectedClipId(targetClip.id);
            setToast("Drag the white handles on the clip's edges to trim");
            return;
          }
          case "deleteClip":
            deleteClip();
            return;
          case "duplicateClip":
            duplicateClip();
            return;
          case "addMedia":
            setUploadOpen(true);
            return;
          case "addAudio":
            audioInput.current?.click();
            return;
          case "mute": {
            if (targetClip) patchClip(targetClip.id, { muted: !targetClip.muted });
            return;
          }
          case "extractAudio":
            extractAudio();
            return;
          case "undo":
            undo();
            return;
          case "redo":
            redo();
            return;
          case "rotateLeft":
            if (targetClip)
              patchClip(targetClip.id, { rotation: (targetClip.rotation + 270) % 360 });
            return;
          case "rotateRight":
            if (targetClip)
              patchClip(targetClip.id, { rotation: (targetClip.rotation + 90) % 360 });
            return;
          case "flipH":
            if (targetClip) patchClip(targetClip.id, { flipH: !targetClip.flipH });
            return;
          case "flipV":
            if (targetClip) patchClip(targetClip.id, { flipV: !targetClip.flipV });
            return;
          case "rename":
            setRenameOpen(true);
            return;
          case "save":
            setToast("Draft saved on this device");
            return;
          default:
            return;
        }
      }
      openPanelFor(tool);
    },
    [
      clips.length,
      deleteClip,
      duplicateClip,
      extractAudio,
      openPanelFor,
      patchClip,
      redo,
      selectedClip,
      splitAtPlayhead,
      targetClip,
      undo,
    ],
  );

  useEffect(() => {
    if (appliedInitialTool.current || !project || !initialTool) return;
    const tool = getTool(initialTool);
    if (!tool) return;
    appliedInitialTool.current = true;
    if (tool.panel) {
      setPanel(tool.panel);
      if (tool.needsClip && clips[0]) setSelectedClipId(clips[0].id);
    } else if (tool.needsClip) {
      setSelectedClipId(clips[0]?.id ?? null);
      setToast(tool.how);
    } else if (tool.command === "addMedia") {
      setUploadOpen(true);
    } else {
      setToast(tool.how);
    }
  }, [clips, initialTool, project]);

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      )
        return;
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (event.code === "Space") {
        event.preventDefault();
        togglePlay();
        return;
      }
      if ((event.key === "Delete" || event.key === "Backspace") && selectedClipId) {
        event.preventDefault();
        deleteClip();
        return;
      }
      if (event.key === "Escape") {
        setPanel(null);
        setSearchOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleteClip, redo, selectedClipId, togglePlay, undo]);

  // ── Timeline interactions ──────────────────────────────────────────────────
  function seekFromEvent(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const time = (event.clientX - rect.left) / pxPerSec;
    setPlaying(false);
    setCurrentTime(clamp(time, 0, duration));
  }

  function beginTrim(
    event: React.PointerEvent<HTMLDivElement>,
    clip: VisualClip,
    edge: "left" | "right",
  ) {
    event.preventDefault();
    event.stopPropagation();
    setPlaying(false);
    setSelectedClipId(clip.id);
    setPanel(null);
    const sorted = [...clips].sort((a, b) => a.start - b.start);
    const index = sorted.findIndex((item) => item.id === clip.id);
    const prevEnd =
      index > 0 ? (sorted[index - 1]?.start ?? 0) + (sorted[index - 1]?.duration ?? 0) : 0;
    const nextStart = sorted[index + 1]?.start ?? Number.POSITIVE_INFINITY;
    const asset = project?.media.find((item) => item.id === clip.assetId);
    const sourceLimit =
      asset?.kind === "video" || asset?.kind === "audio"
        ? Math.max(0.3, ((asset.duration ?? clip.duration) - clip.trimStart) / clip.speed)
        : Math.max(clip.duration, 60);
    trimRef.current = {
      clipId: clip.id,
      edge,
      startX: event.clientX,
      original: clip,
      prevEnd,
      nextStart,
      sourceLimit,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    pushHistory();
  }

  function moveTrim(event: React.PointerEvent<HTMLDivElement>) {
    const trim = trimRef.current;
    if (!trim || !projectId) return;
    const delta = (event.clientX - trim.startX) / pxPerSec;
    const original = trim.original;
    if (trim.edge === "left") {
      const earliest = Math.max(trim.prevEnd, original.start - original.trimStart / original.speed);
      const newStart = clamp(
        original.start + delta,
        earliest,
        original.start + original.duration - MIN_CLIP,
      );
      const shift = newStart - original.start;
      updateProject(projectId, (project) => ({
        ...project,
        clips: project.clips.map((clip) =>
          clip.id === trim.clipId
            ? {
                ...clip,
                start: Math.round(newStart * 100) / 100,
                duration: Math.round((original.duration - shift) * 100) / 100,
                trimStart: Math.max(0, original.trimStart + shift * original.speed),
              }
            : clip,
        ),
      }));
    } else {
      const latestEnd = Math.min(
        original.start + trim.nextStart - 0.001,
        original.start + trim.sourceLimit,
      );
      const newDuration = clamp(
        original.duration + delta,
        MIN_CLIP,
        Math.max(MIN_CLIP, latestEnd - original.start),
      );
      updateProject(projectId, (project) => ({
        ...project,
        clips: project.clips.map((clip) =>
          clip.id === trim.clipId
            ? { ...clip, duration: Math.round(newDuration * 100) / 100 }
            : clip,
        ),
      }));
    }
    setHistoryTick((tick) => tick + 1);
  }

  // ── Export ─────────────────────────────────────────────────────────────────
  async function renderImage(width: number, format: "png" | "jpeg"): Promise<Blob | null> {
    if (!project) return null;
    const clip = targetClip ?? activeClip;
    const asset = clip ? project.media.find((item) => item.id === clip.assetId) : null;
    const url = asset ? mediaUrls[asset.id] : undefined;
    if (!clip || !asset || asset.kind !== "image" || !url) return null;

    const image = new Image();
    const loaded = new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Image could not be decoded"));
    });
    image.src = url;
    await loaded;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = Math.round(width / ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = project.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scale = Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    ctx.save();
    ctx.filter = cssFilterForClip(clip);
    ctx.globalAlpha = clip.adjust.opacity / 100;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    if (clip.rotation) ctx.rotate((clip.rotation * Math.PI) / 180);
    if (clip.scale !== 100) ctx.scale(clip.scale / 100, clip.scale / 100);
    ctx.scale(clip.flipH ? -1 : 1, clip.flipV ? -1 : 1);
    ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    drawOverlays(ctx, canvas.width, canvas.height);
    return new Promise((resolve) =>
      canvas.toBlob((blob) => resolve(blob), format === "png" ? "image/png" : "image/jpeg", 0.92),
    );
  }

  function drawOverlays(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (!project) return;
    for (const overlay of project.overlays) {
      const x = (overlay.x / 100) * width;
      const y = (overlay.y / 100) * height;
      const size = overlay.size * (width / BASE_PREVIEW_WIDTH);
      if (overlay.kind === "sticker") {
        ctx.save();
        ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(overlay.content, x, y);
        ctx.restore();
        continue;
      }
      ctx.save();
      ctx.font = `${overlay.italic ? "italic " : ""}${overlay.bold ? "700" : "400"} ${size}px ${fontFamily(overlay.font)}`;
      ctx.fillStyle = overlay.color;
      ctx.textAlign =
        overlay.align === "left" ? "left" : overlay.align === "right" ? "right" : "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = size * 0.25;
      const lines = overlay.content.split("\n");
      const lineHeight = size * 1.22;
      const startY = y - ((lines.length - 1) * lineHeight) / 2;
      lines.forEach((line, index) => ctx.fillText(line, x, startY + index * lineHeight));
      ctx.restore();
    }
  }

  async function exportImage(format: "png" | "jpeg", width: number) {
    setExporting(true);
    try {
      const blob = await renderImage(width, format);
      if (!blob) {
        setToast("This clip can't be exported as a photo");
        return;
      }
      downloadBlob(
        blob,
        `${safeFileName(project?.name ?? "editplus")}.${format === "png" ? "png" : "jpg"}`,
      );
      setToast("Photo exported");
    } catch {
      setToast("Export failed. Try a smaller size.");
    } finally {
      setExporting(false);
    }
  }

  async function exportFrame() {
    if (!project) return;
    const clip = targetClip ?? activeClip;
    const asset = clip ? project.media.find((item) => item.id === clip.assetId) : null;
    if (!clip || !asset) {
      setToast("Select a clip to export");
      return;
    }
    if (asset.kind === "image") {
      await exportImage("png", 1080);
      return;
    }
    if (asset.kind !== "video" || !videoRef.current) {
      setToast("Open a video clip to export a frame");
      return;
    }
    setExporting(true);
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = Math.round(1080 / ratio);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = project.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const scale = Math.min(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
      const drawWidth = video.videoWidth * scale;
      const drawHeight = video.videoHeight * scale;
      ctx.save();
      ctx.filter = cssFilterForClip(clip);
      ctx.globalAlpha = clip.adjust.opacity / 100;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      if (clip.rotation) ctx.rotate((clip.rotation * Math.PI) / 180);
      if (clip.scale !== 100) ctx.scale(clip.scale / 100, clip.scale / 100);
      ctx.scale(clip.flipH ? -1 : 1, clip.flipV ? -1 : 1);
      ctx.drawImage(video, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();
      drawOverlays(ctx, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (blob) downloadBlob(blob, `${safeFileName(project.name)}-frame.png`);
      setToast("Frame exported");
    } catch {
      setToast("Could not export this frame");
    } finally {
      setExporting(false);
    }
  }

  async function downloadOriginal() {
    if (!project) return;
    const asset = targetAsset ?? project.media[0];
    if (!asset) {
      setToast("No media to download");
      return;
    }
    try {
      const blob = await getMedia(blobMediaKey(asset.id));
      if (!blob) {
        setToast("Original file is no longer on this device");
        return;
      }
      downloadBlob(blob, asset.name);
      setToast("Original file downloaded");
    } catch {
      setToast("Could not read the original file");
    }
  }

  // ── Overlay drag ───────────────────────────────────────────────────────────
  function beginDrag(event: React.PointerEvent<HTMLDivElement>, overlay: Overlay) {
    event.stopPropagation();
    event.preventDefault();
    setPlaying(false);
    setSelectedOverlayId(overlay.id);
    setSelectedClipId(null);
    setPanel(overlay.kind === "text" ? "text" : "stickers");
    dragRef.current = { id: overlay.id, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 4, 96);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 4, 96);
    drag.moved = true;
    patchOverlay(drag.id, { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  }

  function endDrag() {
    dragRef.current = null;
  }

  // ── Adding media / audio ───────────────────────────────────────────────────
  async function addFiles(files: File[]) {
    if (!projectId) return;
    const result = await addMediaToProject(projectId, files);
    if (!result) return;
    mergeUrls(result.urls);
    setToast(`${files.length} file${files.length === 1 ? "" : "s"} added`);
  }

  async function addAudioFiles(files: File[]) {
    if (!projectId) return;
    const audioFiles = files.filter(
      (file) =>
        file.type.startsWith("audio/") || /\.(mp3|wav|m4a|aac|ogg|flac|opus)$/i.test(file.name),
    );
    if (audioFiles.length === 0) {
      setToast("Choose an audio file");
      return;
    }
    const result = await addMediaToProject(projectId, audioFiles);
    if (!result) return;
    mergeUrls(result.urls);
    setPanel("audio");
    setToast("Audio added at 00:00");
  }

  async function handleDeleteProject() {
    if (!project) return;
    setDeleteOpen(false);
    await deleteProject(project.id);
    navigate({ to: "/", replace: true });
  }

  async function handleDuplicateProject() {
    if (!project) return;
    setMenuOpen(false);
    const copy = await duplicateProject(project.id);
    if (copy) {
      navigate({ to: "/editor", search: { project: copy.id }, replace: true });
      setToast("Project duplicated");
    }
  }

  // ── Panel action bundle ────────────────────────────────────────────────────
  const panelActions: EditorPanelActions = {
    onPatchClip: (patch) => {
      if (targetClip) patchClip(targetClip.id, patch);
    },
    onPatchProject: (patch) => apply((current) => ({ ...current, ...patch })),
    onPatchAudio: patchAudioTrack,
    onRemoveAudio: (id) =>
      apply((current) => ({
        ...current,
        audioTracks: current.audioTracks.filter((track) => track.id !== id),
      })),
    onAddAudio: () => audioInput.current?.click(),
    onAddMedia: () => setUploadOpen(true),
    onAddText: addText,
    onAddSticker: addSticker,
    onPatchOverlay: patchOverlay,
    onRemoveOverlay: removeOverlay,
    onSelectOverlay: (id) => setSelectedOverlayId(id),
    onSetSpeed: setSpeed,
    onResetClip: resetClip,
    onExtractAudio: extractAudio,
    onOpenTool: (id) => {
      const tool = getTool(id);
      if (tool) runTool(tool);
    },
    onExport: (format, width) => void exportImage(format, width),
    onExportFrame: () => void exportFrame(),
    onDownloadOriginal: () => void downloadOriginal(),
    exporting,
  };

  // ── Early states ───────────────────────────────────────────────────────────
  if (projectId && !project) {
    if (!booted) {
      return (
        <div className="grid h-dvh place-items-center bg-phone text-ink">
          <Loader2 className="h-6 w-6 animate-spin text-ink-dim" />
        </div>
      );
    }
    return (
      <div className="relative flex h-dvh flex-col bg-phone text-ink">
        <EditorTopBar onBack={() => navigate({ to: "/" })} />
        <div className="flex flex-1 items-center justify-center px-6">
          <EmptyState
            icon={<FolderOpen className="h-7 w-7" />}
            title="Project not found"
            description="It may have been deleted from this device. Create a new project from the home screen."
            action={
              <Link
                to="/"
                className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-sky-ink"
              >
                Go home
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  if (!project) {
    return <EmptyEditor onCreate={(files) => void addFilesForEmpty(files)} />;
  }

  async function addFilesForEmpty(files: File[]) {
    const { createProjectFromFiles } = await import("@/lib/projects-store");
    const { project: created } = await createProjectFromFiles(files);
    navigate({ to: "/editor", search: { project: created.id }, replace: true });
  }

  const filter = activeClip ? cssFilterForClip(activeClip) : "none";
  const transform = activeClip ? transformForClip(activeClip) : "none";
  const mediaScale = previewBox.width / BASE_PREVIEW_WIDTH;
  const totalWidth = Math.max(duration * pxPerSec + 32, 280);
  const tickStep = duration / pxPerSec > 520 ? Math.ceil(duration / 24) : pxPerSec >= 32 ? 1 : 2;
  const ticks: number[] = [];
  for (let time = 0; time <= duration + 0.001; time += tickStep)
    ticks.push(Math.round(time * 100) / 100);
  const showClipTools = selectedClip !== null && panel === null;

  const clipTool = (id: string) => toolById(id);

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-phone text-ink">
      {/* Top bar */}
      {!immersive && (
        <div
          className="flex items-center gap-1 px-4 pb-2.5"
          style={{ paddingTop: "max(0.9rem, calc(env(safe-area-inset-top) + 0.55rem))" }}
        >
          <button
            onClick={() => navigate({ to: "/" })}
            className="-ml-1.5 grid h-11 w-11 place-items-center rounded-full text-ink active:opacity-70"
            aria-label="Back to projects"
          >
            <X className="h-[26px] w-[26px]" strokeWidth={1.7} />
          </button>
          <button
            onClick={() => setSearchOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-full text-ink active:opacity-70"
            aria-label="Search tools"
          >
            <Search className="h-[21px] w-[21px]" strokeWidth={1.8} />
          </button>
          <div className="flex-1" />
          <div className="relative">
            <button
              onClick={() => setMenuOpen((value) => !value)}
              className="flex h-10 items-center gap-1 rounded-xl bg-surface-2 px-3.5 text-[13px] font-medium text-ink active:scale-[0.97]"
              aria-label="Project menu"
              aria-expanded={menuOpen}
            >
              {project.aspect}
              <ChevronDown className="h-4 w-4 text-ink-dim" strokeWidth={2} />
            </button>
            {menuOpen && (
              <>
                <button
                  className="fixed inset-0 z-20 cursor-default"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                />
                <div
                  className="absolute right-0 top-12 z-30 min-w-[200px] overflow-hidden rounded-2xl bg-surface-2 py-1 shadow-xl ring-1 ring-white/10"
                  role="menu"
                >
                  {[
                    { id: "canvas", label: "Aspect ratio & background" },
                    { id: "rename", label: "Rename project" },
                    { id: "duplicate", label: "Duplicate project" },
                    { id: "save", label: "Save draft" },
                    { id: "delete", label: "Delete project" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        if (item.id === "canvas") setPanel("canvas");
                        if (item.id === "rename") setRenameOpen(true);
                        if (item.id === "duplicate") void handleDuplicateProject();
                        if (item.id === "save") setToast("Draft saved on this device");
                        if (item.id === "delete") setDeleteOpen(true);
                      }}
                      className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs transition hover:bg-surface ${item.id === "delete" ? "text-red-400" : "text-ink"}`}
                    >
                      {item.id === "delete" && <Trash2 className="h-3.5 w-3.5" />}
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setPanel("export")}
            className="ml-1 flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-[13px] font-semibold text-sky-ink active:scale-[0.97]"
          >
            <Download className="h-4 w-4" strokeWidth={2.2} />
            Export
          </button>
        </div>
      )}

      {/* Preview */}
      <div
        ref={previewHostRef}
        className={`relative flex min-h-[120px] flex-1 items-center justify-center ${immersive ? "px-2 py-1" : "px-5 py-1"}`}
      >
        {previewBox.width > 0 && (
          <div
            ref={previewRef}
            className="relative overflow-hidden rounded-[4px] shadow-[0_18px_50px_rgba(0,0,0,0.45)] ring-1 ring-white/10"
            style={{
              width: previewBox.width,
              height: previewBox.height,
              background: project.background,
            }}
            onClick={(event) => {
              if (event.target === event.currentTarget) setSelectedOverlayId(null);
            }}
          >
            {activeClip && previewAsset && previewUrl ? (
              <div
                key={activeClip.id}
                className={`h-full w-full ${animationClass(activeClip.animation)}`}
              >
                {previewAsset.kind === "video" ? (
                  <video
                    key={`${activeClip.id}-${activeClip.animation ?? "static"}`}
                    ref={videoRef}
                    src={previewUrl}
                    poster={previewAsset.thumb}
                    playsInline
                    preload="auto"
                    className="pointer-events-none h-full w-full object-contain"
                    style={{ filter, transform, opacity: activeClip.adjust.opacity / 100 }}
                    onEnded={() => setPlaying(false)}
                  />
                ) : previewAsset.kind === "image" ? (
                  <img
                    src={previewUrl}
                    alt=""
                    draggable={false}
                    className="pointer-events-none h-full w-full object-contain"
                    style={{ filter, transform, opacity: activeClip.adjust.opacity / 100 }}
                  />
                ) : (
                  <DocumentPreview asset={previewAsset} url={previewUrl} />
                )}
              </div>
            ) : previewAsset && previewUrl ? (
              previewAsset.kind === "audio" || !activeClip ? (
                <AudioArtwork asset={previewAsset} playing={playing} />
              ) : (
                <DocumentPreview asset={previewAsset} url={previewUrl} />
              )
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-ink-dim">
                <Clapperboard className="h-8 w-8" />
                <p className="text-xs font-medium text-ink">{project.name}</p>
                <p className="text-[10px]">Add media to start editing</p>
              </div>
            )}

            {/* text & sticker overlays */}
            {overlays.map((overlay) => {
              const selected = overlay.id === selectedOverlayId;
              return (
                <div
                  key={overlay.id}
                  onPointerDown={(event) => beginDrag(event, overlay)}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  className={`absolute max-w-[92%] cursor-grab touch-none select-none active:cursor-grabbing ${
                    selected ? "outline outline-1 outline-dashed outline-brand" : ""
                  }`}
                  style={{
                    left: `${overlay.x}%`,
                    top: `${overlay.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {overlay.kind === "text" ? (
                    <span
                      className="inline-block whitespace-pre-wrap px-1"
                      style={{
                        color: overlay.color,
                        fontSize: Math.max(8, overlay.size * mediaScale),
                        fontWeight: overlay.bold ? 700 : 400,
                        fontStyle: overlay.italic ? "italic" : "normal",
                        textAlign: overlay.align,
                        fontFamily: fontFamily(overlay.font),
                        textShadow: "0 1px 8px rgba(0,0,0,0.55)",
                        lineHeight: 1.2,
                      }}
                    >
                      {overlay.content || " "}
                    </span>
                  ) : (
                    <span
                      style={{ fontSize: Math.max(16, overlay.size * mediaScale), lineHeight: 1 }}
                    >
                      {overlay.content}
                    </span>
                  )}
                </div>
              );
            })}

            {activeClip && (
              <div className="pointer-events-none absolute bottom-2 left-2 flex flex-wrap gap-1">
                <span className="rounded bg-black/55 px-1.5 py-0.5 text-[8px] text-white/90">
                  {previewAsset?.name ?? "Clip"}
                </span>
                {previewAsset?.kind === "video" && (
                  <span className="rounded bg-black/55 px-1.5 py-0.5 text-[8px] text-white/90">
                    Video
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transport row */}
      <div className="grid shrink-0 grid-cols-3 items-center px-5 py-2.5">
        <div className="flex justify-start">
          <button
            onClick={() => setImmersive((value) => !value)}
            className="grid h-10 w-10 place-items-center rounded-full text-ink active:opacity-70"
            aria-label={immersive ? "Exit full screen" : "Full screen preview"}
          >
            {immersive ? (
              <Minimize2 className="h-[21px] w-[21px]" strokeWidth={1.7} />
            ) : (
              <Maximize2 className="h-[21px] w-[21px]" strokeWidth={1.7} />
            )}
          </button>
        </div>
        <div className="flex justify-center">
          <button
            onClick={togglePlay}
            className="grid h-12 w-12 place-items-center rounded-full text-ink active:scale-95"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <Pause className="h-7 w-7 fill-current" strokeWidth={1.4} />
            ) : (
              <Play className="h-7 w-7 translate-x-[2px] fill-current" strokeWidth={1.4} />
            )}
          </button>
        </div>
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => navigate({ to: "/ai-lab" })}
            className="grid h-10 w-10 place-items-center rounded-full text-ink active:opacity-70"
            aria-label="Open AI Lab"
          >
            <Sparkles className="h-[19px] w-[19px]" strokeWidth={1.6} />
          </button>
          <button
            onClick={undo}
            className="grid h-10 w-10 place-items-center rounded-full text-ink active:opacity-70 disabled:opacity-30"
            aria-label="Undo"
            disabled={undoRef.current.length === 0}
            key={`undo-${historyTick}`}
          >
            <Undo2 className="h-[19px] w-[19px]" strokeWidth={1.6} />
          </button>
          <button
            onClick={redo}
            className="grid h-10 w-10 place-items-center rounded-full text-ink active:opacity-70 disabled:opacity-30"
            aria-label="Redo"
            disabled={redoRef.current.length === 0}
            key={`redo-${historyTick}`}
          >
            <Redo2 className="h-[19px] w-[19px]" strokeWidth={1.6} />
          </button>
        </div>
      </div>

      {/* Timeline — hidden while a tool panel is open so the panel never clips. */}
      {panel === null && !immersive && (
        <div className="mt-1 shrink-0 border-t border-white/[0.06] pt-1.5">
          <div className="flex items-center gap-1 px-4 pb-1">
            <span className="text-[11px] tabular-nums text-ink-dim">
              <span className="text-ink">{formatClock(currentTime)}</span> / {formatTime(duration)}
            </span>
            <div className="ml-auto flex items-center gap-0.5">
              <button
                onClick={() => setUploadOpen(true)}
                className="grid h-8 w-8 place-items-center rounded-full text-ink-dim active:bg-surface-2"
                aria-label="Add media"
              >
                <Plus className="h-[17px] w-[17px]" strokeWidth={1.8} />
              </button>
              <button
                onClick={() => setPxPerSec((value) => clamp(value - 10, 16, 140))}
                className="grid h-8 w-8 place-items-center rounded-full text-ink-dim active:bg-surface-2"
                aria-label="Zoom out timeline"
              >
                <ZoomOut className="h-4 w-4" strokeWidth={1.8} />
              </button>
              <button
                onClick={() => setPxPerSec((value) => clamp(value + 10, 16, 140))}
                className="grid h-8 w-8 place-items-center rounded-full text-ink-dim active:bg-surface-2"
                aria-label="Zoom in timeline"
              >
                <ZoomIn className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>
          </div>

          <div className="flex">
            <div className="flex w-[62px] shrink-0 flex-col pl-2 pr-1.5">
              <div className="h-5" />
              <button
                onClick={() => targetClip && patchClip(targetClip.id, { muted: !targetClip.muted })}
                disabled={!targetClip}
                className="mt-1 flex h-[56px] flex-col items-center justify-center gap-1 rounded-xl text-ink-dim transition active:bg-surface-2 disabled:opacity-35"
                aria-label={targetClip?.muted ? "Unmute clip audio" : "Mute clip audio"}
              >
                {targetClip?.muted ? (
                  <VolumeX className="h-[18px] w-[18px]" strokeWidth={1.6} />
                ) : (
                  <Volume2 className="h-[18px] w-[18px]" strokeWidth={1.6} />
                )}
                <span className="px-0.5 text-center text-[8.5px] leading-tight">
                  {targetClip?.muted ? "Unmute" : "Mute clip"}
                  <br />
                  audio
                </span>
              </button>
              <button
                onClick={() => setPanel("audio")}
                className="mt-1.5 grid h-9 place-items-center rounded-lg bg-surface/70 text-ink-dim active:bg-surface-2"
                aria-label="Music tracks"
              >
                <Music className="h-[17px] w-[17px]" strokeWidth={1.7} />
              </button>
              <button
                onClick={addText}
                className="mt-1.5 grid h-9 place-items-center rounded-lg bg-surface/70 text-ink-dim active:bg-surface-2"
                aria-label="Add text"
              >
                <Type className="h-[17px] w-[17px]" strokeWidth={1.7} />
              </button>
            </div>
            <div
              ref={scrollRef}
              className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain pb-2 pr-4 [scrollbar-width:none]"
            >
              <div
                className="relative min-w-full"
                style={{ width: Math.max(totalWidth + 32, 288) }}
              >
                {/* ruler */}
                <div
                  className="relative h-5 cursor-ew-resize touch-none select-none"
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    seekFromEvent(event);
                  }}
                  onPointerMove={(event) => {
                    if (event.buttons === 1) seekFromEvent(event);
                  }}
                >
                  {ticks.map((time) => (
                    <span
                      key={time}
                      className="absolute top-0 text-[9px] tabular-nums text-ink-dim"
                      style={{ left: time * pxPerSec }}
                    >
                      {time === 0 ? "0s" : formatTime(time)}
                      <span className="absolute left-0 top-3.5 h-1.5 w-px bg-ink/25" />
                    </span>
                  ))}
                </div>

                {/* visual track */}
                <div className="relative mt-1 h-[56px] rounded-md bg-surface/50">
                  {clips.length === 0 && (
                    <button
                      onClick={() => setUploadOpen(true)}
                      className="absolute inset-1.5 flex items-center justify-center gap-1.5 rounded border border-dashed border-ink/15 text-[10px] text-ink-dim"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add photo, video or file
                    </button>
                  )}
                  {clips.map((clip) => {
                    const asset = project.media.find((item) => item.id === clip.assetId);
                    const selected = clip.id === selectedClipId;
                    const width = Math.max(26, clip.duration * pxPerSec);
                    return (
                      <div
                        key={clip.id}
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          event.stopPropagation();
                          setPanel(null);
                          setSelectedClipId(selected ? null : clip.id);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") setSelectedClipId(selected ? null : clip.id);
                        }}
                        className={`absolute top-0 h-full overflow-hidden rounded-md border-2 bg-surface-2 ${
                          selected ? "border-brand" : "border-transparent"
                        }`}
                        style={{ left: clip.start * pxPerSec, width }}
                        aria-label={`${asset?.name ?? "Clip"} ${formatTime(clip.duration)}`}
                      >
                        {asset?.thumb ? (
                          <img
                            src={asset.thumb}
                            alt=""
                            className="h-full w-full object-cover opacity-85"
                            draggable={false}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-ink-dim">
                            {asset?.kind === "document" ? (
                              <FileText className="h-4 w-4" />
                            ) : (
                              <Clapperboard className="h-4 w-4" />
                            )}
                          </div>
                        )}
                        <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1 pt-3 text-[9px] text-white">
                          {asset?.name ?? "Clip"}
                        </span>
                        {clip.animation && (
                          <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[7px] text-white">
                            fx
                          </span>
                        )}
                        {clip.muted && (
                          <span className="absolute right-1 top-1 rounded bg-black/60 px-1 text-[7px] text-white">
                            mute
                          </span>
                        )}
                        {selected && (
                          <>
                            <div
                              role="slider"
                              tabIndex={0}
                              aria-label="Trim clip start"
                              onPointerDown={(event) => beginTrim(event, clip, "left")}
                              onPointerMove={moveTrim}
                              onPointerUp={() => {
                                trimRef.current = null;
                              }}
                              className="absolute inset-y-0 left-0 z-10 flex w-3.5 cursor-ew-resize touch-none items-center justify-center bg-brand/90"
                            >
                              <span className="h-4 w-0.5 rounded bg-white/90" />
                            </div>
                            <div
                              role="slider"
                              tabIndex={0}
                              aria-label="Trim clip end"
                              onPointerDown={(event) => beginTrim(event, clip, "right")}
                              onPointerMove={moveTrim}
                              onPointerUp={() => {
                                trimRef.current = null;
                              }}
                              className="absolute inset-y-0 right-0 z-10 flex w-3.5 cursor-ew-resize touch-none items-center justify-center bg-brand/90"
                            >
                              <span className="h-4 w-0.5 rounded bg-white/90" />
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}

                  {clips.length > 0 && (
                    <button
                      onClick={() => setUploadOpen(true)}
                      style={{ left: duration * pxPerSec + 8 }}
                      className="absolute top-1 grid h-11 w-10 place-items-center rounded-md bg-white text-black shadow-md active:scale-95"
                      aria-label="Add clip"
                    >
                      <Plus className="h-5 w-5" strokeWidth={2.4} />
                    </button>
                  )}

                  {/* playhead */}
                  <div
                    className="pointer-events-none absolute -top-4 bottom-0 z-20 w-px bg-white"
                    style={{ left: currentTime * pxPerSec }}
                  >
                    <span className="absolute -left-1 -top-0.5 h-2.5 w-2.5 rounded-sm bg-white" />
                  </div>
                </div>

                {/* add rows */}
                <button
                  onClick={() => setPanel("audio")}
                  className="mt-1.5 flex h-9 w-full items-center gap-2 rounded-md bg-surface/60 px-3 text-[11px] text-ink-dim transition active:bg-surface"
                >
                  <Plus className="h-4 w-4" strokeWidth={1.8} /> Add audio
                </button>
                <button
                  onClick={addText}
                  className="mt-1.5 flex h-9 w-full items-center gap-2 rounded-md bg-surface/60 px-3 text-[11px] text-ink-dim transition active:bg-surface"
                >
                  <Plus className="h-4 w-4" strokeWidth={1.8} /> Add text
                </button>

                {/* audio tracks */}
                {audioTracks.slice(0, 2).map((track) => {
                  const asset = project.media.find((item) => item.id === track.assetId);
                  return (
                    <button
                      key={track.id}
                      onClick={() => {
                        setPanel("audio");
                        setSelectedClipId(null);
                      }}
                      className="relative mt-1.5 flex h-9 w-full items-center overflow-hidden rounded-md bg-surface/70 text-left"
                      aria-label={`Audio track ${asset?.name ?? ""}`}
                    >
                      {asset?.thumb && (
                        <img
                          src={asset.thumb}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover opacity-25"
                        />
                      )}
                      <span className="relative flex min-w-0 items-center gap-1.5 px-2.5 text-[9px] text-ink">
                        <Music className="h-3 w-3 text-brand" />
                        <span className="truncate">{asset?.name ?? "Audio track"}</span>
                      </span>
                      <span
                        className="absolute inset-y-1 rounded-sm bg-brand/35"
                        style={{
                          left: track.start * pxPerSec,
                          width: Math.max(24, track.duration * pxPerSec),
                        }}
                      />
                      <div
                        className="pointer-events-none absolute inset-y-0 z-10 w-px bg-white"
                        style={{ left: currentTime * pxPerSec }}
                      />
                    </button>
                  );
                })}

                {audioTracks.length > 2 && (
                  <button
                    onClick={() => setPanel("audio")}
                    className="mt-1.5 w-full rounded-md bg-surface/60 py-1.5 text-[9px] text-ink-dim"
                  >
                    +{audioTracks.length - 2} more audio tracks — open Audio
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom tools */}
      <div
        className="shrink-0 bg-phone"
        style={{ paddingBottom: "max(0.7rem, env(safe-area-inset-bottom))" }}
      >
        {panel !== null ? (
          <div className="max-h-[46dvh] overflow-y-auto overscroll-contain px-4 pb-1 pt-3 [scrollbar-width:none]">
            <div className="mb-3.5 flex items-center gap-2.5">
              <button
                onClick={() => setPanel(null)}
                className="grid h-9 w-9 place-items-center rounded-full bg-surface-2"
                aria-label="Back to tools"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={1.8} />
              </button>
              <span className="min-w-0 truncate text-[15px] font-semibold">
                {PANEL_TITLE[panel]}
              </span>
              {targetAsset && (
                <span className="ml-auto max-w-[34%] truncate text-[10px] text-ink-dim">
                  {targetAsset.name}
                </span>
              )}
              <button
                onClick={() => setPanel(null)}
                className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-surface-2"
                aria-label="Close panel"
              >
                <Check className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
            <EditorPanel
              panel={panel}
              project={project}
              clip={targetClip}
              clipAsset={targetAsset}
              selectedOverlayId={selectedOverlayId}
              actions={panelActions}
            />
          </div>
        ) : (
          <div className="flex items-stretch gap-2 px-3 pt-2">
            {showClipTools && (
              <button
                onClick={() => setSelectedClipId(null)}
                className="grid w-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink active:scale-95"
                aria-label="Back to project tools"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={1.8} />
              </button>
            )}
            <div className="flex min-w-0 flex-1 gap-3 overflow-x-auto pb-0.5 [scrollbar-width:none]">
              {(showClipTools ? CLIP_TOOL_IDS : MAIN_TOOL_IDS).map((id) => {
                const tool = clipTool(id);
                const Icon = tool.icon;
                return (
                  <button
                    key={id}
                    onClick={() => runTool(tool)}
                    className={`flex w-[54px] shrink-0 flex-col items-center gap-2 py-0.5 transition active:scale-95 ${
                      tool.command === "deleteClip" ? "text-red-400" : "text-ink"
                    }`}
                  >
                    <Icon className="h-[21px] w-[21px]" strokeWidth={1.6} />
                    <span className="whitespace-nowrap text-[10px] leading-none">
                      {DOCK_LABELS[id] ?? tool.label}
                    </span>
                  </button>
                );
              })}
              {!showClipTools && (
                <button
                  onClick={() => {
                    setPanel("more");
                    setSelectedClipId(null);
                  }}
                  className="flex w-[54px] shrink-0 flex-col items-center gap-2 py-0.5 text-ink-dim transition active:scale-95"
                >
                  <LayoutGrid className="h-[21px] w-[21px]" strokeWidth={1.6} />
                  <span className="whitespace-nowrap text-[10px] leading-none">All tools</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* hidden audio elements + inputs */}
      {audioTracks.map((track) => {
        const url = mediaUrls[track.assetId];
        if (!url) return null;
        return (
          <audio
            key={track.id}
            ref={(element) => {
              if (element) audioRefs.current.set(track.id, element);
              else audioRefs.current.delete(track.id);
            }}
            src={url}
            preload="auto"
            className="hidden"
          />
        );
      })}
      <input
        ref={audioInput}
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length > 0) void addAudioFiles(files);
        }}
      />

      <ToolSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onPick={runTool}
        hasClip={clips.length > 0}
        hint={`${clips.length} clip${clips.length === 1 ? "" : "s"} · ${formatTime(duration)} timeline`}
      />

      <UploadSheet
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onFiles={addFiles}
        mode="add"
      />

      <BottomSheet open={renameOpen} onClose={() => setRenameOpen(false)} title="Rename project">
        <input
          defaultValue={project.name}
          key={project.id}
          autoFocus
          onChange={(event) => {
            const value = event.target.value;
            if (value.trim()) renameProject(project.id, value);
          }}
          className="w-full rounded-xl bg-surface-2 px-4 py-3 text-sm outline-none ring-brand/60 focus:ring-1"
        />
        <button
          onClick={() => setRenameOpen(false)}
          className="mt-4 w-full rounded-full bg-brand py-3 text-sm font-semibold text-sky-ink"
        >
          Done
        </button>
      </BottomSheet>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete project?"
        message={`“${project.name}” and all of its media will be removed from this device. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void handleDeleteProject()}
      />

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

function EditorTopBar({ onBack }: { onBack: () => void }) {
  return (
    <div
      className="flex items-center gap-1.5 px-5 pb-3"
      style={{ paddingTop: "max(0.85rem, calc(env(safe-area-inset-top) + 0.5rem))" }}
    >
      <button
        onClick={onBack}
        className="-ml-2 grid h-10 w-10 place-items-center rounded-full"
        aria-label="Back"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <span className="text-sm font-semibold tracking-wide">Edro</span>
    </div>
  );
}

function DocumentPreview({ asset, url }: { asset: MediaAsset; url: string }) {
  const [text, setText] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const isPdf = asset.mime === "application/pdf" || /\.pdf$/i.test(asset.name);
  const isText = asset.mime.startsWith("text/") || /\.(txt|md|csv|json)$/i.test(asset.name);

  useEffect(() => {
    if (!isText) return;
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const preview = await readTextPreview(blob);
        if (!cancelled) setText(preview);
      } catch {
        if (!cancelled) setFailed(true);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [isText, url]);

  if (isPdf) {
    return <iframe src={url} title={asset.name} className="h-full w-full border-0 bg-white" />;
  }

  if (isText) {
    return (
      <div className="h-full w-full overflow-auto bg-[#111] p-4">
        {failed ? (
          <p className="text-xs text-ink-dim">Preview unavailable.</p>
        ) : (
          <pre className="whitespace-pre-wrap break-words font-sans text-[11px] leading-relaxed text-ink">
            {text ?? "Loading…"}
          </pre>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-5 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-brand">
        <FileText className="h-6 w-6" />
      </span>
      <div>
        <p className="text-xs font-semibold text-ink">{asset.name}</p>
        <p className="mt-0.5 text-[10px] text-ink-dim">This file type can't be previewed inline.</p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="rounded-full bg-surface-2 px-4 py-2 text-[11px] text-ink"
      >
        Open original file
      </a>
    </div>
  );
}

function AudioArtwork({ asset, playing }: { asset: MediaAsset; playing: boolean }) {
  const peaks =
    asset.peaks ??
    Array.from({ length: 48 }, (_, index) => 0.25 + Math.abs(Math.sin(index * 1.7)) * 0.65);
  return (
    <div className="relative h-full w-full overflow-hidden">
      {asset.thumb && (
        <img
          src={asset.thumb}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/70" />
      <div className="relative flex h-full flex-col items-center justify-center gap-4 px-6">
        <div className="flex h-16 items-center gap-[3px]">
          {peaks.slice(0, 36).map((peak, index) => (
            <span
              key={index}
              className={`w-[3px] rounded-full ${playing ? "bg-brand" : "bg-white/70"}`}
              style={{ height: `${Math.max(8, peak * 62)}px` }}
            />
          ))}
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-white">{asset.name}</p>
          <p className="mt-1 text-[10px] text-white/70">
            Audio · {formatTime(asset.duration ?? 0)}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyEditor({ onCreate }: { onCreate: (files: File[]) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-phone text-ink">
      <div
        className="flex-1 overflow-y-auto px-5"
        style={{
          paddingTop: "max(1rem, calc(env(safe-area-inset-top) + 0.5rem))",
          paddingBottom: "2rem",
        }}
      >
        <div className="mt-8 flex items-center justify-center gap-2">
          <img src="/edro-logo.jpg" alt="" className="h-9 w-9 rounded-xl object-cover" />
          <span className="font-display text-xl">Edro</span>
        </div>
        <EmptyState
          icon={<Clapperboard className="h-7 w-7" />}
          title="Nothing open yet"
          description="Choose a photo, video, audio file or document to start a project. Everything stays on this device."
          action={
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-sky-ink"
            >
              <Plus className="h-4 w-4" /> Choose media
            </button>
          }
        />
        <Link
          to="/"
          className="mx-auto mt-2 block w-fit rounded-full border border-surface-2 px-5 py-2 text-xs text-ink-dim"
        >
          Back to projects
        </Link>
      </div>
      <UploadSheet
        open={open}
        onClose={() => setOpen(false)}
        onFiles={(files) => onCreate(files)}
      />
    </div>
  );
}
