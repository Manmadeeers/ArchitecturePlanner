import { useEffect, useMemo, useState, startTransition } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

const defaultValues = {
  projectName: "",
  projectStage: "idea",
  businessType: "saas",
  targetRegion: "north-america",
  deploymentPreference: "cloud",
  monthlyUsers: 500,
  monthlyBudget: 150,
  applicationType: "web-app",
  coreFeatures: ["authentication"],
  realtimeFeatures: false,
  dataSensitivity: "low",
  availabilityRequirement: "basic",
  expectedGrowth: "slow",
  teamTechnicalLevel: "medium",
  needFastDelivery: true,
};

export default function App() {
  const [questionnaire, setQuestionnaire] = useState([]);
  const [formValues, setFormValues] = useState(defaultValues);
  const [planResponse, setPlanResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadQuestionnaire() {
      try {
        const response = await fetch(`${API_BASE_URL}/questionnaire`);
        const data = await response.json();
        setQuestionnaire(data.questionnaire || []);
      } catch (loadError) {
        setError("Could not load questionnaire definition from the API.");
      }
    }

    loadQuestionnaire();
  }, []);

  const summaryCards = useMemo(() => {
    if (!planResponse?.plan) {
      return [];
    }

    const plan = planResponse.plan;

    return [
      { label: "Architecture", value: readable(plan.recommendation.architectureStyle) },
      { label: "Deployment", value: readable(plan.recommendation.deploymentModel) },
      { label: "Monthly Cost", value: `$${plan.cost.monthlyEstimate}` },
      { label: "Region", value: plan.regionProfile.label },
    ];
  }, [planResponse]);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/plans/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formValues),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(Array.isArray(data.details) ? data.details.join(", ") : data.error || "Failed to generate plan");
      }

      startTransition(() => {
        setPlanResponse(data);
      });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsLoading(false);
    }
  }

  function updateField(id, value) {
    setFormValues((current) => ({
      ...current,
      [id]: value,
    }));
  }

  function toggleFeature(feature) {
    setFormValues((current) => {
      const alreadySelected = current.coreFeatures.includes(feature);

      return {
        ...current,
        coreFeatures: alreadySelected
          ? current.coreFeatures.filter((entry) => entry !== feature)
          : [...current.coreFeatures, feature],
      };
    });
  }

  function downloadDrawio() {
    if (!planResponse?.plan?.drawioXml) {
      return;
    }

    const fileName = `${slugify(planResponse.plan.input.projectName || "architecture-plan")}.drawio`;
    downloadBlob(planResponse.plan.drawioXml, "application/xml", fileName);
  }

  function downloadPng() {
    if (!planResponse?.plan?.diagram) {
      return;
    }

    const fileName = `${slugify(planResponse.plan.input.projectName || "architecture-plan")}.png`;
    const canvas = document.createElement("canvas");
    canvas.width = 1160;
    canvas.height = 640;
    const context = canvas.getContext("2d");

    context.fillStyle = "#f6efe6";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#2e241d";
    context.font = "700 28px Georgia";
    context.fillText(planResponse.plan.input.projectName || "Architecture Plan", 40, 50);

    drawEdges(context, planResponse.plan.diagram.edges, planResponse.plan.diagram.nodes);
    drawNodes(context, planResponse.plan.diagram.nodes);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = fileName;
    link.click();
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Course Project MVP</p>
        <h1>ArchitecturePlanner</h1>
        <p className="hero-copy">
          Deterministic architecture generation for startups and small companies. Answer the questionnaire, get a stack
          recommendation, a development roadmap, and downloadable diagram artifacts.
        </p>
      </section>

      <div className="layout">
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

            <button type="submit" className="primary-button" disabled={isLoading}>
              {isLoading ? "Generating architecture..." : "Generate architecture plan"}
            </button>
          </form>
        </section>

        <section className="panel result-panel">
          <div className="panel-heading">
            <h2>Generated Result</h2>
            <p>The result includes summary, cost estimate, roadmap, and exportable diagram files.</p>
          </div>

          {error ? <div className="error-box">{error}</div> : null}

          {!planResponse?.plan ? (
            <div className="empty-state">
              <p>Your generated architecture plan will appear here after submission.</p>
            </div>
          ) : (
            <div className="result-stack">
              <div className="summary-grid">
                {summaryCards.map((card) => (
                  <article key={card.label} className="summary-card">
                    <span>{card.label}</span>
                    <strong>{card.value}</strong>
                  </article>
                ))}
              </div>

              <article className="narrative-card">
                <h3>Recommendation summary</h3>
                <p>{planResponse.plan.summary}</p>
              </article>

              <article className="narrative-card">
                <h3>Architecture components</h3>
                <div className="chip-grid">
                  {planResponse.plan.recommendation.components.map((component) => (
                    <span key={component} className="chip">
                      {readable(component)}
                    </span>
                  ))}
                </div>
              </article>

              <article className="narrative-card">
                <h3>Cost estimate</h3>
                <p>
                  Estimated monthly infrastructure cost: <strong>${planResponse.plan.cost.monthlyEstimate}</strong>
                </p>
                <div className="cost-grid">
                  {Object.entries(planResponse.plan.cost.breakdown).map(([key, value]) => (
                    <div key={key} className="cost-line">
                      <span>{readable(key)}</span>
                      <strong>${value}</strong>
                    </div>
                  ))}
                </div>
              </article>

              <article className="narrative-card">
                <h3>Development roadmap</h3>
                <ul className="text-list">
                  {planResponse.plan.roadmap.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="narrative-card">
                <h3>Estimated development plan</h3>
                <ul className="text-list">
                  {planResponse.plan.developmentPlan.map((item) => (
                    <li key={item.phase}>
                      <strong>{item.phase}:</strong> {item.title}. {item.outcome}
                    </li>
                  ))}
                </ul>
              </article>

              <article className="narrative-card">
                <h3>Region notes</h3>
                <ul className="text-list">
                  {planResponse.plan.regionProfile.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </article>

              {planResponse.plan.recommendation.risks.length > 0 ? (
                <article className="narrative-card warning-card">
                  <h3>Risks</h3>
                  <ul className="text-list">
                    {planResponse.plan.recommendation.risks.map((risk) => (
                      <li key={risk}>{risk}</li>
                    ))}
                  </ul>
                </article>
              ) : null}

              <div className="button-row">
                <button type="button" className="secondary-button" onClick={downloadDrawio}>
                  Download .drawio
                </button>
                <button type="button" className="secondary-button" onClick={downloadPng}>
                  Download .png
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function FieldRenderer({ field, value, onChange, onToggleFeature }) {
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
              {readable(option)}
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
              <input
                type="checkbox"
                checked={value.includes(option)}
                onChange={() => onToggleFeature(option)}
              />
              <span>{readable(option)}</span>
            </label>
          ))}
        </div>
        <small>{field.helpText}</small>
      </fieldset>
    );
  }

  return null;
}

function drawNodes(context, nodes) {
  for (const node of nodes) {
    context.fillStyle = node.role === "database" ? "#d7c0a6" : "#fffdf8";
    context.strokeStyle = "#3f2f24";
    context.lineWidth = 2;
    roundRect(context, node.x, node.y, 180, 64, 18);
    context.fill();
    context.stroke();
    context.fillStyle = "#2e241d";
    context.font = "600 17px Trebuchet MS";
    context.fillText(node.label, node.x + 16, node.y + 36);
  }
}

function drawEdges(context, edges, nodes) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  context.strokeStyle = "#5b6c84";
  context.lineWidth = 3;
  context.font = "14px Trebuchet MS";
  context.fillStyle = "#5b6c84";

  for (const edge of edges) {
    const from = nodeMap.get(edge.from);
    const to = nodeMap.get(edge.to);

    if (!from || !to) {
      continue;
    }

    const startX = from.x + 180;
    const startY = from.y + 32;
    const endX = to.x;
    const endY = to.y + 32;
    const middleX = Math.round((startX + endX) / 2);

    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(middleX, startY);
    context.lineTo(middleX, endY);
    context.lineTo(endX, endY);
    context.stroke();

    if (edge.label) {
      context.fillText(edge.label, middleX - 12, Math.min(startY, endY) - 8);
    }
  }
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function downloadBlob(content, mimeType, fileName) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function readable(value) {
  return String(value)
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
