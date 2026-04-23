import { ClaimAuditTrailEventDto, ClaimAuditTrailResponse, UserRole } from "@fdcdf/shared";
import { NotFoundError } from "../../common/errors/app-error";
import { getClaimById } from "../claims/claims.repository";
import { createAuditLog, listAuditLogsByClaimId } from "./logs.repository";
import { AuditLogInput } from "./logs.types";

export const logSystemEvent = async (input: AuditLogInput): Promise<void> => {
  try {
    await createAuditLog(input);
  } catch {
    // Logging must not break primary flows during bootstrap or degraded DB states.
  }
};

const createSummary = (row: Record<string, unknown>): string => {
  const action = String(row.action);
  const metadata = JSON.parse((row.metadata_json as string) ?? "{}") as Record<string, unknown>;

  switch (action) {
    case "CLAIM_INGESTED":
      return "Claim ingested";
    case "CLAIM_ANALYZED":
      return `Claim analyzed${metadata.score !== undefined ? ` and scored ${metadata.score}` : ""}`;
    case "CLAIM_SCORED":
      return `Risk score generated${metadata.band ? ` (${metadata.band})` : ""}`;
    case "ALERT_CREATED":
      return "Alert created";
    case "ALERT_ACKNOWLEDGED":
      return "Alert acknowledged";
    case "ALERT_CLOSED":
      return "Alert closed";
    case "CLAIM_LINE_DECISION_SET":
      return `Line decision set to ${metadata.newDecision ?? "unknown"}`;
    case "CLAIM_LINE_DECISION_UPDATED":
      return `Line decision updated to ${metadata.newDecision ?? "unknown"}`;
    case "CLAIM_LINE_DECISION_CLEARED":
      return "Line decision cleared";
    default:
      return action.replaceAll("_", " ").toLowerCase().replace(/^\w/, (char) => char.toUpperCase());
  }
};

const mapAuditTrailEvent = (row: Record<string, unknown>): ClaimAuditTrailEventDto => {
  const metadata = JSON.parse((row.metadata_json as string) ?? "{}") as Record<string, unknown>;

  return {
    id: row.id as string,
    claimId: row.claim_id as string,
    claimLineId: (metadata.claimLineId as string | undefined) ?? undefined,
    actorUserId: (row.user_id as string | null) ?? undefined,
    actorEmail: (row.user_email as string | null) ?? undefined,
    actorRole: (row.user_role as UserRole | null) ?? undefined,
    action: row.action as string,
    targetEntity: row.target_entity as string,
    targetEntityId: (row.target_entity_id as string | null) ?? undefined,
    summary: createSummary(row),
    metadata,
    createdAt: row.created_at as string
  };
};

export const getClaimAuditTrail = async (claimId: string): Promise<ClaimAuditTrailResponse> => {
  const claim = await getClaimById(claimId, false);

  if (!claim) {
    throw new NotFoundError("Claim not found");
  }

  const rows = await listAuditLogsByClaimId(claimId);

  return {
    claimId,
    events: rows.map((row) => mapAuditTrailEvent(row as Record<string, unknown>))
  };
};
