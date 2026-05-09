const DEFAULT_ENGINE_SETTINGS = Object.freeze({
  regionMultipliers: {
    "north-america": 1,
    europe: 1.15,
    asia: 1.1,
    global: 1.25,
  },
  costModel: {
    baseMonthlyCost: {
      monolith: 70,
      "modular-monolith": 180,
      "scalable-services": 420,
    },
    featureComponentWeight: 18,
    monthlyUsersDivider: 700,
    fastDeliverySurcharge: 25,
    costBreakdown: {
      compute: 0.42,
      database: 0.26,
      storage: 0.14,
      monitoring: 0.08,
      networking: 0.1,
    },
  },
  roadmapRules: {
    includeIdeaStageValidationStep: true,
    includeFileUploadLifecycleStep: true,
    includeRealtimeStressStep: true,
  },
});

function normalizePositiveNumber(value, fallback, minimum = 0.01) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) && nextValue >= minimum ? nextValue : fallback;
}

function normalizeProbability(value, fallback) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) && nextValue >= 0 && nextValue <= 1 ? nextValue : fallback;
}

function normalizeBoolean(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeEngineSettings(rawSettings = {}) {
  const regionMultipliers = rawSettings.regionMultipliers || {};
  const costModel = rawSettings.costModel || {};
  const baseMonthlyCost = costModel.baseMonthlyCost || {};
  const costBreakdown = costModel.costBreakdown || {};
  const roadmapRules = rawSettings.roadmapRules || {};

  return {
    regionMultipliers: {
      "north-america": normalizePositiveNumber(
        regionMultipliers["north-america"],
        DEFAULT_ENGINE_SETTINGS.regionMultipliers["north-america"]
      ),
      europe: normalizePositiveNumber(regionMultipliers.europe, DEFAULT_ENGINE_SETTINGS.regionMultipliers.europe),
      asia: normalizePositiveNumber(regionMultipliers.asia, DEFAULT_ENGINE_SETTINGS.regionMultipliers.asia),
      global: normalizePositiveNumber(regionMultipliers.global, DEFAULT_ENGINE_SETTINGS.regionMultipliers.global),
    },
    costModel: {
      baseMonthlyCost: {
        monolith: normalizePositiveNumber(
          baseMonthlyCost.monolith,
          DEFAULT_ENGINE_SETTINGS.costModel.baseMonthlyCost.monolith
        ),
        "modular-monolith": normalizePositiveNumber(
          baseMonthlyCost["modular-monolith"],
          DEFAULT_ENGINE_SETTINGS.costModel.baseMonthlyCost["modular-monolith"]
        ),
        "scalable-services": normalizePositiveNumber(
          baseMonthlyCost["scalable-services"],
          DEFAULT_ENGINE_SETTINGS.costModel.baseMonthlyCost["scalable-services"]
        ),
      },
      featureComponentWeight: normalizePositiveNumber(
        costModel.featureComponentWeight,
        DEFAULT_ENGINE_SETTINGS.costModel.featureComponentWeight
      ),
      monthlyUsersDivider: normalizePositiveNumber(
        costModel.monthlyUsersDivider,
        DEFAULT_ENGINE_SETTINGS.costModel.monthlyUsersDivider
      ),
      fastDeliverySurcharge: normalizePositiveNumber(
        costModel.fastDeliverySurcharge,
        DEFAULT_ENGINE_SETTINGS.costModel.fastDeliverySurcharge,
        0
      ),
      costBreakdown: {
        compute: normalizeProbability(
          costBreakdown.compute,
          DEFAULT_ENGINE_SETTINGS.costModel.costBreakdown.compute
        ),
        database: normalizeProbability(
          costBreakdown.database,
          DEFAULT_ENGINE_SETTINGS.costModel.costBreakdown.database
        ),
        storage: normalizeProbability(
          costBreakdown.storage,
          DEFAULT_ENGINE_SETTINGS.costModel.costBreakdown.storage
        ),
        monitoring: normalizeProbability(
          costBreakdown.monitoring,
          DEFAULT_ENGINE_SETTINGS.costModel.costBreakdown.monitoring
        ),
        networking: normalizeProbability(
          costBreakdown.networking,
          DEFAULT_ENGINE_SETTINGS.costModel.costBreakdown.networking
        ),
      },
    },
    roadmapRules: {
      includeIdeaStageValidationStep: normalizeBoolean(
        roadmapRules.includeIdeaStageValidationStep,
        DEFAULT_ENGINE_SETTINGS.roadmapRules.includeIdeaStageValidationStep
      ),
      includeFileUploadLifecycleStep: normalizeBoolean(
        roadmapRules.includeFileUploadLifecycleStep,
        DEFAULT_ENGINE_SETTINGS.roadmapRules.includeFileUploadLifecycleStep
      ),
      includeRealtimeStressStep: normalizeBoolean(
        roadmapRules.includeRealtimeStressStep,
        DEFAULT_ENGINE_SETTINGS.roadmapRules.includeRealtimeStressStep
      ),
    },
  };
}

module.exports = {
  DEFAULT_ENGINE_SETTINGS,
  normalizeEngineSettings,
};
