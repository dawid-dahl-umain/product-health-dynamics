import type { ScenarioKey } from "../simulation";

/** Scenario color palette */
export const scenarioColors: Record<ScenarioKey, string> = {
  "ai-vibe": "#f87171",
  "ai-guardrails": "#fbbf24",
  "junior-engineer": "#fb923c",
  "senior-engineers": "#34d399",
  "ai-handoff": "#60a5fa",
  "ai-junior-handoff": "#818cf8",
};

export const chartColors = {
  grid: "rgba(161, 161, 170, 0.2)",
  gridLight: "rgba(161, 161, 170, 0.12)",
  text: "#a1a1aa",
  textLight: "#e4e4e7",
  annotationLine: "rgba(161, 161, 170, 0.6)",
  annotationBg: "rgba(30, 30, 30, 0.95)",
};

/** Convert hex color to rgba */
export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

