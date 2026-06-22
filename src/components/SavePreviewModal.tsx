import { useEffect, useState } from "react";
import type { SaveMode } from "./DrawCanvas";

const MODES: { mode: SaveMode; label: string }[] = [
  { mode: "camera", label: "Camera" },
  { mode: "background", label: "Background" },
  { mode: "transparent", label: "Transparent" },
];

interface Props {
  toPNG: (mode: SaveMode) => string;
  onClose: () => void;
}

export function SavePreviewModal({ toPNG, onClose }: Props) {
  const [mode, setMode] = useState<SaveMode>("camera");
  // The drawing is frozen while the modal is open, so render each preview once
  const [previews] = useState(() =>
    Object.fromEntries(MODES.map((m) => [m.mode, toPNG(m.mode)])),
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const download = () => {
    const a = document.createElement("a");
    a.href = previews[mode];
    a.download = "airdraw.png";
    a.click();
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="border-border bg-card mx-4 flex w-full max-w-lg flex-col gap-4 rounded-lg border p-5 shadow-lg"
      >
        <h2 className="text-lg font-semibold">Export PNG</h2>

        <div
          className="overflow-hidden rounded-md"
          style={{
            backgroundImage:
              "repeating-conic-gradient(#e4e7ef 0% 25%, #ffffff 0% 50%)",
            backgroundSize: "20px 20px",
          }}
        >
          <img
            src={previews[mode]}
            alt="export preview"
            className="aspect-video w-full object-contain"
          />
        </div>

        <div className="border-border flex overflow-hidden rounded-md border text-sm">
          {MODES.map((m) => (
            <button
              key={m.mode}
              onClick={() => setMode(m.mode)}
              className={`flex-1 px-3 py-2 transition-colors ${
                mode === m.mode
                  ? "bg-accent text-white"
                  : "bg-card text-text-muted hover:bg-bg"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="border-border hover:bg-bg rounded-md border px-4 py-2 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={download}
            className="border-accent bg-accent hover:bg-accent-light rounded-md border px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
