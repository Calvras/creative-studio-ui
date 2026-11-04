import { useRef, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  Star,
  Wand2,
  ImageIcon,
  Film,
  MoreHorizontal,
  Plus,
  Calendar,
  Clock,
  HardDrive,
  FolderOpen,
  FileText,
  AudioLines,
  Search,
  X,
  Loader2,
  Trash2,
  LayoutGrid,
} from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { UploadSheet } from "@/components/upload-sheet";
import { ToolsHub } from "@/components/tools-hub";
import { EditGlyph } from "@/components/icons";
import { BottomSheet, ConfirmDialog, Toast } from "@/components/ui/overlays";
import {
  createProjectFromFiles,
  deleteProject,
  duplicateProject,
  renameProject,
  useProjects,
} from "@/lib/projects-store";
import { useSettings } from "@/lib/settings";
import type { EditorTool } from "@/lib/tool-registry";
import type { Project } from "@/lib/types";
import { formatBytes, formatDate, formatTime } from "@/lib/format";

const MAIN_TILES = [
  { id: "ai", label: "AI Lab", icon: Wand2 },
  { id: "photo", label: "Photo editor", icon: ImageIcon },
  { id: "video", label: "Video editor", icon: Film },
  { id: "more", label: "All tools", icon: LayoutGrid },
] as const;

const MENU_ACTIONS = ["Rename", "Duplicate", "Export", "Delete"] as const;
type MenuAction = (typeof MENU_ACTIONS)[number];

function kindName(project: Project): string {
  switch (project.kind) {
    case "photo":
      return "Photo";
    case "video":
      return "Video";
    case "document":
      return "File";
    case "audio":
      return "Audio";
    case "mixed":
      return "Mixed media";
    default:
      return "Project";
  }
}

function ProjectIcon({ project }: { project: Project }) {
  if (project.thumbnail) {
    return (
      <img
        src={project.thumbnail}
        alt=""
        loading="lazy"
        className="h-[74px] w-[74px] shrink-0 rounded-l-2xl object-cover"
      />
    );
  }
  const Icon =
    project.kind === "document" ? FileText : project.kind === "audio" ? AudioLines : FolderOpen;
  return (
    <span className="grid h-[74px] w-[74px] shrink-0 place-items-center rounded-l-2xl bg-surface-2 text-ink-dim">
      <Icon className="h-6 w-6" />
    </span>
  );
}

export function HomeScreen() {
  const navigate = useNavigate();
  const projects = useProjects();
  const settings = useSettings();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<Project | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);
  const [creating, setCreating] = useState(false);
  const pendingTool = useRef<EditorTool | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  const filtered = projects.filter((project) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${project.name} ${kindName(project)}`.toLowerCase().includes(q);
  });

  async function createFromFiles(files: File[]) {
    setCreating(true);
    try {
      const { project } = await createProjectFromFiles(files);
      const tool = pendingTool.current;
      pendingTool.current = null;
      navigate({
        to: "/editor",
        search: tool ? { project: project.id, tool: tool.id } : { project: project.id },
      });
    } catch {
      setToast("Could not read those files. Try MP4, JPG, PNG or PDF.");
    } finally {
      setCreating(false);
    }
  }

  function openEditor(project: Project, toolId?: string) {
    navigate({
      to: "/editor",
      search: toolId ? { project: project.id, tool: toolId } : { project: project.id },
    });
  }

  async function handleMenu(action: MenuAction, project: Project) {
    if (action === "Rename") {
      setRenaming(project);
      return;
    }
    if (action === "Export") {
      openEditor(project, "export");
      return;
    }
    if (action === "Duplicate") {
      const copy = await duplicateProject(project.id);
      if (copy) setToast(`Duplicated as “${copy.name}”`);
      return;
    }
    if (action === "Delete") {
      if (settings.confirmDelete) setPendingDelete(project);
      else await removeProject(project);
    }
  }

  async function removeProject(project: Project) {
    await deleteProject(project.id);
    setPendingDelete(null);
    setToast(`“${project.name}” deleted`);
  }

  function handleToolPick(tool: EditorTool) {
    const latest = projects[0];
    if (latest) {
      openEditor(latest, tool.id);
      return;
    }
    pendingTool.current = tool;
    setUploadOpen(true);
    setToast(`Add media to start using ${tool.label}`);
  }

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-phone text-ink">
      <div
        className="flex-1 overflow-y-auto px-5 [scrollbar-width:none]"
        style={{
          paddingTop: "max(1rem, calc(env(safe-area-inset-top) + 0.5rem))",
          paddingBottom: "calc(7.5rem + env(safe-area-inset-bottom))",
        }}
      >
        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <img src="/logo.jpg" alt="" className="h-8 w-8 rounded-lg object-cover" />
            <h1 className="font-display text-xl">EDIT+</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSearchOpen((value) => !value);
                setQuery("");
              }}
              className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 text-ink"
              aria-label={searchOpen ? "Close project search" : "Search projects"}
              aria-expanded={searchOpen}
            >
              {searchOpen ? <X className="h-3.5 w-3.5" /> : <Search className="h-3.5 w-3.5" />}
            </button>
            <Link
              to="/premium"
              className="flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-medium"
            >
              <Star className="h-3.5 w-3.5 fill-ink" /> Premium
            </Link>
          </div>
        </header>

        {searchOpen && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-surface px-3 py-2.5">
            <Search className="h-4 w-4 text-ink-dim" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search projects"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-dim"
            />
          </div>
        )}

        <div className="mt-5 grid grid-cols-4 gap-3">
          {MAIN_TILES.map((tile) => (
            <button
              key={tile.id}
              onClick={() => {
                if (tile.id === "ai") navigate({ to: "/ai-lab" });
                else if (tile.id === "photo") photoInput.current?.click();
                else if (tile.id === "video") videoInput.current?.click();
                else setToolsOpen(true);
              }}
              className="flex flex-col items-center gap-2"
              aria-label={tile.label}
            >
              <span className="grid aspect-square w-full place-items-center rounded-3xl bg-surface ring-1 ring-white/5 transition active:scale-95 hover:bg-surface-2">
                <tile.icon className="h-6 w-6" strokeWidth={1.5} />
              </span>
              <span className="text-[10px] text-ink">{tile.label}</span>
            </button>
          ))}
        </div>

        <input
          ref={photoInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            if (files.length > 0) void createFromFiles(files);
          }}
        />
        <input
          ref={videoInput}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            if (files.length > 0) void createFromFiles(files);
          }}
        />

        <div className="mt-5 flex items-center gap-4 rounded-3xl bg-sky p-4 text-sky-ink">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl">NEW PROJECT</h2>
            <p className="mt-1 text-xs">
              {projects.length === 0
                ? "Photos, videos, audio and files"
                : `${projects.length} project${projects.length === 1 ? "" : "s"} on this device`}
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sky-ink/10 px-3 py-1 text-[10px] font-semibold">
              <EditGlyph className="h-3 w-3" /> LOCAL & PRIVATE
            </span>
          </div>
          <button
            onClick={() => setUploadOpen(true)}
            disabled={creating}
            className="grid h-[74px] w-[74px] shrink-0 place-items-center rounded-full border-2 border-dashed border-sky-ink/55 transition active:scale-95 disabled:opacity-60"
            aria-label="Create new project"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-sky-ink text-sky">
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </span>
          </button>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="font-display text-lg">PROJECTS</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setToolsOpen(true)}
              className="rounded-full border border-ink/25 px-3 py-1 text-xs text-ink-dim"
            >
              Tools
            </button>
            <Link to="/projects" className="rounded-full border border-ink/40 px-3 py-1 text-xs">
              View all
            </Link>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {projects.length === 0 && (
            <div className="rounded-2xl border border-dashed border-ink/12 py-9 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-surface text-ink-dim">
                <FolderOpen className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-medium">No projects yet</p>
              <p className="mt-1 text-[11px] text-ink-dim">
                Import a photo, video or file to start editing.
              </p>
              <button
                onClick={() => setUploadOpen(true)}
                className="mt-4 rounded-full bg-surface-2 px-4 py-2 text-xs font-medium"
              >
                Choose media
              </button>
            </div>
          )}

          {projects.length > 0 && filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-ink-dim">No projects match “{query}”.</p>
          )}

          {filtered.map((project) => (
            <div
              key={project.id}
              className="relative flex rounded-2xl bg-surface transition hover:bg-surface-2"
            >
              <button
                onClick={() => openEditor(project)}
                className="flex min-w-0 flex-1 gap-3 pr-12 text-left"
                aria-label={`Open ${project.name}`}
              >
                <ProjectIcon project={project} />
                <div className="flex min-w-0 flex-1 flex-col py-2">
                  <p className="truncate text-sm font-semibold">{project.name}</p>
                  <p className="text-[11px] text-ink-dim">
                    {kindName(project)} · {project.media.length} item
                    {project.media.length === 1 ? "" : "s"}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-2 text-[9px] text-ink-dim">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5" />
                      {formatDate(project.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {formatTime(project.duration)}
                    </span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-2.5 w-2.5" />
                      {formatBytes(project.media.reduce((sum, asset) => sum + asset.size, 0))}
                    </span>
                  </div>
                </div>
              </button>
              <div className="absolute right-2.5 top-2.5">
                <ProjectMenu project={project} onAction={handleMenu} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />

      <UploadSheet
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onFiles={createFromFiles}
      />
      <ToolsHub
        open={toolsOpen}
        onClose={() => setToolsOpen(false)}
        onPick={handleToolPick}
        hasClip={false}
        hint="Pick a tool, then add media to use it. Every tool works on this device."
      />

      <RenameDialog
        key={renaming?.id ?? "none"}
        project={renaming}
        onCancel={() => setRenaming(null)}
        onConfirm={(name) => {
          if (renaming) {
            renameProject(renaming.id, name);
            setToast("Project renamed");
          }
          setRenaming(null);
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete project?"
        message={
          pendingDelete
            ? `“${pendingDelete.name}” and its media will be removed from this device. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) void removeProject(pendingDelete);
        }}
      />

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

function ProjectMenu({
  project,
  onAction,
}: {
  project: Project;
  onAction: (action: MenuAction, project: Project) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="grid h-7 w-7 place-items-center rounded-full bg-surface-2 text-ink transition hover:bg-ink/10"
        aria-label={`Options for ${project.name}`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {open && (
        <>
          <button
            className="fixed inset-0 z-20 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <div
            className="absolute right-0 top-8 z-30 min-w-[150px] overflow-hidden rounded-2xl bg-surface-2 shadow-xl ring-1 ring-white/10"
            role="menu"
          >
            {MENU_ACTIONS.map((action) => (
              <button
                key={action}
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onAction(action, project);
                }}
                className={`flex w-full items-center gap-2 px-4 py-3 text-left text-xs transition hover:bg-surface ${
                  action === "Delete" ? "text-red-400" : "text-ink"
                }`}
              >
                {action === "Delete" && <Trash2 className="h-3.5 w-3.5" />}
                {action}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RenameDialog({
  project,
  onCancel,
  onConfirm,
}: {
  project: Project | null;
  onCancel: () => void;
  onConfirm: (name: string) => void;
}) {
  const [value, setValue] = useState(project?.name ?? "");

  return (
    <BottomSheet open={project !== null} onClose={onCancel} title="Rename project">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && value.trim()) onConfirm(value.trim());
          if (event.key === "Escape") onCancel();
        }}
        autoFocus
        className="w-full rounded-xl bg-surface-2 px-4 py-3 text-sm outline-none ring-brand/60 focus:ring-1"
      />
      <div className="mt-4 flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 rounded-full border border-surface-2 py-3 text-sm text-ink-dim"
        >
          Cancel
        </button>
        <button
          onClick={() => value.trim() && onConfirm(value.trim())}
          disabled={!value.trim()}
          className="flex-1 rounded-full bg-brand py-3 text-sm font-semibold text-sky-ink disabled:opacity-50"
        >
          Rename
        </button>
      </div>
    </BottomSheet>
  );
}
