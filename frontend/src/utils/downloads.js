import { slugify } from "./formatters";

const DIAGRAM_WIDTH = 1460;
const DIAGRAM_HEIGHT = 860;
const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 64;
const DEFAULT_NODE_RADIUS = 18;

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
  const nodes = Array.isArray(plan.diagram.nodes) ? plan.diagram.nodes : [];
  const edges = Array.isArray(plan.diagram.edges) ? plan.diagram.edges : [];
  const nodeMap = new Map(nodes.map((node) => [node.id, normalizeNode(node)]));

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${DIAGRAM_WIDTH}" height="${DIAGRAM_HEIGHT}" viewBox="0 0 ${DIAGRAM_WIDTH} ${DIAGRAM_HEIGHT}" role="img" aria-labelledby="diagram-title">
  <title id="diagram-title">${escapeXml(title)}</title>
  <defs>
    <marker id="diagram-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#5b6c84" />
    </marker>
  </defs>
  <rect width="${DIAGRAM_WIDTH}" height="${DIAGRAM_HEIGHT}" fill="#f6efe6" />
  ${renderTextBlock({
    fill: "#2e241d",
    fontFamily: "Georgia, serif",
    fontSize: 28,
    fontWeight: 700,
    lines: wrapText(title, 56, 2),
    lineHeight: 32,
    textAnchor: "start",
    x: 40,
    y: 48,
  })}
  ${renderEdgePathsSvg(edges, nodeMap)}
  ${renderNodesSvg(nodes, options)}
  ${renderEdgeLabelsSvg(edges, nodeMap, options)}
</svg>`;
}

function renderNodesSvg(nodes, options) {
  return nodes.map((node) => renderNodeSvg(normalizeNode(node), options)).join("\n");
}

function renderNodeSvg(node, options) {
  const lines = getTranslatedLines(node, options);

  switch (node.shape) {
    case "cube":
      return renderCubeSvg(node, lines);
    case "module":
      return renderModuleSvg(node, lines);
    case "cylinder":
      return renderCylinderSvg(node, lines);
    default:
      return renderRoundedNodeSvg(node, lines);
  }
}

function renderCubeSvg(node, lines) {
  const depth = Math.min(16, Math.max(10, Math.round(Math.min(node.width, node.height) * 0.08)));
  const frontX = node.x;
  const frontY = node.y + depth;
  const frontWidth = node.width - depth;
  const frontHeight = node.height - depth;

  return `
  <g>
    <polygon points="${frontX + depth},${node.y} ${frontX + node.width},${node.y} ${frontX + frontWidth},${frontY} ${frontX},${frontY}" fill="#fef8f0" stroke="#3f2f24" stroke-width="2" />
    <polygon points="${frontX + frontWidth},${frontY} ${frontX + node.width},${node.y} ${frontX + node.width},${node.y + frontHeight} ${frontX + frontWidth},${frontY + frontHeight}" fill="#eadbc6" stroke="#3f2f24" stroke-width="2" />
    <rect x="${frontX}" y="${frontY}" width="${frontWidth}" height="${frontHeight}" fill="#fffdf8" stroke="#3f2f24" stroke-width="2" />
    ${renderTextBlock({
      fill: "#2e241d",
      fontFamily: "'Times New Roman', serif",
      fontSize: 14,
      fontWeight: 700,
      lines: wrapLines(lines, 24, 2),
      lineHeight: 18,
      textAnchor: "middle",
      x: frontX + frontWidth / 2,
      y: frontY + 18,
    })}
  </g>`;
}

function renderModuleSvg(node, lines) {
  const tabWidth = 22;
  const tabHeight = 16;
  const topY = node.y + tabHeight;

  return `
  <g>
    <path d="M ${node.x} ${topY} L ${node.x} ${node.y + node.height} L ${node.x + node.width} ${node.y + node.height} L ${node.x + node.width} ${node.y} L ${node.x + tabWidth} ${node.y} L ${node.x + tabWidth} ${topY} Z" fill="#f8f4ed" stroke="#3f2f24" stroke-width="2" />
    <path d="M ${node.x} ${topY} L ${node.x + tabWidth} ${topY} L ${node.x + tabWidth} ${node.y}" fill="none" stroke="#3f2f24" stroke-width="2" />
    ${renderTextBlock({
      fill: "#2e241d",
      fontFamily: "'Trebuchet MS', sans-serif",
      fontSize: 16,
      fontWeight: 600,
      lines: wrapLines(lines, 22, 5),
      lineHeight: 18,
      textAnchor: "middle",
      x: node.x + node.width / 2,
      y: node.y + node.height / 2 + 6,
    })}
  </g>`;
}

function renderCylinderSvg(node, lines) {
  const ellipseHeight = Math.max(14, Math.round(node.height * 0.18));
  const bodyY = node.y + ellipseHeight / 2;
  const bodyHeight = node.height - ellipseHeight;
  const centerX = node.x + node.width / 2;

  return `
  <g>
    <rect x="${node.x}" y="${bodyY}" width="${node.width}" height="${bodyHeight}" fill="#d7c0a6" stroke="#3f2f24" stroke-width="2" />
    <ellipse cx="${centerX}" cy="${bodyY}" rx="${node.width / 2}" ry="${ellipseHeight / 2}" fill="#e7d2bb" stroke="#3f2f24" stroke-width="2" />
    <ellipse cx="${centerX}" cy="${node.y + node.height - ellipseHeight / 2}" rx="${node.width / 2}" ry="${ellipseHeight / 2}" fill="#d7c0a6" stroke="#3f2f24" stroke-width="2" />
    ${renderTextBlock({
      fill: "#2e241d",
      fontFamily: "'Times New Roman', serif",
      fontSize: 16,
      fontWeight: 600,
      lines: wrapLines(lines, 20, 3),
      lineHeight: 18,
      textAnchor: "middle",
      x: centerX,
      y: node.y + node.height / 2 + 2,
    })}
  </g>`;
}

function renderRoundedNodeSvg(node, lines) {
  return `
  <g>
    <rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="${DEFAULT_NODE_RADIUS}" ry="${DEFAULT_NODE_RADIUS}" fill="${node.role === "database" ? "#d7c0a6" : "#fffdf8"}" stroke="#3f2f24" stroke-width="2" />
    ${renderTextBlock({
      fill: "#2e241d",
      fontFamily: "'Trebuchet MS', sans-serif",
      fontSize: 17,
      fontWeight: 600,
      lines: wrapLines(lines, 18, 3),
      lineHeight: 20,
      textAnchor: "middle",
      x: node.x + node.width / 2,
      y: node.y + node.height / 2 + 1,
    })}
  </g>`;
}

function renderEdgePathsSvg(edges, nodeMap) {
  return edges
    .map((edge) => renderEdgePathSvg(edge, nodeMap))
    .filter(Boolean)
    .join("\n");
}

function renderEdgePathSvg(edge, nodeMap) {
  const geometry = describeEdgeGeometry(edge, nodeMap);

  if (!geometry) {
    return "";
  }

  return `<path d="${polylineToPath(geometry.points)}" fill="none" stroke="#5b6c84" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"${getMarkerAttributes(edge.direction)} />`;
}

function renderEdgeLabelsSvg(edges, nodeMap, options) {
  return edges
    .map((edge) => {
      const geometry = describeEdgeGeometry(edge, nodeMap);

      if (!geometry || !edge.label) {
        return "";
      }

      const label = translateLabel(edge.label, options);
      const lines = wrapText(label, 14, 2);

      return renderLabelBadge({
        fill: "#5b6c84",
        fontFamily: "'Trebuchet MS', sans-serif",
        fontSize: 14,
        fontWeight: 400,
        lineHeight: 16,
        lines,
        orientation: geometry.labelSegment.orientation,
        x: geometry.labelSegment.orientation === "vertical" ? geometry.labelSegment.midpoint.x + 52 : geometry.labelSegment.midpoint.x,
        y: geometry.labelSegment.orientation === "vertical" ? geometry.labelSegment.midpoint.y : geometry.labelSegment.midpoint.y - 14,
      });
    })
    .filter(Boolean)
    .join("\n");
}

function normalizeNode(node) {
  return {
    ...node,
    width: Number(node.width) || DEFAULT_NODE_WIDTH,
    height: Number(node.height) || DEFAULT_NODE_HEIGHT,
    shape: node.shape || "service",
  };
}

function getTranslatedLines(node, options) {
  const sourceLines = Array.isArray(node.lines) && node.lines.length > 0 ? node.lines : [node.label];
  return sourceLines.map((line) => translateLabel(line, options));
}

function translateLabel(value, options) {
  return options.translateFixedText ? options.translateFixedText(value) : value;
}

function describeEdgeGeometry(edge, nodeMap) {
  const fromNode = nodeMap.get(edge.from);
  const toNode = nodeMap.get(edge.to);

  if (!fromNode || !toNode) {
    return null;
  }

  const fromPoint = resolveAnchorPoint(fromNode, edge.fromAnchor);
  const toPoint = resolveAnchorPoint(toNode, edge.toAnchor);
  const points = buildPolylinePoints(edge, fromPoint, toPoint);

  return {
    points,
    labelSegment: getLabelSegment(points),
  };
}

function resolveAnchorPoint(node, anchor = "right") {
  switch (anchor) {
    case "left":
      return { x: node.x, y: node.y + node.height / 2 };
    case "top":
      return { x: node.x + node.width / 2, y: node.y };
    case "bottom":
      return { x: node.x + node.width / 2, y: node.y + node.height };
    default:
      return { x: node.x + node.width, y: node.y + node.height / 2 };
  }
}

function buildPolylinePoints(edge, fromPoint, toPoint) {
  const routePoints = Array.isArray(edge.points) ? edge.points : [];

  if (routePoints.length > 0) {
    return [fromPoint, ...routePoints, toPoint];
  }

  if (fromPoint.x === toPoint.x || fromPoint.y === toPoint.y) {
    return [fromPoint, toPoint];
  }

  if (edge.fromAnchor === "top" || edge.fromAnchor === "bottom" || edge.toAnchor === "top" || edge.toAnchor === "bottom") {
    const middleY = Math.round((fromPoint.y + toPoint.y) / 2);
    return [
      fromPoint,
      { x: fromPoint.x, y: middleY },
      { x: toPoint.x, y: middleY },
      toPoint,
    ];
  }

  const middleX = Math.round((fromPoint.x + toPoint.x) / 2);
  return [
    fromPoint,
    { x: middleX, y: fromPoint.y },
    { x: middleX, y: toPoint.y },
    toPoint,
  ];
}

function polylineToPath(points) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function getMarkerAttributes(direction = "forward") {
  if (direction === "both") {
    return ' marker-start="url(#diagram-arrow)" marker-end="url(#diagram-arrow)"';
  }

  if (direction === "none") {
    return "";
  }

  return ' marker-end="url(#diagram-arrow)"';
}

function getPolylineMidpoint(points) {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }

  let totalLength = 0;
  const segmentLengths = [];

  for (let index = 1; index < points.length; index += 1) {
    const length = Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y);
    segmentLengths.push(length);
    totalLength += length;
  }

  if (totalLength === 0) {
    return points[0];
  }

  let traversed = 0;
  const midpointLength = totalLength / 2;

  for (let index = 1; index < points.length; index += 1) {
    const length = segmentLengths[index - 1];

    if (traversed + length >= midpointLength) {
      const ratio = (midpointLength - traversed) / length;
      return {
        x: points[index - 1].x + (points[index].x - points[index - 1].x) * ratio,
        y: points[index - 1].y + (points[index].y - points[index - 1].y) * ratio,
      };
    }

    traversed += length;
  }

  return points[points.length - 1];
}

function getLabelSegment(points) {
  const segments = [];

  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy);

    if (length === 0) {
      continue;
    }

    segments.push({
      length,
      midpoint: {
        x: from.x + dx / 2,
        y: from.y + dy / 2,
      },
      orientation: Math.abs(dx) >= Math.abs(dy) ? "horizontal" : "vertical",
    });
  }

  if (segments.length === 0) {
    return {
      midpoint: points[0] || { x: 0, y: 0 },
      orientation: "horizontal",
    };
  }

  const preferredHorizontal = segments
    .filter((segment) => segment.orientation === "horizontal")
    .sort((left, right) => right.length - left.length)[0];

  if (preferredHorizontal) {
    return preferredHorizontal;
  }

  return segments.sort((left, right) => right.length - left.length)[0];
}

function renderTextBlock({
  fill,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  lines,
  textAnchor,
  x,
  y,
}) {
  if (!lines.length) {
    return "";
  }

  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  const tspans = lines
    .map((line, index) => `<tspan x="${x}" y="${startY + index * lineHeight}">${escapeXml(line)}</tspan>`)
    .join("");

  return `<text fill="${fill}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" text-anchor="${textAnchor}">${tspans}</text>`;
}

function renderLabelBadge({
  fill,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  lines,
  orientation = "horizontal",
  x,
  y,
}) {
  if (!lines.length) {
    return "";
  }

  const widestLine = lines.reduce((longest, line) => Math.max(longest, line.length), 0);
  const badgeWidth = Math.max(44, widestLine * fontSize * 0.62 + 16);
  const badgeHeight = lines.length * lineHeight + 8;
  const badgeX = x - badgeWidth / 2;
  const badgeY = y - badgeHeight / 2 - (orientation === "horizontal" ? 2 : 0);

  return `
  <g>
    <rect x="${badgeX}" y="${badgeY}" width="${badgeWidth}" height="${badgeHeight}" rx="10" ry="10" fill="#f6efe6" fill-opacity="0.96" stroke="#d8cbb8" stroke-width="1" />
    ${renderTextBlock({
      fill,
      fontFamily,
      fontSize,
      fontWeight,
      lineHeight,
      lines,
      textAnchor: "middle",
      x,
      y,
    })}
  </g>`;
}

function wrapLines(lines, maxCharactersPerLine, maxLines) {
  const wrappedLines = [];

  for (const line of lines) {
    wrappedLines.push(...wrapText(line, maxCharactersPerLine, maxLines - wrappedLines.length));

    if (wrappedLines.length >= maxLines) {
      break;
    }
  }

  return wrappedLines.slice(0, maxLines);
}

function wrapText(value, maxCharactersPerLine, maxLines) {
  const text = String(value ?? "").trim();

  if (!text || maxLines <= 0) {
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
