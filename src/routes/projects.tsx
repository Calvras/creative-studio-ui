import { useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowUpDown,
  AudioLines,
  FileText,
  Film,
  FolderOpen,
  ImageIcon,
  Loader2,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Screen, meta } from "@/components/bottom-nav";
import { UploadSheet } from "@/components/upload-sheet";
import { BottomSheet, ConfirmDialog, EmptyState, Toast } from "@/components/ui/overlays";
import {
  createProjectFromFiles,
  deleteProject,
  duplicateProject,
  renameProject,
  useProjects,
} from "@/lib/projects-store";
import { useSettings } from "@/lib/settings";
import { formatBytes, formatDate, formatTime } from "@/lib/format";
import type { Project, ProjectKind } from "@/lib/types";

export const Route = createFileRoute("/projects")({
  head: () =>
    meta("Projects — EDIT+", "All projects stored on this device, searchable and filterable."),
  component: Projects,
});

type Filter = "all" | "video" | "photo" | "audio" | "document";
type Sort = "updated" | "created" | "name";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "video", label: "Video" },
  { id: "photo", label: "Photo" },
  { id: "audio", label: "Audio" },
  { id: "document", label: "Files" },
];

const KIND_ICON: Record<ProjectKind, typeof Film> = {
  video: Film,
  photo: ImageIcon,
  audio: AudioLines,
  document: FileText,
  mixed: FolderOpen,
  empty: FolderOpen,
};

function matchesKind(project: Project, filter: Filter): boolean {
  if (filter === "all") return true;
  if (filter === "photo") return project.media.some((asset) => asset.kind === "image");
  if (filter === "document") return project.media.some((asset) => asset.kind === "document");
  return project.media.some((asset) => asset.kind === filter);
}

function Projects() {
  const navigate = useNavigate();
  const projects = useProjects();
  const settings = useSettings();
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("updated");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<Project | null>(null);
  const [renaming, setRenaming] = useState<Project | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = projects
      .filter((project) => matchesKind(project, filter))
      .filter((project) => !q || project.name.toLowerCase().includes(q));
    return [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "created") return b.createdAt.localeCompare(a.createdAt);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [projects, filter, query, sort]);

  async function create(files: File[]) {
    setCreating(true);
    try {
      const { project } = await createProjectFromFiles(files);
      navigate({ to: "/editor", search: { project: project.id } });
    } catch {
      setToast("Could not read those files. Try MP4, JPG, PNG or PDF.");
    } finally {
      setCreating(false);
    }
  }

  function open(project: Project) {
    navigate({ to: "/editor", search: { project: project.id } });
  }

  async function remove(project: Project) {
    await deleteProject(project.id);
    setPendingDelete(null);
    setToast(`“${project.name}” deleted`);
  }

  async function duplicate(project: Project) {
    const copy = await duplicateProject(project.id);
    if (copy) setToast(`Duplicated as “${copy.name}”`);
  }

  return (
    <Screen>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">PROJECTS</h1>
          <p className="mt-1 text-[11px] text-ink-dim">{projects.length} on this device</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSearchOpen((value) => !value)}
            className="grid h-9 w-9 place-items-center rounded-full bg-surface-2"
            aria-label="Search projects"
            aria-expanded={searchOpen}
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            onClick={() =>
              setSort((value) =>
                value === "updated" ? "created" : value === "created" ? "name" : "updated",
              )
            }
            className="flex h-9 items-center gap-1.5 rounded-full bg-surface-2 px-3 text-[10px] capitalize"
            aria-label={`Sort by ${sort}`}
          >
            <ArrowUpDown className="h-3.5 w-3.5" /> {sort}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-surface px-3 py-2.5">
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

      <div className="mt-4 flex gap-2 overflow-x-auto [scrollbar-width:none]">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs transition ${
              filter === item.id ? "bg-brand text-sky-ink" : "border border-surface-2 text-ink-dim"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-7 w-7" />}
          title="No projects yet"
          description="Import a photo, video, audio file or document. Everything is processed on this device."
          action={
            <button
              onClick={() => setUploadOpen(true)}
              className="flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-sky-ink"
            >
              <Plus className="h-4 w-4" /> New project
            </button>
          }
        />
      ) : visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink-dim">
          {query.trim() ? `No projects match “${query.trim()}”.` : "No projects in this filter."}
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {visible.map((project) => {
            const Icon = KIND_ICON[project.kind];
            const bytes = project.media.reduce((sum, asset) => sum + asset.size, 0);
            return (
              <div key={project.id} className="relative overflow-hidden rounded-2xl bg-surface">
                <button
                  onClick={() => open(project)}
                  className="block w-full text-left"
                  aria-label={`Open ${project.name}`}
                >
                  <div className="relative aspect-square w-full bg-surface-2">
                    {project.thumbnail ? (
                      <img
                        src={project.thumbnail}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-ink-dim">
                        <Icon className="h-8 w-8" />
                      </span>
                    )}
                    {project.duration > 0 && (
                      <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px]">
                        {formatTime(project.duration)}
                      </span>
                    )}
                    {project.clips.length > 0 && (
                      <span className="absolute left-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/55">
                        <Play className="h-3 w-3 fill-ink" />
                      </span>
                    )}
                  </div>
                  <div className="p-2.5 pr-9">
                    <p className="truncate text-xs font-semibold">{project.name}</p>
                    <p className="mt-0.5 text-[9px] text-ink-dim">
                      {formatDate(project.updatedAt)} · {formatBytes(bytes)}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setMenuFor(project)}
                  className="absolute bottom-2.5 right-2 grid h-7 w-7 place-items-center rounded-full bg-surface-2"
                  aria-label={`Options for ${project.name}`}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => setUploadOpen(true)}
          disabled={creating}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand py-3 text-sm font-semibold text-sky-ink disabled:opacity-60"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{" "}
          New project
        </button>
        <button
          onClick={() => photoInput.current?.click()}
          className="grid h-11 w-11 place-items-center rounded-full bg-surface-2"
          aria-label="Quick add photos"
        >
          <ImageIcon className="h-4 w-4" />
        </button>
      </div>

      <input
        ref={photoInput}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length > 0) void create(files);
        }}
      />

      <UploadSheet open={uploadOpen} onClose={() => setUploadOpen(false)} onFiles={create} />

      <BottomSheet
        open={menuFor !== null}
        onClose={() => setMenuFor(null)}
        title={menuFor?.name}
        subtitle="Project options"
      >
        {menuFor && (
          <div className="space-y-1 pb-2">
            <MenuRow
              label="Open"
              onClick={() => {
                open(menuFor);
                setMenuFor(null);
              }}
            />
            <MenuRow
              label="Rename"
              onClick={() => {
                setRenameValue(menuFor.name);
                setRenaming(menuFor);
                setMenuFor(null);
              }}
            />
            <MenuRow
              label="Duplicate"
              onClick={() => {
                void duplicate(menuFor);
                setMenuFor(null);
              }}
            />
            <MenuRow
              label="Export"
              onClick={() => {
                navigate({ to: "/editor", search: { project: menuFor.id, tool: "export" } });
                setMenuFor(null);
              }}
            />
            <MenuRow
              label="Delete"
              danger
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => {
                const target = menuFor;
                setMenuFor(null);
                if (settings.confirmDelete) setPendingDelete(target);
                else void remove(target);
              }}
            />
          </div>
        )}
      </BottomSheet>

      <BottomSheet
        open={renaming !== null}
        onClose={() => setRenaming(null)}
        title="Rename project"
      >
        <input
          value={renameValue}
          onChange={(event) => setRenameValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && renameValue.trim() && renaming) {
              renameProject(renaming.id, renameValue);
              setRenaming(null);
              setToast("Project renamed");
            }
          }}
          autoFocus
          className="w-full rounded-xl bg-surface-2 px-4 py-3 text-sm outline-none ring-brand/60 focus:ring-1"
        />
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setRenaming(null)}
            className="flex-1 rounded-full border border-surface-2 py-3 text-sm text-ink-dim"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (renaming && renameValue.trim()) {
                renameProject(renaming.id, renameValue);
                setRenaming(null);
                setToast("Project renamed");
              }
            }}
            disabled={!renameValue.trim()}
            className="flex-1 rounded-full bg-brand py-3 text-sm font-semibold text-sky-ink disabled:opacity-50"
          >
            Rename
          </button>
        </div>
      </BottomSheet>

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
          if (pendingDelete) void remove(pendingDelete);
        }}
      />

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </Screen>
  );
}

function MenuRow({
  label,
  onClick,
  danger = false,
  icon,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition hover:bg-surface-2 ${
        danger ? "text-red-400" : "text-ink"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
