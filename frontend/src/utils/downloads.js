import { slugify } from "./formatters";

export function downloadDrawio(plan) {
  if (!plan?.drawioXml) {
    return;
  }

  const fileName = `${slugify(plan.input.projectName || "architecture-plan")}.drawio`;
  downloadBlob(plan.drawioXml, "application/xml", fileName);
}

export function downloadDiagramPng(plan) {
  if (!plan?.diagram) {
    return;
  }

  const fileName = `${slugify(plan.input.projectName || "architecture-plan")}.png`;
  const canvas = document.createElement("canvas");
  canvas.width = 1160;
  canvas.height = 640;
  const context = canvas.getContext("2d");

  context.fillStyle = "#f6efe6";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#2e241d";
  context.font = "700 28px Georgia";
  context.fillText(plan.input.projectName || "Architecture Plan", 40, 50);

  drawEdges(context, plan.diagram.edges, plan.diagram.nodes);
  drawNodes(context, plan.diagram.nodes);

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = fileName;
  link.click();
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
