# airdraw

Draw on screen by pinching your fingers in the air. Your webcam tracks your hand with MediaPipe and pinching thumb to index finger lays down ink. Runs entirely in the browser, no backend.

## Run

```bash
npm install
npm run dev
```

Open the printed localhost URL and allow camera access. The hand tracking model (~7 MB) loads from a CDN on first run.

## Use

Pinch your thumb and index finger together to draw, open the pinch to move without drawing. The toolbar has color swatches, an eraser and an eyedropper, brush and smoothing sliders, a background toggle (camera/white/black), a reference image loader to trace over, a camera picker, per-stroke undo/redo, clear, and PNG export (with camera, on background, or transparent).

## Stack

React + TypeScript + Vite, Tailwind v4, MediaPipe Tasks hand landmarker. Static build, deployable to any host that serves files over HTTPS (the webcam requires it).
