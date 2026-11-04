import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "@/components/home-screen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EDIT+ — Photo & Video Editor" },
      {
        name: "description",
        content: "Import photos, videos, audio and documents, then edit them on a real timeline.",
      },
      { property: "og:title", content: "EDIT+ — Photo & Video Editor" },
      {
        property: "og:description",
        content: "Photo and video editing with a real timeline, text, audio and effects.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomeScreen,
});
