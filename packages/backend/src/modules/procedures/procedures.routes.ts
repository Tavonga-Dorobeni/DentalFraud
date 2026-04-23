import { Router } from "express";
import { UserRole } from "@fdcdf/shared";
import { authMiddleware } from "../../common/middleware/auth-middleware";
import { authorize } from "../../common/middleware/authorize";
import { validateRequest } from "../../common/middleware/validate-request";
import * as proceduresController from "./procedures.controller";
import {
  createProcedureSchema,
  listProceduresQuerySchema,
  procedureIdParamsSchema,
  updateProcedureSchema
} from "./procedures.validation";

export const proceduresRoutes = Router();

proceduresRoutes.use(authMiddleware);

proceduresRoutes.get(
  "/",
  authorize([UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR, UserRole.RULES_ADMIN]),
  validateRequest(listProceduresQuerySchema),
  proceduresController.listProcedures
);

proceduresRoutes.get(
  "/:procedureId",
  authorize([UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR, UserRole.RULES_ADMIN]),
  validateRequest(procedureIdParamsSchema),
  proceduresController.getProcedure
);

proceduresRoutes.post(
  "/",
  authorize([UserRole.ADMIN, UserRole.RULES_ADMIN]),
  validateRequest(createProcedureSchema),
  proceduresController.createProcedure
);

proceduresRoutes.put(
  "/:procedureId",
  authorize([UserRole.ADMIN, UserRole.RULES_ADMIN]),
  validateRequest(procedureIdParamsSchema),
  validateRequest(updateProcedureSchema),
  proceduresController.updateProcedure
);

proceduresRoutes.delete(
  "/:procedureId",
  authorize([UserRole.ADMIN, UserRole.RULES_ADMIN]),
  validateRequest(procedureIdParamsSchema),
  proceduresController.deleteProcedure
);
