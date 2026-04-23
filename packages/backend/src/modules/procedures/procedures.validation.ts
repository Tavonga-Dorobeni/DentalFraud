import { z } from "zod";

const allowedDentitionSchema = z.enum(["PRIMARY", "PERMANENT", "BOTH"]);

export const procedureIdParamsSchema = {
  params: z.object({
    procedureId: z.string().min(1)
  })
};

export const listProceduresQuerySchema = {
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional(),
    search: z.string().optional(),
    category: z.string().optional()
  })
};

export const createProcedureSchema = {
  body: z.object({
    code: z.string().min(1),
    description: z.string().min(1),
    category: z.string().min(1),
    complexityLevel: z.number().int().min(1),
    requiresEvidence: z.boolean().optional(),
    allowedDentition: allowedDentitionSchema
  })
};

export const updateProcedureSchema = {
  body: z
    .object({
      code: z.string().min(1).optional(),
      description: z.string().min(1).optional(),
      category: z.string().min(1).optional(),
      complexityLevel: z.number().int().min(1).optional(),
      requiresEvidence: z.boolean().optional(),
      allowedDentition: allowedDentitionSchema.optional()
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one field must be provided"
    })
};
