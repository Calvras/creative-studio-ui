import type { SVGProps } from "react";

/**
 * Custom "edit" glyph for the bottom navigation: a clapperboard with a play
 * mark, drawn to stay legible at 20px.
 */
export function EditGlyph({ active, ...props }: SVGProps<SVGSVGElement> & { active?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect
        x="3.25"
        y="8.4"
        width="17.5"
        height="12.2"
        rx="3"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.16 : 0}
      />
      <path d="M3.9 12.6h16.2" opacity="0.45" />
      <path d="m4.7 8.15 2.35-4.05M9.8 8.15 12.15 4.1M14.9 8.15l2.35-4.05" />
      <path
        d="M10.35 14.15v4.3l4.15-2.15z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1.1}
        strokeLinejoin="round"
      />
    </svg>
  );
}
