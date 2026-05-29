const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_X = 50;
const START_Y = 742;
const LINE_HEIGHT = 15;
const MAX_TEXT_WIDTH = 88;
const MAX_LINES_PER_PAGE = Math.floor((START_Y - 50) / LINE_HEIGHT);

const escapePdfText = (value) =>
  String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const wrapLine = (line) => {
  const text = String(line ?? "");
  if (text.length <= MAX_TEXT_WIDTH) return [text];

  const words = text.split(/\s+/);
  const wrapped = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > MAX_TEXT_WIDTH && current) {
      wrapped.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) wrapped.push(current);
  return wrapped;
};

const chunkLines = (lines) => {
  const wrappedLines = lines.flatMap(wrapLine);
  const pages = [];

  for (let i = 0; i < wrappedLines.length; i += MAX_LINES_PER_PAGE) {
    pages.push(wrappedLines.slice(i, i + MAX_LINES_PER_PAGE));
  }

  return pages.length ? pages : [["No report data available."]];
};

const buildContentStream = (lines) => {
  const commands = [
    "BT",
    "/F1 10 Tf",
    "14 TL",
    `${MARGIN_X} ${START_Y} Td`
  ];

  lines.forEach((line, index) => {
    if (index > 0) commands.push("0 -15 Td");
    commands.push(`(${escapePdfText(line)}) Tj`);
  });

  commands.push("ET");
  return commands.join("\n");
};

const createPdfBuffer = (lines) => {
  const pages = chunkLines(lines);
  const objects = [];

  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };

  const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>");
  const pagesId = addObject("");
  const pageIds = [];

  pages.forEach((pageLines) => {
    const content = buildContentStream(pageLines);
    const contentId = addObject(`<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`);
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${pages.length * 2 + 3} 0 R >> >> /Contents ${contentId} 0 R >>`
    );
    pageIds.push(pageId);
  });

  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  pageIds.forEach((pageId) => {
    objects[pageId - 1] = objects[pageId - 1].replace(`${pages.length * 2 + 3} 0 R`, `${fontId} 0 R`);
  });

  const parts = ["%PDF-1.4\n"];
  const offsets = [0];

  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(parts.join(""), "utf8"));
    parts.push(`${index + 1} 0 obj\n${body}\nendobj\n`);
  });

  const xrefOffset = Buffer.byteLength(parts.join(""), "utf8");
  parts.push(`xref\n0 ${objects.length + 1}\n`);
  parts.push("0000000000 65535 f \n");

  for (let i = 1; i < offsets.length; i += 1) {
    parts.push(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
  }

  parts.push(`trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return Buffer.from(parts.join(""), "utf8");
};

module.exports = {
  createPdfBuffer
};
