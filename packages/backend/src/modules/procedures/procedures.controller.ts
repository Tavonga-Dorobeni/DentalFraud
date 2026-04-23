import { NextFunction, Request, Response } from "express";
import { paginatedResponse, successResponse } from "../../common/utils/api-response";
import * as proceduresService from "./procedures.service";

export const listProcedures = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const result = await proceduresService.listProcedures(
      request.query.page as string | undefined,
      request.query.pageSize as string | undefined,
      request.query.search as string | undefined,
      request.query.category as string | undefined
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

export const getProcedure = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const procedure = await proceduresService.getProcedure(String(request.params.procedureId));
    response.json(successResponse(procedure));
  } catch (error) {
    next(error);
  }
};

export const createProcedure = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const procedure = await proceduresService.createProcedure(request.body, request.user?.id);
    response.status(201).json(successResponse(procedure));
  } catch (error) {
    next(error);
  }
};

export const updateProcedure = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const procedure = await proceduresService.updateProcedure(
      String(request.params.procedureId),
      request.body,
      request.user?.id
    );
    response.json(successResponse(procedure));
  } catch (error) {
    next(error);
  }
};

export const deleteProcedure = async (request: Request, response: Response, next: NextFunction) => {
  try {
    await proceduresService.deleteProcedure(String(request.params.procedureId), request.user?.id);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
};
