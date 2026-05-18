import { useEffect, useMemo, useState } from "react";

import { useI18n } from "../i18n";
import { QuestionnairePanel } from "./QuestionnairePanel";
import { ResultPanel } from "./ResultPanel";

const WORKSPACE_TABS = {
  build: "build",
  result: "result",
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
    ],
    [canOpenResult, t]
  );

  return (
    <section className="workspace-shell">
      <div className="workspace-tabs" role="tablist" aria-label="Planner workspace">
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
      ) : (
        <ResultPanel error={planner.error} planResponse={planner.planResponse} />
      )}

      {activeTab === WORKSPACE_TABS.build && canOpenResult ? (
        <div className="workspace-footer-hint">
          <span>{t("result.title")} is ready.</span>
          <button type="button" className="secondary-button" onClick={() => setActiveTab(WORKSPACE_TABS.result)}>
            Open result
          </button>
        </div>
      ) : null}
    </section>
  );
}
