import { NextFunction, Request, Response } from "express";
import { successResponse } from "../../common/utils/api-response";
import * as service from "./claim-line-decisions.service";

export const setDecision = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const decision = await service.setDecision(
      String(request.params.claimId),
      String(request.params.lineId),
      request.body,
      request.user!.id
    );
    response.json(successResponse(decision));
  } catch (error) {
    next(error);
  }
};

export const clearDecision = async (request: Request, response: Response, next: NextFunction) => {
  try {
    await service.clearDecision(String(request.params.claimId), String(request.params.lineId), request.user!.id);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
};
