import { useDrawStore } from "../stores/drawStore";

export function BrushSlider() {
  const brushSize = useDrawStore((s) => s.brushSize);
  const setBrushSize = useDrawStore((s) => s.setBrushSize);

  return (
    <label className="text-text-muted flex items-center gap-3 text-sm">
      <span>Brush</span>
      <input
        type="range"
        min={2}
        max={40}
        value={brushSize}
        onChange={(e) => setBrushSize(Number(e.target.value))}
        className="accent-accent"
      />
      <span className="text-text-primary w-6 tabular-nums">{brushSize}</span>
    </label>
  );
}
