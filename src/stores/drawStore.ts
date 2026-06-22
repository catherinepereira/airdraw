import { create } from "zustand";

export const COLORS = [
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#0ea5e9", // sky
  "#6366f1", // indigo
  "#1a1c23", // ink
] as const;

export type Tool = "draw" | "erase" | "eyedropper";
export type Background = "camera" | "white" | "black";

interface DrawState {
  color: string;
  brushSize: number;
  tool: Tool;
  background: Background;
  smoothing: number; // 0 = raw, 1 = heaviest. Drives the fingertip filter
  setColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setTool: (tool: Tool) => void;
  setBackground: (background: Background) => void;
  setSmoothing: (smoothing: number) => void;
}

export const useDrawStore = create<DrawState>((set) => ({
  color: COLORS[0],
  brushSize: 8,
  tool: "draw",
  background: "camera",
  smoothing: 0.5,
  // Picking a color switches back to the brush, the common intent
  setColor: (color) => set({ color, tool: "draw" }),
  setBrushSize: (brushSize) => set({ brushSize }),
  setTool: (tool) => set({ tool }),
  setBackground: (background) => set({ background }),
  setSmoothing: (smoothing) => set({ smoothing }),
}));
