import { createFileRoute } from "@tanstack/react-router";
import { EditorScreen } from "@/components/editor-screen";

type EditorSearch = {
  project?: string;
  tool?: string;
};

export const Route = createFileRoute("/editor")({
  validateSearch: (search: Record<string, unknown>): EditorSearch => ({
    ...(typeof search["project"] === "string" && search["project"]
      ? { project: search["project"] }
      : {}),
    ...(typeof search["tool"] === "string" && search["tool"] ? { tool: search["tool"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Editor — Edro" },
      {
        name: "description",
        content: "Edit your video timeline with split, audio, text and effects.",
      },
      { property: "og:title", content: "Editor — Edro" },
      { property: "og:description", content: "Video timeline editor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditorRoute,
});

function EditorRoute() {
  const search = Route.useSearch();
  return (
    <EditorScreen projectId={search.project ?? undefined} initialTool={search.tool ?? undefined} />
  );
}
