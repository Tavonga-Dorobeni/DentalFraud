import { z } from "zod";

export const providerIdParamsSchema = {
  params: z.object({
    providerId: z.string().min(1)
  })
};

export const listProvidersQuerySchema = {
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional(),
    search: z.string().optional()
  })
};

export const createProviderSchema = {
  body: z.object({
    externalId: z.string().min(1),
    name: z.string().min(1),
    specialty: z.string().optional()
  })
};

export const updateProviderSchema = {
  body: z
    .object({
      externalId: z.string().min(1).optional(),
      name: z.string().min(1).optional(),
      specialty: z.string().optional()
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one field must be provided"
    })
};
