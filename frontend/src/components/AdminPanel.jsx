import { useState } from "react";

import { readable } from "../utils/formatters";

const REGION_LABELS = {
  "north-america": "North America",
  europe: "Europe",
  asia: "Asia",
  global: "Global",
};

const ARCHITECTURE_LABELS = {
  monolith: "Monolith",
  "modular-monolith": "Modular Monolith",
  "scalable-services": "Scalable Services",
};

const ROADMAP_LABELS = {
  includeIdeaStageValidationStep: "Idea and prototype validation step",
  includeFileUploadLifecycleStep: "File upload lifecycle guidance",
  includeRealtimeStressStep: "Realtime stress-test guidance",
};

export function AdminPanel({
  adminAnalytics,
  adminUsers,
  currentUser,
  onDeleteUser,
  onSaveUserProfile,
  engineSettingsDraft,
  engineSettingsRecord,
  error,
  isLoadingAdmin,
  isSavingEngineSettings,
  onChangeUserRole,
  onSaveEngineSettings,
  onUpdateEngineBaseCost,
  onUpdateEngineCostValue,
  onUpdateEngineRegionMultiplier,
  onUpdateRoadmapRule,
  roleUpdateInFlightId,
  userDeleteInFlightId,
  userSaveInFlightId,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUserId, setEditingUserId] = useState(null);
  const [editDraft, setEditDraft] = useState({
    displayName: "",
    email: "",
  });
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredUsers = normalizedSearch
    ? adminUsers.filter((user) =>
        [user.displayName, user.email, user.auth0Sub]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch))
      )
    : adminUsers;

  function beginEditingUser(user) {
    setEditingUserId(user.id);
    setEditDraft({
      displayName: user.displayName || "",
      email: user.email || "",
    });
  }

  function cancelEditingUser() {
    setEditingUserId(null);
    setEditDraft({
      displayName: "",
      email: "",
    });
  }

  async function saveUserProfile(userId) {
    const wasSaved = await onSaveUserProfile(userId, editDraft);

    if (wasSaved) {
      cancelEditingUser();
    }
  }

  async function deleteUser(user) {
    const shouldDelete = window.confirm(
      `Delete ${user.displayName || user.email || user.auth0Sub}? Their saved projects will be removed as well.`
    );

    if (!shouldDelete) {
      return;
    }

    const wasDeleted = await onDeleteUser(user.id);

    if (wasDeleted && editingUserId === user.id) {
      cancelEditingUser();
    }
  }

  return (
    <section className="admin-grid">
      <div className="panel admin-overview-panel">
        <div className="panel-heading">
          <h2>Admin Dashboard</h2>
          <p>Manage access, tune deterministic engine settings, and review system-wide architecture activity.</p>
        </div>

        {error ? <div className="error-box">{error}</div> : null}

        {isLoadingAdmin ? (
          <div className="empty-state">
            <p>Loading admin workspace...</p>
          </div>
        ) : (
          <>
            <div className="summary-grid admin-summary-grid">
              <article className="summary-card">
                <span>Total users</span>
                <strong>{adminAnalytics?.totals?.totalUsers ?? 0}</strong>
              </article>
              <article className="summary-card">
                <span>Admin users</span>
                <strong>{adminAnalytics?.totals?.totalAdmins ?? 0}</strong>
              </article>
              <article className="summary-card">
                <span>Generated plans</span>
                <strong>{adminAnalytics?.totals?.totalPlans ?? 0}</strong>
              </article>
              <article className="summary-card">
                <span>Average monthly estimate</span>
                <strong>${adminAnalytics?.totals?.averageMonthlyEstimate ?? 0}</strong>
              </article>
            </div>

            <div className="admin-analytics-grid">
              <AnalyticsCard
                title="Popular architectures"
                items={adminAnalytics?.mostPopularArchitectures}
                formatLabel={(label) => readable(label)}
              />
              <AnalyticsCard
                title="Popular deployment models"
                items={adminAnalytics?.mostPopularDeploymentModels}
                formatLabel={(label) => readable(label)}
              />
              <AnalyticsCard
                title="Common technology components"
                items={adminAnalytics?.mostPopularTechnologyComponents}
                formatLabel={(label) => readable(label)}
              />
              <AnalyticsCard
                title="Most active regions"
                items={adminAnalytics?.mostPopularRegions}
                formatLabel={(label) => REGION_LABELS[label] || readable(label)}
              />
              <AnalyticsCard
                title="Business types"
                items={adminAnalytics?.mostPopularBusinessTypes}
                formatLabel={(label) => readable(label)}
              />
              <AnalyticsCard
                title="Stack patterns"
                items={adminAnalytics?.topStackPatterns}
                formatLabel={(label) => String(label).split(" + ").map(readable).join(" + ")}
              />
            </div>

            <div className="profile-grid">
              <article className="narrative-card">
                <h3>Recent plan volume</h3>
                <div className="admin-list">
                  {(adminAnalytics?.recentPlanVolume || []).length > 0 ? (
                    adminAnalytics.recentPlanVolume.map((entry) => (
                      <div key={entry.label} className="admin-list-row">
                        <span>{entry.label}</span>
                        <strong>{entry.count}</strong>
                      </div>
                    ))
                  ) : (
                    <p className="muted-text">No plans have been generated yet.</p>
                  )}
                </div>
              </article>

              <article className="narrative-card">
                <h3>Recent admin activity</h3>
                <div className="admin-list">
                  {(adminAnalytics?.recentAdminActivity || []).length > 0 ? (
                    adminAnalytics.recentAdminActivity.map((entry) => (
                      <div key={entry.id} className="admin-audit-item">
                        <strong>{readable(entry.action)}</strong>
                        <span>
                          {entry.actorDisplayName || entry.actorEmail || "System"} on {new Date(entry.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="muted-text">No admin actions have been recorded yet.</p>
                  )}
                </div>
              </article>
            </div>
          </>
        )}
      </div>

      <div className="panel admin-users-panel">
        <div className="panel-heading">
          <h2>User Management</h2>
          <p>Promote or demote users and keep track of who is actively generating projects.</p>
        </div>

        <label className="field admin-search-field">
          <span>Search users</span>
          <input
            type="search"
            placeholder="Filter by name, email, or Auth0 subject"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>

        <div className="admin-user-grid">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => {
              const isCurrentUser = currentUser?.id === user.id;
              const isUpdatingRole = roleUpdateInFlightId === user.id;
              const isSavingUser = userSaveInFlightId === user.id;
              const isDeletingUser = userDeleteInFlightId === user.id;
              const isEditingUser = editingUserId === user.id;
              const isMutatingUser = isUpdatingRole || isSavingUser || isDeletingUser;

              return (
                <article key={user.id} className="narrative-card admin-user-card">
                  <div className="project-card-topline">
                    <div>
                      <strong>{user.displayName || user.email || "Unnamed user"}</strong>
                      <div className="admin-user-meta">
                        <span>{user.email || "No email provided"}</span>
                        <span>Projects: {user.projectCount ?? 0}</span>
                      </div>
                    </div>
                    <span className={`admin-role-badge admin-role-badge-${user.role}`}>{user.role}</span>
                  </div>

                  <div className="admin-user-meta">
                    <span>{user.auth0Sub}</span>
                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                    {isCurrentUser ? <span>Current signed-in admin</span> : null}
                  </div>

                  {isEditingUser ? (
                    <div className="profile-grid admin-user-edit-grid">
                      <label className="field">
                        <span>Display name</span>
                        <input
                          type="text"
                          value={editDraft.displayName}
                          disabled={isMutatingUser}
                          onChange={(event) =>
                            setEditDraft((current) => ({
                              ...current,
                              displayName: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <label className="field">
                        <span>Email</span>
                        <input
                          type="email"
                          value={editDraft.email}
                          disabled={isMutatingUser}
                          onChange={(event) =>
                            setEditDraft((current) => ({
                              ...current,
                              email: event.target.value,
                            }))
                          }
                        />
                      </label>
                    </div>
                  ) : null}

                  <div className="button-row">
                    {isEditingUser ? (
                      <>
                        <button
                          type="button"
                          className="primary-button"
                          disabled={isMutatingUser}
                          onClick={() => saveUserProfile(user.id)}
                        >
                          {isSavingUser ? "Saving..." : "Save changes"}
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          disabled={isMutatingUser}
                          onClick={cancelEditingUser}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="secondary-button"
                          disabled={isMutatingUser}
                          onClick={() => beginEditingUser(user)}
                        >
                          Edit details
                        </button>
                        <button
                          type="button"
                          className="danger-button"
                          disabled={isMutatingUser || isCurrentUser}
                          onClick={() => deleteUser(user)}
                        >
                          {isDeletingUser ? "Deleting..." : "Delete user"}
                        </button>
                      </>
                    )}
                  </div>

                  <div className="button-row">
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={user.role === "user" || isMutatingUser}
                      onClick={() => onChangeUserRole(user.id, "user")}
                    >
                      {isUpdatingRole && user.role === "admin" ? "Updating..." : "Set as user"}
                    </button>
                    <button
                      type="button"
                      className="primary-button"
                      disabled={user.role === "admin" || isMutatingUser}
                      onClick={() => onChangeUserRole(user.id, "admin")}
                    >
                      {isUpdatingRole && user.role !== "admin" ? "Updating..." : "Make admin"}
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="empty-state">
              <p>No users match your current search.</p>
            </div>
          )}
        </div>
      </div>

      <div className="panel admin-settings-panel">
        <div className="panel-heading">
          <h2>Engine Settings</h2>
          <p>Adjust safe deterministic inputs like cost weights, regional multipliers, and roadmap toggles.</p>
        </div>

        {engineSettingsRecord?.updatedAt ? (
          <p className="muted-text">
            Last updated on {new Date(engineSettingsRecord.updatedAt).toLocaleString()}
            {engineSettingsRecord.updatedBy ? ` by user #${engineSettingsRecord.updatedBy}` : ""}
          </p>
        ) : (
          <p className="muted-text">Using default engine settings until the first admin save.</p>
        )}

        {engineSettingsDraft ? (
          <div className="questionnaire-form">
            <fieldset className="fieldset admin-settings-section">
              <legend>Region cost multipliers</legend>
              <div className="profile-grid">
                {Object.entries(engineSettingsDraft.regionMultipliers).map(([regionCode, value]) => (
                  <label key={regionCode} className="field">
                    <span>{REGION_LABELS[regionCode] || readable(regionCode)}</span>
                    <input
                      type="number"
                      min="0.1"
                      step="0.01"
                      value={value}
                      onChange={(event) => onUpdateEngineRegionMultiplier(regionCode, event.target.value)}
                    />
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="fieldset admin-settings-section">
              <legend>Base architecture costs</legend>
              <div className="profile-grid">
                {Object.entries(engineSettingsDraft.costModel.baseMonthlyCost).map(([architectureKey, value]) => (
                  <label key={architectureKey} className="field">
                    <span>{ARCHITECTURE_LABELS[architectureKey] || readable(architectureKey)}</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={value}
                      onChange={(event) => onUpdateEngineBaseCost(architectureKey, event.target.value)}
                    />
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="fieldset admin-settings-section">
              <legend>Cost model controls</legend>
              <div className="profile-grid">
                <label className="field">
                  <span>Feature component weight</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={engineSettingsDraft.costModel.featureComponentWeight}
                    onChange={(event) => onUpdateEngineCostValue("featureComponentWeight", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Monthly users divider</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={engineSettingsDraft.costModel.monthlyUsersDivider}
                    onChange={(event) => onUpdateEngineCostValue("monthlyUsersDivider", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Fast delivery surcharge</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={engineSettingsDraft.costModel.fastDeliverySurcharge}
                    onChange={(event) => onUpdateEngineCostValue("fastDeliverySurcharge", event.target.value)}
                  />
                </label>
              </div>
            </fieldset>

            <fieldset className="fieldset admin-settings-section">
              <legend>Roadmap toggles</legend>
              <div className="admin-toggle-list">
                {Object.entries(engineSettingsDraft.roadmapRules).map(([ruleKey, enabled]) => (
                  <label key={ruleKey} className="toggle-field">
                    <div>
                      <span>{ROADMAP_LABELS[ruleKey] || readable(ruleKey)}</span>
                      <small>Enable or disable this deterministic roadmap step in future generated plans.</small>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(enabled)}
                      onChange={(event) => onUpdateRoadmapRule(ruleKey, event.target.checked)}
                    />
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="button-row">
              <button type="button" className="primary-button" onClick={onSaveEngineSettings} disabled={isSavingEngineSettings}>
                {isSavingEngineSettings ? "Saving settings..." : "Save engine settings"}
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>Engine settings will appear here once the admin workspace finishes loading.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function AnalyticsCard({ formatLabel, items, title }) {
  return (
    <article className="narrative-card admin-list-card">
      <h3>{title}</h3>
      <div className="admin-list">
        {(items || []).length > 0 ? (
          items.map((item) => (
            <div key={item.label} className="admin-list-row">
              <span>{formatLabel(item.label)}</span>
              <strong>{item.count}</strong>
            </div>
          ))
        ) : (
          <p className="muted-text">Not enough data yet.</p>
        )}
      </div>
    </article>
  );
}
