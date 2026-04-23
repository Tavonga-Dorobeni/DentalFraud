import { z } from "zod";

export const alertIdParamsSchema = {
  params: z.object({
    alertId: z.string().min(1)
  })
};

export const listAlertsQuerySchema = {
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional(),
    status: z.string().optional()
  })
};
