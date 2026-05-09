import { startTransition, useEffect, useState } from "react";

import { API_BASE_URL } from "../config/api";
import { defaultValues } from "../constants/planner";
import { normalizeCurrentUser } from "../utils/formatters";

const defaultSelectedProject = {
  plan: null,
  savedPlan: null,
};

export function usePlannerApp({ authMode, getAccessToken, isAuthenticated, isLoading }) {
  const [activeView, setActiveView] = useState("planner");
  const [questionnaire, setQuestionnaire] = useState([]);
  const [formValues, setFormValues] = useState(defaultValues);
  const [planResponse, setPlanResponse] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [recentPlans, setRecentPlans] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(defaultSelectedProject);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingSelectedProject, setIsLoadingSelectedProject] = useState(false);
  const [error, setError] = useState("");

  async function fetchJson(path, options = {}) {
    const token = options.token || (await getAccessToken?.());

    if (!token) {
      throw new Error("Sign in before accessing protected project data.");
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(Array.isArray(data.details) ? data.details.join(", ") : data.error || "The request failed.");
    }

    return { data, token };
  }

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
      setActiveView("planner");
      setCurrentUser(null);
      setRecentPlans([]);
      setProjects([]);
      setSelectedProject(defaultSelectedProject);
      return;
    }

    async function loadProtectedData() {
      setIsLoadingProfile(true);

      try {
        const token = await getAccessToken();
        const [profileResult, recentPlansResult] = await Promise.all([
          fetchJson("/auth/me", { token }),
          fetchJson("/plans/recent", { token }),
        ]);

        setCurrentUser(normalizeCurrentUser(profileResult.data));
        setRecentPlans(recentPlansResult.data.plans || []);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoadingProfile(false);
      }
    }

    loadProtectedData();
  }, [authMode, getAccessToken, isAuthenticated]);

  const isAuthReady = authMode === "configured";
  const canGeneratePlan = isAuthReady && isAuthenticated && !isLoading;

  async function submitPlan() {
    const { data, token } = await fetchJson("/plans/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formValues),
    });

    startTransition(() => {
      setPlanResponse(data);
    });

    return token;
  }

  async function refreshRecentPlans(token) {
    const { data } = await fetchJson("/plans/recent", { token });
    setRecentPlans(data.plans || []);
  }

  async function refreshProjects(token) {
    const { data } = await fetchJson("/plans", { token });
    setProjects(data.plans || []);
  }

  function showPlannerView() {
    setActiveView("planner");
    setError("");
  }

  function showProfileView() {
    setActiveView("profile");
    setError("");
  }

  async function showProjectsView() {
    if (!isAuthReady || !isAuthenticated) {
      setError("Sign in before opening your saved projects.");
      return;
    }

    setActiveView("projects");
    setIsLoadingProjects(true);
    setError("");

    try {
      const { data } = await fetchJson("/plans");
      const nextProjects = data.plans || [];
      setProjects(nextProjects);

      if (nextProjects.length > 0 && !selectedProject?.plan?.planId) {
        await selectProject(nextProjects[0].planId);
      }
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoadingProjects(false);
    }
  }

  async function selectProject(planId) {
    if (!planId) {
      return;
    }

    setIsLoadingSelectedProject(true);
    setError("");

    try {
      if (planResponse?.plan?.planId === planId) {
        const savedPlan =
          projects.find((project) => project.planId === planId) || recentPlans.find((project) => project.planId === planId) || null;

        setSelectedProject({
          plan: planResponse.plan,
          savedPlan,
        });
        return;
      }

      const { data } = await fetchJson(`/plans/${encodeURIComponent(planId)}`);
      setSelectedProject(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoadingSelectedProject(false);
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
      if (projects.length > 0 || activeView === "projects") {
        await refreshProjects(token);
      }
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
    activeView,
    canGeneratePlan,
    currentUser,
    error,
    formValues,
    handleSubmit,
    isAuthReady,
    isLoadingPlan,
    isLoadingProfile,
    isLoadingProjects,
    isLoadingSelectedProject,
    planResponse,
    projects,
    questionnaire,
    recentPlans,
    selectedProject,
    selectProject,
    showPlannerView,
    showProfileView,
    showProjectsView,
    toggleFeature,
    updateField,
  };
}
