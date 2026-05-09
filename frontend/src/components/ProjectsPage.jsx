import { useI18n } from "../i18n";
import { PlanDetails } from "./PlanDetails";

export function ProjectsPage({
  error,
  isLoadingProjects,
  isLoadingSelectedProject,
  onSelectProject,
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

              return (
                <button
                  key={project.planId}
                  type="button"
                  className={`project-card ${isActive ? "project-card-active" : ""}`}
                  onClick={() => onSelectProject(project.planId)}
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
