import { describe, it, expect } from "vitest";
import { RiskBand, RuleSeverity } from "@fdcdf/shared";
import type { AnalyzeClaimResponse, ClaimLineDto, ClaimResponse } from "@fdcdf/shared";
import { buildStages } from "@/features/claims/components/buildStages";

function makeLine(overrides: Partial<ClaimLineDto> = {}): ClaimLineDto {
  return {
    id: "line-1",
    claimId: "claim-1",
    procedureCode: "D7140",
    toothNumber: 16,
    quantity: 1,
    amountClaimed: 100,
    ...overrides,
  } as ClaimLineDto;
}

function makeResponse(overrides: Partial<AnalyzeClaimResponse> = {}): AnalyzeClaimResponse {
  const claim: ClaimResponse = {
    id: "claim-1",
    externalClaimId: "CLM-TEST",
    patientId: "pat-1",
    providerId: "prov-1",
    dateOfService: "2026-01-01T00:00:00.000Z",
    submissionDate: "2026-01-02T00:00:00.000Z",
    status: "PENDING_REVIEW",
    totalClaimedAmount: 100,
    warnings: [],
    lines: [makeLine()],
  } as unknown as ClaimResponse;

  return {
    claim,
    ruleResults: [],
    riskScore: {
      id: "rs-1",
      claimId: "claim-1",
      score: 0,
      band: RiskBand.LOW,
      confidence: 100,
      contributingFactors: [],
      configVersionId: "cfg-1",
    } as any,
    alerts: [],
    ...overrides,
  };
}

describe("buildStages", () => {
  it("always emits tooth, rules, and scoring stages; alerts hidden when none", () => {
    const stages = buildStages(makeResponse());
    const visible = stages.filter((s) => s.visible);

    expect(visible.map((s) => s.id)).toEqual(["tooth", "rules", "scoring"]);
    expect(stages.find((s) => s.id === "alerts")?.visible).toBe(false);
  });

  it("tooth stage includes IMPOSSIBLE_PROCEDURE and SUSPICIOUS_REPEAT only", () => {
    const response = makeResponse({
      ruleResults: [
        {
          id: "r1",
          claimId: "claim-1",
          claimLineId: "line-1",
          ruleId: "IMPOSSIBLE_PROCEDURE",
          severity: RuleSeverity.HIGH,
          explanation: "Tooth already extracted",
          evidenceFields: [],
          executedAt: "2026-01-01T00:00:00.000Z",
          configVersionId: "cfg-1",
        },
        {
          id: "r2",
          claimId: "claim-1",
          claimLineId: "line-1",
          ruleId: "EXACT_DUPLICATE",
          severity: RuleSeverity.CRITICAL,
          explanation: "Duplicate",
          evidenceFields: [],
          executedAt: "2026-01-01T00:00:00.000Z",
          configVersionId: "cfg-1",
        },
      ] as any,
    });
    const stages = buildStages(response);
    const tooth = stages.find((s) => s.id === "tooth")!;

    expect(tooth.findings.map((f) => f.id)).toEqual(["r1"]);
    expect(tooth.headline).toBe("1 tooth-history finding");
  });

  it("rules stage includes EXACT_DUPLICATE, UNSUPPORTED_CLAIM, UPCODING only — NEAR_DUPLICATE filtered out", () => {
    const response = makeResponse({
      ruleResults: [
        { id: "r1", ruleId: "EXACT_DUPLICATE", severity: RuleSeverity.CRITICAL, explanation: "Dup", claimLineId: "line-1" } as any,
        { id: "r2", ruleId: "NEAR_DUPLICATE", severity: RuleSeverity.LOW, explanation: "Near-dup marker", claimLineId: "line-1" } as any,
        { id: "r3", ruleId: "UPCODING", severity: RuleSeverity.HIGH, explanation: "Upcoded", claimLineId: "line-1" } as any,
      ],
    });
    const rules = buildStages(response).find((s) => s.id === "rules")!;

    expect(rules.findings.map((f) => f.id)).toEqual(["r1", "r3"]);
  });

  it("scoring stage carries a single synthetic row with score, band and confidence", () => {
    const response = makeResponse({
      riskScore: {
        id: "rs-1", claimId: "claim-1", score: 72, band: RiskBand.HIGH, confidence: 0.85,
        contributingFactors: [], configVersionId: "cfg-1",
      } as any,
    });
    const scoring = buildStages(response).find((s) => s.id === "scoring")!;

    expect(scoring.headline).toBe("Risk score: 72 — HIGH");
    expect(scoring.findings).toHaveLength(1);
    expect(scoring.findings[0]).toMatchObject({ label: "72/100", severity: "HIGH", detail: "85% confidence" });
  });

  it("alerts stage is visible and populated when alerts exist", () => {
    const response = makeResponse({
      alerts: [
        { id: "a1", severity: RuleSeverity.HIGH, summary: "Review required", recommendedAction: "Escalate" } as any,
      ],
    });
    const alerts = buildStages(response).find((s) => s.id === "alerts")!;

    expect(alerts.visible).toBe(true);
    expect(alerts.findings.map((f) => f.id)).toEqual(["a1"]);
    expect(alerts.headline).toBe("1 alert generated");
  });

  it("empty tooth and rules stages produce explicit empty-state headlines", () => {
    const stages = buildStages(makeResponse());

    expect(stages.find((s) => s.id === "tooth")!.headline).toBe("No tooth-history conflicts detected");
    expect(stages.find((s) => s.id === "rules")!.headline).toBe("No suspicious-claim rules triggered");
  });

  it("tooth findings include a Tooth {fdi} label resolved from claim lines", () => {
    const response = makeResponse({
      ruleResults: [
        { id: "r1", ruleId: "SUSPICIOUS_REPEAT", severity: RuleSeverity.MEDIUM, explanation: "Repeat inside 180 days", claimLineId: "line-1" } as any,
      ],
    });
    const tooth = buildStages(response).find((s) => s.id === "tooth")!;

    expect(tooth.findings[0].label).toBe("Tooth 16");
  });
});
