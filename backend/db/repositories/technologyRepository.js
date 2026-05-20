const { and, asc, eq, inArray } = require("drizzle-orm");

const { getDb } = require("../client");
const { planRunTechnologies, technologies, technologyCategories } = require("../schema");
const { createAdminAuditRepository } = require("./adminAuditRepository");

const auditRepository = createAdminAuditRepository();
const EXCLUDED_TECHNOLOGY_NAMES = new Set(["dynamodb"]);

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
  "product-analytics": ["backend", "other"],
  "reporting-service": ["backend", "other"],
  "workspace-management": ["backend", "other"],
  "integration-hub": ["integration", "backend"],
  "webhook-handler": ["integration", "backend"],
  "workflow-engine": ["backend", "other"],
  "subscription-billing": ["backend", "integration"],
  "invoice-service": ["backend", "other"],
};

const TECHNOLOGY_TAGS = {
  "Node.js": ["javascript", "nodejs", "backend", "web", "rapid-delivery"],
  Bun: ["javascript", "backend", "performance"],
  Deno: ["javascript", "backend", "secure-default"],
  Python: ["python", "backend", "api", "rapid-delivery"],
  Java: ["java", "backend", "enterprise", "scale"],
  Kotlin: ["kotlin", "backend", "mobile", "enterprise", "scale", "performance"],
  "C#": ["dotnet", "backend", "enterprise", "managed-cloud"],
  Go: ["go", "backend", "performance", "scale"],
  Rust: ["rust", "backend", "performance", "security"],
  PHP: ["php", "backend", "rapid-delivery"],
  Ruby: ["ruby", "backend", "rapid-delivery"],
  Elixir: ["elixir", "backend", "realtime", "scale"],
  Express: ["javascript", "framework", "web", "rapid-delivery"],
  NestJS: ["javascript", "framework", "backend", "enterprise"],
  Fastify: ["javascript", "framework", "performance"],
  Django: ["python", "framework", "rapid-delivery"],
  FastAPI: ["python", "framework", "api", "performance"],
  "Spring Boot": ["java", "framework", "enterprise", "scale"],
  "ASP.NET Core": ["dotnet", "framework", "enterprise", "managed-cloud"],
  Laravel: ["php", "framework", "rapid-delivery"],
  "Ruby on Rails": ["ruby", "framework", "rapid-delivery"],
  Phoenix: ["elixir", "framework", "realtime", "scale"],
  PostgreSQL: ["database", "transactional", "general-purpose"],
  MySQL: ["database", "transactional", "general-purpose"],
  MariaDB: ["database", "transactional", "cost-efficient"],
  MongoDB: ["database", "document", "rapid-delivery"],
  Redis: ["cache", "database", "realtime", "performance"],
  ClickHouse: ["database", "analytics", "scale", "performance"],
  Cassandra: ["database", "distributed", "scale"],
  DynamoDB: ["database", "managed-cloud", "scale"],
  CockroachDB: ["database", "distributed", "scale", "resilience"],
  "SQL Server": ["database", "enterprise", "dotnet"],
  Nginx: ["infrastructure", "web", "performance"],
  "HAProxy": ["infrastructure", "load-balancer", "performance"],
  Envoy: ["infrastructure", "service-mesh", "scale"],
  Cloudflare: ["cloud", "cdn", "edge", "security"],
  AWS: ["cloud", "managed-cloud", "scale"],
  Azure: ["cloud", "managed-cloud", "enterprise"],
  "Google Cloud": ["cloud", "managed-cloud", "scale", "data"],
  Kubernetes: ["devops", "scale", "complex"],
  Docker: ["devops", "containers", "rapid-delivery"],
  Terraform: ["devops", "infrastructure-as-code", "scale"],
  Prometheus: ["devops", "observability", "reliability"],
  Grafana: ["devops", "observability", "reliability"],
  "OpenTelemetry": ["devops", "observability", "reliability"],
  Sentry: ["devops", "observability", "rapid-delivery"],
  RabbitMQ: ["messaging", "queue", "integration"],
  "Apache Kafka": ["messaging", "streaming", "scale"],
  NATS: ["messaging", "realtime", "performance"],
  "AWS SQS": ["messaging", "managed-cloud", "queue"],
  "Google Pub/Sub": ["messaging", "managed-cloud", "streaming"],
  "React Native": ["mobile", "javascript", "rapid-delivery"],
  Flutter: ["mobile", "cross-platform", "rapid-delivery"],
  Swift: ["mobile", "ios", "performance"],
  "Kotlin Multiplatform": ["mobile", "cross-platform", "complex"],
  GraphQL: ["integration", "api", "web"],
  Kong: ["integration", "api-gateway", "security"],
  Apigee: ["integration", "api-gateway", "enterprise"],
  MuleSoft: ["integration", "enterprise", "complex"],
  Temporal: ["integration", "workflow", "scale"],
  n8n: ["integration", "workflow", "rapid-delivery"],
  Stripe: ["payments", "integration", "saas"],
  Auth0: ["authentication", "managed-cloud", "rapid-delivery"],
  Keycloak: ["authentication", "on-prem", "enterprise"],
};

const TECHNOLOGY_STACK_FAMILY = {
  "Node.js": "nodejs",
  Bun: "nodejs",
  Deno: "nodejs",
  Express: "nodejs",
  NestJS: "nodejs",
  Fastify: "nodejs",
  JavaScript: "nodejs",
  TypeScript: "nodejs",

  Python: "python",
  Django: "python",
  FastAPI: "python",

  Java: "java",
  "Spring Boot": "java",

  "C#": "dotnet",
  "ASP.NET Core": "dotnet",
  "SQL Server": "dotnet",
  MSSQL: "dotnet",

  Go: "go",
  Rust: "rust",

  PHP: "php",
  Laravel: "php",

  Ruby: "ruby",
  "Ruby on Rails": "ruby",

  Elixir: "elixir",
  Phoenix: "elixir",
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

  if (plan?.recommendation?.deploymentModel === "managed-cloud") {
    categories.add("cloud");
    categories.add("infrastructure");
  }

  if (plan?.input?.realtimeFeatures) {
    categories.add("messaging");
  }

  if (
    plan?.input?.applicationType === "mobile-app" ||
    plan?.input?.applicationType === "mobile-backend" ||
    plan?.input?.applicationType === "native-mobile-app" ||
    plan?.input?.applicationType === "cross-platform-mobile"
  ) {
    categories.add("mobile");
  }

  if (
    plan?.input?.applicationType === "api-platform" ||
    plan?.input?.applicationType === "integrated-system" ||
    plan?.input?.applicationType === "dbms-platform" ||
    plan?.input?.applicationType === "iot-platform"
  ) {
    categories.add("integration");
    categories.add("backend");
  }

  if (plan?.input?.applicationType === "dbms-platform") {
    categories.add("database");
  }

  return categories;
}

function buildPlanPreferenceTags(plan) {
  const tags = new Set();

  tags.add(String(plan?.input?.applicationType || "web-app"));
  tags.add(String(plan?.input?.businessType || "saas"));
  tags.add(String(plan?.recommendation?.architectureStyle || "layered-monolith"));
  tags.add(String(plan?.recommendation?.deploymentModel || "managed-cloud"));

  if (plan?.input?.realtimeFeatures) {
    tags.add("realtime");
    tags.add("streaming");
  }

  if (plan?.input?.needFastDelivery) {
    tags.add("rapid-delivery");
  }

  if (plan?.input?.dataSensitivity === "high") {
    tags.add("security");
    tags.add("enterprise");
  }

  if (["fast", "unpredictable"].includes(String(plan?.input?.expectedGrowth || ""))) {
    tags.add("scale");
    tags.add("performance");
  }

  if (String(plan?.input?.teamTechnicalLevel || "medium") === "low") {
    tags.add("low-complexity");
  }

  const features = Array.isArray(plan?.input?.coreFeatures) ? plan.input.coreFeatures : [];
  if (features.includes("payments") || features.includes("subscription-billing")) {
    tags.add("payments");
  }
  if (features.includes("third-party-integrations")) {
    tags.add("integration");
  }

  const stackFamily = String(plan?.input?.preferredStackFamily || "no-preference");
  const stackFamilyTags = {
    nodejs: ["javascript", "nodejs", "rapid-delivery"],
    python: ["python", "rapid-delivery"],
    java: ["java", "enterprise", "scale"],
    dotnet: ["dotnet", "managed-cloud", "enterprise"],
    go: ["go", "performance", "scale"],
    rust: ["rust", "performance", "security"],
    php: ["php", "rapid-delivery"],
    ruby: ["ruby", "rapid-delivery"],
    elixir: ["elixir", "realtime", "scale"],
  };

  for (const tag of stackFamilyTags[stackFamily] || []) {
    tags.add(tag);
  }

  return tags;
}

function countTagOverlap(technologyName, preferenceTags) {
  const tags = TECHNOLOGY_TAGS[technologyName] || [];
  return tags.reduce((score, tag) => (preferenceTags.has(tag) ? score + 1 : score), 0);
}

function buildTechnologyJustification(technology, categoryHints, tagOverlap) {
  const categoryCode = String(technology.categoryCode || "").toLowerCase();
  if (categoryHints.has(categoryCode)) {
    return `Matches recommended ${technology.categoryName} layer for this architecture.`;
  }

  if (tagOverlap > 0) {
    return "Aligned with the selected product and delivery constraints.";
  }

  return "Included as an active catalog technology option for implementation planning.";
}

function getTechnologyStackFamily(technologyName) {
  return TECHNOLOGY_STACK_FAMILY[String(technologyName)] || null;
}

function resolveTargetStackFamily(plan, selected, rankedTechnologies) {
  const preferred = String(plan?.input?.preferredStackFamily || "no-preference");
  if (preferred !== "no-preference") {
    return preferred;
  }

  const preferredCategories = new Set(["backend", "framework", "language"]);

  for (const technology of selected) {
    const categoryCode = String(technology.categoryCode || "").toLowerCase();
    if (!preferredCategories.has(categoryCode)) {
      continue;
    }

    const family = getTechnologyStackFamily(technology.name);
    if (family) {
      return family;
    }
  }

  for (const technology of rankedTechnologies) {
    const categoryCode = String(technology.categoryCode || "").toLowerCase();
    if (!preferredCategories.has(categoryCode)) {
      continue;
    }

    const family = getTechnologyStackFamily(technology.name);
    if (family) {
      return family;
    }
  }

  return null;
}

function replaceSelectionAtIndex(selected, index, replacement) {
  const next = [...selected];
  next[index] = replacement;
  return next;
}

function findCompatibleReplacement(rankedTechnologies, selected, targetFamily, targetCategory, indexToReplace) {
  const usedIds = new Set(
    selected
      .filter((_, index) => index !== indexToReplace)
      .map((entry) => entry.id),
  );

  const categoryMatch = rankedTechnologies.find((candidate) => {
    if (usedIds.has(candidate.id)) {
      return false;
    }

    if (String(candidate.categoryCode || "").toLowerCase() !== targetCategory) {
      return false;
    }

    return getTechnologyStackFamily(candidate.name) === targetFamily;
  });

  if (categoryMatch) {
    return categoryMatch;
  }

  return rankedTechnologies.find((candidate) => {
    if (usedIds.has(candidate.id)) {
      return false;
    }

    const categoryCode = String(candidate.categoryCode || "").toLowerCase();
    if (!["backend", "framework", "language"].includes(categoryCode)) {
      return false;
    }

    return getTechnologyStackFamily(candidate.name) === targetFamily;
  });
}

function reconcileStackCompatibility(plan, selected, rankedTechnologies) {
  const targetFamily = resolveTargetStackFamily(plan, selected, rankedTechnologies);
  if (!targetFamily) {
    return selected;
  }

  let nextSelection = [...selected];

  for (let index = 0; index < nextSelection.length; index += 1) {
    const technology = nextSelection[index];
    const categoryCode = String(technology.categoryCode || "").toLowerCase();

    if (!["backend", "framework", "language"].includes(categoryCode)) {
      continue;
    }

    const family = getTechnologyStackFamily(technology.name);
    if (!family || family === targetFamily) {
      continue;
    }

    const replacement = findCompatibleReplacement(
      rankedTechnologies,
      nextSelection,
      targetFamily,
      categoryCode,
      index,
    );

    if (!replacement) {
      continue;
    }

    nextSelection = replaceSelectionAtIndex(nextSelection, index, replacement);
  }

  return nextSelection;
}

function buildCategoryPriority(plan, categoryHints) {
  const priority = [];
  const pushUnique = (categoryCode) => {
    if (!priority.includes(categoryCode)) {
      priority.push(categoryCode);
    }
  };

  const appType = String(plan?.input?.applicationType || "web-app");

  if (appType === "mobile-app") {
    ["mobile", "backend", "framework", "database", "integration", "cloud", "devops"].forEach(pushUnique);
  } else if (["api-platform", "integrated-system", "dbms-platform", "iot-platform"].includes(appType)) {
    ["backend", "framework", "integration", "database", "messaging", "infrastructure", "devops"].forEach(pushUnique);
  } else {
    ["frontend", "backend", "framework", "database", "infrastructure", "cloud", "devops"].forEach(pushUnique);
  }

  for (const hint of categoryHints) {
    pushUnique(hint);
  }

  ["language", "other"].forEach(pushUnique);
  return priority;
}

function pickDiverseTechnologies(rankedTechnologies, categoryPriority, limit) {
  const selected = [];
  const usedIds = new Set();
  const byCategory = new Map();

  for (const technology of rankedTechnologies) {
    const categoryCode = String(technology.categoryCode || "").toLowerCase();
    if (!byCategory.has(categoryCode)) {
      byCategory.set(categoryCode, []);
    }
    byCategory.get(categoryCode).push(technology);
  }

  for (const categoryCode of categoryPriority) {
    if (selected.length >= limit) {
      break;
    }

    const candidates = byCategory.get(categoryCode) || [];
    const candidate = candidates.find((entry) => !usedIds.has(entry.id));
    if (!candidate) {
      continue;
    }

    selected.push(candidate);
    usedIds.add(candidate.id);
  }

  for (const technology of rankedTechnologies) {
    if (selected.length >= limit) {
      break;
    }

    if (usedIds.has(technology.id)) {
      continue;
    }

    selected.push(technology);
    usedIds.add(technology.id);
  }

  return selected;
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
      const limit = Number.isInteger(options.limit) && options.limit > 0 ? options.limit : 8;

      if (!db) {
        return [];
      }

      const activeTechnologies = (await this.listTechnologies({ includeInactive: false })).filter(
        (technology) => !EXCLUDED_TECHNOLOGY_NAMES.has(String(technology?.name || "").toLowerCase())
      );
      if (activeTechnologies.length === 0) {
        return [];
      }

      const categoryHints = buildCategoryHints(plan);
      const preferenceTags = buildPlanPreferenceTags(plan);
      const categoryPriority = buildCategoryPriority(plan, categoryHints);
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

          const tagOverlap = countTagOverlap(technology.name, preferenceTags);
          score += tagOverlap * 2;

          return {
            ...technology,
            score,
            tagOverlap,
            justification: buildTechnologyJustification(technology, categoryHints, tagOverlap),
          };
        })
        .sort((left, right) => {
          if (right.score !== left.score) {
            return right.score - left.score;
          }

          return left.name.localeCompare(right.name);
        });

      const withPositiveScore = rankedTechnologies.filter((technology) => technology.score > 0);
      const pool = withPositiveScore.length > 0 ? withPositiveScore : rankedTechnologies;
      let selected = pickDiverseTechnologies(pool, categoryPriority, limit);
      selected = reconcileStackCompatibility(plan, selected, pool);

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
