import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export type TrackerStatus = "loading" | "idle" | "ready" | "error";

export interface CameraOption {
  deviceId: string;
  label: string;
}

interface UseHandTracker {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: TrackerStatus;
  error: string | null;
  // Latest detection result, updated each animation frame. Read in a rAF loop
  resultRef: React.RefObject<HandLandmarkerResult | null>;
  cameras: CameraOption[];
  deviceId: string | null;
  selectCamera: (deviceId: string) => void;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

// Loads the HandLandmarker once, then opens the selected webcam and runs
// detection every frame. Switching deviceId reopens the stream but keeps the
// landmarker. The result is exposed via a ref so consumers avoid re-rendering
export function useHandTracker(): UseHandTracker {
  const videoRef = useRef<HTMLVideoElement>(null);
  const resultRef = useRef<HandLandmarkerResult | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const [status, setStatus] = useState<TrackerStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraOption[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);

  // Load the model once. The camera stays off until the user enables it
  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
        const lm = await HandLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          runningMode: "VIDEO",
          numHands: 1,
        });
        if (canceled) {
          lm.close();
          return;
        }
        landmarkerRef.current = lm;
        setDeviceId(""); // empty string means "default camera"
        setStatus("idle");
      } catch (err) {
        if (canceled) return;
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    })();
    return () => {
      canceled = true;
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, []);

  // Open the camera and run the detection loop while enabled
  useEffect(() => {
    if (!enabled || deviceId === null || !landmarkerRef.current) return;
    let stream: MediaStream | null = null;
    let rafId = 0;
    let lastVideoTime = -1;
    let canceled = false;

    (async () => {
      try {
        setStatus("loading");
        stream = await navigator.mediaDevices.getUserMedia({
          video: deviceId
            ? { deviceId: { exact: deviceId } }
            : { width: 1280, height: 720 },
        });
        const video = videoRef.current;
        if (!video || canceled) return;
        video.srcObject = stream;
        await video.play();

        // Labels are only populated after permission is granted, so list now
        const devices = await navigator.mediaDevices.enumerateDevices();
        setCameras(
          devices
            .filter((d) => d.kind === "videoinput")
            .map((d, i) => ({
              deviceId: d.deviceId,
              label: d.label || `Camera ${i + 1}`,
            })),
        );
        setStatus("ready");

        const loop = () => {
          if (canceled || !landmarkerRef.current || !videoRef.current) return;
          const v = videoRef.current;
          if (v.currentTime !== lastVideoTime && v.readyState >= 2) {
            lastVideoTime = v.currentTime;
            resultRef.current = landmarkerRef.current.detectForVideo(
              v,
              performance.now(),
            );
          }
          rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);
      } catch (err) {
        if (canceled) return;
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    })();

    return () => {
      canceled = true;
      cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((track) => track.stop());
      resultRef.current = null;
      setStatus("idle");
    };
  }, [enabled, deviceId]);

  return {
    videoRef,
    status,
    error,
    resultRef,
    cameras,
    deviceId,
    selectCamera: setDeviceId,
    enabled,
    setEnabled,
  };
}
