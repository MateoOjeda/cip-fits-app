export const PLAN_LEVEL_OPTIONS = [
  { value: "inicial", label: "Inicial", color: "text-green-600 border-green-400/50 bg-green-500/10" },
  { value: "intermedio", label: "Intermedio", color: "text-orange-600 border-orange-400/50 bg-orange-500/10" },
  { value: "avanzado", label: "Avanzado", color: "text-red-600 border-red-400/50 bg-red-500/10" },
] as const;

export const getLevelColor = (level: string) =>
  PLAN_LEVEL_OPTIONS.find((o) => o.value === level)?.color || "";
