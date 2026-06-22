import { useRef, useState } from "react";
import { useHandTracker } from "./hooks/useHandTracker";
import { useDrawStore } from "./stores/drawStore";
import { DrawCanvas, type DrawCanvasHandle } from "./components/DrawCanvas";
import { Toolbar } from "./components/Toolbar";
import { ThemeToggle } from "./components/ThemeToggle";
import { CreditLine } from "./components/CreditLine";
import { SavePreviewModal } from "./components/SavePreviewModal";

export default function App() {
  const {
    videoRef,
    status,
    error,
    resultRef,
    cameras,
    deviceId,
    selectCamera,
    enabled,
    setEnabled,
  } = useHandTracker();
  const canvasRef = useRef<DrawCanvasHandle>(null);
  const [exporting, setExporting] = useState(false);
  const color = useDrawStore((s) => s.color);

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-5 px-6 py-8">
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">
          <span aria-hidden="true">🖍️ </span>air
          <span style={{ color }}>draw</span>
        </h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <CreditLine repo="airdraw" />
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-text-muted text-sm">
          Pinch your thumb and index finger to draw
        </p>
        <button
          onClick={() => setEnabled(!enabled)}
          disabled={status === "loading"}
          className="border-border hover:bg-bg rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {enabled ? "Turn camera off" : "Turn camera on"}
        </button>
      </div>

      <div className="relative">
        <video ref={videoRef} className="hidden" playsInline muted />
        <DrawCanvas ref={canvasRef} videoRef={videoRef} resultRef={resultRef} />
        {status !== "ready" && (
          <div className="bg-card/90 absolute inset-0 flex items-center justify-center rounded-lg text-center">
            {status === "loading" ? (
              <p className="text-text-muted">Loading hand tracking...</p>
            ) : status === "error" ? (
              <div className="max-w-sm px-6">
                <p className="text-pink font-medium">Could not start camera</p>
                <p className="text-text-muted mt-2 text-sm">{error}</p>
              </div>
            ) : (
              <button
                onClick={() => setEnabled(true)}
                className="border-accent bg-accent hover:bg-accent-light rounded-md border px-5 py-3 font-medium text-white transition-colors"
              >
                Turn camera on
              </button>
            )}
          </div>
        )}
      </div>

      <Toolbar
        cameras={cameras}
        deviceId={deviceId}
        onSelectCamera={selectCamera}
        onUndo={() => canvasRef.current?.undo()}
        onRedo={() => canvasRef.current?.redo()}
        onClear={() => canvasRef.current?.clear()}
        onExport={() => setExporting(true)}
      />

      {exporting && (
        <SavePreviewModal
          toPNG={(mode) => canvasRef.current?.toPNG(mode) ?? ""}
          onClose={() => setExporting(false)}
        />
      )}
    </div>
  );
}
