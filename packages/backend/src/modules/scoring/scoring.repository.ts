import { getDb } from "../../common/db/knex";
import { createId } from "../../common/utils/ids";

export const createRiskScore = async (input: {
  claimId: string;
  score: number;
  band: string;
  confidence: number;
  contributingFactorsJson: string;
  configVersionId: string;
}) => {
  const db = getDb();
  const id = createId("score");
  const createdAt = new Date().toISOString();

  await db("risk_scores").insert({
    id,
    claim_id: input.claimId,
    score: input.score,
    band: input.band,
    confidence: input.confidence,
    contributing_factors_json: input.contributingFactorsJson,
    config_version_id: input.configVersionId,
    created_at: createdAt
  });

  return db("risk_scores").where({ id }).first();
};
