import { useI18n } from "../i18n";

export function FieldRenderer({ field, value, onChange, onToggleFeature }) {
  const { getValueLabel } = useI18n();

  if (field.type === "text" || field.type === "number") {
    return (
      <label className="field">
        <span>{field.label}</span>
        <input
          type={field.type}
          value={value}
          min={field.min}
          placeholder={field.placeholder}
          onChange={(event) => onChange(field.id, field.type === "number" ? Number(event.target.value) : event.target.value)}
        />
        <small>{field.helpText}</small>
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="field">
        <span>{field.label}</span>
        <select value={value} onChange={(event) => onChange(field.id, event.target.value)}>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {getValueLabel(option)}
            </option>
          ))}
        </select>
        <small>{field.helpText}</small>
      </label>
    );
  }

  if (field.type === "boolean") {
    return (
      <label className="toggle-field">
        <div>
          <span>{field.label}</span>
          <small>{field.helpText}</small>
        </div>
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(field.id, event.target.checked)} />
      </label>
    );
  }

  if (field.type === "multiselect") {
    return (
      <fieldset className="field fieldset">
        <legend>{field.label}</legend>
        <div className="checkbox-grid">
          {field.options.map((option) => (
            <label key={option} className="checkbox-card">
              <input type="checkbox" checked={value.includes(option)} onChange={() => onToggleFeature(option)} />
              <span>{getValueLabel(option)}</span>
            </label>
          ))}
        </div>
        <small>{field.helpText}</small>
      </fieldset>
    );
  }

  return null;
}
