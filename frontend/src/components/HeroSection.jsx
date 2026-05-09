export function HeroSection({
  authMode,
  currentUser,
  isAuthenticated,
  isLoading,
  onLogin,
  onLogout,
  onSignup,
  user,
}) {
  return (
    <section className="hero">
      <div className="hero-topbar">
        <div>
          <p className="eyebrow">Course Project MVP</p>
          <h1>ArchitecturePlanner</h1>
        </div>

        <div className="auth-actions">
          {authMode === "configured" ? (
            isAuthenticated ? (
              <>
                <div className="user-pill">
                  <strong>{currentUser?.displayName || user?.name || user?.email || "Signed in"}</strong>
                  <span>{currentUser?.role ? `Role: ${currentUser.role}` : user?.email || "Authenticated session"}</span>
                </div>
                <button type="button" className="secondary-button" onClick={onLogout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <button type="button" className="secondary-button" onClick={onSignup} disabled={isLoading}>
                  Sign up
                </button>
                <button type="button" className="primary-button" onClick={onLogin} disabled={isLoading}>
                  {isLoading ? "Checking session..." : "Log in"}
                </button>
              </>
            )
          ) : (
            <div className="setup-pill">Auth0 setup required</div>
          )}
        </div>
      </div>

      <p className="hero-copy">
        Deterministic architecture generation for startups and small companies. Answer the questionnaire, sign in with
        Auth0, and get a stack recommendation, a development roadmap, and downloadable diagram artifacts.
      </p>

      {authMode === "not-configured" ? (
        <div className="info-box">
          <strong>Authentication is not configured yet.</strong>
          <span>
            Add the Auth0 environment variables from <code>frontend/.env.example</code> and <code>backend/.env.example</code> to
            enable registration, login, and protected API calls.
          </span>
        </div>
      ) : null}

      {authMode === "configured" && !isAuthenticated && !isLoading ? (
        <div className="info-box">
          <strong>Sign in is required to generate and save plans.</strong>
          <span>The questionnaire stays visible, but protected API calls are unlocked only after Auth0 login.</span>
        </div>
      ) : null}
    </section>
  );
}
