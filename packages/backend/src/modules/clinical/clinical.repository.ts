import { getDb } from "../../common/db/knex";

export const findProcedureByCode = async (procedureCode: string) => {
  const db = getDb();
  return db("procedure_catalog").where({ procedure_code: procedureCode }).first();
};

export const listEnabledRules = async () => {
  const db = getDb();
  return db("clinical_rules").where({ enabled: 1 });
};

export const getActiveConfigVersion = async () => {
  const db = getDb();
  return db("config_versions").where({ is_active: 1 }).orderBy("created_at", "desc").first();
};
