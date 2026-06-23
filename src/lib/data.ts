import { CompanyProfile, OrderBilling, PositionGroup, Project, RateCard } from "./types";

export const standardRates: RateCard = {
  strategy: 250,
  concept: 250,
  project: 220,
  ux: 180,
  development: 180,
  ai: 220,
  prompt: 220,
  deployment: 180,
  training: 220,
  support: 180
};

export const rateLabels: Record<keyof RateCard, string> = {
  strategy: "Strategische Beratung und Prozessanalyse",
  concept: "Fachkonzept und KI-Konzeption",
  project: "Projektleitung",
  ux: "UX/UI-Konzeption",
  development: "Softwareentwicklung",
  ai: "KI-Implementierung",
  prompt: "Prompt Engineering",
  deployment: "Deployment",
  training: "Schulung",
  support: "Support"
};

export const defaultAssignmentReason =
  "Die nachfolgend angebotenen Leistungen basieren auf den bislang geführten Gesprächen sowie den derzeit bekannten Projektanforderungen. Ziel ist die professionelle Unterstützung des Auftraggebers bei der Analyse, Steuerung, Bewertung und Umsetzung der vereinbarten Aufgabenstellungen.";

export const defaultServiceDirectoryIntro =
  "Die nachfolgende Darstellung weist Mengen, Einheiten, Einzelpreise und Positionssummen transparent aus. Alternativ kann dieselbe interne Kalkulation als Abschnittspauschale angeboten werden, wenn einzelne Preisansätze im Angebot nicht offengelegt werden sollen.";

export const defaultServiceScope =
  "Die Leistungen werden als unabhängige Beratungs-, Steuerungs-, Analyse- und Unterstützungsleistungen erbracht. Der konkrete Umfang richtet sich nach den Anforderungen des Projekts und den jeweils abgestimmten Leistungsabrufen.";

export const defaultServiceExclusion =
  "Nicht ausdrücklich aufgeführte Leistungen sind nicht Bestandteil dieses Angebots und bedürfen einer gesonderten Beauftragung.";

export const defaultMeetingBillingNote =
  "Projektbesprechungen, Workshops, Baustellenbegehungen, Jour-fixe-Termine sowie sonstige Vor-Ort-Einsätze werden nach tatsächlichem Aufwand gemäß den vereinbarten Vergütungssätzen abgerechnet.";

export const defaultChangeTerms =
  "Änderungen, Ergänzungen oder Erweiterungen des vereinbarten Leistungsumfangs werden nach vorheriger Abstimmung gesondert vergütet.";

export const defaultContractBasis =
  "Die Leistungserbringung erfolgt auf Grundlage dieses Angebots sowie der Allgemeinen Geschäftsbedingungen von Metzger - Real Estate Advisory. Die AGB sind abrufbar unter: https://www.metzger-rea.de/agb. Mit Auftragserteilung erkennt der Auftraggeber diese als Vertragsbestandteil an.";

export const defaultValidityText =
  "Dieses Angebot ist 30 Kalendertage ab Angebotsdatum gültig. Danach behalten wir uns eine Anpassung aufgrund geänderter Rahmenbedingungen vor.";

export const defaultOfferBasis =
  "Dieses Angebot basiert auf den zum Zeitpunkt der Angebotserstellung vorliegenden Informationen und Rahmenbedingungen. Änderungen des Leistungsumfangs, der Projektanforderungen oder sonstiger wesentlicher Rahmenbedingungen können eine Anpassung des Angebots erforderlich machen.";

export const defaultAcceptanceText =
  "Mit Unterzeichnung dieses Angebots beauftragt der Auftraggeber die beschriebenen Leistungen zu den genannten Konditionen.";

export const companyProfiles: CompanyProfile[] = [
  {
    id: "builtsmart-hub",
    name: "BuiltSmart Hub",
    logoText: "BSH",
    address: "BuiltSmart Hub GmbH, Musterstraße 12, 70173 Stuttgart",
    email: "angebote@builtsmart-hub.de",
    phone: "+49 711 000 000",
    website: "www.builtsmart-hub.de",
    agbUrl: "https://www.builtsmart-hub.de/agb",
    bookingUrl: "https://www.builtsmart-hub.de/termin",
    vatId: "DE000000001",
    bank: "IBAN DE00 0000 0000 0000 0000 01, BIC BUILDEFF",
    contact: "Bernhard Metzger",
    footer: "BuiltSmart Hub verbindet digitale Immobilienprozesse, Beratung und umsetzungsstarke Technologieprojekte.",
    liability: "Alle Leistungsangaben verstehen sich vorbehaltlich finaler technischer Prüfung und abgestimmter Mitwirkungspflichten.",
    offerText: "Wir strukturieren das Vorhaben so, dass fachliche Anforderungen, technische Architektur und wirtschaftliche Zielsetzung sauber ineinandergreifen.",
    colors: { primary: "#35516B", secondary: "#E8EDF2", accent: "#6D879F" },
    exportLayout: "Seriöses Blau-Grau-Layout mit klarer Angebotsgliederung"
  },
  {
    id: "builtsmart-ai",
    name: "BuiltSmart AI",
    logoText: "BSAI",
    address: "BuiltSmart AI GmbH, KI-Allee 8, 80331 München",
    email: "hello@builtsmart-ai.de",
    phone: "+49 89 000 000",
    website: "www.builtsmart-ai.de",
    agbUrl: "https://www.builtsmart-ai.de/agb",
    bookingUrl: "https://www.builtsmart-ai.de/termin",
    vatId: "DE000000002",
    bank: "IBAN DE00 0000 0000 0000 0000 02, BIC BSAIDEFF",
    contact: "AI Delivery Team",
    footer: "BuiltSmart AI entwickelt produktive KI-Anwendungen mit belastbarer Architektur, klarer Nutzerführung und messbarem Nutzen.",
    liability: "KI-Ausgaben werden durch geeignete Prüf-, Logging- und Freigabemechanismen abgesichert; produktive Nutzung erfolgt nach gemeinsam definierten Qualitätskriterien.",
    offerText: "Die Lösung wird auf robuste KI-Workflows, transparente Wissensquellen und eine anwenderfreundliche Oberfläche ausgerichtet.",
    colors: { primary: "#527DF6", secondary: "#EAF0FF", accent: "#13B8A7" },
    exportLayout: "Modernes KI-SaaS-Layout mit blauem Akzent"
  },
  {
    id: "metzger-real-estate",
    name: "Metzger - Real Estate Advisory",
    logoText: "MREA",
    address: "Metzger Real Estate Advisory, Königsallee 22, 40212 Düsseldorf",
    email: "metzger@metzger-rea.de",
    phone: "+49 162 7111 911",
    website: "www.metzger-rea.de",
    agbUrl: "https://www.metzger-rea.de/agb",
    bookingUrl: "https://www.metzger-rea.de/termin",
    vatId: "DE000000003",
    bank: "Kontoinhaber Bernhard Metzger, IBAN DE00 0000 0000 0000 0000 03, BIC MREADDE",
    contact: "Bernhard Metzger",
    footer: "Metzger Real Estate Advisory steht für präzise Analyse, belastbare Entscheidungen und digitale Exzellenz in Immobilienprojekten.",
    liability: "Dieses Angebot basiert auf den zum Angebotszeitpunkt bekannten Rahmenbedingungen und ersetzt keine rechtliche oder steuerliche Prüfung.",
    offerText: "Die Leistungen werden mit besonderem Blick auf belastbare Immobilienprozesse, Entscheidungsqualität und nachhaltige Betriebsfähigkeit strukturiert.",
    colors: { primary: "#FFF200", secondary: "#EEF0F2", accent: "#9C7A42" },
    exportLayout: "Zurückhaltendes Business-Layout mit hochwertigem Akzent"
  },
  {
    id: "custom",
    name: "Freies Firmenprofil",
    logoText: "PRO",
    address: "Musterfirma GmbH, Beispielweg 5, 10115 Berlin",
    email: "angebot@musterfirma.de",
    phone: "+49 30 000 000",
    website: "www.musterfirma.de",
    agbUrl: "https://www.musterfirma.de/agb",
    bookingUrl: "https://www.musterfirma.de/termin",
    vatId: "DE000000004",
    bank: "IBAN DE00 0000 0000 0000 0000 04, BIC FREEDEFF",
    contact: "Projektteam",
    footer: "Individuell konfigurierbares Firmenprofil für weitere Marken, Geschäftsbereiche oder Angebotslinien.",
    liability: "Standard-Haftungshinweise können je Firmenprofil angepasst und in Exporte übernommen werden.",
    offerText: "Auf Basis der Anforderungen erstellen wir ein transparentes Leistungsbild mit klarer Kalkulation und nachvollziehbarer Umsetzungslogik.",
    colors: { primary: "#1F7A6D", secondary: "#E9F4F1", accent: "#E08D3C" },
    exportLayout: "Flexibles Layout mit frei konfigurierbaren Farben"
  }
];

export const sampleProject: Project = {
  id: "offer-ki-2026-001",
  companyId: "builtsmart-ai",
  client: "Musterbau Immobilien GmbH",
  contactPerson: "Dr. Julia Hartmann",
  projectName: "KI-gestützte Angebotsplattform",
  shortDescription: "Konzeption und Entwicklung einer KI-Anwendung zur strukturierten Auswertung, Angebotserstellung und Angebotsvorbereitung.",
  offerIntro: "Die Lösung wird auf robuste KI-Workflows, transparente Wissensquellen und eine anwenderfreundliche Oberfläche ausgerichtet.",
  assignmentReason: defaultAssignmentReason,
  serviceScope: defaultServiceScope,
  serviceDirectoryIntro: defaultServiceDirectoryIntro,
  serviceExclusion: defaultServiceExclusion,
  meetingBillingNote: defaultMeetingBillingNote,
  changeTerms: defaultChangeTerms,
  contractBasis: defaultContractBasis,
  validityText: defaultValidityText,
  offerClarification: defaultOfferBasis,
  acceptanceText: defaultAcceptanceText,
  objective:
    "Ziel ist eine leistungsfähige, anwenderfreundliche und zukunftsfähige Lösung, die wiederkehrende Arbeitsabläufe beschleunigt, Informationen konsolidiert und fundierte Entscheidungen unterstützt.",
  technicalContext:
    "Webbasierte Anwendung mit rollenfähiger Architektur, vorbereiteter Cloud-Speicherung, RAG-Komponenten, API-Anbindungen, Firmenprofilen und Kundendatenbank.",
  modules: ["Projekt-Dashboard", "Dokumenten-KI", "Angebotsassistenz", "Workflow-Automation", "Export-Center"],
  calculationType: "Hybrid",
  status: "Entwurf",
  offerNumber: "BSAI-2026-001",
  offerDate: "2026-06-23",
  validUntil: "30 Tage ab Angebotsdatum",
  paymentTerms: "Rechnungen sind innerhalb von 14 Kalendertagen nach Rechnungsstellung ohne Abzug zur Zahlung fällig.",
  vatRate: 19,
  discountPercent: 0,
  skontoPercent: 0,
  skontoDays: 10,
  flatFee: null,
  rates: standardRates
};

export const sampleOrderBilling: OrderBilling = {
  orderNumber: "AB-2026-001",
  orderDate: "2026-06-20",
  servicePeriod: "Juli bis Oktober 2026",
  billingMode: "Hybrid",
  invoicePlan: [
    { id: "inv-1", title: "Abschlag bei Beauftragung", percentage: 40, amount: 40464, due: "bei Auftragserteilung", status: "Entwurf" },
    { id: "inv-2", title: "Abschlag nach Beta-Bereitstellung", percentage: 40, amount: 40464, due: "nach Beta-Version", status: "Entwurf" },
    { id: "inv-3", title: "Schlussrechnung nach Abnahme", percentage: 20, amount: 20232, due: "nach Abnahme", status: "Entwurf" }
  ],
  changeOrders: [
    {
      id: "co-1",
      title: "Zusätzliche Datenquelle anbinden",
      description: "Optionale Erweiterung für weitere Dokumenten- oder Fachsystemquellen nach technischer Prüfung.",
      amount: 3600,
      status: "Vorgeschlagen",
      billable: false
    }
  ],
  workLog: [
    { id: "wl-1", positionTitle: "Kick-off-Workshop", hours: 6, status: "Geplant", billable: true },
    { id: "wl-2", positionTitle: "Daten- und KI-Konzept", hours: 18, status: "Geplant", billable: true },
    { id: "wl-3", positionTitle: "Prompt Engineering", hours: 18, status: "Geplant", billable: true }
  ]
};

const description = {
  kickOff:
    "Strukturierter Auftakt zur Klärung von Zielbild, Stakeholdern, Entscheidungswegen, Datenlage, Erfolgskriterien und Projektorganisation.",
  concept:
    "Ausarbeitung eines belastbaren Fachkonzepts mit priorisierten Anwendungsfällen, Nutzerrollen, Prozesslogik, Datenflüssen und Abnahmekriterien.",
  architecture:
    "Definition der Zielarchitektur inklusive Frontend, Backend, Schnittstellen, Datenhaltung, KI-Komponenten, Sicherheitsmodell und Betriebsoptionen.",
  rag:
    "Aufbau einer retrieval-gestützten Wissensbasis mit Dokumentenaufnahme, Chunking-Strategie, Metadatenmodell, Suchlogik und Qualitätssicherung.",
  workflows:
    "Konzeption und Umsetzung automatisierter Abläufe, die manuelle Prozessschritte reduzieren und die Bearbeitung nachvollziehbar dokumentieren."
};

export const initialGroups: PositionGroup[] = [
  {
    id: "analysis",
    title: "Analyse und Konzeption",
    intro: "Grundlage für ein belastbares Projektverständnis, klare Prioritäten und eine wirtschaftlich sinnvolle Umsetzungsplanung.",
    active: true,
    positions: [
      { id: "p-001", groupId: "analysis", number: "1.1", title: "Kick-off-Workshop", description: description.kickOff, unit: "Std.", quantity: 6, rateKey: "strategy", unitPrice: 250, category: "Analyse", required: true, note: "Vor Ort oder remote möglich", status: "Offen", active: true },
      { id: "p-002", groupId: "analysis", number: "1.2", title: "Prozessanalyse", description: "Analyse bestehender Arbeitsabläufe, Medienbrüche, Rollen, Entscheidungspunkte und Automatisierungspotenziale.", unit: "Std.", quantity: 14, rateKey: "strategy", unitPrice: 250, category: "Analyse", required: true, note: "", status: "Offen", active: true },
      { id: "p-003", groupId: "analysis", number: "1.3", title: "Fachkonzept", description: description.concept, unit: "Std.", quantity: 18, rateKey: "concept", unitPrice: 250, category: "Konzeption", required: true, note: "", status: "Offen", active: true }
    ]
  },
  {
    id: "technical",
    title: "Technische Konzeption",
    intro: "Technische Übersetzung der fachlichen Anforderungen in eine robuste, erweiterbare und integrationsfähige Lösungsarchitektur.",
    active: true,
    positions: [
      { id: "p-004", groupId: "technical", number: "2.1", title: "Systemarchitektur", description: description.architecture, unit: "Std.", quantity: 16, rateKey: "concept", unitPrice: 250, category: "Architektur", required: true, note: "", status: "Offen", active: true },
      { id: "p-005", groupId: "technical", number: "2.2", title: "Daten- und KI-Konzept", description: "Definition von Datenquellen, KI-Modellen, Prompt-Strategien, Retrieval-Logik, Governance und Prüfmechanismen.", unit: "Std.", quantity: 18, rateKey: "ai", unitPrice: 220, category: "KI-Konzept", required: true, note: "", status: "Offen", active: true },
      { id: "p-006", groupId: "technical", number: "2.3", title: "API- und Integrationskonzept", description: "Spezifikation relevanter Schnittstellen, Authentifizierung, Datenverträge, Fehlerfälle und Monitoring-Anforderungen.", unit: "Std.", quantity: 10, rateKey: "development", unitPrice: 180, category: "Integration", required: false, note: "Abhängig von Drittsystemen", status: "Optional", active: true }
    ]
  },
  {
    id: "uxui",
    title: "UX/UI-Design",
    intro: "Nutzerzentrierte Gestaltung der Anwendung mit klarer Informationsarchitektur, effizienter Bedienung und hochwertiger Oberfläche.",
    active: true,
    positions: [
      { id: "p-007", groupId: "uxui", number: "3.1", title: "UX-Konzept", description: "Erarbeitung von Nutzerflüssen, Navigationsstruktur, Formularlogik, Zuständen und Interaktionsmustern.", unit: "Std.", quantity: 14, rateKey: "ux", unitPrice: 180, category: "UX/UI", required: true, note: "", status: "Offen", active: true },
      { id: "p-008", groupId: "uxui", number: "3.2", title: "UI-Design", description: "Gestaltung moderner Screens, Komponenten, Tabellen, Dashboards und Vorschauflächen im abgestimmten Corporate Design.", unit: "Std.", quantity: 22, rateKey: "ux", unitPrice: 180, category: "UX/UI", required: true, note: "", status: "Offen", active: true }
    ]
  },
  {
    id: "development",
    title: "Softwareentwicklung",
    intro: "Umsetzung der Anwendung mit modularer Codebasis, sauberer Komponentenstruktur und vorbereiteter Erweiterbarkeit.",
    active: true,
    positions: [
      { id: "p-009", groupId: "development", number: "4.1", title: "Frontend-Entwicklung", description: "Entwicklung der webbasierten Nutzeroberfläche inklusive Dashboard, Formularen, Tabellen, Vorschau und responsiver Bedienung.", unit: "Std.", quantity: 48, rateKey: "development", unitPrice: 180, category: "Entwicklung", required: true, note: "", status: "Offen", active: true },
      { id: "p-010", groupId: "development", number: "4.2", title: "Backend-Entwicklung", description: "Implementierung von Datenmodellen, Angebotslogik, Speicherstruktur, API-Schichten und vorbereiteter Nutzerverwaltung.", unit: "Std.", quantity: 52, rateKey: "development", unitPrice: 180, category: "Entwicklung", required: true, note: "", status: "Offen", active: true },
      { id: "p-011", groupId: "development", number: "4.3", title: "API-Integration", description: "Anbindung externer Dienste und interner Schnittstellen inklusive Authentifizierung, Fehlerbehandlung und Protokollierung.", unit: "Std.", quantity: 20, rateKey: "development", unitPrice: 180, category: "Integration", required: false, note: "", status: "Optional", active: true }
    ]
  },
  {
    id: "ai",
    title: "KI-Implementierung",
    intro: "Produktive KI-Komponenten mit nachvollziehbarer Quellenlogik, fachlich kontrollierten Prompts und belastbaren Workflows.",
    active: true,
    positions: [
      { id: "p-012", groupId: "ai", number: "5.1", title: "Prompt Engineering", description: "Entwicklung, Test und Dokumentation robuster System- und Aufgabenprompts für die priorisierten Anwendungsfälle.", unit: "Std.", quantity: 18, rateKey: "prompt", unitPrice: 220, category: "KI", required: true, note: "", status: "Offen", active: true },
      { id: "p-013", groupId: "ai", number: "5.2", title: "RAG-System", description: description.rag, unit: "Std.", quantity: 34, rateKey: "ai", unitPrice: 220, category: "KI", required: true, note: "", status: "Offen", active: true },
      { id: "p-014", groupId: "ai", number: "5.3", title: "KI-Agentenlogik", description: "Entwicklung agentischer Ablaufsteuerung für Recherche, Bewertung, Textgenerierung und Übergabe an definierte Folgeprozesse.", unit: "Std.", quantity: 28, rateKey: "ai", unitPrice: 220, category: "KI", required: false, note: "Optional je Automatisierungstiefe", status: "Optional", active: true },
      { id: "p-015", groupId: "ai", number: "5.4", title: "Automatisierte Workflows", description: description.workflows, unit: "Std.", quantity: 24, rateKey: "ai", unitPrice: 220, category: "Workflow", required: false, note: "", status: "Optional", active: true }
    ]
  },
  {
    id: "qa",
    title: "Qualitätssicherung",
    intro: "Systematische Prüfung von Funktionalität, KI-Ausgaben, Nutzerflüssen und Betriebsfähigkeit vor produktiver Nutzung.",
    active: true,
    positions: [
      { id: "p-016", groupId: "qa", number: "6.1", title: "Funktionstests", description: "Planung und Durchführung funktionaler Tests für Kernprozesse, Rollen, Formulare, Berechnungen und Schnittstellen.", unit: "Std.", quantity: 20, rateKey: "development", unitPrice: 180, category: "Qualität", required: true, note: "", status: "Offen", active: true },
      { id: "p-017", groupId: "qa", number: "6.2", title: "Praxistests", description: "Begleitete Tests mit realistischen Anwendungsfällen, Auswertung von Rückmeldungen und Priorisierung notwendiger Anpassungen.", unit: "Std.", quantity: 16, rateKey: "project", unitPrice: 220, category: "Qualität", required: true, note: "", status: "Offen", active: true }
    ]
  },
  {
    id: "deployment",
    title: "Deployment und Inbetriebnahme",
    intro: "Bereitstellung der Lösung in einer abgestimmten Umgebung inklusive Konfiguration, Übergabe und Startbegleitung.",
    active: true,
    positions: [
      { id: "p-018", groupId: "deployment", number: "7.1", title: "Deployment", description: "Einrichtung der Zielumgebung, Build-Konfiguration, Umgebungsvariablen, Deployment-Prozess und technische Abnahme.", unit: "Std.", quantity: 14, rateKey: "deployment", unitPrice: 180, category: "Deployment", required: true, note: "", status: "Offen", active: true },
      { id: "p-019", groupId: "deployment", number: "7.2", title: "Domain- und Hostingkonfiguration", description: "Konfiguration von Domain, DNS, Hosting, SSL, grundlegender Sicherheit und Betriebsparametern.", unit: "Std.", quantity: 8, rateKey: "deployment", unitPrice: 180, category: "Deployment", required: false, note: "Externe Hostingkosten nicht enthalten", status: "Optional", active: true }
    ]
  },
  {
    id: "training",
    title: "Schulung und Einführung",
    intro: "Strukturierte Einführung für Anwender und Administratoren, damit die Lösung sicher und effizient genutzt werden kann.",
    active: true,
    positions: [
      { id: "p-020", groupId: "training", number: "8.1", title: "Anwenderdokumentation", description: "Erstellung einer verständlichen Dokumentation für zentrale Arbeitsabläufe, Rollen, KI-Funktionen und typische Nutzungsszenarien.", unit: "Std.", quantity: 12, rateKey: "training", unitPrice: 220, category: "Schulung", required: true, note: "", status: "Offen", active: true },
      { id: "p-021", groupId: "training", number: "8.2", title: "Administratorendokumentation", description: "Dokumentation von Konfiguration, Nutzerverwaltung, Datenquellen, Betriebshinweisen und Wartungsaufgaben.", unit: "Std.", quantity: 10, rateKey: "training", unitPrice: 220, category: "Schulung", required: false, note: "", status: "Optional", active: true },
      { id: "p-022", groupId: "training", number: "8.3", title: "Anwenderschulung", description: "Durchführung einer praxisnahen Schulung mit Beispielprozessen, Fragenrunde und Übergabe empfohlener Arbeitsweisen.", unit: "Std.", quantity: 6, rateKey: "training", unitPrice: 220, category: "Schulung", required: true, note: "", status: "Offen", active: true },
      { id: "p-023", groupId: "training", number: "8.4", title: "Administratorenschulung", description: "Schulung technischer Ansprechpartner zu Konfiguration, Betrieb, Qualitätsprüfung und Weiterentwicklungsmöglichkeiten.", unit: "Std.", quantity: 5, rateKey: "training", unitPrice: 220, category: "Schulung", required: false, note: "", status: "Optional", active: true }
    ]
  },
  {
    id: "support",
    title: "Wartung, Support und Weiterentwicklung",
    intro: "Planbare Betreuung nach Inbetriebnahme, damit Stabilität, Qualität und fachliche Weiterentwicklung gesichert bleiben.",
    active: true,
    positions: [
      { id: "p-024", groupId: "support", number: "9.1", title: "Support", description: "Laufende Unterstützung bei Anwenderfragen, kleineren Anpassungen, Monitoring-Hinweisen und Fehleranalyse.", unit: "Monat", quantity: 3, rateKey: "support", unitPrice: 1800, category: "Support", required: false, note: "Monatliches Kontingent", status: "Optional", active: true },
      { id: "p-025", groupId: "support", number: "9.2", title: "Wartung", description: "Regelmäßige Prüfung von Abhängigkeiten, Sicherheitsupdates, Betriebsparametern und technischer Stabilität.", unit: "Monat", quantity: 3, rateKey: "support", unitPrice: 1200, category: "Support", required: false, note: "", status: "Optional", active: true },
      { id: "p-026", groupId: "support", number: "9.3", title: "Weiterentwicklung", description: "Reserviertes Entwicklungskontingent für priorisierte Erweiterungen, Optimierungen und zusätzliche Automatisierungen.", unit: "Std.", quantity: 20, rateKey: "development", unitPrice: 180, category: "Weiterentwicklung", required: false, note: "", status: "Optional", active: true }
    ]
  },
  {
    id: "optional",
    title: "Optionale Zusatzleistungen",
    intro: "Ergänzende Leistungen, die je Projektumfang, Datenlage und gewünschter Automatisierungstiefe beauftragt werden können.",
    active: true,
    positions: [
      { id: "p-027", groupId: "optional", number: "10.1", title: "Wissensdatenbank", description: "Strukturierung, Bereinigung und redaktionelle Aufbereitung bestehender Inhalte für die Nutzung in KI-gestützten Such- und Antwortsystemen.", unit: "Std.", quantity: 24, rateKey: "ai", unitPrice: 220, category: "KI", required: false, note: "", status: "Optional", active: false },
      { id: "p-028", groupId: "optional", number: "10.2", title: "Zusätzliche Integrationen", description: "Anbindung weiterer Fachsysteme, Datenquellen oder Exportformate nach gesonderter technischer Prüfung.", unit: "Std.", quantity: 20, rateKey: "development", unitPrice: 180, category: "Integration", required: false, note: "Nach Aufwand", status: "Optional", active: false }
    ]
  }
];
