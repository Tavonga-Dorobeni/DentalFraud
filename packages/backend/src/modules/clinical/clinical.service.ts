import { NotFoundError, ValidationError } from "../../common/errors/app-error";
import { getDentitionType } from "../../common/utils/fdi";
import * as repository from "./clinical.repository";
import { ProcedureCatalogEntry, RuleConfig } from "./clinical.types";

export const getProcedureByCode = async (procedureCode: string): Promise<ProcedureCatalogEntry> => {
  const procedure = await repository.findProcedureByCode(procedureCode);

  if (!procedure) {
    throw new ValidationError(`Unknown procedure code: ${procedureCode}`);
  }

  return {
    id: procedure.id,
    procedureCode: procedure.procedure_code,
    description: procedure.description,
    category: procedure.category,
    complexityLevel: procedure.complexity_level,
    requiresEvidence: Boolean(procedure.requires_evidence),
    allowedDentition: procedure.allowed_dentition
  };
};

export const validateProcedureForTooth = async (
  procedureCode: string,
  toothNumber?: number
): Promise<void> => {
  if (!toothNumber) {
    return;
  }

  const procedure = await getProcedureByCode(procedureCode);
  const dentitionType = getDentitionType(toothNumber);

  if (!dentitionType) {
    throw new ValidationError(`Invalid FDI tooth number: ${toothNumber}`);
  }

  if (procedure.allowedDentition !== "BOTH" && procedure.allowedDentition !== dentitionType) {
    throw new ValidationError(
      `Procedure ${procedureCode} is not allowed for ${dentitionType.toLowerCase()} dentition`
    );
  }
};

export const getEnabledRules = async (): Promise<RuleConfig[]> => {
  const rules = await repository.listEnabledRules();
  const activeConfig = await repository.getActiveConfigVersion();

  if (!activeConfig) {
    throw new NotFoundError("No active configuration version found");
  }

  return rules.map((rule) => ({
    id: rule.id,
    code: rule.rule_code,
    name: rule.name,
    severity: rule.severity,
    parameters: JSON.parse(rule.parameters_json ?? "{}"),
    enabled: Boolean(rule.enabled),
    configVersionId: activeConfig.id
  }));
};

export const getActiveConfigVersionId = async (): Promise<string> => {
  const config = await repository.getActiveConfigVersion();

  if (!config) {
    throw new NotFoundError("No active configuration version found");
  }

  return config.id;
};
