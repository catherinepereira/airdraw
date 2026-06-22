import { useDrawStore } from "../stores/drawStore";

export function SmoothingSlider() {
  const smoothing = useDrawStore((s) => s.smoothing);
  const setSmoothing = useDrawStore((s) => s.setSmoothing);

  return (
    <label className="text-text-muted flex items-center gap-3 text-sm">
      <span>Smoothing</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={smoothing}
        onChange={(e) => setSmoothing(Number(e.target.value))}
        className="accent-accent"
      />
    </label>
  );
}
