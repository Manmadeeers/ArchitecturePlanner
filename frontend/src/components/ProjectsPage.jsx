import { readable } from "../utils/formatters";
import { PlanDetails } from "./PlanDetails";

export function ProjectsPage({
  error,
  isLoadingProjects,
  isLoadingSelectedProject,
  onSelectProject,
  projects,
  selectedProject,
}) {
  return (
    <section className="projects-layout">
      <div className="panel projects-sidebar">
        <div className="panel-heading">
          <h2>Your Projects</h2>
          <p>Choose a saved architecture plan to load the full result, exports, and regional guidance.</p>
        </div>

        {error ? <div className="error-box">{error}</div> : null}

        {isLoadingProjects ? (
          <div className="empty-state">
            <p>Loading your saved projects...</p>
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
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p>{project.summary}</p>
                  <div className="project-card-meta">
                    <span>{project.architectureStyle ? readable(project.architectureStyle) : "Architecture TBD"}</span>
                    <span>{project.monthlyEstimate ? `$${project.monthlyEstimate}/mo` : "No cost saved"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>No saved projects yet. Generate your first architecture plan to populate this library.</p>
          </div>
        )}
      </div>

      <div className="panel project-detail-panel">
        <div className="panel-heading">
          <h2>Project Detail</h2>
          <p>Saved plan detail uses the same rendering as the live result view, including exports.</p>
        </div>

        {isLoadingSelectedProject ? (
          <div className="empty-state">
            <p>Loading project detail...</p>
          </div>
        ) : selectedProject?.plan ? (
          <PlanDetails plan={selectedProject.plan} />
        ) : (
          <div className="empty-state">
            <p>Select any project card to load the full saved architecture recommendation.</p>
          </div>
        )}
      </div>
    </section>
  );
}
