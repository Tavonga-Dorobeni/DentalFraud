import { LineDecision } from "@fdcdf/shared";
import { z } from "zod";

export const claimLineDecisionParamsSchema = {
  params: z.object({
    claimId: z.string().min(1),
    lineId: z.string().min(1)
  })
};

export const upsertClaimLineDecisionSchema = {
  body: z.object({
    decision: z.nativeEnum(LineDecision),
    note: z.string().trim().min(1).optional()
  }),
  params: claimLineDecisionParamsSchema.params
};
