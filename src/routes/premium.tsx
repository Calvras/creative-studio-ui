import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Gem, ShieldCheck, Sparkles, X } from "lucide-react";
import { meta } from "@/components/bottom-nav";
import { Toast } from "@/components/ui/overlays";
import { startTrial, trialDaysLeft, useSettings } from "@/lib/settings";

export const Route = createFileRoute("/premium")({
  head: () =>
    meta("EDIT+ Ultra — Trial", "Unlock every local editing tool with a 7-day creator trial."),
  component: Premium,
});

const PERKS = [
  "Every timeline, text, audio, filter and transform tool",
  "Unlimited local projects — no file count limit",
  "Full-resolution PNG, JPG and original-file export",
  "No watermark, no upload, no account required",
];

function Premium() {
  const settings = useSettings();
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);
  const active = Boolean(settings.trialStartedAt);
  const daysLeft = trialDaysLeft();

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-phone text-ink">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[42vh] bg-[radial-gradient(120%_80%_at_50%_0%,oklch(0.68_0.19_45/0.32),transparent_70%)]" />
      <div
        className="relative flex items-center justify-center px-5 py-5"
        style={{ paddingTop: "max(1.25rem, calc(env(safe-area-inset-top) + 0.5rem))" }}
      >
        <Link
          to="/"
          className="absolute left-5 grid h-9 w-9 place-items-center rounded-full bg-surface-2"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-lg">EDIT+ ULTRA</h1>
      </div>

      <div
        className="relative px-5 pt-6"
        style={{ paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom))" }}
      >
        <p className="flex items-center gap-2 text-sm font-semibold text-brand">
          <Gem className="h-4 w-4" /> Creator trial
        </p>
        <h2 className="mt-2 font-display text-3xl leading-tight">
          EVERY TOOL,
          <br />
          NO WATERMARK
        </h2>
        <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-ink-dim">
          EDIT+ runs entirely on your device. The trial unlocks the full toolset for 7 days — there
          is no payment step, no card and no upload.
        </p>

        <ul className="mt-6 space-y-3 text-sm">
          {PERKS.map((perk) => (
            <li key={perk} className="flex gap-2.5">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span className="leading-snug">{perk}</span>
            </li>
          ))}
        </ul>

        <div className="mt-7 rounded-2xl bg-surface p-4">
          {active ? (
            <>
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-brand" />
                {daysLeft > 0 ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left` : "Trial ended"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-dim">
                {daysLeft > 0
                  ? "All local tools stay unlocked until the trial ends. Your projects are not affected afterwards."
                  : "Local export and editing still work. Start a project whenever you are ready."}
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">7 days, everything unlocked</span>
                <span className="font-display text-base">FREE</span>
              </div>
              <p className="mt-1 text-xs text-ink-dim">One trial per device. No card required.</p>
            </>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <button
            onClick={() => {
              if (active) {
                navigate({ to: "/" });
                return;
              }
              startTrial();
              setToast("Trial started — every tool is unlocked");
            }}
            className="w-full rounded-full bg-brand py-4 font-display text-sm text-sky-ink transition active:scale-[0.99]"
          >
            {active ? "START EDITING" : "START 7-DAY TRIAL"}
          </button>
          <Link
            to="/"
            className="flex w-full items-center justify-center rounded-full border border-surface-2 py-3.5 text-sm text-ink-dim"
          >
            {active ? "Back to projects" : "Continue free"}
          </Link>
        </div>

        <p className="mt-5 flex items-start gap-2 text-[10px] leading-relaxed text-ink-dim">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Files are processed and stored in this browser. Clearing site data removes them, so export
          anything you want to keep.
        </p>
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
