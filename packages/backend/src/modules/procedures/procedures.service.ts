import {
  CreateProcedureRequest,
  ProcedureDto,
  UpdateProcedureRequest
} from "@fdcdf/shared";
import { ConflictError, NotFoundError } from "../../common/errors/app-error";
import { parsePagination } from "../../common/utils/pagination";
import { logSystemEvent } from "../logs/logs.service";
import * as repository from "./procedures.repository";

const mapProcedure = (row: Record<string, unknown> | undefined): ProcedureDto => {
  if (!row) {
    throw new NotFoundError("Procedure not found");
  }

  return {
    id: row.id as string,
    code: row.procedure_code as string,
    description: row.description as string,
    category: row.category as string,
    complexityLevel: Number(row.complexity_level),
    requiresEvidence: Boolean(row.requires_evidence),
    allowedDentition: row.allowed_dentition as "PRIMARY" | "PERMANENT" | "BOTH",
    createdAt: row.created_at as string
  };
};

export const listProcedures = async (
  page?: string,
  pageSize?: string,
  search?: string,
  category?: string
) => {
  const paging = parsePagination(page, pageSize);
  const offset = (paging.page - 1) * paging.pageSize;
  const result = await repository.listProcedures(offset, paging.pageSize, search, category);

  return {
    items: result.rows.map((row) => mapProcedure(row as Record<string, unknown>)),
    pagination: {
      page: paging.page,
      pageSize: paging.pageSize,
      total: result.total,
      totalPages: Math.ceil(result.total / paging.pageSize) || 1
    }
  };
};

export const getProcedure = async (procedureId: string): Promise<ProcedureDto> =>
  mapProcedure((await repository.getProcedureById(procedureId)) as Record<string, unknown> | undefined);

export const createProcedure = async (
  input: CreateProcedureRequest,
  userId?: string
): Promise<ProcedureDto> => {
  const existing = await repository.getProcedureByCode(input.code);
  if (existing) {
    throw new ConflictError(`Procedure code ${input.code} already exists`);
  }

  const procedure = mapProcedure((await repository.createProcedure(input)) as Record<string, unknown>);
  await logSystemEvent({
    action: "PROCEDURE_CREATED",
    targetEntity: "procedure_catalog",
    targetEntityId: procedure.id,
    userId
  });
  return procedure;
};

export const updateProcedure = async (
  procedureId: string,
  input: UpdateProcedureRequest,
  userId?: string
): Promise<ProcedureDto> => {
  await getProcedure(procedureId);

  if (input.code) {
    const existing = await repository.getProcedureByCode(input.code);
    if (existing && existing.id !== procedureId) {
      throw new ConflictError(`Procedure code ${input.code} already exists`);
    }
  }

  const procedure = mapProcedure((await repository.updateProcedure(procedureId, input)) as Record<string, unknown>);
  await logSystemEvent({
    action: "PROCEDURE_UPDATED",
    targetEntity: "procedure_catalog",
    targetEntityId: procedure.id,
    userId
  });
  return procedure;
};

export const deleteProcedure = async (procedureId: string, userId?: string): Promise<void> => {
  await getProcedure(procedureId);
  await repository.deleteProcedure(procedureId);
  await logSystemEvent({
    action: "PROCEDURE_DELETED",
    targetEntity: "procedure_catalog",
    targetEntityId: procedureId,
    userId
  });
};
