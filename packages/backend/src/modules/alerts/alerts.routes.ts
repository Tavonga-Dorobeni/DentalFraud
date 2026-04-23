import { Router } from "express";
import { UserRole } from "@fdcdf/shared";
import { authMiddleware } from "../../common/middleware/auth-middleware";
import { authorize } from "../../common/middleware/authorize";
import { validateRequest } from "../../common/middleware/validate-request";
import * as alertsController from "./alerts.controller";
import { alertIdParamsSchema, listAlertsQuerySchema } from "./alerts.validation";

export const alertsRoutes = Router();

alertsRoutes.use(authMiddleware);

alertsRoutes.get(
  "/",
  authorize([UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR]),
  validateRequest(listAlertsQuerySchema),
  alertsController.listAlerts
);

alertsRoutes.get(
  "/:alertId",
  authorize([UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR]),
  validateRequest(alertIdParamsSchema),
  alertsController.getAlert
);

alertsRoutes.post(
  "/:alertId/acknowledge",
  authorize([UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR]),
  validateRequest(alertIdParamsSchema),
  alertsController.acknowledgeAlert
);

alertsRoutes.post(
  "/:alertId/close",
  authorize([UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR]),
  validateRequest(alertIdParamsSchema),
  alertsController.closeAlert
);
