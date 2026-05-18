import { useEffect, useMemo, useState } from "react";

import { FieldRenderer } from "./FieldRenderer";
import { useI18n } from "../i18n";

const QUESTION_STEPS = [
  {
    id: "scope",
    fields: ["projectName", "projectStage", "businessType", "applicationType", "needFastDelivery"],
  },
  {
    id: "scale",
    fields: ["monthlyUsers", "monthlyBudget", "expectedGrowth", "targetRegion", "deploymentPreference"],
  },
  {
    id: "product",
    fields: ["coreFeatures", "realtimeFeatures"],
  },
  {
    id: "operations",
    fields: ["dataSensitivity", "availabilityRequirement", "teamTechnicalLevel"],
  },
];

export function QuestionnairePanel({
  canGeneratePlan,
  formValues,
  handleSubmit,
  isLoadingPlan,
  questionnaire,
  toggleFeature,
  updateField,
}) {
  const { getQuestionnaireField, t } = useI18n();
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const steps = useMemo(() => {
    const questionMap = new Map(questionnaire.map((field) => [field.id, field]));

    return QUESTION_STEPS.map((step) => ({
      ...step,
      title: t(`questionnaire.steps.${step.id}.title`),
      description: t(`questionnaire.steps.${step.id}.description`),
      fields: step.fields.map((fieldId) => questionMap.get(fieldId)).filter(Boolean),
    })).filter((step) => step.fields.length > 0);
  }, [questionnaire, t]);

  useEffect(() => {
    if (steps.length === 0) {
      return;
    }

    if (activeStepIndex >= steps.length) {
      setActiveStepIndex(steps.length - 1);
    }
  }, [activeStepIndex, steps]);

  if (steps.length === 0) {
    return (
      <section className="panel questionnaire-panel">
        <div className="empty-state">
          <p>{t("errors.loadQuestionnaire")}</p>
        </div>
      </section>
    );
  }

  const activeStep = steps[activeStepIndex];
  const progress = ((activeStepIndex + 1) / steps.length) * 100;
  const isLastStep = activeStepIndex === steps.length - 1;

  return (
    <section className="panel questionnaire-panel questionnaire-wizard">
      <div className="panel-heading">
        <h2>{t("questionnaire.title")}</h2>
      </div>

      <div className="wizard-progress-block">
        <div className="wizard-progress-meta">
          <strong>
            {t("questionnaire.stepProgress", {
              current: activeStepIndex + 1,
              total: steps.length,
            })}
          </strong>
          <span>{activeStep.title}</span>
        </div>
        <div className="wizard-progress-track" aria-hidden="true">
          <div className="wizard-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="wizard-stepper">
        {steps.map((step, index) => (
          <button
            key={step.id}
            type="button"
            className={`wizard-step-chip ${index === activeStepIndex ? "wizard-step-chip-active" : ""}`}
            onClick={() => setActiveStepIndex(index)}
          >
            {step.title}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="questionnaire-form wizard-form">
        <div className="wizard-step-card">
          <div className="wizard-step-head">
            <h3>{activeStep.title}</h3>
            <p>{activeStep.description}</p>
          </div>

          {activeStep.fields.map((field) => (
            <FieldRenderer
              key={field.id}
              field={getQuestionnaireField(field)}
              value={formValues[field.id]}
              onChange={updateField}
              onToggleFeature={toggleFeature}
            />
          ))}
        </div>

        <div className="button-row wizard-actions">
          <button
            type="button"
            className="secondary-button"
            disabled={activeStepIndex === 0}
            onClick={() => setActiveStepIndex((current) => Math.max(0, current - 1))}
          >
            {t("questionnaire.back")}
          </button>
          {isLastStep ? (
            <button type="submit" className="primary-button" disabled={!canGeneratePlan || isLoadingPlan}>
              {isLoadingPlan ? t("questionnaire.submitting") : t("questionnaire.submit")}
            </button>
          ) : (
            <button
              type="button"
              className="primary-button"
              onClick={() => setActiveStepIndex((current) => Math.min(steps.length - 1, current + 1))}
            >
              {t("questionnaire.continue")}
            </button>
          )}
        </div>
      </form>
      {!canGeneratePlan ? (
        <div className="wizard-auth-hint">
          <small>{t("questionnaire.signInHint")}</small>
        </div>
      ) : null}
    </section>
  );
}
