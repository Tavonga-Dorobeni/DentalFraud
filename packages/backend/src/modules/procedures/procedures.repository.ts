import { getDb } from "../../common/db/knex";
import { createId } from "../../common/utils/ids";
import { CreateProcedureRequest, UpdateProcedureRequest } from "@fdcdf/shared";

export const listProcedures = async (
  offset: number,
  limit: number,
  search?: string,
  category?: string
) => {
  const db = getDb();
  const query = db("procedure_catalog");

  if (search) {
    query.where((builder) => {
      builder
        .where("procedure_code", "like", `%${search}%`)
        .orWhere("description", "like", `%${search}%`);
    });
  }

  if (category) {
    query.andWhere({ category });
  }

  const countRow = await query.clone().count({ count: "*" }).first();
  const rows = await query.orderBy("procedure_code", "asc").offset(offset).limit(limit);

  return {
    rows,
    total: Number(countRow?.count ?? 0)
  };
};

export const getProcedureById = async (procedureId: string) => {
  const db = getDb();
  return db("procedure_catalog").where({ id: procedureId }).first();
};

export const getProcedureByCode = async (code: string) => {
  const db = getDb();
  return db("procedure_catalog").where({ procedure_code: code }).first();
};

export const createProcedure = async (input: CreateProcedureRequest) => {
  const db = getDb();
  const id = createId("proc");
  const createdAt = new Date().toISOString();

  await db("procedure_catalog").insert({
    id,
    procedure_code: input.code,
    description: input.description,
    category: input.category,
    complexity_level: input.complexityLevel,
    requires_evidence: input.requiresEvidence ?? false,
    allowed_dentition: input.allowedDentition,
    created_at: createdAt
  });

  return getProcedureById(id);
};

export const updateProcedure = async (procedureId: string, input: UpdateProcedureRequest) => {
  const db = getDb();

  await db("procedure_catalog")
    .where({ id: procedureId })
    .update({
      ...(input.code !== undefined ? { procedure_code: input.code } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.complexityLevel !== undefined ? { complexity_level: input.complexityLevel } : {}),
      ...(input.requiresEvidence !== undefined ? { requires_evidence: input.requiresEvidence } : {}),
      ...(input.allowedDentition !== undefined ? { allowed_dentition: input.allowedDentition } : {})
    });

  return getProcedureById(procedureId);
};

export const deleteProcedure = async (procedureId: string) => {
  const db = getDb();
  return db("procedure_catalog").where({ id: procedureId }).del();
};
