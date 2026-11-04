import type { LucideIcon } from "lucide-react";
import {
  AudioLines,
  Copy,
  Crop,
  Download,
  FlipHorizontal,
  FlipVertical,
  Filter,
  Gauge,
  ImagePlus,
  Inspect,
  Layers,
  Music,
  Pencil,
  Plus,
  Redo2,
  RotateCcw,
  RotateCw,
  Save,
  Scissors,
  SlidersHorizontal,
  Smile,
  Sparkles,
  Trash2,
  Type,
  Undo2,
  Volume2,
  VolumeX,
  Wand2,
} from "lucide-react";

export type PanelId =
  | "audio"
  | "text"
  | "stickers"
  | "animate"
  | "effects"
  | "filters"
  | "adjust"
  | "crop"
  | "speed"
  | "canvas"
  | "export"
  | "more";

export type CommandId =
  | "split"
  | "trim"
  | "deleteClip"
  | "duplicateClip"
  | "addMedia"
  | "addAudio"
  | "mute"
  | "extractAudio"
  | "undo"
  | "redo"
  | "rotateLeft"
  | "rotateRight"
  | "flipH"
  | "flipV"
  | "rename"
  | "save";

export type ToolCategory =
  "Timeline" | "Audio" | "Text" | "Color" | "Transform" | "Canvas" | "Project";

export interface EditorTool {
  id: string;
  label: string;
  category: ToolCategory;
  icon: LucideIcon;
  summary: string;
  how: string;
  keywords: string[];
  panel?: PanelId;
  command?: CommandId;
  needsClip?: boolean;
  needsMedia?: boolean;
}

export const EDITOR_TOOLS: EditorTool[] = [
  {
    id: "split",
    label: "Split",
    category: "Timeline",
    icon: Scissors,
    summary: "Cut the clip under the playhead into two clips.",
    how: "Park the playhead where you want the cut, then tap Split.",
    keywords: ["cut", "slice", "trim", "divide", "playhead"],
    command: "split",
  },
  {
    id: "trim",
    label: "Trim",
    category: "Timeline",
    icon: Inspect,
    summary: "Shorten a clip from its start or end.",
    how: "Select a clip, then drag the handles on either edge of it.",
    keywords: ["shorten", "edge", "handle", "crop duration"],
    command: "trim",
    needsClip: true,
  },
  {
    id: "delete-clip",
    label: "Delete",
    category: "Timeline",
    icon: Trash2,
    summary: "Remove the selected clip and close the gap.",
    how: "Select the clip on the timeline, then tap Delete.",
    keywords: ["remove", "erase", "clip"],
    command: "deleteClip",
    needsClip: true,
  },
  {
    id: "duplicate-clip",
    label: "Duplicate",
    category: "Timeline",
    icon: Copy,
    summary: "Make a copy of the selected clip right after it.",
    how: "Select a clip, then tap Duplicate.",
    keywords: ["copy", "clone", "repeat"],
    command: "duplicateClip",
    needsClip: true,
  },
  {
    id: "add-media",
    label: "Add media",
    category: "Timeline",
    icon: Plus,
    summary: "Add photos, videos or files to the timeline.",
    how: "Tap Add media, pick files, and they are appended to the end.",
    keywords: ["import", "upload", "photo", "video", "file", "document"],
    command: "addMedia",
  },
  {
    id: "undo",
    label: "Undo",
    category: "Timeline",
    icon: Undo2,
    summary: "Step back through your last edits.",
    how: "Tap Undo or press Ctrl/⌘ Z.",
    keywords: ["back", "revert", "history"],
    command: "undo",
  },
  {
    id: "redo",
    label: "Redo",
    category: "Timeline",
    icon: Redo2,
    summary: "Reapply an edit you just undid.",
    how: "Tap Redo or press Ctrl/⌘ Shift Z.",
    keywords: ["forward", "repeat", "history"],
    command: "redo",
  },
  {
    id: "audio",
    label: "Volume & audio",
    category: "Audio",
    icon: Volume2,
    summary: "Set clip volume, mute, and manage music tracks.",
    how: "Select a clip and open Volume, or manage added music in the same panel.",
    keywords: ["sound", "music", "volume", "mute", "fade"],
    panel: "audio",
  },
  {
    id: "mute",
    label: "Mute clip",
    category: "Audio",
    icon: VolumeX,
    summary: "Silence the selected clip without deleting its audio.",
    how: "Select a video or audio clip, then tap Mute.",
    keywords: ["silence", "sound off", "volume"],
    command: "mute",
    needsClip: true,
  },
  {
    id: "add-audio",
    label: "Add audio",
    category: "Audio",
    icon: Music,
    summary: "Lay a music or voice file over the whole project.",
    how: "Tap Add audio and choose an audio file. It starts at 00:00.",
    keywords: ["music", "soundtrack", "voiceover", "import"],
    command: "addAudio",
  },
  {
    id: "extract-audio",
    label: "Extract audio",
    category: "Audio",
    icon: AudioLines,
    summary: "Pull the sound out of a video clip into its own track.",
    how: "Select a video clip, then tap Extract audio.",
    keywords: ["detach", "sound", "music", "video audio"],
    command: "extractAudio",
    needsClip: true,
  },
  {
    id: "text",
    label: "Text",
    category: "Text",
    icon: Type,
    summary: "Add styled text over your video or photo.",
    how: "Tap Text, type your words, and drag the text on the preview to place it.",
    keywords: ["title", "caption", "font", "typography", "overlay"],
    panel: "text",
  },
  {
    id: "stickers",
    label: "Stickers",
    category: "Text",
    icon: Smile,
    summary: "Drop emoji and stickers onto the canvas.",
    how: "Pick a sticker, then drag it on the preview to position it.",
    keywords: ["emoji", "overlay", "reaction", "decorate"],
    panel: "stickers",
  },
  {
    id: "animate",
    label: "Animation",
    category: "Transform",
    icon: Sparkles,
    summary: "Add an entrance animation to the selected clip.",
    how: "Select a clip and choose Fade, Slide, Zoom, Pop or Spin.",
    keywords: ["motion", "fade", "slide", "zoom", "spin", "keyframe"],
    panel: "animate",
    needsClip: true,
  },
  {
    id: "filters",
    label: "Filters",
    category: "Color",
    icon: Filter,
    summary: "Apply a color look like Vivid, Warm, Noir or Chrome.",
    how: "Select a clip, open Filters and tap a swatch to preview it live.",
    keywords: ["lut", "preset", "color", "look", "noir", "vivid"],
    panel: "filters",
  },
  {
    id: "adjust",
    label: "Adjust",
    category: "Color",
    icon: SlidersHorizontal,
    summary: "Fine-tune brightness, contrast, saturation and opacity.",
    how: "Open Adjust and move the sliders. Changes apply to the selected clip.",
    keywords: ["brightness", "contrast", "saturation", "opacity", "exposure"],
    panel: "adjust",
  },
  {
    id: "effects",
    label: "Effects",
    category: "Color",
    icon: Wand2,
    summary: "One-tap looks that combine a filter with tuned color.",
    how: "Open Effects and tap a look such as Cinematic or Dreamy.",
    keywords: ["cinematic", "retro", "dreamy", "style", "preset", "look"],
    panel: "effects",
  },
  {
    id: "crop",
    label: "Crop & rotate",
    category: "Transform",
    icon: Crop,
    summary: "Rotate, flip and zoom the selected clip.",
    how: "Open Crop & rotate and use the buttons and zoom slider.",
    keywords: ["orientation", "rotate", "flip", "zoom", "scale", "mirror"],
    panel: "crop",
  },
  {
    id: "rotate-left",
    label: "Rotate left",
    category: "Transform",
    icon: RotateCcw,
    summary: "Turn the selected clip 90° counter-clockwise.",
    how: "Select a clip, then tap Rotate left.",
    keywords: ["turn", "orientation", "counter clockwise"],
    command: "rotateLeft",
    needsClip: true,
  },
  {
    id: "rotate-right",
    label: "Rotate right",
    category: "Transform",
    icon: RotateCw,
    summary: "Turn the selected clip 90° clockwise.",
    how: "Select a clip, then tap Rotate right.",
    keywords: ["turn", "orientation", "clockwise"],
    command: "rotateRight",
    needsClip: true,
  },
  {
    id: "flip-h",
    label: "Flip horizontal",
    category: "Transform",
    icon: FlipHorizontal,
    summary: "Mirror the selected clip left to right.",
    how: "Select a clip, then tap Flip H.",
    keywords: ["mirror", "reverse", "horizontal"],
    command: "flipH",
    needsClip: true,
  },
  {
    id: "flip-v",
    label: "Flip vertical",
    category: "Transform",
    icon: FlipVertical,
    summary: "Mirror the selected clip top to bottom.",
    how: "Select a clip, then tap Flip V.",
    keywords: ["mirror", "reverse", "vertical"],
    command: "flipV",
    needsClip: true,
  },
  {
    id: "speed",
    label: "Speed",
    category: "Transform",
    icon: Gauge,
    summary: "Slow down or speed up a clip from 0.25× to 4×.",
    how: "Select a clip, open Speed and choose a preset or use the slider.",
    keywords: ["slow motion", "fast", "playback rate", "duration"],
    panel: "speed",
    needsClip: true,
  },
  {
    id: "canvas",
    label: "Aspect ratio & background",
    category: "Canvas",
    icon: Layers,
    summary: "Change the canvas shape and the color behind your media.",
    how: "Open Canvas and pick 9:16, 4:5, 1:1, 4:3, 3:4 or 16:9.",
    keywords: ["ratio", "format", "background", "color", "canvas", "letterbox"],
    panel: "canvas",
  },
  {
    id: "rename",
    label: "Rename project",
    category: "Project",
    icon: Pencil,
    summary: "Give this project a clearer name.",
    how: "Tap Rename project, type a name and confirm.",
    keywords: ["title", "name", "project"],
    command: "rename",
  },
  {
    id: "save",
    label: "Save draft",
    category: "Project",
    icon: Save,
    summary: "Save the current timeline and edits on this device.",
    how: "Tap Save draft. Auto-save also stores changes as you work.",
    keywords: ["autosave", "draft", "project"],
    command: "save",
  },
  {
    id: "export",
    label: "Export",
    category: "Project",
    icon: Download,
    summary: "Download a rendered photo or your original video file.",
    how: "Open Export, choose a size and tap Export.",
    keywords: ["download", "share", "render", "save video", "png", "jpg"],
    panel: "export",
  },
];

export const MAIN_TOOL_IDS = [
  "split",
  "audio",
  "text",
  "animate",
  "effects",
  "stickers",
  "filters",
  "adjust",
];

export const CLIP_TOOL_IDS = [
  "split",
  "audio",
  "speed",
  "animate",
  "filters",
  "adjust",
  "crop",
  "duplicate-clip",
  "extract-audio",
  "delete-clip",
];

export const HOME_TOOL_IDS = [
  "add-media",
  "split",
  "text",
  "filters",
  "adjust",
  "speed",
  "crop",
  "canvas",
  "animate",
  "audio",
  "stickers",
  "export",
];

const BY_ID = new Map(EDITOR_TOOLS.map((tool) => [tool.id, tool]));

export function getTool(id: string): EditorTool | undefined {
  return BY_ID.get(id);
}

export function toolById(id: string): EditorTool {
  const tool = BY_ID.get(id);
  if (!tool) throw new Error(`Unknown tool: ${id}`);
  return tool;
}

export function searchTools(query: string): EditorTool[] {
  const q = query.trim().toLowerCase();
  if (!q) return EDITOR_TOOLS;
  const scored = EDITOR_TOOLS.map((tool) => {
    const label = tool.label.toLowerCase();
    const category = tool.category.toLowerCase();
    const summary = tool.summary.toLowerCase();
    const keywords = tool.keywords.join(" ");
    let score = 0;
    if (label === q) score = 100;
    else if (label.startsWith(q)) score = 80;
    else if (label.includes(q)) score = 60;
    else if (keywords.includes(q)) score = 45;
    else if (summary.includes(q)) score = 30;
    else if (category.includes(q)) score = 20;
    return { tool, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.map((entry) => entry.tool);
}

export const PANEL_ICON: Record<PanelId, LucideIcon> = {
  audio: Volume2,
  text: Type,
  stickers: Smile,
  animate: Sparkles,
  effects: Wand2,
  filters: Filter,
  adjust: SlidersHorizontal,
  crop: Crop,
  speed: Gauge,
  canvas: Layers,
  export: Download,
  more: ImagePlus,
};

export const PANEL_TITLE: Record<PanelId, string> = {
  audio: "Volume & audio",
  text: "Text",
  stickers: "Stickers",
  animate: "Animation",
  effects: "Effects",
  filters: "Filters",
  adjust: "Adjust",
  crop: "Crop & rotate",
  speed: "Speed",
  canvas: "Canvas",
  export: "Export",
  more: "All tools",
};
