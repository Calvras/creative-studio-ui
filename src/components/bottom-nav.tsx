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
      className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-4"
      style={{ paddingBottom: "max(0.9rem, env(safe-area-inset-bottom))" }}
      aria-label="Main navigation"
    >
      <div className="pointer-events-auto flex items-center gap-0.5 rounded-[28px] border border-white/10 bg-surface/80 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
        {items.map((item) => {
          const active = path === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex min-w-[66px] flex-col items-center gap-1 rounded-[22px] px-3 py-2 text-[10px] font-medium transition active:scale-95 ${
                active ? "bg-brand text-sky-ink shadow-sm" : "text-ink-dim hover:text-ink"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {item.custom ? (
                <EditGlyph className="h-5 w-5" active={active} />
              ) : item.icon ? (
                <item.icon className="h-5 w-5" fill={active ? "currentColor" : "none"} />
              ) : null}
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
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
          paddingBottom: "calc(7.5rem + env(safe-area-inset-bottom))",
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
