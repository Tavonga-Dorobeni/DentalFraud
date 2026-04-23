import { RiskBand, RiskScoreDto, RuleResultDto, RuleSeverity } from "@fdcdf/shared";
import { createRiskScore } from "./scoring.repository";
import { logSystemEvent } from "../logs/logs.service";

const severityWeightMap: Record<RuleSeverity, number> = {
  [RuleSeverity.LOW]: 10,
  [RuleSeverity.MEDIUM]: 20,
  [RuleSeverity.HIGH]: 35,
  [RuleSeverity.CRITICAL]: 50
};

const getBand = (score: number): RiskBand => {
  if (score >= 80) {
    return RiskBand.CRITICAL;
  }

  if (score >= 55) {
    return RiskBand.HIGH;
  }

  if (score >= 25) {
    return RiskBand.MEDIUM;
  }

  return RiskBand.LOW;
};

export const scoreClaim = async (
  claimId: string,
  ruleResults: RuleResultDto[],
  configVersionId: string,
  userId?: string
): Promise<RiskScoreDto> => {
  const contributingFactors = ruleResults.map((result) => {
    const weight = severityWeightMap[result.severity];
    return {
      ruleId: result.ruleId,
      severity: result.severity,
      weight,
      contribution: weight,
      explanation: result.explanation
    };
  });

  const rawScore = contributingFactors.reduce((sum, factor) => sum + factor.contribution, 0);
  const score = Math.min(rawScore, 100);
  const band = getBand(score);
  const confidence = ruleResults.length === 0 ? 0.4 : Math.min(0.5 + ruleResults.length * 0.1, 0.95);

  const persisted = await createRiskScore({
    claimId,
    score,
    band,
    confidence,
    contributingFactorsJson: JSON.stringify(contributingFactors),
    configVersionId
  });

  await logSystemEvent({
    claimId,
    action: "CLAIM_SCORED",
    targetEntity: "risk_scores",
    targetEntityId: persisted.id,
    userId,
    metadata: {
      claimId,
      score,
      band
    }
  });

  return {
    id: persisted.id,
    claimId: persisted.claim_id,
    score: Number(persisted.score),
    band: persisted.band as RiskBand,
    confidence: Number(persisted.confidence),
    contributingFactors,
    configVersionId: persisted.config_version_id,
    createdAt: persisted.created_at
  };
};
