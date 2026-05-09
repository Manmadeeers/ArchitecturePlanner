import { useEffect, useRef, useState } from "react";

export function HeroSection({
  activeView,
  authMode,
  currentUser,
  isAdmin,
  isAuthenticated,
  isLoading,
  onLogin,
  onOpenAdmin,
  onNavigateHome,
  onLogout,
  onOpenProfile,
  onSignup,
  onToggleTheme,
  theme,
  user,
}) {
  const profileName = currentUser?.displayName || user?.name || user?.email || "Signed in";
  const profileSubtitle = currentUser?.email || user?.email || "Open profile and saved projects";
  const profileInitials = getInitials(profileName);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handleMenuAction(action) {
    return () => {
      setIsMenuOpen(false);
      action?.();
    };
  }

  return (
    <section className="hero">
      <div className="hero-topbar">
        <div className="hero-brand">
          <p className="eyebrow">Professional architecture planning workspace</p>
          <div className="hero-brand-row">
            <h1>ArchitecturePlanner</h1>
            <span className="header-badge">
              {activeView === "projects"
                ? "Project Library"
                : activeView === "profile"
                  ? "Profile"
                  : activeView === "admin"
                    ? "Admin"
                    : "Planner"}
            </span>
          </div>
          <p className="hero-copy">
            Deterministic architecture planning for startups and small companies. Capture project constraints, review
            infrastructure recommendations, and keep a clean saved-project history under each authenticated account.
          </p>
        </div>

        <div className="toolbar-actions">
          {authMode === "configured" && isAuthenticated ? (
            <button
              type="button"
              className={`profile-trigger ${activeView === "profile" ? "profile-trigger-active" : ""}`}
              onClick={handleMenuAction(onOpenProfile)}
              aria-label={`Open profile for ${profileName}`}
              title={profileName}
            >
              <span className="profile-avatar" aria-hidden="true">
                {profileInitials}
              </span>
            </button>
          ) : null}

          <div className="menu-shell" ref={menuRef}>
            <button
              type="button"
              className={`menu-trigger ${isMenuOpen ? "menu-trigger-open" : ""}`}
              aria-expanded={isMenuOpen}
              aria-label="Open workspace menu"
              onClick={() => setIsMenuOpen((currentState) => !currentState)}
            >
              <span className="menu-trigger-glyph" aria-hidden="true">
                <span className="menu-trigger-bar" />
                <span className="menu-trigger-bar" />
                <span className="menu-trigger-bar" />
              </span>
            </button>

            {isMenuOpen ? (
              <div className="menu-panel" role="menu">
                <div className="menu-section">
                  <span className="menu-section-label">Appearance</span>
                  <button
                    type="button"
                    className="theme-toggle theme-toggle-menu"
                    onClick={handleMenuAction(onToggleTheme)}
                    aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                  >
                    <span className="theme-toggle-track">
                      <span className={`theme-toggle-thumb theme-toggle-thumb-${theme}`} />
                    </span>
                    <span className="theme-toggle-copy">
                      <strong>{theme === "dark" ? "Dark" : "Light"}</strong>
                      <span>Theme</span>
                    </span>
                  </button>
                </div>

                {authMode === "configured" ? (
                  isAuthenticated ? (
                    <>
                      <div className="menu-section menu-profile-summary">
                        <span className="menu-section-label">Signed in</span>
                        <strong>{profileName}</strong>
                        <span>{profileSubtitle}</span>
                      </div>

                      <div className="menu-section">
                        <span className="menu-section-label">Workspace</span>
                        {isAdmin ? (
                          <button
                            type="button"
                            className="menu-action-button"
                            role="menuitem"
                            onClick={handleMenuAction(onOpenAdmin)}
                            disabled={activeView === "admin"}
                          >
                            Open admin panel
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="menu-action-button"
                          role="menuitem"
                          onClick={handleMenuAction(onNavigateHome)}
                          disabled={activeView === "planner"}
                        >
                          Back to planner
                        </button>
                        <button
                          type="button"
                          className="menu-action-button"
                          role="menuitem"
                          onClick={handleMenuAction(onLogout)}
                        >
                          Log out
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="menu-section">
                      <span className="menu-section-label">Authentication</span>
                      <button
                        type="button"
                        className="menu-action-button"
                        role="menuitem"
                        onClick={handleMenuAction(onSignup)}
                        disabled={isLoading}
                      >
                        Sign up
                      </button>
                      <button
                        type="button"
                        className="menu-action-button menu-action-button-primary"
                        role="menuitem"
                        onClick={handleMenuAction(onLogin)}
                        disabled={isLoading}
                      >
                        {isLoading ? "Checking session..." : "Log in"}
                      </button>
                    </div>
                  )
                ) : (
                  <div className="menu-section">
                    <span className="menu-section-label">Authentication</span>
                    <div className="menu-status">Auth0 setup required before protected actions can be used.</div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

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

function getInitials(value) {
  return String(value)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "AP";
}
