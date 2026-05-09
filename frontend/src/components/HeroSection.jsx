import { useEffect, useRef, useState } from "react";
import { LANGUAGE_OPTIONS, useI18n } from "../i18n";

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
  const { language, setLanguage, t } = useI18n();
  const profileName = currentUser?.displayName || user?.name || user?.email || t("common.signedIn");
  const profileSubtitle = currentUser?.email || user?.email || t("hero.profileSubtitle");
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
          <p className="eyebrow">{t("hero.eyebrow")}</p>
          <div className="hero-brand-row">
            <h1>ArchitecturePlanner</h1>
            <span className="header-badge">
              {activeView === "projects"
                ? t("views.projects")
                : activeView === "profile"
                  ? t("views.profile")
                  : activeView === "admin"
                    ? t("views.admin")
                    : t("views.planner")}
            </span>
          </div>
          <p className="hero-copy">{t("hero.copy")}</p>
        </div>

        <div className="toolbar-actions">
          {authMode === "configured" && isAuthenticated ? (
            <button
              type="button"
              className={`profile-trigger ${activeView === "profile" ? "profile-trigger-active" : ""}`}
              onClick={handleMenuAction(onOpenProfile)}
              aria-label={t("hero.openProfileAria", { name: profileName })}
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
              aria-label={t("hero.openMenuAria")}
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
                  <span className="menu-section-label">{t("common.theme")}</span>
                  <button
                    type="button"
                    className="theme-toggle theme-toggle-menu"
                    onClick={handleMenuAction(onToggleTheme)}
                    aria-label={`${t("common.theme")}: ${theme === "dark" ? t("common.light") : t("common.dark")}`}
                  >
                    <span className="theme-toggle-track">
                      <span className={`theme-toggle-thumb theme-toggle-thumb-${theme}`} />
                    </span>
                    <span className="theme-toggle-copy">
                      <strong>{theme === "dark" ? t("common.dark") : t("common.light")}</strong>
                      <span>{t("common.theme")}</span>
                    </span>
                  </button>
                </div>

                <div className="menu-section">
                  <span className="menu-section-label">{t("common.language")}</span>
                  <div className="language-switcher" role="group" aria-label={t("common.language")}>
                    {LANGUAGE_OPTIONS.map((option) => (
                      <button
                        key={option.code}
                        type="button"
                        className={`language-button ${language === option.code ? "language-button-active" : ""}`}
                        onClick={handleMenuAction(() => setLanguage(option.code))}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {authMode === "configured" ? (
                  isAuthenticated ? (
                    <>
                      <div className="menu-section menu-profile-summary">
                        <span className="menu-section-label">{t("common.signedIn")}</span>
                        <strong>{profileName}</strong>
                        <span>{profileSubtitle}</span>
                      </div>

                      <div className="menu-section">
                        <span className="menu-section-label">{t("common.workspace")}</span>
                        {isAdmin ? (
                          <button
                            type="button"
                            className="menu-action-button"
                            role="menuitem"
                            onClick={handleMenuAction(onOpenAdmin)}
                            disabled={activeView === "admin"}
                          >
                            {t("hero.openAdminPanel")}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="menu-action-button"
                          role="menuitem"
                          onClick={handleMenuAction(onNavigateHome)}
                          disabled={activeView === "planner"}
                        >
                          {t("hero.backToPlanner")}
                        </button>
                        <button
                          type="button"
                          className="menu-action-button"
                          role="menuitem"
                          onClick={handleMenuAction(onLogout)}
                        >
                          {t("hero.logout")}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="menu-section">
                      <span className="menu-section-label">{t("common.authentication")}</span>
                      <button
                        type="button"
                        className="menu-action-button"
                        role="menuitem"
                        onClick={handleMenuAction(onSignup)}
                        disabled={isLoading}
                      >
                        {t("hero.signUp")}
                      </button>
                      <button
                        type="button"
                        className="menu-action-button menu-action-button-primary"
                        role="menuitem"
                        onClick={handleMenuAction(onLogin)}
                        disabled={isLoading}
                      >
                        {isLoading ? t("hero.checkingSession") : t("hero.logIn")}
                      </button>
                    </div>
                  )
                ) : (
                  <div className="menu-section">
                    <span className="menu-section-label">{t("common.authentication")}</span>
                    <div className="menu-status">{t("hero.authSetupRequired")}</div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {authMode === "not-configured" ? (
        <div className="info-box">
          <strong>{t("hero.authNotConfiguredTitle")}</strong>
          <span>
            {t("hero.authNotConfiguredBody")}
          </span>
        </div>
      ) : null}

      {authMode === "configured" && !isAuthenticated && !isLoading ? (
        <div className="info-box">
          <strong>{t("hero.signInRequiredTitle")}</strong>
          <span>{t("hero.signInRequiredBody")}</span>
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
