import { getDb } from "../../common/db/knex";
import { createId } from "../../common/utils/ids";

export const clearRuleResultsForClaim = async (claimId: string) => {
  const db = getDb();
  await db("rule_results").where({ claim_id: claimId }).del();
};

export const createRuleResults = async (
  rows: Array<{
    claimId: string;
    claimLineId?: string;
    ruleId: string;
    matchedClaimId?: string | null;
    severity: string;
    explanation: string;
    evidenceFields: string[];
    executedAt: string;
    configVersionId: string;
  }>
) => {
  const db = getDb();
  const records = rows.map((row) => ({
    id: createId("rule"),
    claim_id: row.claimId,
    claim_line_id: row.claimLineId ?? null,
    rule_id: row.ruleId,
    matched_claim_id: row.matchedClaimId ?? null,
    severity: row.severity,
    explanation: row.explanation,
    evidence_fields_json: JSON.stringify(row.evidenceFields),
    executed_at: row.executedAt,
    config_version_id: row.configVersionId
  }));

  if (records.length > 0) {
    await db("rule_results").insert(records);
  }

  return records;
};
