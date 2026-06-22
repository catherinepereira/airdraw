import { create } from "zustand";

export const COLORS = [
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#0ea5e9", // sky
  "#6366f1", // indigo
  "#1a1c23", // ink
  "#ffffff", // white
] as const;

export type Tool = "draw" | "erase" | "eyedropper";
export type Background = "camera" | "white" | "black";

interface DrawState {
  color: string;
  brushSize: number;
  tool: Tool;
  background: Background;
  setColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setTool: (tool: Tool) => void;
  setBackground: (background: Background) => void;
}

export const useDrawStore = create<DrawState>((set) => ({
  color: COLORS[0],
  brushSize: 8,
  tool: "draw",
  background: "camera",
  // Picking a color switches back to the brush, the common intent
  setColor: (color) => set({ color, tool: "draw" }),
  setBrushSize: (brushSize) => set({ brushSize }),
  setTool: (tool) => set({ tool }),
  setBackground: (background) => set({ background }),
}));
