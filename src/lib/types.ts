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

export type Project = {
  id: string;
  companyId: CompanyId;
  client: string;
  contactPerson: string;
  projectLocation: string;
  projectVolume: string;
  servicePeriod: string;
  plannedProjectStart: string;
  projectName: string;
  shortDescription: string;
  offerIntro: string;
  assignmentReason: string;
  serviceScope: string;
  contractorRole: string;
  serviceDirectoryIntro: string;
  serviceExclusion: string;
  meetingBillingNote: string;
  changeTerms: string;
  contractBasis: string;
  validityText: string;
  offerClarification: string;
  acceptanceText: string;
  objective: string;
  technicalContext: string;
  modules: string[];
  calculationType: "Stundenbasiert" | "Pauschal" | "Hybrid";
  status: OfferStatus;
  offerNumber: string;
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
  unit: "Std." | "Pauschal" | "Tag" | "Monat";
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
