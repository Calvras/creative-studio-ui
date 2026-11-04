import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { X, Check, Gem } from "lucide-react";
import { meta } from "@/components/bottom-nav";
import car from "@/assets/car.jpg";

export const Route = createFileRoute("/premium")({
  head: () => meta("EDIT+ Ultra — Premium", "Unlock Ultra credits, native 4K and top AI features."),
  component: Premium,
});

const perks = [
  ["8645", " monthly credits for AI creation at scale"],
  ["4K", " native generation for ultra-sharp results"],
  ["", "More generations with industry-leading models"],
  ["", "Exclusive access to top AI features"],
];
const plans = [
  { id: "y", name: "Yearly", price: "$79.99", note: "$6.67 / month · Save 45%" },
  { id: "m", name: "Monthly", price: "$11.99", note: "Billed monthly" },
];

function Premium() {
  const [plan, setPlan] = useState("y");
  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-phone text-ink">
      <img src={car} alt="" className="absolute inset-x-0 top-0 h-[55vh] w-full object-cover opacity-60" />
      <div className="absolute inset-x-0 top-0 h-[56vh] bg-gradient-to-b from-transparent via-phone/40 to-phone" />
      <div className="relative flex items-center justify-center px-5 py-5">
        <Link to="/" className="absolute left-5 grid h-9 w-9 place-items-center rounded-full bg-phone/60"><X className="h-4 w-4" /></Link>
        <h1 className="font-display text-lg">EDIT+ ULTRA</h1>
      </div>
      <div className="relative px-5 pt-[30vh]">
        <p className="flex items-center gap-2 text-sm font-semibold text-brand"><Gem className="h-4 w-4" />Ultra</p>
        <h2 className="mt-2 font-display text-3xl leading-tight">CREATE MORE, FASTER, BETTER</h2>
        <ul className="mt-5 space-y-2.5 text-sm">
          {perks.map(([b, t]) => (
            <li key={t} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-brand" /><span><b>{b}</b>{t}</span></li>
          ))}
        </ul>
        <div className="mt-6 space-y-2">
          {plans.map((p) => (
            <button key={p.id} onClick={() => setPlan(p.id)} className={`flex w-full items-center justify-between rounded-2xl border-2 p-4 text-left transition ${plan === p.id ? "border-brand bg-surface" : "border-surface-2"}`}>
              <div><p className="font-semibold">{p.name}</p><p className="text-xs text-ink-dim">{p.note}</p></div>
              <p className="font-display text-lg">{p.price}</p>
            </button>
          ))}
        </div>
        <button className="mt-5 mb-10 w-full rounded-full bg-brand py-4 font-display text-sky-ink">UPGRADE</button>
      </div>
    </div>
  );
}
