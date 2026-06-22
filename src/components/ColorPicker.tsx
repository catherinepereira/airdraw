import { COLORS, useDrawStore } from "../stores/drawStore";

const RAINBOW =
  "conic-gradient(red, orange, yellow, lime, cyan, blue, magenta, red)";

export function ColorPicker() {
  const color = useDrawStore((s) => s.color);
  const tool = useDrawStore((s) => s.tool);
  const setColor = useDrawStore((s) => s.setColor);
  const setTool = useDrawStore((s) => s.setTool);

  const customActive =
    tool === "draw" && !COLORS.includes(color as (typeof COLORS)[number]);

  return (
    <div className="flex items-center gap-2">
      {COLORS.map((c) => (
        <button
          key={c}
          aria-label={`color ${c}`}
          onClick={() => setColor(c)}
          style={{ backgroundColor: c }}
          className={`border-border h-7 w-7 rounded-full border transition-transform hover:scale-110 ${
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
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 20H8.5a2 2 0 0 1-1.42-.59l-4.49-4.49a2 2 0 0 1 0-2.83l8.5-8.5a2 2 0 0 1 2.83 0l4.99 4.99a2 2 0 0 1 0 2.83L12.83 20" />
          <path d="m6.5 11.5 6 6" />
        </svg>
      </button>
      <button
        aria-label="eyedropper"
        title="Pick color: hover the image, pinch to grab"
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
      <label
        title="Custom color"
        style={{ background: customActive ? color : RAINBOW }}
        className={`border-border relative h-7 w-7 cursor-pointer rounded-full border transition-transform hover:scale-110 ${
          customActive
            ? "ring-text-primary ring-offset-card ring-2 ring-offset-2"
            : ""
        }`}
      >
        <input
          type="color"
          aria-label="custom color"
          value={customActive ? color : "#000000"}
          onChange={(e) => setColor(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}
