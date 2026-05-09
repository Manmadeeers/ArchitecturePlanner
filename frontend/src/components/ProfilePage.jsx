import { useI18n } from "../i18n";

export function ProfilePage({ currentUser, user, onViewProjects, projectsCount, isLoadingProjects }) {
  const { getRoleLabel, t } = useI18n();

  return (
    <section className="panel view-panel">
      <div className="panel-heading">
        <h2>{t("profile.title")}</h2>
        <p>{t("profile.description")}</p>
      </div>

      <div className="profile-grid">
        <article className="narrative-card">
          <h3>{t("profile.identity")}</h3>
          <dl className="detail-list">
            <div>
              <dt>{t("profile.displayName")}</dt>
              <dd>{currentUser?.displayName || user?.name || t("common.notProvided")}</dd>
            </div>
            <div>
              <dt>{t("profile.email")}</dt>
              <dd>{currentUser?.email || user?.email || t("common.notProvided")}</dd>
            </div>
            <div>
              <dt>{t("profile.role")}</dt>
              <dd>{getRoleLabel(currentUser?.role || "user")}</dd>
            </div>
          </dl>
        </article>

        <article className="narrative-card">
          <h3>{t("profile.linkedAccounts")}</h3>
          <dl className="detail-list">
            <div>
              <dt>{t("profile.localUserId")}</dt>
              <dd>{currentUser?.id ?? t("profile.notSyncedYet")}</dd>
            </div>
            <div>
              <dt>{t("profile.auth0Subject")}</dt>
              <dd>{currentUser?.auth0Sub || t("profile.notAvailable")}</dd>
            </div>
            <div>
              <dt>{t("profile.savedProjectsLoaded")}</dt>
              <dd>{projectsCount}</dd>
            </div>
          </dl>
        </article>
      </div>

      <div className="action-banner">
        <div>
          <strong>{t("profile.projectLibraryTitle")}</strong>
          <p>{t("profile.projectLibraryBody")}</p>
        </div>
        <button type="button" className="primary-button" onClick={onViewProjects} disabled={isLoadingProjects}>
          {isLoadingProjects ? t("profile.loadingProjects") : t("profile.viewAllProjects")}
        </button>
      </div>
    </section>
  );
}
