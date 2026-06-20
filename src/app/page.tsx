"use client";

import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import {
  Archive,
  Bot,
  Building2,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FileText,
  GripVertical,
  Home,
  LayoutTemplate,
  Library,
  Plus,
  Printer,
  ReceiptText,
  Save,
  Search,
  Settings,
  SlidersHorizontal,
  Trash2,
  Users
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { OfferPreview } from "@/components/OfferPreview";
import { Field, IconButton, SectionTitle, Select, StatCard, TextArea, TextInput } from "@/components/ui";
import { activeGroups, calculateSummary, formatCurrency, groupNumber, groupTotal, positionNumber, positionTotal, renumberGroups } from "@/lib/calculations";
import { companyProfiles, initialGroups, rateLabels, sampleOrderBilling, sampleProject } from "@/lib/data";
import { ChangeOrder, InvoicePlanItem, OrderBilling, Position, PositionGroup, Project, WorkLogItem } from "@/lib/types";

type View =
  | "Dashboard"
  | "Projekte"
  | "Neues Angebot"
  | "LV bearbeiten"
  | "LV-Vorschau"
  | "Auftrag & Abrechnung"
  | "KI-Assistenz"
  | "Firmenprofile"
  | "Mandanten"
  | "Positionsbibliothek"
  | "Vorlagen"
  | "Einstellungen";

const navItems: { label: View; icon: typeof Home }[] = [
  { label: "Dashboard", icon: Home },
  { label: "Projekte", icon: Archive },
  { label: "Neues Angebot", icon: Plus },
  { label: "LV bearbeiten", icon: FileText },
  { label: "LV-Vorschau", icon: Eye },
  { label: "Auftrag & Abrechnung", icon: ReceiptText },
  { label: "KI-Assistenz", icon: Bot },
  { label: "Firmenprofile", icon: Building2 },
  { label: "Mandanten", icon: Users },
  { label: "Positionsbibliothek", icon: Library },
  { label: "Vorlagen", icon: LayoutTemplate },
  { label: "Einstellungen", icon: Settings }
];

const storageKey = "smart-lv-state-v1";

export default function HomePage() {
  const [activeView, setActiveView] = useState<View>("Dashboard");
  const [project, setProject] = useState<Project>(sampleProject);
  const [groups, setGroups] = useState<PositionGroup[]>(initialGroups);
  const [orderBilling, setOrderBilling] = useState<OrderBilling>(sampleOrderBilling);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Alle Kategorien");
  const [statusFilter, setStatusFilter] = useState("Alle Status");

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { project: Project; groups: PositionGroup[]; orderBilling?: OrderBilling };
      queueMicrotask(() => {
        setProject({
          ...parsed.project,
          projectName: parsed.project.projectName
            .replace("KI-gestützte Angebots- und Wissensplattform", "KI-gestützte Angebotsplattform")
            .replace("K. I. Gestützte Angebots und Wissensplattform", "KI-gestützte Angebotsplattform"),
          shortDescription: parsed.project.shortDescription.replace(" und Wissensbereitstellung", ""),
          skontoPercent: parsed.project.skontoPercent ?? 0,
          skontoDays: parsed.project.skontoDays ?? 10
        });
        setGroups(parsed.groups.map((group) => ({ ...group, active: group.active ?? true })));
        setOrderBilling(parsed.orderBilling ?? sampleOrderBilling);
      });
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify({ project, groups, orderBilling }));
  }, [project, groups, orderBilling]);

  const company = companyProfiles.find((profile) => profile.id === project.companyId) ?? companyProfiles[0];
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

  function updateWorkLog(itemId: string, changes: Partial<WorkLogItem>) {
    setOrderBilling((current) => ({
      ...current,
      workLog: current.workLog.map((item) => (item.id === itemId ? { ...item, ...changes } : item))
    }));
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

  function saveAsTemplate() {
    const template = {
      name: `${project.projectName} Vorlage`,
      createdAt: new Date().toISOString(),
      groups
    };
    window.localStorage.setItem("smart-lv-last-template", JSON.stringify(template));
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

  function duplicateOffer() {
    setProject((current) => ({
      ...current,
      id: `offer-${Date.now()}`,
      offerNumber: `${current.offerNumber}-KOPIE`,
      status: "Entwurf"
    }));
  }

  return (
    <main className="min-h-screen bg-canvas">
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-line bg-white px-4 py-5 lg:block">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-ink text-sm font-bold text-white">LV</div>
          <div>
            <p className="font-semibold text-ink">SMART LV</p>
            <p className="text-sm text-muted">Angebotsgenerator</p>
          </div>
        </div>
        <nav className="mt-8 grid gap-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setActiveView(item.label)}
              className={`flex h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition ${
                activeView === item.label ? "bg-slate-100 text-ink" : "text-muted hover:bg-slate-50 hover:text-ink"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="lg:pl-72">
        <header className="no-print sticky top-0 z-20 border-b border-line bg-white/90 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted">{company.name}</p>
              <h1 className="truncate text-2xl font-semibold tracking-normal text-ink">{project.projectName}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={project.companyId} onChange={(event) => updateProject("companyId", event.target.value as Project["companyId"])} className="w-56">
                {companyProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </Select>
              <IconButton icon={Save} label="Als Vorlage speichern" onClick={saveAsTemplate} />
              <IconButton icon={Copy} label="Angebot duplizieren" onClick={duplicateOffer} />
              <IconButton icon={Download} label="CSV exportieren" onClick={exportCsv} />
              <IconButton icon={Printer} label="PDF/DOCX über Druckdialog vorbereiten" onClick={() => window.print()} />
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
                {item.label}
              </button>
            ))}
          </div>
        </header>

        <div className="px-4 py-6 md:px-8">
          {activeView === "Dashboard" ? (
            <Dashboard
              project={project}
              orderBilling={orderBilling}
              summary={summary}
              activePositions={activePositions.length}
              optionalPositions={optionalPositions.length}
              groups={groups}
              setActiveView={setActiveView}
            />
          ) : null}

          {activeView === "Projekte" || activeView === "Neues Angebot" ? <ProjectWorkspace project={project} updateProject={updateProject} /> : null}

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
              deletePosition={deletePosition}
              duplicatePosition={duplicatePosition}
              addPosition={addPosition}
              onDragEnd={onDragEnd}
            />
          ) : null}

          {activeView === "LV-Vorschau" ? <OfferPreview project={project} groups={groups} /> : null}

          {activeView === "Auftrag & Abrechnung" ? (
            <OrderBillingWorkspace
              project={project}
              groups={groups}
              orderBilling={orderBilling}
              updateOrderBilling={updateOrderBilling}
              updateInvoicePlanItem={updateInvoicePlanItem}
              updateChangeOrder={updateChangeOrder}
              updateWorkLog={updateWorkLog}
            />
          ) : null}

          {activeView === "KI-Assistenz" ? <AiAssistant project={project} groups={groups} updatePosition={updatePosition} setActiveView={setActiveView} /> : null}

          {activeView === "Firmenprofile" ? <CompanyProfiles selectedCompanyId={project.companyId} /> : null}

          {activeView === "Mandanten" ? <Tenants /> : null}

          {activeView === "Positionsbibliothek" ? <PositionLibrary groups={groups} /> : null}

          {activeView === "Vorlagen" ? <Templates project={project} groups={groups} /> : null}

          {activeView === "Einstellungen" ? <SettingsPanel project={project} updateProject={updateProject} /> : null}
        </div>
      </section>
    </main>
  );
}

function Dashboard({
  project,
  orderBilling,
  summary,
  activePositions,
  optionalPositions,
  groups,
  setActiveView
}: {
  project: Project;
  orderBilling: OrderBilling;
  summary: ReturnType<typeof calculateSummary>;
  activePositions: number;
  optionalPositions: number;
  groups: PositionGroup[];
  setActiveView: (view: View) => void;
}) {
  const visibleGroups = activeGroups(groups);

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Angebotswert netto" value={formatCurrency(summary.net)} detail={`${project.vatRate} % Umsatzsteuer vorbereitet`} tone="accent" />
        <StatCard label="Aktive Positionen" value={String(activePositions)} detail={`${optionalPositions} optionale Positionen enthalten`} />
        <StatCard label="Aktive Hauptgruppen" value={String(visibleGroups.length)} detail="Nummerierung ohne Lücken" />
        <StatCard label="Auftrag" value={orderBilling.orderNumber} detail={orderBilling.billingMode} />
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
            <button type="button" onClick={() => setActiveView("LV-Vorschau")} className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink">
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

function ProjectWorkspace({ project, updateProject }: { project: Project; updateProject: <K extends keyof Project>(key: K, value: Project[K]) => void }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
        <SectionTitle title="Angebotsdaten" kicker="Projekt" />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Auftraggeber">
            <TextInput value={project.client} onChange={(event) => updateProject("client", event.target.value)} />
          </Field>
          <Field label="Ansprechpartner">
            <TextInput value={project.contactPerson} onChange={(event) => updateProject("contactPerson", event.target.value)} />
          </Field>
          <Field label="Projektname">
            <TextInput value={project.projectName} onChange={(event) => updateProject("projectName", event.target.value)} />
          </Field>
          <Field label="Angebotsnummer">
            <TextInput value={project.offerNumber} onChange={(event) => updateProject("offerNumber", event.target.value)} />
          </Field>
          <Field label="Kalkulationsart">
            <Select value={project.calculationType} onChange={(event) => updateProject("calculationType", event.target.value as Project["calculationType"])}>
              <option>Stundenbasiert</option>
              <option>Pauschal</option>
              <option>Hybrid</option>
            </Select>
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
          <Field label="Kurzbeschreibung">
            <TextArea value={project.shortDescription} onChange={(event) => updateProject("shortDescription", event.target.value)} />
          </Field>
          <Field label="Zielsetzung">
            <TextArea value={project.objective} onChange={(event) => updateProject("objective", event.target.value)} />
          </Field>
          <Field label="Technische Rahmenbedingungen">
            <TextArea value={project.technicalContext} onChange={(event) => updateProject("technicalContext", event.target.value)} />
          </Field>
          <Field label="Module">
            <TextArea value={project.modules.join("\n")} onChange={(event) => updateProject("modules", event.target.value.split("\n").filter(Boolean))} />
          </Field>
        </div>
      </div>
      <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
        <SectionTitle title="Konditionen" />
        <div className="mt-6 grid gap-4">
          <Field label="Zahlungsbedingungen">
            <TextArea value={project.paymentTerms} onChange={(event) => updateProject("paymentTerms", event.target.value)} />
          </Field>
          <Field label="Gültigkeitsdauer">
            <TextInput value={project.validUntil} onChange={(event) => updateProject("validUntil", event.target.value)} />
          </Field>
          <Field label="Umsatzsteuer in %">
            <TextInput type="number" value={project.vatRate} onChange={(event) => updateProject("vatRate", Number(event.target.value))} />
          </Field>
          <Field label="Nachlass in %">
            <TextInput type="number" value={project.discountPercent} onChange={(event) => updateProject("discountPercent", Number(event.target.value))} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Skonto in %">
              <TextInput type="number" value={project.skontoPercent} onChange={(event) => updateProject("skontoPercent", Number(event.target.value))} />
            </Field>
            <Field label="Skontofrist in Tagen">
              <TextInput type="number" value={project.skontoDays} onChange={(event) => updateProject("skontoDays", Number(event.target.value))} />
            </Field>
          </div>
          <Field label="Optionaler Pauschalpreis netto">
            <TextInput
              type="number"
              value={project.flatFee ?? ""}
              placeholder="Nach Positionen berechnen"
              onChange={(event) => updateProject("flatFee", event.target.value ? Number(event.target.value) : null)}
            />
          </Field>
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
  deletePosition,
  duplicatePosition,
  addPosition,
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
  deletePosition: (groupId: string, positionId: string) => void;
  duplicatePosition: (groupId: string, positionId: string) => void;
  addPosition: (groupId: string) => void;
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
              <div className="flex flex-col gap-3 border-b border-line p-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-ink">
                    {group.active ? groupNumber(allGroups, group.id) : "entfällt"} {group.title}
                  </h2>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">{group.intro}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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

function CompanyProfiles({ selectedCompanyId }: { selectedCompanyId: string }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {companyProfiles.map((profile) => (
        <div key={profile.id} className={`rounded-lg border bg-white p-6 shadow-sm ${profile.id === selectedCompanyId ? "border-blue-200" : "border-line"}`}>
          <div className="flex items-start gap-4">
            <div className="flex h-14 min-w-14 items-center justify-center rounded-md px-3 text-sm font-bold text-white" style={{ background: profile.colors.primary }}>
              {profile.logoText}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink">{profile.name}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{profile.address}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 text-sm text-muted">
            <p>{profile.email} · {profile.phone}</p>
            <p>{profile.website}</p>
            <p>{profile.vatId}</p>
            <p>{profile.bank}</p>
          </div>
          <div className="mt-5 flex gap-2">
            <span className="h-8 w-8 rounded-md border border-line" style={{ background: profile.colors.primary }} />
            <span className="h-8 w-8 rounded-md border border-line" style={{ background: profile.colors.secondary }} />
            <span className="h-8 w-8 rounded-md border border-line" style={{ background: profile.colors.accent }} />
          </div>
          <p className="mt-5 text-sm leading-6 text-muted">{profile.footer}</p>
        </div>
      ))}
    </div>
  );
}

function Tenants() {
  const tenants = ["BuiltSmart Gruppe", "Beratung Immobilienwirtschaft", "KI-Softwareentwicklung", "Freier Mandant"];
  return (
    <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
      <SectionTitle title="Mandanten" />
      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {tenants.map((tenant, index) => (
          <div key={tenant} className="rounded-lg border border-line p-5">
            <p className="text-sm font-medium text-muted">Mandant {index + 1}</p>
            <p className="mt-2 font-semibold text-ink">{tenant}</p>
            <p className="mt-3 text-sm text-muted">Eigene Angebote, Vorlagen und Firmenprofile vorbereitet.</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PositionLibrary({ groups }: { groups: PositionGroup[] }) {
  return (
    <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
      <SectionTitle title="Positionsbibliothek" />
      <div className="mt-6 overflow-hidden rounded-lg border border-line">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Nr.</th>
              <th className="px-4 py-3 font-semibold">Titel</th>
              <th className="px-4 py-3 font-semibold">Leistungsbereich</th>
              <th className="px-4 py-3 font-semibold">Einheit</th>
              <th className="px-4 py-3 font-semibold">Pflicht</th>
              <th className="px-4 py-3 font-semibold">Stundensatzlogik</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {groups.flatMap((group) =>
              group.positions.map((position) => (
                <tr key={position.id}>
                  <td className="px-4 py-3 font-medium text-muted">{positionNumber(groups, group.id, position.id)}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{position.title}</td>
                  <td className="px-4 py-3 text-muted">{position.category}</td>
                  <td className="px-4 py-3 text-muted">{position.unit}</td>
                  <td className="px-4 py-3 text-muted">{position.required ? "Ja" : "Optional"}</td>
                  <td className="px-4 py-3 text-muted">{rateLabels[position.rateKey]}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Templates({ project, groups }: { project: Project; groups: PositionGroup[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {["KI-App MVP", "RAG-Wissenssystem", "Immobilien-Workflow-Automation"].map((template, index) => (
        <div key={template} className="rounded-lg border border-line bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-muted">Vorlage {index + 1}</p>
          <h2 className="mt-2 text-lg font-semibold text-ink">{template}</h2>
          <p className="mt-3 text-sm leading-6 text-muted">{groups.length} Hauptgruppen, Firmenprofil {project.companyId}, Statuslogik und Exportlayout vorbereitet.</p>
        </div>
      ))}
    </div>
  );
}

function OrderBillingWorkspace({
  project,
  groups,
  orderBilling,
  updateOrderBilling,
  updateInvoicePlanItem,
  updateChangeOrder,
  updateWorkLog
}: {
  project: Project;
  groups: PositionGroup[];
  orderBilling: OrderBilling;
  updateOrderBilling: <K extends keyof OrderBilling>(key: K, value: OrderBilling[K]) => void;
  updateInvoicePlanItem: (itemId: string, changes: Partial<InvoicePlanItem>) => void;
  updateChangeOrder: (itemId: string, changes: Partial<ChangeOrder>) => void;
  updateWorkLog: (itemId: string, changes: Partial<WorkLogItem>) => void;
}) {
  const summary = calculateSummary(groups, project);
  const invoiceTotal = orderBilling.invoicePlan.reduce((sum, item) => sum + item.amount, 0);
  const loggedHours = orderBilling.workLog.reduce((sum, item) => sum + item.hours, 0);
  const changeOrderTotal = orderBilling.changeOrders.reduce((sum, item) => sum + item.amount, 0);

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
                <TextInput type="number" value={item.percentage} onChange={(event) => updateInvoicePlanItem(item.id, { percentage: Number(event.target.value) })} />
              </Field>
              <Field label="Betrag netto">
                <TextInput type="number" value={item.amount} onChange={(event) => updateInvoicePlanItem(item.id, { amount: Number(event.target.value) })} />
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

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-line bg-white p-6 shadow-sm">
          <SectionTitle title="Nachträge" />
          <div className="mt-5 grid gap-3">
            {orderBilling.changeOrders.map((item) => (
              <div key={item.id} className="rounded-lg border border-line p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_160px]">
                  <Field label="Titel">
                    <TextInput value={item.title} onChange={(event) => updateChangeOrder(item.id, { title: event.target.value })} />
                  </Field>
                  <Field label="Betrag netto">
                    <TextInput type="number" value={item.amount} onChange={(event) => updateChangeOrder(item.id, { amount: Number(event.target.value) })} />
                  </Field>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_180px]">
                  <Field label="Beschreibung">
                    <TextArea value={item.description} onChange={(event) => updateChangeOrder(item.id, { description: event.target.value })} />
                  </Field>
                  <Field label="Status">
                    <Select value={item.status} onChange={(event) => updateChangeOrder(item.id, { status: event.target.value as ChangeOrder["status"] })}>
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
          <SectionTitle title="Leistungsnachweis" />
          <div className="mt-5 grid gap-3">
            {orderBilling.workLog.map((item) => (
              <div key={item.id} className="grid gap-3 rounded-lg border border-line p-4 md:grid-cols-[1fr_110px_150px]">
                <Field label="Position">
                  <TextInput value={item.positionTitle} onChange={(event) => updateWorkLog(item.id, { positionTitle: event.target.value })} />
                </Field>
                <Field label="Stunden">
                  <TextInput type="number" value={item.hours} onChange={(event) => updateWorkLog(item.id, { hours: Number(event.target.value) })} />
                </Field>
                <Field label="Status">
                  <Select value={item.status} onChange={(event) => updateWorkLog(item.id, { status: event.target.value as WorkLogItem["status"] })}>
                    <option>Geplant</option>
                    <option>In Arbeit</option>
                    <option>Abgenommen</option>
                  </Select>
                </Field>
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
  setActiveView
}: {
  project: Project;
  groups: PositionGroup[];
  updatePosition: (groupId: string, positionId: string, changes: Partial<Position>) => void;
  setActiveView: (view: View) => void;
}) {
  const aiGroups = activeGroups(groups).filter((group) =>
    [group.title, group.intro, ...group.positions.map((position) => `${position.title} ${position.description} ${position.category}`)]
      .join(" ")
      .toLowerCase()
      .includes("ki")
  );
  const aiPositions = aiGroups.flatMap((group) => group.positions.filter((position) => position.active));
  const suggestedHours = aiPositions.reduce((sum, position) => sum + position.quantity, 0);

  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-6 shadow-sm">
        <SectionTitle title="KI-Assistenz" kicker="Regelbasierte erste Version" />
        <p className="mt-3 max-w-4xl text-sm leading-6 text-blue-900">
          Diese Version arbeitet lokal mit Regeln und Projektkontext. Sie markiert relevante KI-Leistungen, erzeugt Textvorschläge,
          prüft fehlende Bausteine und hilft bei Aufwand, Risiken und Abrechnung. Eine echte Modell-API kann später an dieselbe Stelle angeschlossen werden.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="KI-relevante Positionen" value={String(aiPositions.length)} detail={`${suggestedHours} kalkulierte Stunden`} tone="accent" />
        <StatCard label="Empfohlene Abrechnung" value="Hybrid" detail="Pauschale Basis plus Nachträge" />
        <StatCard label="Projektfokus" value="Angebots-KI" detail={project.client} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
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

        <div className="grid gap-6">
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
            <div className="mt-4 grid gap-3 text-sm">
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
          {["Login und Rollenverwaltung", "Cloud-Speicherung", "Stripe-Lizenzmodell", "PDF- und DOCX-Service", "Mandantenrechte"].map((item) => (
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
