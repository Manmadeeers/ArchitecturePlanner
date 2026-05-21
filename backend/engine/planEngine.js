const { questionnaire } = require("./questionnaire");
const { rules } = require("./ruleSchema");
const { evaluateRules } = require("./ruleEvaluator");
const { DEFAULT_ENGINE_SETTINGS, normalizeEngineSettings } = require("./engineSettings");
const { getRegionProfile } = require("./regionCatalog");
const { buildDiagram, buildDrawioXml } = require("./diagramBuilder");

const FIELD_MAP = new Map(questionnaire.map((field) => [field.id, field]));
const DEFAULT_DEVELOPMENT_PLAN = [
  {
    phase: "Phase 1 (Weeks 1-2)",
    title: "Foundation and deployment baseline",
    outcome: "Ship a working skeleton to the target deployment model.",
    durationWeeks: 2,
    deliverables: [
      "Repository structure, CI checks, and environment configuration.",
      "Authentication flow and role boundaries for internal/admin access.",
      "Initial deployment pipeline with rollback capability.",
    ],
    exitCriteria: "A user can sign in, submit the questionnaire, and receive a persisted plan in production-like environment.",
  },
  {
    phase: "Phase 2 (Weeks 3-5)",
    title: "Core product capabilities",
    outcome: "Deliver the highest-priority feature set for the first cohort of users.",
    durationWeeks: 3,
    deliverables: [
      "Implement prioritized business flows end-to-end.",
      "Add observability for API latency, error rates, and DB performance.",
      "Harden data model migrations and backup routines.",
    ],
    exitCriteria: "Pilot users can complete the main value flow without manual intervention from the team.",
  },
  {
    phase: "Phase 3 (Weeks 6-8)",
    title: "Stabilization and launch readiness",
    outcome: "Prepare for controlled public launch with clear SLOs.",
    durationWeeks: 3,
    deliverables: [
      "Incident response runbook and on-call process.",
      "Cost guardrails, scaling rules, and capacity thresholds.",
      "Release checklist covering security, compliance, and support readiness.",
    ],
    exitCriteria: "Team can operate the service under expected load with documented incident and release procedures.",
  },
];

function normalizeApplicationType(value) {
  const normalized = String(value || "web-app");

  const legacyMap = {
    "web-and-mobile": "web-app",
    "mobile-backend": "mobile-app",
    "native-mobile-app": "mobile-app",
    "cross-platform-mobile": "mobile-app",
  };

  return legacyMap[normalized] || normalized;
}

function normalizeDeploymentPreference(value) {
  const normalized = String(value || "managed-cloud");

  const legacyMap = {
    cloud: "managed-cloud",
    "no-preference": "managed-cloud",
  };

  return legacyMap[normalized] || normalized;
}

function normalizeTeamMembers(teamMembersRaw) {
  if (!Array.isArray(teamMembersRaw)) {
    return [];
  }

  return teamMembersRaw
    .map((entry) => {
      const role = String(entry?.role || "developer").trim().slice(0, 40);
      const seniority = String(entry?.seniority || "middle").trim().slice(0, 40);
      const allocationRaw = Number(entry?.allocation);
      const allocation = Number.isFinite(allocationRaw)
        ? Math.min(100, Math.max(0, Math.round(allocationRaw)))
        : 100;

      return {
        role: role || "developer",
        seniority: seniority || "middle",
        allocation,
      };
    });
}

function normalizeInput(raw = {}) {
  return {
    projectName: String(raw.projectName || "").trim(),
    projectStage: String(raw.projectStage || "idea"),
    businessType: String(raw.businessType || "saas"),
    targetRegion: String(raw.targetRegion || "north-america"),
    deploymentPreference: normalizeDeploymentPreference(raw.deploymentPreference),
    monthlyUsers: Number(raw.monthlyUsers || 0),
    monthlyBudget: Number(raw.monthlyBudget || 0),
    applicationType: normalizeApplicationType(raw.applicationType),
    preferredStackFamily: String(raw.preferredStackFamily || "no-preference"),
    coreFeatures: Array.isArray(raw.coreFeatures) ? raw.coreFeatures.map(String) : [],
    realtimeFeatures: Boolean(raw.realtimeFeatures),
    dataSensitivity: String(raw.dataSensitivity || "low"),
    availabilityRequirement: String(raw.availabilityRequirement || "basic"),
    requiresDisasterRecovery: Boolean(raw.requiresDisasterRecovery),
    requiresComplianceTracking: Boolean(raw.requiresComplianceTracking),
    needsTwentyFourSevenSupport: Boolean(raw.needsTwentyFourSevenSupport),
    incidentResponseHours: Number(raw.incidentResponseHours || 24),
    expectedGrowth: String(raw.expectedGrowth || "slow"),
    teamTechnicalLevel: String(raw.teamTechnicalLevel || "medium"),
    needFastDelivery: Boolean(raw.needFastDelivery),
    teamMembers: normalizeTeamMembers(raw.teamMembers),
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
  const frontendComponent = (() => {
    switch (input.applicationType) {
      case "mobile-app":
        return ["mobile-client-support"];
      case "dbms-platform":
        return ["api-consumer-layer", "admin-ui"];
      case "api-platform":
      case "integrated-system":
      case "iot-platform":
        return ["api-consumer-layer"];
      case "web-app":
      default:
        return ["react-frontend"];
    }
  })();

  const architectureComponents = {
    "layered-monolith": ["nginx", "nodejs-express-api", "postgresql"],
    microservices: ["load-balancer", "nodejs-express-api", "worker-service", "postgresql"],
    "event-driven": ["load-balancer", "nodejs-express-api", "worker-service", "postgresql", "job-queue", "redis-pubsub"],
  }[recommendation.architectureStyle];

  return Array.from(new Set([...frontendComponent, ...architectureComponents, ...recommendation.components]));
}

function buildDescription(input, recommendation, regionProfile) {
  const teamFootprint = input.teamMembers.length > 0
    ? ` The current team profile includes ${input.teamMembers.length} mapped developer role(s).`
    : "";

  return [
    `${input.projectName} is best served by a ${recommendation.architectureStyle.replaceAll("-", " ")} architecture.`,
    `The recommendation favors ${recommendation.deploymentModel.replaceAll("-", " ")} deployment for the ${regionProfile.label} region.`,
    `The selected components keep the solution aligned with the team's ${input.teamTechnicalLevel} technical level and a ${recommendation.costProfile} budget profile.${teamFootprint}`,
  ].join(" ").trim();
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

function buildRoadmap(input, recommendation, engineSettings, cost) {
  const architectureLabel = recommendation.architectureStyle.replaceAll("-", " ");
  const deploymentLabel = recommendation.deploymentModel.replaceAll("-", " ");
  const primaryFeatures = input.coreFeatures.slice(0, 3);
  const featureSummary = primaryFeatures.length > 0 ? primaryFeatures.join(", ") : "core MVP flow";
  const roadmap = [];
  const roadmapRules = engineSettings.roadmapRules;

  if (
    roadmapRules.includeIdeaStageValidationStep &&
    (input.projectStage === "idea" || input.projectStage === "prototype")
  ) {
    roadmap.push(
      "Week 1: lock MVP scope and acceptance criteria with 5-10 pilot users before adding non-critical modules."
    );
  }

  if (recommendation.architectureStyle === "layered-monolith") {
    roadmap.push(
      `Week 1-2: deploy ${architectureLabel} on ${deploymentLabel} with one-click rollback and branch-to-environment pipeline.`,
      `Week 2-3: release ${featureSummary} inside a modular monolith boundary (API, domain, persistence layers).`,
      "Week 3-4: enforce module contracts and measure p95 latency, DB saturation, and error rate before introducing service split."
    );
  } else if (recommendation.architectureStyle === "microservices") {
    roadmap.push(
      `Week 1-2: stand up service template, API gateway, and service discovery on ${deploymentLabel}.`,
      `Week 2-3: release ${featureSummary} across 2-3 bounded services with contract tests and independent CI pipelines.`,
      "Week 3-4: add distributed tracing, per-service SLO dashboards, and timeout/retry budgets for inter-service calls."
    );
  } else {
    roadmap.push(
      `Week 1-2: deploy ${architectureLabel} baseline on ${deploymentLabel} with queue broker and event schema registry.`,
      `Week 2-3: deliver ${featureSummary} as event producers/consumers with idempotency keys and dead-letter routing.`,
      "Week 3-4: validate outbox pattern, consumer lag alerts, and replay safety for critical domain events."
    );
  }

  if (input.expectedGrowth === "slow") {
    roadmap.push(
      recommendation.architectureStyle === "microservices"
        ? "Checkpoint: keep service count stable until monthly active users exceed 5000; optimize existing service boundaries before adding new services."
        : "Checkpoint: keep current architecture shape until either monthly active users exceed 5000 or p95 API latency stays above 400 ms for 3 consecutive days."
    );
  } else if (input.expectedGrowth === "moderate") {
    roadmap.push(
      recommendation.architectureStyle === "event-driven"
        ? "Checkpoint: split high-volume event consumers by month 2 and introduce partition strategy before monthly active users reach 15000."
        : "Checkpoint: modularize service boundaries by month 2 and prepare split-ready modules before monthly active users reach 15000."
    );
  } else {
    roadmap.push(
      recommendation.architectureStyle === "layered-monolith"
        ? "Checkpoint: add queue processing and cache by month 2; split the first bounded context into a separate service when average CPU remains above 65% during peak windows."
        : "Checkpoint: scale consumers/services horizontally by month 2; enable autoscaling when average CPU remains above 65% during peak windows."
    );
  }

  if (roadmapRules.includeFileUploadLifecycleStep && input.coreFeatures.includes("file-upload")) {
    roadmap.push(
      "Storage milestone: enable object lifecycle and archive policies before stored assets exceed 100 GB or 50000 files."
    );
  }

  if (roadmapRules.includeRealtimeStressStep && input.realtimeFeatures) {
    roadmap.push(
      "Realtime milestone: run load test at target peak concurrency and introduce dedicated websocket gateway if concurrent sessions exceed 1000."
    );
  }

  roadmap.push(
    `Cost checkpoint: keep monthly infrastructure spend below $${cost.monthlyEstimate}; review top two cost drivers every sprint and optimize when variance exceeds 15%.`
  );

  return Array.from(new Set(roadmap));
}

function buildFeatureDeliveryTasks(input) {
  const featureTaskMap = {
    authentication: "Implement secure sign-up/sign-in with role-based access control.",
    payments: "Integrate payment provider with success/failure webhook processing.",
    "subscription-billing": "Implement plan management, invoices, and renewal handling.",
    "file-upload": "Ship file upload flow with object storage and lifecycle retention policy.",
    search: "Add indexed search endpoints with relevance and pagination controls.",
    "analytics-dashboard": "Deliver dashboard queries with cached aggregates and refresh policy.",
    reporting: "Generate downloadable reports with async job execution and status tracking.",
    "team-collaboration": "Add shared workspace permissions, comments, and change history.",
    "third-party-integrations": "Implement outbound integration contracts with retry and dead-letter handling.",
    "workflow-automation": "Provide rule-triggered background workflows with audit trail.",
    "admin-panel": "Ship admin controls for users, content, and operational settings.",
    notifications: "Implement notification pipeline with channel preferences and delivery logging.",
  };

  return input.coreFeatures.map((feature) => featureTaskMap[feature]).filter(Boolean);
}

function buildDeveloperHint(input) {
  if (!Array.isArray(input.teamMembers) || input.teamMembers.length === 0) {
    return "Assign one owner per phase before execution starts.";
  }

  const representativeCapacity = input.teamMembers
    .slice(0, 3)
    .map((member) => `${member.role} (${member.seniority}, ${member.allocation}%)`)
    .join(", ");

  return `Initial phase ownership can start with: ${representativeCapacity}.`;
}

function buildDevelopmentPlan(input, recommendation, cost) {
  const topFeatureTasks = buildFeatureDeliveryTasks(input).slice(0, 4);
  const deploymentAction =
    recommendation.deploymentModel === "on-premise"
      ? "Prepare infrastructure-as-code, secrets rotation, and host hardening for on-premise rollout."
      : "Prepare managed deployment templates and automated environment promotion gates.";

  const resilienceAction = input.requiresDisasterRecovery
    ? "Implement multi-zone failover drill and recovery point objective verification."
    : "Document backup restore drill and validate single-region recovery procedure.";

  const complianceAction = input.requiresComplianceTracking
    ? "Capture audit evidence for privileged actions and data access events."
    : "Track operational changes in lightweight release and incident logs.";

  const supportAction = input.needsTwentyFourSevenSupport
    ? "Set 24/7 on-call rotation with escalation matrix and handoff playbook."
    : "Define business-hours support process with incident severity matrix.";

  return [
    {
      phase: "Phase 1 (Weeks 1-2)",
      title: "Foundation and first deploy",
      outcome: "A stable baseline is running in target environment with core guardrails.",
      durationWeeks: 2,
      deliverables: [
        deploymentAction,
        "Implement authentication boundary and initial data model migrations.",
        buildDeveloperHint(input),
      ],
      exitCriteria:
        "The team can deploy from main branch to target environment and validate end-to-end plan generation flow.",
    },
    {
      phase: "Phase 2 (Weeks 3-5)",
      title: "Priority feature delivery",
      outcome: "Top user-facing flows are available and testable by pilot users.",
      durationWeeks: 3,
      deliverables: topFeatureTasks.length > 0 ? topFeatureTasks : ["Deliver first complete product flow from login to value output."],
      exitCriteria:
        "Pilot users can complete the target flow with acceptable latency and no manual support from developers.",
    },
    {
      phase: "Phase 3 (Weeks 6-8)",
      title: "Operational hardening and launch",
      outcome: `Service is launch-ready with monthly cost target near $${cost.monthlyEstimate}.`,
      durationWeeks: 3,
      deliverables: [resilienceAction, complianceAction, supportAction],
      exitCriteria:
        "Incident response process is validated and release checklist is signed off for first public rollout.",
    },
  ];
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
  const roadmap = buildRoadmap(input, recommendation, resolvedEngineSettings, cost);
  const developmentPlan = buildDevelopmentPlan(input, recommendation, cost);
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
    developmentPlan,
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
