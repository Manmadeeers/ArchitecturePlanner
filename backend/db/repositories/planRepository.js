const { and, desc, eq, inArray, sql } = require("drizzle-orm");

const { DEFAULT_DEVELOPMENT_PLAN } = require("../../engine/planEngine");
const { getRegionProfile } = require("../../engine/regionCatalog");
const { buildDiagram, buildDrawioXml } = require("../../engine/diagramBuilder");
const { getDb } = require("../client");
const { createTechnologyRepository } = require("./technologyRepository");
const { planComponents, planRuns, projects, scenarioRuns, scenarioSets } = require("../schema");

const MAX_LIST_LIMIT = 100;
const technologyRepository = createTechnologyRepository();

function toPlanSummary(row) {
  return {
    entryType: "plan",
    entryId: row.planId,
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

function toScenarioSetSummary(row) {
  return {
    entryType: "scenario_set",
    entryId: String(row.id),
    id: row.id,
    projectName: row.projectNameSnapshot,
    summary: `Scenario Simulator run with ${row.scenarioCount} scenario${row.scenarioCount === 1 ? "" : "s"}.`,
    scenarioCount: row.scenarioCount,
    baselinePlanId: row.baselinePlanId || null,
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

function normalizeIdentifierNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
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

      const selectedTechnologies = await technologyRepository.selectTechnologiesForPlan(plan);
      const planWithTechnologies = {
        ...plan,
        technologies: selectedTechnologies,
      };
      planWithTechnologies.diagram = buildDiagram(planWithTechnologies);
      planWithTechnologies.drawioXml = buildDrawioXml(planWithTechnologies);

      const [runRow] = await db
        .insert(planRuns)
        .values({
          projectId: projectRow.id,
          userId,
          planId: planWithTechnologies.planId,
          projectNameSnapshot: projectName,
          inputPayload: planWithTechnologies.input,
          summary: planWithTechnologies.summary,
          recommendationPayload: planWithTechnologies.recommendation,
          regionProfilePayload: planWithTechnologies.regionProfile,
          roadmapPayload: planWithTechnologies.roadmap,
          developmentPlanPayload: planWithTechnologies.developmentPlan,
          costPayload: planWithTechnologies.cost,
          diagramPayload: planWithTechnologies.diagram,
          drawioXml: planWithTechnologies.drawioXml,
          architectureStyle: planWithTechnologies.recommendation?.architectureStyle || null,
          deploymentModel: planWithTechnologies.recommendation?.deploymentModel || null,
          targetRegion: planWithTechnologies.input?.targetRegion || null,
          monthlyEstimate: extractMonthlyEstimate(planWithTechnologies),
        })
        .returning({
          id: planRuns.id,
          createdAt: planRuns.createdAt,
        });

      await technologyRepository.attachTechnologiesToPlanRun(runRow.id, selectedTechnologies);

      const components = uniqueRecommendationComponents(planWithTechnologies);
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

      let planQuery = db
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
        .where(
          and(
            eq(planRuns.userId, userId),
            sql`not exists (select 1 from ${scenarioRuns} where ${scenarioRuns.planRunId} = ${planRuns.id})`,
          ),
        )
        .orderBy(desc(planRuns.createdAt))
        .limit(MAX_LIST_LIMIT);

      let scenarioSetQuery = db
        .select({
          id: scenarioSets.id,
          projectNameSnapshot: scenarioSets.projectNameSnapshot,
          createdAt: scenarioSets.createdAt,
          scenarioCount: sql`count(${scenarioRuns.id})`.mapWith(Number),
          baselinePlanId: sql`max(case when ${scenarioRuns.scenarioKey} = 'baseline' then ${planRuns.planId} end)`,
        })
        .from(scenarioSets)
        .leftJoin(scenarioRuns, eq(scenarioRuns.scenarioSetId, scenarioSets.id))
        .leftJoin(planRuns, eq(planRuns.id, scenarioRuns.planRunId))
        .where(eq(scenarioSets.userId, userId))
        .groupBy(scenarioSets.id)
        .orderBy(desc(scenarioSets.createdAt))
        .limit(MAX_LIST_LIMIT);

      const [planRows, scenarioSetRows] = await Promise.all([planQuery, scenarioSetQuery]);
      const merged = [...planRows.map(toPlanSummary), ...scenarioSetRows.map(toScenarioSetSummary)]
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

      if (limit === null) {
        return merged.slice(offset);
      }

      return merged.slice(offset, offset + limit);
    },

    async listRecentPlans(userId) {
      const db = getDb();

      if (!db || !userId) {
        return [];
      }

      const rows = await db
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
        .where(
          and(
            eq(planRuns.userId, userId),
            sql`not exists (select 1 from ${scenarioRuns} where ${scenarioRuns.planRunId} = ${planRuns.id})`,
          ),
        )
        .orderBy(desc(planRuns.createdAt))
        .limit(10);

      return rows.map(toPlanSummary);
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

    async getUserScenarioSetById(userId, scenarioSetId) {
      const db = getDb();
      const normalizedScenarioSetId = normalizeIdentifierNumber(scenarioSetId);

      if (!db || !userId || !normalizedScenarioSetId) {
        return null;
      }

      const [scenarioSetRow] = await db
        .select({
          id: scenarioSets.id,
          projectNameSnapshot: scenarioSets.projectNameSnapshot,
          baseInputPayload: scenarioSets.baseInputPayload,
          createdAt: scenarioSets.createdAt,
        })
        .from(scenarioSets)
        .where(and(eq(scenarioSets.id, normalizedScenarioSetId), eq(scenarioSets.userId, userId)))
        .limit(1);

      if (!scenarioSetRow) {
        return null;
      }

      const scenarioRows = await db
        .select({
          scenarioKey: scenarioRuns.scenarioKey,
          scenarioLabel: scenarioRuns.scenarioLabel,
          inputOverridePayload: scenarioRuns.inputOverridePayload,
          planRunId: planRuns.id,
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
        .from(scenarioRuns)
        .innerJoin(planRuns, eq(planRuns.id, scenarioRuns.planRunId))
        .where(eq(scenarioRuns.scenarioSetId, scenarioSetRow.id))
        .orderBy(scenarioRuns.createdAt);

      if (scenarioRows.length === 0) {
        return {
          scenarioSet: scenarioSetRow,
          scenarios: [],
        };
      }

      const technologiesByRunId = await technologyRepository.listTechnologiesForPlanRunIds(
        scenarioRows.map((row) => row.planRunId),
      );

      return {
        scenarioSet: scenarioSetRow,
        scenarios: scenarioRows.map((row) => ({
          scenarioKey: row.scenarioKey,
          scenarioLabel: row.scenarioLabel,
          inputOverrides: row.inputOverridePayload || {},
          plan: toStoredPlan(row, technologiesByRunId.get(row.planRunId) || []),
        })),
      };
    },

    async deleteUserScenarioSetById(userId, scenarioSetId) {
      const db = getDb();
      const normalizedScenarioSetId = normalizeIdentifierNumber(scenarioSetId);

      if (!db || !userId || !normalizedScenarioSetId) {
        return null;
      }

      const [scenarioSetRow] = await db
        .select({
          id: scenarioSets.id,
          projectNameSnapshot: scenarioSets.projectNameSnapshot,
        })
        .from(scenarioSets)
        .where(and(eq(scenarioSets.id, normalizedScenarioSetId), eq(scenarioSets.userId, userId)))
        .limit(1);

      if (!scenarioSetRow) {
        return null;
      }

      const scenarioRunRows = await db
        .select({
          planRunId: scenarioRuns.planRunId,
          projectId: planRuns.projectId,
        })
        .from(scenarioRuns)
        .innerJoin(planRuns, eq(planRuns.id, scenarioRuns.planRunId))
        .where(eq(scenarioRuns.scenarioSetId, scenarioSetRow.id));

      const scenarioPlanRunIds = scenarioRunRows.map((row) => row.planRunId);
      const affectedProjectIds = [...new Set(scenarioRunRows.map((row) => row.projectId).filter(Boolean))];

      await db.delete(scenarioSets).where(eq(scenarioSets.id, scenarioSetRow.id));

      if (scenarioPlanRunIds.length > 0) {
        await db
          .delete(planRuns)
          .where(and(eq(planRuns.userId, userId), inArray(planRuns.id, scenarioPlanRunIds)));

        for (const projectId of affectedProjectIds) {
          const [remainingRuns] = await db
            .select({
              count: sql`count(*)`.mapWith(Number),
            })
            .from(planRuns)
            .where(eq(planRuns.projectId, projectId));

          if ((remainingRuns?.count || 0) === 0) {
            await db.delete(projects).where(eq(projects.id, projectId));
          }
        }
      }

      return {
        id: scenarioSetRow.id,
        projectName: scenarioSetRow.projectNameSnapshot,
      };
    },

    async saveScenarioSet(userId, projectNameSnapshot, baseInputPayload, scenarioEntries = []) {
      const db = getDb();

      if (!db) {
        return null;
      }

      if (!userId || !Array.isArray(scenarioEntries) || scenarioEntries.length === 0) {
        return null;
      }

      const [scenarioSetRow] = await db
        .insert(scenarioSets)
        .values({
          userId,
          projectNameSnapshot: normalizeProjectName(projectNameSnapshot),
          baseInputPayload: baseInputPayload || {},
        })
        .returning({
          id: scenarioSets.id,
          createdAt: scenarioSets.createdAt,
        });

      await db
        .insert(scenarioRuns)
        .values(
          scenarioEntries.map((entry) => ({
            scenarioSetId: scenarioSetRow.id,
            planRunId: entry.planRunId,
            scenarioKey: String(entry.scenarioKey || ""),
            scenarioLabel: String(entry.scenarioLabel || ""),
            inputOverridePayload: entry.inputOverridePayload || {},
          })),
        )
        .onConflictDoNothing();

      return {
        id: scenarioSetRow.id,
        createdAt: scenarioSetRow.createdAt,
      };
    },
  };
}

module.exports = {
  createPlanRepository,
};
