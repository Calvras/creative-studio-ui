import { Link, useRouterState } from "@tanstack/react-router";
import { Layers, Sparkles, Folder, User } from "lucide-react";

const items = [
  { to: "/", icon: Layers, label: "Edit" },
  { to: "/ai-lab", icon: Sparkles, label: "AI Lab" },
  { to: "/projects", icon: Folder, label: "Projects" },
  { to: "/me", icon: User, label: "Me" },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <nav className="absolute inset-x-0 bottom-0 z-20 flex justify-around border-t border-surface-2 bg-phone/95 pb-5 pt-3 backdrop-blur">
      {items.map((it) => {
        const active = path === it.to;
        return (
          <Link key={it.to} to={it.to} className={`flex flex-col items-center gap-1 ${active ? "text-ink" : "text-ink-dim"}`}>
            <it.icon className="h-5 w-5" fill={active ? "currentColor" : "none"} />
            <span className="text-[10px]">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-phone text-ink">
      <div className="flex-1 overflow-y-auto px-5 pb-28 [scrollbar-width:none]">{children}</div>
      <BottomNav />
    </div>
  );
}

export function meta(title: string, description: string) {
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}
