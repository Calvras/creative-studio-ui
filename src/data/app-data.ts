import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";

export interface Project {
  id: string;
  img: string;
  title: string;
  sub: string;
  date: string;
  dur: string;
  size: string;
}

export const PROJECTS: Project[] = [
  { id: "proj-981",  img: p1, title: "Project 981",       sub: "Mastery template",     date: "17 Jan 25", dur: "00:01:12", size: "44MB" },
  { id: "lifestyle", img: p2, title: "My daily lifestyle", sub: "Car star",              date: "19 Dec 24", dur: "00:58:45", size: "37MB" },
  { id: "friday01",  img: p3, title: "Friday_01",          sub: "Morning Coffee Vibe",  date: "13 Dec 24", dur: "00:01:41", size: "52MB" },
  { id: "myday",     img: p2, title: "My day",             sub: "Weekend",              date: "02 Dec 24", dur: "00:00:58", size: "21MB" },
];

export interface MoreTool {
  emoji: string;
  label: string;
}

export const MORE_TOOLS: MoreTool[] = [
  { emoji: "✂️",  label: "AutoCut" },
  { emoji: "✨",  label: "Retouch" },
  { emoji: "🤖",  label: "AI generator" },
  { emoji: "🖼️",  label: "Photo tools" },
  { emoji: "🎥",  label: "Shoot and record" },
  { emoji: "⚡",  label: "Auto enhance" },
  { emoji: "🎨",  label: "Cover maker" },
  { emoji: "💬",  label: "Auto captions" },
  { emoji: "🧹",  label: "Remove background" },
  { emoji: "🖌️",  label: "AI photo editor" },
  { emoji: "☁️",  label: "Space" },
  { emoji: "📣",  label: "Marketing tools" },
];

export const PROJECT_MENU_ACTIONS = ["Rename", "Duplicate", "Export", "Delete"] as const;
export type ProjectMenuAction = typeof PROJECT_MENU_ACTIONS[number];
