import { useI18n } from "../i18n";
import { PlanDetails } from "./PlanDetails";

export function ProjectsPage({
  error,
  isLoadingProjects,
  isLoadingSelectedProject,
  onDeleteProject,
  onSelectProject,
  projectDeleteInFlightId,
  projects,
  selectedProject,
}) {
  const { formatCurrency, formatDate, getProjectSummary, getValueLabel, t } = useI18n();

  return (
    <section className="projects-layout">
      <div className="panel projects-sidebar">
        <div className="panel-heading">
          <h2>{t("projects.title")}</h2>
          <p>{t("projects.description")}</p>
        </div>

        {error ? <div className="error-box">{error}</div> : null}

        {isLoadingProjects ? (
          <div className="empty-state">
            <p>{t("projects.loadingProjects")}</p>
          </div>
        ) : projects.length > 0 ? (
          <div className="project-card-grid">
            {projects.map((project) => {
              const isActive = selectedProject?.plan?.planId === project.planId;
              const isDeleting = projectDeleteInFlightId === project.planId;

              function handleDeleteProject() {
                const projectName = project.projectName || t("common.notProvided");
                const shouldDelete = window.confirm(
                  t("projects.deleteConfirm", {
                    name: projectName,
                  })
                );

                if (shouldDelete) {
                  onDeleteProject(project.planId);
                }
              }

              return (
                <article key={project.planId} className={`project-card ${isActive ? "project-card-active" : ""}`}>
                  <button
                    type="button"
                    className="project-card-surface"
                    onClick={() => onSelectProject(project.planId)}
                    disabled={isDeleting}
                  >
                    <div className="project-card-topline">
                      <strong>{project.projectName}</strong>
                      <span>{formatDate(project.createdAt)}</span>
                    </div>
                    <p>{getProjectSummary(project)}</p>
                    <div className="project-card-meta">
                      <span>{project.architectureStyle ? getValueLabel(project.architectureStyle) : t("projects.architectureTbd")}</span>
                      <span>{project.monthlyEstimate ? formatCurrency(project.monthlyEstimate) : t("projects.noCostSaved")}</span>
                    </div>
                  </button>

                  <div className="project-card-actions">
                    <button type="button" className="danger-button" onClick={handleDeleteProject} disabled={isDeleting}>
                      {isDeleting ? t("projects.deleting") : t("projects.delete")}
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
          <p>{t("projects.detailDescription")}</p>
        </div>

        {isLoadingSelectedProject ? (
          <div className="empty-state">
            <p>{t("projects.loadingDetail")}</p>
          </div>
        ) : selectedProject?.plan ? (
          <PlanDetails plan={selectedProject.plan} />
        ) : (
          <div className="empty-state">
            <p>{t("projects.selectProject")}</p>
          </div>
        )}
      </div>
    </section>
  );
}
