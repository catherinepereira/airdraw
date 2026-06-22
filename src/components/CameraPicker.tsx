import type { CameraOption } from "../hooks/useHandTracker";

interface Props {
  cameras: CameraOption[];
  deviceId: string | null;
  onSelect: (deviceId: string) => void;
}

export function CameraPicker({ cameras, deviceId, onSelect }: Props) {
  if (cameras.length < 2) return null;

  return (
    <label className="text-text-muted flex items-center gap-2 text-sm">
      <span>Camera</span>
      <select
        value={deviceId ?? ""}
        onChange={(e) => onSelect(e.target.value)}
        className="border-border bg-card text-text-primary rounded-md border px-2 py-1"
      >
        {cameras.map((c) => (
          <option key={c.deviceId} value={c.deviceId}>
            {c.label}
          </option>
        ))}
      </select>
    </label>
  );
}
