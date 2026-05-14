const { questionnaire } = require("./questionnaire");
const { rules } = require("./ruleSchema");
const { evaluateRules } = require("./ruleEvaluator");
const { DEFAULT_ENGINE_SETTINGS, normalizeEngineSettings } = require("./engineSettings");
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

function estimateCost(input, recommendation, regionProfile, engineSettings) {
  const costModel = engineSettings.costModel;
  const baseCost = costModel.baseMonthlyCost[recommendation.architectureStyle];
  const featureWeight = recommendation.components.length * costModel.featureComponentWeight;
  const userWeight = Math.round(input.monthlyUsers / costModel.monthlyUsersDivider);
  const urgencyWeight = input.needFastDelivery ? costModel.fastDeliverySurcharge : 0;
  const regionalCost = Math.round((baseCost + featureWeight + userWeight + urgencyWeight) * regionProfile.costMultiplier);

  return {
    currency: "USD",
    monthlyEstimate: regionalCost,
    breakdown: {
      compute: Math.round(regionalCost * costModel.costBreakdown.compute),
      database: Math.round(regionalCost * costModel.costBreakdown.database),
      storage: Math.round(regionalCost * costModel.costBreakdown.storage),
      monitoring: Math.round(regionalCost * costModel.costBreakdown.monitoring),
      networking: Math.round(regionalCost * costModel.costBreakdown.networking),
    },
    assumptions: [
      "Estimate is deterministic and based on local MVP cost profiles.",
      `Region multiplier applied: ${regionProfile.costMultiplier} for ${regionProfile.label}.`,
    ],
  };
}

function buildRoadmap(input, recommendation, engineSettings) {
  const roadmap = [...recommendation.roadmap];
  const roadmapRules = engineSettings.roadmapRules;

  if (
    roadmapRules.includeIdeaStageValidationStep &&
    (input.projectStage === "idea" || input.projectStage === "prototype")
  ) {
    roadmap.unshift("Validate the MVP with one deployment environment before investing in advanced infrastructure.");
  }

  if (roadmapRules.includeFileUploadLifecycleStep && input.coreFeatures.includes("file-upload")) {
    roadmap.push("Add storage lifecycle policies when user-generated content volume starts growing.");
  }

  if (roadmapRules.includeRealtimeStressStep && input.realtimeFeatures) {
    roadmap.push("Stress-test realtime traffic and move stateful communication behind dedicated gateways as usage increases.");
  }

  return Array.from(new Set(roadmap));
}

function generatePlan(rawInput, engineSettings = DEFAULT_ENGINE_SETTINGS) {
  const resolvedEngineSettings = normalizeEngineSettings(engineSettings);
  const input = normalizeInput(rawInput);
  validateInput(input);

  const recommendation = evaluateRules(input, rules);
  const regionProfile = getRegionProfile(input.targetRegion, resolvedEngineSettings.regionMultipliers);
  recommendation.regionAdjustments.costMultiplier = Math.max(
    recommendation.regionAdjustments.costMultiplier,
    regionProfile.costMultiplier
  );

  recommendation.components = buildBaseComponents(input, recommendation);

  const cost = estimateCost(input, recommendation, regionProfile, resolvedEngineSettings);
  const roadmap = buildRoadmap(input, recommendation, resolvedEngineSettings);
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

  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `${slug || "architecture-plan"}-${timestamp}-${randomSuffix}`;
}

module.exports = {
  FIELD_MAP,
  DEFAULT_DEVELOPMENT_PLAN,
  generatePlan,
  normalizeInput,
  validateInput,
};
