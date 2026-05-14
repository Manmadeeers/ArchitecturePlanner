const { desc, sql } = require("drizzle-orm");

const { getDb } = require("../client");
const { planComponents, planRunTechnologies, planRuns, technologies, users } = require("../schema");
const { createAdminAuditRepository } = require("./adminAuditRepository");

const auditRepository = createAdminAuditRepository();

function topEntriesByPlanRunColumn(db, column, limit = 5) {
  return db
    .select({
      label: column,
      count: sql`count(*)`.mapWith(Number),
    })
    .from(planRuns)
    .where(sql`${column} is not null`)
    .groupBy(column)
    .orderBy(sql`count(*) desc`)
    .limit(limit);
}

function topEntriesFromLabels(labels, limit = 5) {
  const counts = new Map();

  for (const label of labels) {
    if (!label) {
      continue;
    }

    counts.set(label, (counts.get(label) || 0) + 1);
  }

  return [...counts.entries()]
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

      const businessTypeExpr = sql`${planRuns.inputPayload} ->> 'businessType'`;

      const [
        userTotals,
        planTotals,
        mostPopularArchitectures,
        mostPopularDeploymentModels,
        mostPopularRegions,
        mostPopularBusinessTypes,
        mostPopularTechnologyComponents,
        stackRows,
        recentPlanVolumeRows,
        recentAdminActivity,
      ] = await Promise.all([
        db
          .select({
            totalUsers: sql`count(*)`.mapWith(Number),
            totalAdmins: sql`count(*) filter (where ${users.role} = 'admin')`.mapWith(Number),
          })
          .from(users),
        db
          .select({
            totalPlans: sql`count(*)`.mapWith(Number),
            averageMonthlyEstimate: sql`coalesce(round(avg(${planRuns.monthlyEstimate})), 0)`.mapWith(Number),
          })
          .from(planRuns),
        topEntriesByPlanRunColumn(db, planRuns.architectureStyle),
        topEntriesByPlanRunColumn(db, planRuns.deploymentModel),
        topEntriesByPlanRunColumn(db, planRuns.targetRegion),
        db
          .select({
            label: businessTypeExpr,
            count: sql`count(*)`.mapWith(Number),
          })
          .from(planRuns)
          .where(sql`${businessTypeExpr} is not null`)
          .groupBy(businessTypeExpr)
          .orderBy(sql`count(*) desc`)
          .limit(5),
        db
          .select({
            label: technologies.name,
            count: sql`count(*)`.mapWith(Number),
          })
          .from(planRunTechnologies)
          .innerJoin(technologies, sql`${technologies.id} = ${planRunTechnologies.technologyId}`)
          .groupBy(technologies.name)
          .orderBy(sql`count(*) desc`)
          .limit(5),
        db
          .select({
            stackLabel: sql`string_agg(${planComponents.componentCode}, ' + ' order by ${planComponents.componentCode})`,
          })
          .from(planRuns)
          .leftJoin(planComponents, sql`${planComponents.planRunId} = ${planRuns.id}`)
          .groupBy(planRuns.id),
        db
          .select({
            label: sql`to_char(date_trunc('day', ${planRuns.createdAt}), 'YYYY-MM-DD')`,
            count: sql`count(*)`.mapWith(Number),
          })
          .from(planRuns)
          .groupBy(sql`date_trunc('day', ${planRuns.createdAt})`)
          .orderBy(desc(sql`date_trunc('day', ${planRuns.createdAt})`))
          .limit(14),
        auditRepository.listRecentActions(),
      ]);

      const userTotalsRow = userTotals[0] || { totalUsers: 0, totalAdmins: 0 };
      const planTotalsRow = planTotals[0] || { totalPlans: 0, averageMonthlyEstimate: 0 };

      return {
        totals: {
          totalUsers: userTotalsRow.totalUsers || 0,
          totalAdmins: userTotalsRow.totalAdmins || 0,
          totalPlans: planTotalsRow.totalPlans || 0,
          averageMonthlyEstimate: planTotalsRow.averageMonthlyEstimate || 0,
        },
        mostPopularArchitectures,
        mostPopularDeploymentModels,
        mostPopularTechnologyComponents,
        mostPopularRegions,
        mostPopularBusinessTypes,
        topStackPatterns: topEntriesFromLabels(stackRows.map((row) => row.stackLabel)),
        recentPlanVolume: [...recentPlanVolumeRows].sort((left, right) => left.label.localeCompare(right.label)),
        recentAdminActivity,
      };
    },
  };
}

module.exports = {
  createAnalyticsRepository,
};
