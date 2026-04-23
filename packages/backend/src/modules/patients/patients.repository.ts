import { getDb } from "../../common/db/knex";
import { createId } from "../../common/utils/ids";
import { CreatePatientRequest, UpdatePatientRequest } from "@fdcdf/shared";

export const listPatients = async (offset: number, limit: number, search?: string) => {
  const db = getDb();
  const query = db("patients");

  if (search) {
    query.where((builder) => {
      builder.where("name", "like", `%${search}%`).orWhere("external_id", "like", `%${search}%`);
    });
  }

  const countRow = await query.clone().count({ count: "*" }).first();
  const rows = await query.orderBy("name", "asc").offset(offset).limit(limit);

  return {
    rows,
    total: Number(countRow?.count ?? 0)
  };
};

export const getPatientById = async (patientId: string) => {
  const db = getDb();
  return db("patients").where({ id: patientId }).first();
};

export const getPatientByExternalId = async (externalId: string) => {
  const db = getDb();
  return db("patients").where({ external_id: externalId }).first();
};

export const createPatient = async (input: CreatePatientRequest) => {
  const db = getDb();
  const id = createId("patient");
  const now = new Date().toISOString();

  await db("patients").insert({
    id,
    external_id: input.externalId,
    name: input.name,
    date_of_birth: input.dateOfBirth ?? null,
    created_at: now,
    updated_at: now
  });

  return getPatientById(id);
};

export const updatePatient = async (patientId: string, input: UpdatePatientRequest) => {
  const db = getDb();

  await db("patients")
    .where({ id: patientId })
    .update({
      ...(input.externalId !== undefined ? { external_id: input.externalId } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.dateOfBirth !== undefined ? { date_of_birth: input.dateOfBirth ?? null } : {}),
      updated_at: new Date().toISOString()
    });

  return getPatientById(patientId);
};

export const deletePatient = async (patientId: string) => {
  const db = getDb();
  return db("patients").where({ id: patientId }).del();
};
