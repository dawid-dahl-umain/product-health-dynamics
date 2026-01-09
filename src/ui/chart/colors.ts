export const DEVELOPER_PALETTE = [
  "#FF5C8D", // AI Vibe (Vibrant Rose)
  "#FFB84D", // AI Guardrails (Warm Saffron)
  "#38BDF8", // Junior (Azure Blue)
  "#4ADE80", // Senior (Emerald/Mint)
  "#A78BFA", // Handoff 1 (Soft Lavender)
  "#2DD4BF", // Handoff 2 (Cool Teal)
  "#F472B6", // Handoff 3 (Warm Pink)
  "#94A3B8", // Handoff 4 (Refined Slate)
];

export const chartColors = {
  grid: "rgba(255, 255, 255, 0.05)",
  gridLight: "rgba(255, 255, 255, 0.02)",
  text: "#64748b",
  textLight: "#94a3b8",
  annotationLine: "rgba(148, 163, 184, 0.3)",
  annotationBg: "#0f172a",
  bandOpacity: 0.08,
};

export const getNextColor = (usedColors: string[]): string => {
  return (
    DEVELOPER_PALETTE.find((c) => !usedColors.includes(c)) ??
    DEVELOPER_PALETTE[Math.floor(Math.random() * DEVELOPER_PALETTE.length)]
  );
};

export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const adjustColor = (hex: string, percent: number): string => {
  const num = parseInt(hex.slice(1), 16);
  const r = (num >> 16) + Math.round(255 * (percent / 100));
  const g = ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100));
  const b = (num & 0x0000ff) + Math.round(255 * (percent / 100));

  const clamp = (val: number) => Math.min(255, Math.max(0, val));
  const toHex = (val: number) => clamp(val).toString(16).padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};
