import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";

export const validateRequest =
  (schema: { body?: ZodTypeAny; params?: ZodTypeAny; query?: ZodTypeAny }) =>
  (request: Request, _response: Response, next: NextFunction): void => {
    if (schema.body) {
      request.body = schema.body.parse(request.body);
    }

    if (schema.params) {
      request.params = schema.params.parse(request.params);
    }

    if (schema.query) {
      request.query = schema.query.parse(request.query);
    }

    next();
  };
