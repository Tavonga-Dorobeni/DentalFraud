import { getDb } from "../../common/db/knex";
import { createId } from "../../common/utils/ids";

export const createAlerts = async (
  alerts: Array<{
    claimId: string;
    claimLineId?: string;
    severity: string;
    summary: string;
    recommendedAction: string;
    triggeredRuleIds: string[];
  }>
) => {
  const db = getDb();
  const now = new Date().toISOString();

  const records = alerts.map((alert) => ({
    id: createId("alert"),
    claim_id: alert.claimId,
    claim_line_id: alert.claimLineId ?? null,
    severity: alert.severity,
    status: "OPEN",
    summary: alert.summary,
    recommended_action: alert.recommendedAction,
    assigned_user_id: null,
    triggered_rule_ids_json: JSON.stringify(alert.triggeredRuleIds),
    created_at: now,
    updated_at: now,
    deleted_at: null
  }));

  if (records.length > 0) {
    await db("alerts").insert(records);
  }

  return db("alerts").whereIn(
    "id",
    records.map((record) => record.id)
  );
};

export const listAlerts = async (offset: number, limit: number, status?: string) => {
  const db = getDb();
  const query = db("alerts").whereNull("deleted_at");

  if (status) {
    query.andWhere({ status });
  }

  const countRow = await query.clone().count({ count: "*" }).first();
  const rows = await query
    .orderBy("created_at", "desc")
    .offset(offset)
    .limit(limit);

  return {
    rows,
    total: Number(countRow?.count ?? 0)
  };
};

export const getAlertById = async (alertId: string) => {
  const db = getDb();
  return db("alerts").where({ id: alertId }).whereNull("deleted_at").first();
};

export const updateAlertStatus = async (alertId: string, status: string, assignedUserId?: string) => {
  const db = getDb();
  await db("alerts")
    .where({ id: alertId })
    .update({
      status,
      assigned_user_id: assignedUserId ?? null,
      updated_at: new Date().toISOString()
    });
  return getAlertById(alertId);
};
