"use client";

import { HelpCircle, Search, X } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";

type HelpSection = {
  id: string;
  title: string;
  body: React.ReactNode;
};

const helpSections: HelpSection[] = [
  {
    id: "overview",
    title: "Überblick",
    body: (
      <>
        <p>
          SMART OfferFlow unterstützt die Erstellung von Angeboten, Leistungsverzeichnissen, Auftragsständen und Abrechnungsgrundlagen in einem
          durchgängigen Prozess. Die App verbindet Firmenprofile, Kunden, Projektangaben, Angebotsvorlagen, LV-Positionen, Nachträge und Leistungsnachweise.
        </p>
        <p>
          Die Kernfunktionen sind ohne KI nutzbar. KI-Funktionen ergänzen den Prozess optional, zum Beispiel beim Formulieren, Strukturieren oder
          Generieren von LV-Vorschlägen.
        </p>
      </>
    )
  },
  {
    id: "access",
    title: "Einrichtung & Zugang",
    body: (
      <>
        <h3>Lizenzschlüssel aktivieren</h3>
        <p>
          Der Lizenzschlüssel wird im vorgesehenen Lizenz- oder Einstellungsbereich der App eingegeben, sobald eine aktivierte Nutzung erforderlich
          ist. Er schaltet die App-Nutzung frei und bestätigt, dass Sie berechtigt sind, SMART OfferFlow zu verwenden.
        </p>
        <p>
          Der Lizenzschlüssel aktiviert nur die Software. Er ersetzt keinen Anthropic API-Key und führt keine KI-Anfragen aus.
        </p>
        <div className="rounded-md border border-line bg-slate-50 p-4">
          <p className="font-semibold text-ink">Lizenzschlüssel und API-Key erfüllen unterschiedliche Aufgaben:</p>
          <p className="mt-2">
            Der Lizenzschlüssel aktiviert die Nutzung dieser App. Er bestätigt, dass Sie berechtigt sind, die Software zu verwenden.
          </p>
          <p className="mt-2">
            Der API-Key verbindet die App mit Ihrem Anthropic-Konto. Er ist erforderlich, damit KI-Funktionen ausgeführt werden können. Auch bei einer
            bezahlten App-Lizenz wird ein eigener API-Key benötigt, weil die Nutzung der KI-Modelle technisch und abrechnungstechnisch getrennt über
            Anthropic erfolgt.
          </p>
        </div>
        <h3>API-Key erstellen</h3>
        <ol>
          <li>Anthropic Console öffnen.</li>
          <li>Konto erstellen oder einloggen.</li>
          <li>Bereich „API Keys“ öffnen.</li>
          <li>Neuen API-Key erstellen.</li>
          <li>API-Key kopieren.</li>
          <li>API-Key in SMART OfferFlow unter „KI-Assistenz“ eintragen.</li>
        </ol>
        <p>
          Hinweis: Ein API-Key wird häufig nur einmal vollständig angezeigt. Speichern Sie ihn deshalb sicher, bevor Sie das Fenster schließen.
        </p>
        <h3>Warum ein API-Key erforderlich ist</h3>
        <p>
          SMART OfferFlow nutzt KI-Funktionen über die Anthropic API. Der API-Key verbindet die App mit Ihrem persönlichen Anthropic-Konto, sodass
          KI-Anfragen Ihrem Konto zugeordnet werden. Ohne API-Key können KI-Funktionen nicht ausgeführt werden.
        </p>
        <h3>Warum auch bei bezahltem App-Abo ein API-Key nötig ist</h3>
        <p>
          App-Lizenz beziehungsweise App-Abo und KI-Nutzung sind getrennt. Die App-Lizenz bezahlt die Nutzung der Software. Die Anthropic API-Nutzung
          wird separat über Ihr Anthropic-Konto verarbeitet beziehungsweise abgerechnet.
        </p>
        <h3>Warum Anthropic verwendet wird</h3>
        <p>
          Anthropic wurde gewählt, weil Claude-Modelle stark bei strukturiertem Arbeiten, Textanalyse, Zusammenfassungen und professionellen
          Workflows sind. Claude eignet sich gut für längere Dokumente, komplexe Eingaben und nachvollziehbare Ausgaben.
        </p>
        <p>
          Anthropic legt großen Wert auf Sicherheit, Zuverlässigkeit und verantwortungsvolle KI-Nutzung. Die API ermöglicht eine stabile Integration
          in professionelle Anwendungen, während Sie über den eigenen API-Key Kontrolle über Nutzung und Abrechnung behalten.
        </p>
      </>
    )
  },
  {
    id: "quickstart",
    title: "Schnellstart",
    body: (
      <>
        <ol>
          <li>Lizenzschlüssel aktivieren, falls Ihre Version eine Lizenzprüfung verwendet.</li>
          <li>Optional den Anthropic API-Key unter „KI-Assistenz“ eintragen und prüfen.</li>
          <li>Firmenprofil auswählen oder anpassen.</li>
          <li>Kunden- und Projektdaten unter „Neues Angebot“ erfassen.</li>
          <li>Passende Angebotsvorlage übernehmen oder das LV individuell bearbeiten.</li>
          <li>Angebotsvorschau prüfen und als PDF über den Druckdialog ausgeben.</li>
          <li>Auftrag, Nachträge, Leistungsnachweise und Abrechnungsstand weiterführen.</li>
        </ol>
        <p>
          Die Einrichtung von Lizenzschlüssel und API-Key ist im Kapitel „Einrichtung & Zugang“ beschrieben. Ohne API-Key bleiben alle nicht
          KI-basierten Arbeitsbereiche nutzbar.
        </p>
      </>
    )
  },
  {
    id: "interface",
    title: "Bedienoberfläche",
    body: (
      <>
        <p>
          Links befindet sich die Sidebar mit den Arbeitsbereichen. Oben im Header sehen Sie das aktive Firmenprofil, Speicher- und Exportaktionen,
          den Druckbutton sowie diese Hilfe.
        </p>
        <p>
          Die Sidebar kann eingeklappt werden. Über die unteren Symbole speichern oder laden Sie den aktuellen App-Stand als JSON-Datei.
        </p>
      </>
    )
  },
  {
    id: "features",
    title: "Wichtige Funktionen",
    body: (
      <>
        <ul>
          <li>Firmenprofile mit Kontaktdaten, Farben, Footer, AGB-Link und Terminbuchung pflegen.</li>
          <li>Kunden speichern und in Angebote übernehmen.</li>
          <li>Angebotskopf, Projektinformationen, Textbausteine und Konditionen erfassen.</li>
          <li>Leistungsverzeichnisse aus Angebotsvorlagen übernehmen, bearbeiten und wieder als Angebotsvorlage speichern.</li>
          <li>Positionen und Titel löschen, duplizieren, bearbeiten und neu nummerieren.</li>
          <li>Angebotsvorschau, Summen, Netto, Umsatzsteuer und Brutto prüfen.</li>
          <li>Angebot als teilbaren Link vorbereiten, kopieren und per E-Mail an Kunden versenden.</li>
          <li>Auftrag, Nachträge, Leistungsnachweise, Rechnungsplan und offenen Rest verfolgen.</li>
          <li>Qualitätsmanagement für Plausibilität, Profilzuordnung und Datenstand nutzen.</li>
        </ul>
        <h3>Optionale KI-Unterstützung</h3>
        <ul>
          <li>LV-Vorschläge aus Projektdaten generieren.</li>
          <li>Textvorschläge für Angebots- und Leistungsbausteine vorbereiten.</li>
          <li>Positionen strukturieren und fachlich ergänzen.</li>
          <li>Formulierungen für professionelle Angebotsunterlagen beschleunigen.</li>
        </ul>
      </>
    )
  },
  {
    id: "workflow",
    title: "Typischer Workflow",
    body: (
      <>
        <ol>
          <li>Firmenprofil prüfen oder auswählen.</li>
          <li>Kunde anlegen oder bestehenden Kunden übernehmen.</li>
          <li>Neues Angebot mit Projektangaben, Einleitung, Anlass, Zielsetzung und Konditionen erstellen.</li>
          <li>Passende Angebotsvorlage übernehmen oder ein leeres LV starten.</li>
          <li>Titel und Positionen anpassen, löschen oder ergänzen.</li>
          <li>Fertiges LV als Angebotsvorlage speichern, damit es für spätere Projekte desselben Firmenprofils wiederverwendet werden kann.</li>
          <li>Vorschau prüfen, Summen kontrollieren und PDF erstellen oder Angebot als Link versenden.</li>
          <li>Nach Beauftragung Auftrag, Abrechnung, Nachträge und Leistungsnachweise fortführen.</li>
        </ol>
      </>
    )
  },
  {
    id: "data",
    title: "Eingaben & Daten",
    body: (
      <>
        <p>
          SMART OfferFlow speichert den Arbeitsstand lokal im Browser und kann zusätzlich JSON-Dateien exportieren und wieder laden. Dadurch lassen
          sich Firmenprofile, Projekte, Kunden, Angebotsvorlagen, LV-Positionen und Abrechnungsdaten sichern.
        </p>
        <h3>Angebotsdatenbank</h3>
        <p>
          Unter „Projekte“ werden gespeicherte Angebote mit Status, Version, Angebotswert und Änderungsdatum angezeigt. Beim Klick auf „Bearbeiten“
          wird das Angebot wieder als aktueller Arbeitsstand geöffnet.
        </p>
        <p>
          Die Angebotsnummer kann je Firmenprofil über einen Nummernkreis aus Präfix, Jahr und Zähler automatisch erzeugt werden. Im Angebotskopf
          bleibt sie trotzdem manuell überschreibbar.
        </p>
        <h3>Angebotsvorlagen</h3>
        <p>
          Vollständige Leistungsverzeichnisse werden unter „Angebotsvorlagen“ gespeichert und jeweils einem Firmenprofil zugeordnet. Beim neuen Angebot
          werden nur die Angebotsvorlagen des aktiven Firmenprofils angeboten, damit keine fremden Demo- oder Projektinhalte in ein anderes Profil rutschen.
        </p>
        <p>
          Eine Angebotsvorlage kann geladen, bearbeitet, dupliziert, gelöscht oder mit dem aktuell bearbeiteten Angebots-LV aktualisiert werden. Angebotsvorlagen
          sind Teil des lokalen Arbeitsstands und werden beim JSON-Export vollständig mitgesichert.
        </p>
        <p>
          Prüfen Sie vor dem Versand eines Angebots insbesondere Firmenprofil, Empfänger, Projektdaten, Leistungsumfang, Preise, Umsatzsteuer,
          Zahlungsbedingungen, AGB-Link und Footer.
        </p>
        <h3>Leere Textfelder</h3>
        <p>
          Optionale Textfelder werden nur dann in der Angebotsvorschau ausgegeben, wenn dort Inhalt eingetragen ist. Wenn Sie ein Textfeld
          leer lassen oder den Inhalt löschen, erscheinen weder Überschrift noch leerer Platzhalter im Angebot.
        </p>
        <p>
          Das gilt insbesondere für Textbausteine in „Neues Angebot“ sowie für die Footerfelder im Firmenprofil. Eine zusätzliche Aktivierungsbox ist
          deshalb nicht erforderlich: Text eintragen bedeutet anzeigen, Text entfernen bedeutet ausblenden.
        </p>
        <p>
          Der optionale Textbaustein „Hinweis“ eignet sich für projektspezifische Zusatzinformationen nach den Angebotsgrundlagen. Bleibt das Feld
          leer, wird der Abschnitt im Angebot nicht angezeigt.
        </p>
        <h3>Angebot speichern und sichern</h3>
        <p>
          Der Button „Angebot speichern“ speichert den aktuellen Arbeitsstand lokal im Browser und aktualisiert zugleich den Eintrag in der
          Angebotsdatenbank. Jede Speicherung erhöht die Version des Angebots.
        </p>
        <p>
          „Als JSON sichern“ legt zusätzlich eine Datei auf dem Rechner ab. Diese JSON-Datei kann später wieder geladen, archiviert oder als Vorlage
          für ein anderes Projekt verwendet werden.
        </p>
        <h3>Angebot als Link versenden</h3>
        <p>
          In der Angebotsvorschau speichert der Button „Angebot an Kunden versenden“ den aktuellen Angebotsstand in Supabase und kopiert einen kurzen
          Kundenlink in die Zwischenablage. Danach wird das Angebot in der Angebotsdatenbank als „Versendet“ markiert und der Kundenlink am Angebot
          hinterlegt.
        </p>
        <p>
          Für kurze Kundenlinks muss SMART OfferFlow auf einem Server wie Vercel laufen und mit Supabase verbunden sein. GitHub Pages ist statisch und
          kann die dafür nötigen API-Routen nicht ausführen.
        </p>
        <p>
          Der Kundenlink enthält nur einen Token. Das eigentliche Angebot liegt in Supabase und kann über denselben Link wieder geladen werden.
        </p>
      </>
    )
  },
  {
    id: "results",
    title: "Ergebnisse verstehen",
    body: (
      <>
        <p>
          Die Angebotsvorschau zeigt die Angebotsstruktur, die Projektinformationen, das Leistungsverzeichnis, Titelsummen, Netto-Summe, Umsatzsteuer,
          Brutto-Summe, rechtliche Textbausteine, Auftragserteilung und Footer.
        </p>
        <p>
          Leere optionale Textbausteine werden in der Vorschau bewusst übersprungen. Dadurch bleiben Angebot und PDF kompakt und enthalten nur die
          tatsächlich gepflegten Inhalte.
        </p>
        <p>
          Wird ein Angebotslink geöffnet, lädt SMART OfferFlow das enthaltene Angebot direkt in die Angebotsvorschau. Der Empfänger benötigt dafür keine
          lokale JSON-Datei.
        </p>
        <p>
          Der Abrechnungsstand zeigt, welcher Anteil der Auftragssumme bereits abgerechnet wurde und welcher Betrag noch offen ist. Nachträge und
          Leistungsnachweise können für die Rechnung aktiviert werden.
        </p>
      </>
    )
  },
  {
    id: "errors",
    title: "Fehler & Lösungen",
    body: (
      <>
        <ul>
          <li>
            <strong>KI-Backend nicht erreichbar:</strong> GitHub Pages kann keine API-Route ausführen. Nutzen Sie lokal oder auf Vercel ein
            Server-Backend.
          </li>
          <li>
            <strong>API-Key wird nicht akzeptiert:</strong> Key ohne Leerzeichen, Zeilenumbrüche oder zusätzliche Zeichen eintragen und erneut prüfen.
          </li>
          <li>
            <strong>Falsche Projektdaten im Firmenprofil:</strong> Dashboard oder Qualitätsmanagement öffnen und Profil-/LV-Zuordnung bereinigen.
          </li>
          <li>
            <strong>Druck/PDF sieht anders aus:</strong> Browser-Druckvorschau prüfen und Skalierung auf Standard beziehungsweise 100 % stellen.
          </li>
          <li>
            <strong>Daten fehlen:</strong> JSON-Sicherung laden oder den lokalen Browser-Speicher prüfen.
          </li>
        </ul>
      </>
    )
  },
  {
    id: "version",
    title: "Version & Hinweise",
    body: (
      <>
        <p>
          Diese Hilfe gilt für SMART OfferFlow, die Angebots-, Auftrags- und Abrechnungs-App im BuiltSmart-AI-Kontext. Die Inhalte können erweitert
          werden, wenn neue Module, Lizenzfunktionen oder KI-Funktionen ergänzt werden.
        </p>
        <p>
          Rechtliche Texte, AGB-Verweise und Haftungshinweise sollten vor produktiver Nutzung fachlich und rechtlich geprüft werden.
        </p>
      </>
    )
  }
];

export function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(helpSections[0].id);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  const filteredSections = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return helpSections;
    return helpSections.filter((section) => section.title.toLowerCase().includes(normalized) || sectionText(section.body).includes(normalized));
  }, [query]);

  if (!open) return null;

  const activeSection = filteredSections.find((section) => section.id === activeId) ?? filteredSections[0];

  return (
    <div className="fixed inset-0 z-50 flex bg-ink/45 p-3 backdrop-blur-sm md:p-6" role="dialog" aria-modal="true" aria-labelledby="help-title">
      <div className="ml-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-line bg-white shadow-2xl">
        <div className="border-b border-line p-4 md:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
                <HelpCircle className="h-4 w-4" />
                Ohne KI nutzbar
              </p>
              <h2 id="help-title" className="mt-3 text-2xl font-semibold tracking-normal text-ink">
                Hilfe zu SMART OfferFlow
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
                Bedienungsanleitung, Einrichtung, Lizenz, Anthropic API-Key und typische Arbeitsabläufe.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Hilfe schließen"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-line text-muted transition hover:border-slate-300 hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <label className="mt-4 flex h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm text-muted focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100">
            <Search className="h-4 w-4" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Hilfe durchsuchen"
              className="h-full min-w-0 flex-1 border-0 bg-transparent text-ink outline-none placeholder:text-slate-400"
            />
          </label>
        </div>

        <div className="grid min-h-0 flex-1 md:grid-cols-[260px_minmax(0,1fr)]">
          <nav className="border-b border-line p-3 md:overflow-y-auto md:border-b-0 md:border-r">
            <div className="flex gap-2 overflow-x-auto md:grid md:gap-1 md:overflow-visible">
              {filteredSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveId(section.id)}
                  className={`shrink-0 rounded-md px-3 py-2 text-left text-sm font-medium transition md:w-full ${
                    activeSection?.id === section.id ? "bg-slate-100 text-ink" : "text-muted hover:bg-slate-50 hover:text-ink"
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </div>
          </nav>

          <div className="min-h-0 overflow-y-auto p-5 md:p-7">
            {activeSection ? (
              <section className="help-content max-w-3xl">
                <h2>{activeSection.title}</h2>
                {activeSection.body}
              </section>
            ) : (
              <p className="text-sm text-muted">Keine passenden Hilfethemen gefunden.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function sectionText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node).toLowerCase();
  if (Array.isArray(node)) return node.map(sectionText).join(" ");
  if (node && typeof node === "object" && "props" in node) {
    const element = node as React.ReactElement<{ children?: React.ReactNode }>;
    return sectionText(element.props.children);
  }
  return "";
}
