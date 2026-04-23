import { Router } from "express";
import { UserRole } from "@fdcdf/shared";
import { authMiddleware } from "../../common/middleware/auth-middleware";
import { authorize } from "../../common/middleware/authorize";
import { validateRequest } from "../../common/middleware/validate-request";
import * as providersController from "./providers.controller";
import {
  createProviderSchema,
  listProvidersQuerySchema,
  providerIdParamsSchema,
  updateProviderSchema
} from "./providers.validation";

export const providersRoutes = Router();

providersRoutes.use(authMiddleware);

providersRoutes.get(
  "/",
  authorize([UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR, UserRole.RULES_ADMIN]),
  validateRequest(listProvidersQuerySchema),
  providersController.listProviders
);

providersRoutes.get(
  "/:providerId",
  authorize([UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR, UserRole.RULES_ADMIN]),
  validateRequest(providerIdParamsSchema),
  providersController.getProvider
);

providersRoutes.post(
  "/",
  authorize([UserRole.ADMIN]),
  validateRequest(createProviderSchema),
  providersController.createProvider
);

providersRoutes.put(
  "/:providerId",
  authorize([UserRole.ADMIN]),
  validateRequest(providerIdParamsSchema),
  validateRequest(updateProviderSchema),
  providersController.updateProvider
);

providersRoutes.delete(
  "/:providerId",
  authorize([UserRole.ADMIN]),
  validateRequest(providerIdParamsSchema),
  providersController.deleteProvider
);
