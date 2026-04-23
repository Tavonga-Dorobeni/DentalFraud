import {
  CreateProviderRequest,
  ProviderDto,
  UpdateProviderRequest
} from "@fdcdf/shared";
import { ConflictError, NotFoundError } from "../../common/errors/app-error";
import { parsePagination } from "../../common/utils/pagination";
import { logSystemEvent } from "../logs/logs.service";
import * as repository from "./providers.repository";

const mapProvider = (row: Record<string, unknown> | undefined): ProviderDto => {
  if (!row) {
    throw new NotFoundError("Provider not found");
  }

  return {
    id: row.id as string,
    externalId: row.external_id as string,
    name: row.name as string,
    specialty: (row.specialty as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  };
};

export const listProviders = async (page?: string, pageSize?: string, search?: string) => {
  const paging = parsePagination(page, pageSize);
  const offset = (paging.page - 1) * paging.pageSize;
  const result = await repository.listProviders(offset, paging.pageSize, search);

  return {
    items: result.rows.map((row) => mapProvider(row as Record<string, unknown>)),
    pagination: {
      page: paging.page,
      pageSize: paging.pageSize,
      total: result.total,
      totalPages: Math.ceil(result.total / paging.pageSize) || 1
    }
  };
};

export const getProvider = async (providerId: string): Promise<ProviderDto> =>
  mapProvider((await repository.getProviderById(providerId)) as Record<string, unknown> | undefined);

export const createProvider = async (
  input: CreateProviderRequest,
  userId?: string
): Promise<ProviderDto> => {
  const existing = await repository.getProviderByExternalId(input.externalId);
  if (existing) {
    throw new ConflictError(`Provider external ID ${input.externalId} already exists`);
  }

  const provider = mapProvider((await repository.createProvider(input)) as Record<string, unknown>);
  await logSystemEvent({
    action: "PROVIDER_CREATED",
    targetEntity: "providers",
    targetEntityId: provider.id,
    userId
  });
  return provider;
};

export const updateProvider = async (
  providerId: string,
  input: UpdateProviderRequest,
  userId?: string
): Promise<ProviderDto> => {
  await getProvider(providerId);

  if (input.externalId) {
    const existing = await repository.getProviderByExternalId(input.externalId);
    if (existing && existing.id !== providerId) {
      throw new ConflictError(`Provider external ID ${input.externalId} already exists`);
    }
  }

  const provider = mapProvider((await repository.updateProvider(providerId, input)) as Record<string, unknown>);
  await logSystemEvent({
    action: "PROVIDER_UPDATED",
    targetEntity: "providers",
    targetEntityId: provider.id,
    userId
  });
  return provider;
};

export const deleteProvider = async (providerId: string, userId?: string): Promise<void> => {
  await getProvider(providerId);
  await repository.deleteProvider(providerId);
  await logSystemEvent({
    action: "PROVIDER_DELETED",
    targetEntity: "providers",
    targetEntityId: providerId,
    userId
  });
};
