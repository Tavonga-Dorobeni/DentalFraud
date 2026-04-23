import { getDb } from "../../common/db/knex";
import { createId } from "../../common/utils/ids";

interface UpsertDecisionInput {
  claimId: string;
  claimLineId: string;
  decision: string;
  note?: string;
  decidedByUserId: string;
}

export const findClaimLine = async (claimId: string, claimLineId: string) => {
  const db = getDb();
  return db("claim_lines").where({ id: claimLineId, claim_id: claimId }).first();
};

export const getDecisionByLineId = async (claimLineId: string) => {
  const db = getDb();
  return db("claim_line_decisions").where({ claim_line_id: claimLineId }).first();
};

export const listDecisionsByClaimId = async (claimId: string) => {
  const db = getDb();
  return db("claim_line_decisions").where({ claim_id: claimId }).orderBy("decided_at", "desc");
};

export const upsertDecision = async (input: UpsertDecisionInput) => {
  const db = getDb();
  const existing = await getDecisionByLineId(input.claimLineId);
  const decidedAt = new Date().toISOString();

  if (existing) {
    await db("claim_line_decisions")
      .where({ id: existing.id })
      .update({
        decision: input.decision,
        note: input.note ?? null,
        decided_by_user_id: input.decidedByUserId,
        decided_at: decidedAt
      });

    return db("claim_line_decisions").where({ id: existing.id }).first();
  }

  const id = createId("decision");
  await db("claim_line_decisions").insert({
    id,
    claim_id: input.claimId,
    claim_line_id: input.claimLineId,
    decision: input.decision,
    note: input.note ?? null,
    decided_by_user_id: input.decidedByUserId,
    decided_at: decidedAt
  });

  return db("claim_line_decisions").where({ id }).first();
};

export const deleteDecisionByLineId = async (claimLineId: string) => {
  const db = getDb();
  return db("claim_line_decisions").where({ claim_line_id: claimLineId }).del();
};
