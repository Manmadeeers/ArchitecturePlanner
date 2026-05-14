const { and, desc, eq, sql } = require("drizzle-orm");

const { DEFAULT_DEVELOPMENT_PLAN } = require("../../engine/planEngine");
const { getRegionProfile } = require("../../engine/regionCatalog");
const { getDb } = require("../client");
const { createTechnologyRepository } = require("./technologyRepository");
const { planComponents, planRuns, projects } = require("../schema");

const MAX_LIST_LIMIT = 100;
const technologyRepository = createTechnologyRepository();

function toPlanSummary(row) {
  return {
    id: row.id,
    planId: row.planId,
    projectName: row.projectNameSnapshot,
    summary: row.summary,
    architectureStyle: row.architectureStyle || row.recommendationPayload?.architectureStyle || null,
    deploymentModel: row.deploymentModel || row.recommendationPayload?.deploymentModel || null,
    targetRegion: row.targetRegion || row.inputPayload?.targetRegion || null,
    monthlyEstimate: row.monthlyEstimate ?? row.costPayload?.monthlyEstimate ?? null,
    createdAt: row.createdAt,
  };
}

function toStoredPlan(row, technologies = []) {
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
    technologies,
  };
}

function normalizeListNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function normalizeProjectName(value) {
  const normalized = String(value || "").trim();
  return normalized || "Untitled project";
}

function extractMonthlyEstimate(plan) {
  const monthlyEstimate = Number(plan?.cost?.monthlyEstimate);
  return Number.isFinite(monthlyEstimate) ? Math.round(monthlyEstimate) : null;
}

function uniqueRecommendationComponents(plan) {
  if (!Array.isArray(plan?.recommendation?.components)) {
    return [];
  }

  return [...new Set(plan.recommendation.components.map(String).map((value) => value.trim()).filter(Boolean))];
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

      const projectName = normalizeProjectName(plan?.input?.projectName);

      const [projectRow] = await db
        .insert(projects)
        .values({
          userId,
          projectName,
        })
        .onConflictDoUpdate({
          target: [projects.userId, projects.projectName],
          set: {
            updatedAt: new Date(),
          },
        })
        .returning({
          id: projects.id,
        });

      const [runRow] = await db
        .insert(planRuns)
        .values({
          projectId: projectRow.id,
          userId,
          planId: plan.planId,
          projectNameSnapshot: projectName,
          inputPayload: plan.input,
          summary: plan.summary,
          recommendationPayload: plan.recommendation,
          regionProfilePayload: plan.regionProfile,
          roadmapPayload: plan.roadmap,
          developmentPlanPayload: plan.developmentPlan,
          costPayload: plan.cost,
          diagramPayload: plan.diagram,
          drawioXml: plan.drawioXml,
          architectureStyle: plan.recommendation?.architectureStyle || null,
          deploymentModel: plan.recommendation?.deploymentModel || null,
          targetRegion: plan.input?.targetRegion || null,
          monthlyEstimate: extractMonthlyEstimate(plan),
        })
        .returning({
          id: planRuns.id,
          createdAt: planRuns.createdAt,
        });

      const selectedTechnologies = await technologyRepository.selectTechnologiesForPlan(plan);
      await technologyRepository.attachTechnologiesToPlanRun(runRow.id, selectedTechnologies);

      const components = uniqueRecommendationComponents(plan);
      if (components.length > 0) {
        await db
          .insert(planComponents)
          .values(
            components.map((componentCode) => ({
              planRunId: runRow.id,
              componentCode,
            })),
          )
          .onConflictDoNothing();
      }

      return {
        persisted: true,
        id: runRow.id,
        createdAt: runRow.createdAt,
        technologies: selectedTechnologies,
      };
    },

    async listUserPlans(userId, options = {}) {
      const db = getDb();
      const parsedLimit = normalizeListNumber(options.limit);
      const parsedOffset = normalizeListNumber(options.offset);
      const limit = parsedLimit === null ? null : Math.min(parsedLimit, MAX_LIST_LIMIT);
      const offset = parsedOffset || 0;

      if (!db || !userId) {
        return [];
      }

      let query = db
        .select({
          id: planRuns.id,
          planId: planRuns.planId,
          projectNameSnapshot: planRuns.projectNameSnapshot,
          summary: planRuns.summary,
          inputPayload: planRuns.inputPayload,
          recommendationPayload: planRuns.recommendationPayload,
          costPayload: planRuns.costPayload,
          architectureStyle: planRuns.architectureStyle,
          deploymentModel: planRuns.deploymentModel,
          targetRegion: planRuns.targetRegion,
          monthlyEstimate: planRuns.monthlyEstimate,
          createdAt: planRuns.createdAt,
        })
        .from(planRuns)
        .where(eq(planRuns.userId, userId))
        .orderBy(desc(planRuns.createdAt))
        .offset(offset);

      if (limit !== null) {
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
          id: planRuns.id,
          planId: planRuns.planId,
          inputPayload: planRuns.inputPayload,
          summary: planRuns.summary,
          recommendationPayload: planRuns.recommendationPayload,
          regionProfilePayload: planRuns.regionProfilePayload,
          roadmapPayload: planRuns.roadmapPayload,
          developmentPlanPayload: planRuns.developmentPlanPayload,
          costPayload: planRuns.costPayload,
          diagramPayload: planRuns.diagramPayload,
          drawioXml: planRuns.drawioXml,
          createdAt: planRuns.createdAt,
        })
        .from(planRuns)
        .where(and(eq(planRuns.userId, userId), eq(planRuns.planId, planId)))
        .limit(1);

      if (!row) {
        return null;
      }

      const technologiesByRunId = await technologyRepository.listTechnologiesForPlanRunIds([row.id]);

      return {
        id: row.id,
        createdAt: row.createdAt,
        plan: toStoredPlan(row, technologiesByRunId.get(row.id) || []),
      };
    },

    async deleteUserPlanByPlanId(userId, planId) {
      const db = getDb();

      if (!db || !userId || !planId) {
        return null;
      }

      const [row] = await db
        .delete(planRuns)
        .where(and(eq(planRuns.userId, userId), eq(planRuns.planId, planId)))
        .returning({
          id: planRuns.id,
          planId: planRuns.planId,
          projectId: planRuns.projectId,
          projectNameSnapshot: planRuns.projectNameSnapshot,
        });

      if (!row) {
        return null;
      }

      const [remainingRuns] = await db
        .select({
          count: sql`count(*)`.mapWith(Number),
        })
        .from(planRuns)
        .where(eq(planRuns.projectId, row.projectId));

      if ((remainingRuns?.count || 0) === 0) {
        await db.delete(projects).where(eq(projects.id, row.projectId));
      }

      return {
        id: row.id,
        planId: row.planId,
        projectName: row.projectNameSnapshot,
      };
    },
  };
}

module.exports = {
  createPlanRepository,
};
