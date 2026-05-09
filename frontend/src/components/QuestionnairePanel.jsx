import { FieldRenderer } from "./FieldRenderer";
import { useI18n } from "../i18n";

export function QuestionnairePanel({
  canGeneratePlan,
  formValues,
  handleSubmit,
  isLoadingPlan,
  questionnaire,
  toggleFeature,
  updateField,
}) {
  const { getQuestionnaireField, t } = useI18n();
  return (
    <section className="panel questionnaire-panel">
      <div className="panel-heading">
        <h2>{t("questionnaire.title")}</h2>
        <p>{t("questionnaire.description")}</p>
      </div>

      <form onSubmit={handleSubmit} className="questionnaire-form">
        {questionnaire.map((field) => (
          <FieldRenderer
            key={field.id}
            field={getQuestionnaireField(field)}
            value={formValues[field.id]}
            onChange={updateField}
            onToggleFeature={toggleFeature}
          />
        ))}

        <button type="submit" className="primary-button" disabled={!canGeneratePlan || isLoadingPlan}>
          {isLoadingPlan ? t("questionnaire.submitting") : t("questionnaire.submit")}
        </button>
      </form>
    </section>
  );
}
