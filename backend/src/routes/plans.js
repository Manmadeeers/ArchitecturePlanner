const { Router } = require("express");

const { createEngineSettingsRepository } = require("../../db/repositories/engineSettingsRepository");
const { generatePlan } = require("../../engine/planEngine");
const { buildDiagram, buildDrawioXml } = require("../../engine/diagramBuilder");
const { createPlanRepository } = require("../../db/planRepository");
const { attachCurrentUser, requireAuth } = require("../auth");

const router = Router();
const engineSettingsRepository = createEngineSettingsRepository();
const repository = createPlanRepository();
const MAX_SCENARIO_COUNT = 8;

router.use(requireAuth, attachCurrentUser);

function parseNonNegativeInteger(value) {
  if (value === undefined) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function normalizeScenarioKey(value, fallbackIndex) {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return normalized || `scenario-${fallbackIndex + 1}`;
}

function normalizeScenarioDefinitions(rawScenarios) {
  if (!Array.isArray(rawScenarios) || rawScenarios.length === 0) {
    const error = new Error("At least one scenario definition is required.");
    error.statusCode = 400;
    throw error;
  }

  if (rawScenarios.length > MAX_SCENARIO_COUNT) {
    const error = new Error(`Too many scenarios. Maximum allowed is ${MAX_SCENARIO_COUNT}.`);
    error.statusCode = 400;
    throw error;
  }

  const seenKeys = new Set();

  return rawScenarios.map((scenario, index) => {
    const scenarioLabel = String(scenario?.label || "").trim().slice(0, 90);
    const scenarioKey = normalizeScenarioKey(scenario?.key || scenarioLabel, index);

    if (!scenarioLabel) {
      const error = new Error(`Scenario ${index + 1} must include a non-empty label.`);
      error.statusCode = 400;
      throw error;
    }

    if (seenKeys.has(scenarioKey) || scenarioKey === "baseline") {
      const error = new Error(`Duplicate scenario key detected: ${scenarioKey}.`);
      error.statusCode = 400;
      throw error;
    }

    seenKeys.add(scenarioKey);

    const overrides = scenario?.overrides && typeof scenario.overrides === "object" ? scenario.overrides : {};

    return {
      key: scenarioKey,
      label: scenarioLabel,
      overrides,
    };
  });
}

function mergeScenarioInput(baseInput, overrides) {
  return {
    ...baseInput,
    ...overrides,
  };
}

function diffList(previous, next) {
  const previousSet = new Set((previous || []).map(String));
  const nextSet = new Set((next || []).map(String));

  return {
    added: [...nextSet].filter((item) => !previousSet.has(item)),
    removed: [...previousSet].filter((item) => !nextSet.has(item)),
  };
}

function buildScenarioNarrative(basePlan, scenarioPlan, overrides = {}) {
  const notes = [];

  if (Object.prototype.hasOwnProperty.call(overrides, "monthlyUsers")) {
    notes.push(`Monthly users changed to ${scenarioPlan.input.monthlyUsers}.`);
  }

  if (Object.prototype.hasOwnProperty.call(overrides, "monthlyBudget")) {
    notes.push(`Budget changed to ${scenarioPlan.input.monthlyBudget} USD.`);
  }

  if (Object.prototype.hasOwnProperty.call(overrides, "expectedGrowth")) {
    notes.push(`Growth profile changed to ${scenarioPlan.input.expectedGrowth}.`);
  }

  if (Object.prototype.hasOwnProperty.call(overrides, "dataSensitivity")) {
    notes.push(`Data sensitivity changed to ${scenarioPlan.input.dataSensitivity}.`);
  }

  if (Object.prototype.hasOwnProperty.call(overrides, "availabilityRequirement")) {
    notes.push(`Availability target changed to ${scenarioPlan.input.availabilityRequirement}.`);
  }

  if (basePlan.recommendation.architectureStyle !== scenarioPlan.recommendation.architectureStyle) {
    notes.push(
      `Architecture shifted from ${basePlan.recommendation.architectureStyle} to ${scenarioPlan.recommendation.architectureStyle} due to scenario constraints.`,
    );
  }

  if (basePlan.recommendation.deploymentModel !== scenarioPlan.recommendation.deploymentModel) {
    notes.push(
      `Deployment model changed from ${basePlan.recommendation.deploymentModel} to ${scenarioPlan.recommendation.deploymentModel}.`,
    );
  }

  if (notes.length === 0) {
    notes.push("The core architecture stayed stable; only minor cost/component shifts were detected.");
  }

  return notes;
}

function buildScenarioDelta(basePlan, scenarioPlan, overrides = {}) {
  const componentDelta = diffList(basePlan.recommendation.components, scenarioPlan.recommendation.components);
  const riskDelta = diffList(basePlan.recommendation.risks, scenarioPlan.recommendation.risks);
  const costBaseline = Number(basePlan.cost?.monthlyEstimate || 0);
  const costScenario = Number(scenarioPlan.cost?.monthlyEstimate || 0);
  const monthlyEstimateDelta = costScenario - costBaseline;

  return {
    architectureChanged: basePlan.recommendation.architectureStyle !== scenarioPlan.recommendation.architectureStyle,
    deploymentChanged: basePlan.recommendation.deploymentModel !== scenarioPlan.recommendation.deploymentModel,
    monthlyEstimateDelta,
    monthlyEstimateDeltaPercent:
      costBaseline > 0 ? Math.round((monthlyEstimateDelta / costBaseline) * 100) : 0,
    addedComponents: componentDelta.added,
    removedComponents: componentDelta.removed,
    addedRisks: riskDelta.added,
    removedRisks: riskDelta.removed,
    reasons: buildScenarioNarrative(basePlan, scenarioPlan, overrides),
  };
}

router.post("/generate", async (req, res, next) => {
  try {
    const engineSettings = await engineSettingsRepository.getEngineSettings();
    const plan = generatePlan(req.body, engineSettings);
    const savedPlan = await repository.saveGeneratedPlan(req.currentUser?.id, plan);

    if (!savedPlan?.persisted) {
      const error = new Error(savedPlan?.reason || "Plan generation succeeded but saving failed.");
      error.statusCode = 503;
      throw error;
    }

    const planWithTechnologies = {
      ...plan,
      technologies: savedPlan?.technologies || [],
    };
    planWithTechnologies.diagram = buildDiagram(planWithTechnologies);
    planWithTechnologies.drawioXml = buildDrawioXml(planWithTechnologies);

    res.status(200).json({
      plan: planWithTechnologies,
      savedPlan,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/recent", async (req, res, next) => {
  try {
    const plans = await repository.listRecentPlans(req.currentUser?.id);

    res.status(200).json({
      plans,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/scenarios/generate", async (req, res, next) => {
  try {
    const baseInput = req.body?.baseInput && typeof req.body.baseInput === "object" ? req.body.baseInput : null;
    if (!baseInput) {
      const error = new Error("baseInput is required for scenario generation.");
      error.statusCode = 400;
      throw error;
    }

    const scenarioDefinitions = normalizeScenarioDefinitions(req.body?.scenarios);
    const engineSettings = await engineSettingsRepository.getEngineSettings();
    const basePlan = generatePlan(baseInput, engineSettings);
    const baselineSaved = await repository.saveGeneratedPlan(req.currentUser?.id, basePlan);

    if (!baselineSaved?.persisted) {
      const error = new Error(baselineSaved?.reason || "Baseline plan generation succeeded but saving failed.");
      error.statusCode = 503;
      throw error;
    }

    const baselinePlan = {
      ...basePlan,
      technologies: baselineSaved?.technologies || [],
    };
    baselinePlan.diagram = buildDiagram(baselinePlan);
    baselinePlan.drawioXml = buildDrawioXml(baselinePlan);

    const scenarios = [
      {
        scenarioKey: "baseline",
        scenarioLabel: "Baseline",
        inputOverrides: {},
        plan: baselinePlan,
        savedPlan: baselineSaved,
        delta: {
          architectureChanged: false,
          deploymentChanged: false,
          monthlyEstimateDelta: 0,
          monthlyEstimateDeltaPercent: 0,
          addedComponents: [],
          removedComponents: [],
          addedRisks: [],
          removedRisks: [],
          reasons: ["Reference scenario for comparison."],
        },
      },
    ];

    const persistedEntries = [
      {
        scenarioKey: "baseline",
        scenarioLabel: "Baseline",
        planRunId: baselineSaved.id,
        inputOverridePayload: {},
      },
    ];

    for (const definition of scenarioDefinitions) {
      const nextInput = mergeScenarioInput(baseInput, definition.overrides);
      const nextPlan = generatePlan(nextInput, engineSettings);
      const nextSaved = await repository.saveGeneratedPlan(req.currentUser?.id, nextPlan);

      if (!nextSaved?.persisted) {
        const error = new Error(nextSaved?.reason || `Scenario ${definition.label} generation succeeded but saving failed.`);
        error.statusCode = 503;
        throw error;
      }

      const planWithTechnologies = {
        ...nextPlan,
        technologies: nextSaved?.technologies || [],
      };
      planWithTechnologies.diagram = buildDiagram(planWithTechnologies);
      planWithTechnologies.drawioXml = buildDrawioXml(planWithTechnologies);

      scenarios.push({
        scenarioKey: definition.key,
        scenarioLabel: definition.label,
        inputOverrides: definition.overrides,
        plan: planWithTechnologies,
        savedPlan: nextSaved,
        delta: buildScenarioDelta(baselinePlan, planWithTechnologies, definition.overrides),
      });

      persistedEntries.push({
        scenarioKey: definition.key,
        scenarioLabel: definition.label,
        planRunId: nextSaved.id,
        inputOverridePayload: definition.overrides,
      });
    }

    const scenarioSet = await repository.saveScenarioSet(
      req.currentUser?.id,
      baseInput.projectName,
      baseInput,
      persistedEntries,
    );

    res.status(200).json({
      scenarioSet,
      scenarios,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const limit = parseNonNegativeInteger(req.query.limit);
    const offset = parseNonNegativeInteger(req.query.offset);
    const plans = await repository.listUserPlans(req.currentUser?.id, {
      limit,
      offset,
    });

    res.status(200).json({
      plans,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/scenario-sets/:scenarioSetId", async (req, res, next) => {
  try {
    const scenarioSet = await repository.getUserScenarioSetById(req.currentUser?.id, req.params.scenarioSetId);

    if (!scenarioSet) {
      return res.status(404).json({
        error: "Scenario set not found for the current user.",
      });
    }

    const baselineScenario = scenarioSet.scenarios.find((scenario) => scenario.scenarioKey === "baseline") || scenarioSet.scenarios[0];
    const baselinePlan = baselineScenario?.plan || null;
    const scenariosWithDelta = scenarioSet.scenarios.map((scenario) => {
      const isBaseline = !baselinePlan || scenario.scenarioKey === baselineScenario?.scenarioKey;
      return {
        ...scenario,
        delta: isBaseline
          ? {
              architectureChanged: false,
              deploymentChanged: false,
              monthlyEstimateDelta: 0,
              monthlyEstimateDeltaPercent: 0,
              addedComponents: [],
              removedComponents: [],
              addedRisks: [],
              removedRisks: [],
              reasons: ["Reference scenario for comparison."],
            }
          : buildScenarioDelta(baselinePlan, scenario.plan, scenario.inputOverrides),
      };
    });

    return res.status(200).json({
      scenarioSet: scenarioSet.scenarioSet,
      scenarios: scenariosWithDelta,
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/scenario-sets/:scenarioSetId", async (req, res, next) => {
  try {
    const deletedScenarioSet = await repository.deleteUserScenarioSetById(req.currentUser?.id, req.params.scenarioSetId);

    if (!deletedScenarioSet) {
      return res.status(404).json({
        error: "Scenario set not found for the current user.",
      });
    }

    return res.status(200).json({
      deletedScenarioSet,
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:planId", async (req, res, next) => {
  try {
    const deletedPlan = await repository.deleteUserPlanByPlanId(req.currentUser?.id, req.params.planId);

    if (!deletedPlan) {
      return res.status(404).json({
        error: "Project not found for the current user.",
      });
    }

    return res.status(200).json({
      deletedPlan,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/:planId", async (req, res, next) => {
  try {
    const savedPlan = await repository.getUserPlanByPlanId(req.currentUser?.id, req.params.planId);

    if (!savedPlan) {
      return res.status(404).json({
        error: "Project not found for the current user.",
      });
    }

    return res.status(200).json({
      plan: savedPlan.plan,
      savedPlan: {
        id: savedPlan.id,
        createdAt: savedPlan.createdAt,
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
