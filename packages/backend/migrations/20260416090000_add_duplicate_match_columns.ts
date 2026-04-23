import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("claims", (table) => {
    table.string("duplicate_of_claim_id").nullable().references("id").inTable("claims").onDelete("SET NULL");
  });

  await knex.schema.alterTable("rule_results", (table) => {
    table.string("matched_claim_id").nullable().references("id").inTable("claims").onDelete("SET NULL");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("rule_results", (table) => {
    table.dropColumn("matched_claim_id");
  });

  await knex.schema.alterTable("claims", (table) => {
    table.dropColumn("duplicate_of_claim_id");
  });
}
