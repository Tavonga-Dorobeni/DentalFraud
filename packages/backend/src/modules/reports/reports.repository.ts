import { getDb } from "../../common/db/knex";

export const getRiskBandDistribution = async () => {
  const db = getDb();

  const latestScores = db("risk_scores as rs")
    .select("rs.claim_id")
    .max({ created_at: "rs.created_at" })
    .groupBy("rs.claim_id")
    .as("latest_scores");

  return db("risk_scores as rs")
    .join(latestScores, function joinLatestScores() {
      this.on("rs.claim_id", "=", "latest_scores.claim_id").andOn(
        "rs.created_at",
        "=",
        "latest_scores.created_at"
      );
    })
    .select("rs.band as label")
    .count({ value: "*" })
    .groupBy("rs.band")
    .orderBy("rs.band", "asc");
};

export const getRuleFrequency = async () => {
  const db = getDb();

  return db("rule_results")
    .select("rule_id as label")
    .count({ value: "*" })
    .groupBy("rule_id")
    .orderBy("value", "desc")
    .orderBy("rule_id", "asc");
};

export const getDecisionCounts = async () => {
  const db = getDb();

  return db("claim_line_decisions")
    .select("decision as label")
    .count({ value: "*" })
    .groupBy("decision")
    .orderBy("value", "desc")
    .orderBy("decision", "asc");
};

export const getTopProcedures = async (limit: number) => {
  const db = getDb();

  return db("claim_lines as cl")
    .join("claims as c", "cl.claim_id", "c.id")
    .whereNull("c.deleted_at")
    .select("cl.procedure_code as id", "cl.procedure_code as label")
    .count({ value: "*" })
    .groupBy("cl.procedure_code")
    .orderBy("value", "desc")
    .orderBy("cl.procedure_code", "asc")
    .limit(limit);
};

export const getTopProviders = async (limit: number) => {
  const db = getDb();

  return db("claims as c")
    .join("providers as p", "c.provider_id", "p.id")
    .whereNull("c.deleted_at")
    .select("p.id", "p.name as label")
    .count({ value: "*" })
    .groupBy("p.id", "p.name")
    .orderBy("value", "desc")
    .orderBy("p.name", "asc")
    .limit(limit);
};

export const getTopPatients = async (limit: number) => {
  const db = getDb();

  return db("claims as c")
    .join("patients as p", "c.patient_id", "p.id")
    .whereNull("c.deleted_at")
    .select("p.id", "p.name as label")
    .count({ value: "*" })
    .groupBy("p.id", "p.name")
    .orderBy("value", "desc")
    .orderBy("p.name", "asc")
    .limit(limit);
};
