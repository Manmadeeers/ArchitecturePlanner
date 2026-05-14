const { and, asc, eq, inArray } = require("drizzle-orm");

const { getDb } = require("../client");
const { planRunTechnologies, technologies, technologyCategories } = require("../schema");
const { createAdminAuditRepository } = require("./adminAuditRepository");

const auditRepository = createAdminAuditRepository();

const COMPONENT_CATEGORY_HINTS = {
  "react-frontend": ["frontend", "framework", "language"],
  "nodejs-express-api": ["backend", "framework", "language"],
  "worker-service": ["backend", "infrastructure"],
  postgresql: ["database"],
  nginx: ["infrastructure", "devops"],
  cdn: ["infrastructure", "cloud"],
  "load-balancer": ["infrastructure", "cloud"],
  "mobile-client-support": ["mobile", "framework"],
  "api-consumer-layer": ["integration", "backend"],
};

function normalizeOptionalText(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized || null;
}

function normalizeRequiredText(value, fieldName) {
  const normalized = normalizeOptionalText(value);

  if (!normalized) {
    const error = new Error(`${fieldName} is required.`);
    error.statusCode = 400;
    throw error;
  }

  return normalized;
}

function normalizeCategoryId(value) {
  const categoryId = Number(value);

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    const error = new Error("Technology category is required.");
    error.statusCode = 400;
    throw error;
  }

  return categoryId;
}

function technologyCategorySelection() {
  return {
    id: technologyCategories.id,
    code: technologyCategories.code,
    name: technologyCategories.name,
    sortOrder: technologyCategories.sortOrder,
    isActive: technologyCategories.isActive,
    createdAt: technologyCategories.createdAt,
    updatedAt: technologyCategories.updatedAt,
  };
}

function technologySelection() {
  return {
    id: technologies.id,
    name: technologies.name,
    categoryId: technologyCategories.id,
    categoryCode: technologyCategories.code,
    categoryName: technologyCategories.name,
    description: technologies.description,
    logoUrl: technologies.logoUrl,
    isActive: technologies.isActive,
    createdAt: technologies.createdAt,
    updatedAt: technologies.updatedAt,
  };
}

function buildCategoryHints(plan) {
  const categories = new Set();
  const components = Array.isArray(plan?.recommendation?.components) ? plan.recommendation.components : [];

  for (const component of components) {
    const hints = COMPONENT_CATEGORY_HINTS[String(component)] || [];

    for (const hint of hints) {
      categories.add(hint.toLowerCase());
    }
  }

  if (plan?.recommendation?.deploymentModel === "cloud-managed") {
    categories.add("cloud");
    categories.add("infrastructure");
  }

  if (plan?.input?.realtimeFeatures) {
    categories.add("messaging");
  }

  if (plan?.input?.applicationType === "mobile-backend") {
    categories.add("mobile");
  }

  return categories;
}

function buildTechnologyJustification(technology, categoryHints) {
  const categoryCode = String(technology.categoryCode || "").toLowerCase();
  if (categoryHints.has(categoryCode)) {
    return `Matches recommended ${technology.categoryName} layer for this architecture.`;
  }

  return "Included as an active catalog technology option for implementation planning.";
}

function createDatabaseRequiredError() {
  const error = new Error("Database access is required for technology management.");
  error.statusCode = 503;
  return error;
}

function createTechnologyRepository() {
  return {
    async listTechnologyCategories(options = {}) {
      const db = getDb();
      const includeInactive = Boolean(options.includeInactive);

      if (!db) {
        return [];
      }

      let query = db
        .select({
          ...technologyCategorySelection(),
        })
        .from(technologyCategories)
        .orderBy(asc(technologyCategories.sortOrder), asc(technologyCategories.name));

      if (!includeInactive) {
        query = query.where(eq(technologyCategories.isActive, true));
      }

      return query;
    },

    async listTechnologies(options = {}) {
      const db = getDb();
      const includeInactive = Boolean(options.includeInactive);

      if (!db) {
        return [];
      }

      let query = db
        .select({
          ...technologySelection(),
        })
        .from(technologies)
        .innerJoin(technologyCategories, eq(technologyCategories.id, technologies.categoryId))
        .orderBy(asc(technologyCategories.sortOrder), asc(technologies.name));

      if (!includeInactive) {
        query = query.where(and(eq(technologies.isActive, true), eq(technologyCategories.isActive, true)));
      }

      return query;
    },

    async getCategoryById(categoryId) {
      const db = getDb();

      if (!db) {
        throw createDatabaseRequiredError();
      }

      const [category] = await db
        .select({
          ...technologyCategorySelection(),
        })
        .from(technologyCategories)
        .where(eq(technologyCategories.id, categoryId))
        .limit(1);

      return category || null;
    },

    async createTechnology(input, actorUserId = null) {
      const db = getDb();

      if (!db) {
        throw createDatabaseRequiredError();
      }

      const categoryId = normalizeCategoryId(input?.categoryId);
      const category = await this.getCategoryById(categoryId);

      if (!category || !category.isActive) {
        const error = new Error("Technology category is invalid or inactive.");
        error.statusCode = 400;
        throw error;
      }

      const [created] = await db
        .insert(technologies)
        .values({
          name: normalizeRequiredText(input?.name, "Technology name"),
          categoryId,
          description: normalizeOptionalText(input?.description),
          logoUrl: normalizeOptionalText(input?.logoUrl),
          isActive: input?.isActive !== false,
        })
        .returning({
          id: technologies.id,
        });

      const [row] = await db
        .select({
          ...technologySelection(),
        })
        .from(technologies)
        .innerJoin(technologyCategories, eq(technologyCategories.id, technologies.categoryId))
        .where(eq(technologies.id, created.id))
        .limit(1);

      await auditRepository.logAction({
        actorUserId,
        action: "technology.created",
        targetType: "technology",
        targetId: String(row.id),
        details: row,
      });

      return row;
    },

    async updateTechnology(technologyId, input, actorUserId = null) {
      const db = getDb();

      if (!db) {
        throw createDatabaseRequiredError();
      }

      const [current] = await db
        .select({
          ...technologySelection(),
        })
        .from(technologies)
        .innerJoin(technologyCategories, eq(technologyCategories.id, technologies.categoryId))
        .where(eq(technologies.id, technologyId))
        .limit(1);

      if (!current) {
        const error = new Error("Technology not found.");
        error.statusCode = 404;
        throw error;
      }

      let nextCategoryId = current.categoryId;
      if (Object.prototype.hasOwnProperty.call(input || {}, "categoryId")) {
        nextCategoryId = normalizeCategoryId(input?.categoryId);
        const category = await this.getCategoryById(nextCategoryId);

        if (!category || !category.isActive) {
          const error = new Error("Technology category is invalid or inactive.");
          error.statusCode = 400;
          throw error;
        }
      }

      await db
        .update(technologies)
        .set({
          name:
            Object.prototype.hasOwnProperty.call(input || {}, "name")
              ? normalizeRequiredText(input?.name, "Technology name")
              : current.name,
          categoryId: nextCategoryId,
          description:
            Object.prototype.hasOwnProperty.call(input || {}, "description")
              ? normalizeOptionalText(input?.description)
              : current.description,
          logoUrl:
            Object.prototype.hasOwnProperty.call(input || {}, "logoUrl")
              ? normalizeOptionalText(input?.logoUrl)
              : current.logoUrl,
          isActive:
            Object.prototype.hasOwnProperty.call(input || {}, "isActive")
              ? Boolean(input?.isActive)
              : current.isActive,
          updatedAt: new Date(),
        })
        .where(eq(technologies.id, technologyId));

      const [row] = await db
        .select({
          ...technologySelection(),
        })
        .from(technologies)
        .innerJoin(technologyCategories, eq(technologyCategories.id, technologies.categoryId))
        .where(eq(technologies.id, technologyId))
        .limit(1);

      await auditRepository.logAction({
        actorUserId,
        action: "technology.updated",
        targetType: "technology",
        targetId: String(row.id),
        details: {
          previous: current,
          next: row,
        },
      });

      return row;
    },

    async deleteTechnology(technologyId, actorUserId = null) {
      const db = getDb();

      if (!db) {
        throw createDatabaseRequiredError();
      }

      try {
        const [row] = await db
          .delete(technologies)
          .where(eq(technologies.id, technologyId))
          .returning({
            id: technologies.id,
            name: technologies.name,
          });

        if (!row) {
          const error = new Error("Technology not found.");
          error.statusCode = 404;
          throw error;
        }

        await auditRepository.logAction({
          actorUserId,
          action: "technology.deleted",
          targetType: "technology",
          targetId: String(row.id),
          details: row,
        });

        return row;
      } catch (error) {
        if (error?.code === "23503") {
          const conflictError = new Error("Technology is already linked to generated plans and cannot be deleted.");
          conflictError.statusCode = 400;
          throw conflictError;
        }

        throw error;
      }
    },

    async selectTechnologiesForPlan(plan, options = {}) {
      const db = getDb();
      const limit = Number.isInteger(options.limit) && options.limit > 0 ? options.limit : 6;

      if (!db) {
        return [];
      }

      const activeTechnologies = await this.listTechnologies({ includeInactive: false });
      if (activeTechnologies.length === 0) {
        return [];
      }

      const categoryHints = buildCategoryHints(plan);
      const componentText = Array.isArray(plan?.recommendation?.components)
        ? plan.recommendation.components.join(" ").toLowerCase()
        : "";

      const rankedTechnologies = activeTechnologies
        .map((technology) => {
          let score = 0;
          const normalizedCategoryCode = String(technology.categoryCode || "").toLowerCase();
          const normalizedName = String(technology.name || "").toLowerCase();

          if (categoryHints.has(normalizedCategoryCode)) {
            score += 3;
          }

          if (componentText.includes(normalizedName)) {
            score += 2;
          }

          return {
            ...technology,
            score,
            justification: buildTechnologyJustification(technology, categoryHints),
          };
        })
        .sort((left, right) => {
          if (right.score !== left.score) {
            return right.score - left.score;
          }

          return left.name.localeCompare(right.name);
        });

      const withPositiveScore = rankedTechnologies.filter((technology) => technology.score > 0);
      const selected = (withPositiveScore.length > 0 ? withPositiveScore : rankedTechnologies).slice(0, limit);

      return selected.map((technology) => ({
        technologyId: technology.id,
        name: technology.name,
        categoryId: technology.categoryId,
        categoryCode: technology.categoryCode,
        categoryName: technology.categoryName,
        category: technology.categoryName,
        description: technology.description,
        logoUrl: technology.logoUrl,
        justification: technology.justification,
      }));
    },

    async attachTechnologiesToPlanRun(planRunId, selectedTechnologies = []) {
      const db = getDb();

      if (!db || !planRunId || !Array.isArray(selectedTechnologies) || selectedTechnologies.length === 0) {
        return;
      }

      await db
        .insert(planRunTechnologies)
        .values(
          selectedTechnologies.map((technology) => ({
            planRunId,
            technologyId: technology.technologyId,
            justification: technology.justification || null,
          })),
        )
        .onConflictDoNothing();
    },

    async listTechnologiesForPlanRunIds(planRunIds = []) {
      const db = getDb();

      if (!db || !Array.isArray(planRunIds) || planRunIds.length === 0) {
        return new Map();
      }

      const rows = await db
        .select({
          planRunId: planRunTechnologies.planRunId,
          technologyId: technologies.id,
          name: technologies.name,
          categoryId: technologyCategories.id,
          categoryCode: technologyCategories.code,
          categoryName: technologyCategories.name,
          description: technologies.description,
          logoUrl: technologies.logoUrl,
          isActive: technologies.isActive,
          justification: planRunTechnologies.justification,
        })
        .from(planRunTechnologies)
        .innerJoin(technologies, eq(technologies.id, planRunTechnologies.technologyId))
        .innerJoin(technologyCategories, eq(technologyCategories.id, technologies.categoryId))
        .where(inArray(planRunTechnologies.planRunId, planRunIds))
        .orderBy(asc(technologyCategories.sortOrder), asc(technologies.name));

      const planRunMap = new Map();

      for (const row of rows) {
        if (!planRunMap.has(row.planRunId)) {
          planRunMap.set(row.planRunId, []);
        }

        planRunMap.get(row.planRunId).push({
          technologyId: row.technologyId,
          name: row.name,
          categoryId: row.categoryId,
          categoryCode: row.categoryCode,
          categoryName: row.categoryName,
          category: row.categoryName,
          description: row.description,
          logoUrl: row.logoUrl,
          isActive: row.isActive,
          justification: row.justification,
        });
      }

      return planRunMap;
    },
  };
}

module.exports = {
  createTechnologyRepository,
};
