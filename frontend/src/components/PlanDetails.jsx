import { downloadDiagramPng, downloadDrawio } from "../utils/downloads";
import { readable } from "../utils/formatters";

function buildSummaryCards(plan) {
  return [
    { label: "Architecture", value: readable(plan.recommendation.architectureStyle) },
    { label: "Deployment", value: readable(plan.recommendation.deploymentModel) },
    { label: "Monthly Cost", value: `$${plan.cost.monthlyEstimate}` },
    { label: "Region", value: plan.regionProfile.label },
  ];
}

export function PlanDetails({ plan }) {
  const summaryCards = buildSummaryCards(plan);

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
        <h3>Recommendation summary</h3>
        <p>{plan.summary}</p>
      </article>

      <article className="narrative-card">
        <h3>Architecture components</h3>
        <div className="chip-grid">
          {plan.recommendation.components.map((component) => (
            <span key={component} className="chip">
              {readable(component)}
            </span>
          ))}
        </div>
      </article>

      <article className="narrative-card">
        <h3>Cost estimate</h3>
        <p>
          Estimated monthly infrastructure cost: <strong>${plan.cost.monthlyEstimate}</strong>
        </p>
        <div className="cost-grid">
          {Object.entries(plan.cost.breakdown).map(([key, value]) => (
            <div key={key} className="cost-line">
              <span>{readable(key)}</span>
              <strong>${value}</strong>
            </div>
          ))}
        </div>
      </article>

      <article className="narrative-card">
        <h3>Development roadmap</h3>
        <ul className="text-list">
          {plan.roadmap.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>

      <article className="narrative-card">
        <h3>Estimated development plan</h3>
        <ul className="text-list">
          {plan.developmentPlan.map((item) => (
            <li key={item.phase}>
              <strong>{item.phase}:</strong> {item.title}. {item.outcome}
            </li>
          ))}
        </ul>
      </article>

      <article className="narrative-card">
        <h3>Region notes</h3>
        <ul className="text-list">
          {plan.regionProfile.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </article>

      {plan.recommendation.risks.length > 0 ? (
        <article className="narrative-card warning-card">
          <h3>Risks</h3>
          <ul className="text-list">
            {plan.recommendation.risks.map((risk) => (
              <li key={risk}>{risk}</li>
            ))}
          </ul>
        </article>
      ) : null}

      <div className="button-row">
        <button type="button" className="secondary-button" onClick={() => downloadDrawio(plan)}>
          Download .drawio
        </button>
        <button type="button" className="secondary-button" onClick={() => downloadDiagramPng(plan)}>
          Download .png
        </button>
      </div>
    </div>
  );
}
