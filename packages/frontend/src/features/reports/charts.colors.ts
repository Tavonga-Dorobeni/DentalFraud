export const CHART_COLORS = {
  blueClinical: "#3B82F6",
  amberAlert: "#F59E0B",
  orangeWarning: "#F97316",
  redCritical: "#EF4444",
  greenLegitimate: "#22C55E",
  navyAuth: "#0F172A",
} as const;

export const FALLBACK_COLOR = "rgba(15, 23, 42, 0.6)";

export const RISK_BAND_COLORS: Record<string, string> = {
  LOW: CHART_COLORS.blueClinical,
  MEDIUM: CHART_COLORS.amberAlert,
  HIGH: CHART_COLORS.orangeWarning,
  CRITICAL: CHART_COLORS.redCritical,
};

export const DECISION_COLORS: Record<string, string> = {
  LEGITIMATE: CHART_COLORS.greenLegitimate,
  EDUCATION_REQUIRED: CHART_COLORS.amberAlert,
  CONFIRMED_FRAUD: CHART_COLORS.redCritical,
};

export function colorForLabel(
  label: string,
  map: Record<string, string>
): string {
  return map[label] ?? FALLBACK_COLOR;
}
