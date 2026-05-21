import { useI18n } from "../i18n";

function formatDelta(value, formatter) {
  const numericValue = Number(value || 0);
  const prefix = numericValue > 0 ? "+" : "";
  return `${prefix}${formatter(numericValue)}`;
}

export function ScenarioSetDetails({ scenarioSet, scenarios }) {
  const { formatCurrency, getValueLabel, t, translateFixedText } = useI18n();
  const scenarioCount = Array.isArray(scenarios) ? scenarios.length : 0;

  return (
    <div className="result-stack observatory-stack">
      <header className="plan-command-header">
        <div>
          <p className="plan-command-eyebrow">{t("scenarios.title")}</p>
          <h3>{scenarioSet?.projectNameSnapshot || t("plan.diagramTitleFallback")}</h3>
        </div>
        <p>{t("projects.scenarioSetSummary", { count: scenarioCount })}</p>
      </header>

      <div className="scenario-results-grid">
        {(scenarios || []).map((scenario) => {
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
    </div>
  );
}
