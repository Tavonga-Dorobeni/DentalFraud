import { getDb } from "../../common/db/knex";
import { createId } from "../../common/utils/ids";
import { CreateProviderRequest, UpdateProviderRequest } from "@fdcdf/shared";

export const listProviders = async (offset: number, limit: number, search?: string) => {
  const db = getDb();
  const query = db("providers");

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

export const getProviderById = async (providerId: string) => {
  const db = getDb();
  return db("providers").where({ id: providerId }).first();
};

export const getProviderByExternalId = async (externalId: string) => {
  const db = getDb();
  return db("providers").where({ external_id: externalId }).first();
};

export const createProvider = async (input: CreateProviderRequest) => {
  const db = getDb();
  const id = createId("provider");
  const now = new Date().toISOString();

  await db("providers").insert({
    id,
    external_id: input.externalId,
    name: input.name,
    specialty: input.specialty ?? null,
    created_at: now,
    updated_at: now
  });

  return getProviderById(id);
};

export const updateProvider = async (providerId: string, input: UpdateProviderRequest) => {
  const db = getDb();

  await db("providers")
    .where({ id: providerId })
    .update({
      ...(input.externalId !== undefined ? { external_id: input.externalId } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.specialty !== undefined ? { specialty: input.specialty ?? null } : {}),
      updated_at: new Date().toISOString()
    });

  return getProviderById(providerId);
};

export const deleteProvider = async (providerId: string) => {
  const db = getDb();
  return db("providers").where({ id: providerId }).del();
};
