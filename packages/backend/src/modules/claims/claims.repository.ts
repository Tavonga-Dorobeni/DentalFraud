import { Knex } from "knex";
import { getDb } from "../../common/db/knex";
import { createId } from "../../common/utils/ids";
import { CreateClaimCommand } from "./claims.types";

const mapLinesToSignature = (lines: CreateClaimCommand["lines"]) =>
  JSON.stringify(
    [...lines]
      .map((line) => ({
        procedureCode: line.procedureCode,
        toothNumber: line.toothNumber ?? null
      }))
      .sort((left, right) =>
        `${left.procedureCode}${left.toothNumber}`.localeCompare(
          `${right.procedureCode}${right.toothNumber}`
        )
      )
  );

export const findClaimByExternalClaimId = async (externalClaimId: string) => {
  const db = getDb();
  return db("claims").where({ external_claim_id: externalClaimId }).first();
};

export const findExactDuplicate = async (input: CreateClaimCommand) => {
  const db = getDb();
  return db("claims")
    .where({
      patient_external_id: input.patientExternalId,
      provider_external_id: input.providerExternalId,
      date_of_service: input.dateOfService
    })
    .where({ line_signature: mapLinesToSignature(input.lines) })
    .first();
};

export const findNearDuplicate = async (input: CreateClaimCommand) => {
  const db = getDb();
  return db("claims")
    .where({
      patient_external_id: input.patientExternalId,
      line_signature: mapLinesToSignature(input.lines)
    })
    .andWhere((builder) => {
      builder
        .whereNot({ provider_external_id: input.providerExternalId })
        .orWhereNot({ date_of_service: input.dateOfService });
    })
    .first();
};

export const upsertPatient = async (
  tx: Knex.Transaction,
  input: Pick<CreateClaimCommand, "patientExternalId" | "patientName" | "patientDateOfBirth">
) => {
  const existing = await tx("patients").where({ external_id: input.patientExternalId }).first();

  if (existing) {
    await tx("patients")
      .where({ id: existing.id })
      .update({
        name: input.patientName,
        date_of_birth: input.patientDateOfBirth ?? null,
        updated_at: new Date().toISOString()
      });
    return existing.id as string;
  }

  const id = createId("patient");
  await tx("patients").insert({
    id,
    external_id: input.patientExternalId,
    name: input.patientName,
    date_of_birth: input.patientDateOfBirth ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  return id;
};

export const upsertProvider = async (
  tx: Knex.Transaction,
  input: Pick<CreateClaimCommand, "providerExternalId" | "providerName" | "providerSpecialty">
) => {
  const existing = await tx("providers").where({ external_id: input.providerExternalId }).first();

  if (existing) {
    await tx("providers")
      .where({ id: existing.id })
      .update({
        name: input.providerName,
        specialty: input.providerSpecialty ?? null,
        updated_at: new Date().toISOString()
      });
    return existing.id as string;
  }

  const id = createId("provider");
  await tx("providers").insert({
    id,
    external_id: input.providerExternalId,
    name: input.providerName,
    specialty: input.providerSpecialty ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  return id;
};

export const createClaim = async (
  input: CreateClaimCommand,
  status: string,
  warnings: string[],
  duplicateOfClaimId: string | null
): Promise<string> => {
  const db = getDb();
  const lineSignature = mapLinesToSignature(input.lines);

  return db.transaction(async (tx) => {
    const patientId = await upsertPatient(tx, input);
    const providerId = await upsertProvider(tx, input);
    const claimId = createId("claim");
    const now = new Date().toISOString();

    await tx("claims").insert({
      id: claimId,
      external_claim_id: input.externalClaimId,
      patient_id: patientId,
      provider_id: providerId,
      patient_external_id: input.patientExternalId,
      provider_external_id: input.providerExternalId,
      date_of_service: input.dateOfService,
      submission_date: input.submissionDate,
      status,
      warnings_json: JSON.stringify(warnings),
      duplicate_of_claim_id: duplicateOfClaimId,
      line_signature: lineSignature,
      created_at: now,
      updated_at: now,
      deleted_at: null
    });

    for (const line of input.lines) {
      await tx("claim_lines").insert({
        id: createId("cline"),
        claim_id: claimId,
        procedure_code: line.procedureCode,
        claimed_amount: line.claimedAmount,
        tooth_number: line.toothNumber ?? null,
        documented_procedure_code: line.documentedProcedureCode ?? null,
        evidence_summary: line.evidenceSummary ?? null,
        chart_notes: line.chartNotes ?? null,
        radiograph_reference: line.radiographReference ?? null,
        treatment_plan_reference: line.treatmentPlanReference ?? null,
        created_at: now,
        updated_at: now
      });
    }

    return claimId;
  });
};

export const listClaims = async (offset: number, limit: number) => {
  const db = getDb();
  const query = db("claims").whereNull("deleted_at");
  const countRow = await query.clone().count({ count: "*" }).first();
  const rows = await query.orderBy("created_at", "desc").offset(offset).limit(limit);
  return {
    rows,
    total: Number(countRow?.count ?? 0)
  };
};

export const getClaimById = async (claimId: string, includeLatestAnalysis = true) => {
  const db = getDb();
  const claim = await db("claims").where({ id: claimId }).whereNull("deleted_at").first();

  if (!claim) {
    return null;
  }

  const lines = await db("claim_lines").where({ claim_id: claimId }).orderBy("created_at", "asc");
  const decisions = await db("claim_line_decisions").where({ claim_id: claimId }).orderBy("decided_at", "desc");
  let latestRiskScore = null;
  let latestRuleResults: unknown[] = [];
  let latestAlerts: unknown[] = [];

  if (includeLatestAnalysis) {
    latestRiskScore = await db("risk_scores").where({ claim_id: claimId }).orderBy("created_at", "desc").first();

    if (latestRiskScore) {
      latestRuleResults = await db("rule_results")
        .where({ claim_id: claimId })
        .orderBy("executed_at", "asc")
        .orderBy("id", "asc");

      latestAlerts = await db("alerts")
        .where({ claim_id: claimId })
        .whereNull("deleted_at")
        .andWhere("created_at", ">=", latestRiskScore.created_at)
        .orderBy("created_at", "asc")
        .orderBy("id", "asc");
    }
  }

  return { claim, lines, decisions, latestRiskScore, latestRuleResults, latestAlerts };
};
