import { useState, type CSSProperties, type ReactNode } from "react";
import type { AudioTrack, MediaAsset, Overlay, Project, VisualClip } from "@/lib/types";
import type { PanelId } from "@/lib/tool-registry";
import { EDITOR_TOOLS } from "@/lib/tool-registry";
import {
  ANIMATIONS,
  ANIMATION_CATEGORIES,
  BACKGROUNDS,
  EFFECT_PRESETS,
  FILTERS,
  STICKER_GROUPS,
  TEXT_COLORS,
  filterById,
  type AnimationCategory,
} from "@/lib/effects";
import { formatTime } from "@/lib/format";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDownToLine,
  AudioLines,
  Ban,
  Bold,
  Check,
  Download,
  FlipHorizontal,
  FlipVertical,
  ImageDown,
  Italic,
  Loader2,
  Maximize2,
  Music,
  Plus,
  RotateCcw,
  RotateCw,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";

export interface EditorPanelActions {
  onPatchClip: (patch: Partial<VisualClip>, history?: boolean) => void;
  onPatchProject: (patch: Partial<Project>, history?: boolean) => void;
  onPatchAudio: (id: string, patch: Partial<AudioTrack>, history?: boolean) => void;
  onRemoveAudio: (id: string) => void;
  onAddAudio: () => void;
  onAddMedia: () => void;
  onAddText: () => void;
  onAddSticker: (emoji: string) => void;
  onPatchOverlay: (id: string, patch: Partial<Overlay>, history?: boolean) => void;
  onRemoveOverlay: (id: string) => void;
  onSelectOverlay: (id: string | null) => void;
  onSetSpeed: (speed: number) => void;
  onResetClip: () => void;
  onExtractAudio: () => void;
  onOpenTool: (toolId: string) => void;
  onExport: (format: "png" | "jpeg", width: number) => void;
  onExportFrame: () => void;
  onDownloadOriginal: () => void;
  exporting: boolean;
}

export interface EditorPanelProps {
  panel: PanelId;
  project: Project;
  clip: VisualClip | null;
  clipAsset: MediaAsset | null;
  selectedOverlayId: string | null;
  actions: EditorPanelActions;
}

export function EditorPanel({
  panel,
  project,
  clip,
  clipAsset,
  selectedOverlayId,
  actions,
}: EditorPanelProps) {
  switch (panel) {
    case "audio":
      return <AudioPanel project={project} clip={clip} clipAsset={clipAsset} actions={actions} />;
    case "text":
      return (
        <TextPanel project={project} selectedOverlayId={selectedOverlayId} actions={actions} />
      );
    case "stickers":
      return (
        <StickersPanel project={project} selectedOverlayId={selectedOverlayId} actions={actions} />
      );
    case "animate":
      return <AnimatePanel clip={clip} clipAsset={clipAsset} actions={actions} />;
    case "effects":
      return <EffectsPanel clip={clip} clipAsset={clipAsset} actions={actions} />;
    case "filters":
      return <FiltersPanel clip={clip} clipAsset={clipAsset} actions={actions} />;
    case "adjust":
      return <AdjustPanel clip={clip} actions={actions} />;
    case "crop":
      return <CropPanel clip={clip} actions={actions} />;
    case "speed":
      return <SpeedPanel clip={clip} actions={actions} />;
    case "canvas":
      return <CanvasPanel project={project} actions={actions} />;
    case "export":
      return <ExportPanel project={project} clip={clip} clipAsset={clipAsset} actions={actions} />;
    case "more":
      return <MorePanel actions={actions} />;
    default:
      return null;
  }
}

function PanelEmpty({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-8 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-ink-dim">
        {icon}
      </span>
      <p className="mt-3.5 text-[15px] font-semibold">{title}</p>
      <p className="mt-1.5 max-w-[28ch] text-xs leading-relaxed text-ink-dim">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block px-1 py-1">
      <span className="flex items-center justify-between text-xs">
        <span className="text-ink-dim">{label}</span>
        <span className="tabular-nums text-ink">
          {Number.isInteger(value) ? value : value.toFixed(2)}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="range-brand mt-2 h-6 w-full cursor-pointer"
      />
    </label>
  );
}

function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-xs transition active:scale-95 ${
        active ? "bg-brand text-sky-ink" : "bg-surface-2 text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function PanelNote({ children }: { children: ReactNode }) {
  return <p className="px-1 pt-3 text-[10.5px] leading-relaxed text-ink-dim">{children}</p>;
}

function assetThumb(asset: MediaAsset | null): string | undefined {
  return asset?.thumb;
}

/// ── Audio ────────────────────────────────────────────────────────────────────

function AudioPanel({
  project,
  clip,
  clipAsset,
  actions,
}: {
  project: Project;
  clip: VisualClip | null;
  clipAsset: MediaAsset | null;
  actions: EditorPanelActions;
}) {
  const canControlClip =
    clip !== null && (clipAsset?.kind === "video" || clipAsset?.kind === "audio");
  return (
    <div className="space-y-5 pb-1">
      {canControlClip && clip ? (
        <div className="rounded-2xl bg-surface-2/60 p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-medium">
              <Volume2 className="h-4 w-4 text-brand" /> Clip volume
            </span>
            <button
              onClick={() => actions.onPatchClip({ muted: !clip.muted })}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] ${clip.muted ? "bg-amber-500/15 text-amber-400" : "bg-surface text-ink-dim"}`}
            >
              {clip.muted ? (
                <VolumeX className="h-3.5 w-3.5" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
              {clip.muted ? "Muted" : "Mute"}
            </button>
          </div>
          <div className="mt-2">
            <SliderRow
              label="Volume"
              value={clip.muted ? 0 : clip.volume}
              min={0}
              max={100}
              unit="%"
              onChange={(value) => actions.onPatchClip({ volume: value, muted: value === 0 })}
            />
          </div>
          <button
            onClick={actions.onExtractAudio}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-surface px-3 py-2 text-[11px] text-ink"
          >
            <AudioLines className="h-3.5 w-3.5 text-brand" /> Extract audio to a new track
          </button>
        </div>
      ) : (
        <PanelNote>
          {clip
            ? "This clip has no sound. Add a music track below."
            : "Select a video clip to control its volume, or add a music track."}
        </PanelNote>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-[11px] font-semibold text-ink">Music & voice tracks</p>
          <button
            onClick={actions.onAddAudio}
            className="flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1.5 text-[11px]"
          >
            <Plus className="h-3.5 w-3.5" /> Add audio
          </button>
        </div>
        {project.audioTracks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink/10 px-3 py-4 text-center text-[11px] text-ink-dim">
            No music tracks yet. Add an MP3, WAV or voice memo.
          </p>
        ) : (
          <div className="space-y-2">
            {project.audioTracks.map((track) => {
              const asset = project.media.find((item) => item.id === track.assetId);
              return (
                <div key={track.id} className="rounded-2xl bg-surface-2/60 p-4">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 shrink-0 text-brand" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{asset?.name ?? "Audio"}</p>
                      <p className="text-[10px] text-ink-dim">{formatTime(track.duration)}</p>
                    </div>
                    <button
                      onClick={() => actions.onPatchAudio(track.id, { muted: !track.muted })}
                      className={`rounded-full p-2 ${track.muted ? "bg-amber-500/15 text-amber-400" : "bg-surface text-ink-dim"}`}
                      aria-label={track.muted ? "Unmute track" : "Mute track"}
                    >
                      {track.muted ? (
                        <VolumeX className="h-3.5 w-3.5" />
                      ) : (
                        <Volume2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => actions.onRemoveAudio(track.id)}
                      className="rounded-full bg-surface p-2 text-red-400"
                      aria-label="Remove track"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2">
                    <SliderRow
                      label="Track volume"
                      value={track.muted ? 0 : track.volume}
                      min={0}
                      max={100}
                      unit="%"
                      onChange={(value) =>
                        actions.onPatchAudio(track.id, { volume: value, muted: value === 0 })
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <PanelNote>
        Audio tracks start at the beginning. Use the timeline to line them up against your clips.
      </PanelNote>
    </div>
  );
}

/// ── Text ─────────────────────────────────────────────────────────────────────

function TextPanel({
  project,
  selectedOverlayId,
  actions,
}: {
  project: Project;
  selectedOverlayId: string | null;
  actions: EditorPanelActions;
}) {
  const texts = project.overlays.filter((overlay) => overlay.kind === "text");
  const selected = texts.find((overlay) => overlay.id === selectedOverlayId) ?? texts[0] ?? null;

  return (
    <div className="space-y-3 pb-1">
      <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
        {texts.map((text) => (
          <button
            key={text.id}
            onClick={() => actions.onSelectOverlay(text.id)}
            className={`max-w-[130px] shrink-0 truncate rounded-full px-3 py-1.5 text-xs ${
              selected?.id === text.id ? "bg-brand text-sky-ink" : "bg-surface-2 text-ink"
            }`}
          >
            {text.content || "Empty text"}
          </button>
        ))}
        <button
          onClick={actions.onAddText}
          className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-ink/20 px-3 py-1.5 text-xs text-ink-dim"
        >
          <Plus className="h-3.5 w-3.5" /> Add text
        </button>
      </div>

      {!selected ? (
        <PanelEmpty
          icon={<span className="text-lg">Aa</span>}
          title="Add text to the frame"
          description="Type a title or caption. Drag it on the preview to place it anywhere."
          action={
            <button
              onClick={actions.onAddText}
              className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-sky-ink"
            >
              Add text
            </button>
          }
        />
      ) : (
        <div className="space-y-3.5 rounded-2xl bg-surface-2/60 p-4">
          <textarea
            value={selected.content}
            onChange={(event) =>
              actions.onPatchOverlay(selected.id, { content: event.target.value })
            }
            rows={2}
            placeholder="Type your text…"
            className="w-full resize-none rounded-xl bg-surface px-3 py-2.5 text-sm outline-none ring-brand/50 focus:ring-1"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => actions.onPatchOverlay(selected.id, { bold: !selected.bold })}
              className={`grid h-8 w-8 place-items-center rounded-lg ${selected.bold ? "bg-brand text-sky-ink" : "bg-surface text-ink"}`}
              aria-label="Bold"
            >
              <Bold className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => actions.onPatchOverlay(selected.id, { italic: !selected.italic })}
              className={`grid h-8 w-8 place-items-center rounded-lg ${selected.italic ? "bg-brand text-sky-ink" : "bg-surface text-ink"}`}
              aria-label="Italic"
            >
              <Italic className="h-3.5 w-3.5" />
            </button>
            <span className="mx-1 h-6 w-px bg-ink/10" />
            {(["left", "center", "right"] as const).map((align) => {
              const Icon =
                align === "left" ? AlignLeft : align === "center" ? AlignCenter : AlignRight;
              return (
                <button
                  key={align}
                  onClick={() => actions.onPatchOverlay(selected.id, { align })}
                  className={`grid h-8 w-8 place-items-center rounded-lg ${selected.align === align ? "bg-brand text-sky-ink" : "bg-surface text-ink"}`}
                  aria-label={`Align ${align}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
            <span className="mx-1 h-6 w-px bg-ink/10" />
            <select
              value={selected.font}
              onChange={(event) =>
                actions.onPatchOverlay(selected.id, { font: event.target.value as Overlay["font"] })
              }
              className="h-8 rounded-lg bg-surface px-2 text-[11px] text-ink outline-none"
              aria-label="Font"
            >
              <option value="sans">Inter</option>
              <option value="display">Archivo</option>
              <option value="serif">Serif</option>
            </select>
            <button
              onClick={() => actions.onRemoveOverlay(selected.id)}
              className="ml-auto grid h-8 w-8 place-items-center rounded-lg bg-surface text-red-400"
              aria-label="Delete text"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <SliderRow
            label="Size"
            value={selected.size}
            min={12}
            max={76}
            unit="px"
            onChange={(value) => actions.onPatchOverlay(selected.id, { size: value })}
          />
          <div className="flex flex-wrap items-center gap-2">
            {TEXT_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => actions.onPatchOverlay(selected.id, { color })}
                className={`h-7 w-7 rounded-full border-2 ${selected.color === color ? "border-brand" : "border-ink/10"}`}
                style={{ background: color }}
                aria-label={`Text color ${color}`}
              />
            ))}
          </div>
          <PanelNote>
            Drag the text on the preview to position it. Changes are saved automatically.
          </PanelNote>
        </div>
      )}
    </div>
  );
}

/// ── Stickers ─────────────────────────────────────────────────────────────────

function StickersPanel({
  project,
  selectedOverlayId,
  actions,
}: {
  project: Project;
  selectedOverlayId: string | null;
  actions: EditorPanelActions;
}) {
  const stickers = project.overlays.filter((overlay) => overlay.kind === "sticker");
  const selected = stickers.find((overlay) => overlay.id === selectedOverlayId) ?? null;
  return (
    <div className="space-y-3 pb-1">
      {selected && (
        <div className="rounded-2xl bg-surface-2/60 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">
              Selected sticker <span className="ml-1 text-lg">{selected.content}</span>
            </span>
            <button
              onClick={() => actions.onRemoveOverlay(selected.id)}
              className="rounded-full bg-surface p-2 text-red-400"
              aria-label="Remove sticker"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-2">
            <SliderRow
              label="Size"
              value={selected.size}
              min={24}
              max={120}
              unit="px"
              onChange={(value) => actions.onPatchOverlay(selected.id, { size: value })}
            />
          </div>
        </div>
      )}
      {STICKER_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-dim">
            {group.label}
          </p>
          <div className="grid grid-cols-7 gap-2">
            {group.items.map((emoji) => (
              <button
                key={emoji}
                onClick={() => actions.onAddSticker(emoji)}
                className="grid aspect-square place-items-center rounded-xl bg-surface-2 text-xl transition active:scale-90 active:bg-surface"
                aria-label={`Add ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
      <PanelNote>
        Tap a sticker to drop it in the center. Drag it on the preview to move it.
      </PanelNote>
    </div>
  );
}

/// ── Animate ──────────────────────────────────────────────────────────────────

function AnimatePanel({
  clip,
  clipAsset,
  actions,
}: {
  clip: VisualClip | null;
  clipAsset: MediaAsset | null;
  actions: EditorPanelActions;
}) {
  const [category, setCategory] = useState<AnimationCategory>("Basic");
  if (!clip) {
    return (
      <PanelEmpty
        icon={<Maximize2 className="h-5 w-5" />}
        title="Select a clip"
        description="Animations attach to a single clip. Tap a clip on the timeline first."
      />
    );
  }
  const thumb = clipAsset?.thumb;
  const previewStyle: CSSProperties = {
    backgroundImage: thumb ? `url(${thumb})` : "linear-gradient(140deg,#3d3d3d,#1b1b1b)",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
  const list = ANIMATIONS.filter((animation) => animation.category === category);
  const activeLabel = ANIMATIONS.find((animation) => animation.id === clip.animation)?.label;

  return (
    <div className="pb-1">
      <div className="mb-4 flex items-center gap-6 border-b border-white/[0.07] px-1">
        {ANIMATION_CATEGORIES.map((item) => {
          const isActive = category === item;
          return (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`relative pb-2.5 text-[13px] transition ${isActive ? "font-semibold text-ink" : "text-ink-dim"}`}
            >
              {item}
              <span
                className={`absolute inset-x-0 -bottom-px h-[2px] rounded-full ${isActive ? "bg-brand" : "bg-transparent"}`}
              />
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-x-2.5 gap-y-4">
        <button
          onClick={() => actions.onPatchClip({ animation: null })}
          className="flex flex-col items-center gap-1.5"
        >
          <span
            className={`flex aspect-square w-full items-center justify-center rounded-lg border bg-surface transition ${
              clip.animation === null ? "border-brand" : "border-white/10"
            }`}
          >
            <Ban className="h-[26px] w-[26px] text-ink-dim" strokeWidth={1.3} />
          </span>
          <span
            className={`text-[10px] ${clip.animation === null ? "text-brand" : "text-ink-dim"}`}
          >
            None
          </span>
        </button>

        {list.map((animation) => {
          const isActive = clip.animation === animation.id;
          return (
            <button
              key={animation.id}
              onClick={() =>
                actions.onPatchClip({
                  animation: isActive ? null : animation.id,
                })
              }
              className="flex flex-col items-center gap-1.5"
            >
              <span
                className={`relative aspect-square w-full overflow-hidden rounded-lg bg-surface-2 transition ${
                  isActive ? "ring-2 ring-brand" : "ring-1 ring-white/5"
                }`}
              >
                <span
                  key={`${category}-${animation.id}-${isActive}`}
                  className={`absolute inset-0 ${animation.className}`}
                  style={previewStyle}
                />
                {isActive && (
                  <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-brand text-sky-ink">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </span>
              <span
                className={`max-w-full truncate text-[10px] ${isActive ? "text-brand" : "text-ink-dim"}`}
              >
                {animation.label}
              </span>
            </button>
          );
        })}
      </div>

      <PanelNote>
        {activeLabel
          ? `“${activeLabel}” plays once as this clip starts. Scrub the playhead to the clip to replay it.`
          : "Pick an entrance animation. The preview plays it when the clip begins."}
      </PanelNote>
    </div>
  );
}

/// ── Effects / Filters ────────────────────────────────────────────────────────

function EffectsPanel({
  clip,
  clipAsset,
  actions,
}: {
  clip: VisualClip | null;
  clipAsset: MediaAsset | null;
  actions: EditorPanelActions;
}) {
  if (!clip) {
    return (
      <PanelEmpty
        icon={<span>✨</span>}
        title="Select a clip"
        description="Effects are applied to one clip at a time. Select a clip to preview looks."
      />
    );
  }
  return (
    <div className="space-y-3 pb-1">
      <div className="grid grid-cols-2 gap-3">
        {EFFECT_PRESETS.map((preset) => {
          const isActive =
            clip.filter === preset.filter &&
            (preset.id === "original" ||
              clip.adjust.brightness === (preset.adjust.brightness ?? 100));
          const thumb = assetThumb(clipAsset);
          const filter = preset.filter === "none" ? "" : filterById(preset.filter).css;
          return (
            <button
              key={preset.id}
              onClick={() =>
                actions.onPatchClip({
                  filter: preset.filter,
                  adjust: { ...clip.adjust, ...preset.adjust },
                })
              }
              className={`overflow-hidden rounded-xl text-left transition active:scale-[0.98] ${isActive ? "ring-2 ring-brand" : "ring-1 ring-white/5"}`}
            >
              <div
                className="flex h-24 items-end justify-between p-2.5"
                style={{
                  backgroundImage: thumb
                    ? `linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.55)),url(${thumb})`
                    : "linear-gradient(135deg,#3a2a20,#212121)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter,
                }}
              >
                {isActive && <Check className="h-4 w-4 text-white drop-shadow" />}
              </div>
              <div className="bg-surface-2 px-3 py-2.5">
                <p className="text-xs font-medium">{preset.label}</p>
                <p className="mt-0.5 truncate text-[10px] text-ink-dim">{preset.note}</p>
              </div>
            </button>
          );
        })}
      </div>
      <PanelNote>
        Looks combine a filter with tuned brightness and saturation. Adjust them further in Adjust.
      </PanelNote>
    </div>
  );
}

function FiltersPanel({
  clip,
  clipAsset,
  actions,
}: {
  clip: VisualClip | null;
  clipAsset: MediaAsset | null;
  actions: EditorPanelActions;
}) {
  if (!clip) {
    return (
      <PanelEmpty
        icon={<span>🎨</span>}
        title="Select a clip"
        description="Choose a clip on the timeline to preview and apply a color filter."
      />
    );
  }
  const thumb = assetThumb(clipAsset);
  return (
    <div className="space-y-2 pb-1">
      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            onClick={() => actions.onPatchClip({ filter: filter.id })}
            className="flex w-[72px] shrink-0 flex-col items-center gap-2"
          >
            <span
              className={`h-[72px] w-[72px] overflow-hidden rounded-lg border-2 ${clip.filter === filter.id ? "border-brand" : "border-transparent"}`}
              style={{
                backgroundImage: thumb
                  ? `url(${thumb})`
                  : "linear-gradient(135deg,#3a2a20,#212121)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: filter.css || undefined,
              }}
            />
            <span
              className={`text-[10px] ${clip.filter === filter.id ? "text-brand" : "text-ink-dim"}`}
            >
              {filter.label}
            </span>
          </button>
        ))}
      </div>
      <PanelNote>Filters are non-destructive. Switch back to Original at any time.</PanelNote>
    </div>
  );
}

/// ── Adjust ───────────────────────────────────────────────────────────────────

function AdjustPanel({ clip, actions }: { clip: VisualClip | null; actions: EditorPanelActions }) {
  if (!clip) {
    return (
      <PanelEmpty
        icon={<span>◐</span>}
        title="Select a clip"
        description="Adjust brightness, contrast, saturation and opacity for one clip."
      />
    );
  }
  const adjust = clip.adjust;
  return (
    <div className="space-y-2 pb-1">
      <SliderRow
        label="Brightness"
        value={adjust.brightness}
        min={0}
        max={200}
        onChange={(value) =>
          actions.onPatchClip({ adjust: { ...adjust, brightness: value } }, false)
        }
      />
      <SliderRow
        label="Contrast"
        value={adjust.contrast}
        min={0}
        max={200}
        onChange={(value) => actions.onPatchClip({ adjust: { ...adjust, contrast: value } }, false)}
      />
      <SliderRow
        label="Saturation"
        value={adjust.saturation}
        min={0}
        max={200}
        onChange={(value) =>
          actions.onPatchClip({ adjust: { ...adjust, saturation: value } }, false)
        }
      />
      <SliderRow
        label="Opacity"
        value={adjust.opacity}
        min={0}
        max={100}
        unit="%"
        onChange={(value) => actions.onPatchClip({ adjust: { ...adjust, opacity: value } }, false)}
      />
      <div className="flex justify-end pt-1">
        <button
          onClick={() =>
            actions.onPatchClip({
              adjust: { brightness: 100, contrast: 100, saturation: 100, opacity: 100 },
            })
          }
          className="flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1.5 text-[11px] text-ink-dim"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>
    </div>
  );
}

/// ── Crop ─────────────────────────────────────────────────────────────────────

function CropPanel({ clip, actions }: { clip: VisualClip | null; actions: EditorPanelActions }) {
  if (!clip) {
    return (
      <PanelEmpty
        icon={<span>⛶</span>}
        title="Select a clip"
        description="Rotate, flip and zoom the selected clip here."
      />
    );
  }
  return (
    <div className="space-y-4 pb-1">
      <div className="grid grid-cols-4 gap-2.5">
        <button
          onClick={() => actions.onPatchClip({ rotation: (clip.rotation + 270) % 360 })}
          className="flex flex-col items-center gap-1.5 rounded-xl bg-surface-2 py-4 text-[10px]"
        >
          <RotateCcw className="h-4 w-4" /> Left
        </button>
        <button
          onClick={() => actions.onPatchClip({ rotation: (clip.rotation + 90) % 360 })}
          className="flex flex-col items-center gap-1.5 rounded-xl bg-surface-2 py-4 text-[10px]"
        >
          <RotateCw className="h-4 w-4" /> Right
        </button>
        <button
          onClick={() => actions.onPatchClip({ flipH: !clip.flipH })}
          className={`flex flex-col items-center gap-1.5 rounded-xl py-4 text-[10px] ${clip.flipH ? "bg-brand text-sky-ink" : "bg-surface-2"}`}
        >
          <FlipHorizontal className="h-4 w-4" /> Flip H
        </button>
        <button
          onClick={() => actions.onPatchClip({ flipV: !clip.flipV })}
          className={`flex flex-col items-center gap-1.5 rounded-xl py-4 text-[10px] ${clip.flipV ? "bg-brand text-sky-ink" : "bg-surface-2"}`}
        >
          <FlipVertical className="h-4 w-4" /> Flip V
        </button>
      </div>
      <SliderRow
        label="Zoom"
        value={clip.scale}
        min={100}
        max={220}
        unit="%"
        onChange={(value) => actions.onPatchClip({ scale: value }, false)}
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-ink-dim">
          Rotation {clip.rotation}° · scale {clip.scale}%
        </span>
        <button
          onClick={() =>
            actions.onPatchClip({ rotation: 0, scale: 100, flipH: false, flipV: false })
          }
          className="flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1.5 text-[11px] text-ink-dim"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>
    </div>
  );
}

/// ── Speed ────────────────────────────────────────────────────────────────────

function SpeedPanel({ clip, actions }: { clip: VisualClip | null; actions: EditorPanelActions }) {
  if (!clip) {
    return (
      <PanelEmpty
        icon={<span>⏩</span>}
        title="Select a clip"
        description="Speed changes the selected clip and shortens or lengthens the timeline."
      />
    );
  }
  const sourceRemaining = clip.duration * clip.speed;
  const nextDuration = sourceRemaining / clip.speed;
  return (
    <div className="space-y-3 pb-1">
      <div className="flex flex-wrap gap-2">
        {[0.25, 0.5, 1, 1.5, 2, 3, 4].map((speed) => (
          <Chip
            key={speed}
            active={Math.abs(clip.speed - speed) < 0.01}
            onClick={() => actions.onSetSpeed(speed)}
          >
            {speed}×
          </Chip>
        ))}
      </div>
      <SliderRow
        label="Custom speed"
        value={clip.speed}
        min={0.25}
        max={4}
        step={0.05}
        unit="×"
        onChange={actions.onSetSpeed}
      />
      <div className="rounded-2xl bg-surface-2/60 px-3 py-2.5 text-[11px]">
        <p className="flex items-center justify-between">
          <span className="text-ink-dim">Clip duration</span>
          <span className="tabular-nums">{nextDuration.toFixed(2)}s</span>
        </p>
        <p className="mt-1 flex items-center justify-between">
          <span className="text-ink-dim">Source time used</span>
          <span className="tabular-nums">{sourceRemaining.toFixed(2)}s</span>
        </p>
      </div>
      <PanelNote>
        Speeding up a clip shortens it and slides later clips left. Audio pitch is preserved by the
        browser.
      </PanelNote>
    </div>
  );
}

/// ── Canvas ───────────────────────────────────────────────────────────────────

function CanvasPanel({ project, actions }: { project: Project; actions: EditorPanelActions }) {
  const aspects = [
    { id: "9:16", label: "9:16", hint: "Reels", w: 9, h: 16 },
    { id: "4:5", label: "4:5", hint: "Feed", w: 4, h: 5 },
    { id: "1:1", label: "1:1", hint: "Square", w: 1, h: 1 },
    { id: "4:3", label: "4:3", hint: "Classic", w: 4, h: 3 },
    { id: "3:4", label: "3:4", hint: "Portrait", w: 3, h: 4 },
    { id: "16:9", label: "16:9", hint: "Wide", w: 16, h: 9 },
  ] as const;
  return (
    <div className="space-y-5 pb-1">
      <div>
        <p className="mb-2.5 px-1 text-xs font-semibold text-ink">Aspect ratio</p>
        <div className="grid grid-cols-3 gap-2.5">
          {aspects.map((aspect) => (
            <button
              key={aspect.id}
              onClick={() => actions.onPatchProject({ aspect: aspect.id })}
              className={`flex flex-col items-center gap-1.5 rounded-xl py-3.5 text-[10px] transition ${project.aspect === aspect.id ? "bg-brand text-sky-ink" : "bg-surface-2 text-ink"}`}
            >
              <span
                className="rounded-[3px] border border-current opacity-80"
                style={{
                  width: `${Math.min(28, (aspect.w / Math.max(aspect.w, aspect.h)) * 28)}px`,
                  height: `${Math.min(28, (aspect.h / Math.max(aspect.w, aspect.h)) * 28)}px`,
                }}
              />
              <span className="font-medium">{aspect.label}</span>
              <span className="text-[8px] opacity-70">{aspect.hint}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 px-1 text-[11px] font-semibold text-ink">Background</p>
        <div className="flex flex-wrap gap-2">
          {BACKGROUNDS.map((color) => (
            <button
              key={color}
              onClick={() => actions.onPatchProject({ background: color })}
              className={`h-8 w-8 rounded-full border-2 ${project.background === color ? "border-brand" : "border-ink/15"}`}
              style={{ background: color }}
              aria-label={`Background ${color}`}
            />
          ))}
          <label className="flex h-8 cursor-pointer items-center gap-1 rounded-full bg-surface-2 px-3 text-[10px] text-ink-dim">
            Custom
            <input
              type="color"
              value={project.background}
              onChange={(event) =>
                actions.onPatchProject({ background: event.target.value }, false)
              }
              className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
            />
          </label>
        </div>
      </div>
      <PanelNote>
        The background fills any empty space around media that doesn't match the canvas shape.
      </PanelNote>
    </div>
  );
}

/// ── Export ───────────────────────────────────────────────────────────────────

function ExportPanel({
  project,
  clipAsset,
  actions,
}: {
  project: Project;
  clip: VisualClip | null;
  clipAsset: MediaAsset | null;
  actions: EditorPanelActions;
}) {
  const [format, setFormat] = useState<"png" | "jpeg">(project.kind === "photo" ? "jpeg" : "png");
  const [width, setWidth] = useState(1080);
  return (
    <div className="space-y-3 pb-1">
      <div className="rounded-2xl bg-surface-2/60 p-3 text-[11px]">
        <Row label="Project" value={`${project.name}`} />
        <Row label="Canvas" value={project.aspect} />
        <Row label="Duration" value={formatTime(project.duration)} />
        <Row
          label="Media"
          value={`${project.media.length} file${project.media.length === 1 ? "" : "s"}`}
        />
        {clipAsset?.width && clipAsset?.height ? (
          <Row label="Source" value={`${clipAsset.width}×${clipAsset.height}`} />
        ) : null}
      </div>

      {project.kind === "document" ? (
        <div className="space-y-2">
          <p className="text-[11px] leading-relaxed text-ink-dim">
            Documents stay as original files. Download the source to share it.
          </p>
          <button
            onClick={actions.onDownloadOriginal}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-sky-ink"
          >
            <Download className="h-4 w-4" /> Download original file
          </button>
        </div>
      ) : project.kind === "video" ? (
        <div className="space-y-2">
          <p className="text-[11px] leading-relaxed text-ink-dim">
            Export the current frame with filters and text burned in, or download the untouched
            source video.
          </p>
          <button
            onClick={actions.onExportFrame}
            disabled={actions.exporting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-sky-ink disabled:opacity-60"
          >
            {actions.exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageDown className="h-4 w-4" />
            )}{" "}
            Export current frame (PNG)
          </button>
          <button
            onClick={actions.onDownloadOriginal}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-2 py-3 text-sm font-medium text-ink"
          >
            <ArrowDownToLine className="h-4 w-4" /> Download original video
          </button>
          <PanelNote>
            Video re-encoding with burned-in filters needs a render step. Your original file keeps
            full quality and audio.
          </PanelNote>
        </div>
      ) : project.kind === "audio" ? (
        <button
          onClick={actions.onDownloadOriginal}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-sky-ink"
        >
          <Download className="h-4 w-4" /> Download audio
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] leading-relaxed text-ink-dim">
            {clipAsset?.kind === "document"
              ? "Open the document to export it, or download the original file."
              : "Renders the current frame at full resolution with your filters, text and stickers."}
          </p>
          {clipAsset?.kind === "document" ? (
            <button
              onClick={actions.onDownloadOriginal}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-sky-ink"
            >
              <Download className="h-4 w-4" /> Download original file
            </button>
          ) : (
            <>
              <div className="flex gap-2">
                {[1080, 1440, 2048].map((option) => (
                  <button
                    key={option}
                    onClick={() => setWidth(option)}
                    className={`flex flex-1 flex-col items-center rounded-xl py-2.5 text-xs transition ${width === option ? "bg-brand text-sky-ink" : "bg-surface-2 text-ink"}`}
                  >
                    <span className="font-semibold">{option}px</span>
                    <span className="text-[9px] opacity-70">
                      {option === 1080 ? "HD" : option === 1440 ? "2K" : "4K"}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {(["png", "jpeg"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setFormat(option)}
                    className={`flex-1 rounded-xl py-2 text-xs font-medium transition ${format === option ? "bg-surface-2 text-brand" : "bg-surface text-ink-dim"}`}
                  >
                    {option === "png" ? "PNG · sharp" : "JPG · small"}
                  </button>
                ))}
              </div>
              <button
                onClick={() => actions.onExport(format, width)}
                disabled={actions.exporting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-sky-ink disabled:opacity-60"
              >
                {actions.exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImageDown className="h-4 w-4" />
                )}
                {actions.exporting ? "Exporting…" : `Export ${format.toUpperCase()} · ${width}px`}
              </button>
              <PanelNote>
                Photo exports include the current filter, crop, text and stickers.
              </PanelNote>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex items-center justify-between gap-3 py-0.5">
      <span className="text-ink-dim">{label}</span>
      <span className="truncate text-right text-ink">{value}</span>
    </p>
  );
}

/// ── More ─────────────────────────────────────────────────────────────────────

function MorePanel({ actions }: { actions: EditorPanelActions }) {
  return (
    <div className="grid grid-cols-3 gap-2.5 pb-1">
      {EDITOR_TOOLS.map((tool) => {
        const Icon = tool.icon;
        return (
          <button
            key={tool.id}
            onClick={() => actions.onOpenTool(tool.id)}
            className="flex min-h-[86px] flex-col items-center justify-center gap-2 rounded-2xl bg-surface-2/70 px-2 py-3 text-center transition active:scale-95 active:bg-surface"
          >
            <Icon className="h-5 w-5 text-ink" strokeWidth={1.6} />
            <span className="text-[10px] leading-tight text-ink-dim">{tool.label}</span>
          </button>
        );
      })}
    </div>
  );
}
