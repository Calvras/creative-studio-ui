import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "@/components/screens";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EDIT+ — Photo & Video Editor" },
      { name: "description", content: "EDIT+ mobile editor UI: projects dashboard and video timeline editor." },
      { property: "og:title", content: "EDIT+ — Photo & Video Editor" },
      { property: "og:description", content: "Mobile photo and video editing app interface." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <HomeScreen />;
}
