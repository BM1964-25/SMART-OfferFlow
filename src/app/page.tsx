"use client";

import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import {
  AlertTriangle,
  Archive,
  Bot,
  Braces,
  Building2,
  CheckCircle2,
  Contact,
  Copy,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  HelpCircle,
  Home,
  LayoutTemplate,
  Library,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Printer,
  ReceiptText,
  ShieldCheck,
  Save,
  Search,
  Settings,
  SlidersHorizontal,
  RotateCcw,
  Trash2,
  Upload
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { OfferPreview } from "@/components/OfferPreview";
import { HelpDialog } from "@/components/HelpDialog";
import { Field, IconButton, SectionTitle, Select, StatCard, TextArea, TextInput } from "@/components/ui";
import { activeGroups, calculateSummary, formatCurrency, groupNumber, groupTotal, positionNumber, positionTotal, renumberGroups } from "@/lib/calculations";
import {
  companyProfiles,
  defaultAcceptanceText,
  defaultAssignmentReason,
  defaultChangeTerms,
  defaultContractBasis,
  defaultContractorRole,
  defaultMeetingBillingNote,
  defaultOfferBasis,
  defaultServiceDirectoryIntro,
  defaultServiceExclusion,
  defaultServiceScope,
  defaultValidityText,
  initialGroups,
  rateLabels,
  sampleOrderBilling,
  sampleProject
} from "@/lib/data";
import { printElement } from "@/lib/print";
import { readOfferSharePayloadFromLocation, readOfferTokenFromLocation } from "@/lib/share";
import { ChangeOrder, CompanyProfile, InvoicePlanItem, OrderBilling, Position, PositionGroup, Project, WorkLogItem } from "@/lib/types";

type View =
  | "Dashboard"
  | "Projekte"
  | "Neues Angebot"
  | "Neues LV"
  | "LV bearbeiten"
  | "Angebotsvorschau"
  | "Auftrag & Abrechnung"
  | "KI-Assistenz"
  | "Kunden"
  | "Firmenprofile"
  | "Qualitätsmanagement"
  | "Positionsbibliothek"
  | "Angebotsvorlagen"
  | "Einstellungen";

const viewLabels: Record<View, string> = {
  Dashboard: "Dashboard",
  Projekte: "Angebote",
  "Neues Angebot": "Neues Angebot",
  "Neues LV": "Vorlage wählen",
  "LV bearbeiten": "Leistungen bearbeiten",
  Angebotsvorschau: "Prüfen & versenden",
  "Auftrag & Abrechnung": "Auftrag & Abrechnung",
  "KI-Assistenz": "KI-Assistenz",
  Kunden: "Kunden",
  Firmenprofile: "Firmenprofile",
  Qualitätsmanagement: "Prüfung",
  Positionsbibliothek: "Positionen",
  Angebotsvorlagen: "Vorlagen verwalten",
  Einstellungen: "Einstellungen"
};

const navItems: { label: View; icon: typeof Home; group?: "process" | "data" | "admin" | "expert" }[] = [
  { label: "Dashboard", icon: Home },
  { label: "Neues Angebot", icon: Plus, group: "process" },
  { label: "Neues LV", icon: LayoutTemplate, group: "process" },
  { label: "LV bearbeiten", icon: FileText, group: "process" },
  { label: "Angebotsvorschau", icon: Eye, group: "process" },
  { label: "Projekte", icon: Archive, group: "process" },
  { label: "Auftrag & Abrechnung", icon: ReceiptText, group: "process" },
  { label: "Kunden", icon: Contact, group: "data" },
  { label: "Firmenprofile", icon: Building2, group: "data" },
  { label: "Qualitätsmanagement", icon: ShieldCheck, group: "data" },
  { label: "Angebotsvorlagen", icon: LayoutTemplate, group: "admin" },
  { label: "KI-Assistenz", icon: Bot, group: "expert" },
  { label: "Positionsbibliothek", icon: Library, group: "expert" },
  { label: "Einstellungen", icon: Settings, group: "admin" }
];

const processSteps: { label: string; view: View; hint: string }[] = [
  { label: "1 Neues Angebot", view: "Neues Angebot", hint: "Firma, Kunde und Projektdaten erfassen" },
  { label: "2 Vorlage wählen", view: "Neues LV", hint: "Passende Angebotsvorlage übernehmen" },
  { label: "3 Leistungen bearbeiten", view: "LV bearbeiten", hint: "Titel, Positionen und Preise prüfen" },
  { label: "4 Prüfen & versenden", view: "Angebotsvorschau", hint: "Speichern, PDF oder Kundenlink erstellen" },
  { label: "5 Auftrag & Abrechnung", view: "Auftrag & Abrechnung", hint: "Nach Beauftragung weiterführen" }
];

const navGroupLabels: Record<NonNullable<(typeof navItems)[number]["group"]>, string> = {
  process: "Angebotsprozess",
  data: "Stammdaten & Prüfung",
  admin: "Verwaltung",
  expert: "Expertenfunktionen"
};

const storageKey = "smart-lv-state-v1";

type OfferTemplateTextFields = Partial<
  Pick<
    Project,
    | "offerIntro"
    | "assignmentReason"
    | "shortDescription"
    | "serviceScope"
    | "contractorRole"
    | "objective"
    | "serviceDirectoryIntro"
    | "serviceExclusion"
    | "changeTerms"
    | "contractBasis"
    | "paymentTerms"
    | "validityText"
    | "offerClarification"
    | "offerNote"
    | "acceptanceText"
  >
>;

type LvTemplate = {
  id: string;
  companyId: Project["companyId"];
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  textFields?: OfferTemplateTextFields;
  groups: PositionGroup[];
};

type Customer = {
  id: string;
  companyName: string;
  contactPerson: string;
  address: string;
  email: string;
  phone: string;
  mobile: string;
  website: string;
  customerNumber: string;
  industry: string;
  notes: string;
};

type SavedOffer = {
  id: string;
  project: Project;
  groups: PositionGroup[];
  orderBilling: OrderBilling;
  createdAt: string;
  updatedAt: string;
  version: number;
};

type OfferNumberSetting = {
  companyId: Project["companyId"];
  prefix: string;
  year: number;
  nextNumber: number;
  digits: number;
};

type AppStatePayload = {
  version: number;
  savedAt: string;
  project: Project;
  groups: PositionGroup[];
  profiles: CompanyProfile[];
  customers: Customer[];
  libraryPositions: Position[];
  lvTemplates: LvTemplate[];
  orderBilling: OrderBilling;
  savedOffers: SavedOffer[];
  offerNumberSettings: OfferNumberSetting[];
};

function createInitialCustomers(): Customer[] {
  return [
    {
      id: "customer-musterbau",
      companyName: "Musterbau Immobilien GmbH",
      contactPerson: "Dr. Julia Hartmann",
      address: "Musterbau Immobilien GmbH, Beispielstraße 10, 80331 München",
      email: "julia.hartmann@musterbau.de",
      phone: "+49 89 123456",
      mobile: "",
      website: "www.musterbau.de",
      customerNumber: "KD-2026-001",
      industry: "Immobilienwirtschaft",
      notes: "Beispielkunde für Angebots- und LV-Prozesse."
    }
  ];
}

function normalizeCustomers(customers: Partial<Customer>[] | undefined): Customer[] {
  return (customers ?? createInitialCustomers()).map((customer, index) => ({
    id: customer.id ?? `customer-${Date.now()}-${index}`,
    companyName: customer.companyName ?? "",
    contactPerson: customer.contactPerson ?? "",
    address: customer.address ?? "",
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    mobile: customer.mobile ?? "",
    website: customer.website ?? "",
    customerNumber: customer.customerNumber ?? `KD-${new Date().getFullYear()}-${String(index + 1).padStart(3, "0")}`,
    industry: customer.industry ?? "",
    notes: customer.notes ?? ""
  }));
}

function createInitialOfferNumberSettings(profiles = companyProfiles): OfferNumberSetting[] {
  const currentYear = new Date().getFullYear();
  return profiles.map((profile) => ({
    companyId: profile.id,
    prefix: profile.logoText || profile.name.replace(/[^A-Z0-9]/gi, "").slice(0, 4).toUpperCase() || "ANG",
    year: currentYear,
    nextNumber: 1,
    digits: 3
  }));
}

function normalizeOfferNumberSettings(settings: OfferNumberSetting[] | undefined, profiles: CompanyProfile[]) {
  const defaults = createInitialOfferNumberSettings(profiles);
  const byCompany = new Map((settings ?? []).map((setting) => [setting.companyId, setting]));
  return defaults.map((setting) => ({ ...setting, ...(byCompany.get(setting.companyId) ?? {}) }));
}

function nextOfferNumber(settings: OfferNumberSetting[], companyId: Project["companyId"], savedOffers: SavedOffer[]) {
  const fallback = createInitialOfferNumberSettings().find((setting) => setting.companyId === companyId) ?? createInitialOfferNumberSettings()[0];
  const setting = settings.find((item) => item.companyId === companyId) ?? fallback;
  const escapedPrefix = setting.prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escapedPrefix}-${setting.year}-(\\d+)$`);
  const highestSaved = savedOffers.reduce((highest, offer) => {
    if (offer.project.companyId !== companyId) return highest;
    const match = offer.project.offerNumber.match(pattern);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  const next = Math.max(setting.nextNumber, highestSaved + 1);
  return `${setting.prefix}-${setting.year}-${String(next).padStart(setting.digits, "0")}`;
}

function bumpOfferNumberSetting(settings: OfferNumberSetting[], companyId: Project["companyId"]) {
  return settings.map((setting) => (setting.companyId === companyId ? { ...setting, nextNumber: setting.nextNumber + 1 } : setting));
}

function normalizeSavedOffers(offers: SavedOffer[] | undefined): SavedOffer[] {
  return (offers ?? []).map((offer) => ({
    ...offer,
    version: offer.version ?? 1,
    groups: (offer.groups ?? initialGroups).map((group) => ({ ...group, active: group.active ?? true })),
    orderBilling: offer.orderBilling ?? sampleOrderBilling,
    createdAt: offer.createdAt ?? offer.updatedAt ?? new Date().toISOString(),
    updatedAt: offer.updatedAt ?? new Date().toISOString()
  }));
}

function makeSavedOfferSnapshot(
  project: Project,
  groups: PositionGroup[],
  orderBilling: OrderBilling,
  savedAt: string,
  existing?: SavedOffer,
  bumpVersion = false
): SavedOffer {
  return {
    id: project.id,
    project,
    groups: cloneGroups(groups),
    orderBilling,
    createdAt: existing?.createdAt ?? savedAt,
    updatedAt: savedAt,
    version: bumpVersion ? (existing?.version ?? 0) + 1 : existing?.version ?? 1
  };
}

function savedOfferSnapshotChanged(existing: SavedOffer | undefined, next: SavedOffer) {
  if (!existing) return true;
  const existingPositionCount = activeGroups(existing.groups).reduce(
    (sum, group) => sum + group.positions.filter((position) => position.active).length,
    0
  );
  const nextPositionCount = activeGroups(next.groups).reduce((sum, group) => sum + group.positions.filter((position) => position.active).length, 0);
  return (
    existing.project.projectName !== next.project.projectName ||
    existing.project.client !== next.project.client ||
    existing.project.contactPerson !== next.project.contactPerson ||
    existing.project.offerNumber !== next.project.offerNumber ||
    existing.project.companyId !== next.project.companyId ||
    existing.groups.length !== next.groups.length ||
    existingPositionCount !== nextPositionCount ||
    existing.orderBilling.invoicePlan.length !== next.orderBilling.invoicePlan.length ||
    existing.orderBilling.changeOrders.length !== next.orderBilling.changeOrders.length ||
    existing.orderBilling.workLog.length !== next.orderBilling.workLog.length ||
    calculateSummary(existing.groups, existing.project).net !== calculateSummary(next.groups, next.project).net
  );
}

function upsertSavedOfferSnapshot(
  current: SavedOffer[],
  project: Project,
  groups: PositionGroup[],
  orderBilling: OrderBilling,
  savedAt: string,
  bumpVersion = false
) {
  const existing = current.find((offer) => offer.id === project.id);
  const next = makeSavedOfferSnapshot(project, groups, orderBilling, savedAt, existing, bumpVersion);
  if (!savedOfferSnapshotChanged(existing, next)) return current;
  return existing ? current.map((offer) => (offer.id === project.id ? next : offer)) : [next, ...current];
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

function createAppStateFileName(project: Project, profiles: CompanyProfile[]) {
  const company = profiles.find((profile) => profile.id === project.companyId);
  const offerNumber = slugifyFilePart(project.offerNumber, "ohne-angebotsnummer");
  const companyPart = slugifyFilePart(company?.logoText || company?.name || project.companyId, "firmenprofil");
  const clientPart = slugifyFilePart(project.client, "ohne-kunde");
  const projectPart = slugifyFilePart(project.projectName, "ohne-projekt");
  return `${offerNumber}-${companyPart}-${clientPart}-${projectPart}-${dateStamp()}-smart-offerflow.json`;
}

function createInitialLibraryPositions() {
  return initialGroups.flatMap((group) =>
    group.positions.map((position) => ({
      ...position,
      id: `lib-${position.id}`,
      number: "",
      active: true
    }))
  );
}

function cloneGroups(groups: PositionGroup[]) {
  return renumberGroups(
    groups.map((group) => ({
      ...group,
      positions: group.positions.map((position) => ({ ...position }))
    }))
  );
}

const offerTemplateTextFieldLabels: { key: keyof OfferTemplateTextFields; label: string }[] = [
  { key: "offerIntro", label: "Angebotseinleitung" },
  { key: "assignmentReason", label: "Anlass der Beauftragung" },
  { key: "shortDescription", label: "Aufgabenstellung" },
  { key: "objective", label: "Zielsetzung" },
  { key: "serviceScope", label: "Leistungsrahmen" },
  { key: "contractorRole", label: "Auftragnehmerrolle" },
  { key: "serviceDirectoryIntro", label: "Einleitung Leistungsverzeichnis" },
  { key: "serviceExclusion", label: "Leistungsabgrenzung" },
  { key: "changeTerms", label: "Leistungsänderungen" },
  { key: "contractBasis", label: "Vertragsgrundlage" },
  { key: "paymentTerms", label: "Zahlungsbedingungen" },
  { key: "validityText", label: "Gültigkeit" },
  { key: "offerClarification", label: "Angebotsgrundlagen" },
  { key: "offerNote", label: "Hinweis" },
  { key: "acceptanceText", label: "Auftragserteilung" }
];

function offerTemplateTextFromProject(project: Project): OfferTemplateTextFields {
  return offerTemplateTextFieldLabels.reduce<OfferTemplateTextFields>((fields, field) => {
    fields[field.key] = project[field.key] as string;
    return fields;
  }, {});
}

function defaultOfferTemplateText(profile: CompanyProfile): OfferTemplateTextFields {
  const base: OfferTemplateTextFields = {
    offerIntro: profile.offerText,
    assignmentReason: defaultAssignmentReason,
    serviceDirectoryIntro: defaultServiceDirectoryIntro,
    serviceExclusion: defaultServiceExclusion,
    changeTerms: defaultChangeTerms,
    contractBasis: contractBasisForProfile(profile),
    paymentTerms: "Rechnungen sind innerhalb von 14 Kalendertagen nach Rechnungsstellung ohne Abzug zur Zahlung fällig. Die Rechnungsstellung erfolgt monatlich beziehungsweise nach erbrachter Leistung.",
    validityText: defaultValidityText,
    offerClarification: defaultOfferBasis,
    offerNote: "",
    acceptanceText: defaultAcceptanceText
  };

  if (profile.id === "builtsmart-ai") {
    return {
      ...base,
      shortDescription:
        "Konzeption und Umsetzung einer digitalen Anwendung mit klaren Arbeitsabläufen, verständlicher Bedienoberfläche, strukturierter Datenspeicherung und gezielter KI-Unterstützung.",
      objective:
        "Ziel ist eine praxistaugliche, nachvollziehbare und erweiterbare Anwendung, die wiederkehrende Arbeitsschritte vereinfacht, Informationen strukturiert und Nutzer bei der Erstellung, Prüfung oder Bearbeitung von Inhalten unterstützt.",
      serviceScope:
        "Die Leistungen umfassen Beratung, Konzeption, Gestaltung, technische Umsetzung, KI-Funktionen, Qualitätssicherung, Bereitstellung und Einführung. Der konkrete Umfang richtet sich nach den abgestimmten Funktionen und Prioritäten.",
      contractorRole:
        "Der Auftragnehmer erbringt die Leistungen als unabhängiger Konzeptions-, Entwicklungs- und Umsetzungspartner. Fachliche Freigaben, rechtliche Bewertungen und finale inhaltliche Entscheidungen verbleiben beim Auftraggeber."
    };
  }

  if (profile.id === "metzger-real-estate") {
    return {
      ...base,
      shortDescription: "Beratungs- und Unterstützungsleistungen für immobilienbezogene Projekt-, Steuerungs-, Prüf- oder Sachverständigenaufgaben.",
      objective:
        "Ziel ist ein belastbares, fachlich klares und prüffähiges Leistungsbild für immobilienbezogene Beratungs-, Steuerungs- und Unterstützungsleistungen.",
      serviceScope: defaultServiceScope,
      contractorRole: defaultContractorRole
    };
  }

  return {
    ...base,
    shortDescription: "Strukturierte Beratungs-, Konzeptions- und Umsetzungsleistungen auf Grundlage der abgestimmten Projektanforderungen.",
    objective: "Ziel ist eine nachvollziehbare Leistungsstruktur mit klaren Ergebnissen, Zuständigkeiten und prüffähiger Kalkulation.",
    serviceScope: defaultServiceScope,
    contractorRole: "Der Auftragnehmer erbringt die Leistungen als unabhängiger Beratungs- und Umsetzungspartner auf Grundlage der abgestimmten Aufgabenstellung."
  };
}

function applyTemplateTextToProject(project: Project, template: LvTemplate): Project {
  return {
    ...project,
    ...(template.textFields ?? {})
  };
}

function makeBuiltSmartAiPosition(
  groupId: string,
  index: number,
  title: string,
  description: string,
  rateKey: Position["rateKey"] = "ai",
  unit: Position["unit"] = "Std.",
  quantity = 1,
  unitPrice = 220,
  category = "KI-Lösung",
  required = true,
  note = ""
): Position {
  return {
    id: `bsai-${groupId}-${index}`,
    groupId,
    number: "0.0",
    title,
    description,
    unit,
    quantity,
    rateKey,
    unitPrice,
    category,
    required,
    note,
    status: required ? "Offen" : "Optional",
    active: required
  };
}

function createBuiltSmartAiStandardGroups(): PositionGroup[] {
  const groups: PositionGroup[] = [
    {
      id: "bsai-strategy",
      title: "Strategie, Anforderungen und Zielbild",
      intro: "Klärung, was die Anwendung leisten soll, welche Probleme sie löst, wer damit arbeitet und welchen messbaren Nutzen sie bringen soll.",
      active: true,
      positions: [
        makeBuiltSmartAiPosition("bsai-strategy", 1, "Auftaktworkshop und Zielklärung", "Gemeinsamer Starttermin zur Klärung von Zielen, Nutzergruppen, heutigen Arbeitsabläufen, Entscheidungspunkten und erwartetem Nutzen.", "strategy", "Std.", 8, 250, "Strategie"),
        makeBuiltSmartAiPosition("bsai-strategy", 2, "Aufnahme der Anforderungen und Arbeitsabläufe", "Strukturierte Erfassung der gewünschten Funktionen, vorhandenen Informationen, Zuständigkeiten, Freigaben und wiederkehrenden Arbeitsschritte.", "strategy", "Std.", 16, 250, "Analyse"),
        makeBuiltSmartAiPosition("bsai-strategy", 3, "Priorisierung der wichtigsten Funktionen", "Bewertung, welche Funktionen zuerst umgesetzt werden sollten, welche optional sind und welche Voraussetzungen dafür geschaffen werden müssen.", "concept", "Std.", 8, 250, "Konzeption"),
        makeBuiltSmartAiPosition("bsai-strategy", 4, "Projektstruktur und Umsetzungsfahrplan", "Aufbau eines verständlichen Fahrplans mit Phasen, Arbeitspaketen, Mitwirkungspflichten, Entscheidungsmeilensteinen und Aufwandstreibern.", "project", "Std.", 10, 220, "Projektsteuerung")
      ]
    },
    {
      id: "bsai-concept",
      title: "Fachkonzept und Lösungsbeschreibung",
      intro: "Beschreibung, wie die Anwendung fachlich funktionieren soll, bevor technische Umsetzung und Programmierung beginnen.",
      active: true,
      positions: [
        makeBuiltSmartAiPosition("bsai-concept", 1, "Fachliche Leistungsbeschreibung", "Verständliche Beschreibung der gewünschten Funktionen, Eingaben, Ausgaben, Bearbeitungsschritte und Ergebnisse der Anwendung.", "concept", "Std.", 20, 250, "Konzeption"),
        makeBuiltSmartAiPosition("bsai-concept", 2, "Beschreibung der Arbeitsabläufe", "Darstellung, wie Informationen erfasst, geprüft, bearbeitet, freigegeben, exportiert und für weitere Schritte genutzt werden.", "concept", "Std.", 14, 250, "Konzeption"),
        makeBuiltSmartAiPosition("bsai-concept", 3, "Rollen, Freigaben und Bearbeitungsstände", "Festlegung, wer welche Informationen sehen, bearbeiten, prüfen oder freigeben darf und welche Statusangaben dafür benötigt werden.", "project", "Std.", 10, 220, "Projektsteuerung"),
        makeBuiltSmartAiPosition("bsai-concept", 4, "Daten- und Dokumentenstruktur", "Strukturierung der benötigten Daten, Dokumente, Vorlagen und Textbausteine, damit sie nachvollziehbar gespeichert und wiederverwendet werden können.", "concept", "Std.", 12, 250, "Konzeption")
      ]
    },
    {
      id: "bsai-ux",
      title: "Bedienoberfläche und Nutzerführung",
      intro: "Gestaltung der sichtbaren Anwendung, damit Anwender die richtigen Informationen schnell finden, sicher eingeben und effizient bearbeiten können.",
      active: true,
      positions: [
        makeBuiltSmartAiPosition("bsai-ux", 1, "Struktur der Bildschirmseiten und Navigation", "Planung der Seiten, Menüs, Übersichten und Wege durch die Anwendung, damit Nutzer logisch und ohne Umwege arbeiten können.", "ux", "Std.", 16, 180, "Bedienoberfläche"),
        makeBuiltSmartAiPosition("bsai-ux", 2, "Gestaltung von Formularen, Tabellen und Übersichten", "Gestaltung der Eingabefelder, Tabellen, Kennzahlen, Aktionsbuttons und Ansichten, die im täglichen Arbeiten benötigt werden.", "ux", "Std.", 22, 180, "Bedienoberfläche"),
        makeBuiltSmartAiPosition("bsai-ux", 3, "Vorschau- und Exportdarstellungen", "Gestaltung der Ausgabeansichten, zum Beispiel Angebot, Bericht, PDF, Druckansicht oder strukturierte Exportdateien.", "ux", "Std.", 12, 180, "Bedienoberfläche"),
        makeBuiltSmartAiPosition("bsai-ux", 4, "Abstimmung und Optimierung der Bedienlogik", "Gemeinsame Prüfung der Bedienung anhand realistischer Beispiele und Anpassung, damit die Anwendung verständlich und praxistauglich wird.", "ux", "Std.", 10, 180, "Bedienoberfläche", false)
      ]
    },
    {
      id: "bsai-development",
      title: "Technische Umsetzung der Anwendung",
      intro: "Programmierung der sichtbaren Anwendung und der technischen Logik im Hintergrund, einschließlich Speicherung, Berechnung und Datenverarbeitung.",
      active: true,
      positions: [
        makeBuiltSmartAiPosition("bsai-development", 1, "Frontend-Entwicklung: sichtbare Oberfläche der App", "Umsetzung aller Seiten, Formulare, Tabellen, Buttons, Vorschauen und Bedienfunktionen, mit denen Anwender direkt arbeiten.", "development", "Std.", 48, 180, "Entwicklung"),
        makeBuiltSmartAiPosition("bsai-development", 2, "Backend-Entwicklung: Logik im Hintergrund", "Umsetzung der technischen Abläufe, zum Beispiel Speicherung, Berechnungen, Statuslogik, Angebotsnummern und Datenverarbeitung.", "development", "Std.", 42, 180, "Entwicklung"),
        makeBuiltSmartAiPosition("bsai-development", 3, "Datenmodell und Speicherstruktur", "Aufbau der Struktur, in der Kunden, Projekte, Angebote, Vorlagen, Positionen, Arbeitsstände und Versionen gespeichert werden.", "development", "Std.", 20, 180, "Entwicklung"),
        makeBuiltSmartAiPosition("bsai-development", 4, "Schnittstellenanbindung", "Anbindung externer Systeme oder Dienste, damit Daten automatisch übernommen, übertragen oder weiterverarbeitet werden können.", "development", "Std.", 16, 180, "Integration", false, "Optional, wenn externe Systeme angebunden werden sollen.")
      ]
    },
    {
      id: "bsai-ai",
      title: "KI-Funktionen und Wissensbasis",
      intro: "Festlegung, wo KI sinnvoll unterstützt, welche Informationen sie nutzen darf und wie Ergebnisse geprüft und freigegeben werden.",
      active: true,
      positions: [
        makeBuiltSmartAiPosition("bsai-ai", 1, "Definition der KI-Anwendungsfälle", "Festlegung, bei welchen Aufgaben die KI unterstützen soll, zum Beispiel bei Textvorschlägen, Strukturprüfungen, Zusammenfassungen oder Suchaufgaben.", "prompt", "Std.", 16, 220, "KI-Konzept"),
        makeBuiltSmartAiPosition("bsai-ai", 2, "Prompt Engineering: klare Anweisungen für die KI", "Entwicklung verständlicher Regeln und Eingabevorlagen, damit die KI fachlich passende, nachvollziehbare und im gewünschten Stil formulierte Ergebnisse liefert.", "prompt", "Std.", 16, 220, "KI-Konzept"),
        makeBuiltSmartAiPosition("bsai-ai", 3, "Wissensbasis für KI-Unterstützung", "Aufbau einer strukturierten Wissensgrundlage aus Texten, Dokumenten oder Vorlagen, aus der die KI passende Informationen für Vorschläge oder Texte nutzt.", "ai", "Std.", 30, 220, "KI-Implementierung"),
        makeBuiltSmartAiPosition("bsai-ai", 4, "KI-Textvorschläge und Strukturvorschläge", "Umsetzung von Funktionen, mit denen die KI Entwürfe, Formulierungen, Gliederungen oder Prüfhinweise erstellt, die anschließend vom Nutzer kontrolliert werden.", "ai", "Std.", 28, 220, "KI-Implementierung"),
        makeBuiltSmartAiPosition("bsai-ai", 5, "Prüf- und Freigabelogik für KI-Ergebnisse", "Einbau von Kontrollschritten, damit KI-Ergebnisse nicht ungeprüft übernommen werden, sondern nachvollziehbar bewertet, angepasst und freigegeben werden können.", "ai", "Std.", 18, 220, "KI-Qualität")
      ]
    },
    {
      id: "bsai-quality",
      title: "Qualitätssicherung, Datenschutz und Abnahme",
      intro: "Prüfung, ob die Anwendung fachlich richtig funktioniert, verständlich bedienbar ist und kritische Daten kontrolliert verarbeitet.",
      active: true,
      positions: [
        makeBuiltSmartAiPosition("bsai-quality", 1, "Funktionstests der wichtigsten Arbeitsabläufe", "Prüfung der zentralen Arbeitsschritte von der Eingabe über Bearbeitung und Speicherung bis zur Ausgabe oder zum Export.", "development", "Std.", 22, 180, "Qualität"),
        makeBuiltSmartAiPosition("bsai-quality", 2, "Prüfung von Berechnungen, Formularen und Exporten", "Kontrolle, ob Eingaben korrekt verarbeitet werden, Berechnungen stimmen und Angebote, Berichte oder Exporte vollständig ausgegeben werden.", "development", "Std.", 16, 180, "Qualität"),
        makeBuiltSmartAiPosition("bsai-quality", 3, "Prüfung der KI-Ergebnisse auf Nachvollziehbarkeit", "Bewertung, ob KI-Ausgaben verständlich, fachlich plausibel, nachvollziehbar und für die weitere Bearbeitung geeignet sind.", "ai", "Std.", 18, 220, "Qualität"),
        makeBuiltSmartAiPosition("bsai-quality", 4, "Datenschutz- und Sicherheitsprüfung", "Prüfung der Datenflüsse, Zugriffsrechte, Speicherung, Protokollierung und Nutzung externer Dienste aus organisatorischer und technischer Sicht.", "concept", "Std.", 10, 250, "Qualität", false)
      ]
    },
    {
      id: "bsai-deployment",
      title: "Bereitstellung und Inbetriebnahme",
      intro: "Online-Stellung der Anwendung in der vereinbarten Umgebung einschließlich Konfiguration, Übergabe und Startbegleitung.",
      active: true,
      positions: [
        makeBuiltSmartAiPosition("bsai-deployment", 1, "Einrichtung der technischen Umgebung", "Einrichtung der benötigten Server-, Hosting- oder Cloud-Umgebung, damit die Anwendung zuverlässig betrieben werden kann.", "deployment", "Std.", 12, 180, "Bereitstellung"),
        makeBuiltSmartAiPosition("bsai-deployment", 2, "Domain, Hosting und Grundeinstellungen", "Konfiguration von Internetadresse, SSL-Verschlüsselung, Umgebungsvariablen, Grundeinstellungen und technischem Veröffentlichungsprozess.", "deployment", "Std.", 10, 180, "Bereitstellung"),
        makeBuiltSmartAiPosition("bsai-deployment", 3, "Übergabe der Anwendung", "Übergabe der funktionsfähigen Anwendung einschließlich kurzer technischer Dokumentation, Zugangsinformationen und abgestimmter Betriebshinweise.", "deployment", "Std.", 8, 180, "Übergabe"),
        makeBuiltSmartAiPosition("bsai-deployment", 4, "Begleitung beim Produktivstart", "Begleitung der ersten Nutzung im Echtbetrieb mit Fehleranalyse, Priorisierung von Rückmeldungen und kurzfristiger Stabilisierung.", "support", "Std.", 12, 180, "Support", false)
      ]
    },
    {
      id: "bsai-training-support",
      title: "Einführung, Schulung und Weiterentwicklung",
      intro: "Befähigung der Nutzer, verständliche Dokumentation und planbare Weiterentwicklung der Anwendung nach dem Start.",
      active: true,
      positions: [
        makeBuiltSmartAiPosition("bsai-training-support", 1, "Anwenderschulung", "Praxisnahe Einführung in die wichtigsten Abläufe, Rollen, Eingaben, KI-Unterstützung, Prüfhinweise und typische Nutzungssituationen.", "training", "Std.", 8, 220, "Schulung"),
        makeBuiltSmartAiPosition("bsai-training-support", 2, "Kurzanleitung oder Bedienhilfe", "Erstellung einer verständlichen Anleitung für zentrale Arbeitsschritte, häufige Fragen und empfohlene Vorgehensweisen.", "training", "Std.", 10, 220, "Dokumentation"),
        makeBuiltSmartAiPosition("bsai-training-support", 3, "Administratoreneinweisung", "Einweisung verantwortlicher Personen in Konfiguration, Pflege von Vorlagen, Datenquellen, Nutzerverwaltung und Qualitätssicherung.", "training", "Std.", 6, 220, "Schulung", false),
        makeBuiltSmartAiPosition("bsai-training-support", 4, "Support- und Weiterentwicklungskontingent", "Reserviertes Kontingent für Anwenderfragen, kleinere Anpassungen, Optimierungen und priorisierte Erweiterungen.", "support", "Monat", 3, 1800, "Support", false, "Monatliches Kontingent nach Vereinbarung.")
      ]
    }
  ];

  return renumberGroups(groups);
}

function makeMetzgerPosition(
  groupId: string,
  index: number,
  title: string,
  description: string,
  rateKey: Position["rateKey"] = "strategy",
  unit: Position["unit"] = "Std.",
  quantity = 1,
  unitPrice = 250,
  category = "Beratung"
): Position {
  return {
    id: `mrea-${groupId}-${index}`,
    groupId,
    number: "0.0",
    title,
    description,
    unit,
    quantity,
    rateKey,
    unitPrice,
    category,
    required: false,
    note: "Individuell nach Beauftragung und Leistungsumfang abrechenbar.",
    status: "Offen",
    active: true
  };
}

function createMetzgerReaStandardGroups(): PositionGroup[] {
  const groups: PositionGroup[] = [
    {
      id: "mrea-strategy",
      title: "Strategische Beratung",
      intro: "Strategische Beratung zur Entwicklung, Bewertung und Priorisierung immobilienbezogener Projekt-, Organisations- und Entscheidungsfragen.",
      active: true,
      positions: [
        makeMetzgerPosition("mrea-strategy", 1, "Strategische Erstbewertung und Zielbild", "Analyse der Ausgangslage, Klärung der Zielsetzung, Bewertung strategischer Handlungsoptionen und Ableitung eines belastbaren Zielbildes."),
        makeMetzgerPosition("mrea-strategy", 2, "Entscheidungsvorlage und Handlungsempfehlung", "Erstellung strukturierter Entscheidungsvorlagen mit Chancen, Risiken, Prioritäten, Maßnahmen und wirtschaftlichen Auswirkungen."),
        makeMetzgerPosition("mrea-strategy", 3, "Management-Sparring und Beratungstermine", "Projektbezogene Beratung, Abstimmung mit Geschäftsführung, Eigentümer, Projektleitung oder weiteren Entscheidungsträgern.")
      ]
    },
    {
      id: "mrea-project-control",
      title: "Projektsteuerung und Projektmanagement",
      intro: "Operative Steuerung von Projekten mit Blick auf Kosten, Termine, Qualitäten, Risiken, Kommunikation und Entscheidungsfähigkeit.",
      active: true,
      positions: [
        makeMetzgerPosition("mrea-project-control", 1, "Projektstruktur und Steuerungssystem", "Aufbau oder Prüfung von Projektstruktur, Rollen, Termin- und Kostensteuerung, Berichtswesen und Entscheidungswegen.", "project", "Std.", 1, 220, "Projektsteuerung"),
        makeMetzgerPosition("mrea-project-control", 2, "Laufende Projektsteuerungsleistungen", "Koordination, Terminverfolgung, Kosten- und Maßnahmencontrolling, Protokollierung und Nachhalten offener Punkte.", "project", "Std.", 1, 220, "Projektsteuerung"),
        makeMetzgerPosition("mrea-project-control", 3, "Jour fixe und Gremienvorbereitung", "Vorbereitung, Moderation und Nachbereitung von Projektbesprechungen, Lenkungskreisen und Entscheidungsrunden.", "project", "Std.", 1, 220, "Projektsteuerung")
      ]
    },
    {
      id: "mrea-interim",
      title: "Interimsmanagement",
      intro: "Zeitlich befristete Übernahme von Management-, Steuerungs- oder Koordinationsaufgaben in Projekten oder Organisationseinheiten.",
      active: true,
      positions: [
        makeMetzgerPosition("mrea-interim", 1, "Interimsmandat Projektleitung", "Temporäre Übernahme projektleitender Aufgaben einschließlich Organisation, Steuerung, Kommunikation und Entscheidungsunterstützung.", "project", "Tag", 1, 1760, "Interimsmanagement"),
        makeMetzgerPosition("mrea-interim", 2, "Interimsmandat Fachkoordination", "Zeitlich begrenzte fachliche Koordination von Technik, Bau, Betrieb, Bestandsaufnahme oder externen Dienstleistern.", "project", "Tag", 1, 1760, "Interimsmanagement")
      ]
    },
    {
      id: "mrea-risk",
      title: "Risikomanagement und Chancenmanagement",
      intro: "Systematische Identifikation, Bewertung, Steuerung und Dokumentation von Risiken und Chancen im Projekt- oder Bestandskontext.",
      active: true,
      positions: [
        makeMetzgerPosition("mrea-risk", 1, "Risiko- und Chancenworkshop", "Durchführung strukturierter Workshops zur Aufnahme und Bewertung von Risiken, Chancen, Gegenmaßnahmen und Verantwortlichkeiten.", "strategy", "Std.", 1, 250, "Risikomanagement"),
        makeMetzgerPosition("mrea-risk", 2, "Risikoregister und Maßnahmenplan", "Erstellung oder Fortschreibung eines Risikoregisters mit Eintrittswahrscheinlichkeit, Auswirkungen, Priorisierung und Maßnahmenverfolgung.", "concept", "Std.", 1, 250, "Risikomanagement"),
        makeMetzgerPosition("mrea-risk", 3, "Review kritischer Projektparameter", "Bewertung kritischer Kosten-, Termin-, Qualitäts-, Vertrags- oder Organisationsrisiken und Ableitung von Handlungsoptionen.", "strategy", "Std.", 1, 250, "Risikomanagement")
      ]
    },
    {
      id: "mrea-crisis",
      title: "Troubleshooting und Krisenmanagement",
      intro: "Kurzfristige Stabilisierung und strukturierte Bearbeitung kritischer Projekt-, Bau-, Qualitäts- oder Organisationssituationen.",
      active: true,
      positions: [
        makeMetzgerPosition("mrea-crisis", 1, "Krisenanalyse und Sofortmaßnahmenplan", "Schnelle Lagebewertung, Identifikation der Hauptursachen und Ableitung priorisierter Sofortmaßnahmen.", "strategy", "Std.", 1, 250, "Troubleshooting"),
        makeMetzgerPosition("mrea-crisis", 2, "Taskforce-Steuerung", "Koordination beteiligter Parteien, Nachverfolgung kritischer Maßnahmen und Berichterstattung an Auftraggeber oder Entscheidungsgremium.", "project", "Std.", 1, 220, "Troubleshooting")
      ]
    },
    {
      id: "mrea-tdd",
      title: "Technische Due Diligence",
      intro: "Technische Prüfung von Immobilien, Projekten oder Portfolios zur Bewertung von Zustand, Risiken, Investitionsbedarf und Entscheidungsgrundlagen.",
      active: true,
      positions: [
        makeMetzgerPosition("mrea-tdd", 1, "Objekt- und Dokumentenprüfung", "Prüfung vorhandener Unterlagen, Bestandsdokumentation, Wartungsnachweise, Genehmigungen, Gutachten und technischer Angaben.", "concept", "Std.", 1, 250, "Due Diligence"),
        makeMetzgerPosition("mrea-tdd", 2, "Objektbegehung und Zustandsaufnahme", "Technische Begehung von Gebäude, Außenanlagen, technischen Anlagen und wesentlichen Bauteilen mit Fotodokumentation.", "strategy", "Std.", 1, 250, "Due Diligence"),
        makeMetzgerPosition("mrea-tdd", 3, "TDD-Bericht und Maßnahmenbudget", "Erstellung eines technischen Due-Diligence-Berichts mit Befunden, Risiken, CapEx-Einschätzung und Handlungsempfehlungen.", "concept", "Std.", 1, 250, "Due Diligence")
      ]
    },
    {
      id: "mrea-construction-audit",
      title: "Baurevision",
      intro: "Unabhängige Prüfung von Bauprojekten, Bauabläufen, Abrechnungen, Dokumentationen und Qualitäts- oder Kostenrisiken.",
      active: true,
      positions: [
        makeMetzgerPosition("mrea-construction-audit", 1, "Prüfung Baufortschritt und Leistungsstand", "Abgleich von vertraglich geschuldeten Leistungen, Baufortschritt, Dokumentation und erkennbarem Abweichungsbedarf.", "project", "Std.", 1, 220, "Baurevision"),
        makeMetzgerPosition("mrea-construction-audit", 2, "Prüfung Nachträge und Abrechnungsgrundlagen", "Plausibilisierung von Nachträgen, Leistungsänderungen, Aufmaßen, Rechnungsgrundlagen und Dokumentationsständen.", "concept", "Std.", 1, 250, "Baurevision"),
        makeMetzgerPosition("mrea-construction-audit", 3, "Revisionsbericht", "Dokumentation der Feststellungen mit Bewertung, Empfehlungen, Prioritäten und gegebenenfalls weiterem Prüfbedarf.", "concept", "Std.", 1, 250, "Baurevision")
      ]
    },
    {
      id: "mrea-quality",
      title: "Qualitätsmanagement",
      intro: "Aufbau, Prüfung und Begleitung von Qualitätsprozessen für Planung, Bauausführung, Bestand, Betrieb und Dokumentation.",
      active: true,
      positions: [
        makeMetzgerPosition("mrea-quality", 1, "Qualitätskonzept und Prüfplan", "Definition von Qualitätszielen, Prüfprozessen, Abnahmekriterien, Verantwortlichkeiten und Dokumentationsanforderungen.", "concept", "Std.", 1, 250, "Qualitätsmanagement"),
        makeMetzgerPosition("mrea-quality", 2, "Qualitätsbegehung und Mängeltracking", "Durchführung von Begehungen, strukturierte Erfassung von Abweichungen und Nachverfolgung von Maßnahmen.", "project", "Std.", 1, 220, "Qualitätsmanagement")
      ]
    },
    {
      id: "mrea-damage",
      title: "Bauschadenanalyse",
      intro: "Analyse von Bauschäden, Mängeln oder Auffälligkeiten mit Ursachenbewertung, Dokumentation und Handlungsempfehlung.",
      active: true,
      positions: [
        makeMetzgerPosition("mrea-damage", 1, "Schadensaufnahme vor Ort", "Objektbezogene Aufnahme von Schadensbildern, Randbedingungen, Nutzungseinflüssen und erkennbaren Ursachenindikatoren.", "strategy", "Std.", 1, 250, "Bauschadenanalyse"),
        makeMetzgerPosition("mrea-damage", 2, "Ursachenanalyse und Sanierungsempfehlung", "Bewertung möglicher Ursachen, Abgrenzung weiterer Untersuchungen und Ableitung technischer Maßnahmenempfehlungen.", "concept", "Std.", 1, 250, "Bauschadenanalyse"),
        makeMetzgerPosition("mrea-damage", 3, "Dokumentation und Stellungnahme", "Erstellung einer schriftlichen Dokumentation oder Stellungnahme mit Fotodokumentation, Bewertung und Empfehlungen.", "concept", "Std.", 1, 250, "Bauschadenanalyse")
      ]
    },
    {
      id: "mrea-expert",
      title: "Sachverständigenleistungen",
      intro: "Fachliche Stellungnahmen, Plausibilisierungen und gutachterliche Einschätzungen zu technischen, baulichen oder organisatorischen Fragestellungen.",
      active: true,
      positions: [
        makeMetzgerPosition("mrea-expert", 1, "Fachliche Stellungnahme", "Erstellung einer fachlichen Stellungnahme zu einer konkret abgegrenzten technischen oder baubezogenen Fragestellung.", "concept", "Std.", 1, 250, "Sachverständigenleistung"),
        makeMetzgerPosition("mrea-expert", 2, "Teilnahme an Ortsterminen oder Abstimmungen", "Teilnahme an technischen Abstimmungen, Ortsterminen, Begehungen oder Besprechungen mit fachlicher Bewertung.", "strategy", "Std.", 1, 250, "Sachverständigenleistung")
      ]
    },
    {
      id: "mrea-building-analysis",
      title: "Technische Bestandsanalysen",
      intro: "Strukturierte Analyse technischer Gebäude-, Anlagen- oder Portfoliobestände als Grundlage für Entscheidungen, Budgets und Maßnahmen.",
      active: true,
      positions: [
        makeMetzgerPosition("mrea-building-analysis", 1, "Bestandsaufnahme und Datenstruktur", "Aufnahme technischer Bestandsdaten, Sichtung vorhandener Unterlagen und Strukturierung der relevanten Informationen.", "concept", "Std.", 1, 250, "Bestandsanalyse"),
        makeMetzgerPosition("mrea-building-analysis", 2, "Maßnahmen- und Prioritätenmatrix", "Ableitung von Instandhaltungs-, Modernisierungs- oder Prüfmaßnahmen mit Priorisierung und Budgetindikationen.", "strategy", "Std.", 1, 250, "Bestandsanalyse")
      ]
    },
    {
      id: "mrea-organization",
      title: "Organisations- und Prozessoptimierung",
      intro: "Analyse und Verbesserung von Organisationsstrukturen, Schnittstellen, Projektprozessen, Verantwortlichkeiten und Berichtswegen.",
      active: true,
      positions: [
        makeMetzgerPosition("mrea-organization", 1, "Prozessanalyse und Schnittstellenbewertung", "Analyse bestehender Abläufe, Rollen, Übergabepunkte, Medienbrüche, Entscheidungswege und Optimierungspotenziale.", "strategy", "Std.", 1, 250, "Prozessoptimierung"),
        makeMetzgerPosition("mrea-organization", 2, "Sollprozess und Umsetzungsfahrplan", "Entwicklung eines Sollprozesses mit Verantwortlichkeiten, Dokumentationslogik, Meilensteinen und Umsetzungsmaßnahmen.", "concept", "Std.", 1, 250, "Prozessoptimierung")
      ]
    },
    {
      id: "mrea-training",
      title: "Schulungen, Workshops und Vorträge",
      intro: "Konzeption und Durchführung von Schulungen, Workshops und Vorträgen zu technischen, organisatorischen oder projektbezogenen Themen.",
      active: true,
      positions: [
        makeMetzgerPosition("mrea-training", 1, "Workshop-Konzeption und Vorbereitung", "Abstimmung von Zielgruppe, Lernzielen, Agenda, Unterlagen, Übungen und Ergebnissicherung.", "training", "Std.", 1, 220, "Schulung"),
        makeMetzgerPosition("mrea-training", 2, "Durchführung Workshop, Schulung oder Vortrag", "Durchführung einer Schulung, eines Workshops oder Vortrags einschließlich Moderation und fachlicher Einordnung.", "training", "Tag", 1, 1760, "Schulung"),
        makeMetzgerPosition("mrea-training", 3, "Dokumentation und Ergebniszusammenfassung", "Nachbereitung, Zusammenfassung der Ergebnisse, Fotoprotokoll oder Übergabe einer strukturierten Ergebnisdokumentation.", "training", "Std.", 1, 220, "Schulung")
      ]
    },
    {
      id: "mrea-individual",
      title: "Sonstige individuell vereinbarte Beratungs- und Unterstützungsleistungen",
      intro: "Weitere projektbezogene Leistungen nach individueller Vereinbarung, soweit sie dem Beratungs- und Unterstützungszweck dienen.",
      active: true,
      positions: [
        makeMetzgerPosition("mrea-individual", 1, "Individuelle Beratungsleistung", "Sonstige abgestimmte Beratungs-, Analyse-, Koordinations- oder Unterstützungsleistung nach konkretem Projektbedarf.", "strategy", "Std.", 1, 250, "Individuell"),
        makeMetzgerPosition("mrea-individual", 2, "Sonderauswertung oder Ad-hoc-Unterstützung", "Kurzfristige fachliche Zuarbeit, Auswertung, Stellungnahme oder Projektunterstützung nach vorheriger Abstimmung.", "concept", "Std.", 1, 250, "Individuell")
      ]
    },
    {
      id: "mrea-compensation",
      title: "Vergütung und abrechenbare Leistungszeiten",
      intro: "Abrechnungspositionen zur Abbildung von Stunden-, Tages-, Pauschal- oder Projektvergütung sowie vergütungspflichtigen Leistungszeiten.",
      active: true,
      positions: [
        makeMetzgerPosition("mrea-compensation", 1, "Stundenbasierte Beratungsleistung", "Abrechnung projektbezogener Tätigkeiten nach vereinbartem Stundensatz, insbesondere Beratung, Besprechung, Analyse, Auswertung, Dokumentation, Bericht, Stellungnahme, Präsentation und Workshop.", "strategy", "Std.", 1, 250, "Vergütung"),
        makeMetzgerPosition("mrea-compensation", 2, "Tagesbasierte Beratungsleistung", "Abrechnung projektbezogener Leistungen auf Basis eines vereinbarten Tagessatzes für Einsatztage, Workshops, Ortstermine oder Interimsleistungen.", "project", "Tag", 1, 1760, "Vergütung"),
        makeMetzgerPosition("mrea-compensation", 3, "Pauschal- oder Projektvergütung", "Individuell vereinbarte Pauschal- oder Projektvergütung für abgegrenzte Leistungspakete, Arbeitsergebnisse oder Projektphasen.", "strategy", "Pauschal", 1, 0, "Vergütung"),
        makeMetzgerPosition("mrea-compensation", 4, "Reisezeiten als Leistungszeit", "Vergütungspflichtige Reise- und Fahrtzeiten im Zusammenhang mit projektbezogenen Einsatzorten, Kunden, Baustellen oder Objekten, soweit vereinbart oder zur Leistungserbringung erforderlich.", "support", "Std.", 1, 180, "Vergütung"),
        makeMetzgerPosition("mrea-compensation", 5, "Abschlagszahlung oder Vorschuss", "Abschlagszahlung oder Vorschuss für laufende oder bevorstehende Beratungs-, Projekt- oder Unterstützungsleistungen nach angemessener Vereinbarung.", "strategy", "Pauschal", 1, 0, "Vergütung")
      ]
    },
    {
      id: "mrea-expenses",
      title: "Fahrtkosten und Auslagen",
      intro: "Gesonderte Abrechnung projektbezogener Fahrtkosten, Reisekosten und außergewöhnlicher Auslagen, sofern keine abweichende Vereinbarung getroffen wurde.",
      active: true,
      positions: [
        makeMetzgerPosition("mrea-expenses", 1, "Kilometerpauschale Kraftfahrzeug", "Abrechnung projektbezogener Fahrten mit dem Kraftfahrzeug auf Basis der vereinbarten Kilometerpauschale.", "support", "Kilometer", 1, 0, "Auslagen"),
        makeMetzgerPosition("mrea-expenses", 2, "Reisekosten nach tatsächlichem Aufwand", "Abrechnung notwendiger Bahn-, Flug-, Taxi-, Mietwagen-, Park-, Maut- und Übernachtungskosten nach tatsächlichem Aufwand und Nachweis.", "support", "Pauschal", 1, 0, "Auslagen"),
        makeMetzgerPosition("mrea-expenses", 3, "Außergewöhnliche projektbezogene Auslagen", "Gesonderte Berechnung sonstiger außergewöhnlicher projektbezogener Auslagen nach vorheriger Abstimmung mit dem Auftraggeber.", "support", "Pauschal", 1, 0, "Auslagen")
      ]
    }
  ];

  return renumberGroups(groups);
}

function createInitialProfileTemplates(profiles: CompanyProfile[] = companyProfiles): LvTemplate[] {
  const createdAt = "2026-06-20T00:00:00.000Z";
  return profiles.map((profile) => ({
    id: `template-${profile.id}-standard`,
    companyId: profile.id,
    name: `${profile.name} Angebotsvorlage`,
    description:
      profile.id === "metzger-real-estate"
        ? "Angebotsvorlage für strategische Beratung, Projektsteuerung, Due Diligence, Baurevision, Sachverständigenleistungen, Vergütung, Fahrtkosten und Auslagen."
        : profile.id === "builtsmart-ai"
          ? "Optimierte Angebotsvorlage für KI-Anwendungen: Strategie, Fachkonzept, UX, Entwicklung, KI-Funktionen, Qualitätssicherung, Deployment und Einführung."
        : `Profilgebundene LV-Grundstruktur für ${profile.name} mit eigener Angebotslogik und wiederverwendbaren Leistungsgruppen.`,
    createdAt,
    updatedAt: createdAt,
    textFields: defaultOfferTemplateText(profile),
    groups:
      profile.id === "metzger-real-estate"
        ? createMetzgerReaStandardGroups()
        : profile.id === "builtsmart-ai"
          ? createBuiltSmartAiStandardGroups()
          : cloneGroups(initialGroups)
  }));
}

function isLegacyBuiltSmartAiTemplate(template: LvTemplate) {
  if (template.companyId !== "builtsmart-ai") return false;
  const titles = template.groups.map((group) => group.title);
  return (
    titles.includes("Analyse und Konzeption") ||
    titles.includes("KI-Implementierung") ||
    titles.includes("Wartung, Support und Weiterentwicklung") ||
    titles.includes("UX, Oberfläche und Arbeitsabläufe") ||
    titles.includes("Fachkonzept und Lösungsarchitektur") ||
    titles.includes("Anwendungsentwicklung") ||
    titles.includes("KI-Funktionen und Wissenslogik") ||
    titles.includes("Deployment, Betrieb und Übergabe") ||
    template.description.startsWith("Profilgebundene LV-Grundstruktur")
  );
}

function mergeProfileTemplates(savedTemplates: LvTemplate[] | undefined, profiles: CompanyProfile[]) {
  const defaultTemplates = createInitialProfileTemplates(profiles);
  if (!savedTemplates) return defaultTemplates;
  const savedById = new Map(savedTemplates.map((template) => [template.id, template]));
  const mergedDefaults = defaultTemplates.map((template) => {
    const saved = savedById.get(template.id);
    if (!saved) return template;
    if (isLegacyBuiltSmartAiTemplate(saved)) return template;
    const profile = profiles.find((item) => item.id === saved.companyId);
    return {
      ...saved,
      name: saved.name.endsWith(" Master-LV") ? saved.name.replace(/ Master-LV$/, " Angebotsvorlage") : saved.name,
      description: saved.description.replace(/^Master-LV/, "Angebotsvorlage"),
      textFields: saved.textFields ?? (profile ? defaultOfferTemplateText(profile) : template.textFields)
    };
  });
  const defaultIds = new Set(defaultTemplates.map((template) => template.id));
  const customTemplates = savedTemplates
    .filter((template) => !defaultIds.has(template.id) && !isLegacyBuiltSmartAiTemplate(template))
    .map((template) => {
      const profile = profiles.find((item) => item.id === template.companyId);
      return {
        ...template,
        textFields: template.textFields ?? (profile ? defaultOfferTemplateText(profile) : {})
      };
    });
  return [...mergedDefaults, ...customTemplates];
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripCompanyNameFromProjectName(projectName: string, profiles: CompanyProfile[]) {
  let cleaned = projectName.trim();
  const companyNameVariants = profiles.flatMap((profile) => {
    const nameParts = profile.name.split(/\s+-\s+/).map((part) => part.trim()).filter(Boolean);
    return [
      profile.name,
      profile.name.replace(/\s+-\s+/g, " "),
      profile.logoText,
      ...nameParts
    ];
  });

  for (const name of companyNameVariants.filter(Boolean)) {
    const escapedName = escapeRegExp(name.trim());
    cleaned = cleaned
      .replace(new RegExp(`\\s*[·|]\\s*${escapedName}\\s*$`, "i"), "")
      .replace(new RegExp(`\\s+[-–—]\\s+${escapedName}\\s*$`, "i"), "")
      .replace(new RegExp(`\\s*\\(${escapedName}\\)\\s*$`, "i"), "")
      .trim();
  }

  return cleaned || projectName.trim();
}

function hasAiDemoText(value?: string | string[]) {
  const text = Array.isArray(value) ? value.join(" ") : value ?? "";
  return /ki-gest|dokumenten-ki|rag|prompt|wissensplattform|angebotsplattform|arbeitsblatt|workflow-automation/i.test(text);
}

function findAiDemoTerms(value?: string | string[]) {
  const text = Array.isArray(value) ? value.join(" ") : value ?? "";
  return Array.from(new Set(text.match(/ki-gest[^\s,.;)]*|dokumenten-ki|rag|prompt|wissensplattform|angebotsplattform|arbeitsblatt|workflow-automation/gi) ?? []));
}

function collectAiDemoFindings(project: Project, groups: PositionGroup[] = []) {
  const fields: { label: string; value: string | string[] }[] = [
    { label: "Projektname", value: project.projectName },
    { label: "Aufgabenstellung", value: project.shortDescription },
    { label: "Zielsetzung", value: project.objective },
    { label: "Leistungsrahmen", value: project.serviceScope },
    { label: "Auftragnehmerrolle", value: project.contractorRole },
    { label: "Module / Leistungsbereiche", value: project.modules },
    { label: "Technischer Kontext", value: project.technicalContext }
  ];
  const projectFindings = fields
    .map((field) => ({ label: field.label, terms: findAiDemoTerms(field.value) }))
    .filter((finding) => finding.terms.length > 0);
  const groupFindings = groups.flatMap((group) => {
    const groupTerms = findAiDemoTerms([group.title, group.intro]);
    const positionTerms = group.positions.flatMap((position) => findAiDemoTerms([position.title, position.description, position.category, position.note]));
    const terms = Array.from(new Set([...groupTerms, ...positionTerms]));
    return terms.length ? [{ label: `LV: ${group.title}`, terms }] : [];
  });
  return [...projectFindings, ...groupFindings];
}

function normalizeProfiles(savedProfiles: CompanyProfile[] | undefined) {
  const profiles = savedProfiles ?? companyProfiles;
  return profiles.map((profile) => {
    const defaultProfile = companyProfiles.find((item) => item.id === profile.id);
    const oldMetzgerFooters = [
      "Metzger Real Estate Advisory steht für präzise Analyse, belastbare Entscheidungen und digitale Exzellenz in Immobilienprojekten.",
      "Metzger - Real Estate Advisory unterstützt Investoren, Bauherren und Unternehmen mit unabhängiger Beratung, strategischer Projektsteuerung, Risikomanagement und praxisorientierten Lösungen für anspruchsvolle Bau- und Immobilienprojekte."
    ];
    const bookingUrl =
      profile.id === "metzger-real-estate" && (!profile.bookingUrl || profile.bookingUrl === "https://www.metzger-rea.de/termin")
        ? defaultProfile?.bookingUrl ?? ""
        : profile.bookingUrl ?? defaultProfile?.bookingUrl ?? "";
    const bank =
      profile.id === "metzger-real-estate" &&
      (!profile.bank || profile.bank === "Kontoinhaber Bernhard Metzger, IBAN DE00 0000 0000 0000 0000 03, BIC MREADDE")
        ? defaultProfile?.bank ?? ""
        : profile.bank ?? defaultProfile?.bank ?? "";
    const footer =
      profile.id === "metzger-real-estate" && (!profile.footer || oldMetzgerFooters.includes(profile.footer))
        ? defaultProfile?.footer ?? ""
        : profile.footer ?? defaultProfile?.footer ?? "";
    const footerIntro =
      profile.id === "metzger-real-estate" && (!profile.footerIntro || oldMetzgerFooters.includes(profile.footerIntro))
        ? defaultProfile?.footerIntro ?? footer
        : profile.footerIntro ?? profile.footer ?? defaultProfile?.footerIntro ?? footer;
    const website =
      profile.id === "metzger-real-estate" && (!profile.website || profile.website === "www.metzger-advisory.de")
        ? defaultProfile?.website ?? ""
        : profile.website ?? defaultProfile?.website ?? "";
    return {
      ...profile,
      website,
      agbUrl: profile.agbUrl ?? defaultProfile?.agbUrl ?? "",
      bookingUrl,
      bank,
      footer,
      footerIntro,
      footerContact: profile.footerContact ?? defaultProfile?.footerContact ?? "",
      footerLegal: profile.footerLegal ?? defaultProfile?.footerLegal ?? "",
      footerBank: profile.footerBank ?? defaultProfile?.footerBank ?? "",
      contactRole: profile.contactRole ?? defaultProfile?.contactRole ?? "",
      ownerLine: profile.ownerLine ?? defaultProfile?.ownerLine ?? ""
    };
  });
}

function contractBasisForProfile(profile?: CompanyProfile) {
  const agbPart = profile?.agbUrl ? ` Die AGB sind abrufbar unter: ${profile.agbUrl}.` : "";
  return `Die Leistungserbringung erfolgt auf Grundlage dieses Angebots sowie der Allgemeinen Geschäftsbedingungen von ${profile?.name ?? "dem Auftragnehmer"}.${agbPart} Mit Auftragserteilung erkennt der Auftraggeber diese als Vertragsbestandteil an.`;
}

const oldServiceDirectoryIntro =
  "Die nachfolgende Darstellung weist Mengen, Einheiten, Einzelpreise und Positionssummen transparent aus. Alternativ kann dieselbe interne Kalkulation als Abschnittspauschale angeboten werden, wenn einzelne Preisansätze im Angebot nicht offengelegt werden sollen.";

function sanitizeProject(project: Project, profiles: CompanyProfile[] = companyProfiles): Project {
  const profileDefaults = companyProfiles.find((profile) => profile.id === project.companyId) ?? companyProfiles[0];
  const activeProfile = profiles.find((profile) => profile.id === project.companyId) ?? profileDefaults;
  const oldSoftwarePaymentTerms = "40 % bei Beauftragung, 40 % nach Bereitstellung der Beta-Version, 20 % nach Abnahme.";
  const oldSimplePaymentTerms = "Rechnungen sind innerhalb von 14 Kalendertagen nach Rechnungsstellung ohne Abzug zur Zahlung fällig.";
  const oldOfferClarifications = new Set([
    "KI-Ausgaben werden durch geeignete Prüf-, Logging- und Freigabemechanismen abgesichert; produktive Nutzung erfolgt nach gemeinsam definierten Qualitätskriterien.",
    "Dieses Angebot basiert auf den zum Angebotszeitpunkt bekannten Rahmenbedingungen und ersetzt keine rechtliche oder steuerliche Prüfung.",
    "Dieses Angebot basiert auf den zum Zeitpunkt der Angebotserstellung vorliegenden Informationen und Rahmenbedingungen. Änderungen des Leistungsumfangs, der Projektanforderungen oder sonstiger wesentlicher Rahmenbedingungen können eine Anpassung des Angebots erforderlich machen."
  ]);
  const oldContractBasis = "Die Leistungserbringung erfolgt auf Grundlage dieses Angebots sowie der Allgemeinen Geschäftsbedingungen von Metzger - Real Estate Advisory. Mit Auftragserteilung erkennt der Auftraggeber diese als Vertragsbestandteil an.";
  return {
    ...project,
    projectLocation: project.projectLocation ?? "",
    projectVolume: project.projectVolume ?? "",
    servicePeriod: project.servicePeriod ?? sampleProject.servicePeriod,
    plannedProjectStart: project.plannedProjectStart ?? "",
    projectName: stripCompanyNameFromProjectName(project.projectName ?? sampleProject.projectName, profiles),
    shortDescription: project.shortDescription ?? sampleProject.shortDescription,
    offerIntro: project.offerIntro ?? profileDefaults.offerText,
    assignmentReason: project.assignmentReason ?? defaultAssignmentReason,
    serviceScope: project.serviceScope ?? defaultServiceScope,
    contractorRole: project.contractorRole ?? defaultContractorRole,
    serviceDirectoryIntro: !project.serviceDirectoryIntro || project.serviceDirectoryIntro === oldServiceDirectoryIntro ? defaultServiceDirectoryIntro : project.serviceDirectoryIntro,
    serviceExclusion: project.serviceExclusion ?? defaultServiceExclusion,
    meetingBillingNote: project.meetingBillingNote ?? defaultMeetingBillingNote,
    changeTerms: project.changeTerms ?? defaultChangeTerms,
    contractBasis: !project.contractBasis || project.contractBasis === defaultContractBasis || project.contractBasis === oldContractBasis ? contractBasisForProfile(activeProfile) : project.contractBasis,
    validityText: project.validityText ?? defaultValidityText,
    offerClarification: !project.offerClarification || oldOfferClarifications.has(project.offerClarification) ? defaultOfferBasis : project.offerClarification,
    offerNote: project.offerNote ?? "",
    acceptanceText: project.acceptanceText ?? defaultAcceptanceText,
    offerDate: project.offerDate ?? sampleProject.offerDate,
    paymentTerms: !project.paymentTerms || project.paymentTerms === oldSoftwarePaymentTerms || project.paymentTerms === oldSimplePaymentTerms ? sampleProject.paymentTerms : project.paymentTerms,
    skontoPercent: project.skontoPercent ?? 0,
    skontoDays: project.skontoDays ?? 10
  };
}

function isMetzgerAiDemoMismatch(project: Project) {
  if (project.companyId !== "metzger-real-estate") return false;
  return hasAiDemoText([project.projectName, project.shortDescription, project.objective, project.technicalContext, ...project.modules]);
}

function metzgerAlignedProject(project: Project): Project {
  const cleanProjectName = stripCompanyNameFromProjectName(project.projectName || "Beratungs- und Unterstützungsleistungen", companyProfiles);
  return {
    ...project,
    companyId: "metzger-real-estate",
    client: project.client === sampleProject.client ? "" : project.client,
    contactPerson: project.contactPerson === sampleProject.contactPerson ? "" : project.contactPerson,
    projectName: hasAiDemoText(project.projectName) ? "Beratungs- und Unterstützungsleistungen" : cleanProjectName,
    shortDescription: hasAiDemoText(project.shortDescription)
      ? "Leistungsangebot für strategische Beratung, Projektsteuerung, technische Prüfungen, Qualitätsmanagement, Baurevision, Sachverständigenleistungen sowie abrechenbare Reise- und Auslagenpositionen."
      : project.shortDescription,
    offerIntro:
      "Die Leistungen werden mit besonderem Blick auf belastbare Immobilienprozesse, Entscheidungsqualität und nachhaltige Betriebsfähigkeit strukturiert.",
    offerClarification:
      "Dieses Angebot basiert auf den zum Angebotszeitpunkt bekannten Rahmenbedingungen und ersetzt keine rechtliche oder steuerliche Prüfung.",
    objective: hasAiDemoText(project.objective)
      ? "Ziel ist ein belastbares, fachlich klares und prüffähiges Leistungsbild für immobilienbezogene Beratungs-, Steuerungs- und Unterstützungsleistungen."
      : project.objective,
    technicalContext: hasAiDemoText(project.technicalContext)
      ? "Beratungs- und Projektkontext mit objekt-, bau-, organisations- oder bestandsbezogenen Leistungen. Digitale Werkzeuge können unterstützend eingesetzt werden, stehen aber nicht im Mittelpunkt des Angebots."
      : project.technicalContext,
    modules: hasAiDemoText(project.modules)
      ? ["Strategische Beratung", "Projektsteuerung", "Due Diligence", "Qualitätsmanagement", "Sachverständigenleistungen", "Vergütung und Auslagen"]
      : project.modules,
    offerNumber: project.offerNumber.startsWith("BSAI") ? "MREA-2026-001" : project.offerNumber
  };
}

function normalizeSavedState(parsed: Partial<AppStatePayload> & { savedAt?: string }): AppStatePayload {
  const profiles = normalizeProfiles(parsed.profiles);
  const billing = parsed.orderBilling ?? sampleOrderBilling;
  const sanitizedProject = sanitizeProject(parsed.project ?? sampleProject, profiles);
  const project = sanitizedProject;
  const groups = parsed.groups ?? initialGroups;

  return {
    version: parsed.version ?? 2,
    savedAt: parsed.savedAt ?? new Date().toISOString(),
    project,
    groups: groups.map((group) => ({ ...group, active: group.active ?? true })),
    profiles,
    customers: normalizeCustomers(parsed.customers),
    libraryPositions: parsed.libraryPositions ?? createInitialLibraryPositions(),
    lvTemplates: mergeProfileTemplates(parsed.lvTemplates, profiles),
    orderBilling: {
      ...billing,
      changeOrders: billing.changeOrders.map((item) => ({ ...item, billable: item.billable ?? item.status === "Beauftragt" })),
      workLog: billing.workLog.map((item) => ({ ...item, billable: item.billable ?? true }))
    },
    savedOffers: normalizeSavedOffers(parsed.savedOffers),
    offerNumberSettings: normalizeOfferNumberSettings(parsed.offerNumberSettings, profiles)
  };
}

function readableTextColor(background: string) {
  const hex = background.replace("#", "");
  if (hex.length !== 6) return "#ffffff";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#111827" : "#ffffff";
}

export default function HomePage() {
  const [activeView, setActiveView] = useState<View>("Dashboard");
  const [project, setProject] = useState<Project>(sampleProject);
  const [selectedProfileId, setSelectedProfileId] = useState<Project["companyId"]>(sampleProject.companyId);
  const [groups, setGroups] = useState<PositionGroup[]>(initialGroups);
  const [profiles, setProfiles] = useState<CompanyProfile[]>(companyProfiles);
  const [customers, setCustomers] = useState<Customer[]>(createInitialCustomers);
  const [libraryPositions, setLibraryPositions] = useState<Position[]>(createInitialLibraryPositions);
  const [lvTemplates, setLvTemplates] = useState<LvTemplate[]>(createInitialProfileTemplates);
  const [orderBilling, setOrderBilling] = useState<OrderBilling>(sampleOrderBilling);
  const [savedOffers, setSavedOffers] = useState<SavedOffer[]>([]);
  const [offerNumberSettings, setOfferNumberSettings] = useState<OfferNumberSetting[]>(() => createInitialOfferNumberSettings());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Alle Kategorien");
  const [statusFilter, setStatusFilter] = useState("Alle Status");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [storageMessage, setStorageMessage] = useState("Automatische Sicherung aktiv");
  const [storageReady, setStorageReady] = useState(false);
  const [publicOfferMode, setPublicOfferMode] = useState(false);
  const [publicOfferLoading, setPublicOfferLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sharedToken = readOfferTokenFromLocation();
    if (sharedToken) {
      queueMicrotask(() => {
        setPublicOfferMode(true);
        setPublicOfferLoading(true);
        setStorageMessage("Angebotslink wird geladen");
        setStorageReady(true);
      });
      fetch(`/api/offers?token=${encodeURIComponent(sharedToken)}`)
        .then(async (response) => {
          const result = (await response.json()) as { payload?: Partial<AppStatePayload>; error?: string };
          if (!response.ok || !result.payload) throw new Error(result.error || "Angebot konnte nicht geladen werden.");
          return normalizeSavedState(result.payload);
        })
        .then((normalized) => {
          applyState(normalized);
          setSelectedProfileId(normalized.project.companyId);
          setLastSavedAt(normalized.savedAt);
          setStorageMessage("Angebotslink geladen");
          setActiveView("Angebotsvorschau");
          setPublicOfferLoading(false);
        })
        .catch((error) => {
          const message = error instanceof Error ? error.message : "Angebotslink konnte nicht geladen werden.";
          setStorageMessage(message);
          setPublicOfferLoading(false);
        });
      return;
    }

    const sharedOffer = readOfferSharePayloadFromLocation();
    if (sharedOffer) {
      const normalized = normalizeSavedState({
        version: 2,
        savedAt: sharedOffer.sharedAt,
        project: sharedOffer.project,
        groups: sharedOffer.groups,
        profiles: sharedOffer.profiles
      });
      queueMicrotask(() => {
        setPublicOfferMode(true);
        applyState(normalized);
        setSelectedProfileId(normalized.project.companyId);
        setLastSavedAt(normalized.savedAt);
        setStorageMessage("Angebotslink geladen");
        setActiveView("Angebotsvorschau");
        setStorageReady(true);
      });
      return;
    }

    const saved = window.localStorage.getItem(storageKey);
    if (!saved) {
      queueMicrotask(() => setStorageReady(true));
      return;
    }
    try {
      const parsed = JSON.parse(saved) as Partial<AppStatePayload>;
      const normalized = normalizeSavedState(parsed);
      queueMicrotask(() => {
        applyState(normalized);
        setSelectedProfileId(normalized.project.companyId);
        setLastSavedAt(normalized.savedAt);
        setStorageMessage("Gesicherter Stand geladen");
        setStorageReady(true);
      });
    } catch {
      window.localStorage.removeItem(storageKey);
      queueMicrotask(() => {
        setStorageMessage("Lokale Sicherung war fehlerhaft und wurde verworfen");
        setStorageReady(true);
      });
    }
  }, []);

  useEffect(() => {
    if (!storageReady || publicOfferMode) return;
    const savedAt = new Date().toISOString();
    const payload: AppStatePayload = {
      version: 2,
      savedAt,
      project,
      groups,
      profiles,
      customers,
      libraryPositions,
      lvTemplates,
      orderBilling,
      savedOffers,
      offerNumberSettings
    };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
    queueMicrotask(() => {
      setLastSavedAt(savedAt);
      setStorageMessage("Automatisch gespeichert");
    });
  }, [project, groups, profiles, customers, libraryPositions, lvTemplates, orderBilling, savedOffers, offerNumberSettings, publicOfferMode, storageReady]);

  useEffect(() => {
    if (!storageReady || publicOfferMode) return;
    const savedAt = new Date().toISOString();
    queueMicrotask(() => {
      setSavedOffers((current) => upsertSavedOfferSnapshot(current, project, groups, orderBilling, savedAt));
    });
  }, [groups, orderBilling, project, publicOfferMode, storageReady]);

  const company = profiles.find((profile) => profile.id === project.companyId) ?? profiles[0];
  const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId) ?? company;
  const workspaceTitle = activeView === "Dashboard" ? "Projektzentrale" : viewLabels[activeView];
  const workspaceContext =
    activeView === "Firmenprofile"
      ? `Bearbeitet: ${selectedProfile.name} · Angebot aktiv: ${company.name}`
      : activeView === "Dashboard"
        ? project.projectName
        : project.projectName;
  const summary = calculateSummary(groups, project);
  const visibleGroups = activeGroups(groups);
  const activePositions = visibleGroups.flatMap((group) => group.positions.filter((position) => position.active));
  const optionalPositions = activePositions.filter((position) => !position.required);
  const categories = ["Alle Kategorien", ...Array.from(new Set(groups.flatMap((group) => group.positions.map((position) => position.category))))];
  const statuses = ["Alle Status", ...Array.from(new Set(groups.flatMap((group) => group.positions.map((position) => position.status))))];

  const filteredGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return groups
      .map((group) => ({
        ...group,
        positions: group.positions.filter((position) => {
          const matchesQuery =
            !normalizedQuery ||
            [position.number, position.title, position.description, position.category, position.note]
              .join(" ")
              .toLowerCase()
              .includes(normalizedQuery);
          const matchesCategory = categoryFilter === "Alle Kategorien" || position.category === categoryFilter;
          const matchesStatus = statusFilter === "Alle Status" || position.status === statusFilter;
          return matchesQuery && matchesCategory && matchesStatus;
        })
      }))
      .filter((group) => group.positions.length > 0);
  }, [categoryFilter, groups, query, statusFilter]);

  function updateProject<K extends keyof Project>(key: K, value: Project[K]) {
    setProject((current) => ({ ...current, [key]: value }));
  }

  function createStatePayload(savedAt = new Date().toISOString()): AppStatePayload {
    return {
      version: 2,
      savedAt,
      project,
      groups,
      profiles,
      customers,
      libraryPositions,
      lvTemplates,
      orderBilling,
      savedOffers,
      offerNumberSettings
    };
  }

  function saveCurrentOffer() {
    const savedAt = new Date().toISOString();
    setSavedOffers((current) => {
      const next = upsertSavedOfferSnapshot(current, project, groups, orderBilling, savedAt, true);
      window.localStorage.setItem(storageKey, JSON.stringify({ ...createStatePayload(savedAt), savedOffers: next }));
      return next;
    });
    setLastSavedAt(savedAt);
    setStorageMessage("Angebot in Angebotsliste gespeichert");
  }

  function markOfferAsSent(link: string) {
    const sentAt = new Date().toISOString();
    const sentProject: Project = {
      ...project,
      status: "Versendet",
      customerLink: link,
      sentAt
    };
    setProject(sentProject);
    setSavedOffers((current) => {
      const next = upsertSavedOfferSnapshot(current, sentProject, groups, orderBilling, sentAt, true);
      window.localStorage.setItem(storageKey, JSON.stringify({ ...createStatePayload(sentAt), project: sentProject, savedOffers: next }));
      return next;
    });
    setLastSavedAt(sentAt);
    setStorageMessage("Angebot als versendet gespeichert");
  }

  function openSavedOffer(offerId: string) {
    const offer = savedOffers.find((item) => item.id === offerId);
    if (!offer) return;
    setProject(offer.project);
    setSelectedProfileId(offer.project.companyId);
    setGroups(cloneGroups(offer.groups));
    setOrderBilling(offer.orderBilling);
    setStorageMessage(`Angebot geöffnet: ${offer.project.offerNumber}`);
    setActiveView("Dashboard");
  }

  function deleteSavedOffer(offerId: string) {
    const offer = savedOffers.find((item) => item.id === offerId);
    if (!offer) return;
    if (!window.confirm(`Angebot "${offer.project.offerNumber}" aus der Angebotsliste löschen?`)) return;
    setSavedOffers((current) => current.filter((item) => item.id !== offerId));
    setStorageMessage(`Angebot gelöscht: ${offer.project.offerNumber}`);
  }

  function updateOfferNumberSetting(companyId: Project["companyId"], changes: Partial<OfferNumberSetting>) {
    setOfferNumberSettings((current) =>
      normalizeOfferNumberSettings(current, profiles).map((setting) => (setting.companyId === companyId ? { ...setting, ...changes } : setting))
    );
  }

  function createNewOffer(companyId: Project["companyId"]) {
    saveCurrentOffer();
    const now = new Date().toISOString();
    const offerNumber = nextOfferNumber(offerNumberSettings, companyId, savedOffers);
    const template =
      lvTemplates.find((item) => item.companyId === companyId && item.id === `template-${companyId}-standard`) ??
      lvTemplates.find((item) => item.companyId === companyId);
    const newProjectBase: Project = {
      ...sampleProject,
      id: `offer-${Date.now()}`,
      companyId,
      client: "",
      contactPerson: "",
      projectName: "",
      projectLocation: "",
      projectVolume: "",
      plannedProjectStart: "",
      offerNumber,
      offerDate: new Date().toISOString().slice(0, 10),
      status: "Entwurf"
    };
    const newProject = template ? applyTemplateTextToProject(newProjectBase, template) : newProjectBase;
    const newGroups = template ? cloneGroups(template.groups) : [];
    setProject(newProject);
    setSelectedProfileId(companyId);
    setGroups(newGroups);
    setOrderBilling({ ...sampleOrderBilling, orderNumber: "" });
    setOfferNumberSettings((current) => bumpOfferNumberSetting(normalizeOfferNumberSettings(current, profiles), companyId));
    setSavedOffers((current) => upsertSavedOfferSnapshot(current, newProject, newGroups, { ...sampleOrderBilling, orderNumber: "" }, now));
    setStorageMessage(`Neues Angebot angelegt: ${offerNumber}`);
    setActiveView("Neues Angebot");
  }

  function applyState(state: AppStatePayload) {
    setProject(state.project);
    setSelectedProfileId(state.project.companyId);
    setGroups(state.groups);
    setProfiles(state.profiles);
    setCustomers(state.customers);
    setLibraryPositions(state.libraryPositions);
    setLvTemplates(state.lvTemplates);
    setOrderBilling(state.orderBilling);
    setSavedOffers(state.savedOffers);
    setOfferNumberSettings(state.offerNumberSettings);
  }

  function exportJson() {
    const savedAt = new Date().toISOString();
    const json = JSON.stringify(createStatePayload(savedAt), null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = createAppStateFileName(project, profiles);
    link.click();
    URL.revokeObjectURL(url);
    setLastSavedAt(savedAt);
    setStorageMessage("JSON-Datei gespeichert");
  }

  function handleJsonFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Partial<AppStatePayload>;
        const normalized = normalizeSavedState(parsed);
        applyState(normalized);
        window.localStorage.setItem(storageKey, JSON.stringify(normalized));
        setLastSavedAt(normalized.savedAt);
        setStorageMessage(`JSON geladen: ${file.name}`);
        setActiveView("Dashboard");
      } catch {
        setStorageMessage("JSON-Datei konnte nicht geladen werden");
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  function selectCompany(companyId: Project["companyId"]) {
    setSelectedProfileId(companyId);
    updateProject("companyId", companyId);
  }

  function updateCompanyProfile(profileId: Project["companyId"], changes: Partial<CompanyProfile>) {
    setProfiles((current) => current.map((profile) => (profile.id === profileId ? { ...profile, ...changes } : profile)));
  }

  function updateCompanyProfileColors(profileId: Project["companyId"], changes: Partial<CompanyProfile["colors"]>) {
    setProfiles((current) =>
      current.map((profile) => (profile.id === profileId ? { ...profile, colors: { ...profile.colors, ...changes } } : profile))
    );
  }

  function updateCustomer(customerId: string, changes: Partial<Customer>) {
    setCustomers((current) => current.map((customer) => (customer.id === customerId ? { ...customer, ...changes } : customer)));
  }

  function addCustomer() {
    const id = `customer-${Date.now()}`;
    setCustomers((current) => [
      ...current,
      {
        id,
        companyName: "Neuer Kunde",
        contactPerson: "",
        address: "",
        email: "",
        phone: "",
        mobile: "",
        website: "",
        customerNumber: `KD-${new Date().getFullYear()}-${String(current.length + 1).padStart(3, "0")}`,
        industry: "",
        notes: ""
      }
    ]);
  }

  function deleteCustomer(customerId: string) {
    const customer = customers.find((item) => item.id === customerId);
    if (!customer) return;
    if (!window.confirm(`Kunde "${customer.companyName}" löschen?`)) return;
    setCustomers((current) => current.filter((item) => item.id !== customerId));
  }

  function applyCustomerToProject(customerId: string) {
    const customer = customers.find((item) => item.id === customerId);
    if (!customer) return;
    setProject((current) => ({
      ...current,
      client: customer.companyName,
      contactPerson: customer.contactPerson
    }));
  }

  function updatePosition(groupId: string, positionId: string, changes: Partial<Position>) {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              positions: group.positions.map((position) => (position.id === positionId ? { ...position, ...changes } : position))
            }
          : group
      )
    );
  }

  function updateGroup(groupId: string, changes: Partial<PositionGroup>) {
    setGroups((current) => current.map((group) => (group.id === groupId ? { ...group, ...changes } : group)));
  }

  function deleteGroup(groupId: string) {
    const group = groups.find((item) => item.id === groupId);
    if (!group) return;
    if (!window.confirm(`Titel "${group.title}" mit allen Positionen löschen?`)) return;
    setGroups((current) => renumberGroups(current.filter((item) => item.id !== groupId)));
  }

  function upsertIntoMasterLv(updater: (groups: PositionGroup[]) => PositionGroup[]) {
    const now = new Date().toISOString();
    const defaultTemplates = createInitialProfileTemplates(profiles);
    const fallbackTemplate =
      lvTemplates.find((template) => template.companyId === project.companyId && template.id === `template-${project.companyId}-standard`) ??
      defaultTemplates.find((template) => template.companyId === project.companyId);
    if (!fallbackTemplate) return;

    setLvTemplates((current) => {
      const exists = current.some((template) => template.id === fallbackTemplate.id);
      const baseTemplate = current.find((template) => template.id === fallbackTemplate.id) ?? fallbackTemplate;
      const nextTemplate: LvTemplate = {
        ...baseTemplate,
        groups: renumberGroups(updater(cloneGroups(baseTemplate.groups))),
        updatedAt: now
      };
      return exists
        ? current.map((template) => (template.id === fallbackTemplate.id ? nextTemplate : template))
        : [nextTemplate, ...current];
    });
  }

  function copyOfferGroupToMaster(groupId: string) {
    const sourceGroup = groups.find((group) => group.id === groupId);
    if (!sourceGroup) return;
    upsertIntoMasterLv((masterGroups) => {
      const timestamp = Date.now();
      const masterGroupId = `master-group-${timestamp}`;
      const groupCopy: PositionGroup = {
        ...sourceGroup,
        id: masterGroupId,
        active: true,
        positions: sourceGroup.positions.map((position, index) => ({
          ...position,
          id: `master-position-${timestamp}-${index + 1}`,
          groupId: masterGroupId,
          active: true,
          number: "0.0"
        }))
      };
      return [...masterGroups, groupCopy];
    });
  }

  function copyOfferPositionToMaster(groupId: string, positionId: string) {
    const sourceGroup = groups.find((group) => group.id === groupId);
    const sourcePosition = sourceGroup?.positions.find((position) => position.id === positionId);
    if (!sourceGroup || !sourcePosition) return;
    upsertIntoMasterLv((masterGroups) => {
      const timestamp = Date.now();
      const targetGroup = masterGroups.find((group) => group.title === sourceGroup.title);
      const targetGroupId = targetGroup?.id ?? `master-group-${timestamp}`;
      const positionCopy: Position = {
        ...sourcePosition,
        id: `master-position-${timestamp}`,
        groupId: targetGroupId,
        active: true,
        number: "0.0"
      };
      if (targetGroup) {
        return masterGroups.map((group) => (group.id === targetGroup.id ? { ...group, positions: [...group.positions, positionCopy] } : group));
      }
      return [
        ...masterGroups,
        {
          ...sourceGroup,
          id: positionCopy.groupId,
          active: true,
          positions: [positionCopy]
        }
      ];
    });
  }

  function updateOrderBilling<K extends keyof OrderBilling>(key: K, value: OrderBilling[K]) {
    setOrderBilling((current) => ({ ...current, [key]: value }));
  }

  function updateInvoicePlanItem(itemId: string, changes: Partial<InvoicePlanItem>) {
    setOrderBilling((current) => ({
      ...current,
      invoicePlan: current.invoicePlan.map((item) => (item.id === itemId ? { ...item, ...changes } : item))
    }));
  }

  function updateChangeOrder(itemId: string, changes: Partial<ChangeOrder>) {
    setOrderBilling((current) => ({
      ...current,
      changeOrders: current.changeOrders.map((item) => (item.id === itemId ? { ...item, ...changes } : item))
    }));
  }

  function duplicateChangeOrder(itemId: string) {
    setOrderBilling((current) => {
      const source = current.changeOrders.find((item) => item.id === itemId);
      if (!source) return current;
      const index = current.changeOrders.findIndex((item) => item.id === itemId);
      const copy = { ...source, id: `co-${Date.now()}`, title: `${source.title} Kopie`, status: "Vorgeschlagen" as const, billable: false };
      const changeOrders = [...current.changeOrders];
      changeOrders.splice(index + 1, 0, copy);
      return { ...current, changeOrders };
    });
  }

  function deleteChangeOrder(itemId: string) {
    setOrderBilling((current) => ({ ...current, changeOrders: current.changeOrders.filter((item) => item.id !== itemId) }));
  }

  function updateWorkLog(itemId: string, changes: Partial<WorkLogItem>) {
    setOrderBilling((current) => ({
      ...current,
      workLog: current.workLog.map((item) => (item.id === itemId ? { ...item, ...changes } : item))
    }));
  }

  function duplicateWorkLog(itemId: string) {
    setOrderBilling((current) => {
      const source = current.workLog.find((item) => item.id === itemId);
      if (!source) return current;
      const index = current.workLog.findIndex((item) => item.id === itemId);
      const copy = { ...source, id: `wl-${Date.now()}`, positionTitle: `${source.positionTitle} Kopie`, billable: false };
      const workLog = [...current.workLog];
      workLog.splice(index + 1, 0, copy);
      return { ...current, workLog };
    });
  }

  function deleteWorkLog(itemId: string) {
    setOrderBilling((current) => ({ ...current, workLog: current.workLog.filter((item) => item.id !== itemId) }));
  }

  function updateLibraryPosition(positionId: string, changes: Partial<Position>) {
    setLibraryPositions((current) => current.map((position) => (position.id === positionId ? { ...position, ...changes } : position)));
  }

  function addLibraryPosition() {
    setLibraryPositions((current) => [
      ...current,
      {
        id: `lib-${Date.now()}`,
        groupId: groups[0]?.id ?? "analysis",
        number: "",
        title: "Neue Bibliotheksposition",
        description: "Wiederverwendbare Leistungsbeschreibung mit klarem Ergebnisbezug und anpassbarer Kalkulation.",
        unit: "Std.",
        quantity: 4,
        rateKey: "development",
        unitPrice: project.rates.development,
        category: "Bibliothek",
        required: false,
        note: "",
        status: "Offen",
        active: true
      }
    ]);
  }

  function addLibraryPositionToGroup(position: Position, targetGroupId: string) {
    const copy: Position = {
      ...position,
      id: `p-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      groupId: targetGroupId,
      number: "0.0",
      active: true
    };
    setGroups((current) => renumberGroups(current.map((group) => (group.id === targetGroupId ? { ...group, positions: [...group.positions, copy] } : group))));
    setActiveView("LV bearbeiten");
  }

  function replaceGroupsFromAi(generatedGroups: PositionGroup[]) {
    setGroups(
      renumberGroups(
        generatedGroups.map((group, groupIndex) => ({
          ...group,
          id: group.id || `ai-group-${groupIndex + 1}`,
          active: group.active ?? true,
          positions: group.positions.map((position, positionIndex) => ({
            ...position,
            id: position.id || `ai-position-${groupIndex + 1}-${positionIndex + 1}`,
            groupId: group.id || `ai-group-${groupIndex + 1}`,
            active: position.active ?? true
          }))
        }))
      )
    );
    setActiveView("LV bearbeiten");
  }

  function deletePosition(groupId: string, positionId: string) {
    setGroups((current) =>
      renumberGroups(
        current.map((group) =>
          group.id === groupId ? { ...group, positions: group.positions.filter((position) => position.id !== positionId) } : group
        )
      )
    );
  }

  function duplicatePosition(groupId: string, positionId: string) {
    setGroups((current) =>
      renumberGroups(
        current.map((group) => {
          if (group.id !== groupId) return group;
          const position = group.positions.find((item) => item.id === positionId);
          if (!position) return group;
          const index = group.positions.findIndex((item) => item.id === positionId);
          const copy = { ...position, id: `p-${Date.now()}`, title: `${position.title} Kopie`, status: "Offen" as const };
          const positions = [...group.positions];
          positions.splice(index + 1, 0, copy);
          return { ...group, positions };
        })
      )
    );
  }

  function addPosition(groupId: string) {
    const targetGroup = groups.find((group) => group.id === groupId);
    if (!targetGroup) return;
    const newPosition: Position = {
      id: `p-${Date.now()}`,
      groupId,
      number: "0.0",
      title: "Neue Leistungsposition",
      description: "Individuell zu formulierende Leistungsbeschreibung mit klarem Ergebnisbezug und nachvollziehbarem Leistungsumfang.",
      unit: "Std.",
      quantity: 4,
      rateKey: "development",
      unitPrice: project.rates.development,
      category: "Individuell",
      required: false,
      note: "",
      status: "Offen",
      active: true
    };
    setGroups((current) =>
      renumberGroups(current.map((group) => (group.id === groupId ? { ...group, positions: [...group.positions, newPosition] } : group)))
    );
  }

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const sourceGroupId = result.source.droppableId;
    const destinationGroupId = result.destination.droppableId;

    setGroups((current) => {
      const draft = current.map((group) => ({ ...group, positions: [...group.positions] }));
      const sourceGroup = draft.find((group) => group.id === sourceGroupId);
      const destinationGroup = draft.find((group) => group.id === destinationGroupId);
      if (!sourceGroup || !destinationGroup) return current;

      const [moved] = sourceGroup.positions.splice(result.source.index, 1);
      destinationGroup.positions.splice(result.destination!.index, 0, { ...moved, groupId: destinationGroupId });
      return renumberGroups(draft);
    });
  }

  function saveAsTemplate(targetCompanyId: Project["companyId"] = project.companyId) {
    const now = new Date().toISOString();
    const companyName = profiles.find((profile) => profile.id === targetCompanyId)?.name ?? "Firmenprofil";
    const template: LvTemplate = {
      id: `template-${Date.now()}`,
      companyId: targetCompanyId,
      name: `${project.projectName || companyName} Angebotsvorlage`,
      description: `Gespeicherte Angebotsvorlage für ${companyName} mit Textbausteinen, Klarstellungen und Leistungsverzeichnis.`,
      createdAt: now,
      updatedAt: now,
      textFields: offerTemplateTextFromProject(project),
      groups: cloneGroups(groups)
    };
    setLvTemplates((current) => [template, ...current]);
    setLastSavedAt(now);
    setStorageMessage(`Angebotsvorlage gespeichert: ${template.name}`);
    setActiveView("Angebotsvorlagen");
  }

  function overwriteLvTemplate(templateId: string) {
    const template = lvTemplates.find((item) => item.id === templateId);
    if (!template) return;
    if (!window.confirm(`Angebotsvorlage "${template.name}" mit aktuellen Texten und aktuellem LV überschreiben?`)) return;
    const now = new Date().toISOString();
    setLvTemplates((current) =>
      current.map((item) =>
        item.id === templateId
          ? {
              ...item,
              companyId: project.companyId,
              textFields: offerTemplateTextFromProject(project),
              groups: cloneGroups(groups),
              updatedAt: now
            }
          : item
      )
    );
    setLastSavedAt(now);
    setStorageMessage(`Angebotsvorlage aktualisiert: ${template.name}`);
  }

  function updateLvTemplate(templateId: string, changes: Partial<Pick<LvTemplate, "name" | "description" | "companyId" | "textFields">>) {
    setLvTemplates((current) =>
      current.map((template) => (template.id === templateId ? { ...template, ...changes, updatedAt: new Date().toISOString() } : template))
    );
  }

  function applyLvTemplate(templateId: string) {
    const template = lvTemplates.find((item) => item.id === templateId);
    if (!template) return;
    setProject((current) => applyTemplateTextToProject({ ...current, companyId: template.companyId }, template));
    setGroups(cloneGroups(template.groups));
    setActiveView("LV bearbeiten");
  }

  function findMasterTemplate(companyId = project.companyId) {
    return (
      lvTemplates.find((template) => template.companyId === companyId && template.id === `template-${companyId}-standard`) ??
      lvTemplates.find((template) => template.companyId === companyId)
    );
  }

  function startEmptyLv() {
    setGroups([]);
    setActiveView("LV bearbeiten");
  }

  function applyMasterLv() {
    const masterTemplate = findMasterTemplate();
    if (!masterTemplate) return;
    if (!window.confirm("Aktuelles Angebot durch die Angebotsvorlage ersetzen? Textbausteine, Titel und Positionen werden übernommen.")) return;
    setProject((current) => applyTemplateTextToProject(current, masterTemplate));
    setGroups(cloneGroups(masterTemplate.groups));
    setActiveView("LV bearbeiten");
  }

  function repairCompanyLvAlignment() {
    if (!window.confirm("Projektdaten bewusst auf das aktive Firmenprofil bereinigen? Das aktuelle LV wird nicht ersetzt.")) return;
    if (project.companyId !== "metzger-real-estate") {
      setActiveView("Neues LV");
      return;
    }

    setProject((current) => metzgerAlignedProject(current));
    setActiveView("Qualitätsmanagement");
  }

  function copyMasterGroupToOffer(masterGroup: PositionGroup) {
    const timestamp = Date.now();
    const groupId = `group-${timestamp}-${masterGroup.id}`;
    const groupCopy: PositionGroup = {
      ...masterGroup,
      id: groupId,
      active: true,
      positions: masterGroup.positions.map((position, index) => ({
        ...position,
        id: `p-${timestamp}-${index + 1}`,
        groupId,
        number: "0.0",
        active: true
      }))
    };
    setGroups((current) => renumberGroups([...current, groupCopy]));
  }

  function copyMasterPositionToOffer(masterGroup: PositionGroup, masterPosition: Position) {
    const targetGroup = groups.find((group) => group.title === masterGroup.title);
    const timestamp = Date.now();

    if (targetGroup) {
      const positionCopy: Position = {
        ...masterPosition,
        id: `p-${timestamp}`,
        groupId: targetGroup.id,
        number: "0.0",
        active: true
      };
      setGroups((current) => renumberGroups(current.map((group) => (group.id === targetGroup.id ? { ...group, positions: [...group.positions, positionCopy] } : group))));
      return;
    }

    const groupId = `group-${timestamp}-${masterGroup.id}`;
    const groupCopy: PositionGroup = {
      ...masterGroup,
      id: groupId,
      active: true,
      positions: [
        {
          ...masterPosition,
          id: `p-${timestamp}`,
          groupId,
          number: "0.0",
          active: true
        }
      ]
    };
    setGroups((current) => renumberGroups([...current, groupCopy]));
  }

  function duplicateLvTemplate(templateId: string, targetCompanyId?: Project["companyId"]) {
    const template = lvTemplates.find((item) => item.id === templateId);
    if (!template) return;
    const now = new Date().toISOString();
    const targetCompany = targetCompanyId ? profiles.find((profile) => profile.id === targetCompanyId) : null;
    setLvTemplates((current) => [
      {
        ...template,
        id: `template-${Date.now()}`,
        companyId: targetCompanyId ?? template.companyId,
        name: targetCompany ? `${template.name} Kopie für ${targetCompany.name}` : `${template.name} Kopie`,
        createdAt: now,
        updatedAt: now,
        textFields: { ...(template.textFields ?? {}) },
        groups: cloneGroups(template.groups)
      },
      ...current
    ]);
  }

  function deleteLvTemplate(templateId: string) {
    const template = lvTemplates.find((item) => item.id === templateId);
    if (!template) return;
    if (!window.confirm(`Angebotsvorlage "${template.name}" löschen?`)) return;
    setLvTemplates((current) => current.filter((item) => item.id !== templateId));
  }

  function exportCsv() {
    const rows = [
      ["Positionsnummer", "Titel", "Beschreibung", "Einheit", "Menge", "Einheitspreis", "Gesamtpreis", "Leistungsbereich", "Status"],
      ...activeGroups(groups).flatMap((group) =>
        group.positions
          .filter((position) => position.active)
          .map((position) => [
            positionNumber(groups, group.id, position.id),
            position.title,
            position.description,
            position.unit,
            String(position.quantity),
            String(position.unitPrice),
            String(positionTotal(position)),
            position.category,
            position.status
          ])
      )
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.offerNumber}-leistungsverzeichnis.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function printOfferArea() {
    printElement(".print-area", `${project.offerNumber} ${project.projectName}`.trim());
  }

  function duplicateOffer() {
    setProject((current) => ({
      ...current,
      id: `offer-${Date.now()}`,
      offerNumber: `${current.offerNumber}-KOPIE`,
      status: "Entwurf"
    }));
  }

  if (publicOfferMode) {
    return (
      <main className="min-h-screen bg-canvas px-4 py-6 md:px-8">
        <div className="mx-auto max-w-6xl">
          {publicOfferLoading ? (
            <div className="rounded-lg border border-line bg-white p-8 text-center shadow-sm">
              <p className="text-lg font-semibold text-ink">Angebot wird geladen</p>
              <p className="mt-2 text-sm text-muted">{storageMessage}</p>
            </div>
          ) : storageMessage.includes("konnte nicht") ? (
            <div className="rounded-lg border border-rose-100 bg-rose-50 p-8 text-center shadow-sm">
              <p className="text-lg font-semibold text-rose-900">Angebot konnte nicht geöffnet werden</p>
              <p className="mt-2 text-sm text-rose-800">{storageMessage}</p>
            </div>
          ) : (
            <OfferPreview project={project} groups={groups} profiles={profiles} publicView />
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-canvas">
      <aside className={`no-print fixed inset-y-0 left-0 z-30 hidden border-r border-line bg-white px-4 py-5 transition-all lg:block ${sidebarCollapsed ? "w-20" : "w-72"}`}>
        <div className={`flex items-center gap-3 px-2 ${sidebarCollapsed ? "justify-center" : ""}`}>
          <div className="h-14 w-14 shrink-0">
            <div
              role="img"
              aria-label="SMART OfferFlow"
              className="h-full w-full bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: "url('/smart-offerflow-logo.png')" }}
            />
          </div>
          <div className={sidebarCollapsed ? "hidden" : ""}>
            <p className="text-lg font-semibold leading-tight text-ink">SMART OfferFlow</p>
            <p className="text-[11px] leading-4 text-muted">Vom Angebot bis zur Abrechnung. KI-gestützt, strukturiert, prüffähig.</p>
          </div>
        </div>
        <div className={`mt-5 flex ${sidebarCollapsed ? "justify-center" : "justify-start"}`}>
          <button
            type="button"
            aria-label={sidebarCollapsed ? "Sidebar ausklappen" : "Sidebar einklappen"}
            title={sidebarCollapsed ? "Sidebar ausklappen" : "Sidebar einklappen"}
            onClick={() => setSidebarCollapsed((current) => !current)}
            className="flex h-10 w-10 items-center justify-center rounded-md text-muted transition hover:bg-slate-50 hover:text-ink"
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
        <nav className="mt-8 grid gap-1">
          {navItems.map((item, index) => {
            const previousGroup = navItems[index - 1]?.group;
            const groupLabel = item.group ? navGroupLabels[item.group] : null;
            const showGroup = groupLabel && item.group !== previousGroup && !sidebarCollapsed;
            return (
              <div key={item.label} className="grid gap-1">
                {showGroup ? <p className="mt-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{groupLabel}</p> : null}
                <button
                  type="button"
                  title={viewLabels[item.label]}
                  onClick={() => setActiveView(item.label)}
                  className={`flex h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition ${sidebarCollapsed ? "justify-center" : ""} ${
                    activeView === item.label ? "bg-slate-100 text-ink" : "text-muted hover:bg-slate-50 hover:text-ink"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span className={sidebarCollapsed ? "hidden" : ""}>{viewLabels[item.label]}</span>
                </button>
              </div>
            );
          })}
        </nav>
        <div className={`mt-6 border-t border-line pt-4 ${sidebarCollapsed ? "grid justify-center gap-2" : "grid gap-3"}`}>
          <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleJsonFile} className="hidden" />
          <IconButton icon={Save} label="Stand als JSON speichern" onClick={exportJson} />
          <IconButton icon={Upload} label="Stand aus JSON laden" onClick={() => fileInputRef.current?.click()} />
          {!sidebarCollapsed ? (
            <div className="rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-muted">
              <p className="font-semibold text-ink">{storageMessage}</p>
              <p>{lastSavedAt ? new Date(lastSavedAt).toLocaleString("de-DE") : "Noch keine Sicherung"}</p>
            </div>
          ) : null}
        </div>
      </aside>

      <section className={`transition-all ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-72"}`}>
        <header className="no-print sticky top-0 z-20 border-b border-line bg-white/90 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted">{company.name}</p>
              <h1 className="truncate text-2xl font-semibold tracking-normal text-ink">{workspaceTitle}</h1>
              <p className="mt-1 truncate text-sm text-muted">{workspaceContext}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveView("Firmenprofile")}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink transition hover:border-slate-300"
                title="Aktives Firmenprofil bearbeiten"
              >
                <Building2 className="h-4 w-4 text-muted" />
                {company.name}
              </button>
              <IconButton icon={Save} label="Aktuelles Angebot als Angebotsvorlage speichern" onClick={saveAsTemplate} />
              <IconButton icon={Copy} label="Angebot duplizieren" onClick={duplicateOffer} />
              <IconButton icon={Download} label="CSV exportieren" onClick={exportCsv} />
              <IconButton icon={Braces} label="JSON exportieren" onClick={exportJson} />
              <IconButton icon={Printer} label="PDF/DOCX über Druckdialog vorbereiten" onClick={printOfferArea} />
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 text-sm font-semibold text-blue-800 transition hover:border-blue-200 hover:bg-blue-100"
              >
                <HelpCircle className="h-4 w-4" />
                Hilfe
              </button>
            </div>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setActiveView(item.label)}
                className={`h-9 shrink-0 rounded-md border px-3 text-sm ${
                  activeView === item.label ? "border-blue-200 bg-blue-50 text-blue-700" : "border-line bg-white text-muted"
                }`}
              >
                {viewLabels[item.label]}
              </button>
            ))}
          </div>
        </header>

        <div className="px-4 py-6 md:px-8">
          <ProcessGuide activeView={activeView} setActiveView={setActiveView} />

          {activeView === "Dashboard" ? (
            <Dashboard
              project={project}
              orderBilling={orderBilling}
              summary={summary}
              activePositions={activePositions.length}
              optionalPositions={optionalPositions.length}
              groups={groups}
              company={company}
              repairCompanyLvAlignment={repairCompanyLvAlignment}
              setActiveView={setActiveView}
            />
          ) : null}

          {activeView === "Projekte" ? (
            <OfferDatabase
              project={project}
              savedOffers={savedOffers}
              profiles={profiles}
              numberSettings={offerNumberSettings}
              createNewOffer={createNewOffer}
              openSavedOffer={openSavedOffer}
              deleteSavedOffer={deleteSavedOffer}
              updateNumberSetting={updateOfferNumberSetting}
            />
          ) : null}

          {activeView === "Neues Angebot" ? (
            <ProjectWorkspace
              project={project}
              customers={customers}
              profiles={profiles}
              createNewOffer={createNewOffer}
              updateProject={updateProject}
              applyCustomerToProject={applyCustomerToProject}
              setActiveView={setActiveView}
            />
          ) : null}

          {activeView === "Neues LV" ? (
            <NewLvWorkspace
              project={project}
              groups={groups}
              profiles={profiles}
              templates={lvTemplates}
              selectCompany={selectCompany}
              startEmptyLv={startEmptyLv}
              applyTemplate={applyLvTemplate}
              copyMasterGroupToOffer={copyMasterGroupToOffer}
              copyMasterPositionToOffer={copyMasterPositionToOffer}
              setActiveView={setActiveView}
            />
          ) : null}

          {activeView === "LV bearbeiten" ? (
            <LvEditor
              groups={filteredGroups}
              allGroups={groups}
              query={query}
              setQuery={setQuery}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              categories={categories}
              statuses={statuses}
              updatePosition={updatePosition}
              updateGroup={updateGroup}
              deleteGroup={deleteGroup}
              deletePosition={deletePosition}
              duplicatePosition={duplicatePosition}
              addPosition={addPosition}
              copyOfferGroupToMaster={copyOfferGroupToMaster}
              copyOfferPositionToMaster={copyOfferPositionToMaster}
              onDragEnd={onDragEnd}
            />
          ) : null}

          {activeView === "Angebotsvorschau" ? (
            <OfferPreview project={project} groups={groups} profiles={profiles} onSaveOffer={saveCurrentOffer} onExportJson={exportJson} onOfferSent={markOfferAsSent} />
          ) : null}

          {activeView === "Auftrag & Abrechnung" ? (
            <OrderBillingWorkspace
              project={project}
              groups={groups}
              orderBilling={orderBilling}
              updateOrderBilling={updateOrderBilling}
              updateInvoicePlanItem={updateInvoicePlanItem}
              updateChangeOrder={updateChangeOrder}
              duplicateChangeOrder={duplicateChangeOrder}
              deleteChangeOrder={deleteChangeOrder}
              updateWorkLog={updateWorkLog}
              duplicateWorkLog={duplicateWorkLog}
              deleteWorkLog={deleteWorkLog}
            />
          ) : null}

          {activeView === "KI-Assistenz" ? <AiAssistant project={project} groups={groups} updatePosition={updatePosition} replaceGroupsFromAi={replaceGroupsFromAi} setActiveView={setActiveView} /> : null}

          {activeView === "Kunden" ? <Customers customers={customers} updateCustomer={updateCustomer} addCustomer={addCustomer} deleteCustomer={deleteCustomer} applyCustomerToProject={applyCustomerToProject} /> : null}

          {activeView === "Firmenprofile" ? (
            <CompanyProfiles
              selectedCompanyId={selectedProfileId}
              activeProjectCompanyId={project.companyId}
              templates={lvTemplates}
              profiles={profiles}
              selectProfile={setSelectedProfileId}
              applyProfileToProject={selectCompany}
              updateCompanyProfile={updateCompanyProfile}
              updateCompanyProfileColors={updateCompanyProfileColors}
              setActiveView={setActiveView}
            />
          ) : null}

          {activeView === "Qualitätsmanagement" ? (
            <QualityManagement
              project={project}
              groups={groups}
              profiles={profiles}
              customers={customers}
              savedOffers={savedOffers}
              templates={lvTemplates}
              lastSavedAt={lastSavedAt}
              storageMessage={storageMessage}
              repairCompanyLvAlignment={repairCompanyLvAlignment}
              applyMasterLv={applyMasterLv}
              setActiveView={setActiveView}
            />
          ) : null}

          {activeView === "Positionsbibliothek" ? (
            <PositionLibrary
              groups={groups}
              positions={libraryPositions}
              updateLibraryPosition={updateLibraryPosition}
              addLibraryPosition={addLibraryPosition}
              addLibraryPositionToGroup={addLibraryPositionToGroup}
            />
          ) : null}

          {activeView === "Angebotsvorlagen" ? (
            <Templates
              project={project}
              groups={groups}
              templates={lvTemplates}
              profiles={profiles}
              updateTemplate={updateLvTemplate}
              overwriteTemplate={overwriteLvTemplate}
              applyTemplate={applyLvTemplate}
              duplicateTemplate={duplicateLvTemplate}
              deleteTemplate={deleteLvTemplate}
              saveCurrentTemplate={saveAsTemplate}
            />
          ) : null}

          {activeView === "Einstellungen" ? <SettingsPanel project={project} updateProject={updateProject} /> : null}
        </div>
      </section>
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </main>
  );
}

function ProcessGuide({ activeView, setActiveView }: { activeView: View; setActiveView: (view: View) => void }) {
  const activeIndex = processSteps.findIndex((step) => step.view === activeView);

  return (
    <div className="no-print mb-6 rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">Geführter Angebotsprozess</p>
          <p className="mt-1 text-xs text-muted">Von der Erfassung bis zum Versand in fünf Schritten.</p>
        </div>
        <div className="grid gap-2 md:grid-cols-5 xl:min-w-[820px]">
          {processSteps.map((step, index) => {
            const active = step.view === activeView;
            const done = activeIndex > index;
            return (
              <button
                key={step.view}
                type="button"
                onClick={() => setActiveView(step.view)}
                className={`rounded-md border px-3 py-3 text-left transition ${
                  active
                    ? "border-blue-200 bg-blue-50 text-blue-800"
                    : done
                      ? "border-emerald-100 bg-emerald-50 text-emerald-900"
                      : "border-line bg-white text-ink hover:border-slate-300"
                }`}
              >
                <span className="block text-xs font-semibold uppercase tracking-[0.12em]">{step.label}</span>
                <span className={`mt-1 block text-[11px] leading-4 ${active ? "text-blue-700" : done ? "text-emerald-800" : "text-muted"}`}>{step.hint}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function OfferDatabase({
  project,
  savedOffers,
  profiles,
  numberSettings,
  createNewOffer,
  openSavedOffer,
  deleteSavedOffer,
  updateNumberSetting
}: {
  project: Project;
  savedOffers: SavedOffer[];
  profiles: CompanyProfile[];
  numberSettings: OfferNumberSetting[];
  createNewOffer: (companyId: Project["companyId"]) => void;
  openSavedOffer: (offerId: string) => void;
  deleteSavedOffer: (offerId: string) => void;
  updateNumberSetting: (companyId: Project["companyId"], changes: Partial<OfferNumberSetting>) => void;
}) {
  const [newOfferCompanyId, setNewOfferCompanyId] = useState<Project["companyId"]>(project.companyId);
  const sortedOffers = [...savedOffers].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const offersByCompany = profiles.map((profile) => ({
    profile,
    offers: sortedOffers.filter((offer) => offer.project.companyId === profile.id),
    setting: numberSettings.find((setting) => setting.companyId === profile.id) ?? createInitialOfferNumberSettings(profiles).find((setting) => setting.companyId === profile.id)
  }));

  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
        <div className="grid gap-5 xl:grid-cols-[1fr_320px] xl:items-end">
          <div>
            <SectionTitle title="Angebotsdatenbank" kicker="Alle Angebote, Nummernkreise und Versionen" />
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
              Angebote werden lokal im Browser gespeichert und beim JSON-Export mitgesichert. Jede Speicherung erhöht die Version des Angebots; die
              Angebotsnummer kann automatisch erzeugt oder im Angebotskopf manuell überschrieben werden.
            </p>
          </div>
          <div className="grid gap-3">
            <Field label="Neues Angebot für Firmenprofil">
              <Select value={newOfferCompanyId} onChange={(event) => setNewOfferCompanyId(event.target.value as Project["companyId"])}>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </Select>
            </Field>
            <button
              type="button"
              onClick={() => createNewOffer(newOfferCompanyId)}
              className="inline-flex h-10 items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Neues Angebot anlegen
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
        <SectionTitle title="Nummernkreise" kicker="Je Firmenprofil einstellbar" />
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {offersByCompany.map(({ profile, setting }) => (
            <div key={profile.id} className="grid gap-3 rounded-md border border-line p-4 md:grid-cols-[1fr_100px_100px_90px]">
              <div>
                <p className="font-semibold text-ink">{profile.name}</p>
                <p className="mt-1 text-sm text-muted">
                  Nächste Nummer: {nextOfferNumber(numberSettings, profile.id, savedOffers)}
                </p>
              </div>
              <Field label="Präfix">
                <TextInput value={setting?.prefix ?? ""} onChange={(event) => updateNumberSetting(profile.id, { prefix: event.target.value.toUpperCase() })} />
              </Field>
              <Field label="Jahr">
                <TextInput type="number" value={setting?.year ?? new Date().getFullYear()} onChange={(event) => updateNumberSetting(profile.id, { year: Number(event.target.value) })} />
              </Field>
              <Field label="Zähler">
                <TextInput type="number" value={setting?.nextNumber ?? 1} onChange={(event) => updateNumberSetting(profile.id, { nextNumber: Number(event.target.value) })} />
              </Field>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {sortedOffers.length ? (
          sortedOffers.map((offer) => {
            const company = profiles.find((profile) => profile.id === offer.project.companyId);
            const total = calculateSummary(offer.groups, offer.project).net;
            return (
              <article key={offer.id} className="rounded-lg border border-line bg-white p-5 shadow-sm">
                <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">{company?.name ?? "Firmenprofil"}</p>
                    <h3 className="mt-2 text-lg font-semibold text-ink">{offer.project.offerNumber}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted">{offer.project.projectName || "Ohne Projekttitel"} · {offer.project.client || "Kein Empfänger"}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-muted">
                      <span className="rounded-md bg-slate-100 px-2 py-1">Status: {offer.project.status}</span>
                      <span className="rounded-md bg-slate-100 px-2 py-1">Version {offer.version}</span>
                      <span className="rounded-md bg-slate-100 px-2 py-1">Netto {formatCurrency(total)}</span>
                      <span className="rounded-md bg-slate-100 px-2 py-1">Geändert {new Date(offer.updatedAt).toLocaleString("de-DE")}</span>
                      {offer.project.sentAt ? <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">Versendet {new Date(offer.project.sentAt).toLocaleString("de-DE")}</span> : null}
                    </div>
                    {offer.project.customerLink ? (
                      <a className="mt-3 inline-flex text-sm font-semibold text-slate-600 underline underline-offset-2" href={offer.project.customerLink} target="_blank" rel="noreferrer">
                        Kundenlink öffnen
                      </a>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => openSavedOffer(offer.id)} className="h-10 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-slate-700">
                      Bearbeiten
                    </button>
                    <button type="button" onClick={() => deleteSavedOffer(offer.id)} className="h-10 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-slate-300">
                      Löschen
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-lg border border-dashed border-line bg-white p-8 text-center">
            <p className="font-semibold text-ink">Noch keine gespeicherten Angebote</p>
            <p className="mt-2 text-sm text-muted">Lege oben ein neues Angebot an oder speichere den aktuellen Arbeitsstand in der Angebotsvorschau.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Dashboard({
  project,
  orderBilling,
  summary,
  activePositions,
  optionalPositions,
  groups,
  company,
  repairCompanyLvAlignment,
  setActiveView
}: {
  project: Project;
  orderBilling: OrderBilling;
  summary: ReturnType<typeof calculateSummary>;
  activePositions: number;
  optionalPositions: number;
  groups: PositionGroup[];
  company: CompanyProfile;
  repairCompanyLvAlignment: () => void;
  setActiveView: (view: View) => void;
}) {
  const visibleGroups = activeGroups(groups);
  const billableChangeOrders = orderBilling.changeOrders.filter((item) => item.billable).reduce((sum, item) => sum + item.amount, 0);
  const orderTotal = summary.net + billableChangeOrders;
  const billedTotal = orderBilling.invoicePlan.filter((item) => item.status !== "Entwurf").reduce((sum, item) => sum + item.amount, 0);
  const outstandingTotal = Math.max(orderTotal - billedTotal, 0);
  const billedPercent = orderTotal > 0 ? Math.min((billedTotal / orderTotal) * 100, 100) : 0;
  const aiDemoFindings = collectAiDemoFindings(project, groups);
  const hasProfileConflict = project.companyId === "metzger-real-estate" && aiDemoFindings.length > 0;

  return (
    <div className="grid gap-6">
      {hasProfileConflict ? (
        <div className="rounded-lg border border-rose-100 bg-rose-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-semibold text-rose-900">Firmenprofil und Projektdaten passen nicht zusammen</p>
              <p className="mt-2 text-sm leading-6 text-rose-800">
                Das Angebot nutzt {company.name}, enthält aber noch KI-Demo-Projektdaten. Bitte die passende Angebotsvorlage und die Projektdaten bereinigen.
              </p>
              <p className="mt-2 text-sm leading-6 text-rose-800">
                Gefunden in: {aiDemoFindings.map((finding) => `${finding.label} (${finding.terms.join(", ")})`).join("; ")}
              </p>
            </div>
            <button
              type="button"
              onClick={repairCompanyLvAlignment}
              className="inline-flex h-10 items-center justify-center rounded-md bg-rose-700 px-4 text-sm font-semibold text-white transition hover:bg-rose-800"
            >
              Jetzt bereinigen
            </button>
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <SectionTitle title="Projektzentrale" kicker={company.name} />
            <h3 className="mt-3 text-lg font-semibold text-ink">{project.projectName}</h3>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-muted">{project.shortDescription}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["Angebotsdaten", "Neues Angebot"],
              ["LV bearbeiten", "LV bearbeiten"],
              ["Vorschau", "Angebotsvorschau"],
              ["Abrechnung", "Auftrag & Abrechnung"],
              ["QM", "Qualitätsmanagement"]
            ].map(([label, view]) => (
              <button
                key={label}
                type="button"
                onClick={() => setActiveView(view as View)}
                className="inline-flex h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-slate-300"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {[
            ["Status", project.status],
            ["Angebot", project.offerNumber],
            ["Empfänger", project.client || "noch offen"],
            ["Firmenprofil", company.name]
          ].map(([label, value]) => (
            <div key={label} className="flex min-h-20 flex-col items-center justify-center rounded-md border border-line bg-slate-50 px-4 py-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">{label}</p>
              <p className="mt-2 max-w-full truncate font-semibold text-ink">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Angebotswert netto" value={formatCurrency(summary.net)} detail={`${project.vatRate} % Umsatzsteuer vorbereitet`} tone="accent" align="center" />
        <StatCard label="Aktive Positionen" value={String(activePositions)} detail={`${optionalPositions} optionale Positionen enthalten`} align="center" />
        <StatCard label="Aktive Hauptgruppen" value={String(visibleGroups.length)} detail="Nummerierung ohne Lücken" align="center" />
        <StatCard label="Auftrag" value={orderBilling.orderNumber} detail={orderBilling.billingMode} align="center" />
      </div>

      <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle title="Abrechnungsstand" kicker="Auftrag, Rechnung, offener Rest" />
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[560px]">
            <div className="rounded-md border border-line px-4 py-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Auftragssumme</p>
              <p className="mt-2 text-lg font-semibold text-ink">{formatCurrency(orderTotal)}</p>
            </div>
            <div className="rounded-md border border-emerald-100 bg-emerald-50 px-4 py-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700">Abgerechnet</p>
              <p className="mt-2 text-lg font-semibold text-emerald-900">{formatCurrency(billedTotal)}</p>
            </div>
            <div className="rounded-md border border-rose-100 bg-rose-50 px-4 py-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-rose-700">Noch offen</p>
              <p className="mt-2 text-lg font-semibold text-rose-900">{formatCurrency(outstandingTotal)}</p>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <div className="h-5 overflow-hidden rounded-md border border-rose-100 bg-rose-100">
            <div className="h-full bg-emerald-600 transition-all" style={{ width: `${billedPercent}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-2 text-muted">
                <span className="h-3 w-3 rounded-sm bg-emerald-600" />
                abgerechnet
              </span>
              <span className="inline-flex items-center gap-2 text-muted">
                <span className="h-3 w-3 rounded-sm bg-rose-100 ring-1 ring-rose-200" />
                offen
              </span>
            </div>
            <span className="font-semibold text-ink">{Math.round(billedPercent)} % abgerechnet</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
          <SectionTitle title="Projektübersicht" kicker={project.client} />
          <p className="mt-4 max-w-3xl leading-7 text-muted">{project.shortDescription}</p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {project.modules.map((module) => (
              <div key={module} className="flex items-center gap-3 rounded-md border border-line px-4 py-3 text-sm font-medium text-ink">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {module}
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <button type="button" onClick={() => setActiveView("LV bearbeiten")} className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white">
              LV bearbeiten
            </button>
            <button type="button" onClick={() => setActiveView("Angebotsvorschau")} className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink">
              Vorschau öffnen
            </button>
            <button type="button" onClick={() => setActiveView("KI-Assistenz")} className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink">
              KI-Assistenz öffnen
            </button>
          </div>
        </div>
        <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
          <SectionTitle title="Kalkulationsübersicht" />
          <div className="mt-5 divide-y divide-line">
            {visibleGroups.map((group) => (
              <div key={group.id} className="flex items-center justify-between py-3 text-sm">
                <span className="text-muted">
                  {groupNumber(groups, group.id)} {group.title}
                </span>
                <span className="font-semibold text-ink">{formatCurrency(groupTotal(group))}</span>
              </div>
            ))}
            <div className="flex items-center justify-between py-4 text-base">
              <span className="font-semibold text-ink">Gesamtsumme netto</span>
              <span className="font-semibold text-ink">{formatCurrency(summary.net)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
        <SectionTitle title="KI-Unterstützung im LV" kicker="Leistungsbausteine" />
        <p className="mt-3 max-w-4xl text-sm leading-6 text-muted">
          Die KI-Unterstützung wird im Leistungsverzeichnis über konkrete Umsetzungspositionen abgebildet, nicht als unscharfes Schlagwort.
          Relevant sind insbesondere Daten- und KI-Konzept, Prompt Engineering, RAG-System, KI-Agentenlogik, Dokumenten-KI und automatisierte Workflows.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {["Prompt Engineering", "RAG-System", "KI-Agentenlogik", "Dokumenten-KI", "Angebotsassistenz", "Workflow-Automation"].map((item) => (
            <div key={item} className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectWorkspace({
  project,
  customers,
  profiles,
  createNewOffer,
  updateProject,
  applyCustomerToProject,
  setActiveView
}: {
  project: Project;
  customers: Customer[];
  profiles: CompanyProfile[];
  createNewOffer: (companyId: Project["companyId"]) => void;
  updateProject: <K extends keyof Project>(key: K, value: Project[K]) => void;
  applyCustomerToProject: (customerId: string) => void;
  setActiveView: (view: View) => void;
}) {
  const selectedCustomer = customers.find((customer) => customer.companyName === project.client && customer.contactPerson === project.contactPerson);
  const [newOfferCompanyId, setNewOfferCompanyId] = useState<Project["companyId"]>(project.companyId);
  const selectedNewOfferProfile = profiles.find((profile) => profile.id === newOfferCompanyId);

  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
        <SectionTitle title="Neues Angebot" kicker="Strukturierte Angebotsdaten" />
        <div className="mt-6 grid gap-5">
          <section className="rounded-md border border-line bg-white p-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
                <Field label="Ausgewähltes Firmenprofil">
                  <div className="flex min-h-10 items-center rounded-md border border-line bg-slate-50 px-3 text-sm font-semibold text-ink">
                    {selectedNewOfferProfile?.name ?? "Kein Firmenprofil"}
                  </div>
                </Field>
                <Field label="Neues Angebot für Firmenprofil">
                  <Select value={newOfferCompanyId} onChange={(event) => setNewOfferCompanyId(event.target.value as Project["companyId"])}>
                    {profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <button
                type="button"
                onClick={() => createNewOffer(newOfferCompanyId)}
                className="inline-flex h-10 items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Neues Angebot anlegen
              </button>
            </div>
          </section>
          <section className="rounded-md border border-line bg-slate-50 p-4">
            <h3 className="font-semibold text-ink">1 Empfänger und Ansprechpartner</h3>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
              <Field label="Kunde auswählen">
                <Select value={selectedCustomer?.id ?? ""} onChange={(event) => event.target.value && applyCustomerToProject(event.target.value)}>
                  <option value="">Manuelle Eingabe</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.companyName} · {customer.contactPerson || "ohne Ansprechpartner"}
                    </option>
                  ))}
                </Select>
              </Field>
              <button type="button" onClick={() => setActiveView("Kunden")} className="h-10 self-end rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink transition hover:border-slate-300">
                Kunden öffnen
              </button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Auftraggeber">
                <TextInput value={project.client} onChange={(event) => updateProject("client", event.target.value)} />
              </Field>
              <Field label="Ansprechpartner">
                <TextInput value={project.contactPerson} onChange={(event) => updateProject("contactPerson", event.target.value)} />
              </Field>
            </div>
            <div className="mt-5 border-t border-line pt-4">
              <h4 className="text-sm font-semibold text-ink">Projektinformationen</h4>
              <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Projekt">
                  <TextInput value={project.projectName} onChange={(event) => updateProject("projectName", event.target.value)} />
                </Field>
                <Field label="Projektstandort">
                  <TextInput value={project.projectLocation} onChange={(event) => updateProject("projectLocation", event.target.value)} />
                </Field>
                <Field label="Projektvolumen">
                  <TextInput value={project.projectVolume} onChange={(event) => updateProject("projectVolume", event.target.value)} />
                </Field>
                <Field label="Leistungszeitraum">
                  <TextInput value={project.plannedProjectStart} onChange={(event) => updateProject("plannedProjectStart", event.target.value)} />
                </Field>
              </div>
            </div>
          </section>

          <section className="rounded-md border border-line p-4">
            <h3 className="font-semibold text-ink">2 Angebotskopf</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Field label="Angebotsnummer">
                <TextInput value={project.offerNumber} onChange={(event) => updateProject("offerNumber", event.target.value)} />
              </Field>
              <Field label="Angebotsdatum">
                <TextInput type="date" value={project.offerDate} onChange={(event) => updateProject("offerDate", event.target.value)} />
              </Field>
              <Field label="Angebotsstatus">
                <Select value={project.status} onChange={(event) => updateProject("status", event.target.value as Project["status"])}>
                  <option>Entwurf</option>
                  <option>In Prüfung</option>
                  <option>Versendet</option>
                  <option>Beauftragt</option>
                  <option>Archiviert</option>
                </Select>
              </Field>
            </div>
          </section>

          <section className="rounded-md border border-line p-4">
            <h3 className="font-semibold text-ink">3 Inhalt und Angebotsklarstellung</h3>
            <div className="mt-4 grid gap-4">
              <Field label="Angebotseinleitung">
                <TextArea value={project.offerIntro} onChange={(event) => updateProject("offerIntro", event.target.value)} className="min-h-28" />
              </Field>
              <Field label="Anlass der Beauftragung">
                <TextArea
                  value={project.assignmentReason}
                  onChange={(event) => updateProject("assignmentReason", event.target.value)}
                  className="min-h-28"
                />
              </Field>
              <Field label="Aufgabenstellung">
                <TextArea value={project.shortDescription} onChange={(event) => updateProject("shortDescription", event.target.value)} className="min-h-28" />
              </Field>
              <Field label="Leistungsrahmen">
                <TextArea value={project.serviceScope} onChange={(event) => updateProject("serviceScope", event.target.value)} className="min-h-28" />
              </Field>
              <Field label="Auftragnehmerrolle">
                <TextArea value={project.contractorRole} onChange={(event) => updateProject("contractorRole", event.target.value)} className="min-h-28" />
              </Field>
              <Field label="Zielsetzung">
                <TextArea value={project.objective} onChange={(event) => updateProject("objective", event.target.value)} className="min-h-28" />
              </Field>
              <Field label="Einleitung Leistungsverzeichnis">
                <TextArea
                  value={project.serviceDirectoryIntro}
                  onChange={(event) => updateProject("serviceDirectoryIntro", event.target.value)}
                  className="min-h-28"
                />
              </Field>
              <Field label="Leistungsabgrenzung">
                <TextArea value={project.serviceExclusion} onChange={(event) => updateProject("serviceExclusion", event.target.value)} className="min-h-28" />
              </Field>
              <Field label="Leistungsänderungen">
                <TextArea value={project.changeTerms} onChange={(event) => updateProject("changeTerms", event.target.value)} className="min-h-28" />
              </Field>
              <Field label="Angebotsgrundlagen">
                <TextArea value={project.offerClarification} onChange={(event) => updateProject("offerClarification", event.target.value)} className="min-h-28" />
              </Field>
              <Field label="Hinweis">
                <TextArea value={project.offerNote} onChange={(event) => updateProject("offerNote", event.target.value)} className="min-h-28" />
              </Field>
            </div>
          </section>

          <section className="rounded-md border border-line p-4">
            <h3 className="font-semibold text-ink">4 Konditionen und Kalkulation</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Kalkulationsart">
                <Select value={project.calculationType} onChange={(event) => updateProject("calculationType", event.target.value as Project["calculationType"])}>
                  <option>Stundenbasiert</option>
                  <option>Pauschal</option>
                  <option>Hybrid</option>
                </Select>
              </Field>
              <Field label="Gültigkeitsdauer Kurzform">
                <TextInput value={project.validUntil} onChange={(event) => updateProject("validUntil", event.target.value)} />
              </Field>
              <Field label="Umsatzsteuer in %">
                <TextInput type="number" value={project.vatRate} onChange={(event) => updateProject("vatRate", Number(event.target.value))} />
              </Field>
              <Field label="Optionaler Pauschalpreis netto">
                <TextInput
                  type="number"
                  value={project.flatFee ?? ""}
                  placeholder="Nach Positionen berechnen"
                  onChange={(event) => updateProject("flatFee", event.target.value ? Number(event.target.value) : null)}
                />
              </Field>
              <Field label="Nachlass in %">
                <TextInput type="number" value={project.discountPercent} onChange={(event) => updateProject("discountPercent", Number(event.target.value))} />
              </Field>
              <Field label="Skonto in %">
                <TextInput type="number" value={project.skontoPercent} onChange={(event) => updateProject("skontoPercent", Number(event.target.value))} />
              </Field>
              <Field label="Skontofrist in Tagen">
                <TextInput type="number" value={project.skontoDays} onChange={(event) => updateProject("skontoDays", Number(event.target.value))} />
              </Field>
              <div className="xl:col-span-4">
                <Field label="Zahlungsbedingungen">
                  <TextArea value={project.paymentTerms} onChange={(event) => updateProject("paymentTerms", event.target.value)} className="min-h-20" />
                </Field>
              </div>
              <div className="xl:col-span-4">
                <Field label="Gültigkeit">
                  <TextArea value={project.validityText} onChange={(event) => updateProject("validityText", event.target.value)} className="min-h-20" />
                </Field>
              </div>
              <div className="xl:col-span-4">
                <Field label="Vertragsgrundlage">
                  <TextArea value={project.contractBasis} onChange={(event) => updateProject("contractBasis", event.target.value)} className="min-h-20" />
                </Field>
              </div>
              <div className="xl:col-span-4">
                <Field label="Auftragserteilung">
                  <TextArea value={project.acceptanceText} onChange={(event) => updateProject("acceptanceText", event.target.value)} className="min-h-20" />
                </Field>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function NewLvWorkspace({
  project,
  groups,
  profiles,
  templates,
  selectCompany,
  startEmptyLv,
  applyTemplate,
  copyMasterGroupToOffer,
  copyMasterPositionToOffer,
  setActiveView
}: {
  project: Project;
  groups: PositionGroup[];
  profiles: CompanyProfile[];
  templates: LvTemplate[];
  selectCompany: (companyId: Project["companyId"]) => void;
  startEmptyLv: () => void;
  applyTemplate: (templateId: string) => void;
  copyMasterGroupToOffer: (group: PositionGroup) => void;
  copyMasterPositionToOffer: (group: PositionGroup, position: Position) => void;
  setActiveView: (view: View) => void;
}) {
  const company = profiles.find((profile) => profile.id === project.companyId) ?? profiles[0];
  const profileTemplates = templates.filter((template) => template.companyId === project.companyId);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const selectedTemplate =
    profileTemplates.find((template) => template.id === selectedTemplateId) ??
    profileTemplates.find((template) => template.id === `template-${project.companyId}-standard`) ??
    profileTemplates[0];
  const offerGroups = activeGroups(groups);
  const masterGroups = selectedTemplate ? activeGroups(selectedTemplate.groups) : [];
  const offerPositionCount = offerGroups.reduce((sum, group) => sum + group.positions.filter((position) => position.active).length, 0);
  const masterPositionCount = masterGroups.reduce((sum, group) => sum + group.positions.filter((position) => position.active).length, 0);

  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1fr_240px_260px_auto_auto] xl:items-end">
          <div>
            <SectionTitle title="Vorlage wählen" kicker={company.name} />
            <p className="mt-3 max-w-4xl text-sm leading-6 text-muted">
              Wähle ein Firmenprofil und danach eine gespeicherte Angebotsvorlage. Diese kann komplett übernommen werden; einzelne Titel und Positionen können rechts gezielt in das aktuelle Angebots-LV kopiert werden.
            </p>
          </div>
          <Field label="Firmenprofil">
            <Select value={project.companyId} onChange={(event) => selectCompany(event.target.value as Project["companyId"])}>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Angebotsvorlage">
            <Select value={selectedTemplate?.id ?? ""} onChange={(event) => setSelectedTemplateId(event.target.value)} disabled={!profileTemplates.length}>
              {profileTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </Select>
          </Field>
          <button type="button" onClick={startEmptyLv} className="inline-flex h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-slate-300">
            Leeres LV starten
          </button>
          <button
            type="button"
            onClick={() => selectedTemplate && applyTemplate(selectedTemplate.id)}
            disabled={!selectedTemplate}
            className="inline-flex h-10 items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Angebotsvorlage komplett übernehmen
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-line bg-white shadow-sm">
          <div className="border-b border-line p-5">
            <SectionTitle title="Aktuelles Angebots-LV" kicker={`${offerGroups.length} Titel · ${offerPositionCount} Positionen`} />
            <button type="button" onClick={() => setActiveView("LV bearbeiten")} className="mt-4 rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-slate-300">
              Im LV-Editor bearbeiten
            </button>
          </div>
          <div className="max-h-[760px] overflow-auto p-5">
            {offerGroups.length ? (
              <div className="grid gap-4">
                {offerGroups.map((group) => (
                  <div key={group.id} className="rounded-md border border-line p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-muted">{groupNumber(groups, group.id)}</p>
                        <h3 className="mt-1 font-semibold text-ink">{group.title}</h3>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-ink">{formatCurrency(groupTotal(group))}</span>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {group.positions.filter((position) => position.active).map((position) => (
                        <div key={position.id} className="flex items-start justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm">
                          <span className="text-muted">{positionNumber(groups, group.id, position.id)} {position.title}</span>
                          <span className="shrink-0 font-semibold text-ink">{formatCurrency(positionTotal(position))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-line p-8 text-center">
                <p className="font-semibold text-ink">Noch kein Angebots-LV angelegt</p>
                <p className="mt-2 text-sm text-muted">Übernimm rechts einen Titel, eine Position oder die komplette Angebotsvorlage.</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white shadow-sm">
          <div className="border-b border-line p-5">
            <SectionTitle title="Angebotsvorlage" kicker={selectedTemplate ? `${masterGroups.length} Titel · ${masterPositionCount} Positionen` : "Keine Vorlage"} />
            {selectedTemplate ? (
              <div className="mt-3 grid gap-2 text-sm leading-6 text-muted">
                <p>{selectedTemplate.description}</p>
                <p>Gespeichert für {company.name} · zuletzt geändert am {new Date(selectedTemplate.updatedAt).toLocaleDateString("de-DE")}</p>
              </div>
            ) : null}
          </div>
          <div className="max-h-[760px] overflow-auto p-5">
            {selectedTemplate ? (
              <div className="grid gap-4">
                {masterGroups.map((group) => (
                  <div key={group.id} className="rounded-md border border-line p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-muted">{groupNumber(selectedTemplate.groups, group.id)}</p>
                        <h3 className="mt-1 font-semibold text-ink">{group.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-muted">{group.intro}</p>
                      </div>
                      <button type="button" onClick={() => copyMasterGroupToOffer(group)} className="shrink-0 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-slate-300">
                        Titel übernehmen
                      </button>
                    </div>
                    <div className="mt-4 grid gap-2">
                      {group.positions.filter((position) => position.active).map((position) => (
                        <div key={position.id} className="grid gap-3 rounded-md bg-slate-50 px-3 py-3 md:grid-cols-[1fr_auto] md:items-center">
                          <div>
                            <p className="text-sm font-semibold text-ink">{positionNumber(selectedTemplate.groups, group.id, position.id)} {position.title}</p>
                            <p className="mt-1 text-sm leading-6 text-muted">{position.description}</p>
                            <p className="mt-1 text-sm text-muted">{position.unit} · {position.quantity} · {formatCurrency(position.unitPrice)}</p>
                          </div>
                          <button type="button" onClick={() => copyMasterPositionToOffer(group, position)} className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-slate-300">
                            Position übernehmen
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-line p-8 text-center">
                <p className="font-semibold text-ink">Keine Angebotsvorlage vorhanden</p>
                <p className="mt-2 text-sm text-muted">Speichere im LV-Editor oder unter Angebotsvorlagen ein Leistungsverzeichnis für dieses Firmenprofil.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LvEditor({
  groups,
  allGroups,
  query,
  setQuery,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  categories,
  statuses,
  updatePosition,
  updateGroup,
  deleteGroup,
  deletePosition,
  duplicatePosition,
  addPosition,
  copyOfferGroupToMaster,
  copyOfferPositionToMaster,
  onDragEnd
}: {
  groups: PositionGroup[];
  allGroups: PositionGroup[];
  query: string;
  setQuery: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  categories: string[];
  statuses: string[];
  updatePosition: (groupId: string, positionId: string, changes: Partial<Position>) => void;
  updateGroup: (groupId: string, changes: Partial<PositionGroup>) => void;
  deleteGroup: (groupId: string) => void;
  deletePosition: (groupId: string, positionId: string) => void;
  duplicatePosition: (groupId: string, positionId: string) => void;
  addPosition: (groupId: string) => void;
  copyOfferGroupToMaster: (groupId: string) => void;
  copyOfferPositionToMaster: (groupId: string, positionId: string) => void;
  onDragEnd: (result: DropResult) => void;
}) {
  const hasFilters = Boolean(query) || categoryFilter !== "Alle Kategorien" || statusFilter !== "Alle Status";
  const displayedGroups = hasFilters ? groups : allGroups;

  return (
    <div className="grid gap-5">
      <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[1fr_220px_180px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted" />
            <TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Positionen suchen" className="pl-9" />
          </div>
          <Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </Select>
          <div className="flex items-center gap-2 text-sm font-medium text-muted">
            <SlidersHorizontal className="h-4 w-4" />
            {displayedGroups.reduce((sum, group) => sum + group.positions.length, 0)} Positionen
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid gap-5">
          {displayedGroups.map((group) => (
            <div key={group.id} className="rounded-lg border border-line bg-white shadow-sm">
              <div className="grid gap-4 border-b border-line p-5 xl:grid-cols-[1fr_auto] xl:items-start">
                <div className="grid gap-3">
                  <div className="grid gap-3 md:grid-cols-[88px_1fr]">
                    <div>
                      <p className="text-sm font-medium text-ink">Titel-Nr.</p>
                      <p className="mt-2 flex h-10 items-center rounded-md bg-slate-50 px-3 text-sm font-semibold text-ink">
                        {group.active ? groupNumber(allGroups, group.id) : "entfällt"}
                      </p>
                    </div>
                    <Field label="Titel bearbeiten">
                      <TextInput value={group.title} onChange={(event) => updateGroup(group.id, { title: event.target.value })} />
                    </Field>
                  </div>
                  <Field label="Titelbeschreibung">
                    <TextArea value={group.intro} onChange={(event) => updateGroup(group.id, { intro: event.target.value })} className="min-h-20" />
                  </Field>
                </div>
                <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                  <button
                    type="button"
                    onClick={() => updateGroup(group.id, { active: !group.active })}
                    className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                      group.active ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-muted"
                    }`}
                  >
                    {group.active ? "Hauptgruppe aktiv" : "Hauptgruppe entfällt"}
                  </button>
                  <p className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-ink">{formatCurrency(groupTotal(group))}</p>
                  <IconButton icon={Plus} label="Position hinzufügen" onClick={() => addPosition(group.id)} disabled={hasFilters} />
                  <IconButton icon={Save} label="Titel in die Angebotsvorlage übernehmen" onClick={() => copyOfferGroupToMaster(group.id)} disabled={hasFilters} />
                  <IconButton icon={Trash2} label="Titel löschen" onClick={() => deleteGroup(group.id)} disabled={hasFilters} />
                </div>
              </div>
              <Droppable droppableId={group.id}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="divide-y divide-line">
                    {group.positions.map((position, index) => (
                      <Draggable key={position.id} draggableId={position.id} index={index} isDragDisabled={hasFilters}>
                        {(draggableProvided) => (
                          <div ref={draggableProvided.innerRef} {...draggableProvided.draggableProps} className="grid gap-4 p-4">
                            <button
                              type="button"
                              title="Verschieben"
                              aria-label="Verschieben"
                              {...draggableProvided.dragHandleProps}
                              className="row-start-1 flex h-10 w-9 items-center justify-center rounded-md text-muted hover:bg-slate-50"
                            >
                              <GripVertical className="h-4 w-4" />
                            </button>
                            <div className="grid gap-4 xl:grid-cols-[36px_1fr]">
                              <div className="hidden xl:block" />
                              <div className="grid gap-3">
                                <div className="grid gap-3 md:grid-cols-[88px_1fr]">
                                  <div>
                                    <p className="text-sm font-medium text-ink">LV-Nr.</p>
                                    <p className="mt-2 flex h-10 items-center rounded-md bg-slate-50 px-3 text-sm font-semibold text-ink">
                                      {positionNumber(allGroups, position.groupId, position.id)}
                                    </p>
                                  </div>
                                  <Field label="Titel">
                                    <TextInput value={position.title} onChange={(event) => updatePosition(position.groupId, position.id, { title: event.target.value })} />
                                  </Field>
                                </div>
                                <div className="grid gap-3 md:grid-cols-4">
                                  <Field label="Einheit">
                                    <Select value={position.unit} onChange={(event) => updatePosition(position.groupId, position.id, { unit: event.target.value as Position["unit"] })}>
                                      <option>Std.</option>
                                      <option>Pauschal</option>
                                      <option>Tag</option>
                                      <option>Monat</option>
                                      <option>Kilometer</option>
                                    </Select>
                                  </Field>
                                  <Field label="Menge">
                                    <TextInput type="number" value={position.quantity} onChange={(event) => updatePosition(position.groupId, position.id, { quantity: Number(event.target.value) })} />
                                  </Field>
                                  <Field label="Einheitspreis">
                                    <TextInput type="number" value={position.unitPrice} onChange={(event) => updatePosition(position.groupId, position.id, { unitPrice: Number(event.target.value) })} />
                                  </Field>
                                  <div>
                                    <p className="text-sm font-medium text-ink">Gesamtpreis</p>
                                    <p className="mt-2 flex h-10 items-center rounded-md bg-slate-50 px-3 text-sm font-semibold text-ink">{formatCurrency(positionTotal(position))}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="grid gap-3 xl:pl-[52px]">
                              <Field label="Leistungsbeschreibung">
                                <TextArea value={position.description} onChange={(event) => updatePosition(position.groupId, position.id, { description: event.target.value })} />
                              </Field>
                              <div className="grid gap-3 md:grid-cols-3">
                                <Field label="Leistungsbereich für Suche/Filter">
                                  <TextInput value={position.category} onChange={(event) => updatePosition(position.groupId, position.id, { category: event.target.value })} />
                                </Field>
                                <Field label="Interner oder angebotsbezogener Hinweis">
                                  <TextInput value={position.note} onChange={(event) => updatePosition(position.groupId, position.id, { note: event.target.value })} />
                                </Field>
                                <Field label="Status">
                                  <Select value={position.status} onChange={(event) => updatePosition(position.groupId, position.id, { status: event.target.value as Position["status"] })}>
                                    <option>Offen</option>
                                    <option>Abgestimmt</option>
                                    <option>Optional</option>
                                    <option>Zurückgestellt</option>
                                  </Select>
                                </Field>
                              </div>
                              <div className="flex gap-2">
                                <IconButton icon={CheckCircle2} label="Position aktivieren/deaktivieren" active={position.active} onClick={() => updatePosition(position.groupId, position.id, { active: !position.active })} />
                                <IconButton icon={Save} label="Position in die Angebotsvorlage übernehmen" onClick={() => copyOfferPositionToMaster(position.groupId, position.id)} />
                                <IconButton icon={Copy} label="Position duplizieren" onClick={() => duplicatePosition(position.groupId, position.id)} />
                                <IconButton icon={Trash2} label="Position löschen" onClick={() => deletePosition(position.groupId, position.id)} />
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

function CompanyProfiles({
  selectedCompanyId,
  activeProjectCompanyId,
  templates,
  profiles,
  selectProfile,
  applyProfileToProject,
  updateCompanyProfile,
  updateCompanyProfileColors,
  setActiveView
}: {
  selectedCompanyId: string;
  activeProjectCompanyId: Project["companyId"];
  templates: LvTemplate[];
  profiles: CompanyProfile[];
  selectProfile: (companyId: Project["companyId"]) => void;
  applyProfileToProject: (companyId: Project["companyId"]) => void;
  updateCompanyProfile: (profileId: Project["companyId"], changes: Partial<CompanyProfile>) => void;
  updateCompanyProfileColors: (profileId: Project["companyId"], changes: Partial<CompanyProfile["colors"]>) => void;
  setActiveView: (view: View) => void;
}) {
  const activeProfile = profiles.find((profile) => profile.id === selectedCompanyId) ?? profiles[0];
  const profileTemplates = templates.filter((template) => template.companyId === activeProfile.id);
  const previewAddressLines = formatProfileAddressLines(activeProfile);
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const [profileStorageMessage, setProfileStorageMessage] = useState("Profil wird automatisch im Arbeitsstand gespeichert.");

  function exportCompanyProfile() {
    const payload = {
      version: 1,
      type: "smart-offerflow-company-profile",
      exportedAt: new Date().toISOString(),
      profile: activeProfile
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeProfile.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}-firmenprofil.json`;
    link.click();
    URL.revokeObjectURL(url);
    setProfileStorageMessage("Profil wurde als JSON-Datei gespeichert.");
  }

  function importCompanyProfile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Partial<CompanyProfile> & { profile?: Partial<CompanyProfile> };
        const importedProfile = parsed.profile ?? parsed;
        if (!importedProfile.name || !importedProfile.logoText) throw new Error("invalid-profile");
        if (!window.confirm(`Aktuelles Profil "${activeProfile.name}" mit Daten aus "${file.name}" überschreiben?`)) return;
        const importedProfileForSlot = { ...activeProfile, ...importedProfile, id: activeProfile.id } as CompanyProfile;
        updateCompanyProfile(activeProfile.id, {
          ...activeProfile,
          ...importedProfileForSlot,
          id: activeProfile.id,
          colors: {
            ...activeProfile.colors,
            ...(importedProfileForSlot.colors ?? {})
          }
        });
        setProfileStorageMessage(`Profil wurde aus ${file.name} geladen.`);
      } catch {
        setProfileStorageMessage("Profil-Datei konnte nicht geladen werden.");
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  function resetCompanyProfile() {
    const defaultProfile = companyProfiles.find((profile) => profile.id === activeProfile.id);
    if (!defaultProfile) return;
    if (!window.confirm(`Profil "${activeProfile.name}" auf Standardwerte zurücksetzen?`)) return;
    updateCompanyProfile(activeProfile.id, defaultProfile);
    setProfileStorageMessage("Profil wurde auf Standardwerte zurückgesetzt.");
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-line bg-white p-2 shadow-sm">
        <div className="flex gap-2 overflow-x-auto">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => selectProfile(profile.id)}
              className={`flex min-w-52 items-center gap-3 rounded-md px-3 py-3 text-left transition ${
                profile.id === activeProfile.id ? "bg-slate-100 text-ink" : "text-muted hover:bg-slate-50 hover:text-ink"
              }`}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-xs font-bold"
                style={{ background: profile.colors.primary, color: readableTextColor(profile.colors.primary) }}
              >
                {profile.logoText}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{profile.name}</span>
                <span className="block text-xs">
                  {templates.filter((template) => template.companyId === profile.id).length} Angebotsvorlagen
                  {profile.id === activeProjectCompanyId ? " · im Angebot aktiv" : ""}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <SectionTitle title="Firmenprofil bearbeiten" kicker={activeProfile.name} />
            <div className="flex flex-wrap gap-2">
              <input ref={profileFileInputRef} type="file" accept="application/json,.json" onChange={importCompanyProfile} className="hidden" />
              <IconButton icon={Save} label="Firmenprofil als JSON speichern" onClick={exportCompanyProfile} />
              <IconButton icon={Upload} label="Firmenprofil aus JSON laden" onClick={() => profileFileInputRef.current?.click()} />
              <IconButton icon={RotateCcw} label="Firmenprofil zurücksetzen" onClick={resetCompanyProfile} />
              <button
                type="button"
                onClick={() => {
                  applyProfileToProject(activeProfile.id);
                  setActiveView("Neues LV");
                }}
                disabled={activeProfile.id === activeProjectCompanyId}
                className="inline-flex h-10 items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {activeProfile.id === activeProjectCompanyId ? "Im aktuellen Angebot aktiv" : "Für aktuelles Angebot verwenden"}
              </button>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted">{profileStorageMessage}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="Profilname">
              <TextInput value={activeProfile.name} onChange={(event) => updateCompanyProfile(activeProfile.id, { name: event.target.value })} />
            </Field>
            <Field label="Logo-Kürzel">
              <TextInput value={activeProfile.logoText} onChange={(event) => updateCompanyProfile(activeProfile.id, { logoText: event.target.value })} />
            </Field>
            <Field label="Adresse">
              <TextArea value={activeProfile.address} onChange={(event) => updateCompanyProfile(activeProfile.id, { address: event.target.value })} />
            </Field>
            <Field label="Kontaktperson">
              <TextInput value={activeProfile.contact} onChange={(event) => updateCompanyProfile(activeProfile.id, { contact: event.target.value })} />
            </Field>
            <Field label="Rolle Kontaktperson">
              <TextInput value={activeProfile.contactRole} onChange={(event) => updateCompanyProfile(activeProfile.id, { contactRole: event.target.value })} />
            </Field>
            <Field label="Inhaber / Verantwortlicher">
              <TextInput value={activeProfile.ownerLine} onChange={(event) => updateCompanyProfile(activeProfile.id, { ownerLine: event.target.value })} />
            </Field>
            <Field label="E-Mail">
              <TextInput value={activeProfile.email} onChange={(event) => updateCompanyProfile(activeProfile.id, { email: event.target.value })} />
            </Field>
            <Field label="Telefon">
              <TextInput value={activeProfile.phone} onChange={(event) => updateCompanyProfile(activeProfile.id, { phone: event.target.value })} />
            </Field>
            <Field label="Website">
              <TextInput value={activeProfile.website} onChange={(event) => updateCompanyProfile(activeProfile.id, { website: event.target.value })} />
            </Field>
            <Field label="AGB-Link">
              <TextInput value={activeProfile.agbUrl} onChange={(event) => updateCompanyProfile(activeProfile.id, { agbUrl: event.target.value })} />
            </Field>
            <Field label="Terminbuchung">
              <TextInput value={activeProfile.bookingUrl} onChange={(event) => updateCompanyProfile(activeProfile.id, { bookingUrl: event.target.value })} />
            </Field>
            <Field label="USt-ID / Steuernummer">
              <TextInput value={activeProfile.vatId} onChange={(event) => updateCompanyProfile(activeProfile.id, { vatId: event.target.value })} />
            </Field>
            <Field label="Footer Einleitung">
              <TextArea
                value={activeProfile.footerIntro}
                onChange={(event) =>
                  updateCompanyProfile(activeProfile.id, {
                    footerIntro: event.target.value,
                    footer: event.target.value
                  })
                }
              />
            </Field>
            <Field label="Footer Kontakt">
              <TextArea value={activeProfile.footerContact} onChange={(event) => updateCompanyProfile(activeProfile.id, { footerContact: event.target.value })} />
            </Field>
            <Field label="Footer Rechtliches & Links">
              <TextArea value={activeProfile.footerLegal} onChange={(event) => updateCompanyProfile(activeProfile.id, { footerLegal: event.target.value })} />
            </Field>
            <Field label="Footer Bankverbindung">
              <TextArea value={activeProfile.footerBank} onChange={(event) => updateCompanyProfile(activeProfile.id, { footerBank: event.target.value })} />
            </Field>
          </div>
        </div>

        <div className="grid content-start gap-6">
          <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
            <SectionTitle title="Vorschau" />
            <div className="mt-5 rounded-md border border-line p-4">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-14 min-w-14 items-center justify-center rounded-md px-3 text-sm font-bold"
                  style={{ background: activeProfile.colors.primary, color: readableTextColor(activeProfile.colors.primary) }}
                >
                  {activeProfile.logoText}
                </div>
                <div>
                  <p className="font-semibold text-ink">{activeProfile.name}</p>
                  <div className="mt-2 grid gap-1 text-sm leading-6 text-muted">
                    {previewAddressLines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-5 grid gap-2 text-sm text-muted">
                <p>{activeProfile.email}</p>
                <p>{activeProfile.phone}</p>
                <p>{activeProfile.website}</p>
                <p>{activeProfile.agbUrl}</p>
                <p>{activeProfile.bookingUrl}</p>
                <p>{activeProfile.vatId}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
            <SectionTitle title="Farben" />
            <div className="mt-5 grid gap-4">
              <ColorField label="Primärfarbe" value={activeProfile.colors.primary} onChange={(value) => updateCompanyProfileColors(activeProfile.id, { primary: value })} />
              <ColorField label="Sekundärfarbe" value={activeProfile.colors.secondary} onChange={(value) => updateCompanyProfileColors(activeProfile.id, { secondary: value })} />
              <ColorField label="Akzentfarbe" value={activeProfile.colors.accent} onChange={(value) => updateCompanyProfileColors(activeProfile.id, { accent: value })} />
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">Profilangaben und Farbangaben werden automatisch gespeichert.</p>
          </div>

          <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
            <SectionTitle title="Angebotsvorlagen" />
            <p className="mt-3 text-sm text-muted">{profileTemplates.length} gespeicherte Angebotsvorlagen für dieses Firmenprofil.</p>
            <button
              type="button"
              onClick={() => setActiveView("Angebotsvorlagen")}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-slate-300"
            >
              Angebotsvorlagen öffnen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatProfileAddressLines(profile: CompanyProfile) {
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

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <div className="grid grid-cols-[44px_1fr] gap-3">
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-11 rounded-md border border-line bg-white p-1" />
        <TextInput value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
    </Field>
  );
}

type QualityIssue = {
  id: string;
  severity: "Fehler" | "Warnung" | "Hinweis";
  area: string;
  title: string;
  detail: string;
  action?: string;
};

function QualityManagement({
  project,
  groups,
  profiles,
  customers,
  savedOffers,
  templates,
  lastSavedAt,
  storageMessage,
  repairCompanyLvAlignment,
  applyMasterLv,
  setActiveView
}: {
  project: Project;
  groups: PositionGroup[];
  profiles: CompanyProfile[];
  customers: Customer[];
  savedOffers: SavedOffer[];
  templates: LvTemplate[];
  lastSavedAt: string | null;
  storageMessage: string;
  repairCompanyLvAlignment: () => void;
  applyMasterLv: () => void;
  setActiveView: (view: View) => void;
}) {
  const company = profiles.find((profile) => profile.id === project.companyId) ?? profiles[0];
  const visibleGroups = activeGroups(groups);
  const activePositions = visibleGroups.flatMap((group) => group.positions.filter((position) => position.active));
  const summary = calculateSummary(groups, project);
  const masterTemplate = templates.find((template) => template.companyId === project.companyId && template.id === `template-${project.companyId}-standard`);
  const activeSavedOffer = savedOffers.find((offer) => offer.id === project.id);
  const matchingCompanyTemplates = templates.filter((template) => template.companyId === project.companyId);
  const textFieldCount = Object.values(offerTemplateTextFromProject(project)).filter((value) => `${value ?? ""}`.trim()).length;
  const templateTextCount = masterTemplate ? Object.values(masterTemplate.textFields ?? {}).filter((value) => `${value ?? ""}`.trim()).length : 0;
  const aiDemoFindings = collectAiDemoFindings(project, groups);
  const hasAiDemoLanguage = aiDemoFindings.length > 0;
  const hasMetzgerStructure = groups.some((group) => group.id.startsWith("mrea-"));
  const staleSave = !lastSavedAt;

  const issues: QualityIssue[] = [];

  if (!project.projectName.trim()) {
    issues.push({
      id: "project-title-missing",
      severity: "Fehler",
      area: "Angebotsdaten",
      title: "Projekttitel fehlt",
      detail:
        "In der Angebotsliste erscheint dadurch „Ohne Projekttitel“. Trage im neuen Angebot unter Projektinformationen den Mandats- oder Projektnamen ein, zum Beispiel „Projektstabilisierung und Unterstützungsleistungen“.",
      action: "Angebotsdaten öffnen"
    });
  }

  if (!activeSavedOffer) {
    issues.push({
      id: "offer-not-in-database",
      severity: "Fehler",
      area: "Angebotsdatenbank",
      title: "Aktives Angebot fehlt in der Angebotsliste",
      detail:
        "Das aktuell geöffnete Angebot war nicht als eigener Datensatz in der Angebotsliste verknüpft. Die App synchronisiert dies künftig automatisch; öffne Angebote zur Kontrolle.",
      action: "Angebote öffnen"
    });
  } else {
    const savedNet = calculateSummary(activeSavedOffer.groups, activeSavedOffer.project).net;
    const activeNet = summary.net;
    const savedMismatch =
      activeSavedOffer.project.projectName !== project.projectName ||
      activeSavedOffer.project.client !== project.client ||
      activeSavedOffer.project.companyId !== project.companyId ||
      activeSavedOffer.groups.length !== groups.length ||
      savedNet !== activeNet;
    if (savedMismatch) {
      issues.push({
        id: "offer-database-stale",
        severity: "Warnung",
        area: "Angebotsdatenbank",
        title: "Angebotsliste war nicht synchron mit dem aktiven Angebot",
        detail:
          "Die gespeicherte Angebotsliste enthält abweichende Projekt-, Firmenprofil-, LV- oder Summendaten. Die App synchronisiert aktive Angebote künftig automatisch mit der Angebotsliste.",
        action: "Angebote öffnen"
      });
    }
  }

  if (!matchingCompanyTemplates.length) {
    issues.push({
      id: "no-company-templates",
      severity: "Fehler",
      area: "Angebotsvorlagen",
      title: "Keine Angebotsvorlage für das aktive Firmenprofil",
      detail: "Für jedes Firmenprofil sollte mindestens eine Angebotsvorlage mit Textbausteinen und LV vorhanden sein.",
      action: "Angebotsvorlagen öffnen"
    });
  }

  if (textFieldCount < 10) {
    issues.push({
      id: "offer-texts-incomplete",
      severity: "Warnung",
      area: "Textbausteine",
      title: "Zu wenige Angebotsklarstellungen gepflegt",
      detail: `Aktuell sind ${textFieldCount} von ${offerTemplateTextFieldLabels.length} möglichen Textfeldern gefüllt. Prüfe Inhalt, Angebotsklarstellung, Vertragsgrundlage, Zahlungsbedingungen und Auftragserteilung.`,
      action: "Angebotsdaten öffnen"
    });
  }

  if (masterTemplate && templateTextCount < 10) {
    issues.push({
      id: "template-texts-incomplete",
      severity: "Hinweis",
      area: "Angebotsvorlage",
      title: "Angebotsvorlage enthält wenige Textbausteine",
      detail: `Die Standardvorlage für ${company.name} enthält ${templateTextCount} gepflegte Textfelder. Für wiederverwendbare Themenvorlagen sollten die wichtigsten Klarstellungen hinterlegt sein.`,
      action: "Angebotsvorlagen öffnen"
    });
  }

  if (project.companyId === "metzger-real-estate" && hasAiDemoLanguage) {
    issues.push({
      id: "mrea-ai-copy",
      severity: "Fehler",
      area: "Profil und Inhalt",
      title: "Metzger-REA enthält noch KI-Demo-Texte",
      detail: `Im Angebot wurden noch Demo-Begriffe gefunden: ${aiDemoFindings.map((finding) => `${finding.label} (${finding.terms.join(", ")})`).join("; ")}. Für Metzger - Real Estate Advisory sollte die Angebotsvorlage mit Beratungs- und Immobilienleistungen verwendet werden.`,
      action: "Profil/LV bereinigen"
    });
  }

  if (project.companyId === "metzger-real-estate" && !hasMetzgerStructure) {
    issues.push({
      id: "mrea-master-missing",
      severity: "Fehler",
      area: "Angebotsvorlage",
      title: "Aktuelles Angebot passt nicht zum Firmenprofil",
      detail: "Das aktive LV nutzt keine Metzger-REA-Titel. Dadurch entstehen falsche Angebotsinhalte und falsche Leistungszuordnungen.",
      action: "Angebotsvorlage übernehmen"
    });
  }

  if (!project.client.trim() || !project.contactPerson.trim()) {
    issues.push({
      id: "customer-missing",
      severity: "Warnung",
      area: "Empfänger",
      title: "Empfänger oder Ansprechpartner fehlt",
      detail: "Für ein versandfähiges Angebot sollten Auftraggeber und Ansprechpartner gepflegt oder aus der Kundendatenbank übernommen werden.",
      action: "Angebotsdaten öffnen"
    });
  }

  if (!customers.length) {
    issues.push({
      id: "no-customers",
      severity: "Hinweis",
      area: "Kunden",
      title: "Kundendatenbank ist leer",
      detail: "Eine Kundendatenbank ist sinnvoll, damit Empfänger, Ansprechpartner und Angebotsdaten nicht je Angebot neu eingegeben werden müssen.",
      action: "Kunden öffnen"
    });
  }

  if (project.companyId === "metzger-real-estate" && !/bernhard\s+metzger/i.test(company.bank)) {
    issues.push({
      id: "mrea-bank-owner",
      severity: "Warnung",
      area: "Firmenprofil",
      title: "Kontoinhaber fehlt in der Bankverbindung",
      detail: "Die Bankverbindung sollte den Kontoinhaber Bernhard Metzger ausdrücklich enthalten. Die App ändert das nicht automatisch.",
      action: "Firmenprofil öffnen"
    });
  }

  if (!activePositions.length) {
    issues.push({
      id: "no-positions",
      severity: "Fehler",
      area: "LV",
      title: "Keine aktiven Positionen",
      detail: "Ein Angebot benötigt mindestens eine aktive Position oder ein bewusst gesetztes Pauschalhonorar.",
      action: "LV bearbeiten"
    });
  }

  const incompletePositions = activePositions.filter((position) => !position.title.trim() || !position.description.trim());
  if (incompletePositions.length) {
    issues.push({
      id: "incomplete-positions",
      severity: "Warnung",
      area: "LV",
      title: `${incompletePositions.length} Positionen sind unvollständig`,
      detail: "Titel und Leistungsbeschreibung sollten gefüllt sein, damit Angebot, Abrechnung und spätere Nachträge nachvollziehbar bleiben.",
      action: "LV bearbeiten"
    });
  }

  const zeroPricePositions = activePositions.filter((position) => position.unitPrice <= 0 && project.flatFee === null);
  if (zeroPricePositions.length) {
    issues.push({
      id: "zero-price",
      severity: "Warnung",
      area: "Kalkulation",
      title: `${zeroPricePositions.length} aktive Positionen ohne Einzelpreis`,
      detail: "Nullpreise sind für Platzhalter möglich, sollten im Angebot aber bewusst gesetzt sein oder durch eine Pauschale ersetzt werden.",
      action: "LV bearbeiten"
    });
  }

  if (summary.net <= 0) {
    issues.push({
      id: "no-total",
      severity: "Fehler",
      area: "Kalkulation",
      title: "Keine Netto-Angebotssumme",
      detail: "Die Netto-Summe ist 0 €. Prüfe Mengen, Einheitspreise, Pauschale und aktive Positionen.",
      action: "LV bearbeiten"
    });
  }

  if (!masterTemplate) {
    issues.push({
      id: "no-master",
      severity: "Hinweis",
      area: "Angebotsvorlagen",
      title: "Keine Angebotsvorlage für dieses Firmenprofil gefunden",
      detail: "Ein profilgebundenes LV macht neue Angebote schneller und verhindert falsche Titelzuordnungen.",
      action: "Angebotsvorlagen öffnen"
    });
  }

  if (staleSave) {
    issues.push({
      id: "save-check",
      severity: "Hinweis",
      area: "Speicherstand",
      title: "Speicherstand prüfen",
      detail: "Die App speichert automatisch lokal. Zusätzlich sollte vor Versand oder größerer Änderung eine JSON-Datei exportiert werden.",
      action: "JSON speichern"
    });
  }

  const errorCount = issues.filter((issue) => issue.severity === "Fehler").length;
  const warningCount = issues.filter((issue) => issue.severity === "Warnung").length;
  const hintCount = issues.filter((issue) => issue.severity === "Hinweis").length;
  const score = Math.max(0, 100 - errorCount * 30 - warningCount * 12 - hintCount * 4);

  function handleIssueAction(issue: QualityIssue) {
    if (issue.id === "mrea-ai-copy") repairCompanyLvAlignment();
    else if (issue.id === "mrea-master-missing") applyMasterLv();
    else if (issue.action === "Angebotsdaten öffnen") setActiveView("Neues Angebot");
    else if (issue.action === "Angebote öffnen") setActiveView("Projekte");
    else if (issue.action === "Kunden öffnen") setActiveView("Kunden");
    else if (issue.action === "Firmenprofil öffnen") setActiveView("Firmenprofile");
    else if (issue.action === "LV bearbeiten") setActiveView("LV bearbeiten");
    else if (issue.action === "Angebotsvorlagen öffnen") setActiveView("Angebotsvorlagen");
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
        <div className="grid gap-5 xl:grid-cols-[1fr_260px] xl:items-center">
          <div>
            <SectionTitle title="Prüfung" kicker={company.name} />
            <p className="mt-3 max-w-4xl text-sm leading-6 text-muted">
              Die Prüfung kontrolliert, ob Firmenprofil, Angebotsdaten, Angebotsvorlage, Positionen, Kalkulation, Speicherung und nächster Workflow-Schritt zusammenpassen.
            </p>
          </div>
          <div className="rounded-md border border-line bg-slate-50 px-5 py-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Qualitätsgrad</p>
            <p className={`mt-2 text-3xl font-semibold ${score >= 80 ? "text-emerald-700" : score >= 55 ? "text-amber-700" : "text-rose-700"}`}>{score} %</p>
            <p className="mt-2 text-sm text-muted">{errorCount} Fehler · {warningCount} Warnungen · {hintCount} Hinweise</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Firmenprofil" value={company.logoText} detail={company.name} align="center" />
        <StatCard label="Aktive Titel" value={String(visibleGroups.length)} detail={`${activePositions.length} aktive Positionen`} align="center" />
        <StatCard label="Angebotswert netto" value={formatCurrency(summary.net)} detail={project.calculationType} align="center" />
        <StatCard label="Speicherstand" value={lastSavedAt ? "gesichert" : "offen"} detail={lastSavedAt ? new Date(lastSavedAt).toLocaleString("de-DE") : storageMessage} align="center" />
      </div>

      <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle title="Prüfergebnisse" />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={repairCompanyLvAlignment} className="inline-flex h-10 items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-slate-700">
              Profil und LV bereinigen
            </button>
            <button type="button" onClick={() => setActiveView("Angebotsvorschau")} className="inline-flex h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-slate-300">
              Vorschau prüfen
            </button>
          </div>
        </div>
        <div className="mt-5 grid gap-3">
          {issues.length ? (
            issues.map((issue) => (
              <div key={issue.id} className={`rounded-md border p-4 ${issue.severity === "Fehler" ? "border-rose-100 bg-rose-50" : issue.severity === "Warnung" ? "border-amber-100 bg-amber-50" : "border-blue-100 bg-blue-50"}`}>
                <div className="grid gap-3 lg:grid-cols-[160px_1fr_auto] lg:items-start">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {issue.severity === "Fehler" ? <AlertTriangle className="h-4 w-4 text-rose-700" /> : issue.severity === "Warnung" ? <AlertTriangle className="h-4 w-4 text-amber-700" /> : <CheckCircle2 className="h-4 w-4 text-blue-700" />}
                    <span className={issue.severity === "Fehler" ? "text-rose-800" : issue.severity === "Warnung" ? "text-amber-800" : "text-blue-800"}>{issue.severity}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted">{issue.area}</p>
                    <h3 className="mt-1 font-semibold text-ink">{issue.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">{issue.detail}</p>
                  </div>
                  {issue.action && issue.action !== "JSON speichern" ? (
                    <button type="button" onClick={() => handleIssueAction(issue)} className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-slate-300">
                      {issue.action}
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-md border border-emerald-100 bg-emerald-50 p-5">
              <p className="font-semibold text-emerald-900">Keine offenen Qualitätsprobleme erkannt.</p>
              <p className="mt-2 text-sm text-emerald-800">Profil, LV, Angebotsdaten, Kalkulation und Speicherstand wirken konsistent.</p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
        <SectionTitle title="Empfohlener Workflow" />
        <div className="mt-5 grid gap-3 md:grid-cols-5">
          {[
            ["1", "Firmenprofil", "Profil wählen, Farben und Angebotslogik prüfen."],
            ["2", "Kunde", "Empfänger und Ansprechpartner aus der Kundendatenbank übernehmen."],
            ["3", "Angebotsvorlage", "Passende Angebotsvorlage übernehmen oder gezielt Positionen kopieren."],
            ["4", "QM-Prüfung", "Fehler, Warnungen und Summen vor Versand kontrollieren."],
            ["5", "Vorschau", "HTML/PDF prüfen, anschließend Angebot versenden oder abrechnen."]
          ].map(([step, title, detail]) => (
            <div key={step} className="rounded-md border border-line p-4">
              <p className="text-sm font-semibold text-blue-700">Schritt {step}</p>
              <p className="mt-2 font-semibold text-ink">{title}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Customers({
  customers,
  updateCustomer,
  addCustomer,
  deleteCustomer,
  applyCustomerToProject
}: {
  customers: Customer[];
  updateCustomer: (customerId: string, changes: Partial<Customer>) => void;
  addCustomer: () => void;
  deleteCustomer: (customerId: string) => void;
  applyCustomerToProject: (customerId: string) => void;
}) {
  const [appliedCustomerId, setAppliedCustomerId] = useState<string | null>(null);

  function handleApplyCustomer(customerId: string) {
    applyCustomerToProject(customerId);
    setAppliedCustomerId(customerId);
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 rounded-lg border border-line bg-white p-6 shadow-sm md:flex-row md:items-end md:justify-between">
        <div>
          <SectionTitle title="Kundendatenbank" />
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            Kundenstammdaten werden lokal gespeichert und können im Angebot als Empfänger und Ansprechpartner übernommen werden.
          </p>
        </div>
        <button type="button" onClick={addCustomer} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-slate-700">
          <Plus className="h-4 w-4" />
          Kunde anlegen
        </button>
      </div>

      <div className="grid gap-4">
        {customers.map((customer) => (
          <div key={customer.id} className="rounded-lg border border-line bg-white shadow-sm">
            <div className="grid gap-4 p-4 xl:grid-cols-[1fr_220px]">
              <div className="grid gap-3">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_160px_170px]">
                  <Field label="Firma / Empfänger">
                    <TextInput value={customer.companyName} onChange={(event) => updateCustomer(customer.id, { companyName: event.target.value })} />
                  </Field>
                  <Field label="Ansprechpartner">
                    <TextInput value={customer.contactPerson} onChange={(event) => updateCustomer(customer.id, { contactPerson: event.target.value })} />
                  </Field>
                  <Field label="Kundennummer">
                    <TextInput value={customer.customerNumber} onChange={(event) => updateCustomer(customer.id, { customerNumber: event.target.value })} />
                  </Field>
                  <Field label="Branche">
                    <TextInput value={customer.industry} onChange={(event) => updateCustomer(customer.id, { industry: event.target.value })} />
                  </Field>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="E-Mail">
                    <TextInput value={customer.email} onChange={(event) => updateCustomer(customer.id, { email: event.target.value })} />
                  </Field>
                  <Field label="Telefon">
                    <TextInput value={customer.phone} onChange={(event) => updateCustomer(customer.id, { phone: event.target.value })} />
                  </Field>
                  <Field label="Mobiltelefon">
                    <TextInput value={customer.mobile} onChange={(event) => updateCustomer(customer.id, { mobile: event.target.value })} />
                  </Field>
                  <Field label="Webadresse">
                    <TextInput value={customer.website} onChange={(event) => updateCustomer(customer.id, { website: event.target.value })} />
                  </Field>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  <Field label="Adresse">
                    <TextArea value={customer.address} onChange={(event) => updateCustomer(customer.id, { address: event.target.value })} className="min-h-20" />
                  </Field>
                  <Field label="Notizen">
                    <TextArea value={customer.notes} onChange={(event) => updateCustomer(customer.id, { notes: event.target.value })} className="min-h-20" />
                  </Field>
                </div>
              </div>
              <div className="grid content-start gap-3 rounded-md border border-line bg-slate-50 p-4">
                <button
                  type="button"
                  onClick={() => handleApplyCustomer(customer.id)}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition ${
                    appliedCustomerId === customer.id ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-ink text-white hover:bg-slate-700"
                  }`}
                >
                  {appliedCustomerId === customer.id ? <CheckCircle2 className="h-4 w-4" /> : null}
                  {appliedCustomerId === customer.id ? "Übernommen" : "In Angebot übernehmen"}
                </button>
                <button type="button" onClick={() => deleteCustomer(customer.id)} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-slate-300">
                  <Trash2 className="h-4 w-4" />
                  Löschen
                </button>
                <div className="border-t border-line pt-3 text-sm text-muted">
                  <p className="font-semibold text-ink">{customer.companyName}</p>
                  <p className="mt-1">{customer.contactPerson || "Kein Ansprechpartner hinterlegt"}</p>
                  <p className="mt-2 truncate">{customer.email || "Keine E-Mail"}</p>
                  <p>{customer.phone || "Kein Festnetz"}</p>
                  <p>{customer.mobile || "Kein Mobiltelefon"}</p>
                  <p className="truncate">{customer.website || "Keine Webadresse"}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PositionLibrary({
  groups,
  positions,
  updateLibraryPosition,
  addLibraryPosition,
  addLibraryPositionToGroup
}: {
  groups: PositionGroup[];
  positions: Position[];
  updateLibraryPosition: (positionId: string, changes: Partial<Position>) => void;
  addLibraryPosition: () => void;
  addLibraryPositionToGroup: (position: Position, targetGroupId: string) => void;
}) {
  const [targetGroups, setTargetGroups] = useState<Record<string, string>>({});
  const rateEntries = Object.entries(rateLabels) as [Position["rateKey"], string][];

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-white p-6 shadow-sm">
        <SectionTitle title="Positionen" />
        <button type="button" onClick={addLibraryPosition} className="inline-flex h-10 items-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-slate-700">
          <Plus className="h-4 w-4" />
          Neue Position
        </button>
      </div>

      <div className="grid gap-4">
        {positions.map((position) => {
          const targetGroupId = targetGroups[position.id] ?? position.groupId ?? groups[0]?.id;
          return (
            <div key={position.id} className="rounded-lg border border-line bg-white p-5 shadow-sm">
              <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
                <div className="grid gap-4">
                  <div className="grid gap-3 md:grid-cols-[1fr_150px_130px_150px]">
                    <Field label="Titel">
                      <TextInput value={position.title} onChange={(event) => updateLibraryPosition(position.id, { title: event.target.value })} />
                    </Field>
                    <Field label="Einheit">
                      <Select value={position.unit} onChange={(event) => updateLibraryPosition(position.id, { unit: event.target.value as Position["unit"] })}>
                        <option>Std.</option>
                        <option>Pauschal</option>
                        <option>Tag</option>
                        <option>Monat</option>
                        <option>Kilometer</option>
                      </Select>
                    </Field>
                    <Field label="Menge">
                      <TextInput
                        type="number"
                        value={position.quantity}
                        onChange={(event) => updateLibraryPosition(position.id, { quantity: Number(event.target.value) })}
                        className="text-right"
                      />
                    </Field>
                    <Field label="Einheitspreis">
                      <TextInput
                        inputMode="decimal"
                        value={formatCurrency(position.unitPrice)}
                        onFocus={(event) => event.target.select()}
                        onChange={(event) => updateLibraryPosition(position.id, { unitPrice: parseEuroInput(event.target.value) })}
                        className="text-right"
                      />
                    </Field>
                  </div>

                  <Field label="Beschreibung">
                    <TextArea value={position.description} onChange={(event) => updateLibraryPosition(position.id, { description: event.target.value })} />
                  </Field>

                  <div className="grid gap-3 md:grid-cols-[180px_1fr_180px_160px]">
                    <Field label="Kategorie">
                      <TextInput value={position.category} onChange={(event) => updateLibraryPosition(position.id, { category: event.target.value })} />
                    </Field>
                    <Field label="Hinweis">
                      <TextInput value={position.note} onChange={(event) => updateLibraryPosition(position.id, { note: event.target.value })} />
                    </Field>
                    <Field label="Status">
                      <Select value={position.status} onChange={(event) => updateLibraryPosition(position.id, { status: event.target.value as Position["status"] })}>
                        <option>Offen</option>
                        <option>Abgestimmt</option>
                        <option>Optional</option>
                        <option>Zurückgestellt</option>
                      </Select>
                    </Field>
                    <Field label="Pflicht">
                      <Select value={position.required ? "Ja" : "Optional"} onChange={(event) => updateLibraryPosition(position.id, { required: event.target.value === "Ja" })}>
                        <option>Ja</option>
                        <option>Optional</option>
                      </Select>
                    </Field>
                  </div>
                </div>

                <div className="grid content-start gap-3 rounded-md border border-line bg-slate-50 p-4">
                  <Field label="Preislogik">
                    <Select value={position.rateKey} onChange={(event) => updateLibraryPosition(position.id, { rateKey: event.target.value as Position["rateKey"] })}>
                      {rateEntries.map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Ziel-Titel">
                    <Select
                      value={targetGroupId}
                      onChange={(event) => setTargetGroups((current) => ({ ...current, [position.id]: event.target.value }))}
                    >
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {groupNumber(groups, group.id)} {group.title}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <button
                    type="button"
                    onClick={() => addLibraryPositionToGroup(position, targetGroupId)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-slate-300"
                  >
                    <Copy className="h-4 w-4" />
                    In Angebot übernehmen
                  </button>
                  <div className="flex items-center justify-between border-t border-line pt-3 text-sm">
                    <span className="text-muted">Positionssumme</span>
                    <span className="font-semibold text-ink">{formatCurrency(positionTotal(position))}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Templates({
  project,
  groups,
  templates,
  profiles,
  updateTemplate,
  overwriteTemplate,
  applyTemplate,
  duplicateTemplate,
  deleteTemplate,
  saveCurrentTemplate
}: {
  project: Project;
  groups: PositionGroup[];
  templates: LvTemplate[];
  profiles: CompanyProfile[];
  updateTemplate: (templateId: string, changes: Partial<Pick<LvTemplate, "name" | "description" | "companyId" | "textFields">>) => void;
  overwriteTemplate: (templateId: string) => void;
  applyTemplate: (templateId: string) => void;
  duplicateTemplate: (templateId: string, targetCompanyId?: Project["companyId"]) => void;
  deleteTemplate: (templateId: string) => void;
  saveCurrentTemplate: (companyId?: Project["companyId"]) => void;
}) {
  const [activeTemplateCompanyId, setActiveTemplateCompanyId] = useState<Project["companyId"]>(project.companyId);
  const activeCompany = profiles.find((profile) => profile.id === activeTemplateCompanyId) ?? profiles[0];
  const activeTemplates = templates.filter((template) => template.companyId === activeCompany.id);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 rounded-lg border border-line bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <SectionTitle title="Angebotsvorlagen" kicker="Texte, Klarstellungen und LV je Firmenprofil" />
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            Hier werden vollständige Angebotsvorlagen je Firmenprofil gespeichert. Eine Vorlage enthält Textbausteine für Inhalt und Angebotsklarstellung
            sowie das passende Leistungsverzeichnis mit Titeln und Positionen.
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Speicherort: Angebotsvorlagen liegen im lokalen Arbeitsstand der App und werden beim JSON-Export mitgesichert. Für die Nutzung auf Vercel muss
            der Arbeitsstand dort einmal als JSON geladen oder später in eine Cloud-Speicherung übernommen werden.
          </p>
        </div>
        <button type="button" onClick={() => saveCurrentTemplate(activeCompany.id)} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-slate-700">
          <Save className="h-4 w-4" />
          Aktuelle Angebotsvorlage speichern
        </button>
      </div>

      <div className="rounded-lg border border-line bg-white p-3 shadow-sm">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {profiles.map((profile) => {
            const count = templates.filter((template) => template.companyId === profile.id).length;
            const active = profile.id === activeCompany.id;
            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => setActiveTemplateCompanyId(profile.id)}
                className={`rounded-md border px-4 py-3 text-center transition ${
                  active ? "border-blue-200 bg-blue-50 text-blue-800" : "border-line bg-white text-ink hover:border-slate-300"
                }`}
              >
                <p className="font-semibold">{profile.name}</p>
                <p className={`mt-1 text-sm ${active ? "text-blue-700" : "text-muted"}`}>{count} Angebotsvorlagen</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4">
        {activeTemplates.length ? (
          activeTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              groups={groups}
              updateTemplate={updateTemplate}
              overwriteTemplate={overwriteTemplate}
              applyTemplate={applyTemplate}
              duplicateTemplate={duplicateTemplate}
              deleteTemplate={deleteTemplate}
              profiles={profiles}
            />
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-line bg-white p-8 text-center">
            <p className="font-semibold text-ink">Noch keine Angebotsvorlagen für {activeCompany.name}</p>
            <p className="mt-2 text-sm text-muted">Speichere das aktuelle Angebot als Vorlage oder kopiere eine bestehende Angebotsvorlage in diesen Tab.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  groups,
  updateTemplate,
  overwriteTemplate,
  applyTemplate,
  duplicateTemplate,
  deleteTemplate,
  profiles
}: {
  template: LvTemplate;
  groups: PositionGroup[];
  updateTemplate: (templateId: string, changes: Partial<Pick<LvTemplate, "name" | "description" | "companyId" | "textFields">>) => void;
  overwriteTemplate: (templateId: string) => void;
  applyTemplate: (templateId: string) => void;
  duplicateTemplate: (templateId: string, targetCompanyId?: Project["companyId"]) => void;
  deleteTemplate: (templateId: string) => void;
  profiles: CompanyProfile[];
}) {
  const templateGroups = activeGroups(template.groups);
  const templatePositions = templateGroups.flatMap((group) => group.positions.filter((position) => position.active));
  const templateTotal = templateGroups.reduce((sum, group) => sum + groupTotal(group), 0);
  const currentTotal = activeGroups(groups).reduce((sum, group) => sum + groupTotal(group), 0);
  const assignedProfile = profiles.find((profile) => profile.id === template.companyId);
  const otherProfiles = profiles.filter((profile) => profile.id !== template.companyId);
  const [targetProfileId, setTargetProfileId] = useState("");

  function moveTemplate() {
    const targetProfile = profiles.find((profile) => profile.id === targetProfileId);
    if (!targetProfile) return;
    if (!window.confirm(`Angebotsvorlage "${template.name}" zu "${targetProfile.name}" verschieben?`)) return;
    updateTemplate(template.id, { companyId: targetProfile.id });
    setTargetProfileId("");
  }

  function copyTemplateToProfile() {
    const targetProfile = profiles.find((profile) => profile.id === targetProfileId);
    if (!targetProfile) return;
    duplicateTemplate(template.id, targetProfile.id);
    setTargetProfileId("");
  }

  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="grid gap-4 xl:grid-cols-[1fr_244px]">
        <div className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-[minmax(280px,0.72fr)_minmax(260px,0.28fr)]">
            <Field label="Vorlagenname">
              <TextInput value={template.name} onChange={(event) => updateTemplate(template.id, { name: event.target.value })} />
            </Field>
            <Field label="Zugeordnet zu">
              <div className="flex min-h-10 items-center justify-center rounded-md border border-line bg-slate-50 px-3 text-sm font-semibold text-ink">
                {assignedProfile?.name ?? "Kein Firmenprofil"}
              </div>
            </Field>
          </div>
          <Field label="Beschreibung">
            <TextArea value={template.description} onChange={(event) => updateTemplate(template.id, { description: event.target.value })} className="min-h-16" />
          </Field>
          <div className="grid gap-2 rounded-md border border-line bg-slate-50 p-2 md:grid-cols-3">
            <div className="flex items-center justify-center gap-2 rounded border border-line bg-white px-3 py-2 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Hauptgruppen</p>
              <p className="text-base font-semibold text-ink">{templateGroups.length}</p>
            </div>
            <div className="flex items-center justify-center gap-2 rounded border border-line bg-white px-3 py-2 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Positionen</p>
              <p className="text-base font-semibold text-ink">{templatePositions.length}</p>
            </div>
            <div className="flex items-center justify-center gap-2 rounded border border-line bg-white px-3 py-2 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Vorlagensumme</p>
              <p className="text-base font-semibold text-ink">{formatCurrency(templateTotal)}</p>
            </div>
          </div>
          <div className="rounded-md border border-line bg-slate-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Textbausteine</p>
                <p className="mt-1 text-sm text-muted">Diese Texte werden beim Laden der Angebotsvorlage in „Neues Angebot“ übernommen.</p>
              </div>
              <span className="rounded border border-line bg-white px-2 py-1 text-xs font-semibold text-muted">
                {Object.values(template.textFields ?? {}).filter((value) => `${value ?? ""}`.trim()).length} Felder gepflegt
              </span>
            </div>
            <div className="mt-3 grid gap-3">
              {offerTemplateTextFieldLabels.map((field) => (
                <Field key={field.key} label={field.label}>
                  <TextArea
                    value={template.textFields?.[field.key] ?? ""}
                    onChange={(event) =>
                      updateTemplate(template.id, {
                        textFields: {
                          ...(template.textFields ?? {}),
                          [field.key]: event.target.value
                        }
                      })
                    }
                    className="min-h-20 bg-white"
                  />
                </Field>
              ))}
            </div>
          </div>
        </div>
        <div className="grid content-start gap-2 rounded-md border border-line bg-slate-50 p-3">
          <button type="button" onClick={() => applyTemplate(template.id)} className="inline-flex h-9 items-center justify-center rounded-md bg-ink px-3 text-sm font-semibold text-white transition hover:bg-slate-700">
            Angebotsvorlage laden
          </button>
          <button type="button" onClick={() => overwriteTemplate(template.id)} className="inline-flex h-9 items-center justify-center rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink transition hover:border-slate-300">
            Mit aktuellem Angebot aktualisieren
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => duplicateTemplate(template.id)} className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink transition hover:border-slate-300">
              <Copy className="h-4 w-4" />
              Duplizieren
            </button>
            <button type="button" onClick={() => deleteTemplate(template.id)} className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink transition hover:border-slate-300">
              <Trash2 className="h-4 w-4" />
              Löschen
            </button>
          </div>
          {otherProfiles.length ? (
            <div className="grid gap-2 border-t border-line pt-2">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Zuordnung ändern</p>
              <Select value={targetProfileId} onChange={(event) => setTargetProfileId(event.target.value)}>
                <option value="">Firmenprofil wählen</option>
                {otherProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </Select>
              <button
                type="button"
                onClick={copyTemplateToProfile}
                disabled={!targetProfileId}
                className="inline-flex h-9 items-center justify-center rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                In anderes Profil kopieren
              </button>
              <button
                type="button"
                onClick={moveTemplate}
                disabled={!targetProfileId}
                className="inline-flex h-9 items-center justify-center rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Zu anderem Profil verschieben
              </button>
            </div>
          ) : null}
          <div className="divide-y divide-line border-t border-line pt-1 text-sm">
            <div className="flex items-center justify-between py-1.5">
              <span className="text-muted">Aktuelles Angebot</span>
              <span className="font-semibold text-ink">{formatCurrency(currentTotal)}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-muted">Gespeichert</span>
              <span className="font-semibold text-ink">{new Date(template.updatedAt).toLocaleDateString("de-DE")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function parseEuroInput(value: string): number {
  const normalized = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function anthropicApiUrl() {
  if (typeof window === "undefined") return "/api/anthropic-lv/";
  const pageBasePaths = ["/SMART-OfferFlow", "/SMART-LV"];
  const basePath = pageBasePaths.find((path) => window.location.pathname.startsWith(path)) ?? "";
  return new URL(`${basePath}/api/anthropic-lv/`, window.location.origin).toString();
}

function isStaticGithubPages() {
  return typeof window !== "undefined" && window.location.hostname.endsWith("github.io");
}

function cleanAnthropicKey(value: string) {
  return value.replace(/\s+/g, "").trim();
}

async function readAnthropicJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("Anthropic-Backend nicht erreichbar. Lokal bitte mit Server starten; GitHub Pages kann keine API-Route ausführen.");
  }
  return (await response.json()) as T;
}

function readableAnthropicError(error: unknown) {
  if (!(error instanceof Error)) return "Anthropic konnte nicht erreicht werden.";
  if (error.message.includes("expected pattern")) {
    return "Der Anthropic-Aufruf konnte nicht gestartet werden. Bitte Key ohne Leerzeichen/Zeilenumbrüche eingeben und lokal mit Backend prüfen.";
  }
  return error.message;
}

function OrderBillingWorkspace({
  project,
  groups,
  orderBilling,
  updateOrderBilling,
  updateInvoicePlanItem,
  updateChangeOrder,
  duplicateChangeOrder,
  deleteChangeOrder,
  updateWorkLog,
  duplicateWorkLog,
  deleteWorkLog
}: {
  project: Project;
  groups: PositionGroup[];
  orderBilling: OrderBilling;
  updateOrderBilling: <K extends keyof OrderBilling>(key: K, value: OrderBilling[K]) => void;
  updateInvoicePlanItem: (itemId: string, changes: Partial<InvoicePlanItem>) => void;
  updateChangeOrder: (itemId: string, changes: Partial<ChangeOrder>) => void;
  duplicateChangeOrder: (itemId: string) => void;
  deleteChangeOrder: (itemId: string) => void;
  updateWorkLog: (itemId: string, changes: Partial<WorkLogItem>) => void;
  duplicateWorkLog: (itemId: string) => void;
  deleteWorkLog: (itemId: string) => void;
}) {
  const [editingChangeOrders, setEditingChangeOrders] = useState<Record<string, boolean>>({});
  const [editingWorkLogs, setEditingWorkLogs] = useState<Record<string, boolean>>({});
  const summary = calculateSummary(groups, project);
  const invoiceTotal = orderBilling.invoicePlan.reduce((sum, item) => sum + item.amount, 0);
  const loggedHours = orderBilling.workLog.filter((item) => item.billable).reduce((sum, item) => sum + item.hours, 0);
  const changeOrderTotal = orderBilling.changeOrders.filter((item) => item.billable).reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Auftragswert netto" value={formatCurrency(summary.net)} detail={orderBilling.orderNumber} tone="accent" />
        <StatCard label="Rechnungsplan" value={formatCurrency(invoiceTotal)} detail={`${orderBilling.invoicePlan.length} Teilrechnungen`} />
        <StatCard label="Nachträge" value={formatCurrency(changeOrderTotal)} detail={`${loggedHours} geplante Leistungsstunden`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
          <SectionTitle title="Auftrag" kicker="Vom Angebot zur Beauftragung" />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="Auftragsnummer">
              <TextInput value={orderBilling.orderNumber} onChange={(event) => updateOrderBilling("orderNumber", event.target.value)} />
            </Field>
            <Field label="Beauftragungsdatum">
              <TextInput value={orderBilling.orderDate} onChange={(event) => updateOrderBilling("orderDate", event.target.value)} />
            </Field>
            <Field label="Leistungszeitraum">
              <TextInput value={orderBilling.servicePeriod} onChange={(event) => updateOrderBilling("servicePeriod", event.target.value)} />
            </Field>
            <Field label="Abrechnungsart">
              <Select value={orderBilling.billingMode} onChange={(event) => updateOrderBilling("billingMode", event.target.value as OrderBilling["billingMode"])}>
                <option>Pauschale</option>
                <option>Nach Aufwand</option>
                <option>Hybrid</option>
              </Select>
            </Field>
          </div>
          <p className="mt-5 rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">
            Aus einem Angebot kann hier ein Auftrag mit Leistungszeitraum, Abrechnungsart, Abschlagsplan, Nachträgen und Leistungsnachweisen geführt werden.
          </p>
        </div>

        <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
          <SectionTitle title="Abrechnungslogik" />
          <div className="mt-5 grid gap-3 text-sm">
            <div className="rounded-md border border-line p-4">
              <p className="font-semibold text-ink">Pauschale</p>
              <p className="mt-1 text-muted">Stunden bleiben intern, extern erscheinen Abschnitts- oder Gesamtsummen.</p>
            </div>
            <div className="rounded-md border border-line p-4">
              <p className="font-semibold text-ink">Nach Aufwand</p>
              <p className="mt-1 text-muted">Abrechnung erfolgt über Leistungsnachweis mit Stunden und Stundensätzen.</p>
            </div>
            <div className="rounded-md border border-line p-4">
              <p className="font-semibold text-ink">Hybrid</p>
              <p className="mt-1 text-muted">Fest definierte Pakete plus variable Nachträge und Erweiterungen.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
        <SectionTitle title="Rechnungsplan" kicker="Abschläge und Schlussrechnung" />
        <div className="mt-5 grid gap-3">
          {orderBilling.invoicePlan.map((item) => (
            <div key={item.id} className="grid gap-3 rounded-lg border border-line p-4 lg:grid-cols-[1fr_120px_160px_150px_140px]">
              <Field label="Rechnung">
                <TextInput value={item.title} onChange={(event) => updateInvoicePlanItem(item.id, { title: event.target.value })} />
              </Field>
              <Field label="Anteil %">
                <TextInput
                  type="number"
                  value={item.percentage}
                  onChange={(event) => updateInvoicePlanItem(item.id, { percentage: Number(event.target.value) })}
                  className="text-right"
                />
              </Field>
              <Field label="Betrag netto">
                <TextInput
                  inputMode="decimal"
                  value={formatCurrency(item.amount)}
                  onFocus={(event) => event.target.select()}
                  onChange={(event) => updateInvoicePlanItem(item.id, { amount: parseEuroInput(event.target.value) })}
                  className="text-right"
                />
              </Field>
              <Field label="Fälligkeit">
                <TextInput value={item.due} onChange={(event) => updateInvoicePlanItem(item.id, { due: event.target.value })} />
              </Field>
              <Field label="Status">
                <Select value={item.status} onChange={(event) => updateInvoicePlanItem(item.id, { status: event.target.value as InvoicePlanItem["status"] })}>
                  <option>Entwurf</option>
                  <option>Offen</option>
                  <option>Bezahlt</option>
                  <option>Überfällig</option>
                </Select>
              </Field>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6">
        <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
          <SectionTitle title="Nachträge" kicker="Nachträgliche Beauftragung" />
          <p className="mt-2 text-sm leading-6 text-muted">
            Nachträge sind zusätzliche Leistungen außerhalb des ursprünglichen Angebots. Sie werden erst abrechnungsrelevant, wenn sie beauftragt oder zur Rechnung markiert sind.
          </p>
          <div className="mt-5 grid gap-3">
            {orderBilling.changeOrders.map((item) => (
              <div key={item.id} className="rounded-lg border border-line p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
                    <input type="checkbox" checked={item.billable} onChange={(event) => updateChangeOrder(item.id, { billable: event.target.checked })} />
                    In Rechnung übernehmen
                  </label>
                  <div className="flex items-center gap-2">
                    <IconButton
                      icon={Edit3}
                      label="Nachtrag bearbeiten"
                      active={editingChangeOrders[item.id] ?? true}
                      onClick={() => setEditingChangeOrders((current) => ({ ...current, [item.id]: !(current[item.id] ?? true) }))}
                    />
                    <IconButton icon={Copy} label="Nachtrag duplizieren" onClick={() => duplicateChangeOrder(item.id)} />
                    <IconButton icon={Trash2} label="Nachtrag löschen" onClick={() => deleteChangeOrder(item.id)} />
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px]">
                  <Field label="Titel">
                    <TextInput disabled={!(editingChangeOrders[item.id] ?? true)} value={item.title} onChange={(event) => updateChangeOrder(item.id, { title: event.target.value })} />
                  </Field>
                  <Field label="Betrag netto">
                    <TextInput
                      disabled={!(editingChangeOrders[item.id] ?? true)}
                      inputMode="decimal"
                      value={formatCurrency(item.amount)}
                      onFocus={(event) => event.target.select()}
                      onChange={(event) => updateChangeOrder(item.id, { amount: parseEuroInput(event.target.value) })}
                      className="text-right"
                    />
                  </Field>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_180px]">
                  <Field label="Beschreibung">
                    <TextArea disabled={!(editingChangeOrders[item.id] ?? true)} value={item.description} onChange={(event) => updateChangeOrder(item.id, { description: event.target.value })} />
                  </Field>
                  <Field label="Status">
                    <Select disabled={!(editingChangeOrders[item.id] ?? true)} value={item.status} onChange={(event) => updateChangeOrder(item.id, { status: event.target.value as ChangeOrder["status"] })}>
                      <option>Vorgeschlagen</option>
                      <option>Beauftragt</option>
                      <option>Abgerechnet</option>
                    </Select>
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
          <SectionTitle title="Leistungsnachweis" kicker="Stunden- und Tätigkeitsnachweis" />
          <p className="mt-2 text-sm leading-6 text-muted">
            Leistungsnachweise dokumentieren erbrachte Stunden oder Tätigkeiten. Sie sind der Nachweis zur Abrechnung nach Aufwand oder zur internen Kontrolle bei Pauschalen.
          </p>
          <div className="mt-5 grid gap-3">
            {orderBilling.workLog.map((item) => (
              <div key={item.id} className="rounded-lg border border-line p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
                    <input type="checkbox" checked={item.billable} onChange={(event) => updateWorkLog(item.id, { billable: event.target.checked })} />
                    In Rechnung übernehmen
                  </label>
                  <div className="flex items-center gap-2">
                    <IconButton
                      icon={Edit3}
                      label="Leistungsnachweis bearbeiten"
                      active={editingWorkLogs[item.id] ?? true}
                      onClick={() => setEditingWorkLogs((current) => ({ ...current, [item.id]: !(current[item.id] ?? true) }))}
                    />
                    <IconButton icon={Copy} label="Leistungsnachweis duplizieren" onClick={() => duplicateWorkLog(item.id)} />
                    <IconButton icon={Trash2} label="Leistungsnachweis löschen" onClick={() => deleteWorkLog(item.id)} />
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_120px_180px]">
                  <Field label="Position">
                    <TextInput disabled={!(editingWorkLogs[item.id] ?? true)} value={item.positionTitle} onChange={(event) => updateWorkLog(item.id, { positionTitle: event.target.value })} />
                  </Field>
                  <Field label="Stunden">
                    <TextInput
                      disabled={!(editingWorkLogs[item.id] ?? true)}
                      type="number"
                      value={item.hours}
                      onChange={(event) => updateWorkLog(item.id, { hours: Number(event.target.value) })}
                      className="text-right"
                    />
                  </Field>
                  <Field label="Status">
                    <Select disabled={!(editingWorkLogs[item.id] ?? true)} value={item.status} onChange={(event) => updateWorkLog(item.id, { status: event.target.value as WorkLogItem["status"] })}>
                      <option>Geplant</option>
                      <option>In Arbeit</option>
                      <option>Abgenommen</option>
                    </Select>
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AiAssistant({
  project,
  groups,
  updatePosition,
  replaceGroupsFromAi,
  setActiveView
}: {
  project: Project;
  groups: PositionGroup[];
  updatePosition: (groupId: string, positionId: string, changes: Partial<Position>) => void;
  replaceGroupsFromAi: (groups: PositionGroup[]) => void;
  setActiveView: (view: View) => void;
}) {
  const [lvPrompt, setLvPrompt] = useState(
    "Erstelle ein professionelles LV fuer eine KI-gestuetzte Angebots-, Auftrags- und Abrechnungsplattform mit Dashboard, LV-Editor, Angebotsvorschau, PDF-Ausgabe, Nachtraegen, Leistungsnachweisen und Rechnungsplan."
  );
  const [generatedGroups, setGeneratedGroups] = useState<PositionGroup[] | null>(null);
  const [generationStatus, setGenerationStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [generationMessage, setGenerationMessage] = useState("");
  const [anthropicKey, setAnthropicKey] = useState(() =>
    typeof window === "undefined" ? "" : window.localStorage.getItem("smart-offerflow-anthropic-key") ?? ""
  );
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<"idle" | "checking" | "valid" | "error" | "saved">("idle");
  const [keyMessage, setKeyMessage] = useState("");
  const aiGroups = activeGroups(groups).filter((group) =>
    [group.title, group.intro, ...group.positions.map((position) => `${position.title} ${position.description} ${position.category}`)]
      .join(" ")
      .toLowerCase()
      .includes("ki")
  );
  const aiPositions = aiGroups.flatMap((group) => group.positions.filter((position) => position.active));
  const suggestedHours = aiPositions.reduce((sum, position) => sum + position.quantity, 0);
  const canUseAnthropicBackend = !isStaticGithubPages();

  async function generateLvWithAnthropic() {
    setGenerationStatus("loading");
    setGenerationMessage("");
    setGeneratedGroups(null);

    try {
      if (isStaticGithubPages()) {
        throw new Error("LV-Generierung mit Anthropic braucht ein Server-Backend. GitHub Pages kann diese API nicht ausführen.");
      }
      const cleanedKey = cleanAnthropicKey(anthropicKey);
      const response = await fetch(anthropicApiUrl(), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ project, prompt: lvPrompt, apiKey: cleanedKey || undefined })
      });
      const result = await readAnthropicJson<{ groups?: PositionGroup[]; error?: string }>(response);
      if (!response.ok || !result.groups?.length) {
        throw new Error(result.error || "Es wurde kein gueltiges LV erzeugt.");
      }
      setGeneratedGroups(result.groups);
      setGenerationStatus("ready");
      setGenerationMessage(`${result.groups.length} Leistungsbereiche wurden generiert.`);
    } catch (error) {
      setGenerationStatus("error");
      setGenerationMessage(readableAnthropicError(error));
    }
  }

  function saveAnthropicKey() {
    const trimmed = cleanAnthropicKey(anthropicKey);
    if (!trimmed) {
      setKeyStatus("error");
      setKeyMessage("Bitte zuerst einen Anthropic-Key eingeben.");
      return;
    }
    window.localStorage.setItem("smart-offerflow-anthropic-key", trimmed);
    setAnthropicKey(trimmed);
    setKeyStatus("saved");
    setKeyMessage("Key wurde lokal gespeichert.");
  }

  function deleteAnthropicKey() {
    window.localStorage.removeItem("smart-offerflow-anthropic-key");
    setAnthropicKey("");
    setShowAnthropicKey(false);
    setKeyStatus("idle");
    setKeyMessage("Key wurde geloescht.");
  }

  async function checkAnthropicKey() {
    const trimmed = cleanAnthropicKey(anthropicKey);
    if (!trimmed) {
      setKeyStatus("error");
      setKeyMessage("Bitte zuerst einen Anthropic-Key eingeben.");
      return;
    }

    setKeyStatus("checking");
    setKeyMessage("");
    try {
      if (isStaticGithubPages()) {
        throw new Error("Key-Prüfung braucht ein Server-Backend. GitHub Pages kann diese API nicht ausführen.");
      }
      const response = await fetch(anthropicApiUrl(), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ apiKey: trimmed, mode: "check" })
      });
      const result = await readAnthropicJson<{ ok?: boolean; error?: string }>(response);
      if (!response.ok || !result.ok) throw new Error(result.error || "Key konnte nicht verifiziert werden.");
      setKeyStatus("valid");
      setKeyMessage("Key ist gueltig.");
    } catch (error) {
      setKeyStatus("error");
      setKeyMessage(readableAnthropicError(error));
    }
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-6 shadow-sm">
        <SectionTitle title="KI-Assistenz" kicker="Regelbasierte erste Version" />
        <p className="mt-3 max-w-4xl text-sm leading-6 text-blue-900">
          Diese Version arbeitet lokal mit Regeln und Projektkontext. Sie markiert relevante KI-Leistungen, erzeugt Textvorschläge,
          prüft fehlende Bausteine und hilft bei Aufwand, Risiken und Abrechnung. Eine echte Modell-API kann später an dieselbe Stelle angeschlossen werden.
        </p>
      </div>

      <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
        <SectionTitle title="LV mit Anthropic generieren" kicker="Claude-Anbindung" />
        <p className="mt-3 text-sm leading-6 text-muted">
          Die Generierung nutzt serverseitig die Anthropic Messages API. Lokal oder auf einem Server muss dafuer `ANTHROPIC_API_KEY`
          gesetzt sein; auf GitHub Pages kann der geheime Schluessel nicht sicher ausgefuehrt werden.
        </p>
        <p className={`mt-3 rounded-md border px-3 py-2 text-sm ${canUseAnthropicBackend ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-amber-100 bg-amber-50 text-amber-800"}`}>
          {canUseAnthropicBackend
            ? "Anthropic-Backend ist in dieser Umgebung erreichbar."
            : "Server-Backend erforderlich: Auf GitHub Pages koennen Key-Pruefung und LV-Generierung nicht ausgefuehrt werden."}
        </p>
        <div className="mt-5 grid gap-3 rounded-lg border border-line bg-slate-50 p-4">
          <Field label="Anthropic API-Key">
            <div className="grid gap-2 lg:grid-cols-[1fr_auto_auto_auto_auto]">
              <TextInput
                type={showAnthropicKey ? "text" : "password"}
                value={anthropicKey}
                onChange={(event) => {
                  setAnthropicKey(event.target.value);
                  setKeyStatus("idle");
                  setKeyMessage("");
                }}
                placeholder="sk-ant-..."
              />
              <IconButton
                icon={showAnthropicKey ? EyeOff : Eye}
                label={showAnthropicKey ? "Key verbergen" : "Key anzeigen"}
                onClick={() => setShowAnthropicKey((current) => !current)}
              />
              <IconButton icon={Trash2} label="Key löschen" onClick={deleteAnthropicKey} disabled={!anthropicKey} />
              <button type="button" onClick={saveAnthropicKey} className="h-10 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-slate-300">
                Key speichern
              </button>
              <button
                type="button"
                onClick={checkAnthropicKey}
                disabled={keyStatus === "checking" || !canUseAnthropicBackend}
                className="h-10 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {keyStatus === "checking" ? "Pruefe..." : "Key ueberpruefen"}
              </button>
            </div>
          </Field>
          {keyMessage ? (
            <p className={`text-sm ${keyStatus === "error" ? "text-rose-700" : keyStatus === "valid" ? "text-emerald-700" : "text-muted"}`}>
              {keyMessage}
            </p>
          ) : null}
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_280px]">
          <Field label="Anforderung an das neue LV">
            <TextArea value={lvPrompt} onChange={(event) => setLvPrompt(event.target.value)} className="min-h-32" />
          </Field>
          <div className="grid content-start gap-3">
            <button
              type="button"
              onClick={generateLvWithAnthropic}
              disabled={generationStatus === "loading" || !canUseAnthropicBackend}
              className="inline-flex h-10 items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generationStatus === "loading" ? "Generiere..." : "LV generieren"}
            </button>
            {generatedGroups ? (
              <button
                type="button"
                onClick={() => replaceGroupsFromAi(generatedGroups)}
                className="inline-flex h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-slate-300"
              >
                Generiertes LV uebernehmen
              </button>
            ) : null}
            {generationMessage ? (
              <p className={`rounded-md border px-3 py-2 text-sm ${generationStatus === "error" ? "border-rose-100 bg-rose-50 text-rose-800" : "border-emerald-100 bg-emerald-50 text-emerald-800"}`}>
                {generationMessage}
              </p>
            ) : null}
          </div>
        </div>
        {generatedGroups ? (
          <div className="mt-5 rounded-lg border border-line bg-slate-50 p-4">
            <p className="text-sm font-semibold text-ink">Vorschau der generierten Struktur</p>
            <div className="mt-3 grid gap-2 text-sm">
              {generatedGroups.map((group) => (
                <div key={group.id} className="flex items-center justify-between rounded-md bg-white px-3 py-2">
                  <span className="font-medium text-ink">{group.title}</span>
                  <span className="text-muted">{group.positions.length} Positionen</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="KI-relevante Positionen" value={String(aiPositions.length)} detail={`${suggestedHours} kalkulierte Stunden`} tone="accent" align="center" />
        <StatCard label="Empfohlene Abrechnung" value="Hybrid" detail="Pauschale Basis plus Nachträge" align="center" />
        <StatCard label="Projektfokus" value="Angebots-KI" detail={project.client} align="center" />
      </div>

      <div className="grid gap-6">
        <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
          <SectionTitle title="KI-Leistungsvorschläge" />
          <div className="mt-5 grid gap-3">
            {aiPositions.map((position) => (
              <div key={position.id} className="rounded-lg border border-line p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-muted">{positionNumber(groups, position.groupId, position.id)}</p>
                    <h3 className="mt-1 font-semibold text-ink">{position.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">{position.description}</p>
                  </div>
                  <p className="shrink-0 rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-ink">{formatCurrency(positionTotal(position))}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updatePosition(position.groupId, position.id, {
                        note: "KI-relevant: Anforderungen, Datenqualität, Prompt-Verhalten und Abnahmekriterien gesondert prüfen."
                      })
                    }
                    className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink"
                  >
                    KI-Hinweis übernehmen
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePosition(position.groupId, position.id, { quantity: Math.ceil(position.quantity * 1.15) })}
                    className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink"
                  >
                    Risikoaufschlag +15 %
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
          <SectionTitle title="Textvorschlag" />
          <p className="mt-4 text-sm leading-7 text-muted">
            Für das Projekt <strong className="text-ink">{project.projectName}</strong> empfiehlt die Assistenz eine hybride Kalkulation:
            transparente interne Stundenplanung, extern wahlweise Abschnittspauschalen und gesondert beauftragbare KI-Erweiterungen.
            Besonders prüfungsrelevant sind Datenquellen, Antwortqualität, Rechtekonzept, Prompt-Verhalten und Abnahmekriterien.
          </p>
        </div>

        <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
          <SectionTitle title="Prüfpunkte" />
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            {["Datenquellen und Nutzungsrechte klären", "Halluzinationsrisiken und Freigaben definieren", "RAG-Qualität mit Testfragen messen", "Abrechnung von Nachträgen vorsehen", "Betrieb, Monitoring und Support kalkulieren"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-md border border-line px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-medium text-ink">{item}</span>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setActiveView("LV bearbeiten")} className="mt-5 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white">
            Zum LV-Editor
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({ project, updateProject }: { project: Project; updateProject: <K extends keyof Project>(key: K, value: Project[K]) => void }) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
        <SectionTitle title="Stundensätze" />
        <div className="mt-6 grid gap-4">
          {(Object.keys(project.rates) as Array<keyof Project["rates"]>).map((key) => (
            <Field key={key} label={rateLabels[key]}>
              <TextInput
                type="number"
                value={project.rates[key]}
                onChange={(event) => updateProject("rates", { ...project.rates, [key]: Number(event.target.value) })}
              />
            </Field>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
        <SectionTitle title="Erweiterungen" />
        <div className="mt-6 grid gap-3">
          {["Login und Rollenverwaltung", "Cloud-Speicherung", "Stripe-Lizenzmodell", "PDF- und DOCX-Service", "Profil- und Kundenrechte"].map((item) => (
            <div key={item} className="flex items-center justify-between rounded-md border border-line px-4 py-3 text-sm">
              <span className="font-medium text-ink">{item}</span>
              <span className="text-muted">vorbereitet</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
