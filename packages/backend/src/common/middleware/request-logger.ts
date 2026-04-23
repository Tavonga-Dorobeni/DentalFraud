import { NextFunction, Request, Response } from "express";
import { logSystemEvent } from "../../modules/logs/logs.service";

export const requestLogger = async (
  request: Request,
  _response: Response,
  next: NextFunction
): Promise<void> => {
  await logSystemEvent({
    action: "HTTP_REQUEST",
    targetEntity: request.path,
    userId: request.user?.id,
    metadata: {
      method: request.method
    }
  });

  next();
};
