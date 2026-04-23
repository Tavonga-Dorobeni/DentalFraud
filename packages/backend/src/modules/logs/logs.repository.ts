import { getDb } from "../../common/db/knex";
import { createId } from "../../common/utils/ids";
import { AuditLogInput } from "./logs.types";

export const createAuditLog = async (input: AuditLogInput): Promise<void> => {
  const db = getDb();

  await db("audit_logs").insert({
    id: createId("log"),
    claim_id: input.claimId ?? null,
    user_id: input.userId ?? null,
    action: input.action,
    target_entity: input.targetEntity,
    target_entity_id: input.targetEntityId ?? null,
    metadata_json: JSON.stringify(input.metadata ?? {}),
    created_at: new Date().toISOString()
  });
};

export const listAuditLogsByClaimId = async (claimId: string) => {
  const db = getDb();

  return db("audit_logs as al")
    .leftJoin("users as u", "al.user_id", "u.id")
    .where({ "al.claim_id": claimId })
    .select(
      "al.id",
      "al.claim_id",
      "al.user_id",
      "u.email as user_email",
      "u.role as user_role",
      "al.action",
      "al.target_entity",
      "al.target_entity_id",
      "al.metadata_json",
      "al.created_at"
    )
    .orderBy("al.created_at", "desc")
    .orderBy("al.id", "desc");
};
