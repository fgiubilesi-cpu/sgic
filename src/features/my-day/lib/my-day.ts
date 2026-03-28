import type {
  DailyExecutionItem,
  DailyExecutionOverview,
} from "@/features/clients/queries/get-daily-execution-overview";
import type { UnifiedDeadline } from "@/features/deadlines/queries/get-unified-deadlines";

export type MyDaySection = "blocked" | "overdue" | "review" | "this_week" | "today";
export type MyDayPriority = "high" | "normal" | "urgent";
export type MyDayTone = "danger" | "default" | "warning";
export type MyDaySource =
  | "audit"
  | "corrective_action"
  | "deadline"
  | "document"
  | "document_review"
  | "medical"
  | "task"
  | "training";

export interface ReviewDocumentSignal {
  clientName: string | null;
  href: string;
  id: string;
  ingestionStatus: "failed" | "review_required";
  locationName: string | null;
  personnelName: string | null;
  title: string;
  updatedAt: string | null;
}

export interface MyDayItem {
  badge: string;
  clientName: string | null;
  context: string;
  description: string;
  dueDate: string | null;
  href: string;
  id: string;
  ownerName: string | null;
  priority: MyDayPriority;
  section: MyDaySection;
  source: MyDaySource;
  title: string;
  tone: MyDayTone;
}

export interface MyDaySummary {
  blocked: number;
  critical: number;
  overdue: number;
  review: number;
  thisWeek: number;
  today: number;
}

export interface MyDayAgenda {
  sections: Record<MyDaySection, MyDayItem[]>;
  summary: MyDaySummary;
}

function startOfDay(referenceDate: Date) {
  return new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
}

function endOfWeek(referenceDate: Date) {
  const date = new Date(referenceDate);
  const day = date.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  date.setDate(date.getDate() + daysUntilSunday);
  date.setHours(0, 0, 0, 0);
  return date;
}

function parseDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function isSameDay(left: Date, right: Date) {
  return left.getTime() === right.getTime();
}

function priorityRank(priority: MyDayPriority) {
  if (priority === "urgent") return 0;
  if (priority === "high") return 1;
  return 2;
}

function toneFromPriority(priority: MyDayPriority): MyDayTone {
  if (priority === "urgent") return "danger";
  if (priority === "high") return "warning";
  return "default";
}

function buildContext(parts: Array<string | null | undefined>) {
  return parts.filter((part): part is string => Boolean(part && part.trim())).join(" · ");
}

function sortAgendaItems(left: MyDayItem, right: MyDayItem) {
  const leftDate = parseDate(left.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const rightDate = parseDate(right.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;

  return (
    priorityRank(left.priority) - priorityRank(right.priority) ||
    leftDate - rightDate ||
    left.title.localeCompare(right.title, "it")
  );
}

function priorityFromExecutionItem(item: DailyExecutionItem): MyDayPriority {
  if (item.critical_score >= 8 || item.critical_reasons.includes("Oltre termine")) {
    return "urgent";
  }
  if (
    item.critical_score >= 4 ||
    item.priority === "critical" ||
    item.priority === "high" ||
    item.status_label === "Bloccata"
  ) {
    return "high";
  }
  return "normal";
}

function badgeFromExecutionItem(item: DailyExecutionItem, section: MyDaySection) {
  if (section === "blocked") return "Da sbloccare";
  if (section === "overdue") return "In ritardo";
  if (section === "today") return "Oggi";
  if (item.kind === "task") return "Task";
  return item.source_label;
}

function sourceFromDeadline(deadline: UnifiedDeadline): MyDaySource {
  if (deadline.type === "corrective_action") return "corrective_action";
  if (deadline.type === "document") return "document";
  if (deadline.type === "medical") return "medical";
  if (deadline.type === "training") return "training";
  if (deadline.type === "audit") return "audit";
  return "deadline";
}

function priorityFromDeadline(deadline: UnifiedDeadline): MyDayPriority {
  if (deadline.urgency === "overdue") return "urgent";
  if (
    deadline.type === "corrective_action" ||
    deadline.type === "audit" ||
    deadline.urgency === "warning30"
  ) {
    return "high";
  }
  return "normal";
}

function badgeFromDeadline(deadline: UnifiedDeadline, section: MyDaySection) {
  if (section === "overdue") return "Scaduta";
  if (section === "today") return "Scade oggi";
  if (deadline.type === "audit") return "Audit";
  if (deadline.type === "corrective_action") return "AC";
  if (deadline.type === "document") return "Documento";
  if (deadline.type === "medical") return "Visita";
  if (deadline.type === "training") return "Formazione";
  return "Scadenza";
}

function mapExecutionItem(item: DailyExecutionItem, section: MyDaySection): MyDayItem {
  const priority = priorityFromExecutionItem(item);

  return {
    badge: badgeFromExecutionItem(item, section),
    clientName: item.client_name,
    context: buildContext([
      item.client_name,
      item.location_name,
      item.owner_name ? `Owner ${item.owner_name}` : null,
    ]),
    description: buildContext([
      item.source_label,
      item.status_label,
      item.critical_reasons[0] ?? null,
    ]),
    dueDate: item.due_date,
    href: item.href,
    id: `${item.kind}-${item.id}-${section}`,
    ownerName: item.owner_name,
    priority,
    section,
    source: item.kind === "task" ? "task" : "deadline",
    title: item.title,
    tone: toneFromPriority(priority),
  };
}

function mapDeadlineItem(deadline: UnifiedDeadline, section: MyDaySection): MyDayItem {
  const priority = priorityFromDeadline(deadline);

  return {
    badge: badgeFromDeadline(deadline, section),
    clientName: deadline.clientName,
    context: buildContext([
      deadline.clientName,
      deadline.personnelName,
    ]),
    description: deadline.description,
    dueDate: deadline.dueDate,
    href: deadline.href,
    id: `${deadline.type}-${deadline.id}-${section}`,
    ownerName: deadline.personnelName ?? null,
    priority,
    section,
    source: sourceFromDeadline(deadline),
    title: deadline.title,
    tone: toneFromPriority(priority),
  };
}

function mapReviewDocumentItem(document: ReviewDocumentSignal): MyDayItem {
  const priority: MyDayPriority =
    document.ingestionStatus === "failed" ? "urgent" : "high";

  return {
    badge: document.ingestionStatus === "failed" ? "Import fallito" : "Da validare",
    clientName: document.clientName,
    context: buildContext([
      document.clientName,
      document.locationName,
      document.personnelName,
    ]),
    description:
      document.ingestionStatus === "failed"
        ? "Verificare file, metadata o retry di acquisizione."
        : "Confermare dati estratti e collegamenti prima della pubblicazione interna.",
    dueDate: document.updatedAt,
    href: document.href,
    id: `document-review-${document.id}`,
    ownerName: null,
    priority,
    section: "review",
    source: "document_review",
    title: document.title,
    tone: toneFromPriority(priority),
  };
}

export function buildMyDayAgenda(input: {
  dailyExecutionOverview: DailyExecutionOverview;
  deadlines: UnifiedDeadline[];
  reviewDocuments: ReviewDocumentSignal[];
  today?: Date;
}): MyDayAgenda {
  const today = startOfDay(input.today ?? new Date());
  const weekEnd = endOfWeek(today);

  const overdueDeadlineItems = input.deadlines
    .filter((deadline) => deadline.urgency === "overdue")
    .map((deadline) => mapDeadlineItem(deadline, "overdue"));

  const todayDeadlineItems = input.deadlines
    .filter((deadline) => {
      const dueDate = parseDate(deadline.dueDate);
      return Boolean(dueDate && isSameDay(dueDate, today));
    })
    .map((deadline) => mapDeadlineItem(deadline, "today"));

  const thisWeekDeadlineItems = input.deadlines
    .filter((deadline) => {
      const dueDate = parseDate(deadline.dueDate);
      return Boolean(
        dueDate &&
          dueDate > today &&
          dueDate <= weekEnd
      );
    })
    .map((deadline) => mapDeadlineItem(deadline, "this_week"));

  const sections: Record<MyDaySection, MyDayItem[]> = {
    blocked: input.dailyExecutionOverview.blockedItems
      .map((item) => mapExecutionItem(item, "blocked"))
      .sort(sortAgendaItems),
    overdue: [
      ...input.dailyExecutionOverview.overdueItems.map((item) =>
        mapExecutionItem(item, "overdue")
      ),
      ...overdueDeadlineItems,
    ].sort(sortAgendaItems),
    review: input.reviewDocuments
      .map((document) => mapReviewDocumentItem(document))
      .sort(sortAgendaItems),
    this_week: [
      ...input.dailyExecutionOverview.thisWeekItems
        .filter((item) => {
          const dueDate = parseDate(item.due_date);
          return Boolean(dueDate && dueDate > today);
        })
        .map((item) => mapExecutionItem(item, "this_week")),
      ...thisWeekDeadlineItems,
    ].sort(sortAgendaItems),
    today: [
      ...input.dailyExecutionOverview.todayItems.map((item) =>
        mapExecutionItem(item, "today")
      ),
      ...todayDeadlineItems,
    ].sort(sortAgendaItems),
  };

  return {
    sections,
    summary: {
      blocked: sections.blocked.length,
      critical: input.dailyExecutionOverview.summary.critical,
      overdue: sections.overdue.length,
      review: sections.review.length,
      thisWeek: sections.this_week.length,
      today: sections.today.length,
    },
  };
}
