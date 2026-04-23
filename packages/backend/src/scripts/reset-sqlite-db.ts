import fs from "node:fs";
import path from "node:path";
import knex from "knex";
import { createKnexConfig } from "../common/db/knex";
import { up as upInitialSchema } from "../../migrations/20260409220000_initial_schema";
import { up as upDuplicateMatchColumns } from "../../migrations/20260416090000_add_duplicate_match_columns";
import { up as upClaimLineDecisions } from "../../migrations/20260419090000_add_claim_line_decisions";
import { up as upAuditLogClaimId } from "../../migrations/20260423090000_add_claim_id_to_audit_logs";
import { seed } from "../../seeds/001_seed_mvp";

const main = async () => {
  const config = createKnexConfig();

  if (config.client !== "sqlite3") {
    throw new Error("reset-sqlite-db can only be used with DB_CLIENT=sqlite3");
  }

  const filename = String((config.connection as { filename: string }).filename);

  if (filename !== ":memory:") {
    const resolvedFilename = path.resolve(filename);
    fs.mkdirSync(path.dirname(resolvedFilename), { recursive: true });
    if (fs.existsSync(resolvedFilename)) {
      fs.rmSync(resolvedFilename, { force: true });
    }
    (config.connection as { filename: string }).filename = resolvedFilename;
  }

  const db = knex(config);

  try {
    await db.raw("PRAGMA foreign_keys = ON");
    await upInitialSchema(db);
    await upDuplicateMatchColumns(db);
    await upClaimLineDecisions(db);
    await upAuditLogClaimId(db);
    await seed(db);
    process.stdout.write(`SQLite database reset at ${filename}\n`);
  } finally {
    await db.destroy();
  }
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
