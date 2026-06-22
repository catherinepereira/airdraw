import { useEffect, useImperativeHandle, useRef } from "react";
import type { HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { useDrawStore } from "../stores/drawStore";
import { indexTip, pinchDistance, type Point } from "../utils/landmarks";

// Pinch closer than this (normalized thumb-index distance) starts drawing
const PINCH_THRESHOLD = 0.06;

// Snapshots beyond this are dropped so the undo stack can't grow without bound
const MAX_UNDO = 30;

export type SaveMode = "camera" | "background" | "transparent";

export interface DrawCanvasHandle {
  clear: () => void;
  undo: () => void;
  redo: () => void;
  setReference: (img: HTMLImageElement | null) => void;
  toPNG: (mode: SaveMode) => string;
}

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  resultRef: React.RefObject<HandLandmarkerResult | null>;
  ref: React.Ref<DrawCanvasHandle>;
}

const BG_FILL: Record<string, string> = { white: "#ffffff", black: "#1a1c23" };

export function DrawCanvas({ videoRef, resultRef, ref }: Props) {
  // Visible canvas shows background + reference + ink + cursor, ink layer persists
  const displayRef = useRef<HTMLCanvasElement>(null);
  const inkRef = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  const referenceRef = useRef<HTMLImageElement | null>(null);
  const lastPoint = useRef<Point | null>(null);
  const smoothed = useRef<Point | null>(null);
  // ImageData per stroke. undo moves the current state onto redo and vice versa
  const undoStack = useRef<ImageData[]>([]);
  const redoStack = useRef<ImageData[]>([]);

  // Read live tool settings inside the rAF loop without re-subscribing
  const colorRef = useRef(useDrawStore.getState().color);
  const sizeRef = useRef(useDrawStore.getState().brushSize);
  const toolRef = useRef(useDrawStore.getState().tool);
  const bgRef = useRef(useDrawStore.getState().background);
  const smoothRef = useRef(useDrawStore.getState().smoothing);
  useEffect(
    () =>
      useDrawStore.subscribe((s) => {
        colorRef.current = s.color;
        sizeRef.current = s.brushSize;
        toolRef.current = s.tool;
        bgRef.current = s.background;
        smoothRef.current = s.smoothing;
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
    smoothed.current = null;
  };

  useImperativeHandle(ref, () => ({
    clear() {
      const ink = inkRef.current;
      ink.getContext("2d")?.clearRect(0, 0, ink.width, ink.height);
      lastPoint.current = null;
      smoothed.current = null;
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
    setReference(img) {
      referenceRef.current = img;
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
    let cancelled = false;

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
      if (cancelled) return;
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

      // Reference image drawn faintly to trace over
      if (referenceRef.current) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.drawImage(referenceRef.current, 0, 0, w, h);
        ctx.restore();
      }

      const hands = resultRef.current?.landmarks;
      let cursor: Point | null = null;
      let pinching = false;
      if (hands && hands.length > 0) {
        const lm = hands[0];
        const tip = indexTip(lm);
        const raw = { x: (1 - tip.x) * w, y: tip.y * h };
        // Exponential moving average smooths the jittery fingertip
        const a = 1 - smoothRef.current * 0.85;
        if (smoothed.current) {
          smoothed.current = {
            x: smoothed.current.x + a * (raw.x - smoothed.current.x),
            y: smoothed.current.y + a * (raw.y - smoothed.current.y),
          };
        } else {
          smoothed.current = raw;
        }
        cursor = smoothed.current;
        pinching = pinchDistance(lm) < PINCH_THRESHOLD;
      } else {
        smoothed.current = null;
      }

      const tool = toolRef.current;

      if (cursor && pinching && tool === "eyedropper") {
        // Sample the pixel under the cursor (background + reference + ink)
        const px = ctx.getImageData(cursor.x, cursor.y, 1, 1).data;
        const hex =
          "#" +
          [px[0], px[1], px[2]]
            .map((c) => c.toString(16).padStart(2, "0"))
            .join("");
        useDrawStore.getState().setColor(hex); // also switches tool to draw
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
    };

    rafId = requestAnimationFrame(render);
    return () => {
      cancelled = true;
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
