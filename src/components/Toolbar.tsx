import type { CameraOption } from "../hooks/useHandTracker";
import type { SaveMode } from "./DrawCanvas";
import { ColorPicker } from "./ColorPicker";
import { BrushSlider } from "./BrushSlider";
import { SmoothingSlider } from "./SmoothingSlider";
import { BackgroundToggle } from "./BackgroundToggle";
import { CameraPicker } from "./CameraPicker";
import { ReferenceLoader } from "./ReferenceLoader";
import { SaveMenu } from "./SaveMenu";

const BTN =
  "rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-bg";

interface Props {
  cameras: CameraOption[];
  deviceId: string | null;
  onSelectCamera: (deviceId: string) => void;
  hasReference: boolean;
  onLoadReference: (img: HTMLImageElement) => void;
  onClearReference: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSave: (mode: SaveMode) => void;
}

export function Toolbar({
  cameras,
  deviceId,
  onSelectCamera,
  hasReference,
  onLoadReference,
  onClearReference,
  onUndo,
  onRedo,
  onClear,
  onSave,
}: Props) {
  return (
    <div className="border-border bg-card flex flex-col gap-4 rounded-lg border px-5 py-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ColorPicker />
        <BrushSlider />
        <SmoothingSlider />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <BackgroundToggle />
          <CameraPicker
            cameras={cameras}
            deviceId={deviceId}
            onSelect={onSelectCamera}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReferenceLoader
            hasReference={hasReference}
            onLoad={onLoadReference}
            onClear={onClearReference}
          />
          <button onClick={onUndo} className={BTN}>
            Undo
          </button>
          <button onClick={onRedo} className={BTN}>
            Redo
          </button>
          <button onClick={onClear} className={BTN}>
            Clear
          </button>
          <SaveMenu onSave={onSave} />
        </div>
      </div>
    </div>
  );
}
