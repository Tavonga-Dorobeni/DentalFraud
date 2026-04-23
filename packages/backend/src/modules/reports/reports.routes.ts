import { Router } from "express";
import { UserRole } from "@fdcdf/shared";
import { authMiddleware } from "../../common/middleware/auth-middleware";
import { authorize } from "../../common/middleware/authorize";
import { validateRequest } from "../../common/middleware/validate-request";
import * as reportsController from "./reports.controller";
import { topEntitiesQuerySchema } from "./reports.validation";

export const reportsRoutes = Router();

reportsRoutes.use(authMiddleware);

reportsRoutes.get(
  "/risk-band-distribution",
  authorize([UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR]),
  reportsController.getRiskBandDistribution
);

reportsRoutes.get(
  "/rule-frequency",
  authorize([UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR]),
  reportsController.getRuleFrequency
);

reportsRoutes.get(
  "/decision-counts",
  authorize([UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR]),
  reportsController.getDecisionCounts
);

reportsRoutes.get(
  "/top-entities",
  authorize([UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR]),
  validateRequest(topEntitiesQuerySchema),
  reportsController.getTopEntities
);
