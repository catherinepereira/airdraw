import { useEffect, useImperativeHandle, useRef } from "react";
import type { HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { useDrawStore } from "../stores/drawStore";
import { indexTip, pinchDistance, type Point } from "../utils/landmarks";
import { Point2DFilter } from "../utils/oneEuro";

// Pinch hysteresis (normalized thumb-index distance). Fingers must come within
// PINCH_ON to start, and open past PINCH_OFF to release. The gap stops the
// pinch from chattering at a single boundary
const PINCH_ON = 0.045;
const PINCH_OFF = 0.075;

// Snapshots beyond this are dropped so the undo stack can't grow without bound
const MAX_UNDO = 30;

// The color picker samples this far above the fingertip so the finger itself
// does not block the color being read
const PICK_OFFSET_Y = 44;

export type SaveMode = "camera" | "background" | "transparent";

export interface DrawCanvasHandle {
  clear: () => void;
  undo: () => void;
  redo: () => void;
  toPNG: (mode: SaveMode) => string;
}

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  resultRef: React.RefObject<HandLandmarkerResult | null>;
  ref: React.Ref<DrawCanvasHandle>;
}

const BG_FILL: Record<string, string> = { white: "#ffffff", black: "#1a1c23" };

export function DrawCanvas({ videoRef, resultRef, ref }: Props) {
  // Visible canvas shows background + ink + cursor, ink layer persists
  const displayRef = useRef<HTMLCanvasElement>(null);
  const inkRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  const lastPoint = useRef<Point | null>(null);
  // One-Euro filter on the fingertip, reset whenever the hand is lost
  const filter = useRef(new Point2DFilter());
  const hadHand = useRef(false);
  const wasPinching = useRef(false);
  // Color under the picker and the point it samples from, while picking
  const hoverColor = useRef<string | null>(null);
  const pickPoint = useRef<Point | null>(null);
  // ImageData per stroke. undo moves the current state onto redo and vice versa
  const undoStack = useRef<ImageData[]>([]);
  const redoStack = useRef<ImageData[]>([]);

  // Read live tool settings inside the rAF loop without re-subscribing
  const colorRef = useRef(useDrawStore.getState().color);
  const sizeRef = useRef(useDrawStore.getState().brushSize);
  const toolRef = useRef(useDrawStore.getState().tool);
  const bgRef = useRef(useDrawStore.getState().background);
  useEffect(
    () =>
      useDrawStore.subscribe((s) => {
        colorRef.current = s.color;
        sizeRef.current = s.brushSize;
        toolRef.current = s.tool;
        bgRef.current = s.background;
      }),
    [],
  );

  const snapshotInk = () => {
    const ink = inkRef.current.getContext("2d")!;
    return ink.getImageData(0, 0, inkRef.current.width, inkRef.current.height);
  };

  const restoreInk = (data: ImageData) => {
    inkRef.current.getContext("2d")?.putImageData(data, 0, 0);
    lastPoint.current = null;
  };

  useImperativeHandle(ref, () => ({
    clear() {
      const ink = inkRef.current;
      ink.getContext("2d")?.clearRect(0, 0, ink.width, ink.height);
      lastPoint.current = null;
      undoStack.current = [];
      redoStack.current = [];
    },
    undo() {
      const prev = undoStack.current.pop();
      if (!prev) return;
      redoStack.current.push(snapshotInk());
      restoreInk(prev);
    },
    redo() {
      const next = redoStack.current.pop();
      if (!next) return;
      undoStack.current.push(snapshotInk());
      restoreInk(next);
    },
    toPNG(mode) {
      const ink = inkRef.current;
      const out = document.createElement("canvas");
      out.width = ink.width;
      out.height = ink.height;
      const ctx = out.getContext("2d")!;
      if (mode === "camera" && videoRef.current) {
        ctx.save();
        ctx.translate(out.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, out.width, out.height);
        ctx.restore();
      } else if (mode === "background") {
        ctx.fillStyle = BG_FILL[bgRef.current] ?? "#ffffff";
        ctx.fillRect(0, 0, out.width, out.height);
      }
      ctx.drawImage(ink, 0, 0);
      return out.toDataURL("image/png");
    },
  }));

  useEffect(() => {
    let rafId = 0;
    let canceled = false;

    const sizeToVideo = () => {
      const video = videoRef.current;
      const display = displayRef.current;
      if (!video || !display || !video.videoWidth) return false;
      if (display.width !== video.videoWidth) {
        display.width = video.videoWidth;
        display.height = video.videoHeight;
        inkRef.current.width = video.videoWidth;
        inkRef.current.height = video.videoHeight;
      }
      return true;
    };

    const render = () => {
      if (canceled) return;
      rafId = requestAnimationFrame(render);
      const video = videoRef.current;
      const display = displayRef.current;
      if (!video || !display || !sizeToVideo()) return;

      const ctx = display.getContext("2d")!;
      const w = display.width;
      const h = display.height;

      // Background: mirrored camera, or a flat fill
      if (bgRef.current === "camera") {
        ctx.save();
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, w, h);
        ctx.restore();
      } else {
        ctx.fillStyle = BG_FILL[bgRef.current];
        ctx.fillRect(0, 0, w, h);
      }

      const hands = resultRef.current?.landmarks;
      let cursor: Point | null = null;
      let pinching = false;
      if (hands && hands.length > 0) {
        const lm = hands[0];
        const tip = indexTip(lm);
        const raw = { x: (1 - tip.x) * w, y: tip.y * h };
        // Start the filter fresh when the hand reappears so the cursor doesn't
        // ease in from a stale position
        if (!hadHand.current) filter.current = new Point2DFilter();
        hadHand.current = true;
        cursor = filter.current.filter(raw, performance.now() / 1000);
        const d = pinchDistance(lm);
        pinching = wasPinching.current ? d < PINCH_OFF : d < PINCH_ON;
        wasPinching.current = pinching;
      } else {
        hadHand.current = false;
        wasPinching.current = false;
      }

      const tool = toolRef.current;

      if (tool === "eyedropper") {
        // Track the color every frame, commit it on pinch. Sample above the
        // fingertip so the finger does not cover the color being read
        if (cursor) {
          const sx = cursor.x;
          const sy = Math.max(0, cursor.y - PICK_OFFSET_Y);
          const px = ctx.getImageData(sx, sy, 1, 1).data;
          hoverColor.current =
            "#" +
            [px[0], px[1], px[2]]
              .map((c) => c.toString(16).padStart(2, "0"))
              .join("");
          pickPoint.current = { x: sx, y: sy };
          if (pinching) {
            useDrawStore.getState().setColor(hoverColor.current); // switches to draw
          }
        } else {
          hoverColor.current = null;
          pickPoint.current = null;
        }
        lastPoint.current = null;
      } else if (cursor && pinching) {
        const ink = inkRef.current.getContext("2d")!;
        const erasing = tool === "erase";
        ink.globalCompositeOperation = erasing
          ? "destination-out"
          : "source-over";
        ink.strokeStyle = colorRef.current;
        ink.fillStyle = colorRef.current;
        ink.lineCap = "round";
        ink.lineJoin = "round";
        ink.lineWidth = sizeRef.current;
        if (lastPoint.current) {
          ink.beginPath();
          ink.moveTo(lastPoint.current.x, lastPoint.current.y);
          ink.lineTo(cursor.x, cursor.y);
          ink.stroke();
        } else {
          // A new stroke begins: snapshot for undo and drop the redo history
          undoStack.current.push(snapshotInk());
          if (undoStack.current.length > MAX_UNDO) undoStack.current.shift();
          redoStack.current = [];
          ink.beginPath();
          ink.arc(cursor.x, cursor.y, sizeRef.current / 2, 0, Math.PI * 2);
          ink.fill();
        }
        ink.globalCompositeOperation = "source-over";
        lastPoint.current = cursor;
      } else {
        lastPoint.current = null;
      }

      ctx.drawImage(inkRef.current, 0, 0);

      if (tool !== "eyedropper") {
        hoverColor.current = null;
        pickPoint.current = null;
      }

      if (cursor) {
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, sizeRef.current / 2 + 4, 0, Math.PI * 2);
        if (tool === "erase") {
          ctx.strokeStyle = pinching ? "#1a1c23" : "rgba(0,0,0,0.4)";
          ctx.setLineDash([4, 4]);
        } else if (tool === "eyedropper") {
          ctx.strokeStyle = "#0ea5e9";
          ctx.setLineDash([2, 3]);
        } else {
          ctx.strokeStyle = pinching ? colorRef.current : "rgba(0,0,0,0.4)";
          ctx.setLineDash([]);
        }
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Marker at the point the picker reads, with a line back to the fingertip
      if (pickPoint.current && cursor) {
        ctx.strokeStyle = "#0ea5e9";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cursor.x, cursor.y);
        ctx.lineTo(pickPoint.current.x, pickPoint.current.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(pickPoint.current.x, pickPoint.current.y, 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Live swatch of the hovered color while picking
      if (hoverColor.current) {
        const s = 56;
        const pad = 16;
        ctx.fillStyle = hoverColor.current;
        ctx.fillRect(w - s - pad, pad, s, s);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.strokeRect(w - s - pad, pad, s, s);
      }
    };

    rafId = requestAnimationFrame(render);
    return () => {
      canceled = true;
      cancelAnimationFrame(rafId);
    };
  }, [videoRef, resultRef]);

  return (
    <canvas
      ref={displayRef}
      className="bg-card aspect-video w-full rounded-lg shadow-sm"
    />
  );
}
