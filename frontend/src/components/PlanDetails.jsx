import { downloadDiagramSvg, downloadDrawio } from "../utils/downloads";
import { useI18n } from "../i18n";

const RESULT_COPY = {
  selectedTechnologies: "Selected stack",
  other: "Other",
  weeks: "weeks",
  exit: "Exit criteria",
  decisionPrefix: {
    architecture: "Architecture",
    deployment: "Deployment",
    teamLevel: "Team capability",
    costProfile: "Budget profile",
    teamMembers: "Team members",
  },
};

function buildSummaryCards(plan, helpers) {
  const { formatCurrency, getValueLabel, t } = helpers;

  return [
    { label: t("plan.architecture"), value: getValueLabel(plan.recommendation.architectureStyle) },
    { label: t("plan.deployment"), value: getValueLabel(plan.recommendation.deploymentModel) },
    { label: t("plan.monthlyCost"), value: formatCurrency(plan.cost.monthlyEstimate) },
    { label: t("plan.region"), value: getValueLabel(plan.regionProfile.code || plan.input.targetRegion) },
  ];
}

function buildDecisionPoints(plan, helpers, copy) {
  const { getValueLabel } = helpers;
  const points = [
    `${copy.decisionPrefix.architecture}: ${getValueLabel(plan.recommendation.architectureStyle)}`,
    `${copy.decisionPrefix.deployment}: ${getValueLabel(plan.recommendation.deploymentModel)}`,
    `${copy.decisionPrefix.teamLevel}: ${getValueLabel(plan.input.teamTechnicalLevel)}`,
    `${copy.decisionPrefix.costProfile}: ${getValueLabel(plan.recommendation.costProfile)}`,
  ];

  if (Array.isArray(plan.input.teamMembers) && plan.input.teamMembers.length > 0) {
    points.push(`${copy.decisionPrefix.teamMembers}: ${plan.input.teamMembers.length}`);
  }

  return points;
}

function normalizeDevelopmentPhases(plan) {
  if (!Array.isArray(plan.developmentPlan)) {
    return [];
  }

  return plan.developmentPlan.map((phase, index) => ({
    id: `${phase.phase || phase.title || "phase"}-${index}`,
    phase: phase.phase || `Phase ${index + 1}`,
    title: phase.title || "Execution phase",
    outcome: phase.outcome || "",
    durationWeeks: Number.isFinite(Number(phase.durationWeeks)) ? Number(phase.durationWeeks) : null,
    deliverables: Array.isArray(phase.deliverables) ? phase.deliverables : [],
    exitCriteria: phase.exitCriteria || "",
  }));
}

function mapRoadmapTimeline(roadmapItems) {
  if (!Array.isArray(roadmapItems)) {
    return [];
  }

  return roadmapItems.map((item, index) => {
    const text = String(item || "").trim();
    const splitIndex = text.indexOf(":");

    if (splitIndex > 0) {
      return {
        id: `roadmap-${index}`,
        badge: text.slice(0, splitIndex).trim(),
        detail: text.slice(splitIndex + 1).trim(),
      };
    }

    return {
      id: `roadmap-${index}`,
      badge: `Step ${index + 1}`,
      detail: text,
    };
  });
}

function groupTechnologiesByCategory(technologies, copy) {
  const grouped = new Map();

  for (const technology of technologies || []) {
    const key = technology.categoryName || technology.category || copy.other;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(technology);
  }

  return Array.from(grouped.entries());
}

export function PlanDetails({ plan }) {
  const { formatCurrency, getPlanSummary, getValueLabel, t, translateFixedText } = useI18n();
  const copy = RESULT_COPY;
  const summaryCards = buildSummaryCards(plan, { formatCurrency, getValueLabel, t });
  const decisionPoints = buildDecisionPoints(plan, { getValueLabel }, copy);
  const developmentPhases = normalizeDevelopmentPhases(plan);
  const roadmapTimeline = mapRoadmapTimeline(plan.roadmap);
  const costEntries = Object.entries(plan.cost.breakdown || {});
  const technologyGroups = groupTechnologiesByCategory(plan.technologies, copy);
  const totalCost = costEntries.reduce((sum, [, value]) => sum + Number(value || 0), 0);

  return (
    <div className="result-stack observatory-stack">
      <header className="plan-command-header">
        <div>
          <p className="plan-command-eyebrow">Architecture Command Center</p>
          <h3>{plan.input.projectName || t("plan.diagramTitleFallback")}</h3>
        </div>
        <p>{t("plan.monthlyCostSentence", { value: formatCurrency(plan.cost.monthlyEstimate) })}</p>
      </header>

      <div className="summary-grid plan-signal-grid">
        {summaryCards.map((card, index) => (
          <article key={card.label} className="summary-card signal-card">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>Signal {index + 1}</small>
          </article>
        ))}
      </div>

      <div className="observability-grid">
        <article className="narrative-card decision-card observability-card">
          <h3>{t("plan.recommendationSummary")}</h3>
          <p>{getPlanSummary(plan)}</p>
          <div className="decision-pill-grid">
            {decisionPoints.map((point) => (
              <span key={point} className="decision-pill">
                {point}
              </span>
            ))}
          </div>
        </article>

        <article className="narrative-card observability-card">
          <h3>{t("plan.costEstimate")}</h3>
          <div className="cost-bars">
            {costEntries.map(([key, value]) => {
              const numericValue = Number(value || 0);
              const percent = totalCost > 0 ? Math.max(3, Math.round((numericValue / totalCost) * 100)) : 0;

              return (
                <div key={key} className="cost-bar-row">
                  <div className="cost-bar-labels">
                    <span>{getValueLabel(key)}</span>
                    <strong>{formatCurrency(numericValue)}</strong>
                  </div>
                  <div className="cost-bar-track" aria-hidden="true">
                    <div className="cost-bar-fill" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <ul className="text-list compact-list metric-assumption-list">
            {(plan.cost.assumptions || []).map((assumption) => (
              <li key={assumption}>{translateFixedText(assumption)}</li>
            ))}
          </ul>
        </article>
      </div>

      <article className="narrative-card observability-card">
        <h3>{copy.selectedTechnologies}</h3>
        {technologyGroups.length > 0 ? (
          <div className="stack-layer-grid">
            {technologyGroups.map(([category, technologies]) => (
              <section key={category} className="stack-layer-card">
                <h4>{category}</h4>
                <div className="technology-list">
                  {technologies.map((technology) => (
                    <div key={`${technology.technologyId}-${technology.name}`} className="technology-card">
                      <strong>{technology.name}</strong>
                      <p>{translateFixedText(technology.justification || "")}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <p className="muted-text">{copy.other}</p>
        )}
      </article>

      <article className="narrative-card observability-card">
        <h3>{t("plan.developmentRoadmap")}</h3>
        <ol className="roadmap-timeline">
          {roadmapTimeline.map((entry) => (
            <li key={entry.id} className="roadmap-item">
              <span className="roadmap-badge">{translateFixedText(entry.badge)}</span>
              <p>{translateFixedText(entry.detail)}</p>
            </li>
          ))}
        </ol>
      </article>

      <article className="narrative-card observability-card">
        <h3>{t("plan.developmentPlan")}</h3>
        <div className="phase-grid">
          {developmentPhases.map((phase) => (
            <section key={phase.id} className="phase-card delivery-card">
              <div className="phase-head">
                <strong>{translateFixedText(phase.phase)}</strong>
                {phase.durationWeeks ? (
                  <span>
                    {phase.durationWeeks} {copy.weeks}
                  </span>
                ) : null}
              </div>
              <h4>{translateFixedText(phase.title)}</h4>
              {phase.outcome ? <p>{translateFixedText(phase.outcome)}</p> : null}
              {phase.deliverables.length > 0 ? (
                <ul className="text-list compact-list">
                  {phase.deliverables.map((deliverable) => (
                    <li key={`${phase.id}-${deliverable}`}>{translateFixedText(deliverable)}</li>
                  ))}
                </ul>
              ) : null}
              {phase.exitCriteria ? (
                <p className="phase-exit">
                  {copy.exit}: {translateFixedText(phase.exitCriteria)}
                </p>
              ) : null}
            </section>
          ))}
        </div>
      </article>

      <div className="observability-grid">
        <article className="narrative-card observability-card">
          <h3>{t("plan.regionNotes")}</h3>
          <ul className="text-list">
            {(plan.regionProfile.notes || []).map((note) => (
              <li key={note}>{translateFixedText(note)}</li>
            ))}
          </ul>
        </article>

        {plan.recommendation.risks.length > 0 ? (
          <article className="narrative-card warning-card observability-card">
            <h3>{t("plan.risks")}</h3>
            <ul className="text-list">
              {plan.recommendation.risks.map((risk) => (
                <li key={risk}>{translateFixedText(risk)}</li>
              ))}
            </ul>
          </article>
        ) : (
          <article className="narrative-card observability-card">
            <h3>{t("plan.risks")}</h3>
            <p className="muted-text">No critical risk flags for the current input snapshot.</p>
          </article>
        )}
      </div>

      <div className="button-row result-export-row">
        <button type="button" className="secondary-button" onClick={() => downloadDrawio(plan)}>
          {t("plan.downloadDrawio")}
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            downloadDiagramSvg(plan, {
              fallbackTitle: t("plan.diagramTitleFallback"),
              translateFixedText,
            })
          }
        >
          {t("plan.downloadSvg")}
        </button>
      </div>
    </div>
  );
}
