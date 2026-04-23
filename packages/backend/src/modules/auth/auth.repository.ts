import { getDb } from "../../common/db/knex";

export const findUserByEmail = async (email: string) => {
  const db = getDb();
  return db("users").where({ email }).first();
};
