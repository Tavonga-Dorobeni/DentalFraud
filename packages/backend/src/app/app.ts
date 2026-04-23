import express from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { claimsRoutes } from "../modules/claims/claims.routes";
import { alertsRoutes } from "../modules/alerts/alerts.routes";
import { patientsRoutes } from "../modules/patients/patients.routes";
import { providersRoutes } from "../modules/providers/providers.routes";
import { proceduresRoutes } from "../modules/procedures/procedures.routes";
import { reportsRoutes } from "../modules/reports/reports.routes";
import { errorHandler } from "../common/middleware/error-handler";
import { requestLogger } from "../common/middleware/request-logger";

export const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use(requestLogger);

  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/claims", claimsRoutes);
  app.use("/api/v1/alerts", alertsRoutes);
  app.use("/api/v1/patients", patientsRoutes);
  app.use("/api/v1/providers", providersRoutes);
  app.use("/api/v1/procedures", proceduresRoutes);
  app.use("/api/v1/reports", reportsRoutes);

  app.use(errorHandler);

  return app;
};
