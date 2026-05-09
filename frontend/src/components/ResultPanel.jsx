import { downloadDiagramPng, downloadDrawio } from "../utils/downloads";
import { readable } from "../utils/formatters";

export function ResultPanel({
  currentUser,
  error,
  isAuthenticated,
  isLoadingProfile,
  planResponse,
  recentPlans,
  summaryCards,
  user,
}) {
  return (
    <section className="panel result-panel">
      <div className="panel-heading">
        <h2>Generated Result</h2>
        <p>The result includes summary, cost estimate, roadmap, and exportable diagram files.</p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      {isAuthenticated ? <AccountCard currentUser={currentUser} isLoadingProfile={isLoadingProfile} user={user} /> : null}

      {recentPlans.length > 0 ? <RecentPlansCard recentPlans={recentPlans} /> : null}

      {!planResponse?.plan ? <EmptyState /> : <PlanResultContent plan={planResponse.plan} summaryCards={summaryCards} />}
    </section>
  );
}

function AccountCard({ currentUser, isLoadingProfile, user }) {
  return (
    <article className="narrative-card account-card">
      <h3>Authenticated session</h3>
      {isLoadingProfile ? (
        <p>Syncing your Auth0 session with the backend...</p>
      ) : (
        <div className="account-meta">
          <span>{currentUser?.email || user?.email || "No email returned by Auth0"}</span>
          <span>{currentUser?.auth0Sub || "No Auth0 subject available"}</span>
        </div>
      )}
    </article>
  );
}

function RecentPlansCard({ recentPlans }) {
  return (
    <article className="narrative-card">
      <h3>Recent saved plans</h3>
      <ul className="text-list">
        {recentPlans.map((plan) => (
          <li key={plan.id}>
            <strong>{plan.projectName}</strong> created on {new Date(plan.createdAt).toLocaleString()}
          </li>
        ))}
      </ul>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <p>Your generated architecture plan will appear here after submission.</p>
    </div>
  );
}

function PlanResultContent({ plan, summaryCards }) {
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
