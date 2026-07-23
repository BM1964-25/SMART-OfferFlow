"use client";

import { Check, Download, Printer, Save, Send } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { activeGroups, calculateSummary, formatCurrency, groupNumber, groupTotal, positionNumber, positionTotal } from "@/lib/calculations";
import { coverLetterOfferSectionVisibility, defaultOfferSectionTitleVisibility, defaultOfferSectionVisibility, structuredOfferSectionVisibility } from "@/lib/data";
import { printElement } from "@/lib/print";
import { CompanyProfile, OfferSectionKey, PositionGroup, Project } from "@/lib/types";

function readableTextColor(background: string) {
  const hex = background.replace("#", "");
  if (hex.length !== 6) return "#ffffff";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#111827" : "#ffffff";
}

function LinkedAgbText({ text, url }: { text: string; url?: string }) {
  if (!url || !text.includes(url)) return <>{text}</>;
  const [before, after] = text.split(url);
  return (
    <>
      {before}
      <a className="font-medium text-slate-600 underline underline-offset-2" href={url} target="_blank" rel="noreferrer">
        {url}
      </a>
      {after}
    </>
  );
}

function TextBlock({ text, className = "", linkedAgbUrl }: { text: string; className?: string; linkedAgbUrl?: string }) {
  const paragraphs = text
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  if (!paragraphs.length) return null;

  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p key={`${paragraph}-${index}`} className={`${className} ${index > 0 ? "mt-4" : ""}`.trim()}>
          {linkedAgbUrl ? <LinkedAgbText text={paragraph} url={linkedAgbUrl} /> : paragraph}
        </p>
      ))}
    </>
  );
}

function formatCompanyAddressLines(profile: CompanyProfile) {
  const nameWithoutSeparators = profile.name.replace(/\s*-\s*/g, " ");
  const withoutDuplicateName = profile.address
    .replace(profile.name, "")
    .replace(nameWithoutSeparators, "")
    .replace(/^,\s*/, "")
    .replace(/\s*,\s*/g, "\n");
  return withoutDuplicateName
    .replace(/\s+(\d{5}\s+\S.*)$/m, "\n$1")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatBankDetails(bank: string) {
  const raw = bank.trim();
  const owner = raw
    .match(/^(.*?)(?=\bIBAN\b)/i)?.[1]
    ?.replace(/^Bankverbindung:\s*/i, "")
    .replace(/,\s*$/, "")
    .trim();
  const iban = raw.match(/\bIBAN\s+(.+?)(?:,?\s+BIC\b|$)/i)?.[1]?.replace(/,\s*$/, "").trim();
  const bic = raw.match(/\bBIC\s+([A-Z0-9]+)/i)?.[1]?.trim();
  return { owner, iban, bic, raw };
}

function hrefForToken(token: string, bookingUrl: string) {
  if (token === "Online-Terminbuchung") return bookingUrl;
  if (/^www\./i.test(token)) return `https://${token}`;
  if (/^https?:\/\//i.test(token)) return token;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(token)) return `mailto:${token}`;
  return token;
}

function renderLinkedFooterLine(line: string, bookingUrl: string) {
  const tokenPattern = /(Online-Terminbuchung|https?:\/\/[^\s]+|www\.[^\s]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi;
  const parts = line.split(tokenPattern);
  return parts.map((part, index) => {
    if (!part) return null;
    if (tokenPattern.test(part)) {
      tokenPattern.lastIndex = 0;
      return (
        <a
          key={`${part}-${index}`}
          className="font-medium text-slate-600 underline underline-offset-2"
          href={hrefForToken(part, bookingUrl)}
          target="_blank"
          rel="noreferrer"
        >
          {part}
        </a>
      );
    }
    tokenPattern.lastIndex = 0;
    return part;
  });
}

function FooterTextBlock({ text, bookingUrl, className = "" }: { text: string; bookingUrl: string; className?: string }) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  return (
    <>
      {lines.map((line, index) => (
        <p key={`${line}-${index}`} className={index === 0 ? className : ""}>
          {renderLinkedFooterLine(line, bookingUrl)}
        </p>
      ))}
    </>
  );
}

function hasText(value?: string | null) {
  return Boolean(value?.trim());
}

function slugifyFilePart(value: string, fallback: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " und ")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return slug || fallback;
}

function dateStamp(date = new Date()) {
  return new Intl.DateTimeFormat("de-DE", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date).split(".").reverse().join("-");
}

function createPdfFileName(project: Project, company?: CompanyProfile) {
  const offerNumber = slugifyFilePart(project.offerNumber, "ohne-angebotsnummer");
  const companyPart = slugifyFilePart(company?.logoText || company?.name || project.companyId, "firmenprofil");
  const clientPart = slugifyFilePart(project.client, "ohne-kunde");
  const subjectPart = slugifyFilePart(project.offerSubject || project.projectName, "angebot");
  return `${offerNumber}-${companyPart}-${clientPart}-${subjectPart}-${dateStamp()}-angebot.pdf`;
}

function pdfBase64ToBlob(pdfBase64: string) {
  const binary = window.atob(pdfBase64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: "application/pdf" });
}

function formatRecipientAddress(project: Project) {
  const client = project.client.trim();
  const address = (project.clientAddress ?? "").trim();
  if (!address) return client;
  if (!client) return address;
  const firstAddressLine = address.split("\n")[0]?.trim().toLowerCase();
  if (firstAddressLine === client.toLowerCase()) return address;
  return `${client}\n${address}`;
}

const structuredOfferHiddenSections: OfferSectionKey[] = [
  "assignmentReason",
  "shortDescription",
  "objective",
  "serviceScope",
  "contractorRole",
  "changeTerms",
  "contractBasis",
  "paymentTerms",
  "validityText",
  "offerClarification",
  "offerNote",
  "acceptanceText"
];

function sectionEnabled(project: Project, key: OfferSectionKey) {
  if (project.offerType === "Strukturierte Leistungsbeschreibung" && structuredOfferHiddenSections.includes(key)) return false;
  const defaults =
    project.offerType === "Anschreiben ohne LV"
      ? coverLetterOfferSectionVisibility
      : project.offerType === "Strukturierte Leistungsbeschreibung"
        ? structuredOfferSectionVisibility
        : defaultOfferSectionVisibility;
  return (project.sectionVisibility ?? {})[key] ?? defaults[key];
}

function sectionTitleEnabled(project: Project, key: OfferSectionKey) {
  return (project.sectionTitleVisibility ?? {})[key] ?? defaultOfferSectionTitleVisibility[key];
}

export function OfferPreview({
  project,
  groups,
  profiles,
  publicView = false,
  onSaveOffer,
  onExportJson,
  onExportOffer,
  onOfferSent
}: {
  project: Project;
  groups: PositionGroup[];
  profiles: CompanyProfile[];
  publicView?: boolean;
  onSaveOffer?: () => void;
  onExportJson?: () => void;
  onExportOffer?: () => void;
  onOfferSent?: (link: string) => void;
}) {
  const [shareStatus, setShareStatus] = useState<"idle" | "saving" | "copied" | "error">("idle");
  const [pdfStatus, setPdfStatus] = useState<"idle" | "creating" | "error">("idle");
  const [pdfFallback, setPdfFallback] = useState<{ url: string; filename: string } | null>(null);
  const [shareMessage, setShareMessage] = useState("");
  const [localSaveStatus, setLocalSaveStatus] = useState<"idle" | "saved">("idle");
  const company = profiles.find((profile) => profile.id === project.companyId) ?? profiles[0];
  const bankDetails = formatBankDetails(company.bank);
  const accountOwner = company.id === "metzger-real-estate" ? "Bernhard Metzger" : bankDetails.owner;
  const bookingUrl = company.bookingUrl;
  const footerIntro = company.footerIntro || company.footer;
  const footerContact =
    company.footerContact ||
    [company.ownerLine ? `Inhaber: ${company.ownerLine}` : "", `Telefon: ${company.phone}`, `E-Mail: ${company.email}`, bookingUrl ? "Termin vereinbaren: Online-Terminbuchung" : ""]
      .filter(Boolean)
      .join("\n");
  const footerLegal = company.footerLegal || [`Web: ${company.website}`, `USt-ID: ${company.vatId}`, company.agbUrl ? `AGB: ${company.agbUrl}` : ""].filter(Boolean).join("\n");
  const footerBank =
    company.footerBank ||
    [accountOwner ? `Kontoinhaber: ${accountOwner}` : "", bankDetails.iban ? `IBAN: ${bankDetails.iban}` : "", bankDetails.bic ? `BIC: ${bankDetails.bic}` : bankDetails.raw]
      .filter(Boolean)
      .join("\n");
  const hasFooterIntro = hasText(footerIntro);
  const hasFooterContact = hasText(footerContact);
  const hasFooterLegal = hasText(footerLegal);
  const hasFooterBank = hasText(footerBank);
  const companyAddressLines = formatCompanyAddressLines(company);
  const recipientAddress = formatRecipientAddress(project);
  const summary = calculateSummary(groups, project);
  const offerDate = new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(new Date(`${project.offerDate}T12:00:00`));
  const visibleGroups = activeGroups(groups).filter((group) => group.positions.some((position) => position.active));
  const hasServiceDirectory = project.offerType === "Mit Leistungsverzeichnis";
  const hasStructuredDescription = project.offerType === "Strukturierte Leistungsbeschreibung";
  const subtotal = summary.net + summary.discount;
  const structuredSections = (project.structuredSections ?? []).filter(
    (section) =>
      hasText(section.title) ||
      hasText(section.subtitle) ||
      (section.subtitles ?? []).some(hasText) ||
      hasText(section.body) ||
      (section.bullets ?? []).some(hasText) ||
      hasText(section.afterBulletsText) ||
      (section.tableRows ?? []).some((row) => hasText(row.label) || hasText(row.value)) ||
      hasText(section.afterTableText) ||
      (section.subsections ?? []).some(
        (subsection) =>
          hasText(subsection.title) ||
          hasText(subsection.body) ||
          (subsection.bullets ?? []).some(hasText) ||
          hasText(subsection.afterBulletsText) ||
          (subsection.tableRows ?? []).some((row) => hasText(row.label) || hasText(row.value)) ||
          hasText(subsection.afterTableText)
      )
  );
  const projectTextCards = [
    { key: "shortDescription" as const, title: "Aufgabenstellung", body: project.shortDescription },
    { key: "objective" as const, title: "Zielsetzung", body: project.objective },
    { key: "serviceScope" as const, title: "Leistungsrahmen", body: project.serviceScope },
    { key: "contractorRole" as const, title: "Auftragnehmerrolle", body: project.contractorRole }
  ].filter((item) => sectionEnabled(project, item.key) && hasText(item.body));
  const hasLegalContent =
    (sectionEnabled(project, "paymentTerms") && hasText(project.paymentTerms)) ||
    project.skontoPercent > 0 ||
    (sectionEnabled(project, "contractBasis") && hasText(project.contractBasis)) ||
    (sectionEnabled(project, "validityText") && hasText(project.validityText)) ||
    (sectionEnabled(project, "offerClarification") && hasText(project.offerClarification)) ||
    (sectionEnabled(project, "offerNote") && hasText(project.offerNote));
  const printOffer = () => {
    printElement(".print-area", `${project.offerNumber} ${project.projectName}`.trim());
  };
  const createProfessionalPdf = async () => {
    try {
      setPdfStatus("creating");
      setPdfFallback((current) => {
        if (current) URL.revokeObjectURL(current.url);
        return null;
      });
      setShareMessage("Professionelles PDF wird erstellt.");
      const title = `${project.offerNumber || "Angebot"} ${project.projectName || project.client || ""}`.trim();
      const isLocalApp = ["localhost", "127.0.0.1", "0.0.0.0"].includes(window.location.hostname);

      if (!isLocalApp) {
        const pdfWindow = window.open("", "_blank");
        const writePdfWindowMessage = (heading: string, body: string) => {
          if (!pdfWindow || pdfWindow.closed) return;
          pdfWindow.document.open();
          pdfWindow.document.write(`<!doctype html>
            <title>${heading}</title>
            <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; line-height: 1.5;">
              <h1 style="font-size: 22px; margin: 0 0 12px;">${heading}</h1>
              <p style="max-width: 680px;">${body}</p>
            </body>`);
          pdfWindow.document.close();
        };
        if (pdfWindow) {
          writePdfWindowMessage("PDF wird erstellt", "Bitte einen Moment warten. Das Angebot wird vorbereitet und als PDF geöffnet.");
        }

        const createFallbackPdf = async (reason?: string) => {
          writePdfWindowMessage(
            "PDF wird direkt erstellt",
            reason ? `${reason} Die App erstellt die PDF jetzt direkt und stellt danach einen Download bereit.` : "Die App erstellt die PDF jetzt direkt und stellt danach einen Download bereit."
          );
          const fallbackResponse = await fetch("/api/pdf/", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              project,
              groups,
              profiles,
              title,
              baseUrl: window.location.origin,
              responseMode: "json",
              saveLocal: false
            })
          });
          const fallbackResult = (await fallbackResponse.json()) as { filename?: string; pdfBase64?: string; error?: string };
          if (!fallbackResponse.ok || !fallbackResult.pdfBase64 || !fallbackResult.filename) {
            const message = fallbackResult.error || reason || "PDF konnte online nicht vorbereitet werden.";
            writePdfWindowMessage("PDF konnte nicht erstellt werden", message);
            throw new Error(message);
          }

          const blob = pdfBase64ToBlob(fallbackResult.pdfBase64);
          const url = URL.createObjectURL(blob);
          setPdfFallback({ url, filename: fallbackResult.filename });
          writePdfWindowMessage("PDF wurde erstellt", "Safari konnte die PDF nicht automatisch öffnen. Bitte im ursprünglichen App-Fenster den Button \"PDF herunterladen\" nutzen.");
          setShareMessage(`PDF erstellt: ${fallbackResult.filename}. Bitte unten "PDF herunterladen" nutzen.`);
          window.setTimeout(() => setPdfStatus("idle"), 1800);
        };

        const offerController = new AbortController();
        const offerTimeout = window.setTimeout(() => offerController.abort(), 8000);
        let result: { token?: string; error?: string };
        try {
          const response = await fetch("/api/offers", {
            method: "POST",
            headers: { "content-type": "application/json" },
            signal: offerController.signal,
            body: JSON.stringify({ project, groups, profiles })
          });
          result = (await response.json()) as { token?: string; error?: string };
          if (!response.ok || !result.token) {
            await createFallbackPdf(result.error || "Der kurze PDF-Link konnte nicht vorbereitet werden.");
            return;
          }
        } catch (error) {
          const reason =
            error instanceof DOMException && error.name === "AbortError"
              ? "Der kurze PDF-Link hat zu lange gebraucht."
              : error instanceof Error
                ? error.message
                : "Der kurze PDF-Link konnte nicht vorbereitet werden.";
          await createFallbackPdf(reason);
          return;
        } finally {
          window.clearTimeout(offerTimeout);
        }

        const pdfUrl = `/api/pdf?token=${encodeURIComponent(result.token)}&inline=1`;
        if (pdfWindow && !pdfWindow.closed) {
          pdfWindow.location.href = pdfUrl;
        } else {
          window.open(pdfUrl, "_blank", "noopener,noreferrer");
        }
        setShareMessage("PDF wird in einem neuen Tab geöffnet. Dort kann sie gespeichert oder gedruckt werden.");
        window.setTimeout(() => setPdfStatus("idle"), 1800);
        return;
      }

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 90000);
      const response = await fetch("/api/pdf/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          project,
          groups,
          profiles,
          title,
          baseUrl: window.location.origin,
          responseMode: "json",
          saveLocal: isLocalApp
        })
      });
      window.clearTimeout(timeout);
      const result = (await response.json()) as {
        saved?: boolean;
        path?: string;
        filename?: string;
        pdfBase64?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(result.error || "PDF konnte serverseitig nicht erstellt werden.");
      }

      if (result.saved && result.path) {
        setShareMessage(`PDF gespeichert: ${result.path}`);
      } else if (result.pdfBase64 && result.filename) {
        const blob = pdfBase64ToBlob(result.pdfBase64);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setPdfFallback({ url, filename: result.filename });
        setShareMessage(`PDF erstellt: ${result.filename}. Falls Safari keinen Download ablegt, bitte unten "PDF herunterladen" nutzen.`);
      } else {
        throw new Error("PDF wurde erstellt, aber die Serverantwort enthielt keine Datei.");
      }
      window.setTimeout(() => setPdfStatus("idle"), 2500);
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === "AbortError"
          ? "PDF-Erstellung wurde nach 90 Sekunden abgebrochen. Bitte die Angebotsvorschau neu laden und erneut versuchen."
          : error instanceof Error
            ? error.message
            : "PDF konnte nicht erstellt werden.";
      setPdfStatus("error");
      setShareMessage(`${message} Bitte lokal mit laufendem Next-Server oder auf Vercel erneut versuchen.`);
      window.setTimeout(() => setPdfStatus("idle"), 4500);
    }
  };
  const saveOffer = () => {
    onSaveOffer?.();
    setLocalSaveStatus("saved");
    setShareMessage("Angebot gespeichert.");
    window.setTimeout(() => setLocalSaveStatus("idle"), 3500);
  };
  const shareOffer = async () => {
    try {
      setShareStatus("saving");
      setShareMessage("Angebot wird gespeichert und kurzer Kundenlink wird erstellt.");
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ project, groups, profiles })
      });
      const result = (await response.json()) as { link?: string; error?: string };
      if (!response.ok || !result.link) {
        throw new Error(result.error || "Kundenlink konnte nicht erstellt werden.");
      }

      const link = result.link;
      await navigator.clipboard.writeText(link);
      onOfferSent?.(link);
      setShareStatus("copied");
      setShareMessage("Kurzer Kundenlink wurde kopiert. Angebot wurde als versendet markiert.");
      window.setTimeout(() => setShareStatus("idle"), 6500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kundenlink konnte nicht erstellt werden.";
      setShareStatus("error");
      setShareMessage(`${message} Bitte Supabase-Konfiguration prüfen.`);
    }
  };

  return (
    <>
      {!publicView ? (
      <div className="no-print mb-4 rounded-lg border border-line bg-white px-4 py-3 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">Angebotsvorschau</p>
            <p className="text-xs text-muted">
              {shareMessage || "Kundenlink speichert das Angebot in Supabase und kopiert einen kurzen Link."}
            </p>
            <p className="mt-1 text-xs text-muted">
              PDF-Hinweis: Lokal wird die PDF direkt im Downloads-Ordner gespeichert. Online wird ein Download erzeugt und bei Bedarf zusätzlich als manueller Link angezeigt.
            </p>
            {pdfFallback ? (
              <div className="mt-3 rounded-md border border-blue-100 bg-blue-50 p-3">
                <p className="text-xs font-semibold text-blue-950">PDF ist erstellt, aber Safari speichert Downloads nicht immer automatisch.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <a
                    className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-700 px-3 text-xs font-semibold text-white transition hover:bg-blue-800"
                    href={pdfFallback.url}
                    download={pdfFallback.filename}
                  >
                    <Download className="h-4 w-4" />
                    PDF herunterladen
                  </a>
                  <a
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-blue-200 bg-white px-3 text-xs font-semibold text-blue-800 transition hover:bg-blue-100"
                    href={pdfFallback.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Printer className="h-4 w-4" />
                    PDF öffnen
                  </a>
                </div>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={saveOffer}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-slate-300 hover:bg-slate-50"
          >
            {localSaveStatus === "saved" ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {localSaveStatus === "saved" ? "Angebot gespeichert" : "Angebot speichern"}
          </button>
          {onExportJson ? (
            <button
              type="button"
              onClick={onExportJson}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Als JSON sichern
            </button>
          ) : null}
          {onExportOffer ? (
            <button
              type="button"
              onClick={onExportOffer}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Einzelangebot sichern
            </button>
          ) : null}
          <button
            type="button"
            onClick={shareOffer}
            disabled={shareStatus === "saving"}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-4 text-sm font-semibold text-blue-800 transition hover:border-blue-200 hover:bg-blue-100"
          >
            {shareStatus === "copied" ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            {shareStatus === "saving" ? "Speichere ..." : shareStatus === "copied" ? "Link kopiert" : "Angebot an Kunden versenden"}
          </button>
          <button
            type="button"
            onClick={createProfessionalPdf}
            disabled={pdfStatus === "creating"}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            <Printer className="h-4 w-4" />
            {pdfStatus === "creating" ? "PDF wird erstellt ..." : "PDF erstellen"}
          </button>
          </div>
        </div>
        <p className="mt-3 border-t border-line pt-3 text-xs leading-5 text-muted">
          Speichern aktualisiert die lokale Angebotsliste. JSON sichert den gesamten App-Stand. Einzelangebot sichert nur dieses Angebot als Datei.
        </p>
      </div>
      ) : null}
      <article className="print-area rounded-lg border border-line bg-white p-8 text-base text-black shadow-soft">
      <section className="print-section pb-0">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-10">
          <div className="min-w-0 flex-1">
            {company.id === "metzger-real-estate" ? (
              <div className="mb-12">
                <p className="metzger-letterhead text-3xl font-semibold uppercase leading-tight tracking-[0.12em] text-[#5F6671] sm:text-4xl">
                  METZGER - REAL ESTATE ADVISORY
                </p>
                <p className="mt-2 text-base text-black">use experience - secure values</p>
              </div>
            ) : (
              <div
                className="mb-12 inline-flex h-14 min-w-14 items-center justify-center rounded-md px-4 text-sm font-bold"
                style={{ background: company.colors.primary, color: readableTextColor(company.colors.primary) }}
              >
                {company.logoText}
              </div>
            )}
            {hasText(recipientAddress) ? (
              <div className="mb-24 max-w-md text-base font-medium leading-7 text-black">
                <TextBlock text={recipientAddress} className="whitespace-pre-line" />
              </div>
            ) : null}
            <p className="text-3xl font-bold uppercase tracking-[0.18em] text-black">Angebot</p>
            {hasText(project.offerSubject) ? (
              <p className="mt-6 max-w-3xl text-xl font-semibold leading-8 text-black">Betreff: {project.offerSubject}</p>
            ) : null}
          </div>
          <div className="sender-card w-full p-4 text-sm leading-6 text-black md:mt-14 md:w-[17.25rem] md:shrink-0">
            <p className="sender-card-company text-base font-semibold leading-6 text-black">{company.name}</p>
            <div className="sender-card-lines mt-2 grid gap-0.5">
              {companyAddressLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <p className="sender-card-label mt-3 font-semibold text-ink">Projektverantwortlicher</p>
            <p>{company.contact}</p>
            {company.contactRole ? <p>{company.contactRole}</p> : null}
            <p className="mt-3">{company.email}</p>
            <p>{company.phone}</p>
            <p>{company.website}</p>
          </div>
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
          <PreviewMeta label="Mandat" value={project.projectName || project.offerType} />
          <PreviewMeta label="Angebotsnummer" value={project.offerNumber} />
          <PreviewMeta label="Datum" value={offerDate} />
        </div>
        {sectionEnabled(project, "offerIntro") && hasText(project.offerIntro) ? (
          <div className="mt-12 max-w-none">
            {sectionTitleEnabled(project, "offerIntro") ? <h3 className="text-base font-semibold text-black">Angebotseinleitung</h3> : null}
            <TextBlock text={project.offerIntro} className={`${sectionTitleEnabled(project, "offerIntro") ? "mt-2 " : ""}whitespace-pre-line text-base leading-7 text-black`} />
          </div>
        ) : null}
      </section>

      {(sectionEnabled(project, "assignmentReason") && hasText(project.assignmentReason)) || projectTextCards.length > 0 || (project.offerType === "Anschreiben ohne LV" && sectionEnabled(project, "coverLetterText") && hasText(project.coverLetterText)) ? (
        <section className="print-section pb-8 pt-4">
        {sectionEnabled(project, "assignmentReason") && hasText(project.assignmentReason) ? (
          <div className="mt-6">
            {sectionTitleEnabled(project, "assignmentReason") ? <h3 className="text-base font-semibold text-black">Anlass der Beauftragung</h3> : null}
            <TextBlock text={project.assignmentReason} className={`${sectionTitleEnabled(project, "assignmentReason") ? "mt-2 " : ""}whitespace-pre-line leading-7 text-black`} />
          </div>
        ) : null}
        {projectTextCards.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {projectTextCards.map((item) => (
              <div key={item.title} className="rounded-md border border-[#D9DEE5] bg-[#F3F4F6] p-4">
                {sectionTitleEnabled(project, item.key) ? <h3 className="text-base font-semibold text-black">{item.title}</h3> : null}
                <TextBlock text={item.body} className={`${sectionTitleEnabled(project, item.key) ? "mt-2 " : ""}whitespace-pre-line leading-7 text-black`} />
              </div>
            ))}
          </div>
        ) : null}
        {project.offerType === "Anschreiben ohne LV" && sectionEnabled(project, "coverLetterText") && hasText(project.coverLetterText) ? (
          <div className="mt-6 rounded-md border border-[#D9DEE5] bg-white p-5">
            {sectionTitleEnabled(project, "coverLetterText") ? <h3 className="text-base font-semibold text-black">Allgemeiner Angebotstext</h3> : null}
            <TextBlock text={project.coverLetterText} className={`${sectionTitleEnabled(project, "coverLetterText") ? "mt-3 " : ""}whitespace-pre-line leading-7 text-black`} />
          </div>
        ) : null}
        </section>
      ) : null}

      {hasStructuredDescription && structuredSections.length > 0 ? (
        <section className="print-section py-8">
          <div className="grid gap-6">
            {structuredSections.map((section, index) => {
              const sectionSubsections = (section.subsections ?? []).filter(
                (subsection) =>
                  hasText(subsection.title) ||
                  hasText(subsection.body) ||
                  (subsection.bullets ?? []).some(hasText) ||
                  hasText(subsection.afterBulletsText) ||
                  (subsection.tableRows ?? []).some((row) => hasText(row.label) || hasText(row.value)) ||
                  hasText(subsection.afterTableText)
              );
              return (
                <div key={section.id} className="break-inside-avoid">
                  {hasText(section.title) ? (
                    <h2 className="structured-section-title text-lg font-semibold text-ink">
                      {index + 1}. {section.title}
                    </h2>
                  ) : null}
                  {sectionSubsections.length > 0 ? (
                    <div className={hasText(section.title) ? "mt-4 grid gap-5" : "grid gap-5"}>
                      {sectionSubsections.map((subsection, subsectionIndex) => {
                        const bullets = (subsection.bullets ?? []).filter(hasText);
                        const tableRows = (subsection.tableRows ?? []).filter((row) => hasText(row.label) || hasText(row.value));
                        return (
                          <div key={subsection.id} className="break-inside-avoid">
                            {hasText(subsection.title) ? (
                              <h3 className="structured-subsection-title text-base font-semibold text-black">
                                {index + 1}.{subsectionIndex + 1} {subsection.title}
                              </h3>
                            ) : null}
                            {hasText(subsection.body) ? (
                              <TextBlock text={subsection.body} className={`${hasText(subsection.title) ? "mt-2 " : ""}structured-offer-text whitespace-pre-line text-base leading-7 text-black`} />
                            ) : null}
                            {bullets.length > 0 ? (
                              <ul className="structured-offer-list mt-3 list-disc space-y-1 pl-6 text-base leading-7 text-black">
                                {bullets.map((bullet) => (
                                  <li key={bullet}>{bullet}</li>
                                ))}
                              </ul>
                            ) : null}
                            {hasText(subsection.afterBulletsText) ? <TextBlock text={subsection.afterBulletsText} className="structured-offer-text mt-3 whitespace-pre-line text-base leading-7 text-black" /> : null}
                            {tableRows.length > 0 ? (
                              <div className="mt-4 overflow-hidden rounded-md border border-[#D9DEE5]">
                                {tableRows.map((row) => (
                                  <div key={row.id} className="grid gap-4 border-b border-[#D9DEE5] px-4 py-3 text-sm last:border-b-0 md:grid-cols-2">
                                    <p className="font-medium text-black">{row.label}</p>
                                    <p className="font-semibold text-black md:text-right">{row.value}</p>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                            {hasText(subsection.afterTableText) ? <TextBlock text={subsection.afterTableText} className="structured-offer-text mt-3 whitespace-pre-line text-base leading-7 text-black" /> : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {hasServiceDirectory ? (
      <>
      <section className="print-section print-page-break-before screen-page-break-before border-t border-line py-8">
        <h2 className="text-lg font-semibold text-ink">Leistungsverzeichnis</h2>
        {sectionEnabled(project, "serviceDirectoryIntro") && project.serviceDirectoryIntro ? <TextBlock text={project.serviceDirectoryIntro} className="mt-2 max-w-4xl whitespace-pre-line text-base leading-7 text-black" /> : null}
        <div className="print-table mt-5 overflow-hidden rounded-lg border border-[#D9DEE5]">
          {visibleGroups.map((group) => {
            const activePositions = group.positions.filter((position) => position.active);
            if (activePositions.length === 0) return null;

            return (
              <div key={group.id} data-print-group className="border-b border-[#D9DEE5] last:border-b-0">
                <div className="print-keep flex flex-col gap-3 bg-[#F3F4F6] px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="font-semibold text-ink">
                      {groupNumber(groups, group.id)} {group.title}
                    </h3>
                    <TextBlock text={group.intro} className="mt-1 whitespace-pre-line text-sm text-black" />
                  </div>
                  <p className="w-fit shrink-0 rounded-md border border-[#D9DEE5] bg-white px-3 py-2 text-right text-sm font-semibold text-ink">
                    {formatCurrency(groupTotal(group))}
                  </p>
                </div>
                <div className="border-y border-[#D9DEE5] bg-[#F3F4F6] px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-black">
                  <div className="grid gap-4 lg:grid-cols-[56px_minmax(260px,1fr)_76px_68px_116px_126px]">
                    <span>Nr.</span>
                    <span>Leistung</span>
                    <span className="text-right">Einheit</span>
                    <span className="text-right">Menge</span>
                    <span className="text-right">Einzelpreis</span>
                    <span className="text-right">Positionssumme</span>
                  </div>
                </div>
                <div className="divide-y divide-[#D9DEE5]">
                  {activePositions.map((position) => (
                    <div
                      key={position.id}
                      data-print-position
                      className="break-inside-avoid grid gap-4 px-5 py-4 text-sm lg:grid-cols-[56px_minmax(260px,1fr)_76px_68px_116px_126px]"
                    >
                      <p className="font-semibold text-black">{positionNumber(groups, group.id, position.id)}</p>
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{position.title}</p>
                        <TextBlock text={position.description} className="mt-1 whitespace-pre-line leading-6 text-black" />
                        {position.note ? <TextBlock text={position.note} className="mt-2 whitespace-pre-line text-xs font-medium text-black" /> : null}
                      </div>
                      <p className="text-right text-black">{position.unit}</p>
                      <p className="text-right text-black">{position.quantity}</p>
                      <p className="text-right text-black">
                        {formatCurrency(position.unitPrice)}
                        {position.unit === "Std." ? "/Std." : null}
                        {position.unit === "Kilometer" ? "/km" : null}
                      </p>
                      <p className="text-right font-semibold text-ink">{formatCurrency(positionTotal(position))}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="print-section print-compact print-keep border-t border-line py-6">
        <h2 className="text-lg font-semibold text-ink">Zusammenfassung der Leistungsbereiche</h2>
        <div className="mt-5 overflow-hidden rounded-lg border border-[#D9DEE5]">
          <div className="divide-y divide-line">
            {visibleGroups.map((group) => (
              <div key={group.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_160px]">
                <p className="font-medium text-ink">
                  {groupNumber(groups, group.id)} {group.title}
                </p>
                <p className="font-semibold text-ink md:text-right">{formatCurrency(groupTotal(group))}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-[#D9DEE5] bg-[#F3F4F6] px-5 py-4">
            <div className="ml-auto grid max-w-md gap-3">
              <SummaryLine label="Zwischensumme netto" value={formatCurrency(subtotal)} />
              {summary.discount > 0 ? <SummaryLine label={`Nachlass ${project.discountPercent} %`} value={`-${formatCurrency(summary.discount)}`} /> : null}
              <SummaryLine label="Summe netto" value={formatCurrency(summary.net)} strong />
              <SummaryLine label={`Umsatzsteuer ${project.vatRate} %`} value={formatCurrency(summary.vat)} />
              <SummaryLine label="Gesamtbetrag brutto" value={formatCurrency(summary.gross)} strong />
            </div>
          </div>
        </div>
      </section>

      {sectionEnabled(project, "serviceExclusion") && hasText(project.serviceExclusion) ? (
        <section className="print-section print-compact py-6">
          {sectionTitleEnabled(project, "serviceExclusion") ? <h2 className="text-lg font-semibold text-ink">Leistungsabgrenzung</h2> : null}
          <TextBlock text={project.serviceExclusion} className={`${sectionTitleEnabled(project, "serviceExclusion") ? "mt-3 " : ""}whitespace-pre-line leading-7 text-black`} />
        </section>
      ) : null}
      </>
      ) : null}

      {sectionEnabled(project, "changeTerms") && hasText(project.changeTerms) ? (
        <section className="print-section print-compact py-6">
          {sectionTitleEnabled(project, "changeTerms") ? <h2 className="text-lg font-semibold text-ink">Leistungsänderungen</h2> : null}
          <TextBlock text={project.changeTerms} className={`${sectionTitleEnabled(project, "changeTerms") ? "mt-3 " : ""}whitespace-pre-line leading-7 text-black`} />
        </section>
      ) : null}

      {hasLegalContent ? (
        <section className="print-section print-compact py-6">
        <div>
          {sectionEnabled(project, "contractBasis") && hasText(project.contractBasis) ? (
            <>
              {sectionTitleEnabled(project, "contractBasis") ? <h2 className="text-lg font-semibold text-ink">Vertragsgrundlage</h2> : null}
              <TextBlock text={project.contractBasis} linkedAgbUrl={company.agbUrl} className={`${sectionTitleEnabled(project, "contractBasis") ? "mt-3 " : ""}whitespace-pre-line leading-7 text-black`} />
            </>
          ) : null}
          {sectionEnabled(project, "paymentTerms") && hasText(project.paymentTerms) ? (
            <>
              {sectionTitleEnabled(project, "paymentTerms") ? <h2 className="mt-6 text-lg font-semibold text-ink">Zahlungsbedingungen</h2> : null}
              <TextBlock text={project.paymentTerms} className={`${sectionTitleEnabled(project, "paymentTerms") ? "mt-3 " : "mt-6 "}whitespace-pre-line leading-7 text-black`} />
            </>
          ) : null}
          {project.skontoPercent > 0 ? (
            <p className="mt-3 leading-7 text-black">
              Bei Zahlung innerhalb von {project.skontoDays} Tagen wird ein Skonto in Höhe von {project.skontoPercent} % auf den
              netto zahlbaren Rechnungsbetrag gewährt.
            </p>
          ) : null}
          {sectionEnabled(project, "validityText") && hasText(project.validityText) ? (
            <>
              {sectionTitleEnabled(project, "validityText") ? <h2 className="mt-6 text-lg font-semibold text-ink">Gültigkeit</h2> : null}
              <TextBlock text={project.validityText} className={`${sectionTitleEnabled(project, "validityText") ? "mt-3 " : "mt-6 "}whitespace-pre-line leading-7 text-black`} />
            </>
          ) : null}
          {sectionEnabled(project, "offerClarification") && hasText(project.offerClarification) ? (
            <>
              {sectionTitleEnabled(project, "offerClarification") ? <h2 className="mt-6 text-lg font-semibold text-ink">Angebotsgrundlagen</h2> : null}
              <TextBlock text={project.offerClarification} className={`${sectionTitleEnabled(project, "offerClarification") ? "mt-3 " : "mt-6 "}whitespace-pre-line leading-7 text-black`} />
            </>
          ) : null}
          {sectionEnabled(project, "offerNote") && hasText(project.offerNote) ? (
            <>
              {sectionTitleEnabled(project, "offerNote") ? <h2 className="mt-6 text-lg font-semibold text-ink">Hinweis</h2> : null}
              <TextBlock text={project.offerNote} className={`${sectionTitleEnabled(project, "offerNote") ? "mt-3 " : "mt-6 "}whitespace-pre-line leading-7 text-black`} />
            </>
          ) : null}
        </div>
        </section>
      ) : null}

      {sectionEnabled(project, "acceptanceText") && hasText(project.acceptanceText) ? (
        <section className="print-section print-compact print-keep py-6">
          {sectionTitleEnabled(project, "acceptanceText") ? <h2 className="text-lg font-semibold text-ink">Auftragserteilung</h2> : null}
          <TextBlock text={project.acceptanceText} className={`${sectionTitleEnabled(project, "acceptanceText") ? "mt-3 " : ""}whitespace-pre-line leading-7 text-black`} />
          <div className="mt-28 grid gap-6 md:grid-cols-4">
            {["Ort, Datum", "Name", "Funktion", "Unterschrift"].map((label) => (
              <div key={label} className="border-t border-line pt-3 text-sm font-medium text-black">
                {label}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {hasText(project.signatureText) ? (
        <section className="print-section print-compact print-keep py-5">
          {sectionTitleEnabled(project, "signatureText") ? <h2 className="text-lg font-semibold text-ink">Unterschrift</h2> : null}
          <TextBlock text={project.signatureText} className={`${sectionTitleEnabled(project, "signatureText") ? "mt-2 " : ""}whitespace-pre-line leading-7 text-black`} />
          <div className="mt-1 w-64">
            <Image
              src="/bernhard-metzger-signature.png"
              alt="Unterschrift Bernhard Metzger"
              width={300}
              height={200}
              priority
              unoptimized
              className="h-auto w-56 object-contain"
            />
            <p className="-mt-4 pl-2 text-base font-semibold text-black">Bernhard Metzger</p>
          </div>
        </section>
      ) : null}

      <footer className="offer-footer print-keep mt-16 pt-6 text-base leading-7 text-black">
        <div className="offer-footer-full">
          <p className="offer-footer-company text-lg font-semibold text-slate-700">{company.name}</p>
          {hasFooterIntro ? <FooterTextBlock text={footerIntro} bookingUrl={bookingUrl} className="offer-footer-intro" /> : null}
          {hasFooterContact || hasFooterLegal || hasFooterBank ? (
            <div className="offer-footer-columns mt-5 grid gap-6 md:grid-cols-[1.08fr_1fr_1.2fr]">
              {hasFooterContact ? (
                <div className="offer-footer-col">
                  <p className="offer-footer-heading text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Kontakt</p>
                  <FooterTextBlock text={footerContact} bookingUrl={bookingUrl} className="mt-2" />
                </div>
              ) : null}
              {hasFooterLegal ? (
                <div className="offer-footer-col">
                  <p className="offer-footer-heading text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Rechtliches & Links</p>
                  <FooterTextBlock text={footerLegal} bookingUrl={bookingUrl} className="mt-2" />
                </div>
              ) : null}
              {hasFooterBank ? (
                <div className="offer-footer-col">
                  <p className="offer-footer-heading text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Bankverbindung</p>
                  <FooterTextBlock text={footerBank} bookingUrl={bookingUrl} className="mt-2" />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <p className="offer-footer-date hidden text-right text-sm text-black">{offerDate}</p>
      </footer>
    </article>
    </>
  );
}

function SummaryLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 text-base ${strong ? "font-semibold text-black" : "text-black"}`}>
      <span>{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function PreviewMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-24 flex-col items-center justify-center rounded-lg border border-[#D9DEE5] bg-[#F3F4F6] p-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-black">{label}</p>
      <p className="mt-2 whitespace-pre-line text-base font-semibold text-black">{value}</p>
    </div>
  );
}
