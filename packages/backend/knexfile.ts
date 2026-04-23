import type { Knex } from "knex";
import { createKnexConfig } from "./src/common/db/knex";

const config: Knex.Config = {
  ...createKnexConfig(),
  migrations: {
    directory: "./migrations"
  },
  seeds: {
    directory: "./seeds"
  }
};

export default config;
