export type CompanyId = "builtsmart-hub" | "builtsmart-ai" | "metzger-real-estate" | "custom";

export type OfferStatus = "Entwurf" | "In Prüfung" | "Versendet" | "Beauftragt" | "Archiviert";

export type PositionStatus = "Offen" | "Abgestimmt" | "Optional" | "Zurückgestellt";

export type RateKey =
  | "strategy"
  | "concept"
  | "project"
  | "ux"
  | "development"
  | "ai"
  | "prompt"
  | "deployment"
  | "training"
  | "support";

export type CompanyProfile = {
  id: CompanyId;
  name: string;
  logoText: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  agbUrl: string;
  bookingUrl: string;
  vatId: string;
  bank: string;
  contact: string;
  contactRole: string;
  ownerLine: string;
  footer: string;
  footerIntro: string;
  footerContact: string;
  footerLegal: string;
  footerBank: string;
  liability: string;
  offerText: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  exportLayout: string;
};

export type RateCard = Record<RateKey, number>;

export type OfferSectionKey =
  | "offerIntro"
  | "assignmentReason"
  | "coverLetterText"
  | "shortDescription"
  | "objective"
  | "serviceScope"
  | "contractorRole"
  | "serviceDirectoryIntro"
  | "serviceExclusion"
  | "changeTerms"
  | "contractBasis"
  | "paymentTerms"
  | "validityText"
  | "offerClarification"
  | "offerNote"
  | "acceptanceText"
  | "signatureText";

export type OfferType = "Mit Leistungsverzeichnis" | "Anschreiben ohne LV" | "Strukturierte Leistungsbeschreibung";

export type StructuredOfferTableRow = {
  id: string;
  label: string;
  value: string;
};

export type StructuredOfferSubsection = {
  id: string;
  title: string;
  body: string;
  bullets: string[];
  afterBulletsText: string;
  tableRows: StructuredOfferTableRow[];
};

export type StructuredOfferSection = {
  id: string;
  title: string;
  subtitle: string;
  subtitles: string[];
  body: string;
  bullets: string[];
  afterBulletsText: string;
  tableRows: StructuredOfferTableRow[];
  subsections: StructuredOfferSubsection[];
};

export type Project = {
  id: string;
  companyId: CompanyId;
  customerId: string;
  client: string;
  contactPerson: string;
  clientAddress: string;
  projectLocation: string;
  projectVolume: string;
  servicePeriod: string;
  plannedProjectStart: string;
  projectName: string;
  offerSubject: string;
  offerType: OfferType;
  structuredSections: StructuredOfferSection[];
  sectionVisibility: Partial<Record<OfferSectionKey, boolean>>;
  sectionTitleVisibility: Partial<Record<OfferSectionKey, boolean>>;
  shortDescription: string;
  offerIntro: string;
  assignmentReason: string;
  coverLetterText: string;
  serviceScope: string;
  contractorRole: string;
  serviceDirectoryIntro: string;
  serviceExclusion: string;
  meetingBillingNote: string;
  changeTerms: string;
  contractBasis: string;
  validityText: string;
  offerClarification: string;
  offerNote: string;
  acceptanceText: string;
  signatureText: string;
  objective: string;
  technicalContext: string;
  modules: string[];
  calculationType: "Stundenbasiert" | "Pauschal" | "Hybrid";
  status: OfferStatus;
  offerNumber: string;
  customerLink?: string;
  sentAt?: string;
  offerDate: string;
  validUntil: string;
  paymentTerms: string;
  vatRate: number;
  discountPercent: number;
  skontoPercent: number;
  skontoDays: number;
  flatFee: number | null;
  rates: RateCard;
};

export type Position = {
  id: string;
  groupId: string;
  number: string;
  title: string;
  description: string;
  unit: "Std." | "Pauschal" | "Tag" | "Monat" | "Kilometer";
  quantity: number;
  rateKey: RateKey;
  unitPrice: number;
  category: string;
  required: boolean;
  note: string;
  status: PositionStatus;
  active: boolean;
};

export type PositionGroup = {
  id: string;
  title: string;
  intro: string;
  active: boolean;
  positions: Position[];
};

export type Summary = {
  net: number;
  discount: number;
  vat: number;
  gross: number;
};

export type BillingMode = "Pauschale" | "Nach Aufwand" | "Hybrid";

export type InvoiceStatus = "Entwurf" | "Offen" | "Bezahlt" | "Überfällig";

export type InvoicePlanItem = {
  id: string;
  title: string;
  percentage: number;
  amount: number;
  due: string;
  status: InvoiceStatus;
};

export type ChangeOrder = {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: "Vorgeschlagen" | "Beauftragt" | "Abgerechnet";
  billable: boolean;
};

export type WorkLogItem = {
  id: string;
  positionTitle: string;
  hours: number;
  status: "Geplant" | "In Arbeit" | "Abgenommen";
  billable: boolean;
};

export type OrderBilling = {
  orderNumber: string;
  orderDate: string;
  servicePeriod: string;
  billingMode: BillingMode;
  invoicePlan: InvoicePlanItem[];
  changeOrders: ChangeOrder[];
  workLog: WorkLogItem[];
};
