import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import { activeGroups, groupNumber, groupTotal, positionNumber, positionTotal } from "@/lib/calculations";
import { CompanyProfile, PositionGroup, Project, StructuredOfferSubsection } from "@/lib/types";

const MM = 72 / 25.4;
const PAGE_WIDTH = 210 * MM;
const PAGE_HEIGHT = 297 * MM;
const MARGIN_LEFT = 22 * MM;
const MARGIN_RIGHT = 22 * MM;
const MARGIN_TOP = 22 * MM;
const MARGIN_BOTTOM = 22 * MM;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const FOOTER_TOP = PAGE_HEIGHT - 70 * MM;
const CONTENT_BOTTOM = PAGE_HEIGHT - MARGIN_BOTTOM - 8 * MM;
const SIGNATURE_PATH = path.join(process.cwd(), "public", "bernhard-metzger-signature-cropped.png");

type PdfKitDoc = InstanceType<typeof PDFDocument>;

type PdfStyles = {
  size: number;
  lineGap: number;
  font: string;
  color?: string;
};

function cleanText(value: unknown) {
  return String(value ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

function hasText(value: unknown) {
  return Boolean(cleanText(value));
}

function slugify(value: string, fallback: string) {
  const slug = value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

export function createServerPdfFileName(project: Project, profile: CompanyProfile) {
  return [
    slugify(project.offerNumber, "angebot"),
    slugify(profile.logoText || profile.name, "firma"),
    slugify(project.client, "kunde"),
    slugify(project.projectName || project.offerSubject, "angebot")
  ].join("-") + ".pdf";
}

function formatDate(dateValue: string) {
  if (!dateValue) return "";
  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(date);
}

function profileAddressLines(profile: CompanyProfile) {
  const nameWithoutSeparators = profile.name.replace(/\s*-\s*/g, " ");
  return profile.address
    .replace(profile.name, "")
    .replace(nameWithoutSeparators, "")
    .replace(/^,\s*/, "")
    .replace(/\s*,\s*/g, "\n")
    .replace(/\s+(\d{5}\s+\S.*)$/m, "\n$1")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function recipientAddress(project: Project) {
  const client = project.client.trim();
  const address = (project.clientAddress ?? "").trim();
  if (!address) return client;
  if (!client) return address;
  const firstAddressLine = address.split("\n")[0]?.trim().toLowerCase();
  if (firstAddressLine === client.toLowerCase()) return address;
  return `${client}\n${address}`;
}

function footerBlocks(profile: CompanyProfile) {
  const footerIntro = profile.footerIntro || profile.footer;
  const footerContact =
    profile.footerContact ||
    [profile.ownerLine ? `Inhaber: ${profile.ownerLine}` : "", `Telefon: ${profile.phone}`, `E-Mail: ${profile.email}`, profile.bookingUrl ? "Termin vereinbaren: Online-Terminbuchung" : ""]
      .filter(Boolean)
      .join("\n");
  const footerLegal =
    profile.footerLegal ||
    [`Web: ${profile.website}`, profile.vatId ? `USt-ID: ${profile.vatId}` : "", profile.agbUrl ? `AGB: ${profile.agbUrl.replace(/^https?:\/\//, "")}` : ""]
      .filter(Boolean)
      .join("\n");
  const footerBank = profile.footerBank || profile.bank;
  return { footerIntro, footerContact, footerLegal, footerBank };
}

function setStyle(doc: PdfKitDoc, style: PdfStyles) {
  doc.font(style.font).fontSize(style.size).fillColor(style.color ?? "#000000");
}

function textHeight(doc: PdfKitDoc, text: string, width: number, style: PdfStyles) {
  setStyle(doc, style);
  return doc.heightOfString(text || " ", { width, lineGap: style.lineGap });
}

function ensureSpace(doc: PdfKitDoc, neededHeight: number) {
  if (doc.y + neededHeight > CONTENT_BOTTOM) {
    doc.addPage();
    doc.y = MARGIN_TOP;
  }
}

function addParagraph(doc: PdfKitDoc, text: unknown, style: PdfStyles, options: { width?: number; gapAfter?: number } = {}) {
  const clean = cleanText(text);
  if (!clean) return;
  const width = options.width ?? CONTENT_WIDTH;
  const paragraphs = clean.split(/\n\s*\n/g).map((item) => item.trim()).filter(Boolean);
  for (let index = 0; index < paragraphs.length; index += 1) {
    const paragraph = paragraphs[index];
    const height = textHeight(doc, paragraph, width, style);
    ensureSpace(doc, height + (options.gapAfter ?? 5));
    setStyle(doc, style);
    if (index > 0) doc.moveDown(0.2);
    doc.text(paragraph, MARGIN_LEFT, doc.y, { width, lineGap: style.lineGap });
    doc.y += options.gapAfter ?? 5;
  }
}

function addHeading(doc: PdfKitDoc, text: string, level: "section" | "subsection" = "section") {
  const style: PdfStyles =
    level === "section"
      ? { font: "Helvetica-Bold", size: 12.2, lineGap: 2, color: "#111827" }
      : { font: "Helvetica-Bold", size: 10.8, lineGap: 2, color: "#1f2937" };
  const height = textHeight(doc, text, CONTENT_WIDTH, style);
  ensureSpace(doc, height + 10);
  doc.y += level === "section" ? 8 : 4;
  setStyle(doc, style);
  doc.text(text, MARGIN_LEFT, doc.y, { width: CONTENT_WIDTH, lineGap: style.lineGap });
  doc.y += level === "section" ? 8 : 6;
}

function addBullets(doc: PdfKitDoc, bullets: string[]) {
  const style: PdfStyles = { font: "Helvetica", size: 10.2, lineGap: 2 };
  for (const bullet of bullets.filter(hasText)) {
    const text = cleanText(bullet);
    const width = CONTENT_WIDTH - 16;
    const height = textHeight(doc, text, width, style);
    ensureSpace(doc, height + 3);
    setStyle(doc, style);
    const y = doc.y;
    doc.text("•", MARGIN_LEFT + 5, y, { width: 8 });
    doc.text(text, MARGIN_LEFT + 16, y, { width, lineGap: style.lineGap });
    doc.y = y + height + 2;
  }
  doc.y += 4;
}

function tableRowsFromSubsection(subsection: StructuredOfferSubsection) {
  return (subsection.tableRows ?? [])
    .map((row) => ({ label: cleanText(row.label), value: cleanText(row.value) }))
    .filter((row) => row.label || row.value);
}

function addSimpleTable(doc: PdfKitDoc, rows: { label: string; value: string }[]) {
  if (!rows.length) return;
  const leftWidth = 92 * MM;
  const rightWidth = CONTENT_WIDTH - leftWidth;
  const style: PdfStyles = { font: "Helvetica", size: 9.4, lineGap: 2 };
  const bold: PdfStyles = { ...style, font: "Helvetica-Bold" };
  const rowPadding = 7;
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const rowStyle = index === 0 ? bold : style;
    const rowHeight = Math.max(textHeight(doc, row.label, leftWidth - rowPadding * 2, rowStyle), textHeight(doc, row.value, rightWidth - rowPadding * 2, rowStyle)) + rowPadding * 2;
    ensureSpace(doc, rowHeight + 2);
    const y = doc.y;
    doc.lineWidth(0.35).strokeColor("#cbd5e1").rect(MARGIN_LEFT, y, CONTENT_WIDTH, rowHeight).stroke();
    if (index === 0) doc.fillColor("#f8fafc").rect(MARGIN_LEFT + 0.2, y + 0.2, CONTENT_WIDTH - 0.4, rowHeight - 0.4).fill();
    doc.strokeColor("#dbe3ec").moveTo(MARGIN_LEFT + leftWidth, y).lineTo(MARGIN_LEFT + leftWidth, y + rowHeight).stroke();
    setStyle(doc, rowStyle);
    doc.text(row.label, MARGIN_LEFT + rowPadding, y + rowPadding, { width: leftWidth - rowPadding * 2, lineGap: style.lineGap });
    doc.text(row.value, MARGIN_LEFT + leftWidth + rowPadding, y + rowPadding, { width: rightWidth - rowPadding * 2, lineGap: style.lineGap, align: "right" });
    doc.y = y + rowHeight;
  }
  doc.y += 7;
}

function subsectionHasContent(subsection: StructuredOfferSubsection) {
  return hasText(subsection.title) || hasText(subsection.body) || (subsection.bullets ?? []).some(hasText) || hasText(subsection.afterBulletsText) || tableRowsFromSubsection(subsection).length > 0 || hasText(subsection.afterTableText);
}

function addStructuredSections(doc: PdfKitDoc, project: Project) {
  const body: PdfStyles = { font: "Helvetica", size: 10.2, lineGap: 2 };
  const sections = project.structuredSections ?? [];
  for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
    const section = sections[sectionIndex];
    const subsections = (section.subsections ?? []).filter(subsectionHasContent);
    if (!hasText(section.title) && !subsections.length) continue;
    addHeading(doc, `${sectionIndex + 1}. ${cleanText(section.title) || `Abschnitt ${sectionIndex + 1}`}`);
    for (let subsectionIndex = 0; subsectionIndex < subsections.length; subsectionIndex += 1) {
      const subsection = subsections[subsectionIndex];
      if (hasText(subsection.title)) addHeading(doc, `${sectionIndex + 1}.${subsectionIndex + 1} ${cleanText(subsection.title)}`, "subsection");
      addParagraph(doc, subsection.body, body);
      addBullets(doc, (subsection.bullets ?? []).map(cleanText));
      addParagraph(doc, subsection.afterBulletsText, body);
      addSimpleTable(doc, tableRowsFromSubsection(subsection));
      addParagraph(doc, subsection.afterTableText, body);
    }
  }
}

function addHeader(doc: PdfKitDoc, project: Project, profile: CompanyProfile) {
  const senderX = MARGIN_LEFT + 106 * MM;
  const senderY = MARGIN_TOP + 14 * MM;
  doc.font("Helvetica-Bold").fontSize(14.2).fillColor("#4b5563").text("METZGER - REAL ESTATE ADVISORY", MARGIN_LEFT, MARGIN_TOP, { width: 106 * MM });
  doc.font("Helvetica").fontSize(9.5).fillColor("#000000").text("use experience - secure values", MARGIN_LEFT, doc.y + 2);

  doc.font("Helvetica").fontSize(9.4).fillColor("#000000");
  const senderLines = [
    profile.name,
    ...profileAddressLines(profile),
    "",
    "Projektverantwortlicher",
    profile.contact,
    profile.contactRole,
    "",
    profile.email,
    profile.phone,
    profile.website
  ].filter((line) => line !== undefined);
  let y = senderY;
  for (const line of senderLines) {
    const clean = cleanText(line);
    if (!clean) {
      y += 7;
      continue;
    }
    doc.font(clean === profile.name || clean === "Projektverantwortlicher" ? "Helvetica-Bold" : "Helvetica");
    doc.text(clean, senderX, y, { width: 60 * MM, lineGap: 1 });
    y = doc.y + 2;
  }

  const recipient = recipientAddress(project);
  if (recipient) {
    doc.font("Helvetica-Bold").fontSize(10.2).fillColor("#000000").text(recipient, MARGIN_LEFT, MARGIN_TOP + 42 * MM, { width: 80 * MM, lineGap: 2 });
  }

  doc.y = MARGIN_TOP + 96 * MM;
  doc.font("Helvetica-Bold").fontSize(18).fillColor("#000000").text("ANGEBOT", MARGIN_LEFT, doc.y, { characterSpacing: 1.8 });
  doc.y += 14;
  if (hasText(project.offerSubject)) {
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#000000").text(`Betreff: ${cleanText(project.offerSubject)}`, MARGIN_LEFT, doc.y, { width: CONTENT_WIDTH, lineGap: 2 });
    doc.y += 8;
  }
  const meta = [
    project.offerNumber ? `Angebotsnummer: ${project.offerNumber}` : "",
    project.offerDate ? `Datum: ${formatDate(project.offerDate)}` : "",
    profile.contact ? `Ansprechpartner: ${profile.contact}` : ""
  ]
    .filter(Boolean)
    .join(" | ");
  doc.font("Helvetica").fontSize(8.8).fillColor("#374151").text(meta, MARGIN_LEFT, doc.y, { width: CONTENT_WIDTH, lineGap: 2 });
  doc.y += 15;
}

function addSignature(doc: PdfKitDoc, project: Project, profile: CompanyProfile) {
  if (!hasText(project.signatureText)) return;
  addParagraph(doc, project.signatureText, { font: "Helvetica", size: 10.2, lineGap: 2 });
  if (fs.existsSync(SIGNATURE_PATH)) {
    ensureSpace(doc, 60);
    doc.image(SIGNATURE_PATH, MARGIN_LEFT, doc.y - 2, { width: 52 * MM });
    doc.y += 19 * MM - 5;
  }
  doc.font("Helvetica").fontSize(10.2).fillColor("#000000").text(cleanText(profile.contact) || "Bernhard Metzger", MARGIN_LEFT, doc.y);
  doc.y += 18;
}

function addServiceDirectory(doc: PdfKitDoc, project: Project, groups: PositionGroup[]) {
  if (project.offerType !== "Mit Leistungsverzeichnis") return;
  doc.addPage();
  doc.y = MARGIN_TOP;
  addHeading(doc, "Leistungsverzeichnis");
  addParagraph(doc, project.serviceDirectoryIntro, { font: "Helvetica", size: 10.2, lineGap: 2 });
  const visibleGroups = activeGroups(groups).filter((group) => group.positions.some((position) => position.active));
  for (const group of visibleGroups) {
    addHeading(doc, `${groupNumber(groups, group.id)} ${group.title}`, "subsection");
    addParagraph(doc, group.intro, { font: "Helvetica", size: 9.4, lineGap: 2 });
    for (const position of group.positions.filter((item) => item.active)) {
      const title = `${positionNumber(groups, group.id, position.id)} ${position.title}`;
      addHeading(doc, title, "subsection");
      addParagraph(doc, position.description, { font: "Helvetica", size: 9.4, lineGap: 2 });
      const line = `${position.unit} | ${position.quantity} | ${new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(position.unitPrice)} | ${new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(positionTotal(position))}`;
      addParagraph(doc, line, { font: "Helvetica-Bold", size: 9.4, lineGap: 2 });
    }
    addParagraph(doc, `Titelsumme: ${new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(groupTotal(group))}`, { font: "Helvetica-Bold", size: 9.4, lineGap: 2 });
  }
}

function drawFooter(doc: PdfKitDoc, profile: CompanyProfile) {
  const { footerIntro, footerContact, footerLegal, footerBank } = footerBlocks(profile);
  const footerX = MARGIN_LEFT;
  const footerWidth = CONTENT_WIDTH;
  let y = FOOTER_TOP + 4 * MM;
  doc.font("Helvetica-Bold").fontSize(10.2).fillColor("#1f2937").text(profile.name, footerX, y, { width: footerWidth, lineBreak: false });
  y += 14;
  if (footerIntro) {
    const introLines = footerIntro.split("\n").filter(hasText);
    doc.font("Helvetica").fontSize(9).fillColor("#000000");
    for (const line of introLines.slice(0, 3)) {
      doc.text(cleanText(line), footerX, y, { width: footerWidth, lineBreak: false });
      y += 11;
    }
    y += 8;
  }
  const columns = [
    ["KONTAKT", footerContact],
    ["RECHTLICHES & LINKS", footerLegal],
    ["BANKVERBINDUNG", footerBank]
  ] as const;
  const colWidth = footerWidth / 3 - 10;
  for (let index = 0; index < columns.length; index += 1) {
    const [heading, text] = columns[index];
    const x = footerX + index * (footerWidth / 3);
    doc.font("Helvetica-Bold").fontSize(7.6).fillColor("#374151").text(heading, x, y, { width: colWidth, lineBreak: false });
    doc.font("Helvetica").fontSize(7.2).fillColor("#000000");
    const lines = text.split("\n").filter(hasText).slice(0, 5);
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      doc.text(cleanText(lines[lineIndex]), x, y + 14 + lineIndex * 9, { width: colWidth, lineBreak: false });
    }
  }
}

function drawPageNumbers(doc: PdfKitDoc) {
  const range = doc.bufferedPageRange();
  const y = PAGE_HEIGHT - MARGIN_BOTTOM - 16;
  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index);
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#6b7280")
      .text(`Seite ${index + 1}`, PAGE_WIDTH - MARGIN_RIGHT - 45, y, {
        width: 45,
        align: "right",
        lineBreak: false
      });
  }
}

export async function generateOfferPdf({
  project,
  groups,
  profiles
}: {
  project: Project;
  groups: PositionGroup[];
  profiles: CompanyProfile[];
}) {
  const profile = profiles.find((item) => item.id === project.companyId) ?? profiles[0];
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: MARGIN_TOP, left: MARGIN_LEFT, right: MARGIN_RIGHT, bottom: MARGIN_BOTTOM },
    bufferPages: true,
    autoFirstPage: true
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  addHeader(doc, project, profile);
  addParagraph(doc, project.offerIntro, { font: "Helvetica", size: 10.2, lineGap: 2 });
  addStructuredSections(doc, project);
  addServiceDirectory(doc, project, groups);
  addSignature(doc, project, profile);
  const lastPage = doc.bufferedPageRange().start + doc.bufferedPageRange().count - 1;
  doc.switchToPage(lastPage);
  drawFooter(doc, profile);
  drawPageNumbers(doc);
  doc.end();

  return {
    pdf: await done,
    filename: createServerPdfFileName(project, profile)
  };
}
