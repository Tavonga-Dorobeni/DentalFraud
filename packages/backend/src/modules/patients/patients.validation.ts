import { z } from "zod";

const isoDateOrDateTime = z
  .string()
  .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isNaN(Date.parse(value)), {
    message: "Invalid date"
  });

export const patientIdParamsSchema = {
  params: z.object({
    patientId: z.string().min(1)
  })
};

export const listPatientsQuerySchema = {
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional(),
    search: z.string().optional()
  })
};

export const createPatientSchema = {
  body: z.object({
    externalId: z.string().min(1),
    name: z.string().min(1),
    dateOfBirth: isoDateOrDateTime.optional()
  })
};

export const updatePatientSchema = {
  body: z
    .object({
      externalId: z.string().min(1).optional(),
      name: z.string().min(1).optional(),
      dateOfBirth: isoDateOrDateTime.optional()
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one field must be provided"
    })
};
