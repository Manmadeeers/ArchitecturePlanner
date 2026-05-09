import { startTransition, useEffect, useMemo, useState } from "react";

import { API_BASE_URL } from "../config/api";
import { defaultValues } from "../constants/planner";
import { normalizeCurrentUser, readable } from "../utils/formatters";

export function usePlannerApp({ authMode, getAccessToken, isAuthenticated, isLoading }) {
  const [questionnaire, setQuestionnaire] = useState([]);
  const [formValues, setFormValues] = useState(defaultValues);
  const [planResponse, setPlanResponse] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [recentPlans, setRecentPlans] = useState([]);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadQuestionnaire() {
      try {
        const response = await fetch(`${API_BASE_URL}/questionnaire`);
        const data = await response.json();
        setQuestionnaire(data.questionnaire || []);
      } catch (loadError) {
        setError("Could not load questionnaire definition from the API.");
      }
    }

    loadQuestionnaire();
  }, []);

  useEffect(() => {
    if (authMode !== "configured" || !isAuthenticated || !getAccessToken) {
      setCurrentUser(null);
      setRecentPlans([]);
      return;
    }

    async function loadProtectedData() {
      setIsLoadingProfile(true);

      try {
        const token = await getAccessToken();
        const [profileResponse, recentPlansResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/plans/recent`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const profileData = await profileResponse.json();
        const recentPlansData = await recentPlansResponse.json();

        if (!profileResponse.ok) {
          throw new Error(profileData.error || "Could not load the authenticated profile.");
        }

        if (!recentPlansResponse.ok) {
          throw new Error(recentPlansData.error || "Could not load recent plans.");
        }

        setCurrentUser(normalizeCurrentUser(profileData));
        setRecentPlans(recentPlansData.plans || []);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoadingProfile(false);
      }
    }

    loadProtectedData();
  }, [authMode, getAccessToken, isAuthenticated]);

  const summaryCards = useMemo(() => {
    if (!planResponse?.plan) {
      return [];
    }

    const plan = planResponse.plan;

    return [
      { label: "Architecture", value: readable(plan.recommendation.architectureStyle) },
      { label: "Deployment", value: readable(plan.recommendation.deploymentModel) },
      { label: "Monthly Cost", value: `$${plan.cost.monthlyEstimate}` },
      { label: "Region", value: plan.regionProfile.label },
    ];
  }, [planResponse]);

  const isAuthReady = authMode === "configured";
  const canGeneratePlan = isAuthReady && isAuthenticated && !isLoading;

  async function submitPlan() {
    const token = await getAccessToken();
    const response = await fetch(`${API_BASE_URL}/plans/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formValues),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(Array.isArray(data.details) ? data.details.join(", ") : data.error || "Failed to generate plan");
    }

    startTransition(() => {
      setPlanResponse(data);
    });

    return token;
  }

  async function refreshRecentPlans(token) {
    const recentPlansResponse = await fetch(`${API_BASE_URL}/plans/recent`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const recentPlansData = await recentPlansResponse.json();

    if (recentPlansResponse.ok) {
      setRecentPlans(recentPlansData.plans || []);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!canGeneratePlan || !getAccessToken) {
      setError(
        isAuthReady
          ? "Sign in before generating an architecture plan."
          : "Auth0 is not configured yet. Add the frontend and backend Auth0 environment variables first.",
      );
      return;
    }

    setIsLoadingPlan(true);
    setError("");

    try {
      const token = await submitPlan();
      await refreshRecentPlans(token);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsLoadingPlan(false);
    }
  }

  function updateField(id, value) {
    setFormValues((current) => ({
      ...current,
      [id]: value,
    }));
  }

  function toggleFeature(feature) {
    setFormValues((current) => {
      const alreadySelected = current.coreFeatures.includes(feature);

      return {
        ...current,
        coreFeatures: alreadySelected
          ? current.coreFeatures.filter((entry) => entry !== feature)
          : [...current.coreFeatures, feature],
      };
    });
  }

  return {
    canGeneratePlan,
    currentUser,
    error,
    formValues,
    handleSubmit,
    isAuthReady,
    isLoadingPlan,
    isLoadingProfile,
    planResponse,
    questionnaire,
    recentPlans,
    summaryCards,
    toggleFeature,
    updateField,
  };
}
