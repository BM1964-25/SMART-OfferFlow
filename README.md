# SMART OfferFlow

Webbasierte Anwendung für Angebote, Aufträge und Abrechnung in einem Prozess.

## Enthalten

- Next.js, TypeScript, React und Tailwind CSS
- Mandanten- und Firmenprofilstruktur mit vier Beispielprofilen
- Vollständige Angebots- und LV-Standardstruktur mit zehn Hauptgruppen
- Editierbare Positionen mit Aktivierung, Duplizieren, Löschen und Drag-and-drop-Sortierung
- Stundensatzlogik, Netto-/USt-/Brutto-Berechnung, Rabatt und optionaler Pauschalpreis
- Angebotsvorschau mit Deckblatt, Einleitung, LV, Summen, Zahlungsbedingungen und Footer
- Lokale Speicherung im Browser
- CSV-/JSON-Export und druckfähige Vorschau für PDF/DOCX-Workflows

## Entwicklung

```bash
npm install
npm run dev
```

Die Anwendung ist anschließend unter `http://localhost:3000` erreichbar.

## GitHub Pages

Der statische Export für GitHub Pages wird mit dem Base Path `/SMART-LV` gebaut:

```bash
npm run build:pages
```

Der Workflow unter `.github/workflows/pages.yml` deployed den Inhalt aus `out` automatisch nach GitHub Pages.
