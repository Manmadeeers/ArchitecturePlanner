import { useAuth0 } from "@auth0/auth0-react";

import { auth0Config, isAuthConfigured } from "./auth-config";
import { AdminPanel } from "./components/AdminPanel";
import { HeroSection } from "./components/HeroSection";
import { ProfilePage } from "./components/ProfilePage";
import { ProjectsPage } from "./components/ProjectsPage";
import { QuestionnairePanel } from "./components/QuestionnairePanel";
import { ResultPanel } from "./components/ResultPanel";
import { usePlannerApp } from "./hooks/usePlannerApp";
import { useI18n } from "./i18n";
import { useThemePreference } from "./hooks/useThemePreference";

export default function App() {
  return isAuthConfigured ? <AuthenticatedApp /> : <UnauthenticatedApp />;
}

function AuthenticatedApp() {
  const { getAccessTokenSilently, isAuthenticated, isLoading, loginWithRedirect, logout, user } = useAuth0();

  return (
    <PlannerPage
      authMode="configured"
      getAccessToken={getAccessTokenSilently}
      isAuthenticated={isAuthenticated}
      isLoading={isLoading}
      onLogin={() => loginWithRedirect()}
      onLogout={() =>
        logout({
          logoutParams: {
            returnTo: auth0Config.logoutReturnTo,
          },
        })
      }
      onSignup={() =>
        loginWithRedirect({
          authorizationParams: {
            screen_hint: "signup",
          },
        })
      }
      user={user || null}
    />
  );
}

function UnauthenticatedApp() {
  return (
    <PlannerPage
      authMode="not-configured"
      getAccessToken={null}
      isAuthenticated={false}
      isLoading={false}
      onLogin={null}
      onLogout={null}
      onSignup={null}
      user={null}
    />
  );
}

function PlannerPage({ authMode, getAccessToken, isAuthenticated, isLoading, onLogin, onLogout, onSignup, user }) {
  const { t } = useI18n();
  const { theme, toggleTheme } = useThemePreference();
  const planner = usePlannerApp({
    authMode,
    authUser: user,
    getAccessToken,
    isAuthenticated,
    isLoading,
  });

  return (
    <main className="page-shell">
      <HeroSection
        activeView={planner.activeView}
        authMode={authMode}
        currentUser={planner.currentUser}
        isAdmin={planner.isAdmin}
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
        onLogin={onLogin}
        onOpenAdmin={planner.showAdminView}
        onNavigateHome={planner.showPlannerView}
        onLogout={onLogout}
        onOpenProfile={planner.showProfileView}
        onSignup={onSignup}
        onToggleTheme={toggleTheme}
        theme={theme}
        user={user}
      />

      {authMode === "configured" && !isAuthenticated ? (
        <AuthRequiredPanel
          isLoading={isLoading}
          onLogin={onLogin}
          onSignup={onSignup}
          t={t}
        />
      ) : planner.activeView === "profile" ? (
        <ProfilePage
          currentUser={planner.currentUser}
          isLoadingProjects={planner.isLoadingProjects}
          onViewProjects={planner.showProjectsView}
          projectsCount={planner.projects.length}
          user={user}
        />
      ) : planner.activeView === "admin" ? (
        <AdminPanel
          adminAnalytics={planner.adminAnalytics}
          adminTechnologyCategories={planner.adminTechnologyCategories}
          adminTechnologies={planner.adminTechnologies}
          adminUsers={planner.adminUsers}
          onCreateTechnology={planner.createAdminTechnology}
          onDeleteTechnology={planner.deleteAdminTechnology}
          currentUser={planner.currentUser}
          onDeleteUser={planner.deleteAdminUser}
          onSaveUserProfile={planner.saveAdminUserProfile}
          onUpdateTechnology={planner.updateAdminTechnology}
          engineSettingsDraft={planner.engineSettingsDraft}
          engineSettingsRecord={planner.engineSettingsRecord}
          error={planner.error}
          isDownloadingAdminReport={planner.isDownloadingAdminReport}
          isLoadingAdmin={planner.isLoadingAdmin}
          isSavingEngineSettings={planner.isSavingEngineSettings}
          onDownloadAdminReport={planner.downloadAdminAnalyticsReport}
          technologyDeleteInFlightId={planner.technologyDeleteInFlightId}
          technologySaveInFlightId={planner.technologySaveInFlightId}
          onChangeUserRole={planner.changeAdminUserRole}
          onSaveEngineSettings={planner.saveEngineSettings}
          onUpdateEngineBaseCost={planner.updateEngineBaseCost}
          onUpdateEngineCostValue={planner.updateEngineCostValue}
          onUpdateEngineRegionMultiplier={planner.updateEngineRegionMultiplier}
          onUpdateRoadmapRule={planner.updateRoadmapRule}
          userDeleteInFlightId={planner.userDeleteInFlightId}
          userSaveInFlightId={planner.userSaveInFlightId}
          roleUpdateInFlightId={planner.roleUpdateInFlightId}
        />
      ) : planner.activeView === "projects" ? (
        <ProjectsPage
          error={planner.error}
          isLoadingProjects={planner.isLoadingProjects}
          isLoadingSelectedProject={planner.isLoadingSelectedProject}
          onDeleteProject={planner.deleteProject}
          onSelectProject={planner.selectProject}
          projectDeleteInFlightId={planner.projectDeleteInFlightId}
          projects={planner.projects}
          selectedProject={planner.selectedProject}
        />
      ) : (
        <div className="layout">
          <QuestionnairePanel
            canGeneratePlan={planner.canGeneratePlan}
            formValues={planner.formValues}
            handleSubmit={planner.handleSubmit}
            isLoadingPlan={planner.isLoadingPlan}
            questionnaire={planner.questionnaire}
            toggleFeature={planner.toggleFeature}
            updateField={planner.updateField}
          />

          <ResultPanel
            error={planner.error}
            planResponse={planner.planResponse}
          />
        </div>
      )}
    </main>
  );
}

function AuthRequiredPanel({ isLoading, onLogin, onSignup, t }) {
  return (
    <section className="panel auth-gate-panel">
      <div className="panel-heading">
        <h2>{t("hero.signInRequiredTitle")}</h2>
        <p>{t("hero.signInRequiredBody")}</p>
      </div>
      <div className="button-row">
        <button
          type="button"
          className="secondary-button"
          onClick={onSignup}
          disabled={isLoading}
        >
          {t("hero.signUp")}
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={onLogin}
          disabled={isLoading}
        >
          {isLoading ? t("hero.checkingSession") : t("hero.logIn")}
        </button>
      </div>
    </section>
  );
}
