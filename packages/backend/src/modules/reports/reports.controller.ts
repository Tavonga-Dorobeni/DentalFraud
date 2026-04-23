import { NextFunction, Request, Response } from "express";
import { successResponse } from "../../common/utils/api-response";
import * as reportsService from "./reports.service";

export const getRiskBandDistribution = async (
  _request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const report = await reportsService.getRiskBandDistribution();
    response.json(successResponse(report));
  } catch (error) {
    next(error);
  }
};

export const getRuleFrequency = async (_request: Request, response: Response, next: NextFunction) => {
  try {
    const report = await reportsService.getRuleFrequency();
    response.json(successResponse(report));
  } catch (error) {
    next(error);
  }
};

export const getDecisionCounts = async (_request: Request, response: Response, next: NextFunction) => {
  try {
    const report = await reportsService.getDecisionCounts();
    response.json(successResponse(report));
  } catch (error) {
    next(error);
  }
};

export const getTopEntities = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const report = await reportsService.getTopEntities(
      request.query.limit ? Number(request.query.limit) : undefined
    );
    response.json(successResponse(report));
  } catch (error) {
    next(error);
  }
};
