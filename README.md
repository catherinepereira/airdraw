# airdraw

Draw on screen by pinching your fingers in the air. Your webcam tracks your hand with MediaPipe and pinching thumb to index finger lays down ink. Runs entirely in the browser, no backend.

## Run

```bash
npm install
npm run dev
```

Open the printed localhost URL and allow camera access. The hand tracking model (~7 MB) loads from a CDN on first run.

## Use

Pinch your thumb and index finger together to draw, open the pinch to move without drawing. The toolbar has color swatches, an eraser, a color picker (select it, hover the image to preview the color, then pinch to grab it), a brush size slider, a background toggle (camera/white/black), a camera picker, and per-stroke undo/redo and clear. Export PNG opens a preview where you can swap between camera, background, and transparent before downloading.