export function ProfilePage({ currentUser, user, onViewProjects, projectsCount, isLoadingProjects }) {
  return (
    <section className="panel view-panel">
      <div className="panel-heading">
        <h2>Your Profile</h2>
        <p>Review the backend-linked user record and open the full project library for this account.</p>
      </div>

      <div className="profile-grid">
        <article className="narrative-card">
          <h3>Identity</h3>
          <dl className="detail-list">
            <div>
              <dt>Display name</dt>
              <dd>{currentUser?.displayName || user?.name || "Not provided"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{currentUser?.email || user?.email || "Not provided"}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{currentUser?.role || "user"}</dd>
            </div>
          </dl>
        </article>

        <article className="narrative-card">
          <h3>Linked accounts</h3>
          <dl className="detail-list">
            <div>
              <dt>Local user id</dt>
              <dd>{currentUser?.id ?? "Not synced yet"}</dd>
            </div>
            <div>
              <dt>Auth0 subject</dt>
              <dd>{currentUser?.auth0Sub || "Not available"}</dd>
            </div>
            <div>
              <dt>Saved projects loaded</dt>
              <dd>{projectsCount}</dd>
            </div>
          </dl>
        </article>
      </div>

      <div className="action-banner">
        <div>
          <strong>Project library</strong>
          <p>Open every project saved for this authenticated user and inspect any project in full detail.</p>
        </div>
        <button type="button" className="primary-button" onClick={onViewProjects} disabled={isLoadingProjects}>
          {isLoadingProjects ? "Loading projects..." : "View all projects"}
        </button>
      </div>
    </section>
  );
}
