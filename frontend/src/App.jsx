import { useAuth0 } from "@auth0/auth0-react";

import { isAuthConfigured } from "./auth-config";
import { HeroSection } from "./components/HeroSection";
import { QuestionnairePanel } from "./components/QuestionnairePanel";
import { ResultPanel } from "./components/ResultPanel";
import { usePlannerApp } from "./hooks/usePlannerApp";

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
            returnTo: window.location.origin,
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
  const planner = usePlannerApp({
    authMode,
    getAccessToken,
    isAuthenticated,
    isLoading,
  });

  return (
    <main className="page-shell">
      <HeroSection
        authMode={authMode}
        currentUser={planner.currentUser}
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
        onLogin={onLogin}
        onLogout={onLogout}
        onSignup={onSignup}
        user={user}
      />

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
          currentUser={planner.currentUser}
          error={planner.error}
          isAuthenticated={isAuthenticated}
          isLoadingProfile={planner.isLoadingProfile}
          planResponse={planner.planResponse}
          recentPlans={planner.recentPlans}
          summaryCards={planner.summaryCards}
          user={user}
        />
      </div>
    </main>
  );
}
