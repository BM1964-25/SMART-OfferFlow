"use client";

import { HelpCircle, Search, X } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";

type HelpSection = {
  id: string;
  title: string;
  body: React.ReactNode;
};

function HelpWorkflow({ steps }: { steps: Array<{ title: string; text: string }> }) {
  return (
    <div className="help-workflow">
      {steps.map((step, index) => (
        <div key={step.title} className="help-workflow-step">
          <span className="help-step-number">{index + 1}</span>
          <div>
            <p className="help-step-title">{step.title}</p>
            <p className="help-step-text">{step.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function HelpCards({ items }: { items: Array<{ title: string; text: string }> }) {
  return (
    <div className="help-card-grid">
      {items.map((item) => (
        <div key={item.title} className="help-card">
          <p className="help-card-title">{item.title}</p>
          <p className="help-card-text">{item.text}</p>
        </div>
      ))}
    </div>
  );
}

function HelpChecklist({ items }: { items: string[] }) {
  return (
    <ul className="help-checklist">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function HelpNote({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="help-note">
      <p className="help-note-title">{title}</p>
      <div className="help-note-body">{children}</div>
    </div>
  );
}

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
        <HelpCards
          items={[
            { title: "Angebote", text: "Angebotskopf, Projektangaben, Textbausteine, Leistungsverzeichnis und Summen in einer prüffähigen Vorschau." },
            { title: "Vorlagen", text: "Firmenbezogene LV-Vorlagen für wiederkehrende Themen wie Baurevision, Projektsteuerung oder Beratung." },
            { title: "Abrechnung", text: "Auftragsstand, Nachträge, Leistungsnachweise, Rechnungsplan und offener Rest bleiben im selben Vorgang." },
            { title: "KI optional", text: "KI unterstützt beim Formulieren, Strukturieren und Erstellen von LV-Vorschlägen, bleibt aber ergänzend." }
          ]}
        />
        <HelpNote title="Grundprinzip">
          <p>Die App führt von der ersten Angebotsanlage bis zur späteren Abrechnung. Leere optionale Felder werden in der Vorschau nicht ausgegeben.</p>
        </HelpNote>
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
        <HelpWorkflow
          steps={[
            { title: "Anthropic Console öffnen", text: "Mit dem eigenen Anthropic-Konto anmelden." },
            { title: "API Keys öffnen", text: "Im Bereich API Keys einen neuen Schlüssel erstellen." },
            { title: "Key kopieren", text: "Den API-Key sofort sicher speichern, weil er oft nur einmal vollständig angezeigt wird." },
            { title: "In SMART OfferFlow eintragen", text: "Unter KI-Assistenz speichern und prüfen." }
          ]}
        />
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
        <HelpWorkflow
          steps={[
            { title: "Neues Angebot", text: "Firmenprofil, Kunde, Projektdaten, Angebotsnummer und Textbausteine erfassen." },
            { title: "Vorlage wählen", text: "Passende LV-Vorlage zum Firmenprofil und Thema übernehmen." },
            { title: "Leistungen bearbeiten", text: "Titel, Positionen, Mengen, Einheiten, Preise und Hinweise prüfen." },
            { title: "Prüfen & versenden", text: "Angebot speichern, PDF erstellen, Einzelangebot sichern oder Kundenlink erzeugen." },
            { title: "Auftrag & Abrechnung", text: "Nach Beauftragung Nachträge, Leistungsnachweise, Rechnungsplan und offenen Rest fortführen." }
          ]}
        />
        <h3>Vor dem Versand prüfen</h3>
        <HelpChecklist
          items={[
            "Richtiges Firmenprofil gewählt",
            "Empfänger und Ansprechpartner korrekt",
            "Angebotsnummer und Datum plausibel",
            "LV-Positionen, Mengen, Einheiten und Preise geprüft",
            "Zahlungsbedingungen, AGB-Link und Footer vollständig"
          ]}
        />
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
        <HelpCards
          items={[
            { title: "Sidebar", text: "Links stehen die Arbeitsbereiche in Prozessreihenfolge: Angebot, Vorlage, Leistungen, Prüfung, Abrechnung." },
            { title: "Prozessleiste", text: "Oben im Arbeitsbereich führen fünf Schritte direkt zum versendbaren Angebot." },
            { title: "Start-Assistent", text: "Zeigt fehlende Punkte wie Kunde, LV oder Prüfung und führt direkt in den passenden Bereich." },
            { title: "Kopfbereich", text: "Dort stehen aktives Firmenprofil, Speichern, Exportieren, Drucken und Hilfe." },
            { title: "Stammdaten", text: "Kunden und Firmenprofile werden getrennt gepflegt und danach in Angebote übernommen." },
            { title: "Dateien", text: "Unten in der Sidebar können kompletter App-Stand oder einzelne Angebote geladen werden." }
          ]}
        />
        <HelpNote title="Orientierung">
          <p>Beginnen Sie für ein neues Angebot immer mit „Neues Angebot“. Danach Vorlage wählen, Leistungen bearbeiten und zuletzt prüfen.</p>
        </HelpNote>
      </>
    )
  },
  {
    id: "features",
    title: "Wichtige Funktionen",
    body: (
      <>
        <HelpCards
          items={[
            { title: "Firmenprofile", text: "Kontaktdaten, Farben, Footer, AGB-Link, Terminbuchung und eigene Vorlagen pflegen." },
            { title: "Kunden", text: "Kundendaten speichern und mit Bestätigung in das aktuelle Angebot übernehmen." },
            { title: "Textbausteine", text: "Einleitung, Anlass, Zielsetzung, Leistungsrahmen und rechtliche Abschnitte projektbezogen steuern." },
            { title: "LV bearbeiten", text: "Titel und Positionen löschen, duplizieren, ändern, neu nummerieren und zurück in Vorlagen übernehmen." },
            { title: "Angebotsliste", text: "Gespeicherte Angebote filtern, wieder öffnen, exportieren, archivieren oder duplizieren." },
            { title: "Abrechnung", text: "Nachträge, Leistungsnachweise, Rechnungsplan und offenen Rest im Auftrag weiterführen." }
          ]}
        />
        <h3>Optionale KI-Unterstützung</h3>
        <HelpChecklist
          items={[
            "LV-Vorschläge aus Projektdaten generieren",
            "Textvorschläge für Angebots- und Leistungsbausteine vorbereiten",
            "Positionen verständlicher formulieren und fachlich ergänzen",
            "Rohtexte in professionelle Angebotsformulierungen überführen"
          ]}
        />
      </>
    )
  },
  {
    id: "workflow",
    title: "Typischer Workflow",
    body: (
      <>
        <HelpWorkflow
          steps={[
            { title: "Vorbereiten", text: "Firmenprofil, Kunde und Angebotsnummer auswählen oder neu anlegen." },
            { title: "Inhalt festlegen", text: "Projektbeschreibung, Aufgabenstellung, Zielsetzung, Leistungsrahmen und Hinweise erfassen." },
            { title: "LV übernehmen", text: "Eine passende Vorlage laden oder ein leeres LV aufbauen." },
            { title: "Kalkulieren", text: "Mengen, Einheiten, Einzelpreise, Pauschalen und optionale Positionen prüfen." },
            { title: "Prüfen", text: "Vorschau kontrollieren, Plausibilitätsprüfung nutzen und Angebot speichern." },
            { title: "Versenden", text: "PDF erzeugen, Einzelangebot sichern oder Kundenlink erstellen." },
            { title: "Weiterführen", text: "Bei Beauftragung Nachträge, Leistungsnachweise und Abrechnung dokumentieren." }
          ]}
        />
        <HelpNote title="Praktische Reihenfolge">
          <p>Wenn eine Vorlage bereits passt, zuerst Vorlage laden und danach Texte und Preise individualisieren. Das spart am meisten Zeit.</p>
        </HelpNote>
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
          sich Firmenprofile, Angebote, Kunden, Angebotsvorlagen, LV-Positionen und Abrechnungsdaten sichern.
        </p>
        <HelpCards
          items={[
            { title: "Lokal speichern", text: "Der Browser hält den aktuellen Arbeitsstand für diese Domain vor." },
            { title: "JSON sichern", text: "Speichert den kompletten App-Stand als Datei: Profile, Kunden, Angebote, Vorlagen und Abrechnung." },
            { title: "Einzelangebot sichern", text: "Speichert nur ein konkretes Angebot mit Projekt, LV, Texten und Abrechnung." },
            { title: "Kundenlink", text: "Speichert das Angebot für den Empfänger als kurzen Link, wenn Supabase eingerichtet ist." }
          ]}
        />
        <h3>Angebotsdatenbank</h3>
        <p>
          Unter „Angebote“ werden gespeicherte Angebote mit Firmenprofil, Status, Version, Angebotswert und Änderungsdatum angezeigt. Die Liste kann
          nach Suchbegriff, Firmenprofil und Status gefiltert werden.
        </p>
        <p>
          Beim Klick auf „Bearbeiten“ wird das Angebot wieder als aktueller Arbeitsstand geöffnet. Zusätzlich können Angebote dupliziert, archiviert,
          reaktiviert, gelöscht oder als Einzelangebot exportiert werden.
        </p>
        <p>
          Die Angebotsnummer kann je Firmenprofil über einen Nummernkreis aus Präfix, Jahr und Zähler automatisch erzeugt werden. Im Angebotskopf
          bleibt sie trotzdem manuell überschreibbar.
        </p>
        <h3>Angebotsvorlagen</h3>
        <p>
          Vollständige Leistungsverzeichnisse werden unter „Vorlagen verwalten“ gespeichert und jeweils einem Firmenprofil zugeordnet. Innerhalb eines
          Firmenprofils werden mehrere Vorlagen als eigene Tabs angezeigt, zum Beispiel eine allgemeine Vorlage und eine Baurevisionsvorlage.
        </p>
        <p>
          Beim neuen Angebot werden nur die passenden Vorlagen des aktiven Firmenprofils angeboten, damit keine fremden Demo- oder Projektinhalte in ein
          anderes Profil rutschen. Eine Angebotsvorlage kann geladen, bearbeitet, dupliziert, gelöscht oder mit dem aktuell bearbeiteten Angebots-LV
          aktualisiert werden.
        </p>
        <p>
          Prüfen Sie vor dem Versand eines Angebots insbesondere Firmenprofil, Empfänger, Projektdaten, Leistungsumfang, Preise, Umsatzsteuer,
          Zahlungsbedingungen, AGB-Link und Footer.
        </p>
        <HelpChecklist
          items={[
            "Angebot speichern: aktuelles Angebot in der Angebotsliste aktualisieren",
            "Als JSON sichern: gesamten App-Stand auf dem Rechner speichern",
            "Einzelangebot sichern: nur ein Angebot als Datei weitergeben",
            "Einzelangebot laden: importiert ein Angebot ohne den ganzen App-Stand zu ersetzen"
          ]}
        />
        <h3>Leere Textfelder</h3>
        <p>
          Optionale Textfelder werden nur dann unter „Prüfen & versenden“ ausgegeben, wenn dort Inhalt eingetragen ist. Wenn Sie ein Textfeld
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
        <p>
          Der Dateiname wird automatisch aus Angebotsnummer, Firmenprofil, Kunde, Projektbezeichnung und Exportdatum gebildet. Beispiel:
          <br />
          <code>MREA-2026-001-mrea-haseitl-projektstabilisierung-2026-06-26-smart-offerflow.json</code>
        </p>
        <p>
          Die fortlaufende Nummer im Dateinamen stammt aus der Angebotsnummer. Diese wird beim Anlegen eines neuen Angebots über den Nummernkreis des
          Firmenprofils vorgeschlagen, kann im Angebotskopf aber weiterhin manuell angepasst werden.
        </p>
        <p>
          Wichtig: Die JSON-Datei ist derzeit keine reine Einzel-Projektdatei, sondern eine Sicherung des vollständigen App-Arbeitsstands einschließlich
          Firmenprofilen, Kunden, Angebotsliste, Angebotsvorlagen, aktuellem Angebot, LV und Abrechnung.
        </p>
        <p>
          „Einzelangebot sichern“ erstellt dagegen eine kleinere Datei nur für das aktuelle beziehungsweise ausgewählte Angebot. Enthalten sind
          Projektdaten, Textbausteine, LV, Abrechnungsstand und Version dieses einen Angebots.
        </p>
        <p>
          „Einzelangebot laden“ importiert eine solche Datei in die Angebotsdatenbank und öffnet sie zur Bearbeitung. Das überschreibt nicht den
          kompletten App-Stand und ist deshalb besser geeignet, wenn nur ein Angebot zwischen Rechnern übertragen werden soll.
        </p>
        <h3>Angebot als Link versenden</h3>
        <p>
          Unter „Prüfen & versenden“ speichert der Button „Angebot an Kunden versenden“ den aktuellen Angebotsstand in Supabase und kopiert einen kurzen
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
          „Prüfen & versenden“ zeigt die Angebotsstruktur, die Projektinformationen, das Leistungsverzeichnis, Titelsummen, Netto-Summe, Umsatzsteuer,
          Brutto-Summe, rechtliche Textbausteine, Auftragserteilung und Footer.
        </p>
        <p>
          Für eine saubere PDF-Ausgabe nutzen Sie in der Angebotsvorschau „PDF erstellen“. Im Druckdialog sollten A4, Skalierung 100 %, aktivierte
          Hintergrundgrafiken und deaktivierte Browser-Kopf-/Fußzeilen eingestellt werden.
        </p>
        <p>
          Leere optionale Textbausteine werden in der Vorschau bewusst übersprungen. Dadurch bleiben Angebot und PDF kompakt und enthalten nur die
          tatsächlich gepflegten Inhalte.
        </p>
        <p>
          Wird ein Angebotslink geöffnet, lädt SMART OfferFlow das enthaltene Angebot direkt in die Angebotsdarstellung. Der Empfänger benötigt dafür keine
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
            <strong>Falsche Projektdaten im Firmenprofil:</strong> Dashboard oder Prüfung öffnen und Profil-/LV-Zuordnung bereinigen.
          </li>
          <li>
            <strong>Druck/PDF sieht anders aus:</strong> Browser-Druckvorschau prüfen und Skalierung auf Standard beziehungsweise 100 % stellen.
          </li>
          <li>
            <strong>Daten fehlen:</strong> JSON-Sicherung laden oder den lokalen Browser-Speicher prüfen.
          </li>
          <li>
            <strong>Nur ein Angebot übertragen:</strong> Nicht die komplette JSON-Sicherung laden, sondern „Einzelangebot sichern“ und auf dem anderen
            Rechner „Einzelangebot laden“ verwenden.
          </li>
        </ul>
      </>
    )
  },
  {
    id: "improvements",
    title: "Empfohlene nächste Ausbauschritte",
    body: (
      <>
        <ul>
          <li>
            <strong>Zentrale Cloud-Datenbank:</strong> Firmenprofile, Kunden, Angebote, Vorlagen, Versionen, Nummernkreise und Abrechnung dauerhaft in
            Supabase speichern, damit derselbe Stand auf mehreren Rechnern verfügbar ist.
          </li>
          <li>
            <strong>Vorlagenführung verbessern:</strong> Für jedes Firmenprofil mehrere Themenvorlagen mit klaren Kategorien, zum Beispiel Baurevision,
            Due Diligence, Projektsteuerung oder Sachverständigenleistungen.
          </li>
          <li>
            <strong>PDF-Ausgabe weiter absichern:</strong> Mittelfristig kann ein serverseitiger PDF-Generator ergänzt werden, damit Angebote unabhängig
            vom Browser exakt gleich gerendert werden.
          </li>
          <li>
            <strong>Cloud-Arbeitsstand:</strong> Wenn Supabase später erweitert wird, sollten vollständige Arbeitsstände, Angebote, Vorlagen und
            Nummernkreise zentral gespeichert werden.
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
