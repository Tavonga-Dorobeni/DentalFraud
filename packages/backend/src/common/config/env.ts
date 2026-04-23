import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  AUTO_INIT_DB: z
    .union([z.boolean(), z.string()])
    .transform((value) => value === true || value === "true")
    .default(false),
  JWT_SECRET: z.string().default("fdcdf-dev-secret"),
  JWT_REFRESH_SECRET: z.string().default("fdcdf-dev-refresh-secret"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("7d"),
  DB_CLIENT: z.enum(["mysql2", "sqlite3"]).default("mysql2"),
  DB_HOST: z.string().default("127.0.0.1"),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().default("root"),
  DB_PASSWORD: z.string().default(""),
  DB_NAME: z.string().default("fdcdf"),
  SQLITE_FILENAME: z.string().default(":memory:")
});

export const env = envSchema.parse(process.env);
