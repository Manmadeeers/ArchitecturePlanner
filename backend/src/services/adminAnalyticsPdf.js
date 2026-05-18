const PAGE_WIDTH = 595.28; // A4 portrait
const PAGE_HEIGHT = 841.89;
const PAGE_MARGIN = 40;
const LINE_HEIGHT = 16;
const FONT_REGULAR = "F1";
const FONT_BOLD = "F2";

function clampColor(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (value < 0) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  return Number(value.toFixed(4));
}

function sanitizePdfText(value) {
  const source = String(value ?? "");
  return source
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function toMoney(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "$0";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function toDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "n/a";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

function wrapText(value, maxChars = 84) {
  const text = String(value ?? "").trim();

  if (!text) {
    return [];
  }

  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length <= maxChars) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function createPdfPainter() {
  const pages = [[]];
  let pageIndex = 0;

  function currentPage() {
    return pages[pageIndex];
  }

  function addRaw(operation) {
    currentPage().push(operation);
  }

  function topToBottom(top) {
    return PAGE_HEIGHT - top;
  }

  function drawText({ x, yTop, text, font = FONT_REGULAR, size = 11, color = [0.13, 0.14, 0.18] }) {
    const [r, g, b] = color.map(clampColor);
    addRaw(`BT /${font} ${size} Tf ${r} ${g} ${b} rg 1 0 0 1 ${x.toFixed(2)} ${topToBottom(yTop).toFixed(2)} Tm (${sanitizePdfText(text)}) Tj ET`);
  }

  function fillRect({ x, yTop, width, height, color = [0.95, 0.96, 0.98] }) {
    const [r, g, b] = color.map(clampColor);
    const yBottom = topToBottom(yTop + height);
    addRaw(`${r} ${g} ${b} rg ${x.toFixed(2)} ${yBottom.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`);
  }

  function strokeLine({ x1, yTop1, x2, yTop2, width = 1, color = [0.73, 0.77, 0.84] }) {
    const [r, g, b] = color.map(clampColor);
    addRaw(`${r} ${g} ${b} RG ${width.toFixed(2)} w ${x1.toFixed(2)} ${topToBottom(yTop1).toFixed(2)} m ${x2.toFixed(2)} ${topToBottom(yTop2).toFixed(2)} l S`);
  }

  function newPage() {
    pages.push([]);
    pageIndex += 1;
  }

  return {
    drawText,
    fillRect,
    newPage,
    pages,
    strokeLine,
  };
}

function buildPdfBinary(pageStreams) {
  const objects = [];
  const reserveObject = () => {
    objects.push(null);
    return objects.length;
  };

  const catalogObjectId = reserveObject();
  const pagesObjectId = reserveObject();
  const regularFontObjectId = reserveObject();
  const boldFontObjectId = reserveObject();
  const pageObjectIds = [];
  const contentObjectIds = [];

  for (let index = 0; index < pageStreams.length; index += 1) {
    pageObjectIds.push(reserveObject());
    contentObjectIds.push(reserveObject());
  }

  objects[regularFontObjectId - 1] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[boldFontObjectId - 1] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

  for (let index = 0; index < pageStreams.length; index += 1) {
    const stream = pageStreams[index];
    const streamLength = Buffer.byteLength(stream, "latin1");
    const contentObjectId = contentObjectIds[index];
    const pageObjectId = pageObjectIds[index];

    objects[contentObjectId - 1] = `<< /Length ${streamLength} >>\nstream\n${stream}\nendstream`;
    objects[pageObjectId - 1] = `<< /Type /Page /Parent ${pagesObjectId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /${FONT_REGULAR} ${regularFontObjectId} 0 R /${FONT_BOLD} ${boldFontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`;
  }

  const kids = pageObjectIds.map((objectId) => `${objectId} 0 R`).join(" ");
  objects[pagesObjectId - 1] = `<< /Type /Pages /Kids [${kids}] /Count ${pageObjectIds.length} >>`;
  objects[catalogObjectId - 1] = `<< /Type /Catalog /Pages ${pagesObjectId} 0 R >>`;

  let output = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [0];

  for (let index = 0; index < objects.length; index += 1) {
    offsets[index + 1] = Buffer.byteLength(output, "latin1");
    output += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(output, "latin1");
  output += `xref\n0 ${objects.length + 1}\n`;
  output += "0000000000 65535 f \n";

  for (let index = 1; index <= objects.length; index += 1) {
    output += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  output += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjectId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(output, "latin1");
}

function normalizeList(list, limit = 8) {
  if (!Array.isArray(list)) {
    return [];
  }

  return list.slice(0, limit);
}

function formatCounterLine(entry, fallbackLabel = "Unknown") {
  const label = String(entry?.label || fallbackLabel);
  const count = Number(entry?.count) || 0;
  return `${label}: ${count}`;
}

function generateAdminAnalyticsPdf({ overview = {}, generatedAt = new Date(), generatedBy = null } = {}) {
  const painter = createPdfPainter();
  const totalPagesPlaceholder = { value: 1 };
  const cardsTop = 136;
  const cardGap = 14;
  const cardWidth = (PAGE_WIDTH - PAGE_MARGIN * 2 - cardGap) / 2;
  const cardHeight = 72;
  let cursorY = 0;

  function startPage() {
    cursorY = 42;

    painter.fillRect({
      x: 0,
      yTop: 0,
      width: PAGE_WIDTH,
      height: 96,
      color: [0.11, 0.2, 0.35],
    });

    painter.drawText({
      x: PAGE_MARGIN,
      yTop: 44,
      text: "ArchitecturePlanner Admin Report",
      font: FONT_BOLD,
      size: 22,
      color: [1, 1, 1],
    });

    painter.drawText({
      x: PAGE_MARGIN,
      yTop: 67,
      text: `Generated: ${toDateTime(generatedAt)} UTC`,
      font: FONT_REGULAR,
      size: 11,
      color: [0.9, 0.94, 1],
    });

    painter.drawText({
      x: PAGE_MARGIN,
      yTop: 84,
      text: `Generated by: ${generatedBy?.displayName || generatedBy?.email || `User #${generatedBy?.id || "n/a"}`}`,
      font: FONT_REGULAR,
      size: 11,
      color: [0.9, 0.94, 1],
    });
  }

  function ensureSpace(heightNeeded) {
    const bottomLimit = PAGE_HEIGHT - PAGE_MARGIN - 26;

    if (cursorY + heightNeeded <= bottomLimit) {
      return;
    }

    painter.newPage();
    startPage();
    cursorY = 120;
  }

  function drawCard({ x, yTop, label, value }) {
    painter.fillRect({
      x,
      yTop,
      width: cardWidth,
      height: cardHeight,
      color: [0.95, 0.97, 1],
    });

    painter.drawText({
      x: x + 14,
      yTop: yTop + 24,
      text: label,
      font: FONT_REGULAR,
      size: 10,
      color: [0.3, 0.37, 0.5],
    });

    painter.drawText({
      x: x + 14,
      yTop: yTop + 50,
      text: String(value),
      font: FONT_BOLD,
      size: 19,
      color: [0.12, 0.18, 0.31],
    });
  }

  function sectionTitle(title) {
    ensureSpace(36);
    painter.drawText({
      x: PAGE_MARGIN,
      yTop: cursorY,
      text: title,
      font: FONT_BOLD,
      size: 14,
      color: [0.11, 0.2, 0.35],
    });
    cursorY += 8;
    painter.strokeLine({
      x1: PAGE_MARGIN,
      yTop1: cursorY,
      x2: PAGE_WIDTH - PAGE_MARGIN,
      yTop2: cursorY,
      color: [0.67, 0.75, 0.87],
      width: 1,
    });
    cursorY += 18;
  }

  function addLines(lines = []) {
    if (lines.length === 0) {
      ensureSpace(LINE_HEIGHT);
      painter.drawText({
        x: PAGE_MARGIN + 4,
        yTop: cursorY,
        text: "No data yet.",
        font: FONT_REGULAR,
        size: 11,
        color: [0.47, 0.5, 0.57],
      });
      cursorY += LINE_HEIGHT;
      return;
    }

    for (const line of lines) {
      const wrapped = wrapText(`- ${line}`, 92);
      const rendered = wrapped.length > 0 ? wrapped : ["-"];

      for (const item of rendered) {
        ensureSpace(LINE_HEIGHT);
        painter.drawText({
          x: PAGE_MARGIN + 4,
          yTop: cursorY,
          text: item,
          font: FONT_REGULAR,
          size: 11,
          color: [0.17, 0.2, 0.24],
        });
        cursorY += LINE_HEIGHT;
      }
    }
  }

  startPage();

  const totals = overview?.totals || {};
  drawCard({
    x: PAGE_MARGIN,
    yTop: cardsTop,
    label: "Total users",
    value: Number(totals.totalUsers) || 0,
  });
  drawCard({
    x: PAGE_MARGIN + cardWidth + cardGap,
    yTop: cardsTop,
    label: "Admin users",
    value: Number(totals.totalAdmins) || 0,
  });
  drawCard({
    x: PAGE_MARGIN,
    yTop: cardsTop + cardHeight + cardGap,
    label: "Generated plans",
    value: Number(totals.totalPlans) || 0,
  });
  drawCard({
    x: PAGE_MARGIN + cardWidth + cardGap,
    yTop: cardsTop + cardHeight + cardGap,
    label: "Avg monthly estimate",
    value: toMoney(Number(totals.averageMonthlyEstimate) || 0),
  });

  cursorY = cardsTop + cardHeight * 2 + cardGap + 24;

  sectionTitle("Architecture and deployment trends");
  addLines(normalizeList(overview.mostPopularArchitectures).map((entry) => formatCounterLine(entry)));
  addLines(normalizeList(overview.mostPopularDeploymentModels).map((entry) => formatCounterLine(entry)));

  sectionTitle("Technology and market trends");
  addLines(normalizeList(overview.mostPopularTechnologyComponents).map((entry) => formatCounterLine(entry)));
  addLines(normalizeList(overview.mostPopularRegions).map((entry) => formatCounterLine(entry)));
  addLines(normalizeList(overview.mostPopularBusinessTypes).map((entry) => formatCounterLine(entry)));

  sectionTitle("Stack patterns");
  addLines(normalizeList(overview.topStackPatterns).map((entry) => formatCounterLine(entry)));

  sectionTitle("Recent plan volume (daily)");
  addLines(normalizeList(overview.recentPlanVolume, 14).map((entry) => formatCounterLine(entry)));

  sectionTitle("Recent admin activity");
  addLines(
    normalizeList(overview.recentAdminActivity, 14).map((entry) => {
      const actor = entry?.actorDisplayName || entry?.actorEmail || "System";
      return `${entry?.action || "action"} by ${actor} at ${toDateTime(entry?.createdAt)}`;
    }),
  );

  totalPagesPlaceholder.value = painter.pages.length;

  for (let index = 0; index < painter.pages.length; index += 1) {
    const pageNumber = index + 1;
    const footerText = `Page ${pageNumber} of ${totalPagesPlaceholder.value}`;
    painter.pages[index].push(
      `BT /${FONT_REGULAR} 9 Tf 0.55 0.58 0.64 rg 1 0 0 1 ${(PAGE_WIDTH - PAGE_MARGIN - 72).toFixed(2)} ${24} Tm (${sanitizePdfText(footerText)}) Tj ET`,
    );
  }

  const pageStreams = painter.pages.map((operations) => operations.join("\n"));
  return buildPdfBinary(pageStreams);
}

module.exports = {
  generateAdminAnalyticsPdf,
};
