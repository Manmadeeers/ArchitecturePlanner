const CUBE_STYLE =
  "verticalAlign=top;align=center;spacingTop=18;spacingLeft=12;spacingRight=12;shape=cube;size=10;direction=south;fontStyle=4;html=1;whiteSpace=wrap;fillColor=#fffdf8;strokeColor=#3f2f24;";
const MODULE_STYLE =
  "shape=module;align=center;verticalAlign=top;spacingTop=12;whiteSpace=wrap;html=1;fillColor=#f8f4ed;strokeColor=#3f2f24;fontSize=14;";
const CYLINDER_STYLE =
  "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#d7c0a6;strokeColor=#3f2f24;fontSize=14;";
const EDGE_BASE_STYLE =
  "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#5b6c84;fontSize=12;labelBackgroundColor=#f6efe6;";

function createNode({
  height,
  id,
  label,
  lines,
  role = "service",
  shape = "service",
  width,
  x,
  y,
}) {
  return {
    id,
    label,
    lines: Array.isArray(lines) && lines.length > 0 ? lines : [label],
    role,
    shape,
    width,
    height,
    x,
    y,
  };
}

function createEdge({
  direction = "forward",
  from,
  fromAnchor = "right",
  label = "",
  points = [],
  to,
  toAnchor = "left",
}) {
  return {
    direction,
    from,
    fromAnchor,
    label,
    points,
    to,
    toAnchor,
  };
}

function buildDiagram(plan) {
  const dataModuleLines = buildDataModuleLines(plan);

  const nodes = [
    createNode({
      id: "client-shell",
      label: plan.input.applicationType === "web-and-mobile" ? "Web + Mobile Clients" : "Client Application",
      role: "container",
      shape: "cube",
      width: 320,
      height: 240,
      x: 50,
      y: 70,
    }),
    createNode({
      id: "browser-shell",
      label: "Browser",
      role: "container",
      shape: "cube",
      width: 240,
      height: 160,
      x: 82,
      y: 140,
    }),
    createNode({
      id: "client-module",
      label: "Client Module",
      lines: buildClientModuleLines(plan),
      role: "client",
      shape: "module",
      width: 180,
      height: 92,
      x: 106,
      y: 190,
    }),
    createNode({
      id: "environment-shell",
      label: "Deployment Environment",
      role: "container",
      shape: "cube",
      width: 1050,
      height: 780,
      x: 410,
      y: 20,
    }),
    createNode({
      id: "stack-shell",
      label: "Service Stack",
      role: "container",
      shape: "cube",
      width: 990,
      height: 720,
      x: 440,
      y: 72,
    }),
    createNode({
      id: "ingress-container",
      label: "Ingress Container",
      role: "container",
      shape: "cube",
      width: 340,
      height: 250,
      x: 512,
      y: 95,
    }),
    createNode({
      id: "ingress-service",
      label: "CDN / Reverse Proxy",
      role: "delivery",
      shape: "cube",
      width: 265,
      height: 160,
      x: 543,
      y: 140,
    }),
    createNode({
      id: "ingress-module",
      label: "Ingress Module",
      lines: buildIngressModuleLines(plan),
      role: "delivery",
      shape: "module",
      width: 200,
      height: 92,
      x: 569,
      y: 194,
    }),
    createNode({
      id: "app-container",
      label: "Application Container",
      role: "container",
      shape: "cube",
      width: 380,
      height: 250,
      x: 962,
      y: 95,
    }),
    createNode({
      id: "app-service",
      label: "Application Service",
      role: "backend",
      shape: "cube",
      width: 310,
      height: 160,
      x: 989,
      y: 140,
    }),
    createNode({
      id: "app-module",
      label: "Application Module",
      lines: buildApplicationModuleLines(plan),
      role: "backend",
      shape: "module",
      width: 240,
      height: 104,
      x: 1018,
      y: 190,
    }),
    createNode({
      id: "data-container",
      label: "Database Container",
      role: "container",
      shape: "cube",
      width: 720,
      height: 270,
      x: 567,
      y: 460,
    }),
    createNode({
      id: "database",
      label: "PostgreSQL",
      role: "database",
      shape: "cylinder",
      width: 240,
      height: 120,
      x: 620,
      y: 550,
    }),
  ];

  if (dataModuleLines.length > 0) {
    nodes.push(
      createNode({
        id: "data-services",
        label: "Data Services",
        lines: dataModuleLines,
        role: "storage",
        shape: "module",
        width: 280,
        height: 132,
        x: 940,
        y: 544,
      })
    );
  }

  const edges = [
    createEdge({
      from: "browser-shell",
      to: "ingress-service",
      label: "HTTPS",
      direction: "both",
    }),
    createEdge({
      from: "ingress-service",
      to: "app-service",
      label: "HTTP",
      direction: "both",
    }),
    createEdge({
      from: "app-service",
      to: "database",
      label: "TCP/IP",
      fromAnchor: "bottom",
      toAnchor: "top",
      points: [
        { x: 1144, y: 380 },
        { x: 740, y: 380 },
      ],
    }),
  ];

  if (dataModuleLines.length > 0) {
    edges.push(
      createEdge({
        from: "app-service",
        to: "data-services",
        label: buildDataProtocolLabel(plan),
        fromAnchor: "bottom",
        toAnchor: "top",
        points: [
          { x: 1144, y: 380 },
          { x: 1340, y: 380 },
          { x: 1340, y: 544 },
        ],
      })
    );
  }

  return { nodes, edges };
}

function buildClientModuleLines(plan) {
  switch (plan.input.applicationType) {
    case "web-and-mobile":
      return ["React Frontend", "Web + Mobile Clients"];
    case "mobile-backend":
      return ["Mobile Client Support", "API Integration"];
    case "api-platform":
      return ["API Consumer Layer", "Partner / Internal Clients"];
    default:
      return ["React Frontend", "JavaScript"];
  }
}

function buildIngressModuleLines(plan) {
  const lines = ["HTTPS Termination", "Static Assets / CDN"];

  if (plan.recommendation.deploymentModel === "managed-cloud") {
    lines.push("Managed Edge");
  } else if (plan.recommendation.components.includes("cdn")) {
    lines.push("Assets");
  } else {
    lines.push("Requests");
  }

  return lines;
}

function buildApplicationModuleLines(plan) {
  const lines = [
    getArchitectureRuntimeLabel(plan.recommendation.architectureStyle),
    "Node.js + Express API",
  ];

  const optionalLines = [
    plan.recommendation.components.includes("auth-module") ? "Auth Module" : null,
    plan.recommendation.components.includes("websocket-gateway") ? "Realtime Gateway" : null,
    plan.recommendation.components.includes("notification-service") ? "Notification Service" : null,
    plan.recommendation.components.includes("payment-gateway") ? "Payment Gateway" : null,
    plan.recommendation.components.includes("rbac") || plan.recommendation.components.includes("admin-ui") ? "RBAC / Admin UI" : null,
    plan.recommendation.components.includes("job-queue") ? "Background Jobs" : null,
  ].filter(Boolean);

  return [...lines, ...optionalLines].slice(0, 4);
}

function buildDataModuleLines(plan) {
  const lines = [
    plan.recommendation.components.includes("object-storage") ? "Object Storage" : null,
    plan.recommendation.components.includes("redis-pubsub") ? "Redis / PubSub" : null,
    plan.recommendation.components.includes("search-layer") ? "Search Layer" : null,
    plan.recommendation.components.includes("monitoring") ? "Monitoring" : null,
    plan.recommendation.components.includes("automated-backups") ||
    plan.recommendation.components.includes("basic-backups") ||
    plan.recommendation.components.includes("production-db-setup") ||
    plan.recommendation.components.includes("failover")
      ? "Backups"
      : null,
  ].filter(Boolean);

  return Array.from(new Set(lines)).slice(0, 4);
}

function buildDataProtocolLabel(plan) {
  const protocols = [];

  if (
    plan.recommendation.components.includes("object-storage") ||
    plan.recommendation.components.includes("search-layer") ||
    plan.recommendation.components.includes("monitoring")
  ) {
    protocols.push("HTTPS");
  }

  if (plan.recommendation.components.includes("redis-pubsub")) {
    protocols.push("TCP/IP");
  }

  if (protocols.length === 0) {
    return "TCP/IP";
  }

  return Array.from(new Set(protocols)).join(" / ");
}

function getArchitectureRuntimeLabel(architectureStyle) {
  return {
    monolith: "Monolith Service",
    "modular-monolith": "Modular Monolith",
    "scalable-services": "Scalable Services",
  }[architectureStyle] || "Application Service";
}

function buildDrawioXml(plan) {
  const diagram = buildDiagram(plan);
  const cellEntries = [];
  const edgeEntries = [];
  let currentId = 2;
  const idByNode = {};

  for (const node of diagram.nodes) {
    currentId += 1;
    idByNode[node.id] = String(currentId);
    cellEntries.push(
      `<mxCell id="${currentId}" value="${toDrawioValue(node)}" style="${getNodeStyle(node)}" vertex="1" parent="1"><mxGeometry x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" as="geometry" /></mxCell>`
    );
  }

  for (const edge of diagram.edges) {
    currentId += 1;
    edgeEntries.push(
      `<mxCell id="${currentId}" value="${escapeXml(edge.label)}" style="${getEdgeStyle(edge)}" edge="1" parent="1" source="${idByNode[edge.from]}" target="${idByNode[edge.to]}"><mxGeometry relative="1" as="geometry">${toPointArray(edge.points)}</mxGeometry></mxCell>`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net">
  <diagram id="architecture" name="Architecture">
    <mxGraphModel dx="1389" dy="2058" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1600" pageHeight="900" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        ${cellEntries.join("")}
        ${edgeEntries.join("")}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}

function getNodeStyle(node) {
  switch (node.shape) {
    case "cube":
      return CUBE_STYLE;
    case "module":
      return MODULE_STYLE;
    case "cylinder":
      return CYLINDER_STYLE;
    default:
      return "rounded=1;whiteSpace=wrap;html=1;fillColor=#f8f4ed;strokeColor=#3f2f24;fontSize=14;";
  }
}

function getEdgeStyle(edge) {
  const arrows =
    edge.direction === "both"
      ? "startArrow=classic;endArrow=classic;"
      : edge.direction === "none"
        ? "startArrow=none;endArrow=none;"
        : "endArrow=classic;";

  return `${EDGE_BASE_STYLE}${arrows}`;
}

function toDrawioValue(node) {
  return node.lines
    .map((line) => `<div><font face="Times New Roman" style="font-size: 14px;">${escapeXml(line)}</font></div>`)
    .join("");
}

function toPointArray(points) {
  if (!Array.isArray(points) || points.length === 0) {
    return "";
  }

  return `<Array as="points">${points
    .map((point) => `<mxPoint x="${point.x}" y="${point.y}" />`)
    .join("")}</Array>`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

module.exports = {
  buildDiagram,
  buildDrawioXml,
};
