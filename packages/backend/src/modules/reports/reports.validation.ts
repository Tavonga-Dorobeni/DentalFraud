import { z } from "zod";

export const topEntitiesQuerySchema = {
  query: z.object({
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform((value) => Number(value))
      .refine((value) => value > 0 && value <= 25, {
        message: "limit must be between 1 and 25"
      })
      .optional()
  })
};
