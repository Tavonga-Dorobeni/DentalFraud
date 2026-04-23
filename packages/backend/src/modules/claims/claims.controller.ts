import { NextFunction, Request, Response } from "express";
import { paginatedResponse, successResponse } from "../../common/utils/api-response";
import * as claimsService from "./claims.service";
import * as rulesService from "../rules/rules.service";
import * as claimLineDecisionsController from "../claim-line-decisions/claim-line-decisions.controller";
import * as logsController from "../logs/logs.controller";

export const createClaim = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const claim = await claimsService.createClaim(request.body, request.user?.id);
    response.status(201).json(successResponse(claim));
  } catch (error) {
    next(error);
  }
};

export const listClaims = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const result = await claimsService.listClaims(
      request.query.page as string | undefined,
      request.query.pageSize as string | undefined
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

export const getClaim = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const claim = await claimsService.getClaim(String(request.params.claimId));
    response.json(successResponse(claim));
  } catch (error) {
    next(error);
  }
};

export const analyzeClaim = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const result = await rulesService.analyzeClaim(String(request.params.claimId), request.user?.id);
    response.json(successResponse(result));
  } catch (error) {
    next(error);
  }
};

export const setClaimLineDecision = claimLineDecisionsController.setDecision;

export const clearClaimLineDecision = claimLineDecisionsController.clearDecision;

export const getClaimAuditTrail = logsController.getClaimAuditTrail;
