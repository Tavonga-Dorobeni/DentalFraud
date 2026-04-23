import { describe, it, expect } from "vitest";
import {
  LineDecision,
  ResolutionStatus,
  deriveResolutionStatus,
} from "@fdcdf/shared";

type Line = { id: string };
type Dec = { claimLineId: string; decision: LineDecision };

function decided(lineId: string, decision: LineDecision): Dec {
  return { claimLineId: lineId, decision };
}

describe("deriveResolutionStatus", () => {
  const lines: Line[] = [{ id: "l1" }, { id: "l2" }];

  it("returns PENDING_REVIEW when there are no lines", () => {
    expect(deriveResolutionStatus([], [])).toBe(ResolutionStatus.PENDING_REVIEW);
  });

  it("returns PENDING_REVIEW when no line has a decision", () => {
    expect(deriveResolutionStatus(lines, [])).toBe(ResolutionStatus.PENDING_REVIEW);
  });

  it("returns IN_REVIEW when some (but not all) lines are decided", () => {
    const decisions = [decided("l1", LineDecision.LEGITIMATE)];
    expect(deriveResolutionStatus(lines, decisions)).toBe(ResolutionStatus.IN_REVIEW);
  });

  it("returns CLEARED when all lines are decided LEGITIMATE", () => {
    const decisions = [
      decided("l1", LineDecision.LEGITIMATE),
      decided("l2", LineDecision.LEGITIMATE),
    ];
    expect(deriveResolutionStatus(lines, decisions)).toBe(ResolutionStatus.CLEARED);
  });

  it("returns EDUCATION_FLAGGED when all decided, >=1 EDUCATION_REQUIRED, none fraud", () => {
    const decisions = [
      decided("l1", LineDecision.LEGITIMATE),
      decided("l2", LineDecision.EDUCATION_REQUIRED),
    ];
    expect(deriveResolutionStatus(lines, decisions)).toBe(ResolutionStatus.EDUCATION_FLAGGED);
  });

  it("returns CONFIRMED_FRAUD when all decided and >=1 CONFIRMED_FRAUD (fraud wins over education)", () => {
    const decisions = [
      decided("l1", LineDecision.EDUCATION_REQUIRED),
      decided("l2", LineDecision.CONFIRMED_FRAUD),
    ];
    expect(deriveResolutionStatus(lines, decisions)).toBe(ResolutionStatus.CONFIRMED_FRAUD);
  });

  it("returns CONFIRMED_FRAUD when all decided and fraud mixed with legitimate", () => {
    const decisions = [
      decided("l1", LineDecision.LEGITIMATE),
      decided("l2", LineDecision.CONFIRMED_FRAUD),
    ];
    expect(deriveResolutionStatus(lines, decisions)).toBe(ResolutionStatus.CONFIRMED_FRAUD);
  });

  it("ignores decisions referencing unknown line ids", () => {
    const decisions = [decided("ghost", LineDecision.CONFIRMED_FRAUD)];
    expect(deriveResolutionStatus(lines, decisions)).toBe(ResolutionStatus.PENDING_REVIEW);
  });
});
