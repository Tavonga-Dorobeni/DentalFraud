import { NextFunction, Request, Response } from "express";

const allowedOrigins = new Set([
  "http://localhost:5173",
  "https://fdcdf.netlify.app"
]);

const allowedHeaders = "Authorization, Content-Type";
const allowedMethods = "GET,POST,PUT,DELETE,OPTIONS";

export const corsMiddleware = (request: Request, response: Response, next: NextFunction): void => {
  const origin = request.headers.origin;

  if (!origin || !allowedOrigins.has(origin)) {
    if (request.method === "OPTIONS") {
      response.status(204).end();
      return;
    }

    next();
    return;
  }

  response.header("Vary", "Origin");
  response.header("Access-Control-Allow-Origin", origin);
  response.header("Access-Control-Allow-Methods", allowedMethods);
  response.header("Access-Control-Allow-Headers", allowedHeaders);

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  next();
};
