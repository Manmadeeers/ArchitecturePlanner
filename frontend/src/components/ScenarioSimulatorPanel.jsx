import { useMemo, useState } from "react";

import { useI18n } from "../i18n";

const SCENARIO_TEMPLATES = [
  {
    key: "fast-growth",
    label: "Fast Growth Push",
    description: "Simulates aggressive adoption and higher concurrency pressure.",
    buildOverrides: (baseInput) => ({
      monthlyUsers: Math.max(2000, Math.round(Number(baseInput.monthlyUsers || 0) * 5)),
      expectedGrowth: "fast",
      realtimeFeatures: true,
      availabilityRequirement: "important",
    }),
  },
  {
    key: "lean-budget",
    label: "Lean Budget",
    description: "Forces strict infrastructure budget conditions.",
    buildOverrides: (baseInput) => ({
      monthlyBudget: Math.max(50, Math.round(Number(baseInput.monthlyBudget || 0) * 0.55)),
      deploymentPreference: "managed-cloud",
      needFastDelivery: true,
    }),
  },
  {
    key: "enterprise-hardening",
    label: "Enterprise Hardening",
    description: "Applies stricter security, compliance, and resiliency requirements.",
    buildOverrides: () => ({
      dataSensitivity: "high",
      availabilityRequirement: "critical",
      requiresDisasterRecovery: true,
      requiresComplianceTracking: true,
      needsTwentyFourSevenSupport: true,
      incidentResponseHours: 2,
    }),
  },
  {
    key: "mobile-expansion",
    label: "Mobile Expansion",
    description: "Switches focus to mobile channels and communication-heavy flows.",
    buildOverrides: (baseInput) => ({
      applicationType: "mobile-app",
      coreFeatures: Array.from(new Set([...(baseInput.coreFeatures || []), "notifications", "team-collaboration"])),
    }),
  },
];

function formatDelta(value, formatter) {
  const numericValue = Number(value || 0);
  const prefix = numericValue > 0 ? "+" : "";
  return `${prefix}${formatter(numericValue)}`;
}

export function ScenarioSimulatorPanel({
  error,
  formValues,
  isLoadingScenarios,
  onGenerateScenarioSet,
  scenarioResponse,
}) {
  const { formatCurrency, getValueLabel, t, translateFixedText } = useI18n();
  const [enabledKeys, setEnabledKeys] = useState(() => SCENARIO_TEMPLATES.map((template) => template.key));

  const activeTemplates = useMemo(
    () => SCENARIO_TEMPLATES.filter((template) => enabledKeys.includes(template.key)),
    [enabledKeys],
  );

  function toggleTemplate(templateKey) {
    setEnabledKeys((current) => {
      if (current.includes(templateKey)) {
        return current.filter((entry) => entry !== templateKey);
      }

      return [...current, templateKey];
    });
  }

  function runSimulation() {
    const scenarios = activeTemplates.map((template) => ({
      key: template.key,
      label: template.label,
      overrides: template.buildOverrides(formValues),
    }));

    onGenerateScenarioSet(scenarios);
  }

  return (
    <section className="panel scenario-panel">
      <div className="panel-heading">
        <h2>{t("scenarios.title")}</h2>
        <p>{t("scenarios.description")}</p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      <div className="scenario-template-grid">
        {SCENARIO_TEMPLATES.map((template) => {
          const isEnabled = enabledKeys.includes(template.key);
          return (
            <label key={template.key} className={`scenario-template-card ${isEnabled ? "scenario-template-card-active" : ""}`}>
              <input type="checkbox" checked={isEnabled} onChange={() => toggleTemplate(template.key)} />
              <div>
                <strong>{template.label}</strong>
                <p>{template.description}</p>
              </div>
            </label>
          );
        })}
      </div>

      <div className="button-row">
        <button
          type="button"
          className="primary-button"
          onClick={runSimulation}
          disabled={activeTemplates.length === 0 || isLoadingScenarios}
        >
          {isLoadingScenarios ? t("scenarios.running") : t("scenarios.run")}
        </button>
      </div>

      {scenarioResponse?.scenarios?.length > 0 ? (
        <div className="scenario-results-grid">
          {scenarioResponse.scenarios.map((scenario) => {
            const isBaseline = scenario.scenarioKey === "baseline";
            const monthlyEstimate = Number(scenario?.plan?.cost?.monthlyEstimate || 0);
            const deltaPercent = Number(scenario?.delta?.monthlyEstimateDeltaPercent || 0);
            const deltaPrefix = deltaPercent > 0 ? "+" : "";

            return (
              <article key={scenario.scenarioKey} className={`scenario-result-card ${isBaseline ? "scenario-result-card-baseline" : ""}`}>
                <div className="scenario-result-head">
                  <h3>{scenario.scenarioLabel}</h3>
                  <span>{formatCurrency(monthlyEstimate)}</span>
                </div>

                <div className="scenario-result-meta">
                  <span>{t("scenarios.architecture")}: {getValueLabel(scenario.plan?.recommendation?.architectureStyle)}</span>
                  <span>{t("scenarios.deployment")}: {getValueLabel(scenario.plan?.recommendation?.deploymentModel)}</span>
                </div>

                {!isBaseline ? (
                  <div className="scenario-delta-strip">
                    <strong>{t("scenarios.costDelta")}: {formatDelta(scenario?.delta?.monthlyEstimateDelta, formatCurrency)}</strong>
                    <span>{deltaPrefix}{deltaPercent}%</span>
                  </div>
                ) : null}

                {!isBaseline ? (
                  <div className="scenario-delta-grid">
                    <div>
                      <small>{t("scenarios.addedComponents")}</small>
                      <p>
                        {scenario?.delta?.addedComponents?.length
                          ? scenario.delta.addedComponents.map((component) => getValueLabel(component)).join(", ")
                          : t("scenarios.none")}
                      </p>
                    </div>
                    <div>
                      <small>{t("scenarios.removedComponents")}</small>
                      <p>
                        {scenario?.delta?.removedComponents?.length
                          ? scenario.delta.removedComponents.map((component) => getValueLabel(component)).join(", ")
                          : t("scenarios.none")}
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="scenario-reasons">
                  <small>{t("scenarios.whyChanged")}</small>
                  <ul className="text-list compact-list">
                    {(scenario?.delta?.reasons || []).map((reason) => (
                      <li key={reason}>{translateFixedText(reason)}</li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
