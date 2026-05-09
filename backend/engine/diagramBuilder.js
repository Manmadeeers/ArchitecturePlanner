function createNode(id, label, role, x, y) {
  return { id, label, role, x, y };
}

function createEdge(from, to, label = "") {
  return { from, to, label };
}

function buildDiagram(plan) {
  const frontendLabel = plan.input.applicationType === "web-and-mobile" ? "Web + Mobile Clients" : "Client Application";
  const nodes = [
    createNode("client", frontendLabel, "client", 60, 80),
    createNode("edge", "CDN / Reverse Proxy", "delivery", 260, 80),
    createNode("api", "Node.js + Express API", "backend", 500, 80),
    createNode("db", "PostgreSQL", "database", 760, 80),
  ];

  const edges = [
    createEdge("client", "edge", "HTTPS"),
    createEdge("edge", "api", "Requests"),
    createEdge("api", "db", "Queries"),
  ];

  if (plan.recommendation.components.includes("object-storage")) {
    nodes.push(createNode("storage", "Object Storage", "storage", 760, 220));
    edges.push(createEdge("api", "storage", "Uploads"));
  }

  if (plan.recommendation.components.includes("cdn")) {
    nodes.push(createNode("cdn", "Static Assets / CDN", "delivery", 260, 220));
    edges.push(createEdge("client", "cdn", "Assets"));
  }

  if (plan.recommendation.components.includes("websocket-gateway")) {
    nodes.push(createNode("ws", "Realtime Gateway", "realtime", 500, 220));
    edges.push(createEdge("client", "ws", "Realtime"));
    edges.push(createEdge("ws", "db", "Events"));
  }

  if (plan.recommendation.components.includes("job-queue")) {
    nodes.push(createNode("jobs", "Background Jobs", "worker", 500, 360));
    edges.push(createEdge("api", "jobs", "Tasks"));
  }

  if (plan.recommendation.components.includes("redis-pubsub")) {
    nodes.push(createNode("cache", "Redis / PubSub", "cache", 760, 360));
    edges.push(createEdge("api", "cache", "Cache"));
  }

  return { nodes, edges };
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
      `<mxCell id="${currentId}" value="${escapeXml(node.label)}" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8f4ed;strokeColor=#3f2f24;fontSize=14;" vertex="1" parent="1"><mxGeometry x="${node.x}" y="${node.y}" width="180" height="60" as="geometry" /></mxCell>`
    );
  }

  for (const edge of diagram.edges) {
    currentId += 1;
    edgeEntries.push(
      `<mxCell id="${currentId}" value="${escapeXml(edge.label)}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#5b6c84;fontSize=12;" edge="1" parent="1" source="${idByNode[edge.from]}" target="${idByNode[edge.to]}"><mxGeometry relative="1" as="geometry" /></mxCell>`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net">
  <diagram id="architecture" name="Architecture">
    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1100" pageHeight="850" math="0" shadow="0">
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
