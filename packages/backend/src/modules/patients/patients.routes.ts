import { Router } from "express";
import { UserRole } from "@fdcdf/shared";
import { authMiddleware } from "../../common/middleware/auth-middleware";
import { authorize } from "../../common/middleware/authorize";
import { validateRequest } from "../../common/middleware/validate-request";
import * as patientsController from "./patients.controller";
import {
  createPatientSchema,
  listPatientsQuerySchema,
  patientIdParamsSchema,
  updatePatientSchema
} from "./patients.validation";

export const patientsRoutes = Router();

patientsRoutes.use(authMiddleware);

patientsRoutes.get(
  "/",
  authorize([UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR, UserRole.RULES_ADMIN]),
  validateRequest(listPatientsQuerySchema),
  patientsController.listPatients
);

patientsRoutes.get(
  "/:patientId",
  authorize([UserRole.ADMIN, UserRole.ANALYST, UserRole.INVESTIGATOR, UserRole.RULES_ADMIN]),
  validateRequest(patientIdParamsSchema),
  patientsController.getPatient
);

patientsRoutes.post(
  "/",
  authorize([UserRole.ADMIN]),
  validateRequest(createPatientSchema),
  patientsController.createPatient
);

patientsRoutes.put(
  "/:patientId",
  authorize([UserRole.ADMIN]),
  validateRequest(patientIdParamsSchema),
  validateRequest(updatePatientSchema),
  patientsController.updatePatient
);

patientsRoutes.delete(
  "/:patientId",
  authorize([UserRole.ADMIN]),
  validateRequest(patientIdParamsSchema),
  patientsController.deletePatient
);
