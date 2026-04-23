import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("claim_line_decisions", (table) => {
    table.string("id").primary();
    table.string("claim_id").notNullable().references("id").inTable("claims").onDelete("CASCADE");
    table
      .string("claim_line_id")
      .notNullable()
      .unique()
      .references("id")
      .inTable("claim_lines")
      .onDelete("CASCADE");
    table.string("decision").notNullable();
    table.text("note").nullable();
    table.string("decided_by_user_id").notNullable().references("id").inTable("users");
    table.string("decided_at").notNullable();
    table.index(["claim_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("claim_line_decisions");
}
