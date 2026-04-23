import {
  CreatePatientRequest,
  PatientDto,
  UpdatePatientRequest
} from "@fdcdf/shared";
import { ConflictError, NotFoundError } from "../../common/errors/app-error";
import { parsePagination } from "../../common/utils/pagination";
import { logSystemEvent } from "../logs/logs.service";
import * as repository from "./patients.repository";

const mapPatient = (row: Record<string, unknown> | undefined): PatientDto => {
  if (!row) {
    throw new NotFoundError("Patient not found");
  }

  return {
    id: row.id as string,
    externalId: row.external_id as string,
    name: row.name as string,
    dateOfBirth: (row.date_of_birth as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  };
};

export const listPatients = async (page?: string, pageSize?: string, search?: string) => {
  const paging = parsePagination(page, pageSize);
  const offset = (paging.page - 1) * paging.pageSize;
  const result = await repository.listPatients(offset, paging.pageSize, search);

  return {
    items: result.rows.map((row) => mapPatient(row as Record<string, unknown>)),
    pagination: {
      page: paging.page,
      pageSize: paging.pageSize,
      total: result.total,
      totalPages: Math.ceil(result.total / paging.pageSize) || 1
    }
  };
};

export const getPatient = async (patientId: string): Promise<PatientDto> =>
  mapPatient((await repository.getPatientById(patientId)) as Record<string, unknown> | undefined);

export const createPatient = async (input: CreatePatientRequest, userId?: string): Promise<PatientDto> => {
  const existing = await repository.getPatientByExternalId(input.externalId);
  if (existing) {
    throw new ConflictError(`Patient external ID ${input.externalId} already exists`);
  }

  const patient = mapPatient((await repository.createPatient(input)) as Record<string, unknown>);
  await logSystemEvent({
    action: "PATIENT_CREATED",
    targetEntity: "patients",
    targetEntityId: patient.id,
    userId
  });
  return patient;
};

export const updatePatient = async (
  patientId: string,
  input: UpdatePatientRequest,
  userId?: string
): Promise<PatientDto> => {
  await getPatient(patientId);

  if (input.externalId) {
    const existing = await repository.getPatientByExternalId(input.externalId);
    if (existing && existing.id !== patientId) {
      throw new ConflictError(`Patient external ID ${input.externalId} already exists`);
    }
  }

  const patient = mapPatient((await repository.updatePatient(patientId, input)) as Record<string, unknown>);
  await logSystemEvent({
    action: "PATIENT_UPDATED",
    targetEntity: "patients",
    targetEntityId: patient.id,
    userId
  });
  return patient;
};

export const deletePatient = async (patientId: string, userId?: string): Promise<void> => {
  await getPatient(patientId);
  await repository.deletePatient(patientId);
  await logSystemEvent({
    action: "PATIENT_DELETED",
    targetEntity: "patients",
    targetEntityId: patientId,
    userId
  });
};
