const { desc } = require("drizzle-orm");

const { getDb } = require("../client");
const { generatedPlans, users } = require("../schema");
const { createAdminAuditRepository } = require("./adminAuditRepository");

const auditRepository = createAdminAuditRepository();

function incrementCounter(map, key) {
  if (!key) {
    return;
  }

  map.set(key, (map.get(key) || 0) + 1);
}

function topEntries(map, limit = 5) {
  return [...map.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function createAnalyticsRepository() {
  return {
    async getOverview() {
      const db = getDb();

      if (!db) {
        return {
          totals: {
            totalUsers: 0,
            totalAdmins: 0,
            totalPlans: 0,
            averageMonthlyEstimate: 0,
          },
          mostPopularArchitectures: [],
          mostPopularDeploymentModels: [],
          mostPopularTechnologyComponents: [],
          mostPopularRegions: [],
          mostPopularBusinessTypes: [],
          topStackPatterns: [],
          recentPlanVolume: [],
          recentAdminActivity: [],
        };
      }

      const [planRows, userRows, recentAdminActivity] = await Promise.all([
        db
          .select({
            createdAt: generatedPlans.createdAt,
            recommendationPayload: generatedPlans.recommendationPayload,
            inputPayload: generatedPlans.inputPayload,
            costPayload: generatedPlans.costPayload,
          })
          .from(generatedPlans)
          .orderBy(desc(generatedPlans.createdAt)),
        db
          .select({
            id: users.id,
            role: users.role,
          })
          .from(users),
        auditRepository.listRecentActions(),
      ]);

      const architectureCounts = new Map();
      const deploymentCounts = new Map();
      const componentCounts = new Map();
      const regionCounts = new Map();
      const businessTypeCounts = new Map();
      const stackCounts = new Map();
      const dailyPlanCounts = new Map();

      let monthlyEstimateTotal = 0;
      let monthlyEstimateCount = 0;

      for (const row of planRows) {
        incrementCounter(architectureCounts, row.recommendationPayload?.architectureStyle);
        incrementCounter(deploymentCounts, row.recommendationPayload?.deploymentModel);
        incrementCounter(regionCounts, row.inputPayload?.targetRegion);
        incrementCounter(businessTypeCounts, row.inputPayload?.businessType);

        const components = Array.isArray(row.recommendationPayload?.components)
          ? [...row.recommendationPayload.components].sort()
          : [];

        for (const component of components) {
          incrementCounter(componentCounts, component);
        }

        if (components.length > 0) {
          incrementCounter(stackCounts, components.join(" + "));
        }

        const monthlyEstimate = Number(row.costPayload?.monthlyEstimate);
        if (Number.isFinite(monthlyEstimate)) {
          monthlyEstimateTotal += monthlyEstimate;
          monthlyEstimateCount += 1;
        }

        const createdAt = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
        incrementCounter(dailyPlanCounts, createdAt.toISOString().slice(0, 10));
      }

      return {
        totals: {
          totalUsers: userRows.length,
          totalAdmins: userRows.filter((row) => row.role === "admin").length,
          totalPlans: planRows.length,
          averageMonthlyEstimate:
            monthlyEstimateCount > 0 ? Math.round(monthlyEstimateTotal / monthlyEstimateCount) : 0,
        },
        mostPopularArchitectures: topEntries(architectureCounts),
        mostPopularDeploymentModels: topEntries(deploymentCounts),
        mostPopularTechnologyComponents: topEntries(componentCounts),
        mostPopularRegions: topEntries(regionCounts),
        mostPopularBusinessTypes: topEntries(businessTypeCounts),
        topStackPatterns: topEntries(stackCounts),
        recentPlanVolume: topEntries(dailyPlanCounts, 14).sort((left, right) => left.label.localeCompare(right.label)),
        recentAdminActivity,
      };
    },
  };
}

module.exports = {
  createAnalyticsRepository,
};
