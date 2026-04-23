import { NextFunction, Request, Response } from "express";
import { UserRole } from "@fdcdf/shared";
import { AuthorizationError, AuthenticationError } from "../errors/app-error";

export const authorize =
  (roles: UserRole[]) =>
  (request: Request, _response: Response, next: NextFunction): void => {
    if (!request.user) {
      next(new AuthenticationError());
      return;
    }

    if (!roles.includes(request.user.role)) {
      next(new AuthorizationError());
      return;
    }

    next();
  };
