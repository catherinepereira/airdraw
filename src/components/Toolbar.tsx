import type { CameraOption } from "../hooks/useHandTracker";
import { ColorPicker } from "./ColorPicker";
import { BrushSlider } from "./BrushSlider";
import { BackgroundToggle } from "./BackgroundToggle";
import { CameraPicker } from "./CameraPicker";

const ICON_BTN =
  "flex h-9 w-9 items-center justify-center rounded-md border border-border text-text-muted transition-colors hover:bg-bg hover:text-text-primary";

interface Props {
  cameras: CameraOption[];
  deviceId: string | null;
  onSelectCamera: (deviceId: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
}

export function Toolbar({
  cameras,
  deviceId,
  onSelectCamera,
  onUndo,
  onRedo,
  onClear,
  onExport,
}: Props) {
  return (
    <div className="border-border bg-card flex flex-col gap-4 rounded-lg border px-5 py-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ColorPicker />
        <div className="flex items-center gap-2">
          <button
            onClick={onUndo}
            className={ICON_BTN}
            title="Undo"
            aria-label="Undo"
          >
            <UndoIcon />
          </button>
          <button
            onClick={onRedo}
            className={ICON_BTN}
            title="Redo"
            aria-label="Redo"
          >
            <RedoIcon />
          </button>
          <button
            onClick={onClear}
            className={ICON_BTN}
            title="Clear"
            aria-label="Clear"
          >
            <ClearIcon />
          </button>
        </div>
      </div>

      <div className="border-border flex flex-col gap-3 border-t pt-3">
        <BrushSlider />
        <BackgroundToggle />
        <CameraPicker
          cameras={cameras}
          deviceId={deviceId}
          onSelect={onSelectCamera}
        />
      </div>

      <button
        onClick={onExport}
        className="border-accent bg-accent hover:bg-accent-light rounded-md border px-4 py-2 text-sm font-medium text-white transition-colors"
      >
        Export PNG
      </button>
    </div>
  );
}

function UndoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
