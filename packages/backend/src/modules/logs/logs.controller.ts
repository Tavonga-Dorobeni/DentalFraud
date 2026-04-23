import { NextFunction, Request, Response } from "express";
import { successResponse } from "../../common/utils/api-response";
import { getClaimAuditTrail as getClaimAuditTrailService } from "./logs.service";

export const getClaimAuditTrail = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const result = await getClaimAuditTrailService(String(request.params.claimId));
    response.json(successResponse(result));
  } catch (error) {
    next(error);
  }
};
