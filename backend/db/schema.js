const { pgTable, bigserial, bigint, text, jsonb, timestamp, index } = require("drizzle-orm/pg-core");

const users = pgTable("users", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  auth0Sub: text("auth0_sub").notNull().unique(),
  email: text("email"),
  displayName: text("display_name"),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

const generatedPlans = pgTable(
  "generated_plans",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("user_id", { mode: "number" }).references(() => users.id, { onDelete: "cascade" }),
    planId: text("plan_id").notNull().unique(),
    projectName: text("project_name").notNull(),
    inputPayload: jsonb("input_payload").notNull(),
    summary: text("summary").notNull(),
    recommendationPayload: jsonb("recommendation_payload").notNull(),
    regionProfilePayload: jsonb("region_profile_payload"),
    roadmapPayload: jsonb("roadmap_payload").notNull(),
    developmentPlanPayload: jsonb("development_plan_payload"),
    costPayload: jsonb("cost_payload").notNull(),
    diagramPayload: jsonb("diagram_payload").notNull(),
    drawioXml: text("drawio_xml").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    createdAtIdx: index("idx_generated_plans_created_at").on(table.createdAt),
    userCreatedAtIdx: index("idx_generated_plans_user_created_at").on(table.userId, table.createdAt),
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
  },
  (table) => ({
    regionCodeIdx: index("idx_region_data_cache_region_code").on(table.regionCode),
  }),
);

module.exports = {
  generatedPlans,
  regionDataCache,
  users,
};
