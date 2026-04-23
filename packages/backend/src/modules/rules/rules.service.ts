import { AnalyzeClaimResponse, RuleResultDto, RuleSeverity } from "@fdcdf/shared";
import { NotFoundError } from "../../common/errors/app-error";
import * as claimsService from "../claims/claims.service";
import * as clinicalService from "../clinical/clinical.service";
import * as teethService from "../teeth/teeth.service";
import * as scoringService from "../scoring/scoring.service";
import * as alertsService from "../alerts/alerts.service";
import * as repository from "./rules.repository";
import { logSystemEvent } from "../logs/logs.service";

const severityByName = (severity: string): RuleSeverity => {
  switch (severity) {
    case "LOW":
      return RuleSeverity.LOW;
    case "MEDIUM":
      return RuleSeverity.MEDIUM;
    case "HIGH":
      return RuleSeverity.HIGH;
    default:
      return RuleSeverity.CRITICAL;
  }
};

export const analyzeClaim = async (claimId: string, userId?: string): Promise<AnalyzeClaimResponse> => {
  const claim = await claimsService.getClaim(claimId);
  const rules = await clinicalService.getEnabledRules();
  const executedAt = new Date().toISOString();
  const ruleResults: RuleResultDto[] = [];

  for (const line of claim.lines) {
    const history = line.toothNumber ? await teethService.getToothHistory(claim.patientId, line.toothNumber) : [];

    for (const rule of rules) {
      if (rule.code === "EXACT_DUPLICATE" && claim.warnings.includes("Potential exact duplicate claim detected")) {
        ruleResults.push({
          id: `temp_${rule.code}_${line.id}`,
          claimId: claim.id,
          claimLineId: line.id,
          ruleId: rule.code,
          matchedClaimId: claim.duplicateOfClaimId ?? null,
          severity: severityByName(rule.severity),
          explanation: "Claim matches a previously ingested patient/provider/procedure/tooth/date signature",
          evidenceFields: ["externalClaimId", "dateOfService", "procedureCode"],
          executedAt,
          configVersionId: rule.configVersionId
        });
      }

      if (rule.code === "NEAR_DUPLICATE" && claim.warnings.includes("Potential near-duplicate claim detected")) {
        ruleResults.push({
          id: `temp_${rule.code}_${line.id}`,
          claimId: claim.id,
          claimLineId: line.id,
          ruleId: rule.code,
          matchedClaimId: claim.duplicateOfClaimId ?? null,
          severity: RuleSeverity.LOW,
          explanation: "Claim matches patient/procedure/tooth details from a prior claim but differs by provider or service date",
          evidenceFields: ["patientId", "providerId", "dateOfService", "procedureCode", "toothNumber"],
          executedAt,
          configVersionId: rule.configVersionId
        });
      }

      if (
        rule.code === "UNSUPPORTED_CLAIM" &&
        !line.evidenceSummary &&
        !line.chartNotes &&
        !line.documentedProcedureCode
      ) {
        const claimedProcedure = await clinicalService.getProcedureByCode(line.procedureCode);
        if (claimedProcedure.requiresEvidence) {
          ruleResults.push({
            id: `temp_${rule.code}_${line.id}`,
            claimId: claim.id,
            claimLineId: line.id,
            ruleId: rule.code,
            severity: severityByName(rule.severity),
            explanation:
              "Procedure requires supporting evidence but no evidence summary or chart notes were provided",
            evidenceFields: ["evidenceSummary", "chartNotes"],
            executedAt,
            configVersionId: rule.configVersionId
          });
        }
      }

      if (rule.code === "UPCODING" && line.documentedProcedureCode && line.documentedProcedureCode !== line.procedureCode) {
        const claimed = await clinicalService.getProcedureByCode(line.procedureCode);
        const documented = await clinicalService.getProcedureByCode(line.documentedProcedureCode);
        if (claimed.complexityLevel > documented.complexityLevel) {
          ruleResults.push({
            id: `temp_${rule.code}_${line.id}`,
            claimId: claim.id,
            claimLineId: line.id,
            ruleId: rule.code,
            severity: severityByName(rule.severity),
            explanation: `Claimed procedure ${line.procedureCode} exceeds documented procedure ${line.documentedProcedureCode}`,
            evidenceFields: ["procedureCode", "documentedProcedureCode"],
            executedAt,
            configVersionId: rule.configVersionId
          });
        }
      }

      if (rule.code === "IMPOSSIBLE_PROCEDURE") {
        const chronologyConflict = teethService.findChronologyConflict(
          history,
          claim.dateOfService,
          line.procedureCode
        );
        if (chronologyConflict) {
          ruleResults.push({
            id: `temp_${rule.code}_${line.id}`,
            claimId: claim.id,
            claimLineId: line.id,
            ruleId: rule.code,
            severity: severityByName(rule.severity),
            explanation: chronologyConflict,
            evidenceFields: ["toothHistory", "dateOfService", "procedureCode"],
            executedAt,
            configVersionId: rule.configVersionId
          });
        }
      }

      if (rule.code === "SUSPICIOUS_REPEAT") {
        const minimumDays = Number(rule.parameters.repeatIntervalDays ?? 180);
        const repeatConflict = teethService.findRepeatIntervalConflict(
          history,
          claim.dateOfService,
          line.procedureCode,
          minimumDays
        );
        if (repeatConflict) {
          ruleResults.push({
            id: `temp_${rule.code}_${line.id}`,
            claimId: claim.id,
            claimLineId: line.id,
            ruleId: rule.code,
            severity: severityByName(rule.severity),
            explanation: repeatConflict,
            evidenceFields: ["toothHistory", "dateOfService", "procedureCode"],
            executedAt,
            configVersionId: rule.configVersionId
          });
        }
      }
    }
  }

  const configVersionId = rules[0]?.configVersionId;
  if (!configVersionId) {
    throw new NotFoundError("Active rule configuration missing");
  }

  await repository.clearRuleResultsForClaim(claim.id);
  const persistedResults = await repository.createRuleResults(
    ruleResults.map((result) => ({
      claimId: result.claimId,
      claimLineId: result.claimLineId,
      ruleId: result.ruleId,
      matchedClaimId: result.matchedClaimId,
      severity: result.severity,
      explanation: result.explanation,
      evidenceFields: result.evidenceFields,
      executedAt: result.executedAt,
      configVersionId: result.configVersionId
    }))
  );

  const finalizedRuleResults = persistedResults.map((row, index) => ({
    ...ruleResults[index],
    id: row.id
  }));

  const riskScore = await scoringService.scoreClaim(claim.id, finalizedRuleResults, configVersionId, userId);
  const alerts = await alertsService.createAlertsFromRuleResults(claim.id, finalizedRuleResults, userId);

  await logSystemEvent({
    claimId: claim.id,
    action: "CLAIM_ANALYZED",
    targetEntity: "claims",
    targetEntityId: claim.id,
    userId,
    metadata: {
      rulesTriggered: finalizedRuleResults.length,
      score: riskScore.score
    }
  });

  return {
    claim,
    ruleResults: finalizedRuleResults,
    riskScore,
    alerts
  };
};
