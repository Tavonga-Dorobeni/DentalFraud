import { AlertDto, AlertStatus, RuleResultDto, RuleSeverity } from "@fdcdf/shared";
import { NotFoundError } from "../../common/errors/app-error";
import { parsePagination } from "../../common/utils/pagination";
import { logSystemEvent } from "../logs/logs.service";
import * as repository from "./alerts.repository";

const mapAlert = (row: Record<string, unknown> | undefined): AlertDto => {
  if (!row) {
    throw new NotFoundError("Alert not found");
  }

  return {
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
  };
};

export const createAlertsFromRuleResults = async (
  claimId: string,
  ruleResults: RuleResultDto[],
  userId?: string
): Promise<AlertDto[]> => {
  const severeResults = ruleResults.filter(
    (result) => result.severity === RuleSeverity.HIGH || result.severity === RuleSeverity.CRITICAL
  );

  const persisted = await repository.createAlerts(
    severeResults.map((result) => ({
      claimId,
      claimLineId: result.claimLineId,
      severity: result.severity,
      summary: result.explanation,
      recommendedAction: "Review claim and supporting evidence",
      triggeredRuleIds: [result.ruleId]
    }))
  );

  const alerts = persisted.map((row) => mapAlert(row as Record<string, unknown>));

  await Promise.all(
    alerts.map((alert) =>
      logSystemEvent({
        claimId,
        action: "ALERT_CREATED",
        targetEntity: "alerts",
        targetEntityId: alert.id,
        userId,
        metadata: {
          claimId,
          severity: alert.severity
        }
      })
    )
  );

  return alerts;
};

export const listAlerts = async (page?: string, pageSize?: string, status?: string) => {
  const paging = parsePagination(page, pageSize);
  const offset = (paging.page - 1) * paging.pageSize;
  const result = await repository.listAlerts(offset, paging.pageSize, status);

  return {
    items: result.rows.map((row) => mapAlert(row as Record<string, unknown>)),
    pagination: {
      page: paging.page,
      pageSize: paging.pageSize,
      total: result.total,
      totalPages: Math.ceil(result.total / paging.pageSize) || 1
    }
  };
};

export const getAlert = async (alertId: string): Promise<AlertDto> => {
  return mapAlert((await repository.getAlertById(alertId)) as Record<string, unknown> | undefined);
};

export const acknowledgeAlert = async (alertId: string, userId: string): Promise<AlertDto> => {
  const alert = mapAlert((await repository.updateAlertStatus(alertId, "ACKNOWLEDGED", userId)) as Record<
    string,
    unknown
  >);

  await logSystemEvent({
    claimId: alert.claimId,
    action: "ALERT_ACKNOWLEDGED",
    targetEntity: "alerts",
    targetEntityId: alertId,
    userId
  });

  return alert;
};

export const closeAlert = async (alertId: string, userId: string): Promise<AlertDto> => {
  const alert = mapAlert((await repository.updateAlertStatus(alertId, "CLOSED", userId)) as Record<
    string,
    unknown
  >);

  await logSystemEvent({
    claimId: alert.claimId,
    action: "ALERT_CLOSED",
    targetEntity: "alerts",
    targetEntityId: alertId,
    userId
  });

  return alert;
};
