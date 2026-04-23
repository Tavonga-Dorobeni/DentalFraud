import { ToothDentitionType } from "@fdcdf/shared";
import { ValidationError } from "../../common/errors/app-error";
import { getDentitionType, isValidFdiToothNumber } from "../../common/utils/fdi";
import * as repository from "./teeth.repository";
import { ToothHistoryEvent } from "./teeth.types";

export const assertValidToothNumber = (toothNumber?: number): ToothDentitionType | undefined => {
  if (toothNumber === undefined) {
    return undefined;
  }

  if (!isValidFdiToothNumber(toothNumber)) {
    throw new ValidationError(`Invalid FDI tooth number: ${toothNumber}`);
  }

  return getDentitionType(toothNumber);
};

export const getToothHistory = async (
  patientId: string,
  toothNumber: number
): Promise<ToothHistoryEvent[]> => {
  return (await repository.listToothHistory(patientId, toothNumber)).map((row) => ({
    id: row.id,
    patientId: row.patient_id,
    toothNumber: row.tooth_number,
    eventType: row.event_type,
    eventDate: row.event_date
  }));
};

export const findChronologyConflict = (
  history: ToothHistoryEvent[],
  dateOfService: string,
  procedureCode: string
): string | undefined => {
  const extracted = history.find(
    (event) => event.eventType === "EXTRACTED" && event.eventDate <= dateOfService
  );

  if (extracted && procedureCode !== "D0210") {
    return `Tooth history shows extraction on ${extracted.eventDate}`;
  }

  const sameProcedure = history.find(
    (event) => event.eventType === procedureCode && event.eventDate === dateOfService
  );

  if (sameProcedure) {
    return `Duplicate same-day procedure history found for tooth ${sameProcedure.toothNumber}`;
  }

  return undefined;
};

export const findRepeatIntervalConflict = (
  history: ToothHistoryEvent[],
  dateOfService: string,
  procedureCode: string,
  minimumDays: number
): string | undefined => {
  const targetDate = new Date(dateOfService);

  const repeatEvent = history.find((event) => {
    if (event.eventType !== procedureCode) {
      return false;
    }

    const eventDate = new Date(event.eventDate);
    const diffDays = (targetDate.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24);

    return diffDays >= 0 && diffDays < minimumDays;
  });

  if (!repeatEvent) {
    return undefined;
  }

  return `Procedure ${procedureCode} repeated within ${minimumDays} days of ${repeatEvent.eventDate}`;
};
