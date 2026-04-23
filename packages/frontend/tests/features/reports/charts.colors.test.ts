import { describe, it, expect } from "vitest";
import {
  CHART_COLORS,
  DECISION_COLORS,
  FALLBACK_COLOR,
  RISK_BAND_COLORS,
  colorForLabel,
} from "@/features/reports/charts.colors";

describe("charts.colors", () => {
  it("exposes the hex palette matching the CSS tokens", () => {
    expect(CHART_COLORS.blueClinical).toBe("#3B82F6");
    expect(CHART_COLORS.amberAlert).toBe("#F59E0B");
    expect(CHART_COLORS.orangeWarning).toBe("#F97316");
    expect(CHART_COLORS.redCritical).toBe("#EF4444");
    expect(CHART_COLORS.greenLegitimate).toBe("#22C55E");
    expect(CHART_COLORS.navyAuth).toBe("#0F172A");
  });

  it("maps every risk band to a semantic color", () => {
    expect(RISK_BAND_COLORS.LOW).toBe(CHART_COLORS.blueClinical);
    expect(RISK_BAND_COLORS.MEDIUM).toBe(CHART_COLORS.amberAlert);
    expect(RISK_BAND_COLORS.HIGH).toBe(CHART_COLORS.orangeWarning);
    expect(RISK_BAND_COLORS.CRITICAL).toBe(CHART_COLORS.redCritical);
  });

  it("maps every decision type to a semantic color", () => {
    expect(DECISION_COLORS.LEGITIMATE).toBe(CHART_COLORS.greenLegitimate);
    expect(DECISION_COLORS.EDUCATION_REQUIRED).toBe(CHART_COLORS.amberAlert);
    expect(DECISION_COLORS.CONFIRMED_FRAUD).toBe(CHART_COLORS.redCritical);
  });

  it("colorForLabel returns the mapped color when label is known", () => {
    expect(colorForLabel("CRITICAL", RISK_BAND_COLORS)).toBe(
      CHART_COLORS.redCritical
    );
  });

  it("colorForLabel returns the fallback when label is unknown", () => {
    expect(colorForLabel("UNKNOWN", RISK_BAND_COLORS)).toBe(FALLBACK_COLOR);
  });
});
