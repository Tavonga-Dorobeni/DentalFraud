import { Router } from "express";
import { UserRole } from "@fdcdf/shared";
import { authMiddleware } from "../../common/middleware/auth-middleware";
import { authorize } from "../../common/middleware/authorize";
import { validateRequest } from "../../common/middleware/validate-request";
import * as claimsController from "./claims.controller";
import {
  claimIdLineIdParamsSchema,
  claimIdParamsSchema,
  createClaimSchema,
  listClaimsQuerySchema,
  upsertClaimLineDecisionSchema
} from "./claims.validation";

export const claimsRoutes = Router();

claimsRoutes.use(authMiddleware);

claimsRoutes.post(
  "/",
  authorize([UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR]),
  validateRequest(createClaimSchema),
  claimsController.createClaim
);

claimsRoutes.get(
  "/",
  authorize([UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR]),
  validateRequest(listClaimsQuerySchema),
  claimsController.listClaims
);

claimsRoutes.get(
  "/:claimId/audit-trail",
  authorize([UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR]),
  validateRequest(claimIdParamsSchema),
  claimsController.getClaimAuditTrail
);

claimsRoutes.get(
  "/:claimId",
  authorize([UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR]),
  validateRequest(claimIdParamsSchema),
  claimsController.getClaim
);

claimsRoutes.post(
  "/:claimId/analyze",
  authorize([UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR]),
  validateRequest(claimIdParamsSchema),
  claimsController.analyzeClaim
);

claimsRoutes.post(
  "/:claimId/lines/:lineId/decision",
  authorize([UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR]),
  validateRequest(upsertClaimLineDecisionSchema),
  claimsController.setClaimLineDecision
);

claimsRoutes.delete(
  "/:claimId/lines/:lineId/decision",
  authorize([UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR]),
  validateRequest(claimIdLineIdParamsSchema),
  claimsController.clearClaimLineDecision
);
