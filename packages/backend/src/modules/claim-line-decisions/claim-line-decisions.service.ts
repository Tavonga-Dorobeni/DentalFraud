import {
  ClaimLineDecisionDto,
  LineDecision,
  UpsertClaimLineDecisionRequest
} from "@fdcdf/shared";
import { NotFoundError } from "../../common/errors/app-error";
import { logSystemEvent } from "../logs/logs.service";
import * as repository from "./claim-line-decisions.repository";

const mapDecision = (row: Record<string, unknown> | undefined): ClaimLineDecisionDto => {
  if (!row) {
    throw new NotFoundError("Claim line decision not found");
  }

  return {
    id: row.id as string,
    claimId: row.claim_id as string,
    claimLineId: row.claim_line_id as string,
    decision: row.decision as LineDecision,
    note: (row.note as string | null) ?? undefined,
    decidedByUserId: row.decided_by_user_id as string,
    decidedAt: row.decided_at as string
  };
};

export const mapDecisionList = (rows: Record<string, unknown>[]): ClaimLineDecisionDto[] =>
  rows.map((row) => mapDecision(row));

export const setDecision = async (
  claimId: string,
  claimLineId: string,
  input: UpsertClaimLineDecisionRequest,
  userId: string
): Promise<ClaimLineDecisionDto> => {
  const line = await repository.findClaimLine(claimId, claimLineId);

  if (!line) {
    throw new NotFoundError("Claim line not found");
  }

  const previous = await repository.getDecisionByLineId(claimLineId);
  const persisted = await repository.upsertDecision({
    claimId,
    claimLineId,
    decision: input.decision,
    note: input.note,
    decidedByUserId: userId
  });
  const decision = mapDecision(persisted as Record<string, unknown> | undefined);

  await logSystemEvent({
    claimId,
    action: previous ? "CLAIM_LINE_DECISION_UPDATED" : "CLAIM_LINE_DECISION_SET",
    targetEntity: "claim_line_decisions",
    targetEntityId: decision.id,
    userId,
    metadata: {
      claimId,
      claimLineId,
      previousDecision: previous?.decision ?? null,
      previousNote: previous?.note ?? null,
      newDecision: decision.decision,
      newNote: decision.note ?? null
    }
  });

  return decision;
};

export const clearDecision = async (claimId: string, claimLineId: string, userId: string): Promise<void> => {
  const line = await repository.findClaimLine(claimId, claimLineId);

  if (!line) {
    throw new NotFoundError("Claim line not found");
  }

  const previous = await repository.getDecisionByLineId(claimLineId);

  if (!previous) {
    throw new NotFoundError("Claim line decision not found");
  }

  await repository.deleteDecisionByLineId(claimLineId);

  await logSystemEvent({
    claimId,
    action: "CLAIM_LINE_DECISION_CLEARED",
    targetEntity: "claim_line_decisions",
    targetEntityId: previous.id as string,
    userId,
    metadata: {
      claimId,
      claimLineId,
      previousDecision: previous.decision,
      previousNote: previous.note ?? null
    }
  });
};
