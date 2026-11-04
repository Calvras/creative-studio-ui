import { describe, expect, it } from "vitest";

import { computeDuration, reflowClips } from "@/lib/projects-store";
import { formatBytes, formatTime } from "@/lib/format";
import { DEFAULT_ADJUST, type VisualClip } from "@/lib/types";
import { EDITOR_TOOLS, getTool, searchTools } from "@/lib/tool-registry";

function clip(id: string, start: number, duration: number): VisualClip {
  return {
    id,
    assetId: `asset-${id}`,
    start,
    duration,
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

describe("tool registry", () => {
  it("finds tools by label, keyword and summary", () => {
    expect(searchTools("split")[0]?.id).toBe("split");
    expect(searchTools("cut").some((tool) => tool.id === "split")).toBe(true);
    expect(searchTools("volume").some((tool) => tool.id === "audio")).toBe(true);
    expect(searchTools("rotate").some((tool) => tool.category === "Transform")).toBe(true);
  });

  it("gives every tool a unique id and documented behaviour", () => {
    const ids = new Set(EDITOR_TOOLS.map((tool) => tool.id));
    expect(ids.size).toBe(EDITOR_TOOLS.length);
    for (const tool of EDITOR_TOOLS) {
      expect(tool.summary.length).toBeGreaterThan(10);
      expect(tool.how.length).toBeGreaterThan(10);
      expect(getTool(tool.id)).toBe(tool);
    }
  });

  it("returns no results for an unknown query", () => {
    expect(searchTools("zzzzz")).toHaveLength(0);
  });
});

describe("timeline maths", () => {
  it("re-flows clips without gaps and keeps their lengths", () => {
    const result = reflowClips([clip("a", 4, 2), clip("b", 0, 3), clip("c", 9, 1.5)]);
    expect(result.map((entry) => entry.start)).toEqual([0, 2, 5]);
    expect(result.map((entry) => entry.duration)).toEqual([2, 3, 1.5]);
  });

  it("measures duration from the furthest clip or audio track", () => {
    const visual = [clip("a", 0, 3), clip("b", 3, 4)];
    const audio = [
      { id: "m", assetId: "a1", start: 0, duration: 9, trimStart: 0, volume: 80, muted: false },
    ];
    expect(computeDuration(visual, audio)).toBe(9);
    expect(computeDuration(visual, [])).toBe(7);
  });
});

describe("formatting", () => {
  it("formats clock values", () => {
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(65)).toBe("01:05");
    expect(formatTime(3725)).toBe("01:02:05");
  });

  it("formats byte values", () => {
    expect(formatBytes(0)).toBe("—");
    expect(formatBytes(900)).toBe("900 B");
    expect(formatBytes(1024 * 1024 * 2.5)).toBe("2.5 MB");
  });
});
