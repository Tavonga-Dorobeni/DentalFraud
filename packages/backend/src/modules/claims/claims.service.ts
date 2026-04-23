import {
  AlertDto,
  AlertStatus,
  ClaimLatestAnalysis,
  ClaimResponse,
  ClaimStatus,
  RiskBand,
  RiskScoreDto,
  RuleResultDto,
  RuleSeverity,
  ToothDentitionType
} from "@fdcdf/shared";
import { ConflictError, NotFoundError, ValidationError } from "../../common/errors/app-error";
import { getDentitionType } from "../../common/utils/fdi";
import { parsePagination } from "../../common/utils/pagination";
import { logSystemEvent } from "../logs/logs.service";
import * as clinicalService from "../clinical/clinical.service";
import { mapDecisionList } from "../claim-line-decisions/claim-line-decisions.service";
import * as repository from "./claims.repository";
import { CreateClaimCommand } from "./claims.types";

const mapClaimResponse = (record: Awaited<ReturnType<typeof repository.getClaimById>>): ClaimResponse => {
  if (!record) {
    throw new NotFoundError("Claim not found");
  }

  const claim = record.claim as Record<string, unknown>;
  const lines = record.lines as Record<string, unknown>[];
  const decisions = (record.decisions ?? []) as Record<string, unknown>[];
  const latestAnalysis = mapLatestAnalysis(record);

  return {
    id: claim.id as string,
    externalClaimId: claim.external_claim_id as string,
    patientId: claim.patient_id as string,
    providerId: claim.provider_id as string,
    duplicateOfClaimId: (claim.duplicate_of_claim_id as string | null) ?? null,
    dateOfService: claim.date_of_service as string,
    submissionDate: claim.submission_date as string,
    status: claim.status as ClaimStatus,
    warnings: JSON.parse((claim.warnings_json as string) ?? "[]"),
    createdAt: claim.created_at as string,
    decisions: mapDecisionList(decisions),
    latestAnalysis: latestAnalysis ?? undefined,
    lines: lines.map((line) => ({
      id: line.id as string,
      procedureCode: line.procedure_code as string,
      claimedAmount: Number(line.claimed_amount),
      toothNumber: line.tooth_number === null ? undefined : Number(line.tooth_number),
      dentitionType:
        line.tooth_number === null
          ? undefined
          : (getDentitionType(Number(line.tooth_number)) as ToothDentitionType | undefined),
      documentedProcedureCode: (line.documented_procedure_code as string | null) ?? undefined,
      evidenceSummary: (line.evidence_summary as string | null) ?? undefined,
      chartNotes: (line.chart_notes as string | null) ?? undefined,
      radiographReference: (line.radiograph_reference as string | null) ?? undefined,
      treatmentPlanReference: (line.treatment_plan_reference as string | null) ?? undefined
    }))
  };
};

const mapRuleResult = (row: Record<string, unknown>): RuleResultDto => ({
  id: row.id as string,
  claimId: row.claim_id as string,
  claimLineId: (row.claim_line_id as string | null) ?? undefined,
  ruleId: row.rule_id as string,
  matchedClaimId: (row.matched_claim_id as string | null) ?? null,
  severity: row.severity as RuleSeverity,
  explanation: row.explanation as string,
  evidenceFields: JSON.parse((row.evidence_fields_json as string) ?? "[]"),
  executedAt: row.executed_at as string,
  configVersionId: row.config_version_id as string
});

const mapRiskScore = (row: Record<string, unknown>): RiskScoreDto => ({
  id: row.id as string,
  claimId: row.claim_id as string,
  score: Number(row.score),
  band: row.band as RiskBand,
  confidence: Number(row.confidence),
  contributingFactors: JSON.parse((row.contributing_factors_json as string) ?? "[]"),
  configVersionId: row.config_version_id as string,
  createdAt: row.created_at as string
});

const mapAlert = (row: Record<string, unknown>): AlertDto => ({
  id: row.id as string,
  claimId: row.claim_id as string,
  claimLineId: (row.claim_line_id as string | null) ?? undefined,
  severity: row.severity as RuleSeverity,
  status: row.status as AlertStatus,
  summary: row.summary as string,
  recommendedAction: row.recommended_action as string,
  assignedUserId: (row.assigned_user_id as string | null) ?? undefined,
  triggeredRuleIds: JSON.parse((row.triggered_rule_ids_json as string) ?? "[]"),
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string
});

const mapLatestAnalysis = (
  record: Awaited<ReturnType<typeof repository.getClaimById>>
): ClaimLatestAnalysis | null => {
  const latestRiskScore = record?.latestRiskScore as Record<string, unknown> | undefined;

  if (!latestRiskScore) {
    return null;
  }

  const latestRuleResults = ((record?.latestRuleResults ?? []) as Record<string, unknown>[]).map(mapRuleResult);
  const latestAlerts = ((record?.latestAlerts ?? []) as Record<string, unknown>[]).map(mapAlert);

  return {
    riskScore: mapRiskScore(latestRiskScore),
    ruleResults: latestRuleResults,
    alerts: latestAlerts,
    analyzedAt: latestRiskScore.created_at as string
  };
};

const validateDates = (input: CreateClaimCommand) => {
  const dateOfService = new Date(input.dateOfService);
  const submissionDate = new Date(input.submissionDate);

  if (Number.isNaN(dateOfService.getTime()) || Number.isNaN(submissionDate.getTime())) {
    throw new ValidationError("Invalid service or submission date");
  }

  if (submissionDate < dateOfService) {
    throw new ValidationError("Submission date cannot be before date of service");
  }
};

export const createClaim = async (input: CreateClaimCommand, userId?: string): Promise<ClaimResponse> => {
  validateDates(input);

  const existingExternalClaim = await repository.findClaimByExternalClaimId(input.externalClaimId);
  if (existingExternalClaim) {
    throw new ConflictError(`Claim ${input.externalClaimId} has already been ingested`);
  }

  const warnings: string[] = [];
  let duplicateOfClaimId: string | null = null;
  const exactDuplicate = await repository.findExactDuplicate(input);
  if (exactDuplicate) {
    warnings.push("Potential exact duplicate claim detected");
    duplicateOfClaimId = exactDuplicate.id as string;
  } else {
    const nearDuplicate = await repository.findNearDuplicate(input);
    if (nearDuplicate) {
      warnings.push("Potential near-duplicate claim detected");
      duplicateOfClaimId = nearDuplicate.id as string;
    }
  }

  for (const line of input.lines) {
    await clinicalService.getProcedureByCode(line.procedureCode);
    await clinicalService.validateProcedureForTooth(line.procedureCode, line.toothNumber);

    if (line.documentedProcedureCode) {
      await clinicalService.getProcedureByCode(line.documentedProcedureCode);
    }
  }

  const status =
    warnings.length > 0 ? ClaimStatus.ACCEPTED_WITH_WARNINGS : ClaimStatus.ACCEPTED;
  const claimId = await repository.createClaim(input, status, warnings, duplicateOfClaimId);
  const createdClaim = await repository.getClaimById(claimId, true);

  await logSystemEvent({
    claimId,
    action: "CLAIM_INGESTED",
    targetEntity: "claims",
    targetEntityId: claimId,
    userId,
    metadata: { status, warnings }
  });

  return mapClaimResponse(createdClaim);
};

export const getClaim = async (claimId: string): Promise<ClaimResponse> => {
  return mapClaimResponse(await repository.getClaimById(claimId, true));
};

export const listClaims = async (page?: string, pageSize?: string) => {
  const paging = parsePagination(page, pageSize);
  const offset = (paging.page - 1) * paging.pageSize;
  const { rows, total } = await repository.listClaims(offset, paging.pageSize);

  const items = await Promise.all(
    rows.map(async (row) => {
      const record = await repository.getClaimById(row.id, false);
      return mapClaimResponse(record);
    })
  );

  return {
    items,
    pagination: {
      page: paging.page,
      pageSize: paging.pageSize,
      total,
      totalPages: Math.ceil(total / paging.pageSize) || 1
    }
  };
};
