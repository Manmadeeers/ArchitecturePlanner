import { useState } from "react";

import { useI18n } from "../i18n";

const ROADMAP_LABELS = {
  includeIdeaStageValidationStep: "Idea and prototype validation step",
  includeFileUploadLifecycleStep: "File upload lifecycle guidance",
  includeRealtimeStressStep: "Realtime stress-test guidance",
};

export function AdminPanel({
  adminAnalytics,
  adminTechnologyCategories,
  adminTechnologies,
  adminUsers,
  onCreateTechnology,
  onDeleteTechnology,
  onDownloadAdminReport,
  currentUser,
  onDeleteUser,
  onSaveUserProfile,
  onUpdateTechnology,
  engineSettingsDraft,
  engineSettingsRecord,
  error,
  isLoadingAdmin,
  isDownloadingAdminReport,
  isSavingEngineSettings,
  onChangeUserRole,
  onSaveEngineSettings,
  onUpdateEngineBaseCost,
  onUpdateEngineCostValue,
  onUpdateEngineRegionMultiplier,
  onUpdateRoadmapRule,
  roleUpdateInFlightId,
  technologyDeleteInFlightId,
  technologySaveInFlightId,
  userDeleteInFlightId,
  userSaveInFlightId,
}) {
  const { formatCurrency, formatDate, formatDateTime, getComponentLabel, getRoleLabel, getValueLabel, t, translateFixedText } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUserId, setEditingUserId] = useState(null);
  const [editDraft, setEditDraft] = useState({
    displayName: "",
    email: "",
  });
  const [editingTechnologyId, setEditingTechnologyId] = useState(null);
  const [technologyDraft, setTechnologyDraft] = useState({
    name: "",
    categoryId: "",
    description: "",
    logoUrl: "",
    isActive: true,
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
      t("admin.deleteConfirm", {
        name: user.displayName || user.email || user.auth0Sub,
      })
    );

    if (!shouldDelete) {
      return;
    }

    const wasDeleted = await onDeleteUser(user.id);

    if (wasDeleted && editingUserId === user.id) {
      cancelEditingUser();
    }
  }

  function beginTechnologyEdit(technology) {
    setEditingTechnologyId(technology.id);
    setTechnologyDraft({
      name: technology.name || "",
      categoryId: technology.categoryId ? String(technology.categoryId) : "",
      description: technology.description || "",
      logoUrl: technology.logoUrl || "",
      isActive: technology.isActive !== false,
    });
  }

  function cancelTechnologyEdit() {
    setEditingTechnologyId(null);
    setTechnologyDraft({
      name: "",
      categoryId: "",
      description: "",
      logoUrl: "",
      isActive: true,
    });
  }

  async function saveTechnology(technologyId) {
    const wasSaved = technologyId
      ? await onUpdateTechnology(technologyId, technologyDraft)
      : await onCreateTechnology(technologyDraft);

    if (wasSaved) {
      cancelTechnologyEdit();
    }
  }

  async function removeTechnology(technology) {
    const shouldDelete = window.confirm(`Delete technology "${technology.name}"?`);

    if (!shouldDelete) {
      return;
    }

    const wasDeleted = await onDeleteTechnology(technology.id);
    if (wasDeleted && editingTechnologyId === technology.id) {
      cancelTechnologyEdit();
    }
  }

  return (
    <section className="admin-grid">
      <div className="panel admin-overview-panel">
        <div className="panel-heading">
          <h2>{t("admin.title")}</h2>
          <p>{t("admin.description")}</p>
          <div className="button-row">
            <button type="button" className="secondary-button" onClick={onDownloadAdminReport} disabled={isDownloadingAdminReport}>
              {isDownloadingAdminReport ? "Generating PDF..." : "Download PDF report"}
            </button>
          </div>
        </div>

        {error ? <div className="error-box">{error}</div> : null}

        {isLoadingAdmin ? (
          <div className="empty-state">
            <p>{t("admin.loading")}</p>
          </div>
        ) : (
          <>
            <div className="summary-grid admin-summary-grid">
              <article className="summary-card">
                <span>{t("admin.totalUsers")}</span>
                <strong>{adminAnalytics?.totals?.totalUsers ?? 0}</strong>
              </article>
              <article className="summary-card">
                <span>{t("admin.adminUsers")}</span>
                <strong>{adminAnalytics?.totals?.totalAdmins ?? 0}</strong>
              </article>
              <article className="summary-card">
                <span>{t("admin.generatedPlans")}</span>
                <strong>{adminAnalytics?.totals?.totalPlans ?? 0}</strong>
              </article>
              <article className="summary-card">
                <span>{t("admin.averageMonthlyEstimate")}</span>
                <strong>{formatCurrency(adminAnalytics?.totals?.averageMonthlyEstimate ?? 0)}</strong>
              </article>
            </div>

            <div className="admin-analytics-grid">
              <AnalyticsCard
                title={t("admin.popularArchitectures")}
                items={adminAnalytics?.mostPopularArchitectures}
                formatLabel={(label) => getValueLabel(label)}
              />
              <AnalyticsCard
                title={t("admin.popularDeploymentModels")}
                items={adminAnalytics?.mostPopularDeploymentModels}
                formatLabel={(label) => getValueLabel(label)}
              />
              <AnalyticsCard
                title={t("admin.commonTechnologyComponents")}
                items={adminAnalytics?.mostPopularTechnologyComponents}
                formatLabel={(label) => getComponentLabel(label)}
              />
              <AnalyticsCard
                title={t("admin.activeRegions")}
                items={adminAnalytics?.mostPopularRegions}
                formatLabel={(label) => getValueLabel(label)}
              />
              <AnalyticsCard
                title={t("admin.businessTypes")}
                items={adminAnalytics?.mostPopularBusinessTypes}
                formatLabel={(label) => getValueLabel(label)}
              />
              <AnalyticsCard
                title={t("admin.stackPatterns")}
                items={adminAnalytics?.topStackPatterns}
                formatLabel={(label) => String(label).split(" + ").map(getComponentLabel).join(" + ")}
              />
            </div>

            <div className="profile-grid">
              <article className="narrative-card">
                <h3>{t("admin.recentPlanVolume")}</h3>
                <div className="admin-list">
                  {(adminAnalytics?.recentPlanVolume || []).length > 0 ? (
                    adminAnalytics.recentPlanVolume.map((entry) => (
                      <div key={entry.label} className="admin-list-row">
                        <span>{formatDate(entry.label)}</span>
                        <strong>{entry.count}</strong>
                      </div>
                    ))
                  ) : (
                    <p className="muted-text">{t("admin.noPlansYet")}</p>
                  )}
                </div>
              </article>

              <article className="narrative-card">
                <h3>{t("admin.recentAdminActivity")}</h3>
                <div className="admin-list">
                  {(adminAnalytics?.recentAdminActivity || []).length > 0 ? (
                    adminAnalytics.recentAdminActivity.map((entry) => (
                      <div key={entry.id} className="admin-audit-item">
                        <strong>{translateFixedText(entry.action)}</strong>
                        <span>
                          {entry.actorDisplayName || entry.actorEmail || t("common.system")} {formatDateTime(entry.createdAt)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="muted-text">{t("admin.noAdminActivity")}</p>
                  )}
                </div>
              </article>
            </div>
          </>
        )}
      </div>

      <div className="panel admin-users-panel">
        <div className="panel-heading">
          <h2>{t("admin.userManagement")}</h2>
          <p>{t("admin.userManagementDescription")}</p>
        </div>

        <label className="field admin-search-field">
          <span>{t("admin.searchUsers")}</span>
          <input
            type="search"
            placeholder={t("admin.searchUsersPlaceholder")}
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
                      <strong>{user.displayName || user.email || t("admin.unnamedUser")}</strong>
                      <div className="admin-user-meta">
                        <span>{user.email || t("admin.noEmail")}</span>
                        <span>{t("admin.projectsCount", { count: user.projectCount ?? 0 })}</span>
                      </div>
                    </div>
                    <span className={`admin-role-badge admin-role-badge-${user.role}`}>{getRoleLabel(user.role)}</span>
                  </div>

                  <div className="admin-user-meta">
                    <span>{user.auth0Sub}</span>
                    <span>{t("admin.joined", { date: formatDate(user.createdAt) })}</span>
                    {isCurrentUser ? <span>{t("admin.currentAdmin")}</span> : null}
                  </div>

                  {isEditingUser ? (
                    <div className="profile-grid admin-user-edit-grid">
                      <label className="field">
                        <span>{t("profile.displayName")}</span>
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
                        <span>{t("profile.email")}</span>
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
                          {isSavingUser ? t("admin.savingChanges") : t("admin.saveChanges")}
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          disabled={isMutatingUser}
                          onClick={cancelEditingUser}
                        >
                          {t("common.cancel")}
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
                          {t("admin.editDetails")}
                        </button>
                        <button
                          type="button"
                          className="danger-button"
                          disabled={isMutatingUser || isCurrentUser}
                          onClick={() => deleteUser(user)}
                        >
                          {isDeletingUser ? t("admin.deletingUser") : t("admin.deleteUser")}
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
                      {isUpdatingRole && user.role === "admin" ? t("admin.updating") : t("admin.setAsUser")}
                    </button>
                    <button
                      type="button"
                      className="primary-button"
                      disabled={user.role === "admin" || isMutatingUser}
                      onClick={() => onChangeUserRole(user.id, "admin")}
                    >
                      {isUpdatingRole && user.role !== "admin" ? t("admin.updating") : t("admin.makeAdmin")}
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="empty-state">
              <p>{t("admin.noUsersMatch")}</p>
            </div>
          )}
        </div>
      </div>

      <div className="panel admin-settings-panel">
        <div className="panel-heading">
          <h2>Technology catalog</h2>
          <p>Manage languages, frameworks, and tools used in generated implementation plans.</p>
        </div>

        <div className="button-row">
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              if (editingTechnologyId === "new") {
                cancelTechnologyEdit();
                return;
              }

              setEditingTechnologyId("new");
              setTechnologyDraft({
                name: "",
                categoryId: "",
                description: "",
                logoUrl: "",
                isActive: true,
              });
            }}
          >
            {editingTechnologyId === "new" ? "Cancel new technology" : "Add technology"}
          </button>
        </div>

        {editingTechnologyId ? (
          <div className="questionnaire-form">
            <fieldset className="fieldset admin-settings-section">
              <legend>{editingTechnologyId === "new" ? "Create technology" : "Edit technology"}</legend>
              <div className="profile-grid">
                <label className="field">
                  <span>Name</span>
                  <input
                    type="text"
                    value={technologyDraft.name}
                    onChange={(event) => setTechnologyDraft((current) => ({ ...current, name: event.target.value }))}
                  />
                </label>
                <label className="field">
                  <span>Category</span>
                  <select
                    value={technologyDraft.categoryId}
                    onChange={(event) => setTechnologyDraft((current) => ({ ...current, categoryId: event.target.value }))}
                  >
                    <option value="">Select category</option>
                    {(adminTechnologyCategories || []).map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Logo URL</span>
                  <input
                    type="url"
                    value={technologyDraft.logoUrl}
                    onChange={(event) => setTechnologyDraft((current) => ({ ...current, logoUrl: event.target.value }))}
                  />
                </label>
                <label className="field">
                  <span>Description</span>
                  <input
                    type="text"
                    value={technologyDraft.description}
                    onChange={(event) => setTechnologyDraft((current) => ({ ...current, description: event.target.value }))}
                  />
                </label>
              </div>
              <label className="toggle-field">
                <div>
                  <span>Active</span>
                  <small>Inactive technologies stay in history but are not selected for new plans.</small>
                </div>
                <input
                  type="checkbox"
                  checked={technologyDraft.isActive}
                  onChange={(event) => setTechnologyDraft((current) => ({ ...current, isActive: event.target.checked }))}
                />
              </label>
              <div className="button-row">
                <button
                  type="button"
                  className="primary-button"
                  disabled={Boolean(technologySaveInFlightId)}
                  onClick={() => saveTechnology(editingTechnologyId === "new" ? null : editingTechnologyId)}
                >
                  {technologySaveInFlightId ? "Saving..." : "Save technology"}
                </button>
                <button type="button" className="secondary-button" onClick={cancelTechnologyEdit}>
                  Cancel
                </button>
              </div>
            </fieldset>
          </div>
        ) : null}

        <div className="admin-user-grid">
          {(adminTechnologies || []).length > 0 ? (
            adminTechnologies.map((technology) => (
              <article key={technology.id} className="narrative-card admin-user-card">
                <div className="project-card-topline">
                  <div>
                    <strong>{technology.name}</strong>
                    <div className="admin-user-meta">
                      <span>{technology.categoryName || "Uncategorized"}</span>
                      <span>{technology.isActive ? "Active" : "Inactive"}</span>
                    </div>
                  </div>
                </div>
                {technology.description ? <p>{technology.description}</p> : null}
                {technology.logoUrl ? (
                  <p className="muted-text">
                    <a href={technology.logoUrl} target="_blank" rel="noreferrer">
                      {technology.logoUrl}
                    </a>
                  </p>
                ) : null}
                <div className="button-row">
                  <button type="button" className="secondary-button" onClick={() => beginTechnologyEdit(technology)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    disabled={technologyDeleteInFlightId === technology.id}
                    onClick={() => removeTechnology(technology)}
                  >
                    {technologyDeleteInFlightId === technology.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <p>No technologies yet. Add your first catalog item above.</p>
            </div>
          )}
        </div>
      </div>

      <div className="panel admin-settings-panel">
        <div className="panel-heading">
          <h2>{t("admin.engineSettings")}</h2>
          <p>{t("admin.engineSettingsDescription")}</p>
        </div>

        {engineSettingsRecord?.updatedAt ? (
          <p className="muted-text">
            {t("admin.lastUpdatedOn", { value: formatDateTime(engineSettingsRecord.updatedAt) })}
            {engineSettingsRecord.updatedBy ? ` ${t("admin.updatedByUser", { userId: engineSettingsRecord.updatedBy })}` : ""}
          </p>
        ) : (
          <p className="muted-text">{t("admin.usingDefaultSettings")}</p>
        )}

        {engineSettingsDraft ? (
          <div className="questionnaire-form">
            <fieldset className="fieldset admin-settings-section">
              <legend>{t("admin.regionCostMultipliers")}</legend>
              <div className="profile-grid">
                {Object.entries(engineSettingsDraft.regionMultipliers).map(([regionCode, value]) => (
                  <label key={regionCode} className="field">
                    <span>{getValueLabel(regionCode)}</span>
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
              <legend>{t("admin.baseArchitectureCosts")}</legend>
              <div className="profile-grid">
                {Object.entries(engineSettingsDraft.costModel.baseMonthlyCost).map(([architectureKey, value]) => (
                  <label key={architectureKey} className="field">
                    <span>{getValueLabel(architectureKey)}</span>
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
              <legend>{t("admin.costModelControls")}</legend>
              <div className="profile-grid">
                <label className="field">
                  <span>{t("admin.featureComponentWeight")}</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={engineSettingsDraft.costModel.featureComponentWeight}
                    onChange={(event) => onUpdateEngineCostValue("featureComponentWeight", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>{t("admin.monthlyUsersDivider")}</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={engineSettingsDraft.costModel.monthlyUsersDivider}
                    onChange={(event) => onUpdateEngineCostValue("monthlyUsersDivider", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>{t("admin.fastDeliverySurcharge")}</span>
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
              <legend>{t("admin.roadmapToggles")}</legend>
              <div className="admin-toggle-list">
                {Object.entries(engineSettingsDraft.roadmapRules).map(([ruleKey, enabled]) => (
                  <label key={ruleKey} className="toggle-field">
                    <div>
                      <span>{translateFixedText(ROADMAP_LABELS[ruleKey] || ruleKey)}</span>
                      <small>{t("admin.roadmapToggleDescription")}</small>
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
                {isSavingEngineSettings ? t("admin.savingEngineSettings") : t("admin.saveEngineSettings")}
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>{t("admin.waitingEngineSettings")}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function AnalyticsCard({ formatLabel, items, title }) {
  const { t } = useI18n();

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
          <p className="muted-text">{t("common.notEnoughData")}</p>
        )}
      </div>
    </article>
  );
}
