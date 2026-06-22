import { COLORS, useDrawStore } from "../stores/drawStore";

export function ColorPicker() {
  const color = useDrawStore((s) => s.color);
  const tool = useDrawStore((s) => s.tool);
  const setColor = useDrawStore((s) => s.setColor);
  const setTool = useDrawStore((s) => s.setTool);

  return (
    <div className="flex items-center gap-2">
      {COLORS.map((c) => (
        <button
          key={c}
          aria-label={`color ${c}`}
          onClick={() => setColor(c)}
          style={{ backgroundColor: c }}
          className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${
            tool === "draw" && color === c
              ? "ring-text-primary ring-offset-card ring-2 ring-offset-2"
              : ""
          }`}
        />
      ))}
      <button
        aria-label="eraser"
        title="Eraser"
        onClick={() => setTool("erase")}
        className={`border-border bg-card text-text-muted flex h-7 w-7 items-center justify-center rounded-full border transition-transform hover:scale-110 ${
          tool === "erase"
            ? "ring-text-primary ring-offset-card ring-2 ring-offset-2"
            : ""
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M16 3 21 8 9 20H4v-5L16 3Z" />
          <path d="m11 8 5 5" />
        </svg>
      </button>
      <button
        aria-label="eyedropper"
        title="Pick color from camera"
        onClick={() => setTool("eyedropper")}
        className={`border-border bg-card text-text-muted flex h-7 w-7 items-center justify-center rounded-full border transition-transform hover:scale-110 ${
          tool === "eyedropper"
            ? "ring-text-primary ring-offset-card ring-2 ring-offset-2"
            : ""
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m2 22 1-1h3l9-9" />
          <path d="M3 21v-3l9-9" />
          <path d="m15 6 3.4-3.4a2.1 2.1 0 0 1 3 3L21 6 18 9l-3-3Z" />
        </svg>
      </button>
    </div>
  );
}
