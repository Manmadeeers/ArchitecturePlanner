import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const backendDir = path.join(rootDir, "backend");
const require = createRequire(import.meta.url);

const schemaSqlPath = path.join(backendDir, "db", "schema.sql");
const defaultDatabaseUrl = "postgres://architectureplanner:architectureplanner@127.0.0.1:5432/architecture_planner";

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || defaultDatabaseUrl;
process.env.DATABASE_SSL = "false";
delete process.env.AUTH0_DOMAIN;
delete process.env.AUTH0_AUDIENCE;

const { Client } = require(path.join(backendDir, "node_modules", "pg"));

async function ensureDatabase() {
  try {
    const schemaSql = await readFile(schemaSqlPath, "utf8");
    const appClient = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: false,
    });

    await appClient.connect();

    try {
      await appClient.query(schemaSql);
    } finally {
      await appClient.end();
    }
  } catch (error) {
    const databaseUrl = new URL(process.env.DATABASE_URL);
    const targetDatabase = databaseUrl.pathname.replace(/^\//, "");
    const adminUrl = new URL(process.env.TEST_ADMIN_DATABASE_URL || "postgres://postgres:postgres@127.0.0.1:5432/postgres");
    adminUrl.pathname = "/postgres";

    const adminClient = new Client({
      connectionString: adminUrl.toString(),
      ssl: false,
    });

    await adminClient.connect();

    try {
      const existingDatabase = await adminClient.query("select 1 from pg_database where datname = $1", [targetDatabase]);
      if (existingDatabase.rowCount === 0) {
        await adminClient.query(`create database "${targetDatabase}"`);
      }
    } finally {
      await adminClient.end();
    }

    const schemaSql = await readFile(schemaSqlPath, "utf8");
    const appClient = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: false,
    });

    await appClient.connect();

    try {
      await appClient.query(schemaSql);
    } finally {
      await appClient.end();
    }
  }
}

await ensureDatabase();

const { createApp } = require(path.join(backendDir, "src", "app"));
const { getPool } = require(path.join(backendDir, "db", "client"));
const { createPlanRepository } = require(path.join(backendDir, "db", "planRepository"));
const { createAnalyticsRepository } = require(path.join(backendDir, "db", "repositories", "analyticsRepository"));
const { createEngineSettingsRepository } = require(path.join(backendDir, "db", "repositories", "engineSettingsRepository"));
const { createTechnologyRepository } = require(path.join(backendDir, "db", "repositories", "technologyRepository"));
const { generatePlan } = require(path.join(backendDir, "engine", "planEngine"));

const planRepository = createPlanRepository();
const analyticsRepository = createAnalyticsRepository();
const engineSettingsRepository = createEngineSettingsRepository();
const technologyRepository = createTechnologyRepository();

const sampleInput = {
  projectName: "Functional Test CRM",
  projectStage: "mvp",
  businessType: "saas",
  targetRegion: "europe",
  deploymentPreference: "cloud",
  monthlyUsers: 5000,
  monthlyBudget: 1200,
  applicationType: "web-app",
  coreFeatures: ["authentication", "search", "admin-panel"],
  realtimeFeatures: false,
  dataSensitivity: "medium",
  availabilityRequirement: "important",
  expectedGrowth: "moderate",
  teamTechnicalLevel: "medium",
  needFastDelivery: true,
};

function nowLabel() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createUserRecord(label, role = "user") {
  return {
    auth0Sub: `functional-${role}-${label}`,
    email: `${role}.${label}@example.com`,
    displayName: `Functional ${role} ${label}`,
    role,
  };
}

const results = [];
const cleanupState = {
  userAuth0Subs: [],
  createdTechnologyId: null,
  createdTechnologyName: null,
  originalEngineSettings: null,
};

let server = null;
let baseUrl = null;
let currentUser = null;
let adminUser = null;
let currentPlan = null;

async function createHttpServer() {
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
}

async function stopHttpServer() {
  if (!server) {
    return;
  }

  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
  server = null;
}

async function insertUser(user) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
  });

  await client.connect();

  try {
    const inserted = await client.query(
      `
        insert into users (auth0_sub, email, display_name, role)
        values ($1, $2, $3, $4)
        returning id, auth0_sub, email, display_name, role
      `,
      [user.auth0Sub, user.email, user.displayName, user.role],
    );

    cleanupState.userAuth0Subs.push(user.auth0Sub);
    return {
      ...inserted.rows[0],
      id: Number(inserted.rows[0].id),
    };
  } finally {
    await client.end();
  }
}

async function cleanupDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
  });

  await client.connect();

  try {
    if (cleanupState.createdTechnologyId) {
      await client.query("delete from technologies where id = $1", [cleanupState.createdTechnologyId]);
    }

    if (cleanupState.originalEngineSettings) {
      if (cleanupState.originalEngineSettings.updatedAt) {
        await client.query(
          `
            insert into engine_settings (key, value_json, updated_by)
            values ($1, $2::jsonb, $3)
            on conflict (key) do update
            set value_json = excluded.value_json,
                updated_by = excluded.updated_by,
                updated_at = now()
          `,
          [
            cleanupState.originalEngineSettings.key,
            JSON.stringify(cleanupState.originalEngineSettings.settings),
            cleanupState.originalEngineSettings.updatedBy,
          ],
        );
      } else {
        await client.query("delete from engine_settings where key = $1", [cleanupState.originalEngineSettings.key]);
      }
    }

    if (cleanupState.userAuth0Subs.length > 0) {
      await client.query("delete from users where auth0_sub = any($1::text[])", [cleanupState.userAuth0Subs]);
    }
  } finally {
    await client.end();
  }
}

async function runTest(name, description, fn) {
  const startedAt = performance.now();

  try {
    const details = await fn();
    const durationMs = Math.round(performance.now() - startedAt);
    results.push({
      name,
      description,
      status: "passed",
      durationMs,
      details,
    });
  } catch (error) {
    const durationMs = Math.round(performance.now() - startedAt);
    results.push({
      name,
      description,
      status: "failed",
      durationMs,
      error: error?.message || String(error),
    });
    throw error;
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.json();
  return {
    status: response.status,
    body,
  };
}

async function main() {
  cleanupState.originalEngineSettings = await engineSettingsRepository.getEngineSettingsRecord();

  currentUser = await insertUser(createUserRecord(nowLabel(), "user"));
  adminUser = await insertUser(createUserRecord(nowLabel(), "admin"));

  await createHttpServer();

  await runTest("testApiHealth", "Проверка маршрута доступности /api/health", async () => {
    const response = await requestJson(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);
    assert.equal(response.body.status, "ok");
    return { httpStatus: response.status };
  });

  await runTest("testQuestionnaireEndpoint", "Проверка получения анкеты проекта", async () => {
    const response = await requestJson(`${baseUrl}/api/questionnaire`);
    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body.questionnaire));
    assert.ok(response.body.questionnaire.length > 0);
    return {
      httpStatus: response.status,
      fieldCount: response.body.questionnaire.length,
    };
  });

  await runTest("testDatabaseConnection", "Проверка соединения с PostgreSQL", async () => {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: false,
    });

    await client.connect();
    try {
      const result = await client.query("select current_database() as database_name");
      assert.equal(result.rows[0].database_name, "architecture_planner");
      return result.rows[0];
    } finally {
      await client.end();
    }
  });

  await runTest("testGeneratePlan", "Проверка генерации архитектурного плана", async () => {
    currentPlan = generatePlan(sampleInput);
    assert.ok(currentPlan.planId);
    assert.ok(currentPlan.summary);
    assert.ok(currentPlan.cost?.monthlyEstimate >= 0);
    assert.ok(currentPlan.diagram);
    assert.ok(currentPlan.drawioXml);
    return {
      planId: currentPlan.planId,
      monthlyEstimate: currentPlan.cost.monthlyEstimate,
    };
  });

  await runTest("testSaveGeneratedPlan", "Проверка сохранения сгенерированного плана", async () => {
    const savedPlan = await planRepository.saveGeneratedPlan(currentUser.id, currentPlan);
    assert.equal(savedPlan.persisted, true);
    assert.ok(savedPlan.id);
    return {
      persisted: savedPlan.persisted,
      storedPlanId: savedPlan.id,
    };
  });

  await runTest("testListUserPlans", "Проверка получения списка проектов пользователя", async () => {
    const plans = await planRepository.listUserPlans(currentUser.id);
    assert.ok(Array.isArray(plans));
    assert.ok(plans.some((plan) => plan.planId === currentPlan.planId));
    return {
      plansCount: plans.length,
    };
  });

  await runTest("testGetUserPlan", "Проверка получения сохранённого плана по идентификатору", async () => {
    const storedPlan = await planRepository.getUserPlanByPlanId(currentUser.id, currentPlan.planId);
    assert.ok(storedPlan);
    assert.equal(storedPlan.plan.planId, currentPlan.planId);
    return {
      planId: storedPlan.plan.planId,
      technologiesCount: storedPlan.plan.technologies.length,
    };
  });

  await runTest("testCreateTechnology", "Проверка добавления технологии в каталог", async () => {
    const categories = await technologyRepository.listTechnologyCategories();
    assert.ok(categories.length > 0);

    const createdTechnology = await technologyRepository.createTechnology(
      {
        name: `Functional Test Technology ${nowLabel()}`,
        categoryId: categories[0].id,
        description: "Temporary technology created by automated functional tests.",
        logoUrl: "https://example.com/logo.svg",
        isActive: true,
      },
      adminUser.id,
    );

    cleanupState.createdTechnologyId = createdTechnology.id;
    cleanupState.createdTechnologyName = createdTechnology.name;

    assert.ok(createdTechnology.id);
    assert.equal(createdTechnology.isActive, true);
    return {
      technologyId: createdTechnology.id,
      category: createdTechnology.categoryName,
    };
  });

  await runTest("testUpdateEngineSettings", "Проверка сохранения настроек движка рекомендаций", async () => {
    const updatedSettings = structuredClone(cleanupState.originalEngineSettings.settings);
    updatedSettings.regionMultipliers.europe = 1.33;

    const savedSettings = await engineSettingsRepository.saveEngineSettings(adminUser.id, updatedSettings);
    assert.equal(Number(savedSettings.updatedBy), adminUser.id);
    assert.equal(savedSettings.settings.regionMultipliers.europe, 1.33);
    return {
      key: savedSettings.key,
      updatedBy: savedSettings.updatedBy,
    };
  });

  await runTest("testAnalyticsOverview", "Проверка получения агрегированной аналитики системы", async () => {
    const overview = await analyticsRepository.getOverview();
    assert.ok(overview.totals.totalUsers >= 2);
    assert.ok(overview.totals.totalPlans >= 1);
    assert.ok(Array.isArray(overview.recentAdminActivity));
    return {
      totalUsers: overview.totals.totalUsers,
      totalPlans: overview.totals.totalPlans,
    };
  });
}

let hasFailure = false;

try {
  await main();
} catch (error) {
  hasFailure = true;
} finally {
  await stopHttpServer();
  await cleanupDatabase();

  const pool = getPool();
  if (pool) {
    await pool.end();
  }

  const reportPath = path.join(__dirname, "functional-report.json");
  const summary = {
    generatedAt: new Date().toISOString(),
    total: results.length,
    passed: results.filter((entry) => entry.status === "passed").length,
    failed: results.filter((entry) => entry.status === "failed").length,
    databaseUrl: (() => {
      const databaseUrl = new URL(process.env.DATABASE_URL);
      return `${databaseUrl.hostname}:${databaseUrl.port}${databaseUrl.pathname}`;
    })(),
  };

  await writeFile(
    reportPath,
    JSON.stringify(
      {
        summary,
        tests: results,
      },
      null,
      2,
    ),
    "utf8",
  );

  if (hasFailure) {
    process.exitCode = 1;
  }
}
