import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowUp,
  AudioLines,
  Clapperboard,
  ImageIcon,
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
  head: () =>
    meta(
      "Edro AI — On-device editing assistant",
      "Describe an edit and Edro opens the right local tool.",
    ),
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
  reply: string;
};

const PRESETS: Preset[] = [
  {
    id: "photo",
    label: "Quick photo edit",
    description: "Filters and adjustments, ready to go.",
    icon: ImageIcon,
    tool: "filters",
    accept: "image/*",
    multi: false,
    reply: "I'll open the colour and filter tools. Pick a photo and I'll take you straight there.",
  },
  {
    id: "autocut",
    label: "Beat-ready timeline",
    description: "Import clips and cut them on the timeline.",
    icon: Scissors,
    tool: "split",
    accept: "video/*",
    multi: true,
    reply: "Let's build the cut. I'll import your clips and open Split so you can trim each one.",
  },
  {
    id: "frame",
    label: "Grab a frame",
    description: "Pull a full-resolution still from a video.",
    icon: Clapperboard,
    tool: "export",
    accept: "video/*",
    multi: false,
    reply: "I'll grab a full-resolution still. Choose the video and I'll open the frame export.",
  },
  {
    id: "extract",
    label: "Extract audio",
    description: "Detach a video's soundtrack as its own track.",
    icon: AudioLines,
    tool: "audio",
    accept: "video/*",
    multi: false,
    reply: "Choose the video and I'll detach its audio onto a new track you can mix.",
  },
  {
    id: "music",
    label: "Add music",
    description: "Drop a track in and mix it under your clips.",
    icon: Music,
    tool: "audio",
    accept: "audio/*",
    multi: false,
    reply: "Pick an audio file and I'll open the mixer so you can balance it under your clips.",
  },
];

const SUGGESTIONS = [
  { text: "Create a reel from my clips", icon: Scissors },
  { text: "Make this photo pop", icon: ImageIcon },
  { text: "Grab a cover frame", icon: Clapperboard },
  { text: "Add music under my video", icon: Music },
];

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
  presetId?: string;
};

function matchPreset(prompt: string): Preset | null {
  const normalized = ` ${prompt.toLowerCase()} `;
  if (/frame|still|thumbnail|cover|screenshot/.test(normalized)) return find("frame");
  if (/music|song|soundtrack|beat|mix/.test(normalized)) return find("music");
  if (/audio|sound|voice|extract|speech/.test(normalized)) return find("extract");
  if (/cut|trim|split|reel|short|clip|video|montage/.test(normalized)) return find("autocut");
  if (/photo|image|picture|filter|colou?r|bright|light/.test(normalized)) return find("photo");
  return null;
}

function find(id: string): Preset | null {
  return PRESETS.find((preset) => preset.id === id) ?? null;
}

function fallbackReply(): string {
  return "I can help with cutting clips, colour, cover frames, audio and music. Tap a suggestion below or describe the edit in your own words.";
}

function AiLab() {
  const navigate = useNavigate();
  const projects = useProjects();
  const inputRef = useRef<HTMLInputElement>(null);
  const pending = useRef<Preset | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const nextId = useRef(1);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages.length]);

  function launch(preset: Preset) {
    pending.current = preset;
    const input = inputRef.current;
    if (!input) return;
    input.accept = preset.accept;
    input.multiple = preset.multi;
    input.click();
  }

  function send(text: string) {
    const prompt = text.trim();
    if (!prompt) return;
    const preset = matchPreset(prompt);
    const user: Message = { id: nextId.current++, role: "user", text: prompt };
    const assistant: Message = {
      id: nextId.current++,
      role: "assistant",
      text: preset ? preset.reply : fallbackReply(),
      ...(preset ? { presetId: preset.id } : {}),
    };
    setMessages((current) => [...current, user, assistant]);
    setDraft("");
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand via-brand to-brand-dark text-sky-ink shadow-lg shadow-brand/20">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl leading-none">Edro AI</h1>
            <p className="mt-1 text-[11px] text-ink-dim">Your editing copilot</p>
          </div>
        </div>
        <span className="rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-brand">
          On-device
        </span>
      </div>

      <section className="relative mt-5 overflow-hidden rounded-[28px] bg-surface p-4 ring-1 ring-white/5">
        <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-brand/15 blur-2xl" />
        <label htmlFor="ai-prompt" className="relative text-[11px] font-medium text-ink-dim">
          What do you want to make?
        </label>
        <textarea
          id="ai-prompt"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send(draft);
            }
          }}
          rows={3}
          placeholder="“Cut my clips into a reel”, “grab a cover frame”, “add music”…"
          className="relative mt-2 w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-ink-dim/70"
        />
        <div className="relative mt-2 flex items-center justify-between gap-3">
          <span className="text-[9px] text-ink-dim">Local · private · nothing uploaded</span>
          <button
            onClick={() => send(draft)}
            disabled={!draft.trim()}
            className="grid h-10 w-10 place-items-center rounded-full bg-brand text-sky-ink transition active:scale-95 disabled:opacity-40"
            aria-label="Send prompt"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </section>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {SUGGESTIONS.map((suggestion) => {
          const Icon = suggestion.icon;
          return (
            <button
              key={suggestion.text}
              onClick={() => send(suggestion.text)}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-surface/70 px-3.5 py-2 text-[11px] text-ink transition active:scale-95 hover:bg-surface-2"
            >
              <Icon className="h-3.5 w-3.5 text-brand" />
              {suggestion.text}
            </button>
          );
        })}
      </div>

      {messages.length > 0 && (
        <div className="mt-5 space-y-3">
          {messages.map((message) =>
            message.role === "user" ? (
              <div key={message.id} className="flex justify-end">
                <p className="max-w-[85%] rounded-3xl rounded-br-lg bg-surface-2 px-4 py-3 text-sm leading-snug">
                  {message.text}
                </p>
              </div>
            ) : (
              <AssistantBubble
                key={message.id}
                text={message.text}
                preset={message.presetId ? find(message.presetId) : null}
                busy={busy}
                onLaunch={launch}
              />
            ),
          )}
          <div ref={endRef} />
        </div>
      )}

      <section className="mt-6">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-dim">
          Start a workflow
        </h2>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          {PRESETS.map((preset) => {
            const Icon = preset.icon;
            return (
              <button
                key={preset.id}
                onClick={() => launch(preset)}
                disabled={busy}
                className="flex flex-col rounded-3xl bg-surface p-4 text-left ring-1 ring-white/5 transition active:scale-[0.98] hover:bg-surface-2 disabled:opacity-60"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand/15 text-brand">
                  {busy && pending.current?.id === preset.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon className="h-[17px] w-[17px]" />
                  )}
                </span>
                <span className="mt-3 text-[12px] font-semibold leading-tight">{preset.label}</span>
                <span className="mt-1 text-[10px] leading-snug text-ink-dim">
                  {preset.description}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-dim">
            Recent edits
          </h2>
          <span className="text-[10px] text-ink-dim">
            {projects.length} project{projects.length === 1 ? "" : "s"}
          </span>
        </div>
        {projects.length === 0 ? (
          <div className="mt-3 rounded-3xl border border-dashed border-white/10 px-4 py-6 text-center">
            <p className="text-xs text-ink-dim">
              Ask for an edit above to create your first project.
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
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-surface-2">
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
                    <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[8px]">
                      {formatTime(project.duration)}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 truncate text-[11px]">{project.name}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      <p className="mt-6 rounded-2xl bg-surface/50 px-4 py-3 text-[10px] leading-relaxed text-ink-dim">
        Edro AI runs on this device and routes your request into the local editor. Cloud generative
        models are not connected in this build, so nothing is uploaded.
      </p>

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

function AssistantBubble({
  text,
  preset,
  busy,
  onLaunch,
}: {
  text: string;
  preset: Preset | null;
  busy: boolean;
  onLaunch: (preset: Preset) => void;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/15 text-brand">
        <Sparkles className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1 rounded-3xl rounded-tl-lg bg-surface px-4 py-3 ring-1 ring-white/5">
        <p className="text-sm leading-snug">{text}</p>
        {preset && (
          <button
            onClick={() => onLaunch(preset)}
            disabled={busy}
            className="mt-3 flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-[11px] font-semibold text-sky-ink transition active:scale-95 disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <preset.icon className="h-3.5 w-3.5" />
            )}
            {preset.accept.startsWith("image")
              ? "Choose a photo"
              : preset.accept.startsWith("audio")
                ? "Choose audio"
                : "Choose a video"}
          </button>
        )}
      </div>
    </div>
  );
}
