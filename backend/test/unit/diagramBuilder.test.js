const test = require("node:test");
const assert = require("node:assert/strict");

const { buildDiagram, buildDrawioXml } = require("../../engine/diagramBuilder");

function createPlan(overrides = {}) {
  return {
    input: {
      applicationType: "web-and-mobile",
      ...overrides.input,
    },
    recommendation: {
      architectureStyle: "microservices",
      deploymentModel: "cloud",
      components: [],
      ...overrides.recommendation,
    },
    technologies: Array.isArray(overrides.technologies) ? overrides.technologies : [],
  };
}

test("buildDiagram adds data services node and mixed protocol label when required", () => {
  const plan = createPlan({
    recommendation: {
      components: ["object-storage", "redis-pubsub", "monitoring"],
    },
  });

  const diagram = buildDiagram(plan);
  const dataServicesNode = diagram.nodes.find((node) => node.id === "data-services");
  const dataServicesEdge = diagram.edges.find((edge) => edge.to === "data-services");

  assert.ok(dataServicesNode);
  assert.deepEqual(dataServicesNode.lines, ["Object Storage", "Redis / PubSub", "Monitoring"]);
  assert.ok(dataServicesEdge);
  assert.equal(dataServicesEdge.label, "HTTPS / TCP/IP");
});

test("buildDiagram omits data services node when no extra data components exist", () => {
  const diagram = buildDiagram(
    createPlan({
      recommendation: {
        components: ["auth-module"],
      },
    }),
  );

  assert.equal(diagram.nodes.some((node) => node.id === "data-services"), false);
  assert.equal(diagram.edges.some((edge) => edge.to === "data-services"), false);
});

test("buildDrawioXml produces a valid xml envelope", () => {
  const xml = buildDrawioXml(createPlan());

  assert.ok(xml.startsWith("<?xml version=\"1.0\" encoding=\"UTF-8\"?>"));
  assert.ok(xml.includes("<mxfile host=\"app.diagrams.net\">"));
  assert.ok(xml.includes("<mxGraphModel"));
  assert.ok(xml.includes("</mxfile>"));
});

test("buildDiagram uses selected technologies for app and database labels", () => {
  const diagram = buildDiagram(
    createPlan({
      technologies: [
        { name: "C#", categoryCode: "backend" },
        { name: "ASP.NET Core", categoryCode: "framework" },
        { name: "TypeScript", categoryCode: "language" },
        { name: "SQL Server", categoryCode: "database" },
      ],
    }),
  );

  const appModule = diagram.nodes.find((node) => node.id === "app-module");
  const database = diagram.nodes.find((node) => node.id === "database");

  assert.ok(appModule);
  assert.ok(appModule.lines.includes("C# + ASP.NET Core API"));
  assert.equal(appModule.lines.includes("Node.js + Express API"), false);
  assert.ok(database);
  assert.equal(database.label, "SQL Server");
});
