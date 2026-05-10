import { slugify } from "./formatters";

const DIAGRAM_WIDTH = 1160;
const DIAGRAM_HEIGHT = 640;
const NODE_WIDTH = 180;
const NODE_HEIGHT = 64;
const NODE_RADIUS = 18;

export function downloadDrawio(plan) {
  if (!plan?.drawioXml) {
    return;
  }

  const fileName = `${slugify(plan.input.projectName || "architecture-plan")}.drawio`;
  downloadBlob(plan.drawioXml, "application/xml", fileName);
}

export function downloadDiagramSvg(plan, options = {}) {
  if (!plan?.diagram) {
    return;
  }

  const fileName = `${slugify(plan.input.projectName || "architecture-plan")}.svg`;
  const content = buildDiagramSvg(plan, options);
  downloadBlob(content, "image/svg+xml;charset=utf-8", fileName);
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

function buildDiagramSvg(plan, options) {
  const title = plan.input.projectName || options.fallbackTitle || "Architecture Plan";
  const nodeMap = new Map(plan.diagram.nodes.map((node) => [node.id, node]));
  const edges = plan.diagram.edges.map((edge) => renderEdgeSvg(edge, nodeMap, options)).filter(Boolean).join("\n");
  const nodes = plan.diagram.nodes.map((node) => renderNodeSvg(node, options)).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${DIAGRAM_WIDTH}" height="${DIAGRAM_HEIGHT}" viewBox="0 0 ${DIAGRAM_WIDTH} ${DIAGRAM_HEIGHT}" role="img" aria-labelledby="diagram-title">
  <title id="diagram-title">${escapeXml(title)}</title>
  <rect width="${DIAGRAM_WIDTH}" height="${DIAGRAM_HEIGHT}" fill="#f6efe6" />
  ${renderWrappedSvgText({
    text: title,
    x: 40,
    y: 46,
    fontFamily: "Georgia, serif",
    fontSize: 28,
    fontWeight: 700,
    fill: "#2e241d",
    maxCharactersPerLine: 56,
    maxLines: 2,
    lineHeight: 32,
  })}
  ${edges}
  ${nodes}
</svg>`;
}

function renderNodeSvg(node, options) {
  const fill = node.role === "database" ? "#d7c0a6" : "#fffdf8";
  const label = options.translateFixedText ? options.translateFixedText(node.label) : node.label;

  return `
  <g>
    <rect x="${node.x}" y="${node.y}" width="${NODE_WIDTH}" height="${NODE_HEIGHT}" rx="${NODE_RADIUS}" ry="${NODE_RADIUS}" fill="${fill}" stroke="#3f2f24" stroke-width="2" />
    ${renderWrappedSvgText({
      text: label,
      x: node.x + NODE_WIDTH / 2,
      y: node.y + NODE_HEIGHT / 2 + 1,
      fontFamily: "'Trebuchet MS', sans-serif",
      fontSize: 17,
      fontWeight: 600,
      fill: "#2e241d",
      textAnchor: "middle",
      maxCharactersPerLine: 18,
      maxLines: 3,
      lineHeight: 20,
    })}
  </g>`;
}

function renderEdgeSvg(edge, nodeMap, options) {
  const from = nodeMap.get(edge.from);
  const to = nodeMap.get(edge.to);

  if (!from || !to) {
    return "";
  }

  const startX = from.x + NODE_WIDTH;
  const startY = from.y + NODE_HEIGHT / 2;
  const endX = to.x;
  const endY = to.y + NODE_HEIGHT / 2;
  const middleX = Math.round((startX + endX) / 2);
  const label = edge.label ? (options.translateFixedText ? options.translateFixedText(edge.label) : edge.label) : "";

  return `
  <g>
    <path d="M ${startX} ${startY} L ${middleX} ${startY} L ${middleX} ${endY} L ${endX} ${endY}" fill="none" stroke="#5b6c84" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    ${label
      ? renderWrappedSvgText({
          text: label,
          x: middleX,
          y: Math.min(startY, endY) - 14,
          fontFamily: "'Trebuchet MS', sans-serif",
          fontSize: 14,
          fontWeight: 400,
          fill: "#5b6c84",
          textAnchor: "middle",
          maxCharactersPerLine: 12,
          maxLines: 2,
          lineHeight: 16,
        })
      : ""}
  </g>`;
}

function renderWrappedSvgText({
  fill,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  maxCharactersPerLine,
  maxLines,
  text,
  textAnchor = "start",
  x,
  y,
}) {
  const lines = wrapText(text, maxCharactersPerLine, maxLines);

  if (lines.length === 0) {
    return "";
  }

  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  const tspans = lines
    .map(
      (line, index) =>
        `<tspan x="${x}" y="${startY + index * lineHeight}">${escapeXml(line)}</tspan>`
    )
    .join("");

  return `<text fill="${fill}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" text-anchor="${textAnchor}">${tspans}</text>`;
}

function wrapText(value, maxCharactersPerLine, maxLines) {
  const text = String(value ?? "").trim();

  if (!text) {
    return [];
  }

  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length <= maxCharactersPerLine || !currentLine) {
      currentLine = nextLine;
      continue;
    }

    lines.push(currentLine);

    if (lines.length === maxLines - 1) {
      currentLine = word;
      break;
    }

    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, maxLines).map((line, index) => {
    if (index !== maxLines - 1 || line.length <= maxCharactersPerLine) {
      return line;
    }

    return `${line.slice(0, Math.max(0, maxCharactersPerLine - 3)).trimEnd()}...`;
  });
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
