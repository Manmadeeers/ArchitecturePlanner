import { PlanDetails } from "./PlanDetails";

export function ResultPanel({ currentUser, error, isAuthenticated, isLoadingProfile, planResponse, recentPlans, user }) {
  return (
    <section className="panel result-panel">
      <div className="panel-heading">
        <h2>Generated Result</h2>
        <p>The result includes summary, cost estimate, roadmap, and exportable diagram files.</p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      {isAuthenticated ? <AccountCard currentUser={currentUser} isLoadingProfile={isLoadingProfile} user={user} /> : null}

      {recentPlans.length > 0 ? <RecentPlansCard recentPlans={recentPlans} /> : null}

      {!planResponse?.plan ? <EmptyState /> : <PlanDetails plan={planResponse.plan} />}
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
      <h3>Your saved projects</h3>
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
