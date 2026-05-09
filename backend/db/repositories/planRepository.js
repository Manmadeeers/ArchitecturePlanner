const { and, desc, eq } = require("drizzle-orm");

const { DEFAULT_DEVELOPMENT_PLAN } = require("../../engine/planEngine");
const { getRegionProfile } = require("../../engine/regionCatalog");
const { getDb } = require("../client");
const { generatedPlans } = require("../schema");

function toPlanSummary(row) {
  return {
    id: row.id,
    planId: row.planId,
    projectName: row.projectName,
    summary: row.summary,
    architectureStyle: row.recommendationPayload?.architectureStyle || null,
    deploymentModel: row.recommendationPayload?.deploymentModel || null,
    targetRegion: row.inputPayload?.targetRegion || null,
    monthlyEstimate: row.costPayload?.monthlyEstimate || null,
    createdAt: row.createdAt,
  };
}

function toStoredPlan(row) {
  return {
    planId: row.planId,
    input: row.inputPayload,
    summary: row.summary,
    recommendation: row.recommendationPayload,
    regionProfile: row.regionProfilePayload || getRegionProfile(row.inputPayload?.targetRegion),
    cost: row.costPayload,
    roadmap: row.roadmapPayload,
    developmentPlan: row.developmentPlanPayload || DEFAULT_DEVELOPMENT_PLAN,
    generatedAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    diagram: row.diagramPayload,
    drawioXml: row.drawioXml,
  };
}

function createPlanRepository() {
  return {
    async saveGeneratedPlan(userId, plan) {
      const db = getDb();

      if (!db) {
        return {
          persisted: false,
          reason: "DATABASE_URL is not configured; plan was generated but not stored.",
        };
      }

      if (!userId) {
        return {
          persisted: false,
          reason: "The authenticated user could not be linked to the generated plan.",
        };
      }

      const [row] = await db
        .insert(generatedPlans)
        .values({
          userId,
          planId: plan.planId,
          projectName: plan.input.projectName,
          inputPayload: plan.input,
          summary: plan.summary,
          recommendationPayload: plan.recommendation,
          regionProfilePayload: plan.regionProfile,
          roadmapPayload: plan.roadmap,
          developmentPlanPayload: plan.developmentPlan,
          costPayload: plan.cost,
          diagramPayload: plan.diagram,
          drawioXml: plan.drawioXml,
        })
        .returning({
          id: generatedPlans.id,
          createdAt: generatedPlans.createdAt,
        });

      return {
        persisted: true,
        id: row.id,
        createdAt: row.createdAt,
      };
    },

    async listUserPlans(userId, options = {}) {
      const db = getDb();
      const limit = Number.isFinite(options.limit) ? options.limit : null;

      if (!db || !userId) {
        return [];
      }

      let query = db
        .select({
          id: generatedPlans.id,
          planId: generatedPlans.planId,
          projectName: generatedPlans.projectName,
          summary: generatedPlans.summary,
          inputPayload: generatedPlans.inputPayload,
          recommendationPayload: generatedPlans.recommendationPayload,
          costPayload: generatedPlans.costPayload,
          createdAt: generatedPlans.createdAt,
        })
        .from(generatedPlans)
        .where(eq(generatedPlans.userId, userId))
        .orderBy(desc(generatedPlans.createdAt));

      if (limit) {
        query = query.limit(limit);
      }

      const rows = await query;
      return rows.map(toPlanSummary);
    },

    async listRecentPlans(userId) {
      return this.listUserPlans(userId, { limit: 10 });
    },

    async getUserPlanByPlanId(userId, planId) {
      const db = getDb();

      if (!db || !userId || !planId) {
        return null;
      }

      const [row] = await db
        .select({
          id: generatedPlans.id,
          planId: generatedPlans.planId,
          projectName: generatedPlans.projectName,
          inputPayload: generatedPlans.inputPayload,
          summary: generatedPlans.summary,
          recommendationPayload: generatedPlans.recommendationPayload,
          regionProfilePayload: generatedPlans.regionProfilePayload,
          roadmapPayload: generatedPlans.roadmapPayload,
          developmentPlanPayload: generatedPlans.developmentPlanPayload,
          costPayload: generatedPlans.costPayload,
          diagramPayload: generatedPlans.diagramPayload,
          drawioXml: generatedPlans.drawioXml,
          createdAt: generatedPlans.createdAt,
        })
        .from(generatedPlans)
        .where(and(eq(generatedPlans.userId, userId), eq(generatedPlans.planId, planId)))
        .limit(1);

      if (!row) {
        return null;
      }

      return {
        id: row.id,
        createdAt: row.createdAt,
        plan: toStoredPlan(row),
      };
    },
  };
}

module.exports = {
  createPlanRepository,
};
