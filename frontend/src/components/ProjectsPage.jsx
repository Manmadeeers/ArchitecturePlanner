import { useI18n } from "../i18n";
import { PlanDetails } from "./PlanDetails";
import { ScenarioSetDetails } from "./ScenarioSetDetails";

export function ProjectsPage({
  error,
  isLoadingProjects,
  isLoadingSelectedProject,
  onDeleteProject,
  onSelectProject,
  projectDeleteInFlightId,
  projects,
  selectedProject,
  onRequestConfirm,
}) {
  const { formatCurrency, formatDate, getProjectSummary, getValueLabel, t } = useI18n();

  return (
    <section className="projects-layout">
      <div className="panel projects-sidebar">
        <div className="panel-heading">
          <h2>{t("projects.title")}</h2>
        </div>

        {error ? <div className="error-box">{error}</div> : null}

        {isLoadingProjects ? (
          <div className="empty-state">
            <p>{t("projects.loadingProjects")}</p>
          </div>
        ) : projects.length > 0 ? (
          <div className="project-card-grid">
            {projects.map((project) => {
              const entryKey = `${project.entryType}:${project.entryId}`;
              const isActive = selectedProject?.entryType === project.entryType && String(selectedProject?.entryId) === String(project.entryId);
              const isDeleting = projectDeleteInFlightId === entryKey;
              const isScenarioSet = project.entryType === "scenario_set";

              function handleDeleteProject() {
                const projectName = project.projectName || t("common.notProvided");
                onRequestConfirm({
                  title: isScenarioSet ? t("projects.deleteScenarioSet") : t("projects.delete"),
                  message: isScenarioSet ? t("projects.deleteScenarioSetConfirm", {
                    name: projectName,
                  }) : t("projects.deleteConfirm", {
                    name: projectName,
                  }),
                  confirmLabel: isScenarioSet ? t("projects.deleteScenarioSet") : t("projects.delete"),
                  cancelLabel: t("common.cancel"),
                }).then((shouldDelete) => {
                  if (!shouldDelete) {
                    return;
                  }

                  onDeleteProject(project);
                });
              }

              return (
                <article key={entryKey} className={`project-card ${isActive ? "project-card-active" : ""}`}>
                  <button
                    type="button"
                    className="project-card-surface"
                    onClick={() => onSelectProject(project)}
                    disabled={isDeleting}
                  >
                    <div className="project-card-topline">
                      <strong>{project.projectName}</strong>
                      <span>{formatDate(project.createdAt)}</span>
                    </div>
                    <p>{getProjectSummary(project)}</p>
                    <div className="project-card-meta">
                      <span>{isScenarioSet ? t("scenarios.title") : (project.architectureStyle ? getValueLabel(project.architectureStyle) : t("projects.architectureTbd"))}</span>
                      <span>{isScenarioSet ? t("projects.scenarioSetCount", { count: project.scenarioCount || 0 }) : (project.monthlyEstimate ? formatCurrency(project.monthlyEstimate) : t("projects.noCostSaved"))}</span>
                    </div>
                  </button>

                  <div className="project-card-actions">
                    <button type="button" className="danger-button" onClick={handleDeleteProject} disabled={isDeleting}>
                      {isDeleting ? t("projects.deleting") : (isScenarioSet ? t("projects.deleteScenarioSet") : t("projects.delete"))}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>{t("projects.empty")}</p>
          </div>
        )}
      </div>

      <div className="panel project-detail-panel">
        <div className="panel-heading">
          <h2>{t("projects.detailTitle")}</h2>
        </div>

        {isLoadingSelectedProject ? (
          <div className="empty-state">
            <p>{t("projects.loadingDetail")}</p>
          </div>
        ) : selectedProject?.plan ? (
          <PlanDetails plan={selectedProject.plan} />
        ) : selectedProject?.entryType === "scenario_set" ? (
          <ScenarioSetDetails scenarioSet={selectedProject.scenarioSet} scenarios={selectedProject.scenarios} />
        ) : (
          <div className="empty-state">
            <p>{t("projects.selectProject")}</p>
          </div>
        )}
      </div>
    </section>
  );
}
