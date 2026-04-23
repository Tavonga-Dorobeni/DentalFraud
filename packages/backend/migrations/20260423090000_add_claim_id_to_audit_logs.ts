import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("audit_logs", (table) => {
    table.string("claim_id").nullable().references("id").inTable("claims").onDelete("SET NULL");
    table.index(["claim_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("audit_logs", (table) => {
    table.dropColumn("claim_id");
  });
}
