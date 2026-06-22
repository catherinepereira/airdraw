import { useEffect, useRef, useState } from "react";
import type { SaveMode } from "./DrawCanvas";

const MODES: { mode: SaveMode; label: string }[] = [
  { mode: "camera", label: "With camera" },
  { mode: "background", label: "On background" },
  { mode: "transparent", label: "Transparent" },
];

interface Props {
  onSave: (mode: SaveMode) => void;
}

export function SaveMenu({ onSave }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="border-accent bg-accent hover:bg-accent-light rounded-md border px-4 py-2 text-sm font-medium text-white transition-colors"
      >
        Save PNG
      </button>
      {open && (
        <div className="border-border bg-card absolute right-0 z-10 mt-1 overflow-hidden rounded-md border shadow-md">
          {MODES.map((m) => (
            <button
              key={m.mode}
              onClick={() => {
                onSave(m.mode);
                setOpen(false);
              }}
              className="text-text-primary hover:bg-bg block w-full px-4 py-2 text-left text-sm whitespace-nowrap"
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
