import { getDb } from "./knex";
import { env } from "../config/env";
import { up as upInitialSchema } from "../../../migrations/20260409220000_initial_schema";
import { up as upDuplicateMatchColumns } from "../../../migrations/20260416090000_add_duplicate_match_columns";
import { up as upClaimLineDecisions } from "../../../migrations/20260419090000_add_claim_line_decisions";
import { up as upAuditLogClaimId } from "../../../migrations/20260423090000_add_claim_id_to_audit_logs";
import { seed } from "../../../seeds/001_seed_mvp";

export const bootstrapDatabase = async (): Promise<void> => {
  if (!env.AUTO_INIT_DB || env.DB_CLIENT !== "sqlite3") {
    return;
  }

  const db = getDb();
  await db.raw("PRAGMA foreign_keys = ON");
  await upInitialSchema(db);
  await upDuplicateMatchColumns(db);
  await upClaimLineDecisions(db);
  await upAuditLogClaimId(db);
  await seed(db);
};
