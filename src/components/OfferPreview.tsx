"use client";

import { Printer } from "lucide-react";
import { activeGroups, calculateSummary, formatCurrency, groupNumber, groupTotal, positionNumber, positionTotal } from "@/lib/calculations";
import { printElement } from "@/lib/print";
import { CompanyProfile, PositionGroup, Project } from "@/lib/types";

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

export function OfferPreview({ project, groups, profiles }: { project: Project; groups: PositionGroup[]; profiles: CompanyProfile[] }) {
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
  const summary = calculateSummary(groups, project);
  const offerDate = new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(new Date(`${project.offerDate}T12:00:00`));
  const visibleGroups = activeGroups(groups).filter((group) => group.positions.some((position) => position.active));
  const subtotal = summary.net + summary.discount;
  const projectMetaItems = [
    { label: "Mandat", value: project.projectName },
    { label: "Standort", value: project.projectLocation },
    { label: "Projektvolumen", value: project.projectVolume },
    { label: "Leistungszeitraum", value: project.plannedProjectStart }
  ].filter((item) => hasText(item.value));
  const projectTextCards = [
    { title: "Aufgabenstellung", body: project.shortDescription },
    { title: "Zielsetzung", body: project.objective },
    { title: "Leistungsrahmen", body: project.serviceScope },
    { title: "Auftragnehmerrolle", body: project.contractorRole }
  ].filter((item) => hasText(item.body));
  const hasLegalContent =
    hasText(project.paymentTerms) ||
    project.skontoPercent > 0 ||
    hasText(project.contractBasis) ||
    hasText(project.validityText) ||
    hasText(project.offerClarification);
  const printOffer = () => {
    printElement(".print-area", `${project.offerNumber} ${project.projectName}`.trim());
  };

  return (
    <>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-white px-4 py-3 shadow-soft">
        <div>
          <p className="text-sm font-semibold text-ink">LV-Vorschau</p>
        </div>
        <button
          type="button"
          onClick={printOffer}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          <Printer className="h-4 w-4" />
          PDF erstellen
        </button>
      </div>
      <article className="print-area rounded-lg border border-line bg-white p-8 text-base text-black shadow-soft">
      <section className="print-section border-b border-line pb-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            {company.id === "metzger-real-estate" ? (
              <div className="mb-20">
                <p className="text-3xl font-semibold uppercase leading-tight tracking-[0.12em] text-[#5F6671] sm:text-4xl">
                  METZGER - REAL ESTATE ADVISORY
                </p>
                <p className="mt-2 text-base text-black">use experience - secure values</p>
              </div>
            ) : (
              <div
                className="mb-20 inline-flex h-14 min-w-14 items-center justify-center rounded-md px-4 text-sm font-bold"
                style={{ background: company.colors.primary, color: readableTextColor(company.colors.primary) }}
              >
                {company.logoText}
              </div>
            )}
            <p className="text-lg font-bold uppercase tracking-[0.16em] text-black">Angebot</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-normal text-black">{project.projectName}</h1>
            {hasText(project.offerIntro) ? <p className="mt-5 max-w-3xl text-lg leading-8 text-black">{project.offerIntro}</p> : null}
          </div>
          <div className="min-w-64 rounded-lg border border-line p-4 text-base text-black">
            <p className="text-lg font-semibold leading-6 text-black">{company.name}</p>
            <div className="mt-2 grid gap-1">
              {companyAddressLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <p className="mt-3 font-semibold text-ink">Projektverantwortlicher</p>
            <p>{company.contact}</p>
            {company.contactRole ? <p>{company.contactRole}</p> : null}
            <p className="mt-3">{company.email}</p>
            <p>{company.phone}</p>
            <p>{company.website}</p>
          </div>
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-4">
          <PreviewMeta label="Empfänger" value={project.client} />
          <PreviewMeta label="Ansprechpartner" value={project.contactPerson} />
          <PreviewMeta label="Angebotsnummer" value={project.offerNumber} />
          <PreviewMeta label="Datum" value={offerDate} />
        </div>
      </section>

      {projectMetaItems.length > 0 || hasText(project.assignmentReason) || projectTextCards.length > 0 ? (
        <section className="print-section py-8">
          {projectMetaItems.length > 0 ? (
          <div className="mb-20 grid gap-4 md:grid-cols-4">
            {projectMetaItems.map((item) => (
              <PreviewMeta key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        ) : null}
        {hasText(project.assignmentReason) ? (
          <div className="mt-6">
            <h3 className="text-base font-semibold text-black">Anlass der Beauftragung</h3>
            <p className="mt-2 leading-7 text-black">{project.assignmentReason}</p>
          </div>
        ) : null}
        {projectTextCards.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {projectTextCards.map((item) => (
              <div key={item.title} className="rounded-md border border-line bg-white p-4">
                <h3 className="text-base font-semibold text-black">{item.title}</h3>
                <p className="mt-2 leading-7 text-black">{item.body}</p>
              </div>
            ))}
          </div>
        ) : null}
        </section>
      ) : null}

      <section className="print-section print-page-break-before border-t border-line py-8">
        <h2 className="text-lg font-semibold text-ink">Leistungsverzeichnis</h2>
        {project.serviceDirectoryIntro ? <p className="mt-2 max-w-4xl text-base leading-7 text-black">{project.serviceDirectoryIntro}</p> : null}
        <div className="print-table mt-5 overflow-hidden rounded-lg border border-line">
          {visibleGroups.map((group) => {
            const activePositions = group.positions.filter((position) => position.active);
            if (activePositions.length === 0) return null;

            return (
              <div key={group.id} className="border-b border-line last:border-b-0">
                <div className="print-keep flex flex-col gap-3 bg-slate-50 px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="font-semibold text-ink">
                      {groupNumber(groups, group.id)} {group.title}
                    </h3>
                    <p className="mt-1 text-sm text-black">{group.intro}</p>
                  </div>
                  <p className="w-fit shrink-0 rounded-md border border-line bg-white px-3 py-2 text-right text-sm font-semibold text-ink">
                    {formatCurrency(groupTotal(group))}
                  </p>
                </div>
                <div className="border-y border-line bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-black">
                  <div className="grid gap-4 lg:grid-cols-[56px_minmax(260px,1fr)_76px_68px_116px_126px]">
                    <span>Nr.</span>
                    <span>Leistung</span>
                    <span className="text-right">Einheit</span>
                    <span className="text-right">Menge</span>
                    <span className="text-right">Einzelpreis</span>
                    <span className="text-right">Positionssumme</span>
                  </div>
                </div>
                <div className="divide-y divide-line">
                  {activePositions.map((position) => (
                    <div
                      key={position.id}
                      className="break-inside-avoid grid gap-4 px-5 py-4 text-sm lg:grid-cols-[56px_minmax(260px,1fr)_76px_68px_116px_126px]"
                    >
                      <p className="font-semibold text-black">{positionNumber(groups, group.id, position.id)}</p>
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{position.title}</p>
                        <p className="mt-1 leading-6 text-black">{position.description}</p>
                        {position.note ? <p className="mt-2 text-xs font-medium text-black">{position.note}</p> : null}
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
        <div className="mt-5 overflow-hidden rounded-lg border border-line">
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
          <div className="border-t border-line bg-slate-50 px-5 py-4">
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

      {hasText(project.serviceExclusion) ? (
        <section className="print-section print-compact border-t border-line py-6">
          <h2 className="text-lg font-semibold text-ink">Leistungsabgrenzung</h2>
          <p className="mt-3 leading-7 text-black">{project.serviceExclusion}</p>
        </section>
      ) : null}

      {hasText(project.changeTerms) ? (
        <section className="print-section print-compact border-t border-line py-6">
          <h2 className="text-lg font-semibold text-ink">Leistungsänderungen</h2>
          <p className="mt-3 leading-7 text-black">{project.changeTerms}</p>
        </section>
      ) : null}

      {hasLegalContent ? (
        <section className="print-section print-compact border-t border-line py-6">
        <div>
          {hasText(project.paymentTerms) ? (
            <>
              <h2 className="text-lg font-semibold text-ink">Zahlungsbedingungen</h2>
              <p className="mt-3 leading-7 text-black">{project.paymentTerms}</p>
            </>
          ) : null}
          {project.skontoPercent > 0 ? (
            <p className="mt-3 leading-7 text-black">
              Bei Zahlung innerhalb von {project.skontoDays} Tagen wird ein Skonto in Höhe von {project.skontoPercent} % auf den
              netto zahlbaren Rechnungsbetrag gewährt.
            </p>
          ) : null}
          {hasText(project.contractBasis) ? (
            <>
              <h2 className="mt-6 text-lg font-semibold text-ink">Vertragsgrundlage</h2>
              <p className="mt-3 leading-7 text-black">
                <LinkedAgbText text={project.contractBasis} url={company.agbUrl} />
              </p>
            </>
          ) : null}
          {hasText(project.validityText) ? (
            <>
              <h2 className="mt-6 text-lg font-semibold text-ink">Gültigkeit</h2>
              <p className="mt-3 leading-7 text-black">{project.validityText}</p>
            </>
          ) : null}
          {hasText(project.offerClarification) ? (
            <>
              <h2 className="mt-6 text-lg font-semibold text-ink">Angebotsgrundlagen</h2>
              <p className="mt-3 leading-7 text-black">{project.offerClarification}</p>
            </>
          ) : null}
        </div>
        </section>
      ) : null}

      {hasText(project.acceptanceText) ? (
        <section className="print-section print-compact print-keep border-t border-line py-6">
          <h2 className="text-lg font-semibold text-ink">Auftragserteilung</h2>
          <p className="mt-3 leading-7 text-black">{project.acceptanceText}</p>
          <div className="mt-28 grid gap-6 md:grid-cols-4">
            {["Ort, Datum", "Name", "Funktion", "Unterschrift"].map((label) => (
              <div key={label} className="border-t border-line pt-3 text-sm font-medium text-black">
                {label}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <footer className="print-keep mt-16 border-t border-line pt-6 text-base leading-7 text-black">
        <p className="text-lg font-semibold text-slate-700">{company.name}</p>
        {hasFooterIntro ? <FooterTextBlock text={footerIntro} bookingUrl={bookingUrl} /> : null}
        {hasFooterContact || hasFooterLegal || hasFooterBank ? (
          <div className="mt-5 grid gap-6 md:grid-cols-3">
            {hasFooterContact ? (
              <div className="break-words">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Kontakt</p>
                <FooterTextBlock text={footerContact} bookingUrl={bookingUrl} className="mt-2" />
              </div>
            ) : null}
            {hasFooterLegal ? (
              <div className="break-words">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Rechtliches & Links</p>
                <FooterTextBlock text={footerLegal} bookingUrl={bookingUrl} className="mt-2" />
              </div>
            ) : null}
            {hasFooterBank ? (
              <div className="break-words">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Bankverbindung</p>
                <FooterTextBlock text={footerBank} bookingUrl={bookingUrl} className="mt-2" />
              </div>
            ) : null}
          </div>
        ) : null}
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
    <div className="flex min-h-24 flex-col items-center justify-center rounded-lg border border-line bg-slate-50 p-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-black">{label}</p>
      <p className="mt-2 text-base font-semibold text-black">{value}</p>
    </div>
  );
}
