const { questionnaire } = require("./questionnaire");
const { rules } = require("./ruleSchema");
const { evaluateRules } = require("./ruleEvaluator");
const { getRegionProfile } = require("./regionCatalog");
const { buildDiagram, buildDrawioXml } = require("./diagramBuilder");

const FIELD_MAP = new Map(questionnaire.map((field) => [field.id, field]));
const DEFAULT_DEVELOPMENT_PLAN = [
  {
    phase: "Phase 1",
    title: "Questionnaire and planning API",
    outcome: "Collect requirements and generate deterministic architecture recommendations.",
  },
  {
    phase: "Phase 2",
    title: "Diagram export and saved plans",
    outcome: "Allow users to download diagrams and compare previous results.",
  },
  {
    phase: "Phase 3",
    title: "External region data sync",
    outcome: "Refresh cost and service availability data from open APIs.",
  },
];

function normalizeInput(raw = {}) {
  return {
    projectName: String(raw.projectName || "").trim(),
    projectStage: String(raw.projectStage || "idea"),
    businessType: String(raw.businessType || "saas"),
    targetRegion: String(raw.targetRegion || "north-america"),
    deploymentPreference: String(raw.deploymentPreference || "cloud"),
    monthlyUsers: Number(raw.monthlyUsers || 0),
    monthlyBudget: Number(raw.monthlyBudget || 0),
    applicationType: String(raw.applicationType || "web-app"),
    coreFeatures: Array.isArray(raw.coreFeatures) ? raw.coreFeatures.map(String) : [],
    realtimeFeatures: Boolean(raw.realtimeFeatures),
    dataSensitivity: String(raw.dataSensitivity || "low"),
    availabilityRequirement: String(raw.availabilityRequirement || "basic"),
    expectedGrowth: String(raw.expectedGrowth || "slow"),
    teamTechnicalLevel: String(raw.teamTechnicalLevel || "medium"),
    needFastDelivery: Boolean(raw.needFastDelivery),
  };
}

function validateInput(input) {
  const errors = [];

  for (const field of questionnaire) {
    const value = input[field.id];

    if (field.required) {
      if (field.type === "text" && !value) {
        errors.push(`${field.id} is required`);
      }

      if (field.type === "select" && !field.options.includes(value)) {
        errors.push(`${field.id} must be one of: ${field.options.join(", ")}`);
      }

      if (field.type === "multiselect") {
        if (!Array.isArray(value) || value.length === 0) {
          errors.push(`${field.id} must contain at least one selection`);
        } else if (value.some((option) => !field.options.includes(option))) {
          errors.push(`${field.id} contains unsupported values`);
        }
      }

      if (field.type === "number") {
        if (!Number.isFinite(value) || value < (field.min ?? Number.NEGATIVE_INFINITY)) {
          errors.push(`${field.id} must be a valid number`);
        }
      }

      if (field.type === "boolean" && typeof value !== "boolean") {
        errors.push(`${field.id} must be true or false`);
      }
    }
  }

  if (errors.length > 0) {
    const error = new Error("Invalid plan input");
    error.statusCode = 400;
    error.details = errors;
    throw error;
  }
}

function buildBaseComponents(input, recommendation) {
  const frontendComponent =
    input.applicationType === "mobile-backend"
      ? ["mobile-client-support"]
      : input.applicationType === "api-platform"
        ? ["api-consumer-layer"]
        : ["react-frontend"];

  const architectureComponents = {
    monolith: ["nginx", "nodejs-express-api", "postgresql"],
    "modular-monolith": ["cdn", "nodejs-express-api", "postgresql"],
    "scalable-services": ["load-balancer", "nodejs-express-api", "worker-service", "postgresql"],
  }[recommendation.architectureStyle];

  return Array.from(new Set([...frontendComponent, ...architectureComponents, ...recommendation.components]));
}

function buildDescription(input, recommendation, regionProfile) {
  return [
    `${input.projectName} is best served by a ${recommendation.architectureStyle.replaceAll("-", " ")} architecture.`,
    `The recommendation favors ${recommendation.deploymentModel.replaceAll("-", " ")} deployment for the ${regionProfile.label} region.`,
    `The selected components keep the solution aligned with the team's ${input.teamTechnicalLevel} technical level and a ${recommendation.costProfile} budget profile.`,
  ].join(" ");
}

function estimateCost(input, recommendation, regionProfile) {
  const baseCost = {
    monolith: 70,
    "modular-monolith": 180,
    "scalable-services": 420,
  }[recommendation.architectureStyle];

  const featureWeight = recommendation.components.length * 18;
  const userWeight = Math.round(input.monthlyUsers / 700);
  const urgencyWeight = input.needFastDelivery ? 25 : 0;
  const regionalCost = Math.round((baseCost + featureWeight + userWeight + urgencyWeight) * regionProfile.costMultiplier);

  return {
    currency: "USD",
    monthlyEstimate: regionalCost,
    breakdown: {
      compute: Math.round(regionalCost * 0.42),
      database: Math.round(regionalCost * 0.26),
      storage: Math.round(regionalCost * 0.14),
      monitoring: Math.round(regionalCost * 0.08),
      networking: Math.round(regionalCost * 0.1),
    },
    assumptions: [
      "Estimate is deterministic and based on local MVP cost profiles.",
      `Region multiplier applied: ${regionProfile.costMultiplier} for ${regionProfile.label}.`,
    ],
  };
}

function buildRoadmap(input, recommendation) {
  const roadmap = [...recommendation.roadmap];

  if (input.projectStage === "idea" || input.projectStage === "prototype") {
    roadmap.unshift("Validate the MVP with one deployment environment before investing in advanced infrastructure.");
  }

  if (input.coreFeatures.includes("file-upload")) {
    roadmap.push("Add storage lifecycle policies when user-generated content volume starts growing.");
  }

  if (input.realtimeFeatures) {
    roadmap.push("Stress-test realtime traffic and move stateful communication behind dedicated gateways as usage increases.");
  }

  return Array.from(new Set(roadmap));
}

function generatePlan(rawInput) {
  const input = normalizeInput(rawInput);
  validateInput(input);

  const recommendation = evaluateRules(input, rules);
  const regionProfile = getRegionProfile(input.targetRegion);
  recommendation.regionAdjustments.costMultiplier = Math.max(
    recommendation.regionAdjustments.costMultiplier,
    regionProfile.costMultiplier
  );

  recommendation.components = buildBaseComponents(input, recommendation);

  const cost = estimateCost(input, recommendation, regionProfile);
  const roadmap = buildRoadmap(input, recommendation);
  const summary = buildDescription(input, recommendation, regionProfile);

  const plan = {
    planId: createPlanId(input.projectName),
    input,
    summary,
    recommendation: {
      ...recommendation,
      components: recommendation.components,
    },
    regionProfile,
    cost,
    roadmap,
    developmentPlan: DEFAULT_DEVELOPMENT_PLAN,
    generatedAt: new Date().toISOString(),
  };

  plan.diagram = buildDiagram(plan);
  plan.drawioXml = buildDrawioXml(plan);

  return plan;
}

function createPlanId(projectName) {
  const slug = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);

  return `${slug || "architecture-plan"}-${Date.now()}`;
}

module.exports = {
  FIELD_MAP,
  DEFAULT_DEVELOPMENT_PLAN,
  generatePlan,
  normalizeInput,
  validateInput,
};
