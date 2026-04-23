import { NextFunction, Request, Response } from "express";
import { paginatedResponse, successResponse } from "../../common/utils/api-response";
import * as providersService from "./providers.service";

export const listProviders = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const result = await providersService.listProviders(
      request.query.page as string | undefined,
      request.query.pageSize as string | undefined,
      request.query.search as string | undefined
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

export const getProvider = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const provider = await providersService.getProvider(String(request.params.providerId));
    response.json(successResponse(provider));
  } catch (error) {
    next(error);
  }
};

export const createProvider = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const provider = await providersService.createProvider(request.body, request.user?.id);
    response.status(201).json(successResponse(provider));
  } catch (error) {
    next(error);
  }
};

export const updateProvider = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const provider = await providersService.updateProvider(
      String(request.params.providerId),
      request.body,
      request.user?.id
    );
    response.json(successResponse(provider));
  } catch (error) {
    next(error);
  }
};

export const deleteProvider = async (request: Request, response: Response, next: NextFunction) => {
  try {
    await providersService.deleteProvider(String(request.params.providerId), request.user?.id);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
};
