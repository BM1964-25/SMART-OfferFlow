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
      <a className="font-medium text-ink underline underline-offset-2" href={url} target="_blank" rel="noreferrer">
        {url}
      </a>
      {after}
    </>
  );
}

function formatCompanyAddressLines(profile: CompanyProfile) {
  const withoutDuplicateName = profile.address
    .replace(profile.name, "")
    .replace(/^,\s*/, "")
    .replace(/\s*,\s*/g, "\n");
  return withoutDuplicateName
    .replace(/\s+(\d{5}\s+\S.*)$/m, "\n$1")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function OfferPreview({ project, groups, profiles }: { project: Project; groups: PositionGroup[]; profiles: CompanyProfile[] }) {
  const company = profiles.find((profile) => profile.id === project.companyId) ?? profiles[0];
  const companyAddressLines = formatCompanyAddressLines(company);
  const summary = calculateSummary(groups, project);
  const offerDate = new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(new Date(`${project.offerDate}T12:00:00`));
  const visibleGroups = activeGroups(groups).filter((group) => group.positions.some((position) => position.active));
  const subtotal = summary.net + summary.discount;
  const introText =
    project.companyId === "metzger-real-estate"
      ? "Wir bedanken uns für Ihr Interesse an unseren Beratungs- und Unterstützungsleistungen. Auf Grundlage der vorliegenden Aufgabenstellung erstellen wir nachfolgend ein strukturiertes Leistungsverzeichnis für die vereinbarten immobilienbezogenen Beratungs-, Steuerungs-, Prüf- und Sachverständigenleistungen."
      : "Wir bedanken uns für Ihr Interesse an der Entwicklung einer individuellen KI-gestützten Softwarelösung. Auf Grundlage der vorliegenden Anforderungen erstellen wir nachfolgend ein strukturiertes Leistungsverzeichnis für die Konzeption, Entwicklung, Implementierung und Einführung der Anwendung.";
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
      <article className="print-area rounded-lg border border-line bg-white p-8 shadow-soft">
      <section className="print-section border-b border-line pb-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div
              className="mb-8 inline-flex h-14 min-w-14 items-center justify-center rounded-md px-4 text-sm font-bold"
              style={{ background: company.colors.primary, color: readableTextColor(company.colors.primary) }}
            >
              {company.logoText}
            </div>
            <p className="text-sm uppercase tracking-[0.16em] text-muted">Angebot</p>
            <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-normal text-ink">{project.projectName}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted">{project.offerIntro}</p>
          </div>
          <div className="min-w-64 rounded-lg border border-line p-4 text-sm text-muted">
            <p className="font-semibold text-ink">{company.name}</p>
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
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <PreviewMeta label="Empfänger" value={project.client} />
          <PreviewMeta label="Ansprechpartner" value={project.contactPerson} />
          <PreviewMeta label="Angebotsnummer" value={project.offerNumber} />
          <PreviewMeta label="Datum" value={offerDate} />
        </div>
      </section>

      <section className="print-section py-8">
        <p className="leading-7 text-muted">{introText}</p>
        {(project.projectName || project.projectLocation || project.projectVolume || project.plannedProjectStart) ? (
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <PreviewMeta label="Projekt" value={project.projectName || "-"} />
            <PreviewMeta label="Standort" value={project.projectLocation || "-"} />
            <PreviewMeta label="Projektvolumen" value={project.projectVolume || "-"} />
            <PreviewMeta label="Leistungszeitraum" value={project.plannedProjectStart || "-"} />
          </div>
        ) : null}
        {project.assignmentReason ? (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-ink">Anlass der Beauftragung</h3>
            <p className="mt-2 leading-7 text-muted">{project.assignmentReason}</p>
          </div>
        ) : null}
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="grid gap-5">
            <div>
              <h3 className="text-sm font-semibold text-ink">Projektbeschreibung</h3>
              <p className="mt-2 leading-7 text-muted">{project.shortDescription}</p>
            </div>
            {project.serviceScope ? (
              <div>
                <h3 className="text-sm font-semibold text-ink">Projekt- und Leistungsrahmen</h3>
                <p className="mt-2 leading-7 text-muted">{project.serviceScope}</p>
              </div>
            ) : null}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink">Zielsetzung</h3>
            <p className="mt-2 leading-7 text-muted">{project.objective}</p>
          </div>
          {project.contractorRole ? (
            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-ink">Funktion des Auftragnehmers</h3>
              <p className="mt-2 leading-7 text-muted">{project.contractorRole}</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="print-section border-t border-line py-8">
        {project.plannedProjectStart ? (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-ink">Leistungszeitraum</h2>
            <p className="mt-3 leading-7 text-muted">{project.plannedProjectStart}</p>
          </div>
        ) : null}
        {project.serviceExclusion ? (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-ink">Leistungsabgrenzung</h2>
            <p className="mt-3 leading-7 text-muted">{project.serviceExclusion}</p>
          </div>
        ) : null}
        {project.ancillaryCosts ? (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-ink">Nebenkosten und Auslagen</h2>
            <p className="mt-3 leading-7 text-muted">{project.ancillaryCosts}</p>
          </div>
        ) : null}
        <h2 className="text-lg font-semibold text-ink">Leistungsverzeichnis</h2>
        {project.serviceDirectoryIntro ? <p className="mt-2 max-w-4xl text-sm leading-6 text-muted">{project.serviceDirectoryIntro}</p> : null}
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
                    <p className="mt-1 text-sm text-muted">{group.intro}</p>
                  </div>
                  <p className="w-fit shrink-0 rounded-md border border-line bg-white px-3 py-2 text-right text-sm font-semibold text-ink">
                    {formatCurrency(groupTotal(group))}
                  </p>
                </div>
                <div className="border-y border-line bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
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
                      <p className="font-semibold text-muted">{positionNumber(groups, group.id, position.id)}</p>
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{position.title}</p>
                        <p className="mt-1 leading-6 text-muted">{position.description}</p>
                        {position.note ? <p className="mt-2 text-xs font-medium text-slate-500">{position.note}</p> : null}
                      </div>
                      <p className="text-right text-muted">{position.unit}</p>
                      <p className="text-right text-muted">{position.quantity}</p>
                      <p className="text-right text-muted">
                        {formatCurrency(position.unitPrice)}
                        {position.unit === "Std." ? "/Std." : null}
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

      {project.meetingBillingNote ? (
        <section className="print-section border-t border-line py-8">
          <h2 className="text-lg font-semibold text-ink">Projektbesprechungen und Ortstermine</h2>
          <p className="mt-3 leading-7 text-muted">{project.meetingBillingNote}</p>
        </section>
      ) : null}

      <section className="print-section print-keep border-t border-line py-8">
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

      {project.changeTerms ? (
        <section className="print-section border-t border-line py-8">
          <h2 className="text-lg font-semibold text-ink">Leistungsänderungen</h2>
          <p className="mt-3 leading-7 text-muted">{project.changeTerms}</p>
        </section>
      ) : null}

      <section className="print-section grid gap-6 border-t border-line py-8 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="text-lg font-semibold text-ink">Zahlungsbedingungen</h2>
          <p className="mt-3 leading-7 text-muted">{project.paymentTerms}</p>
          {project.skontoPercent > 0 ? (
            <p className="mt-3 leading-7 text-muted">
              Bei Zahlung innerhalb von {project.skontoDays} Tagen wird ein Skonto in Höhe von {project.skontoPercent} % auf den
              netto zahlbaren Rechnungsbetrag gewährt.
            </p>
          ) : null}
          {project.contractBasis ? (
            <>
              <h2 className="mt-6 text-lg font-semibold text-ink">Vertragsgrundlage</h2>
              <p className="mt-3 leading-7 text-muted">
                <LinkedAgbText text={project.contractBasis} url={company.agbUrl} />
              </p>
            </>
          ) : null}
          <h2 className="mt-6 text-lg font-semibold text-ink">Gültigkeit</h2>
          <p className="mt-3 leading-7 text-muted">{project.validityText || `Dieses Angebot ist ${project.validUntil} gültig.`}</p>
          <h2 className="mt-6 text-lg font-semibold text-ink">Angebotsgrundlagen</h2>
          <p className="mt-3 leading-7 text-muted">{project.offerClarification}</p>
        </div>
        <div className="rounded-lg border border-line bg-slate-50 p-5">
          <div className="flex justify-between py-2 text-sm">
            <span className="text-muted">Summe netto</span>
            <span className="font-semibold text-ink">{formatCurrency(summary.net)}</span>
          </div>
          {summary.discount > 0 ? (
            <div className="flex justify-between py-2 text-sm">
              <span className="text-muted">Nachlass</span>
              <span className="font-semibold text-ink">-{formatCurrency(summary.discount)}</span>
            </div>
          ) : null}
          {project.skontoPercent > 0 ? (
            <div className="flex justify-between py-2 text-sm">
              <span className="text-muted">Skonto bei Zahlung binnen {project.skontoDays} Tagen</span>
              <span className="font-semibold text-ink">{project.skontoPercent} %</span>
            </div>
          ) : null}
          <div className="flex justify-between py-2 text-sm">
            <span className="text-muted">Umsatzsteuer {project.vatRate} %</span>
            <span className="font-semibold text-ink">{formatCurrency(summary.vat)}</span>
          </div>
          <div className="mt-3 flex justify-between border-t border-line pt-4 text-lg font-semibold text-ink">
            <span>Gesamt brutto</span>
            <span>{formatCurrency(summary.gross)}</span>
          </div>
        </div>
      </section>

      {project.acceptanceText ? (
        <section className="print-section print-keep border-t border-line py-8">
          <h2 className="text-lg font-semibold text-ink">Auftragserteilung</h2>
          <p className="mt-3 leading-7 text-muted">{project.acceptanceText}</p>
          <div className="mt-10 grid gap-8 md:grid-cols-4">
            {["Ort, Datum", "Name", "Funktion", "Unterschrift"].map((label) => (
              <div key={label} className="border-t border-line pt-3 text-sm font-medium text-muted">
                {label}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <footer className="print-keep border-t border-line pt-6 text-sm leading-6 text-muted">
        <p className="font-medium text-ink">{company.name}</p>
        <p>{company.footer}</p>
        <div className="mt-4 grid gap-x-8 gap-y-2 md:grid-cols-3">
          <p className="break-words">Web: {company.website}</p>
          <p className="break-words">E-Mail: {company.email}</p>
          <p className="break-words">Telefon: {company.phone}</p>
          {company.ownerLine ? <p className="break-words">Inhaber: {company.ownerLine}</p> : null}
          {company.agbUrl ? (
            <p className="break-words">
              AGB:{" "}
              <a className="font-medium text-ink underline underline-offset-2" href={company.agbUrl} target="_blank" rel="noreferrer">
                {company.agbUrl}
              </a>
            </p>
          ) : null}
          {company.bookingUrl ? (
            <p className="break-words">
              <a className="font-medium text-ink underline underline-offset-2" href={company.bookingUrl} target="_blank" rel="noreferrer">
                Online-Terminbuchung
              </a>
            </p>
          ) : null}
          <p className="break-words">USt-ID: {company.vatId}</p>
          <p className="break-words md:col-span-2">Bankverbindung: {company.bank}</p>
        </div>
      </footer>
    </article>
    </>
  );
}

function SummaryLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 text-sm ${strong ? "font-semibold text-ink" : "text-muted"}`}>
      <span>{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function PreviewMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-24 flex-col items-center justify-center rounded-lg border border-line bg-slate-50 p-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-2 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}
