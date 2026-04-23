import knex from "knex";
import { getDb, setDb, resetDb } from "../src/common/db/knex";
import { up, down } from "../migrations/20260409220000_initial_schema";
import { up as upDuplicateColumns } from "../migrations/20260416090000_add_duplicate_match_columns";
import { up as upClaimLineDecisions } from "../migrations/20260419090000_add_claim_line_decisions";
import { up as upAuditLogClaimId } from "../migrations/20260423090000_add_claim_id_to_audit_logs";
import { seed } from "../seeds/001_seed_mvp";

export const createTestDb = async () => {
  const db = knex({
    client: "sqlite3",
    connection: {
      filename: ":memory:"
    },
    useNullAsDefault: true
  });

  setDb(db);
  await up(db);
  await upDuplicateColumns(db);
  await upClaimLineDecisions(db);
  await upAuditLogClaimId(db);
  await seed(db);

  return db;
};

export const destroyTestDb = async () => {
  await resetDb();
};
