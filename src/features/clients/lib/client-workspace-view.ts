import type { AuditTimelineEvent } from "@/features/audits/queries/get-audit-timeline";
import { buildClientActivityTimeline } from "@/features/clients/lib/client-activity-timeline";
import { buildClientServiceCoverage } from "@/features/clients/lib/client-service-coverage";
import type { ClientDetail } from "@/features/clients/queries/get-client";
import type { DocumentListItem } from "@/features/documents/queries/get-documents";
import type {
  ContractProposal,
  ServiceLineProposal,
} from "@/features/documents/lib/document-intelligence";
import type {
  ClientContactRecord,
  ClientContractRecord,
  ClientDeadlineRecord,
  ClientManualDeadlineRecord,
  ClientNoteRecord,
  ClientServiceLineRecord,
  ClientTaskPriority,
  ClientTaskRecord,
  ClientTaskStatus,
} from "@/features/clients/queries/get-client-workspace";

export type ClientWorkspaceAuditItem = {
  id: string;
  location_id: string | null;
  location_name: string | null;
  nc_count: number;
  scheduled_date: string | null;
  score: number | null;
  status: string;
  title: string | null;
};

type ClientLocationOptionSource = {
  id: string;
  name: string;
};

type ClientAuditOptionSource = Pick<ClientWorkspaceAuditItem, "id" | "title">;

type ClientServiceLineOptionSource = Pick<ClientServiceLineRecord, "id" | "location_id" | "title">;

export type ClientWorkspaceDocumentFocus =
  | "all"
  | "review"
  | "expired"
  | "contracts"
  | "mismatch"
  | "versioned";

export type AggregatedDeadline = {
  description: string | null;
  due_date: string;
  href: string | null;
  id: string;
  location_id: string | null;
  priority: ClientTaskPriority;
  service_line_id: string | null;
  source_type: "manual" | "contract" | "task" | "document" | "audit";
  status: "open" | "completed" | "cancelled";
  title: string;
};

export function toDateLabel(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("it-IT");
}

export function toDateStart(value: string) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function taskStatusLabel(status: ClientTaskStatus) {
  if (status === "open") return "Aperta";
  if (status === "in_progress") return "In lavorazione";
  if (status === "blocked") return "Bloccata";
  return "Completata";
}

export function priorityLabel(priority: ClientTaskPriority) {
  if (priority === "low") return "Bassa";
  if (priority === "medium") return "Media";
  if (priority === "high") return "Alta";
  return "Critica";
}

export function priorityBadgeClass(priority: ClientTaskPriority) {
  if (priority === "critical") return "border-rose-200 bg-rose-50 text-rose-700";
  if (priority === "high") return "border-amber-200 bg-amber-50 text-amber-700";
  if (priority === "medium") return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-zinc-200 bg-zinc-50 text-zinc-600";
}

export function taskStatusBadgeClass(status: ClientTaskStatus) {
  if (status === "done") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "in_progress") return "border-sky-200 bg-sky-50 text-sky-700";
  if (status === "blocked") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

export function sourceTypeLabel(sourceType: AggregatedDeadline["source_type"]) {
  if (sourceType === "manual") return "Manuale";
  if (sourceType === "contract") return "Contratto";
  if (sourceType === "task") return "Attività";
  if (sourceType === "document") return "Documento";
  return "Audit";
}

export function sourceTypeBadgeClass(sourceType: AggregatedDeadline["source_type"]) {
  if (sourceType === "contract") return "border-violet-200 bg-violet-50 text-violet-700";
  if (sourceType === "task") return "border-sky-200 bg-sky-50 text-sky-700";
  if (sourceType === "document") return "border-amber-200 bg-amber-50 text-amber-700";
  if (sourceType === "audit") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

export function serviceCoverageSecondaryLine(
  nextPlannedAt: string | null,
  lastEvidenceAt: string | null
) {
  if (nextPlannedAt) return `Prossimo presidio ${toDateLabel(nextPlannedAt)}`;
  if (lastEvidenceAt) return `Ultima evidenza ${toDateLabel(lastEvidenceAt)}`;
  return "Nessun presidio rilevato";
}

export function taskContextLabel(
  task: ClientTaskRecord,
  locationMap: Map<string, string>,
  serviceLineMap: Map<string, string>
) {
  if (task.service_line_id) {
    return `Servizio: ${serviceLineMap.get(task.service_line_id) ?? "Linea rimossa"}`;
  }
  if (task.location_id) {
    return `Sede: ${locationMap.get(task.location_id) ?? "Sede rimossa"}`;
  }
  if (task.audit_id) {
    return "Audit collegato";
  }
  return "Contesto non collegato";
}

export function buildLocationNameMap(locations: ReadonlyArray<ClientLocationOptionSource>) {
  return new Map(locations.map((location) => [location.id, location.name]));
}

export function buildLocationOptions(locations: ReadonlyArray<ClientLocationOptionSource>) {
  return locations.map((location) => ({
    id: location.id,
    name: location.name,
  }));
}

export function buildAuditOptions(audits: ReadonlyArray<ClientAuditOptionSource>) {
  return audits.map((audit) => ({
    id: audit.id,
    title: audit.title,
  }));
}

export function buildServiceLineOptions(serviceLines: ReadonlyArray<ClientServiceLineOptionSource>) {
  return serviceLines.map((line) => ({
    id: line.id,
    location_id: line.location_id,
    title: line.title,
  }));
}

export function buildContractForm(contract: ClientContractRecord | null) {
  return {
    activity_frequency: contract?.activity_frequency ?? "",
    attachment_url: contract?.attachment_url ?? "",
    client_references: contract?.client_references ?? "",
    contract_type: contract?.contract_type ?? "standard",
    duration_terms: contract?.duration_terms ?? "",
    end_date: contract?.end_date ?? "",
    exercised_activity: contract?.exercised_activity ?? "",
    internal_owner: contract?.internal_owner ?? "",
    issue_date: contract?.issue_date ?? "",
    notes: contract?.notes ?? "",
    protocol_code: contract?.protocol_code ?? "",
    renewal_date: contract?.renewal_date ?? "",
    service_scope: contract?.service_scope ?? "",
    start_date: contract?.start_date ?? "",
    status: contract?.status ?? "active",
    supervisor_name: contract?.supervisor_name ?? "",
    validity_terms: contract?.validity_terms ?? "",
  };
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function getDocumentProposal(document: DocumentListItem) {
  const payload = asObject(document.extracted_payload);
  const proposal = asObject(payload?.proposal ?? document.extracted_payload);
  return proposal;
}

export function getContractProposal(document: DocumentListItem) {
  const proposal = getDocumentProposal(document);
  return asObject(proposal?.contract) as ContractProposal | null;
}

export function getServiceLinesProposal(document: DocumentListItem) {
  const proposal = getDocumentProposal(document);
  const serviceLines = proposal?.service_lines;
  if (!Array.isArray(serviceLines)) return [];
  return serviceLines as ServiceLineProposal[];
}

export function preferredDocumentAccessUrl(document: DocumentListItem | null) {
  if (!document) return null;
  return document.access_url ?? document.file_url ?? null;
}

export function isContractLikeDocument(document: DocumentListItem) {
  if (document.category === "Contract") return true;

  const payload = asObject(document.extracted_payload);
  if (payload?.category_suggested === "Contract") return true;

  const proposal = getContractProposal(document);
  if (proposal) return true;

  const keywords = `${document.title ?? ""} ${document.file_name ?? ""} ${document.description ?? ""}`.toLowerCase();
  return keywords.includes("contratt") || keywords.includes("contract");
}

export function isActivityPlanDocument(document: DocumentListItem) {
  if (getServiceLinesProposal(document).length > 0) return true;
  const keywords = `${document.title ?? ""} ${document.file_name ?? ""} ${document.description ?? ""}`.toLowerCase();
  return (
    keywords.includes("offerta") ||
    keywords.includes("prospetto costi") ||
    keywords.includes("attivit") ||
    keywords.includes("azioni") ||
    keywords.includes("pagamento")
  );
}

export function documentFocusLabel(focus: ClientWorkspaceDocumentFocus) {
  if (focus === "review") return "Da validare";
  if (focus === "expired") return "Scaduti";
  if (focus === "contracts") return "Contratti";
  if (focus === "mismatch") return "Mismatch contratto";
  if (focus === "versioned") return "Versionati";
  return "Tutti";
}

export function computeRiskLevel({
  openNcCount,
  overdueDeadlines,
  overdueTasks,
}: {
  openNcCount: number;
  overdueDeadlines: number;
  overdueTasks: number;
}) {
  const riskScore = openNcCount * 2 + overdueDeadlines + overdueTasks;
  if (riskScore >= 8) {
    return {
      className: "border-rose-200 bg-rose-50 text-rose-700",
      label: "Rischio alto",
    };
  }
  if (riskScore >= 4) {
    return {
      className: "border-amber-200 bg-amber-50 text-amber-700",
      label: "Rischio medio",
    };
  }
  return {
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    label: "Rischio sotto controllo",
  };
}

export function buildAggregatedDeadlines({
  audits,
  clientId,
  contract,
  deadlines,
  documents,
  tasks,
  today,
}: {
  audits: ClientWorkspaceAuditItem[];
  clientId: string;
  contract: ClientContractRecord | null;
  deadlines: ClientDeadlineRecord[];
  documents: DocumentListItem[];
  tasks: ClientTaskRecord[];
  today: Date;
}) {
  const list: AggregatedDeadline[] = [];
  const existingDocumentDeadlineIds = new Set<string>();

  for (const deadline of deadlines) {
    if (deadline.source_type === "document" && deadline.source_id) {
      existingDocumentDeadlineIds.add(deadline.source_id);
    }

    if (deadline.source_type !== "manual" && deadline.source_type !== "document") {
      continue;
    }

    list.push({
      description: deadline.description,
      due_date: deadline.due_date,
      href: null,
      id: deadline.id,
      location_id: deadline.location_id,
      priority: deadline.priority,
      service_line_id: deadline.service_line_id,
      source_type: deadline.source_type,
      status: deadline.status,
      title: deadline.title,
    });
  }

  if (contract?.renewal_date) {
    list.push({
      description: `Contratto ${contract.contract_type}`,
      due_date: contract.renewal_date,
      href: null,
      id: `contract-renewal-${clientId}`,
      location_id: null,
      priority: "high",
      service_line_id: null,
      source_type: "contract",
      status: contract.status === "expired" ? "cancelled" : "open",
      title: "Rinnovo contratto",
    });
  }

  if (contract?.end_date) {
    list.push({
      description: `Contratto ${contract.contract_type}`,
      due_date: contract.end_date,
      href: null,
      id: `contract-end-${clientId}`,
      location_id: null,
      priority: "critical",
      service_line_id: null,
      source_type: "contract",
      status: contract.status === "expired" ? "completed" : "open",
      title: "Scadenza contratto",
    });
  }

  for (const task of tasks) {
    if (!task.due_date) continue;
    list.push({
      description: task.description,
      due_date: task.due_date,
      href: null,
      id: `task-${task.id}`,
      location_id: task.location_id,
      priority: task.priority,
      service_line_id: task.service_line_id,
      source_type: "task",
      status: task.status === "done" ? "completed" : "open",
      title: task.title,
    });
  }

  for (const document of documents) {
    if (!document.expiry_date) continue;
    if (existingDocumentDeadlineIds.has(document.id)) continue;
    const due = toDateStart(document.expiry_date);
    const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    list.push({
      description: document.description,
      due_date: document.expiry_date,
      href: null,
      id: `document-${document.id}`,
      location_id: document.location_id,
      priority: diffDays <= 14 ? "high" : diffDays <= 30 ? "medium" : "low",
      service_line_id: null,
      source_type: "document",
      status: document.status === "archived" ? "completed" : "open",
      title: document.title ?? "Documento senza titolo",
    });
  }

  for (const audit of audits) {
    if (!audit.scheduled_date) continue;
    if (audit.status === "Closed") continue;
    list.push({
      description: `Stato audit: ${audit.status}`,
      due_date: audit.scheduled_date,
      href: `/audits/${audit.id}`,
      id: `audit-${audit.id}`,
      location_id: audit.location_id,
      priority: audit.status === "In Progress" ? "high" : "medium",
      service_line_id: null,
      source_type: "audit",
      status: "open",
      title: audit.title || "Audit senza titolo",
    });
  }

  return list.sort((left, right) => {
    return toDateStart(left.due_date).getTime() - toDateStart(right.due_date).getTime();
  });
}

export function buildClientWorkspaceOverview({
  aggregatedDeadlines,
  contacts,
  contract,
  contractAttentionLimit,
  documents,
  manualDeadlines,
  openNcCount,
  serviceLines,
  tasks,
  today,
}: {
  aggregatedDeadlines: AggregatedDeadline[];
  contacts: ClientContactRecord[];
  contract: ClientContractRecord | null;
  contractAttentionLimit: Date;
  documents: DocumentListItem[];
  manualDeadlines: ClientManualDeadlineRecord[];
  openNcCount: number;
  serviceLines: ClientServiceLineRecord[];
  tasks: ClientTaskRecord[];
  today: Date;
}) {
  const documentExpiringSoonCount = documents.filter((document) => {
    if (!document.expiry_date) return false;
    const expiry = toDateStart(document.expiry_date);
    const inThirtyDays = new Date(today);
    inThirtyDays.setDate(today.getDate() + 30);
    return expiry >= today && expiry <= inThirtyDays;
  }).length;

  const documentExpiredCount = documents.filter((document) => {
    if (!document.expiry_date) return false;
    return toDateStart(document.expiry_date) < today;
  }).length;

  const documentReviewQueue = documents.filter(
    (document) =>
      document.ingestion_status === "review_required" || document.ingestion_status === "failed"
  );

  const contractDocumentMismatches = documents.filter((document) => {
    if (!isContractLikeDocument(document) || !contract) return false;
    const proposal = getContractProposal(document);
    if (!proposal) return false;

    const proposalStartDate = stringOrNull(proposal.start_date);
    const proposalRenewalDate = stringOrNull(proposal.renewal_date);
    const proposalEndDate = stringOrNull(proposal.end_date);
    const proposalType = stringOrNull(proposal.contract_type);

    return (
      (proposalType !== null && proposalType !== (contract.contract_type ?? null)) ||
      (proposalStartDate !== null && proposalStartDate !== (contract.start_date ?? null)) ||
      (proposalRenewalDate !== null &&
        proposalRenewalDate !== (contract.renewal_date ?? null)) ||
      (proposalEndDate !== null && proposalEndDate !== (contract.end_date ?? null))
    );
  });

  const openTasks = tasks.filter((task) => task.status !== "done");
  const overdueTasks = openTasks.filter((task) => {
    if (!task.due_date) return false;
    return toDateStart(task.due_date) < today;
  });

  const overdueDeadlines = aggregatedDeadlines.filter(
    (deadline) => deadline.status === "open" && toDateStart(deadline.due_date) < today
  );
  const upcomingDeadlines = aggregatedDeadlines.filter((deadline) => {
    if (deadline.status !== "open") return false;
    const dueDate = toDateStart(deadline.due_date);
    const inThirtyDays = new Date(today);
    inThirtyDays.setDate(today.getDate() + 30);
    return dueDate >= today && dueDate <= inThirtyDays;
  });

  const riskLevel = computeRiskLevel({
    openNcCount,
    overdueDeadlines: overdueDeadlines.length,
    overdueTasks: overdueTasks.length,
  });

  const overviewStats = [
    { label: "Task aperte", value: openTasks.length },
    { label: "Scadenze urgenti", value: overdueDeadlines.length + upcomingDeadlines.length },
    { label: "NC aperte", value: openNcCount },
    {
      label: "Documenti da presidiare",
      value:
        documentReviewQueue.length +
        documentExpiredCount +
        contractDocumentMismatches.length,
    },
  ];

  const nextActions = [...openTasks]
    .sort((left, right) => {
      if (!left.due_date && !right.due_date) return 0;
      if (!left.due_date) return 1;
      if (!right.due_date) return -1;
      return toDateStart(left.due_date).getTime() - toDateStart(right.due_date).getTime();
    })
    .slice(0, 4);

  const keyContacts = contacts
    .filter((contact) => contact.is_active)
    .sort((left, right) => Number(right.is_primary) - Number(left.is_primary))
    .slice(0, 3);

  const healthAlerts = [
    openNcCount > 0 ? `${openNcCount} non conformità aperte da presidiare.` : null,
    overdueTasks.length > 0 ? `${overdueTasks.length} attività sono oltre scadenza.` : null,
    documentExpiredCount > 0 ? `${documentExpiredCount} documenti risultano scaduti.` : null,
    documentReviewQueue.length > 0
      ? `${documentReviewQueue.length} documenti attendono review intake.`
      : null,
    contractDocumentMismatches.length > 0
      ? `${contractDocumentMismatches.length} contratti documentali non sono allineati al workspace.`
      : null,
    contract?.end_date && toDateStart(contract.end_date) <= contractAttentionLimit
      ? `Contratto in scadenza il ${toDateLabel(contract.end_date)}.`
      : null,
  ].filter((alert): alert is string => Boolean(alert));

  const activeServiceLines = serviceLines.filter((line) => line.active);
  const hasTrackedServiceLines = activeServiceLines.length > 0;
  const unlinkedOpenTasksCount = hasTrackedServiceLines
    ? openTasks.filter((task) => !task.service_line_id).length
    : 0;
  const unlinkedOpenManualDeadlinesCount = hasTrackedServiceLines
    ? manualDeadlines.filter(
        (deadline) => deadline.status === "open" && !deadline.service_line_id
      ).length
    : 0;
  const recurringServiceLinesCount = activeServiceLines.filter(
    (line) => line.is_recurring
  ).length;

  return {
    activeServiceLines,
    contractDocumentMismatches,
    documentExpiredCount,
    documentExpiringSoonCount,
    documentReviewQueue,
    hasTrackedServiceLines,
    healthAlerts,
    keyContacts,
    nextActions,
    openTasks,
    overviewStats,
    overdueDeadlines,
    overdueTasks,
    recurringServiceLinesCount,
    riskLevel,
    upcomingDeadlines,
    unlinkedOpenManualDeadlinesCount,
    unlinkedOpenTasksCount,
  };
}

export function buildLocationInsights({
  aggregatedDeadlines,
  audits,
  client,
  contacts,
  documents,
  openTasks,
}: {
  aggregatedDeadlines: AggregatedDeadline[];
  audits: ClientWorkspaceAuditItem[];
  client: ClientDetail;
  contacts: ClientContactRecord[];
  documents: DocumentListItem[];
  openTasks: ClientTaskRecord[];
}) {
  return client.locations.map((location) => {
    const locationAudits = audits.filter((audit) => audit.location_id === location.id);
    const locationTasks = openTasks.filter((task) => task.location_id === location.id);
    const locationDocuments = documents.filter((document) => document.location_id === location.id);
    const locationContacts = contacts.filter((contact) => contact.location_id === location.id);
    const nextLocationDeadline = aggregatedDeadlines.find(
      (deadline) => deadline.location_id === location.id && deadline.status === "open"
    );

    return {
      audits: locationAudits.length,
      contacts: locationContacts.length,
      documents: locationDocuments.length,
      location,
      nextDeadline: nextLocationDeadline?.due_date ?? null,
      tasks: locationTasks.length,
    };
  });
}

export function summarizeClientAudits(audits: ClientWorkspaceAuditItem[]) {
  const closedAudits = audits.filter((audit) => audit.status === "Closed").length;
  const scheduledAudits = audits.filter((audit) => audit.status === "Scheduled").length;
  const scoredAudits = audits.filter((audit) => typeof audit.score === "number");
  const averageScore =
    scoredAudits.reduce((sum, audit) => sum + (audit.score ?? 0), 0) /
    Math.max(scoredAudits.length, 1);

  return {
    averageScore,
    closedAudits,
    scheduledAudits,
  };
}

export function buildClientWorkspaceActivityTimeline({
  deadlines,
  documents,
  locationMap,
  notes,
  tasks,
  timelineEvents,
}: {
  deadlines: ClientDeadlineRecord[];
  documents: DocumentListItem[];
  locationMap: Map<string, string>;
  notes: ClientNoteRecord[];
  tasks: ClientTaskRecord[];
  timelineEvents: AuditTimelineEvent[];
}) {
  return buildClientActivityTimeline({
    deadlines,
    documents,
    locationMap,
    notes,
    tasks,
    timelineEvents,
  });
}

export function buildClientWorkspaceServiceCoverage({
  activeServiceLines,
  audits,
  client,
  deadlines,
  documents,
  tasks,
  today,
}: {
  activeServiceLines: ClientServiceLineRecord[];
  audits: ClientWorkspaceAuditItem[];
  client: ClientDetail;
  deadlines: ClientDeadlineRecord[];
  documents: DocumentListItem[];
  tasks: ClientTaskRecord[];
  today: Date;
}) {
  return buildClientServiceCoverage({
    audits,
    deadlines,
    documents,
    locations: client.locations.map((location) => ({
      id: location.id,
      is_active: location.is_active ?? true,
      name: location.name,
    })),
    serviceLines: activeServiceLines,
    tasks,
    today,
  });
}
