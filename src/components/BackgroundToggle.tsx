import { type Background, useDrawStore } from "../stores/drawStore";

const OPTIONS: { value: Background; label: string }[] = [
  { value: "camera", label: "Camera" },
  { value: "white", label: "White" },
  { value: "black", label: "Black" },
];

export function BackgroundToggle() {
  const background = useDrawStore((s) => s.background);
  const setBackground = useDrawStore((s) => s.setBackground);

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-text-muted">Background</span>
      <div className="border-border flex overflow-hidden rounded-md border">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => setBackground(o.value)}
            className={`px-3 py-1 transition-colors ${
              background === o.value
                ? "bg-accent text-white"
                : "bg-card text-text-muted hover:bg-bg"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
