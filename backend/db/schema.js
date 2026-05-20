const { pgTable, bigserial, bigint, boolean, text, jsonb, integer, timestamp, index, uniqueIndex } = require("drizzle-orm/pg-core");

const users = pgTable("users", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  auth0Sub: text("auth0_sub").notNull().unique(),
  email: text("email"),
  displayName: text("display_name"),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

const projects = pgTable(
  "projects",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectName: text("project_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userCreatedAtIdx: index("idx_projects_user_created_at").on(table.userId, table.createdAt),
    userProjectNameUniqueIdx: uniqueIndex("uq_projects_user_name").on(table.userId, table.projectName),
  }),
);

const planRuns = pgTable(
  "plan_runs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    projectId: bigint("project_id", { mode: "number" })
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: text("plan_id").notNull().unique(),
    projectNameSnapshot: text("project_name_snapshot").notNull(),
    inputPayload: jsonb("input_payload").notNull(),
    summary: text("summary").notNull(),
    recommendationPayload: jsonb("recommendation_payload").notNull(),
    regionProfilePayload: jsonb("region_profile_payload"),
    roadmapPayload: jsonb("roadmap_payload").notNull(),
    developmentPlanPayload: jsonb("development_plan_payload"),
    costPayload: jsonb("cost_payload").notNull(),
    diagramPayload: jsonb("diagram_payload").notNull(),
    drawioXml: text("drawio_xml").notNull(),
    architectureStyle: text("architecture_style"),
    deploymentModel: text("deployment_model"),
    targetRegion: text("target_region"),
    monthlyEstimate: integer("monthly_estimate"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    createdAtIdx: index("idx_plan_runs_created_at").on(table.createdAt),
    userCreatedAtIdx: index("idx_plan_runs_user_created_at").on(table.userId, table.createdAt),
    projectCreatedAtIdx: index("idx_plan_runs_project_created_at").on(table.projectId, table.createdAt),
    architectureStyleIdx: index("idx_plan_runs_architecture_style").on(table.architectureStyle),
    deploymentModelIdx: index("idx_plan_runs_deployment_model").on(table.deploymentModel),
    targetRegionIdx: index("idx_plan_runs_target_region").on(table.targetRegion),
  }),
);

const planComponents = pgTable(
  "plan_components",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    planRunId: bigint("plan_run_id", { mode: "number" })
      .notNull()
      .references(() => planRuns.id, { onDelete: "cascade" }),
    componentCode: text("component_code").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    planRunIdx: index("idx_plan_components_plan_run_id").on(table.planRunId),
    componentCodeIdx: index("idx_plan_components_component_code").on(table.componentCode),
    runComponentUniqueIdx: uniqueIndex("uq_plan_components_run_component").on(table.planRunId, table.componentCode),
  }),
);

const scenarioSets = pgTable(
  "scenario_sets",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectNameSnapshot: text("project_name_snapshot").notNull(),
    baseInputPayload: jsonb("base_input_payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userCreatedAtIdx: index("idx_scenario_sets_user_created_at").on(table.userId, table.createdAt),
  }),
);

const scenarioRuns = pgTable(
  "scenario_runs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    scenarioSetId: bigint("scenario_set_id", { mode: "number" })
      .notNull()
      .references(() => scenarioSets.id, { onDelete: "cascade" }),
    planRunId: bigint("plan_run_id", { mode: "number" })
      .notNull()
      .references(() => planRuns.id, { onDelete: "cascade" }),
    scenarioKey: text("scenario_key").notNull(),
    scenarioLabel: text("scenario_label").notNull(),
    inputOverridePayload: jsonb("input_override_payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    scenarioSetIdx: index("idx_scenario_runs_scenario_set_id").on(table.scenarioSetId),
    planRunIdx: uniqueIndex("uq_scenario_runs_plan_run_id").on(table.planRunId),
    scenarioSetKeyUniqueIdx: uniqueIndex("uq_scenario_runs_set_key").on(table.scenarioSetId, table.scenarioKey),
  }),
);

const technologyCategories = pgTable(
  "technology_categories",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull().unique(),
    sortOrder: integer("sort_order").notNull().default(100),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sortActiveIdx: index("idx_technology_categories_sort_active").on(table.sortOrder, table.isActive),
  }),
);

const technologies = pgTable(
  "technologies",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    name: text("name").notNull(),
    categoryId: bigint("category_id", { mode: "number" })
      .notNull()
      .references(() => technologyCategories.id, { onDelete: "restrict" }),
    description: text("description"),
    logoUrl: text("logo_url"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    nameUniqueIdx: uniqueIndex("uq_technologies_name").on(table.name),
    categoryActiveIdx: index("idx_technologies_category_active").on(table.categoryId, table.isActive),
  }),
);

const planRunTechnologies = pgTable(
  "plan_run_technologies",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    planRunId: bigint("plan_run_id", { mode: "number" })
      .notNull()
      .references(() => planRuns.id, { onDelete: "cascade" }),
    technologyId: bigint("technology_id", { mode: "number" })
      .notNull()
      .references(() => technologies.id, { onDelete: "restrict" }),
    justification: text("justification"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    planRunIdx: index("idx_plan_run_technologies_plan_run_id").on(table.planRunId),
    technologyIdx: index("idx_plan_run_technologies_technology_id").on(table.technologyId),
    uniquePairIdx: uniqueIndex("uq_plan_run_technology").on(table.planRunId, table.technologyId),
  }),
);

const regionDataCache = pgTable(
  "region_data_cache",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    regionCode: text("region_code").notNull(),
    sourceName: text("source_name").notNull(),
    payload: jsonb("payload").notNull(),
    refreshedAt: timestamp("refreshed_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (table) => ({
    regionSourceUniqueIdx: uniqueIndex("uq_region_data_cache_region_source").on(table.regionCode, table.sourceName),
    regionCodeIdx: index("idx_region_data_cache_region_code").on(table.regionCode),
    expiresAtIdx: index("idx_region_data_cache_expires_at").on(table.expiresAt),
  }),
);

const engineSettings = pgTable("engine_settings", {
  key: text("key").primaryKey(),
  valueJson: jsonb("value_json").notNull(),
  updatedBy: bigint("updated_by", { mode: "number" }).references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

const adminAuditLog = pgTable(
  "admin_audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    actorUserId: bigint("actor_user_id", { mode: "number" }).references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    detailsJson: jsonb("details_json"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    createdAtIdx: index("idx_admin_audit_log_created_at").on(table.createdAt),
  }),
);

module.exports = {
  adminAuditLog,
  engineSettings,
  planComponents,
  planRunTechnologies,
  planRuns,
  projects,
  regionDataCache,
  scenarioRuns,
  scenarioSets,
  technologyCategories,
  technologies,
  users,
};
