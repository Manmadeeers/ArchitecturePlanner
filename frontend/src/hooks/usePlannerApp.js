import { startTransition, useEffect, useState } from "react";

import { API_BASE_URL } from "../config/api";
import { defaultValues } from "../constants/planner";
import { normalizeCurrentUser } from "../utils/formatters";

const defaultSelectedProject = {
  plan: null,
  savedPlan: null,
};

function normalizeProfileField(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue ? normalizedValue : null;
}

export function usePlannerApp({ authMode, authUser, getAccessToken, isAuthenticated, isLoading }) {
  const [activeView, setActiveView] = useState("planner");
  const [questionnaire, setQuestionnaire] = useState([]);
  const [formValues, setFormValues] = useState(defaultValues);
  const [planResponse, setPlanResponse] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [recentPlans, setRecentPlans] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(defaultSelectedProject);
  const [adminAnalytics, setAdminAnalytics] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [engineSettingsDraft, setEngineSettingsDraft] = useState(null);
  const [engineSettingsRecord, setEngineSettingsRecord] = useState(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingSelectedProject, setIsLoadingSelectedProject] = useState(false);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  const [isSavingEngineSettings, setIsSavingEngineSettings] = useState(false);
  const [roleUpdateInFlightId, setRoleUpdateInFlightId] = useState(null);
  const [userSaveInFlightId, setUserSaveInFlightId] = useState(null);
  const [userDeleteInFlightId, setUserDeleteInFlightId] = useState(null);
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
    if (authMode !== "configured" || !getAccessToken) {
      setActiveView("planner");
      setCurrentUser(null);
      setRecentPlans([]);
      setProjects([]);
      setSelectedProject(defaultSelectedProject);
      setAdminAnalytics(null);
      setAdminUsers([]);
      setEngineSettingsDraft(null);
      setEngineSettingsRecord(null);
      return;
    }

    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      setActiveView("planner");
      setCurrentUser(null);
      setRecentPlans([]);
      setProjects([]);
      setSelectedProject(defaultSelectedProject);
      setAdminAnalytics(null);
      setAdminUsers([]);
      setEngineSettingsDraft(null);
      setEngineSettingsRecord(null);
      return;
    }

    async function loadProtectedData() {
      setIsLoadingProfile(true);

      try {
        const token = await getAccessToken();
        const email = normalizeProfileField(authUser?.email);
        const displayName =
          normalizeProfileField(authUser?.name) ||
          normalizeProfileField(authUser?.nickname) ||
          email;

        if (email || displayName) {
          await fetchJson("/auth/profile", {
            token,
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              displayName,
              name: normalizeProfileField(authUser?.name),
              nickname: normalizeProfileField(authUser?.nickname),
            }),
          });
        }

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
  }, [authMode, authUser, getAccessToken, isAuthenticated, isLoading]);

  useEffect(() => {
    if (activeView === "admin" && currentUser && currentUser.role !== "admin") {
      setActiveView("profile");
    }
  }, [activeView, currentUser]);

  const isAuthReady = authMode === "configured";
  const canGeneratePlan = isAuthReady && isAuthenticated && !isLoading;
  const isAdmin = currentUser?.role === "admin";

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

  async function loadAdminUsers(token) {
    const { data } = await fetchJson("/admin/users", { token });
    return data.users || [];
  }

  async function loadAdminAnalytics(token) {
    const { data } = await fetchJson("/admin/analytics/overview", { token });
    return data;
  }

  async function loadEngineSettings(token) {
    const { data } = await fetchJson("/admin/settings/engine", { token });
    return data;
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

  async function showAdminView() {
    if (!isAdmin) {
      setError("Admin access is required before opening the admin dashboard.");
      return;
    }

    setActiveView("admin");
    setIsLoadingAdmin(true);
    setError("");

    try {
      const token = await getAccessToken();
      const [usersData, analyticsData, settingsData] = await Promise.all([
        loadAdminUsers(token),
        loadAdminAnalytics(token),
        loadEngineSettings(token),
      ]);

      setAdminUsers(usersData);
      setAdminAnalytics(analyticsData);
      setEngineSettingsRecord(settingsData);
      setEngineSettingsDraft(settingsData.settings || null);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoadingAdmin(false);
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

  async function changeAdminUserRole(userId, role) {
    setRoleUpdateInFlightId(userId);
    setError("");

    try {
      const { data, token } = await fetchJson(`/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      const nextUser = data.user;
      setAdminUsers((currentUsers) => currentUsers.map((user) => (user.id === nextUser.id ? { ...user, ...nextUser } : user)));
      setCurrentUser((current) => (current?.id === nextUser.id ? { ...current, ...nextUser } : current));
      setAdminAnalytics(await loadAdminAnalytics(token));

      if (currentUser?.id === nextUser.id && nextUser.role !== "admin") {
        setActiveView("profile");
      }
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setRoleUpdateInFlightId(null);
    }
  }

  async function saveAdminUserProfile(userId, profile) {
    setUserSaveInFlightId(userId);
    setError("");

    try {
      const { data, token } = await fetchJson(`/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: profile.email,
          displayName: profile.displayName,
        }),
      });

      const nextUser = data.user;
      const [usersData, analyticsData] = await Promise.all([loadAdminUsers(token), loadAdminAnalytics(token)]);
      setAdminUsers(usersData);
      setAdminAnalytics(analyticsData);
      setCurrentUser((current) => (current?.id === nextUser.id ? { ...current, ...nextUser } : current));
      return true;
    } catch (saveError) {
      setError(saveError.message);
      return false;
    } finally {
      setUserSaveInFlightId(null);
    }
  }

  async function deleteAdminUser(userId) {
    setUserDeleteInFlightId(userId);
    setError("");

    try {
      const { token } = await fetchJson(`/admin/users/${userId}`, {
        method: "DELETE",
      });

      const [usersData, analyticsData] = await Promise.all([loadAdminUsers(token), loadAdminAnalytics(token)]);
      setAdminUsers(usersData);
      setAdminAnalytics(analyticsData);
      return true;
    } catch (deleteError) {
      setError(deleteError.message);
      return false;
    } finally {
      setUserDeleteInFlightId(null);
    }
  }

  async function saveEngineSettings() {
    if (!engineSettingsDraft) {
      return;
    }

    setIsSavingEngineSettings(true);
    setError("");

    try {
      const { data } = await fetchJson("/admin/settings/engine", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          settings: engineSettingsDraft,
        }),
      });

      setEngineSettingsRecord(data);
      setEngineSettingsDraft(data.settings || null);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSavingEngineSettings(false);
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

  function updateEngineRegionMultiplier(regionCode, value) {
    setEngineSettingsDraft((current) =>
      current
        ? {
            ...current,
            regionMultipliers: {
              ...current.regionMultipliers,
              [regionCode]: value,
            },
          }
        : current
    );
  }

  function updateEngineBaseCost(architectureKey, value) {
    setEngineSettingsDraft((current) =>
      current
        ? {
            ...current,
            costModel: {
              ...current.costModel,
              baseMonthlyCost: {
                ...current.costModel.baseMonthlyCost,
                [architectureKey]: value,
              },
            },
          }
        : current
    );
  }

  function updateEngineCostValue(key, value) {
    setEngineSettingsDraft((current) =>
      current
        ? {
            ...current,
            costModel: {
              ...current.costModel,
              [key]: value,
            },
          }
        : current
    );
  }

  function updateRoadmapRule(ruleKey, enabled) {
    setEngineSettingsDraft((current) =>
      current
        ? {
            ...current,
            roadmapRules: {
              ...current.roadmapRules,
              [ruleKey]: enabled,
            },
          }
        : current
    );
  }

  return {
    activeView,
    adminAnalytics,
    adminUsers,
    canGeneratePlan,
    changeAdminUserRole,
    currentUser,
    deleteAdminUser,
    engineSettingsDraft,
    engineSettingsRecord,
    error,
    formValues,
    handleSubmit,
    isAdmin,
    isAuthReady,
    isLoadingAdmin,
    isLoadingPlan,
    isLoadingProfile,
    isLoadingProjects,
    isLoadingSelectedProject,
    isSavingEngineSettings,
    planResponse,
    projects,
    questionnaire,
    recentPlans,
    roleUpdateInFlightId,
    saveAdminUserProfile,
    saveEngineSettings,
    selectedProject,
    selectProject,
    showAdminView,
    showPlannerView,
    showProfileView,
    showProjectsView,
    toggleFeature,
    updateEngineBaseCost,
    updateEngineCostValue,
    updateEngineRegionMultiplier,
    updateRoadmapRule,
    updateField,
    userDeleteInFlightId,
    userSaveInFlightId,
  };
}
