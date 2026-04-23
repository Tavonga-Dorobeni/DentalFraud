import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "@fdcdf/shared";
import { env } from "../config/env";
import { AuthenticationError } from "../errors/app-error";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authMiddleware = (request: Request, _response: Response, next: NextFunction): void => {
  const header = request.header("authorization");

  if (!header?.startsWith("Bearer ")) {
    next(new AuthenticationError());
    return;
  }

  const token = header.replace("Bearer ", "");

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthenticatedUser;
    request.user = payload;
    next();
  } catch {
    next(new AuthenticationError("Invalid access token"));
  }
};
