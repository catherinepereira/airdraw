import { useRef, useState } from "react";
import { useHandTracker } from "./hooks/useHandTracker";
import {
  DrawCanvas,
  type DrawCanvasHandle,
  type SaveMode,
} from "./components/DrawCanvas";
import { Toolbar } from "./components/Toolbar";

export default function App() {
  const {
    videoRef,
    status,
    error,
    resultRef,
    cameras,
    deviceId,
    selectCamera,
  } = useHandTracker();
  const canvasRef = useRef<DrawCanvasHandle>(null);
  const [hasReference, setHasReference] = useState(false);

  const handleSave = (mode: SaveMode) => {
    const url = canvasRef.current?.toPNG(mode);
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = "airdraw.png";
    a.click();
  };

  const loadReference = (img: HTMLImageElement) => {
    canvasRef.current?.setReference(img);
    setHasReference(true);
  };

  const clearReference = () => {
    canvasRef.current?.setReference(null);
    setHasReference(false);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-5 px-6 py-8">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          air
          <span className="text-accent">draw</span>
        </h1>
        <p className="text-text-muted text-sm">
          Pinch your thumb and index finger to draw
        </p>
      </header>

      <div className="relative">
        <video ref={videoRef} className="hidden" playsInline muted />
        <DrawCanvas ref={canvasRef} videoRef={videoRef} resultRef={resultRef} />
        {status !== "ready" && (
          <div className="bg-card/90 absolute inset-0 flex items-center justify-center rounded-lg text-center">
            {status === "loading" ? (
              <p className="text-text-muted">
                Loading hand tracking and camera...
              </p>
            ) : (
              <div className="max-w-sm px-6">
                <p className="text-pink font-medium">Could not start camera</p>
                <p className="text-text-muted mt-2 text-sm">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Toolbar
        cameras={cameras}
        deviceId={deviceId}
        onSelectCamera={selectCamera}
        hasReference={hasReference}
        onLoadReference={loadReference}
        onClearReference={clearReference}
        onUndo={() => canvasRef.current?.undo()}
        onRedo={() => canvasRef.current?.redo()}
        onClear={() => canvasRef.current?.clear()}
        onSave={handleSave}
      />
    </div>
  );
}
