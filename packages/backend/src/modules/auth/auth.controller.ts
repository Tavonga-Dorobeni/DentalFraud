import { NextFunction, Request, Response } from "express";
import { successResponse } from "../../common/utils/api-response";
import * as authService from "./auth.service";

export const login = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const tokens = await authService.login(request.body);
    response.json(successResponse(tokens));
  } catch (error) {
    next(error);
  }
};

export const refresh = (request: Request, response: Response, next: NextFunction) => {
  try {
    const tokens = authService.refresh(request.body.refreshToken);
    response.json(successResponse(tokens));
  } catch (error) {
    next(error);
  }
};
