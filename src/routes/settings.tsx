import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { meta } from "@/components/bottom-nav";

export const Route = createFileRoute("/settings")({
  head: () => meta("Settings — EDIT+", "App language, uploads, widgets and account settings."),
  component: SettingsPage,
});

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`relative h-6 w-11 rounded-full transition ${on ? "bg-brand" : "bg-surface-2"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-ink transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

function Row({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 text-sm">
      <span>{label}</span>
      {children ?? <span className="flex items-center gap-1 text-ink-dim">{value}{value === undefined && <ChevronRight className="h-4 w-4" />}{value && !/\d/.test(value) && <ChevronRight className="h-4 w-4" />}</span>}
    </div>
  );
}

function SettingsPage() {
  const [ending, setEnding] = useState(true);
  const [ask, setAsk] = useState(false);
  return (
    <div className="min-h-dvh w-full bg-phone px-5 pb-10 text-ink">
      <div className="relative flex items-center justify-center py-5">
        <Link to="/" className="absolute left-0 grid h-9 w-9 place-items-center rounded-full bg-surface-2"><ArrowLeft className="h-4 w-4" /></Link>
        <h1 className="font-display text-lg">SETTINGS</h1>
      </div>
      <div className="divide-y divide-surface-2 overflow-hidden rounded-2xl bg-surface">
        <Row label="App language" value="English" />
        <Row label="Add default ending"><Toggle on={ending} onClick={() => setEnding(!ending)} /></Row>
        <Row label="Auto upload" />
        <Row label="Choose template view" />
        <Row label="Add widgets" />
        <Row label="Ask before using credits"><Toggle on={ask} onClick={() => setAsk(!ask)} /></Row>
      </div>
      <h2 className="mt-6 mb-3 font-display text-base">FEEDBACK & ABOUT</h2>
      <div className="divide-y divide-surface-2 overflow-hidden rounded-2xl bg-surface">
        <Row label="Help Center" />
        <Row label="Trust Center" />
        <Row label="Terms and Policies" />
        <Row label="Clear cache" value="14MB" />
        <Row label="Version" value="3.0.0" />
      </div>
      <button className="mt-6 w-full rounded-full bg-surface-2 py-3 text-sm">Switch account</button>
      <button className="mt-3 w-full rounded-full border border-brand py-3 text-sm text-brand">Sign out</button>
    </div>
  );
}
