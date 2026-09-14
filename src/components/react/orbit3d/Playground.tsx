"use client";
import { useState } from "react";
import CapabilityStage3D, { type ShapeKind } from "./CapabilityStage3D";

const SHAPES: { id: ShapeKind; label: string }[] = [
  { id: "knot", label: "Flux Knot" },
  { id: "ico", label: "Icosahedron" },
  { id: "torus", label: "Orbit Torus" },
  { id: "octa", label: "Octa Core" },
];

export default function Playground() {
  const [kind, setKind] = useState<ShapeKind>("knot");
  return (
    <div>
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {SHAPES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setKind(s.id)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition cursor-pointer ${
              kind === s.id
                ? "bg-cyan-400 text-black shadow-lg shadow-cyan-400/30"
                : "border border-white/15 text-slate-300 hover:border-cyan-300/60 hover:text-white"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="relative h-[420px] md:h-[520px] rounded-3xl border border-white/10 bg-black/40 overflow-hidden">
        <CapabilityStage3D kind={kind} />
        <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-cyan-200/70">
            drag-free · auto-orbit · pointer-reactive
          </p>
        </div>
      </div>
    </div>
  );
}
