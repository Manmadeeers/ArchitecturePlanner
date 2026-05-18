import { PlanDetails } from "./PlanDetails";
import { useI18n } from "../i18n";

export function ResultPanel({ error, planResponse }) {
  const { t } = useI18n();
  return (
    <section className="panel result-panel">
      <div className="panel-heading">
        <h2>{t("result.title")}</h2>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      {!planResponse?.plan ? <EmptyState /> : <PlanDetails plan={planResponse.plan} />}
    </section>
  );
}

function EmptyState() {
  const { t } = useI18n();

  return (
    <div className="empty-state">
      <p>{t("result.empty")}</p>
    </div>
  );
}
