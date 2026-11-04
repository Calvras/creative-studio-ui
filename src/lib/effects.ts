import type { ClipAdjust, VisualClip } from "@/lib/types";

export interface FilterDef {
  id: string;
  label: string;
  css: string;
}

export const FILTERS: FilterDef[] = [
  { id: "none", label: "Original", css: "" },
  { id: "vivid", label: "Vivid", css: "saturate(1.5) contrast(1.08)" },
  { id: "warm", label: "Warm", css: "sepia(0.22) saturate(1.22) hue-rotate(-6deg)" },
  { id: "cool", label: "Cool", css: "hue-rotate(16deg) saturate(1.08) brightness(1.02)" },
  { id: "matte", label: "Matte", css: "contrast(0.88) brightness(1.06) saturate(0.85)" },
  { id: "fade", label: "Fade", css: "contrast(0.9) brightness(1.12) saturate(0.72)" },
  { id: "drama", label: "Drama", css: "contrast(1.3) brightness(0.92) saturate(1.12)" },
  { id: "chrome", label: "Chrome", css: "contrast(1.18) saturate(1.38) brightness(1.03)" },
  { id: "bw", label: "B&W", css: "grayscale(1)" },
  { id: "noir", label: "Noir", css: "grayscale(1) contrast(1.48) brightness(0.9)" },
  { id: "retro", label: "Retro", css: "sepia(0.4) contrast(0.95) saturate(0.9)" },
  { id: "dream", label: "Dream", css: "brightness(1.08) saturate(0.92) contrast(0.94)" },
];

export function filterById(id: string): FilterDef {
  return FILTERS.find((filter) => filter.id === id) ?? FILTERS[0]!;
}

export function cssFilterForClip(clip: Pick<VisualClip, "filter" | "adjust">): string {
  const filter = filterById(clip.filter);
  const { brightness, contrast, saturation } = clip.adjust;
  return [
    filter.css,
    `brightness(${brightness / 100})`,
    `contrast(${contrast / 100})`,
    `saturate(${saturation / 100})`,
  ]
    .filter(Boolean)
    .join(" ");
}

export function transformForClip(
  clip: Pick<VisualClip, "rotation" | "scale" | "flipH" | "flipV">,
): string {
  const parts: string[] = [];
  if (clip.rotation % 360 !== 0) parts.push(`rotate(${clip.rotation}deg)`);
  if (clip.scale !== 100) parts.push(`scale(${clip.scale / 100})`);
  if (clip.flipH) parts.push("scaleX(-1)");
  if (clip.flipV) parts.push("scaleY(-1)");
  return parts.length > 0 ? parts.join(" ") : "none";
}

export interface EffectPreset {
  id: string;
  label: string;
  filter: string;
  adjust: Partial<ClipAdjust>;
  note: string;
}

export const EFFECT_PRESETS: EffectPreset[] = [
  {
    id: "original",
    label: "Original",
    filter: "none",
    adjust: { brightness: 100, contrast: 100, saturation: 100 },
    note: "Reset look",
  },
  {
    id: "cinematic",
    label: "Cinematic",
    filter: "drama",
    adjust: { brightness: 98, contrast: 116, saturation: 92 },
    note: "Teal-free film contrast",
  },
  {
    id: "golden",
    label: "Golden hour",
    filter: "warm",
    adjust: { brightness: 106, contrast: 102, saturation: 116 },
    note: "Warm skin tones",
  },
  {
    id: "dreamy",
    label: "Dreamy",
    filter: "dream",
    adjust: { brightness: 108, contrast: 94, saturation: 96 },
    note: "Soft highlights",
  },
  {
    id: "punch",
    label: "Punch",
    filter: "vivid",
    adjust: { brightness: 102, contrast: 110, saturation: 126 },
    note: "Loud, scroll-stopping",
  },
  {
    id: "noir",
    label: "Noir",
    filter: "noir",
    adjust: { brightness: 92, contrast: 132, saturation: 100 },
    note: "High-contrast mono",
  },
  {
    id: "faded",
    label: "Faded film",
    filter: "fade",
    adjust: { brightness: 110, contrast: 88, saturation: 78 },
    note: "Washed-out matte",
  },
  {
    id: "chrome",
    label: "Chrome",
    filter: "chrome",
    adjust: { brightness: 102, contrast: 112, saturation: 118 },
    note: "Clean, glossy color",
  },
];

export type AnimationCategory = "Basic" | "Motion" | "Style" | "3D";

export interface AnimationDef {
  id: string;
  label: string;
  className: string;
  category: AnimationCategory;
}

export const ANIMATION_CATEGORIES: AnimationCategory[] = ["Basic", "Motion", "Style", "3D"];

export const ANIMATIONS: AnimationDef[] = [
  { id: "fade", label: "Fade in", className: "clip-anim-fade", category: "Basic" },
  { id: "zoom", label: "Zoom in", className: "clip-anim-zoom", category: "Basic" },
  { id: "pop", label: "Pop", className: "clip-anim-pop", category: "Basic" },
  { id: "slide", label: "Slide in", className: "clip-anim-slide", category: "Motion" },
  { id: "rise", label: "Rise", className: "clip-anim-rise", category: "Motion" },
  { id: "drop", label: "Drop", className: "clip-anim-drop", category: "Motion" },
  { id: "tilt", label: "Tilt", className: "clip-anim-tilt", category: "Style" },
  { id: "blur", label: "Blur in", className: "clip-anim-blur", category: "Style" },
  { id: "glitch", label: "Glitch", className: "clip-anim-glitch", category: "Style" },
  { id: "spin", label: "Spin in", className: "clip-anim-spin", category: "Style" },
  { id: "flip", label: "Flip 3D", className: "clip-anim-flip", category: "3D" },
  { id: "swing", label: "Swing", className: "clip-anim-swing", category: "3D" },
];

export function animationClass(animation: string | null): string {
  return ANIMATIONS.find((item) => item.id === animation)?.className ?? "";
}

export const BACKGROUNDS = [
  "#0b0b0c",
  "#ffffff",
  "#f2ede5",
  "#e4682c",
  "#cfe6ee",
  "#111827",
  "#1c2b21",
  "#2a1b2e",
];

export const STICKER_GROUPS = [
  {
    label: "Reactions",
    items: ["😂", "🔥", "💯", "✨", "❤️", "🎉", "👀", "💀", "🥶", "😍", "🙏", "💪", "🫶", "🤯"],
  },
  {
    label: "Shapes",
    items: ["⭐", "💠", "🔶", "🔷", "🟢", "🔴", "🟡", "⚡", "🌊", "🌸", "🌙", "☀️", "🎯", "💫"],
  },
  {
    label: "Vibes",
    items: ["🎬", "🎵", "📸", "🕶️", "🧡", "🌴", "🍕", "☕", "🛹", "🏆", "🚀", "🎧", "💸", "🪩"],
  },
];

export const TEXT_COLORS = [
  "#ffffff",
  "#0b0b0c",
  "#e4682c",
  "#cfe6ee",
  "#facc15",
  "#f87171",
  "#4ade80",
  "#c084fc",
];
