const { desc } = require("drizzle-orm");

const { getDb } = require("../client");
const { generatedPlans } = require("../schema");

function createPlanRepository() {
  return {
    async saveGeneratedPlan(plan) {
      const db = getDb();

      if (!db) {
        return {
          persisted: false,
          reason: "DATABASE_URL is not configured; plan was generated but not stored.",
        };
      }

      const [row] = await db
        .insert(generatedPlans)
        .values({
          planId: plan.planId,
          projectName: plan.input.projectName,
          inputPayload: plan.input,
          summary: plan.summary,
          recommendationPayload: plan.recommendation,
          roadmapPayload: plan.roadmap,
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

    async listRecentPlans() {
      const db = getDb();

      if (!db) {
        return [];
      }

      return db
        .select({
          id: generatedPlans.id,
          planId: generatedPlans.planId,
          projectName: generatedPlans.projectName,
          summary: generatedPlans.summary,
          createdAt: generatedPlans.createdAt,
        })
        .from(generatedPlans)
        .orderBy(desc(generatedPlans.createdAt))
        .limit(10);
    },
  };
}

module.exports = {
  createPlanRepository,
};
