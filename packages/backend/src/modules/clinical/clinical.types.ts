export interface ProcedureCatalogEntry {
  id: string;
  procedureCode: string;
  description: string;
  category: string;
  complexityLevel: number;
  requiresEvidence: boolean;
  allowedDentition: "PRIMARY" | "PERMANENT" | "BOTH";
}

export interface RuleConfig {
  id: string;
  code: string;
  name: string;
  severity: string;
  parameters: Record<string, unknown>;
  enabled: boolean;
  configVersionId: string;
}
