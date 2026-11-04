import { useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AudioLines,
  Clapperboard,
  ImageIcon,
  Info,
  Loader2,
  Music,
  Scissors,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Screen, meta } from "@/components/bottom-nav";
import { Toast } from "@/components/ui/overlays";
import { createProjectFromFiles, useProjects } from "@/lib/projects-store";
import { formatTime } from "@/lib/format";
import { getTool } from "@/lib/tool-registry";

export const Route = createFileRoute("/ai-lab")({
  head: () => meta("AI Lab — EDIT+", "On-device smart tools that open directly in the editor."),
  component: AiLab,
});

type Preset = {
  id: string;
  label: string;
  description: string;
  icon: typeof Wand2;
  tool: string;
  accept: string;
  multi: boolean;
};

const PRESETS: Preset[] = [
  {
    id: "photo",
    label: "Quick photo edit",
    description: "Open a photo with filters and adjustments ready.",
    icon: ImageIcon,
    tool: "filters",
    accept: "image/*",
    multi: false,
  },
  {
    id: "autocut",
    label: "Beat-ready timeline",
    description: "Import several clips and lay them out on the timeline.",
    icon: Scissors,
    tool: "split",
    accept: "video/*",
    multi: true,
  },
  {
    id: "frame",
    label: "Grab a frame",
    description: "Pull a still frame out of a video at full resolution.",
    icon: Clapperboard,
    tool: "export",
    accept: "video/*",
    multi: false,
  },
  {
    id: "extract",
    label: "Extract audio",
    description: "Detach the soundtrack from a video as its own track.",
    icon: AudioLines,
    tool: "audio",
    accept: "video/*",
    multi: false,
  },
  {
    id: "music",
    label: "Add music",
    description: "Drop in an audio file and mix it under your clips.",
    icon: Music,
    tool: "audio",
    accept: "audio/*",
    multi: false,
  },
];

function AiLab() {
  const navigate = useNavigate();
  const projects = useProjects();
  const inputRef = useRef<HTMLInputElement>(null);
  const pending = useRef<Preset | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function launch(preset: Preset) {
    pending.current = preset;
    const input = inputRef.current;
    if (!input) return;
    input.accept = preset.accept;
    input.multiple = preset.multi;
    input.click();
  }

  async function handleFiles(files: File[]) {
    const preset = pending.current;
    if (!preset || files.length === 0) return;
    const tool = getTool(preset.tool);
    setBusy(true);
    try {
      const { project } = await createProjectFromFiles(files);
      navigate({
        to: "/editor",
        search: tool ? { project: project.id, tool: tool.id } : { project: project.id },
      });
    } catch {
      setToast("That file could not be read. Try MP4, MOV, JPG, PNG or MP3.");
    } finally {
      setBusy(false);
      pending.current = null;
    }
  }

  return (
    <Screen>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl leading-tight">AI LAB</h1>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-dim">
            <Sparkles className="h-3 w-3 text-brand" /> Smart shortcuts that run on this device
          </p>
        </div>
        <span className="rounded-full bg-brand/15 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-brand">
          On-device
        </span>
      </div>

      <div className="mt-5 rounded-3xl bg-surface p-4">
        <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-dim">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          Cloud generative models are not connected in this build. These shortcuts use the local
          editor — nothing is uploaded, and your files stay in this browser.
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {PRESETS.map((preset) => {
          const Icon = preset.icon;
          return (
            <button
              key={preset.id}
              onClick={() => launch(preset)}
              disabled={busy}
              className="flex w-full items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 text-left transition hover:bg-surface-2 active:scale-[0.99] disabled:opacity-60"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
                {busy && pending.current?.id === preset.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{preset.label}</span>
                <span className="mt-0.5 block text-[10px] leading-snug text-ink-dim">
                  {preset.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base">RECENT EDITS</h2>
          <span className="text-[10px] text-ink-dim">
            {projects.length} project{projects.length === 1 ? "" : "s"}
          </span>
        </div>
        {projects.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-ink/12 px-4 py-6 text-center">
            <p className="text-xs text-ink-dim">
              Pick a shortcut above to create your first project.
            </p>
          </div>
        ) : (
          <div className="mt-3 flex gap-2.5 overflow-x-auto pb-2 [scrollbar-width:none]">
            {projects.slice(0, 8).map((project) => (
              <button
                key={project.id}
                onClick={() => navigate({ to: "/editor", search: { project: project.id } })}
                className="w-28 shrink-0 text-left"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-surface-2">
                  {project.thumbnail ? (
                    <img
                      src={project.thumbnail}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-ink-dim">
                      <Clapperboard className="h-6 w-6" />
                    </span>
                  )}
                  {project.duration > 0 && (
                    <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[8px]">
                      {formatTime(project.duration)}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 truncate text-[11px]">{project.name}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          void handleFiles(files);
        }}
      />

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </Screen>
  );
}
