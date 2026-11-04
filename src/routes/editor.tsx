import { createFileRoute } from "@tanstack/react-router";
import { EditorScreen } from "@/components/screens";

export const Route = createFileRoute("/editor")({
  head: () => ({
    meta: [
      { title: "Editor — EDIT+" },
      { name: "description", content: "Edit your video timeline with split, audio, text and effects." },
      { property: "og:title", content: "Editor — EDIT+" },
      { property: "og:description", content: "Video timeline editor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <EditorScreen />,
});
