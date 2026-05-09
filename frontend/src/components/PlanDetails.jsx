import { downloadDiagramPng, downloadDrawio } from "../utils/downloads";
import { useI18n } from "../i18n";

function buildSummaryCards(plan, helpers) {
  const { formatCurrency, getValueLabel, t } = helpers;

  return [
    { label: t("plan.architecture"), value: getValueLabel(plan.recommendation.architectureStyle) },
    { label: t("plan.deployment"), value: getValueLabel(plan.recommendation.deploymentModel) },
    { label: t("plan.monthlyCost"), value: formatCurrency(plan.cost.monthlyEstimate) },
    { label: t("plan.region"), value: getValueLabel(plan.regionProfile.code || plan.input.targetRegion) },
  ];
}

export function PlanDetails({ plan }) {
  const { formatCurrency, getComponentLabel, getPlanSummary, getValueLabel, t, translateFixedText } = useI18n();
  const summaryCards = buildSummaryCards(plan, { formatCurrency, getValueLabel, t });

  return (
    <div className="result-stack">
      <div className="summary-grid">
        {summaryCards.map((card) => (
          <article key={card.label} className="summary-card">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>

      <article className="narrative-card">
        <h3>{t("plan.recommendationSummary")}</h3>
        <p>{getPlanSummary(plan)}</p>
      </article>

      <article className="narrative-card">
        <h3>{t("plan.architectureComponents")}</h3>
        <div className="chip-grid">
          {plan.recommendation.components.map((component) => (
            <span key={component} className="chip">
              {getComponentLabel(component)}
            </span>
          ))}
        </div>
      </article>

      <article className="narrative-card">
        <h3>{t("plan.costEstimate")}</h3>
        <p>
          {t("plan.monthlyCostSentence", { value: formatCurrency(plan.cost.monthlyEstimate) })}
        </p>
        <div className="cost-grid">
          {Object.entries(plan.cost.breakdown).map(([key, value]) => (
            <div key={key} className="cost-line">
              <span>{getValueLabel(key)}</span>
              <strong>{formatCurrency(value)}</strong>
            </div>
          ))}
        </div>
      </article>

      <article className="narrative-card">
        <h3>{t("plan.developmentRoadmap")}</h3>
        <ul className="text-list">
          {plan.roadmap.map((item) => (
            <li key={item}>{translateFixedText(item)}</li>
          ))}
        </ul>
      </article>

      <article className="narrative-card">
        <h3>{t("plan.developmentPlan")}</h3>
        <ul className="text-list">
          {plan.developmentPlan.map((item) => (
            <li key={item.phase}>
              <strong>{translateFixedText(item.phase)}:</strong> {translateFixedText(item.title)}. {translateFixedText(item.outcome)}
            </li>
          ))}
        </ul>
      </article>

      <article className="narrative-card">
        <h3>{t("plan.regionNotes")}</h3>
        <ul className="text-list">
          {plan.regionProfile.notes.map((note) => (
            <li key={note}>{translateFixedText(note)}</li>
          ))}
        </ul>
      </article>

      {plan.recommendation.risks.length > 0 ? (
        <article className="narrative-card warning-card">
          <h3>{t("plan.risks")}</h3>
          <ul className="text-list">
            {plan.recommendation.risks.map((risk) => (
              <li key={risk}>{translateFixedText(risk)}</li>
            ))}
          </ul>
        </article>
      ) : null}

      <div className="button-row">
        <button type="button" className="secondary-button" onClick={() => downloadDrawio(plan)}>
          {t("plan.downloadDrawio")}
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            downloadDiagramPng(plan, {
              fallbackTitle: t("plan.pngTitleFallback"),
              translateFixedText,
            })
          }
        >
          {t("plan.downloadPng")}
        </button>
      </div>
    </div>
  );
}
