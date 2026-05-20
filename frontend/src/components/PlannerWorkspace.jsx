import { useEffect, useMemo, useState } from "react";

import { useI18n } from "../i18n";
import { QuestionnairePanel } from "./QuestionnairePanel";
import { ResultPanel } from "./ResultPanel";
import { ScenarioSimulatorPanel } from "./ScenarioSimulatorPanel";

const WORKSPACE_TABS = {
  build: "build",
  result: "result",
  scenarios: "scenarios",
};

export function PlannerWorkspace({ planner }) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState(WORKSPACE_TABS.build);
  const currentPlanId = planner.planResponse?.plan?.planId || null;

  useEffect(() => {
    if (currentPlanId) {
      setActiveTab(WORKSPACE_TABS.result);
    }
  }, [currentPlanId]);

  const canOpenResult = Boolean(currentPlanId) || Boolean(planner.error);
  const canOpenScenarios = planner.canGeneratePlan;

  const tabs = useMemo(
    () => [
      {
        id: WORKSPACE_TABS.build,
        label: t("views.planner"),
      },
      {
        id: WORKSPACE_TABS.result,
        label: t("result.title"),
        disabled: !canOpenResult,
      },
      {
        id: WORKSPACE_TABS.scenarios,
        label: t("scenarios.title"),
        disabled: !canOpenScenarios,
      },
    ],
    [canOpenResult, canOpenScenarios, t]
  );

  return (
    <section className="workspace-shell">
      <div className="workspace-tabs" role="tablist" aria-label={t("workspace.tabsAria")}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`workspace-tab ${activeTab === tab.id ? "workspace-tab-active" : ""}`}
            disabled={tab.disabled}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === WORKSPACE_TABS.build ? (
        <QuestionnairePanel
          canGeneratePlan={planner.canGeneratePlan}
          formValues={planner.formValues}
          handleSubmit={planner.handleSubmit}
          isLoadingPlan={planner.isLoadingPlan}
          questionnaire={planner.questionnaire}
          toggleFeature={planner.toggleFeature}
          updateField={planner.updateField}
        />
      ) : activeTab === WORKSPACE_TABS.result ? (
        <ResultPanel error={planner.error} planResponse={planner.planResponse} />
      ) : (
        <ScenarioSimulatorPanel
          error={planner.error}
          formValues={planner.formValues}
          isLoadingScenarios={planner.isLoadingScenarios}
          onGenerateScenarioSet={planner.generateScenarioSet}
          scenarioResponse={planner.scenarioResponse}
        />
      )}

      {activeTab === WORKSPACE_TABS.build && canOpenResult ? (
        <div className="workspace-footer-hint">
          <span>{t("workspace.resultReady")}</span>
          <button type="button" className="secondary-button" onClick={() => setActiveTab(WORKSPACE_TABS.result)}>
            {t("workspace.openResult")}
          </button>
        </div>
      ) : null}
    </section>
  );
}
