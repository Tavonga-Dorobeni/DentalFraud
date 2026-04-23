import { getDb } from "../../common/db/knex";

export const listToothHistory = async (patientId: string, toothNumber: number) => {
  const db = getDb();
  return db("tooth_history")
    .where({ patient_id: patientId, tooth_number: toothNumber })
    .orderBy("event_date", "asc");
};
