import { useEffect, useMemo, useState } from "react";

import { FieldRenderer } from "./FieldRenderer";
import { useI18n } from "../i18n";

const QUESTION_STEPS = [
  {
    id: "scope",
    fields: ["projectName", "projectStage", "businessType", "applicationType", "preferredStackFamily", "needFastDelivery"],
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
    id: "team",
    custom: true,
    fields: [],
  },
  {
    id: "operations",
    fields: [
      "dataSensitivity",
      "availabilityRequirement",
      "requiresDisasterRecovery",
      "requiresComplianceTracking",
      "needsTwentyFourSevenSupport",
      "incidentResponseHours",
      "teamTechnicalLevel",
    ],
  },
];

const TEAM_STEP_COPY = {
  ru: {
    stepTitle: "\u041a\u043e\u043c\u0430\u043d\u0434\u0430 \u0440\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u043a\u0438",
    stepDescription: "\u0414\u043e\u0431\u0430\u0432\u044c\u0442\u0435 \u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u043e\u0432 \u043a\u043e\u043c\u0430\u043d\u0434\u044b \u043f\u043e \u043e\u0434\u043d\u043e\u043c\u0443, \u0447\u0442\u043e\u0431\u044b \u0437\u0430\u0444\u0438\u043a\u0441\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0440\u043e\u043b\u0438 \u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0443.",
    title: "\u0421\u043e\u0441\u0442\u0430\u0432 \u043a\u043e\u043c\u0430\u043d\u0434\u044b",
    description: "\u042d\u0442\u0438 \u0434\u0430\u043d\u043d\u044b\u0435 \u0441\u043e\u0445\u0440\u0430\u043d\u044f\u044e\u0442\u0441\u044f \u0432\u043c\u0435\u0441\u0442\u0435 \u0441 \u043f\u043b\u0430\u043d\u043e\u043c \u0434\u043b\u044f \u0434\u0430\u043b\u044c\u043d\u0435\u0439\u0448\u0435\u0433\u043e \u0443\u0442\u043e\u0447\u043d\u0435\u043d\u0438\u044f \u0430\u0440\u0445\u0438\u0442\u0435\u043a\u0442\u0443\u0440\u044b.",
    empty: "\u041f\u043e\u043a\u0430 \u043d\u0438\u043a\u043e\u0433\u043e \u043d\u0435 \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u043e.",
    nameLabel: "\u0418\u043c\u044f \u0440\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u0447\u0438\u043a\u0430",
    roleLabel: "\u0420\u043e\u043b\u044c",
    seniorityLabel: "\u0423\u0440\u043e\u0432\u0435\u043d\u044c",
    allocationLabel: "\u0417\u0430\u043d\u044f\u0442\u043e\u0441\u0442\u044c, %",
    addButton: "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0440\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u0447\u0438\u043a\u0430",
    roles: {
      frontend: "\u0424\u0440\u043e\u043d\u0442\u0435\u043d\u0434",
      backend: "\u0411\u044d\u043a\u0435\u043d\u0434",
      fullstack: "\u0424\u0443\u043b\u043b\u0441\u0442\u0435\u043a",
      devops: "DevOps",
      qa: "QA",
      mobile: "\u041c\u043e\u0431\u0438\u043b\u044c\u043d\u0430\u044f \u0440\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u043a\u0430",
    },
    seniority: {
      junior: "Junior",
      middle: "Middle",
      senior: "Senior",
      lead: "Lead",
    },
  },
  en: {
    stepTitle: "Engineering team",
    stepDescription: "Add team members one by one to capture role and capacity.",
    title: "Team composition",
    description: "This data is saved with the plan for future architecture and staffing iterations.",
    empty: "No developers added yet.",
    nameLabel: "Developer name",
    roleLabel: "Role",
    seniorityLabel: "Seniority",
    allocationLabel: "Allocation, %",
    addButton: "Add developer",
    roles: {
      frontend: "Frontend",
      backend: "Backend",
      fullstack: "Fullstack",
      devops: "DevOps",
      qa: "QA",
      mobile: "Mobile",
    },
    seniority: {
      junior: "Junior",
      middle: "Middle",
      senior: "Senior",
      lead: "Lead",
    },
  },
  be: {
    stepTitle: "\u041a\u0430\u043c\u0430\u043d\u0434\u0430 \u0440\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u043a\u0456",
    stepDescription: "\u0414\u0430\u0434\u0430\u0439\u0446\u0435 \u0443\u0434\u0437\u0435\u043b\u044c\u043d\u0456\u043a\u0430\u045e \u043f\u0430 \u0430\u0434\u043d\u044b\u043c, \u043a\u0430\u0431 \u0437\u0430\u0444\u0456\u043a\u0441\u0430\u0432\u0430\u0446\u044c \u0440\u043e\u043b\u0456 \u0456 \u0437\u0430\u043d\u044f\u0442\u0430\u0441\u0446\u044c.",
    title: "\u0421\u043a\u043b\u0430\u0434 \u043a\u0430\u043c\u0430\u043d\u0434\u044b",
    description: "\u0413\u044d\u0442\u044b\u044f \u0434\u0430\u0434\u0437\u0435\u043d\u044b\u044f \u0437\u0430\u0445\u043e\u045e\u0432\u0430\u044e\u0446\u0446\u0430 \u0440\u0430\u0437\u0430\u043c \u0437 \u043f\u043b\u0430\u043d\u0430\u043c \u0434\u043b\u044f \u0434\u0430\u043b\u0435\u0439\u0448\u044b\u0445 \u0456\u0442\u044d\u0440\u0430\u0446\u044b\u0439.",
    empty: "\u041f\u0430\u043a\u0443\u043b\u044c \u043d\u0456\u0445\u0442\u043e \u043d\u0435 \u0434\u0430\u0434\u0430\u0434\u0437\u0435\u043d\u044b.",
    nameLabel: "\u0406\u043c\u044f \u0440\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u0447\u044b\u043a\u0430",
    roleLabel: "\u0420\u043e\u043b\u044f",
    seniorityLabel: "\u0423\u0437\u0440\u043e\u0432\u0435\u043d\u044c",
    allocationLabel: "\u0417\u0430\u043d\u044f\u0442\u0430\u0441\u0446\u044c, %",
    addButton: "\u0414\u0430\u0434\u0430\u0446\u044c \u0440\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u0447\u044b\u043a\u0430",
    roles: {
      frontend: "\u0424\u0440\u0430\u043d\u0442\u044d\u043d\u0434",
      backend: "\u0411\u044d\u043a\u0435\u043d\u0434",
      fullstack: "\u0424\u0443\u043b\u0441\u0442\u044d\u043a",
      devops: "DevOps",
      qa: "QA",
      mobile: "\u041c\u0430\u0431\u0456\u043b\u044c\u043d\u0430\u044f \u0440\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u043a\u0430",
    },
    seniority: {
      junior: "Junior",
      middle: "Middle",
      senior: "Senior",
      lead: "Lead",
    },
  },
};

const QUESTIONNAIRE_OVERRIDES = {
  ru: {
    requiresDisasterRecovery: {
      label: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f \u043f\u043b\u0430\u043d DR / failover",
      helpText: "\u041f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0435\u0442, \u043d\u0443\u0436\u043d\u043e \u043b\u0438 \u0441\u0440\u0430\u0437\u0443 \u043f\u043b\u0430\u043d\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0432\u043e\u0441\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u0435 \u043f\u043e\u0441\u043b\u0435 \u0441\u0431\u043e\u0435\u0432.",
    },
    requiresComplianceTracking: {
      label: "\u041d\u0443\u0436\u0435\u043d \u043a\u043e\u043c\u043f\u043b\u0430\u0435\u043d\u0441-\u043a\u043e\u043d\u0442\u0443\u0440 (\u0430\u0443\u0434\u0438\u0442, \u0436\u0443\u0440\u043d\u0430\u043b\u044b)",
      helpText: "\u041e\u0442\u043c\u0435\u0442\u044c\u0442\u0435, \u0435\u0441\u043b\u0438 \u0432\u0430\u0436\u043d\u043e \u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0434\u043e\u043a\u0430\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u043e\u0441\u0442\u044c \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439 \u0438 \u0434\u043e\u0441\u0442\u0443\u043f\u0430.",
    },
    needsTwentyFourSevenSupport: {
      label: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f 24/7 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430",
      helpText: "\u0412\u043b\u0438\u044f\u0435\u0442 \u043d\u0430 \u0442\u0440\u0435\u0431\u043e\u0432\u0430\u043d\u0438\u044f \u043a \u043c\u043e\u043d\u0438\u0442\u043e\u0440\u0438\u043d\u0433\u0443 \u0438 on-call \u043f\u0440\u043e\u0446\u0435\u0441\u0441\u0430\u043c.",
    },
    incidentResponseHours: {
      label: "\u0426\u0435\u043b\u0435\u0432\u043e\u0435 \u0432\u0440\u0435\u043c\u044f \u0440\u0435\u0430\u043a\u0446\u0438\u0438 \u043d\u0430 \u0438\u043d\u0446\u0438\u0434\u0435\u043d\u0442 (\u0447\u0430\u0441\u044b)",
      helpText: "\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0435\u0442\u0441\u044f \u043a\u0430\u043a \u043e\u0440\u0438\u0435\u043d\u0442\u0438\u0440 \u0434\u043b\u044f \u043e\u043f\u0435\u0440\u0430\u0446\u0438\u043e\u043d\u043d\u043e\u0439 \u0433\u043e\u0442\u043e\u0432\u043d\u043e\u0441\u0442\u0438.",
    },
  },
  be: {
    requiresDisasterRecovery: {
      label: "\u041f\u0430\u0442\u0440\u044d\u0431\u043d\u044b \u043f\u043b\u0430\u043d DR / failover",
      helpText: "\u041f\u0430\u043a\u0430\u0437\u0432\u0430\u0435, \u0446\u0456 \u0442\u0440\u044d\u0431\u0430 \u0430\u0434\u0440\u0430\u0437\u0443 \u043f\u043b\u0430\u043d\u0430\u0432\u0430\u0446\u044c \u0430\u0434\u043d\u0430\u045e\u043b\u0435\u043d\u043d\u0435 \u043f\u0430\u0441\u043b\u044f \u0437\u0431\u043e\u044f\u045e.",
    },
    requiresComplianceTracking: {
      label: "\u041f\u0430\u0442\u0440\u044d\u0431\u0435\u043d \u043a\u0430\u043c\u043f\u043b\u0430\u0435\u043d\u0441-\u043a\u043e\u043d\u0442\u0443\u0440 (\u0430\u045e\u0434\u044b\u0442, \u0436\u0443\u0440\u043d\u0430\u043b\u044b)",
      helpText: "\u0410\u0434\u0437\u043d\u0430\u0447\u0446\u0435, \u043a\u0430\u043b\u0456 \u0432\u0430\u0436\u043d\u0430 \u0437\u0430\u0445\u043e\u045e\u0432\u0430\u0446\u044c \u0434\u043e\u043a\u0430\u0437\u043d\u0430\u0441\u0446\u044c \u0434\u0437\u0435\u044f\u043d\u043d\u044f\u045e \u0456 \u0434\u043e\u0441\u0442\u0443\u043f\u0443.",
    },
    needsTwentyFourSevenSupport: {
      label: "\u041f\u0430\u0442\u0440\u044d\u0431\u043d\u0430 24/7 \u043f\u0430\u0434\u0442\u0440\u044b\u043c\u043a\u0430",
      helpText: "\u0423\u043f\u043b\u044b\u0432\u0430\u0435 \u043d\u0430 \u043f\u0430\u0442\u0440\u0430\u0431\u0430\u0432\u0430\u043d\u043d\u0456 \u0434\u0430 \u043c\u0430\u043d\u0456\u0442\u043e\u0440\u044b\u043d\u0433\u0443 \u0456 on-call \u043f\u0440\u0430\u0446\u044d\u0441\u0430\u045e.",
    },
    incidentResponseHours: {
      label: "\u041c\u044d\u0442\u0430\u0432\u044b \u0447\u0430\u0441 \u0440\u044d\u0430\u043a\u0446\u044b\u0456 \u043d\u0430 \u0456\u043d\u0446\u044b\u0434\u044d\u043d\u0442 (\u0433\u0430\u0434\u0437\u0456\u043d\u044b)",
      helpText: "\u0412\u044b\u043a\u0430\u0440\u044b\u0441\u0442\u043e\u045e\u0432\u0430\u0435\u0446\u0446\u0430 \u044f\u043a \u0430\u0440\u044b\u0435\u043d\u0446\u0456\u0440 \u0434\u043b\u044f \u0430\u043f\u0435\u0440\u0430\u0446\u044b\u0439\u043d\u0430\u0439 \u0433\u0430\u0442\u043e\u045e\u043d\u0430\u0441\u0446\u0456.",
    },
  },
};

const MEMBER_ROLE_OPTIONS = ["frontend", "backend", "fullstack", "devops", "qa", "mobile"];
const MEMBER_SENIORITY_OPTIONS = ["junior", "middle", "senior", "lead"];

const EMPTY_MEMBER_DRAFT = {
  role: "frontend",
  seniority: "middle",
  allocation: 100,
};

export function QuestionnairePanel({
  canGeneratePlan,
  formValues,
  handleSubmit,
  isLoadingPlan,
  questionnaire,
  toggleFeature,
  updateField,
}) {
  const { getQuestionnaireField, language, t } = useI18n();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [memberDraft, setMemberDraft] = useState(EMPTY_MEMBER_DRAFT);

  const teamCopy = TEAM_STEP_COPY[language] || TEAM_STEP_COPY.ru;
  const memberList = Array.isArray(formValues.teamMembers) ? formValues.teamMembers : [];

  const steps = useMemo(() => {
    const questionMap = new Map(questionnaire.map((field) => [field.id, field]));

    return QUESTION_STEPS.map((step) => {
      if (step.custom && step.id === "team") {
        return {
          ...step,
          title: teamCopy.stepTitle,
          description: teamCopy.stepDescription,
          fields: [],
        };
      }

      return {
        ...step,
        title: t(`questionnaire.steps.${step.id}.title`),
        description: t(`questionnaire.steps.${step.id}.description`),
        fields: step.fields.map((fieldId) => questionMap.get(fieldId)).filter(Boolean),
      };
    }).filter((step) => step.custom || step.fields.length > 0);
  }, [questionnaire, t, teamCopy]);

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

  function getTeamRoleLabel(role) {
    return teamCopy.roles?.[role] || role;
  }

  function getTeamSeniorityLabel(seniority) {
    return teamCopy.seniority?.[seniority] || seniority;
  }

  function getLocalizedField(field) {
    const localized = getQuestionnaireField(field);
    const override = QUESTIONNAIRE_OVERRIDES[language]?.[field.id];

    if (!override) {
      return localized;
    }

    return {
      ...localized,
      ...override,
    };
  }

  function addTeamMember() {
    const nextMember = {
      role: memberDraft.role,
      seniority: memberDraft.seniority,
      allocation: Math.min(100, Math.max(0, Number(memberDraft.allocation) || 0)),
    };

    updateField("teamMembers", [...memberList, nextMember]);
    setMemberDraft(EMPTY_MEMBER_DRAFT);
  }

  function removeTeamMember(index) {
    const nextMembers = memberList.filter((_, entryIndex) => entryIndex !== index);
    updateField("teamMembers", nextMembers);
  }

  function renderTeamStep() {
    return (
      <div className="team-step">
        <div className="team-step-header">
          <h4>{teamCopy.title}</h4>
          <p>{teamCopy.description}</p>
        </div>

        {memberList.length === 0 ? (
          <p className="muted-text">{teamCopy.empty}</p>
        ) : (
          <div className="team-members-list">
            {memberList.map((member, index) => (
              <article key={`${member.role}-${member.seniority}-${member.allocation}-${index}`} className="team-member-card">
                <div>
                  <strong>Developer {index + 1}</strong>
                  <div className="team-member-meta">
                    <span>{getTeamRoleLabel(member.role)}</span>
                    <span>{getTeamSeniorityLabel(member.seniority)}</span>
                    <span>{member.allocation}%</span>
                  </div>
                </div>
                <button type="button" className="secondary-button" onClick={() => removeTeamMember(index)}>
                  {t("common.delete")}
                </button>
              </article>
            ))}
          </div>
        )}

        <div className="team-member-form">
          <label className="field">
            <span>{teamCopy.roleLabel}</span>
            <select
              value={memberDraft.role}
              onChange={(event) => setMemberDraft((current) => ({ ...current, role: event.target.value }))}
            >
              {MEMBER_ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {getTeamRoleLabel(role)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{teamCopy.seniorityLabel}</span>
            <select
              value={memberDraft.seniority}
              onChange={(event) => setMemberDraft((current) => ({ ...current, seniority: event.target.value }))}
            >
              {MEMBER_SENIORITY_OPTIONS.map((seniority) => (
                <option key={seniority} value={seniority}>
                  {getTeamSeniorityLabel(seniority)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{teamCopy.allocationLabel}</span>
            <input
              type="number"
              min={0}
              max={100}
              value={memberDraft.allocation}
              onChange={(event) =>
                setMemberDraft((current) => ({
                  ...current,
                  allocation: Number(event.target.value),
                }))
              }
            />
          </label>
          <div className="team-member-actions">
            <button type="button" className="primary-button" onClick={addTeamMember}>
              {teamCopy.addButton}
            </button>
          </div>
        </div>
      </div>
    );
  }

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

          {activeStep.id === "team"
            ? renderTeamStep()
            : activeStep.fields.map((field) => (
                <FieldRenderer
                  key={field.id}
                  field={getLocalizedField(field)}
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
