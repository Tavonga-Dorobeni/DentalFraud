import { NextFunction, Request, Response } from "express";
import { paginatedResponse, successResponse } from "../../common/utils/api-response";
import * as alertsService from "./alerts.service";

export const listAlerts = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const result = await alertsService.listAlerts(
      request.query.page as string | undefined,
      request.query.pageSize as string | undefined,
      request.query.status as string | undefined
    );
    response.json(
      paginatedResponse(
        result.items,
        result.pagination.page,
        result.pagination.pageSize,
        result.pagination.total
      )
    );
  } catch (error) {
    next(error);
  }
};

export const getAlert = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const alert = await alertsService.getAlert(String(request.params.alertId));
    response.json(successResponse(alert));
  } catch (error) {
    next(error);
  }
};

export const acknowledgeAlert = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const alert = await alertsService.acknowledgeAlert(String(request.params.alertId), request.user!.id);
    response.json(successResponse(alert));
  } catch (error) {
    next(error);
  }
};

export const closeAlert = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const alert = await alertsService.closeAlert(String(request.params.alertId), request.user!.id);
    response.json(successResponse(alert));
  } catch (error) {
    next(error);
  }
};
