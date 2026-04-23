import knex, { Knex } from "knex";
import { env } from "../config/env";

let dbInstance: Knex | null = null;

export const createKnexConfig = (): Knex.Config => {
  if (env.DB_CLIENT === "sqlite3") {
    return {
      client: "sqlite3",
      connection: {
        filename: env.SQLITE_FILENAME
      },
      useNullAsDefault: true
    };
  }

  return {
    client: "mysql2",
    connection: {
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME
    },
    pool: {
      min: 0,
      max: 10
    }
  };
};

export const getDb = (): Knex => {
  if (!dbInstance) {
    dbInstance = knex(createKnexConfig());
  }

  return dbInstance;
};

export const setDb = (db: Knex): void => {
  dbInstance = db;
};

export const resetDb = async (): Promise<void> => {
  if (dbInstance) {
    await dbInstance.destroy();
    dbInstance = null;
  }
};
