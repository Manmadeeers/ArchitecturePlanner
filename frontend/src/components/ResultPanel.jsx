import { PlanDetails } from "./PlanDetails";

export function ResultPanel({ error, planResponse }) {
  return (
    <section className="panel result-panel">
      <div className="panel-heading">
        <h2>Generated Result</h2>
        <p>The result includes summary, cost estimate, roadmap, and exportable diagram files.</p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      {!planResponse?.plan ? <EmptyState /> : <PlanDetails plan={planResponse.plan} />}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <p>Your generated architecture plan will appear here after submission.</p>
    </div>
  );
}
