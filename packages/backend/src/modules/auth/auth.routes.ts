import { Router } from "express";
import { validateRequest } from "../../common/middleware/validate-request";
import * as authController from "./auth.controller";
import { loginSchema, refreshSchema } from "./auth.validation";

export const authRoutes = Router();

authRoutes.post("/login", validateRequest(loginSchema), authController.login);
authRoutes.post("/refresh", validateRequest(refreshSchema), authController.refresh);
