import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles, Folder, User, type LucideIcon } from "lucide-react";
import { EditGlyph } from "@/components/icons";

type NavItem = { to: string; label: string; icon?: LucideIcon; custom?: boolean };

const items: NavItem[] = [
  { to: "/", label: "Edit", custom: true },
  { to: "/ai-lab", label: "AI Lab", icon: Sparkles },
  { to: "/projects", label: "Projects", icon: Folder },
  { to: "/me", label: "Me", icon: User },
];

export function BottomNav() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <nav
      className="absolute inset-x-0 bottom-0 z-30 flex justify-around border-t border-ink/5 bg-phone/92 pt-2.5 backdrop-blur-xl"
      style={{ paddingBottom: "max(0.7rem, env(safe-area-inset-bottom))" }}
      aria-label="Main navigation"
    >
      {items.map((item) => {
        const active = path === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex min-w-14 flex-col items-center gap-1 rounded-xl px-3 py-1 ${
              active ? "text-ink" : "text-ink-dim"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {item.custom ? (
              <EditGlyph className="h-5 w-5" active={active} />
            ) : item.icon ? (
              <item.icon className="h-5 w-5" fill={active ? "currentColor" : "none"} />
            ) : null}
            <span className="text-[10px] leading-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-phone text-ink">
      <div
        className="flex-1 overflow-y-auto px-5 [scrollbar-width:none]"
        style={{
          paddingTop: "max(1.25rem, calc(env(safe-area-inset-top) + 0.5rem))",
          paddingBottom: "calc(6.75rem + env(safe-area-inset-bottom))",
        }}
      >
        {children}
      </div>
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
