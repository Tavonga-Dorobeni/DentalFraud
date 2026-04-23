import { Knex } from "knex";

const timestamps = (table: Knex.CreateTableBuilder, includeSoftDelete = false) => {
  table.string("created_at").notNullable();
  table.string("updated_at").notNullable();
  if (includeSoftDelete) {
    table.string("deleted_at").nullable();
  }
};

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.string("id").primary();
    table.string("email").notNullable().unique();
    table.string("password_hash").notNullable();
    table.string("role").notNullable();
    timestamps(table);
  });

  await knex.schema.createTable("patients", (table) => {
    table.string("id").primary();
    table.string("external_id").notNullable().unique();
    table.string("name").notNullable();
    table.string("date_of_birth").nullable();
    timestamps(table);
  });

  await knex.schema.createTable("providers", (table) => {
    table.string("id").primary();
    table.string("external_id").notNullable().unique();
    table.string("name").notNullable();
    table.string("specialty").nullable();
    timestamps(table);
  });

  await knex.schema.createTable("claims", (table) => {
    table.string("id").primary();
    table.string("external_claim_id").notNullable().unique();
    table.string("patient_id").notNullable().references("id").inTable("patients");
    table.string("provider_id").notNullable().references("id").inTable("providers");
    table.string("patient_external_id").notNullable();
    table.string("provider_external_id").notNullable();
    table.string("date_of_service").notNullable();
    table.string("submission_date").notNullable();
    table.string("status").notNullable();
    table.text("warnings_json").notNullable();
    table.text("line_signature").notNullable();
    timestamps(table, true);
    table.index(["patient_id"]);
    table.index(["provider_id"]);
  });

  await knex.schema.createTable("claim_lines", (table) => {
    table.string("id").primary();
    table.string("claim_id").notNullable().references("id").inTable("claims").onDelete("CASCADE");
    table.string("procedure_code").notNullable();
    table.decimal("claimed_amount", 12, 2).notNullable();
    table.integer("tooth_number").nullable();
    table.string("documented_procedure_code").nullable();
    table.text("evidence_summary").nullable();
    table.text("chart_notes").nullable();
    table.string("radiograph_reference").nullable();
    table.string("treatment_plan_reference").nullable();
    timestamps(table);
    table.index(["claim_id"]);
  });

  await knex.schema.createTable("tooth_history", (table) => {
    table.string("id").primary();
    table.string("patient_id").notNullable().references("id").inTable("patients").onDelete("CASCADE");
    table.integer("tooth_number").notNullable();
    table.string("event_type").notNullable();
    table.string("event_date").notNullable();
    table.text("notes").nullable();
    table.string("created_at").notNullable();
    table.index(["patient_id", "tooth_number"]);
  });

  await knex.schema.createTable("procedure_catalog", (table) => {
    table.string("id").primary();
    table.string("procedure_code").notNullable().unique();
    table.string("description").notNullable();
    table.string("category").notNullable();
    table.integer("complexity_level").notNullable();
    table.boolean("requires_evidence").notNullable().defaultTo(false);
    table.string("allowed_dentition").notNullable();
    table.string("created_at").notNullable();
  });

  await knex.schema.createTable("config_versions", (table) => {
    table.string("id").primary();
    table.string("version_name").notNullable();
    table.text("snapshot_json").notNullable();
    table.boolean("is_active").notNullable().defaultTo(false);
    table.string("created_at").notNullable();
  });

  await knex.schema.createTable("clinical_rules", (table) => {
    table.string("id").primary();
    table.string("rule_code").notNullable().unique();
    table.string("name").notNullable();
    table.string("severity").notNullable();
    table.boolean("enabled").notNullable().defaultTo(true);
    table.text("parameters_json").notNullable();
    table.string("description").notNullable();
    table.string("version").notNullable();
    table.string("created_at").notNullable();
  });

  await knex.schema.createTable("rule_results", (table) => {
    table.string("id").primary();
    table.string("claim_id").notNullable().references("id").inTable("claims").onDelete("CASCADE");
    table.string("claim_line_id").nullable().references("id").inTable("claim_lines").onDelete("CASCADE");
    table.string("rule_id").notNullable();
    table.string("severity").notNullable();
    table.text("explanation").notNullable();
    table.text("evidence_fields_json").notNullable();
    table.string("executed_at").notNullable();
    table.string("config_version_id").notNullable().references("id").inTable("config_versions");
    table.index(["claim_id"]);
  });

  await knex.schema.createTable("risk_scores", (table) => {
    table.string("id").primary();
    table.string("claim_id").notNullable().references("id").inTable("claims").onDelete("CASCADE");
    table.decimal("score", 5, 2).notNullable();
    table.string("band").notNullable();
    table.decimal("confidence", 4, 2).notNullable();
    table.text("contributing_factors_json").notNullable();
    table.string("config_version_id").notNullable().references("id").inTable("config_versions");
    table.string("created_at").notNullable();
    table.index(["claim_id"]);
  });

  await knex.schema.createTable("alerts", (table) => {
    table.string("id").primary();
    table.string("claim_id").notNullable().references("id").inTable("claims").onDelete("CASCADE");
    table.string("claim_line_id").nullable().references("id").inTable("claim_lines").onDelete("CASCADE");
    table.string("severity").notNullable();
    table.string("status").notNullable();
    table.text("summary").notNullable();
    table.text("recommended_action").notNullable();
    table.string("assigned_user_id").nullable().references("id").inTable("users");
    table.text("triggered_rule_ids_json").notNullable();
    timestamps(table, true);
    table.index(["claim_id"]);
  });

  await knex.schema.createTable("audit_logs", (table) => {
    table.string("id").primary();
    table.string("user_id").nullable().references("id").inTable("users");
    table.string("action").notNullable();
    table.string("target_entity").notNullable();
    table.string("target_entity_id").nullable();
    table.text("metadata_json").notNullable();
    table.string("created_at").notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("audit_logs");
  await knex.schema.dropTableIfExists("alerts");
  await knex.schema.dropTableIfExists("risk_scores");
  await knex.schema.dropTableIfExists("rule_results");
  await knex.schema.dropTableIfExists("clinical_rules");
  await knex.schema.dropTableIfExists("config_versions");
  await knex.schema.dropTableIfExists("procedure_catalog");
  await knex.schema.dropTableIfExists("tooth_history");
  await knex.schema.dropTableIfExists("claim_lines");
  await knex.schema.dropTableIfExists("claims");
  await knex.schema.dropTableIfExists("providers");
  await knex.schema.dropTableIfExists("patients");
  await knex.schema.dropTableIfExists("users");
}
