import { NextFunction, Request, Response } from "express";
import { paginatedResponse, successResponse } from "../../common/utils/api-response";
import * as patientsService from "./patients.service";

export const listPatients = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const result = await patientsService.listPatients(
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

export const getPatient = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const patient = await patientsService.getPatient(String(request.params.patientId));
    response.json(successResponse(patient));
  } catch (error) {
    next(error);
  }
};

export const createPatient = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const patient = await patientsService.createPatient(request.body, request.user?.id);
    response.status(201).json(successResponse(patient));
  } catch (error) {
    next(error);
  }
};

export const updatePatient = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const patient = await patientsService.updatePatient(
      String(request.params.patientId),
      request.body,
      request.user?.id
    );
    response.json(successResponse(patient));
  } catch (error) {
    next(error);
  }
};

export const deletePatient = async (request: Request, response: Response, next: NextFunction) => {
  try {
    await patientsService.deletePatient(String(request.params.patientId), request.user?.id);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
};
