export interface AuditLogInput {
  claimId?: string;
  action: string;
  targetEntity: string;
  targetEntityId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}
