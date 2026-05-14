import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { performance } from "node:perf_hooks";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const backendDir = path.join(rootDir, "backend");
const require = createRequire(import.meta.url);

const schemaSqlPath = path.join(backendDir, "db", "schema.sql");
const reportPath = path.join(__dirname, "load-test-report.json");

const VIRTUAL_USERS = Number(process.env.LOAD_TEST_USERS || 25);
const DURATION_SECONDS = Number(process.env.LOAD_TEST_DURATION_SECONDS || 60);
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || "postgres://architectureplanner:architectureplanner@127.0.0.1:5432/architecture_planner";

process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.DATABASE_SSL = "false";
delete process.env.AUTH0_DOMAIN;
delete process.env.AUTH0_AUDIENCE;

const { Client } = require(path.join(backendDir, "node_modules", "pg"));

async function ensureDatabase() {
  const schemaSql = await readFile(schemaSqlPath, "utf8");
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
  });

  await client.connect();
  try {
    await client.query(schemaSql);
  } finally {
    await client.end();
  }
}

function percentile(values, p) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(index, 0)];
}

function createSampleInput(index) {
  return {
    projectName: `Load Test Project ${index % 5}`,
    projectStage: "mvp",
    businessType: "saas",
    targetRegion: "europe",
    deploymentPreference: "cloud",
    monthlyUsers: 5000 + (index % 10) * 250,
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
}

async function insertAdminUser() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
  });

  await client.connect();
  try {
    const auth0Sub = `load-test-admin-${Date.now()}`;
    const result = await client.query(
      `
        insert into users (auth0_sub, email, display_name, role)
        values ($1, $2, $3, 'admin')
        returning id, auth0_sub
      `,
      [auth0Sub, `${auth0Sub}@example.com`, "Load Test Admin"],
    );

    return {
      id: Number(result.rows[0].id),
      auth0Sub: result.rows[0].auth0_sub,
    };
  } finally {
    await client.end();
  }
}

async function cleanupUser(auth0Sub) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
  });

  await client.connect();
  try {
    await client.query("delete from users where auth0_sub = $1", [auth0Sub]);
  } finally {
    await client.end();
  }
}

async function createServer(currentUser) {
  const authModulePath = require.resolve(path.join(backendDir, "src", "auth.js"));
  require.cache[authModulePath] = {
    id: authModulePath,
    filename: authModulePath,
    loaded: true,
    exports: {
      isAuthConfigured: () => false,
      requireAuth(req, res, next) {
        req.auth = {
          payload: {
            sub: currentUser.auth0Sub,
            email: `${currentUser.auth0Sub}@example.com`,
            name: "Load Test Admin",
          },
        };
        next();
      },
      async attachCurrentUser(req, res, next) {
        req.currentUser = {
          id: currentUser.id,
          auth0Sub: currentUser.auth0Sub,
          email: `${currentUser.auth0Sub}@example.com`,
          displayName: "Load Test Admin",
          role: "admin",
        };
        next();
      },
      requireAdmin(req, res, next) {
        next();
      },
    },
  };

  const appModulePath = require.resolve(path.join(backendDir, "src", "app.js"));
  delete require.cache[appModulePath];

  const { createApp } = require(path.join(backendDir, "src", "app"));
  const app = createApp();

  const server = await new Promise((resolve) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });

  const address = server.address();
  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
}

async function stopServer(server) {
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
}

function pickRequest(baseUrl, counter) {
  const variant = counter % 3;

  if (variant === 0) {
    return {
      name: "GET /api/questionnaire",
      url: `${baseUrl}/api/questionnaire`,
      options: {
        method: "GET",
      },
    };
  }

  if (variant === 1) {
    return {
      name: "POST /api/plans/generate",
      url: `${baseUrl}/api/plans/generate`,
      options: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createSampleInput(counter)),
      },
    };
  }

  return {
    name: "GET /api/admin/analytics/overview",
    url: `${baseUrl}/api/admin/analytics/overview`,
    options: {
      method: "GET",
    },
  };
}

const requestMetrics = [];
const routeMetrics = new Map();

function trackMetric(routeName, ok, durationMs, status) {
  requestMetrics.push({ routeName, ok, durationMs, status });

  if (!routeMetrics.has(routeName)) {
    routeMetrics.set(routeName, {
      total: 0,
      ok: 0,
      failed: 0,
      durations: [],
    });
  }

  const route = routeMetrics.get(routeName);
  route.total += 1;
  route.durations.push(durationMs);
  if (ok) {
    route.ok += 1;
  } else {
    route.failed += 1;
  }
}

async function worker(baseUrl, deadline, workerId) {
  let counter = workerId * 100000;

  while (Date.now() < deadline) {
    const request = pickRequest(baseUrl, counter);
    const startedAt = performance.now();

    try {
      const response = await fetch(request.url, request.options);
      await response.text();
      const durationMs = performance.now() - startedAt;
      const ok = response.status >= 200 && response.status < 400;
      trackMetric(request.name, ok, durationMs, response.status);
    } catch (error) {
      const durationMs = performance.now() - startedAt;
      trackMetric(request.name, false, durationMs, 0);
    }

    counter += 1;
  }
}

await ensureDatabase();
const currentUser = await insertAdminUser();
const { server, baseUrl } = await createServer(currentUser);

try {
  const deadline = Date.now() + DURATION_SECONDS * 1000;
  await Promise.all(Array.from({ length: VIRTUAL_USERS }, (_, index) => worker(baseUrl, deadline, index)));
} finally {
  await stopServer(server);
}

const totalRequests = requestMetrics.length;
const successfulRequests = requestMetrics.filter((entry) => entry.ok).length;
const failedRequests = totalRequests - successfulRequests;
const durations = requestMetrics.map((entry) => entry.durationMs);

const summary = {
  generatedAt: new Date().toISOString(),
  virtualUsers: VIRTUAL_USERS,
  durationSeconds: DURATION_SECONDS,
  totalRequests,
  successfulRequests,
  failedRequests,
  successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
  errorRate: totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0,
  averageResponseTimeMs:
    durations.length > 0 ? durations.reduce((sum, value) => sum + value, 0) / durations.length : 0,
  minResponseTimeMs: durations.length > 0 ? Math.min(...durations) : 0,
  maxResponseTimeMs: durations.length > 0 ? Math.max(...durations) : 0,
  p95ResponseTimeMs: percentile(durations, 95),
  requestsPerSecond: DURATION_SECONDS > 0 ? totalRequests / DURATION_SECONDS : 0,
};

const routes = [...routeMetrics.entries()].map(([routeName, metrics]) => ({
  routeName,
  totalRequests: metrics.total,
  successfulRequests: metrics.ok,
  failedRequests: metrics.failed,
  averageResponseTimeMs:
    metrics.durations.length > 0
      ? metrics.durations.reduce((sum, value) => sum + value, 0) / metrics.durations.length
      : 0,
  p95ResponseTimeMs: percentile(metrics.durations, 95),
}));

await writeFile(
  reportPath,
  JSON.stringify(
    {
      summary,
      routes,
    },
    null,
    2,
  ),
  "utf8",
);

await cleanupUser(currentUser.auth0Sub);

