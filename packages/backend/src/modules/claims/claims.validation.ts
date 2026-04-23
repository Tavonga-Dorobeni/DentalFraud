import { LineDecision } from "@fdcdf/shared";
import { z } from "zod";

const isoDateOrDateTime = z
  .string()
  .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isNaN(Date.parse(value)), {
    message: "Invalid date"
  });

export const createClaimSchema = {
  body: z.object({
    externalClaimId: z.string().min(1),
    patientExternalId: z.string().min(1),
    patientName: z.string().min(1),
    patientDateOfBirth: isoDateOrDateTime.optional(),
    providerExternalId: z.string().min(1),
    providerName: z.string().min(1),
    providerSpecialty: z.string().optional(),
    dateOfService: isoDateOrDateTime,
    submissionDate: isoDateOrDateTime,
    lines: z
      .array(
        z.object({
          procedureCode: z.string().min(1),
          claimedAmount: z.number().positive(),
          toothNumber: z.number().int().optional(),
          documentedProcedureCode: z.string().optional(),
          evidenceSummary: z.string().optional(),
          chartNotes: z.string().optional(),
          radiographReference: z.string().optional(),
          treatmentPlanReference: z.string().optional()
        })
      )
      .min(1)
  })
};

export const claimIdParamsSchema = {
  params: z.object({
    claimId: z.string().min(1)
  })
};

export const claimIdLineIdParamsSchema = {
  params: z.object({
    claimId: z.string().min(1),
    lineId: z.string().min(1)
  })
};

export const listClaimsQuerySchema = {
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional()
  })
};

export const upsertClaimLineDecisionSchema = {
  body: z.object({
    decision: z.nativeEnum(LineDecision),
    note: z.string().trim().min(1).optional()
  }),
  params: claimIdLineIdParamsSchema.params
};
