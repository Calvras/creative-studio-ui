import { useRef, useState } from "react";
import {
  AudioLines,
  FileText,
  Film,
  ImageIcon,
  Images,
  Loader2,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { BottomSheet } from "@/components/ui/overlays";
import { acceptFor } from "@/lib/media";
import type { MediaKind } from "@/lib/types";

const MAX_FILES = 24;
const MAX_SIZE = 2 * 1024 * 1024 * 1024;

const choices: Array<{
  kind: MediaKind | "all";
  label: string;
  hint: string;
  icon: typeof Film;
}> = [
  { kind: "all", label: "All media", hint: "Photos, videos, files & audio", icon: Upload },
  { kind: "image", label: "Photos", hint: "JPG · PNG · WEBP · HEIC", icon: ImageIcon },
  { kind: "video", label: "Videos", hint: "MP4 · MOV · WEBM", icon: Film },
  { kind: "document", label: "Files", hint: "PDF · DOCX · TXT · PPTX", icon: FileText },
  { kind: "audio", label: "Audio", hint: "MP3 · WAV · M4A · AAC", icon: AudioLines },
];

export function UploadSheet({
  open,
  onClose,
  onFiles,
  mode = "project",
}: {
  open: boolean;
  onClose: () => void;
  onFiles: (files: File[]) => Promise<void> | void;
  mode?: "project" | "add";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function choose(kind: MediaKind | "all") {
    const input = inputRef.current;
    if (!input) return;
    input.accept = acceptFor(kind);
    input.multiple = true;
    input.click();
  }

  function chooseAllMedia() {
    const input = inputRef.current;
    if (!input) return;
    input.accept = "image/*,video/*";
    input.multiple = true;
    input.click();
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    if (files.length > MAX_FILES) {
      setError(`Choose up to ${MAX_FILES} files at a time.`);
      return;
    }
    const tooBig = files.find((file) => file.size > MAX_SIZE);
    if (tooBig) {
      setError(`“${tooBig.name}” is over 2 GB. Split it or compress it first.`);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onFiles(files);
      onClose();
    } catch {
      setError("Those files could not be read. Try another format.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      title={mode === "add" ? "Add media" : "New project"}
      subtitle={
        mode === "add"
          ? "New clips are appended to the end of the timeline."
          : "Everything is processed and stored on this device. Nothing is uploaded."
      }
    >
      {mode === "project" && (
        <div className="rounded-3xl bg-surface-2/70 p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand/15 text-brand">
              <Images className="h-5 w-5" strokeWidth={1.7} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Allow full access</p>
              <p className="mt-1 text-[11px] leading-snug text-ink-dim">
                Edro asks your device for access to your photos and videos. The picker then shows
                your library — choose one or several.
              </p>
            </div>
          </div>
          <button
            onClick={chooseAllMedia}
            disabled={busy}
            className="mt-4 w-full rounded-full bg-brand py-3.5 text-sm font-semibold text-sky-ink transition active:scale-[0.99] disabled:opacity-50"
          >
            Allow full access
          </button>
          <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] text-ink-dim">
            <ShieldCheck className="h-3 w-3" /> Nothing uploads — media stays on this device
          </p>
        </div>
      )}

      <p
        className={`flex items-center justify-between px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-dim ${
          mode === "project" ? "mt-5" : ""
        }`}
      >
        {mode === "project" ? "Or pick a format" : "What are you adding?"}
      </p>

      <div className="mt-2 grid grid-cols-2 gap-3">
        {choices
          .filter((choice) => mode === "add" || choice.kind !== "all")
          .map((choice) => {
            const Icon = choice.icon;
            const wide = choice.kind === "all";
            return (
              <button
                key={choice.kind}
                disabled={busy}
                onClick={() => choose(choice.kind)}
                className={`flex flex-col items-start gap-3 rounded-2xl bg-surface-2 px-4 py-4 text-left transition active:scale-[0.98] disabled:opacity-50 ${
                  wide ? "col-span-2 flex-row items-center gap-4" : ""
                }`}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand/15 text-brand">
                  <Icon className="h-5 w-5" strokeWidth={1.6} />
                </span>
                <span>
                  <span className="block text-sm font-medium">{choice.label}</span>
                  <span className="mt-0.5 block text-[10px] text-ink-dim">{choice.hint}</span>
                </span>
              </button>
            );
          })}
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          void handleFiles(event.dataTransfer.files);
        }}
        className={`mt-4 rounded-2xl border border-dashed px-4 py-6 text-center text-xs transition ${
          dragOver ? "border-brand bg-brand/10 text-brand" : "border-ink/15 text-ink-dim"
        }`}
      >
        {busy ? (
          <span className="flex items-center justify-center gap-2 text-ink">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading media…
          </span>
        ) : (
          <>
            <Upload className="mx-auto mb-2 h-5 w-5" />
            Drag files here on desktop, or pick a format above.
          </>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
      )}

      <p className="mt-4 text-[10px] leading-relaxed text-ink-dim">
        Up to {MAX_FILES} files, 2 GB each. Large videos stay on your device and may use significant
        storage.
      </p>

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          void handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </BottomSheet>
  );
}
