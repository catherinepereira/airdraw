import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

// MediaPipe hand model landmark indices
export const THUMB_TIP = 4;
export const INDEX_TIP = 8;

export interface Point {
  x: number;
  y: number;
}

export function indexTip(landmarks: NormalizedLandmark[]): Point {
  const lm = landmarks[INDEX_TIP];
  return { x: lm.x, y: lm.y };
}

// Normalized distance between thumb tip and index tip, used as the pinch signal
export function pinchDistance(landmarks: NormalizedLandmark[]): number {
  const t = landmarks[THUMB_TIP];
  const i = landmarks[INDEX_TIP];
  return Math.hypot(t.x - i.x, t.y - i.y);
}
