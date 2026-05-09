import { FieldRenderer } from "./FieldRenderer";

export function QuestionnairePanel({
  canGeneratePlan,
  formValues,
  handleSubmit,
  isLoadingPlan,
  questionnaire,
  toggleFeature,
  updateField,
}) {
  return (
    <section className="panel questionnaire-panel">
      <div className="panel-heading">
        <h2>Project Questionnaire</h2>
        <p>These answers drive the rule engine directly. No AI is involved in the recommendation logic.</p>
      </div>

      <form onSubmit={handleSubmit} className="questionnaire-form">
        {questionnaire.map((field) => (
          <FieldRenderer
            key={field.id}
            field={field}
            value={formValues[field.id]}
            onChange={updateField}
            onToggleFeature={toggleFeature}
          />
        ))}

        <button type="submit" className="primary-button" disabled={!canGeneratePlan || isLoadingPlan}>
          {isLoadingPlan ? "Generating architecture..." : "Generate architecture plan"}
        </button>
      </form>
    </section>
  );
}
