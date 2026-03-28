import {
  buildDashboardActionCenter,
  type ActionCenterAuditRow,
  type ActionCenterNcRow,
  type ActionCenterPersonnelRow,
  type ActionCenterTrainingRecordRow,
  type CorrectiveActionRow,
  type DashboardActionCenter,
  type DocumentRow,
} from "@/features/dashboard/lib/dashboard-action-center";
import {
  addDays,
  getFullName,
  getRelationName,
  getRelationValue,
  getStartOfToday,
  type NamedRelation,
  type Relation,
} from "@/features/dashboard/lib/dashboard-data-utils";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import { parseOrganizationConsoleConfig } from "@/features/organization/lib/organization-console-config";
import type { Json } from "@/types/database.types";

export type {
  DashboardActionCenter,
  DashboardNotification,
  DashboardTodoItem,
} from "@/features/dashboard/lib/dashboard-action-center";

export interface DashboardFilters {
  clientId?: string;
  locationId?: string;
  dateFrom?: string; // ISO date string YYYY-MM-DD
  dateTo?: string;
}

export interface DashboardMetrics {
  totalAudits: number;
  openNCs: number;
  overdueACs: number;
  avgScore: number | null;
}

export interface GlobalNC {
  id: string;
  title: string;
  severity: string;
  status: string;
  auditId: string;
  auditTitle: string;
  clientName: string;
  locationName: string;
  auditDate: string | null;
  checklistItemQuestion: string | null;
}

export interface TrendPoint {
  date: string;
  score: number;
  auditTitle: string;
  clientName: string;
}

export interface RecentAudit {
  id: string;
  title: string;
  clientName: string;
  locationName: string;
  scheduledDate: string | null;
  status: string;
  score: number | null;
}

export interface UpcomingAudit {
  id: string;
  title: string;
  clientName: string;
  locationName: string;
  scheduledDate: string;
  daysUntil: number;
  isOverdue: boolean;
}

export interface MonthlyKPIs {
  auditsThisMonth: number;
  openNCsTotal: number;
  complianceAvg: number | null;
}

export interface MedicalVisitDeadline {
  id: string;
  personnelId: string;
  personnelName: string;
  clientName: string;
  expiryDate: string;
  daysUntil: number;
  urgency: "overdue" | "warning" | "ok";
}

export interface TrainingDeadline {
  id: string;
  personnelId: string;
  personnelName: string;
  clientName: string;
  courseTitle: string;
  expiryDate: string;
  daysUntil: number;
  urgency: "overdue" | "warning" | "ok";
}

export interface ClientOption {
  id: string;
  name: string;
}

export interface LocationOption {
  id: string;
  name: string;
  clientId: string;
}

type ClientRow = {
  id: string;
  name: string;
};

type LocationRow = {
  id: string;
  name: string;
  client_id: string;
};

type AuditMetricRow = {
  id: string;
  score: number | null;
};

type AuditInfoRow = {
  id: string;
  title: string | null;
  scheduled_date: string | null;
  client: NamedRelation;
  location: NamedRelation;
};

type AuditTrendRow = {
  id: string;
  title: string | null;
  scheduled_date: string | null;
  score: number | null;
  client: NamedRelation;
};

type AuditListRow = {
  id: string;
  title: string | null;
  scheduled_date: string | null;
  status: string | null;
  score: number | null;
  client: NamedRelation;
  location: NamedRelation;
};

type OrganizationSettingsRow = {
  settings: Json | null;
};

type IdRow = {
  id: string;
};

type GlobalNcRow = {
  id: string;
  title: string | null;
  severity: string | null;
  status: string | null;
  audit_id: string;
  checklist_items: Relation<{ question: string | null }>;
};

type PersonnelRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  client_id: string | null;
  client: NamedRelation;
};

type CourseRow = {
  id: string;
  title: string | null;
};

type TrainingDeadlineRecordRow = {
  id: string;
  personnel_id: string;
  course_id: string;
  expiry_date: string;
};

type MedicalVisitRow = {
  id: string;
  personnel_id: string;
  expiry_date: string;
};

type AuditFilterQuery<T> = {
  eq(column: string, value: string): T;
  gte(column: string, value: string): T;
  lte(column: string, value: string): T;
};

// ─── Clients + Locations for filter selects ────────────────────────────────
export async function getDashboardFilterOptions(): Promise<{
  clients: ClientOption[];
  locations: LocationOption[];
}> {
  const ctx = await getOrganizationContext();
  if (!ctx) return { clients: [], locations: [] };
  const { supabase, organizationId } = ctx;

  const [{ data: clients }, { data: locations }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("locations")
      .select("id, name, client_id")
      .eq("organization_id", organizationId)
      .order("name"),
  ]);

  const clientRows = (clients ?? []) as ClientRow[];
  const locationRows = (locations ?? []) as LocationRow[];

  return {
    clients: clientRows.map((client) => ({ id: client.id, name: client.name })),
    locations: locationRows.map((location) => ({
      id: location.id,
      name: location.name,
      clientId: location.client_id,
    })),
  };
}

// ─── Build audit WHERE clause from filters ─────────────────────────────────
function applyAuditFilters<T>(
  query: T,
  organizationId: string,
  filters: DashboardFilters
) {
  let filteredQuery = query as T & AuditFilterQuery<T>;

  filteredQuery = filteredQuery.eq("organization_id", organizationId) as T & AuditFilterQuery<T>;
  if (filters.clientId) {
    filteredQuery = filteredQuery.eq("client_id", filters.clientId) as T & AuditFilterQuery<T>;
  }
  if (filters.locationId) {
    filteredQuery = filteredQuery.eq("location_id", filters.locationId) as T & AuditFilterQuery<T>;
  }
  if (filters.dateFrom) {
    filteredQuery = filteredQuery.gte("scheduled_date", filters.dateFrom) as T & AuditFilterQuery<T>;
  }
  if (filters.dateTo) {
    filteredQuery = filteredQuery.lte("scheduled_date", filters.dateTo) as T & AuditFilterQuery<T>;
  }

  return filteredQuery as T;
}

// ─── Dashboard Metrics ─────────────────────────────────────────────────────
export async function getDashboardMetrics(
  filters: DashboardFilters
): Promise<DashboardMetrics> {
  const ctx = await getOrganizationContext();
  if (!ctx)
    return { totalAudits: 0, openNCs: 0, overdueACs: 0, avgScore: null };
  const { supabase, organizationId } = ctx;

  // 1. Audits in period
  const auditsQuery = applyAuditFilters(
    supabase.from("audits").select("id, score", { count: "exact" }),
    organizationId,
    filters
  );
  const { data: auditsData, count: auditsCount } = await auditsQuery;
  const auditRows = (auditsData ?? []) as AuditMetricRow[];

  const auditIds = auditRows.map((audit) => audit.id);
  const scores = auditRows
    .map((audit) => audit.score)
    .filter((score): score is number => score !== null && score !== undefined);
  const avgScore =
    scores.length > 0
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : null;

  // 2. Open NCs (from filtered audits)
  let openNCs = 0;
  if (auditIds.length > 0) {
    const { count } = await supabase
      .from("non_conformities")
      .select("id", { count: "exact", head: true })
      .in("audit_id", auditIds)
      .is("deleted_at", null)
      .eq("status", "open");
    openNCs = count ?? 0;
  }

  // 3. Overdue ACs (from NCs in filtered audits)
  let overdueACs = 0;
  if (auditIds.length > 0) {
    const { data: ncIds } = await supabase
      .from("non_conformities")
      .select("id")
      .in("audit_id", auditIds)
      .is("deleted_at", null);

    const ncIdList = ((ncIds ?? []) as IdRow[]).map((nonConformity) => nonConformity.id);
    if (ncIdList.length > 0) {
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase
        .from("corrective_actions")
        .select("id", { count: "exact", head: true })
        .in("non_conformity_id", ncIdList)
        .is("deleted_at", null)
        .neq("status", "completed")
        .lt("target_completion_date", today);
      overdueACs = count ?? 0;
    }
  }

  return {
    totalAudits: auditsCount ?? 0,
    openNCs,
    overdueACs,
    avgScore,
  };
}

// ─── Global NC Table ───────────────────────────────────────────────────────
export async function getGlobalNCs(
  filters: DashboardFilters
): Promise<GlobalNC[]> {
  const ctx = await getOrganizationContext();
  if (!ctx) return [];
  const { supabase, organizationId } = ctx;

  // Get filtered audit ids with client/location info
  const auditsQuery = applyAuditFilters(
    supabase
      .from("audits")
      .select(
        "id, title, scheduled_date, client:client_id(name), location:location_id(name)"
      ),
    organizationId,
    filters
  );
  const { data: audits } = await auditsQuery;

  if (!audits || audits.length === 0) return [];
  const auditRows = audits as AuditInfoRow[];

  type AuditInfo = { title: string; date: string | null; clientName: string; locationName: string };
  const auditMap = new Map<string, AuditInfo>(
    auditRows.map((audit) => [
      audit.id,
      {
        title: audit.title ?? "",
        date: audit.scheduled_date ?? null,
        clientName: getRelationName(audit.client),
        locationName: getRelationName(audit.location),
      },
    ])
  );
  const auditIds = auditRows.map((audit) => audit.id);

  // Fetch NCs for those audits (excluding cancelled)
  const { data: ncs } = await supabase
    .from("non_conformities")
    .select(
      "id, title, severity, status, audit_id, checklist_items:checklist_item_id(question)"
    )
    .in("audit_id", auditIds)
    .is("deleted_at", null)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(100);

  return ((ncs ?? []) as GlobalNcRow[]).map((nc) => {
    const audit = auditMap.get(nc.audit_id);
    const itemQuestion = getRelationValue(nc.checklist_items)?.question ?? null;

    return {
      id: nc.id,
      title: nc.title ?? "",
      severity: nc.severity ?? "minor",
      status: nc.status ?? "open",
      auditId: nc.audit_id,
      auditTitle: audit?.title ?? "",
      clientName: audit?.clientName ?? "",
      locationName: audit?.locationName ?? "",
      auditDate: audit?.date ?? null,
      checklistItemQuestion: itemQuestion,
    } as GlobalNC;
  });
}

// ─── Audit Score Trend ─────────────────────────────────────────────────────
export async function getAuditScoreTrend(
  filters: DashboardFilters
): Promise<TrendPoint[]> {
  const ctx = await getOrganizationContext();
  if (!ctx) return [];
  const { supabase, organizationId } = ctx;

  const auditsQuery = applyAuditFilters(
    supabase
      .from("audits")
      .select(
        "id, title, scheduled_date, score, client:client_id(name)"
      ),
    organizationId,
    filters
  );
  const { data: audits } = await auditsQuery;
  const auditRows = (audits ?? []) as AuditTrendRow[];

  return auditRows
    .filter(
      (audit): audit is AuditTrendRow & { score: number; scheduled_date: string } =>
        audit.score !== null && audit.scheduled_date !== null
    )
    .sort((left, right) =>
      new Date(left.scheduled_date).getTime() -
      new Date(right.scheduled_date).getTime()
    )
    .map((audit) => ({
      date: new Intl.DateTimeFormat("it-IT", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      }).format(new Date(audit.scheduled_date)),
      score: Number(Number(audit.score).toFixed(1)),
      auditTitle: audit.title ?? "",
      clientName: getRelationName(audit.client),
    }));
}

// ─── D2: Recent Audits (last 5) ────────────────────────────────────────────
export async function getRecentAudits(): Promise<RecentAudit[]> {
  const ctx = await getOrganizationContext();
  if (!ctx) return [];
  const { supabase, organizationId } = ctx;

  const { data: audits } = await supabase
    .from("audits")
    .select(
      "id, title, scheduled_date, status, score, client:client_id(name), location:location_id(name)"
    )
    .eq("organization_id", organizationId)
    .order("scheduled_date", { ascending: false })
    .limit(5);

  return ((audits ?? []) as AuditListRow[]).map((audit) => ({
    id: audit.id,
    title: audit.title ?? "",
    clientName: getRelationName(audit.client),
    locationName: getRelationName(audit.location),
    scheduledDate: audit.scheduled_date,
    status: audit.status ?? "planned",
    score: audit.score ?? null,
  }));
}

// ─── D3: Upcoming Audits (next 7 days) ─────────────────────────────────────
export async function getUpcomingAudits(): Promise<UpcomingAudit[]> {
  const ctx = await getOrganizationContext();
  if (!ctx) return [];
  const { supabase, organizationId } = ctx;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data: organization } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", organizationId)
    .single();
  const config = parseOrganizationConsoleConfig((organization as OrganizationSettingsRow | null)?.settings);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + config.rules.auditAlertDays);

  const todayIso = today.toISOString().split("T")[0];
  const nextWeekIso = nextWeek.toISOString().split("T")[0];

  const { data: audits } = await supabase
    .from("audits")
    .select(
      "id, title, scheduled_date, status, client:client_id(name), location:location_id(name)"
    )
    .eq("organization_id", organizationId)
    .gte("scheduled_date", todayIso)
    .lte("scheduled_date", nextWeekIso)
    .neq("status", "completed")
    .neq("status", "cancelled")
    .order("scheduled_date", { ascending: true });

  return ((audits ?? []) as AuditListRow[])
    .filter((audit): audit is AuditListRow & { scheduled_date: string } => audit.scheduled_date !== null)
    .map((audit) => {
      const auditDate = new Date(audit.scheduled_date);
    const diff = Math.ceil(
      (auditDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      id: audit.id,
      title: audit.title ?? "",
      clientName: getRelationName(audit.client),
      locationName: getRelationName(audit.location),
      scheduledDate: new Intl.DateTimeFormat("it-IT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(auditDate),
      daysUntil: Math.max(0, diff),
      isOverdue: diff < 0,
    };
    });
}

// ─── D1: Monthly KPIs (fixed: this month, all NCs, last 30 days compliance) ──
export async function getMonthlyKPIs(): Promise<MonthlyKPIs> {
  const ctx = await getOrganizationContext();
  if (!ctx)
    return { auditsThisMonth: 0, openNCsTotal: 0, complianceAvg: null };
  const { supabase, organizationId } = ctx;

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthStartIso = monthStart.toISOString().split("T")[0];
  const todayIso = today.toISOString().split("T")[0];

  // 1. Audits scheduled in this month
  const { count: auditsThisMonth } = await supabase
    .from("audits")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("scheduled_date", monthStartIso)
    .lte("scheduled_date", todayIso);

  // 2. Open NCs (all, not filtered)
  const { count: openNCsTotal } = await supabase
    .from("non_conformities")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .eq("status", "open");

  // 3. Compliance average (score) for last 30 days
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoIso = thirtyDaysAgo.toISOString().split("T")[0];

  const { data: auditScores } = await supabase
    .from("audits")
    .select("score")
    .eq("organization_id", organizationId)
    .gte("scheduled_date", thirtyDaysAgoIso)
    .lte("scheduled_date", todayIso)
    .not("score", "is", null);

  const scores = ((auditScores ?? []) as Array<{ score: number | null }>)
    .map((audit) => audit.score)
    .filter((score): score is number => score !== null && score !== undefined);
  const complianceAvg =
    scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : null;

  return {
    auditsThisMonth: auditsThisMonth ?? 0,
    openNCsTotal: openNCsTotal ?? 0,
    complianceAvg,
  };
}

// ─── F5: Training Certificate Deadlines ────────────────────────────────────
export async function getTrainingDeadlines(
  filters: DashboardFilters
): Promise<TrainingDeadline[]> {
  const ctx = await getOrganizationContext();
  if (!ctx) return [];
  const { supabase, organizationId } = ctx;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ninetyDaysOut = addDays(today, 90);
  const ninetyDaysOutIso = ninetyDaysOut.toISOString().split("T")[0];

  let personnelQuery = supabase
    .from("personnel")
    .select("id, first_name, last_name, client_id, client:client_id(name)")
    .eq("organization_id", organizationId)
    .eq("is_active", true);

  if (filters.clientId) {
    personnelQuery = personnelQuery.eq("client_id", filters.clientId);
  }

  const { data: personnel } = await personnelQuery;
  if (!personnel || personnel.length === 0) return [];
  const personnelRows = personnel as PersonnelRow[];

  const personnelIds = personnelRows.map((person) => person.id);
  const personnelMap = new Map<string, PersonnelRow>(
    personnelRows.map((person) => [person.id, person])
  );

  const { data: records } = await supabase
    .from("training_records")
    .select("id, personnel_id, course_id, expiry_date")
    .in("personnel_id", personnelIds)
    .not("expiry_date", "is", null)
    .lte("expiry_date", ninetyDaysOutIso)
    .order("expiry_date", { ascending: true });

  if (!records || records.length === 0) return [];
  const trainingRecords = records as TrainingDeadlineRecordRow[];

  const courseIds = Array.from(new Set(trainingRecords.map((record) => record.course_id)));
  const { data: courses } = await supabase
    .from("training_courses")
    .select("id, title")
    .in("id", courseIds);

  const courseMap = new Map<string, string>(
    ((courses ?? []) as CourseRow[]).map((course) => [course.id, course.title ?? "Corso sconosciuto"])
  );

  return trainingRecords.map((record) => {
    const person = personnelMap.get(record.personnel_id);
    const expiryDate = new Date(record.expiry_date);
    const daysUntil = Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    let urgency: TrainingDeadline["urgency"];
    if (daysUntil < 0) urgency = "overdue";
    else if (daysUntil <= 30) urgency = "warning";
    else urgency = "ok";

    return {
      id: record.id,
      personnelId: record.personnel_id,
      personnelName: getFullName(person ?? null),
      clientName: person ? getRelationName(person.client) : "",
      courseTitle: courseMap.get(record.course_id) ?? "Corso sconosciuto",
      expiryDate: new Intl.DateTimeFormat("it-IT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(expiryDate),
      daysUntil,
      urgency,
    } satisfies TrainingDeadline;
  });
}

// ─── P5: Medical Visit Deadlines ───────────────────────────────────────────
export async function getMedicalVisitDeadlines(
  filters: DashboardFilters
): Promise<MedicalVisitDeadline[]> {
  const ctx = await getOrganizationContext();
  if (!ctx) return [];
  const { supabase, organizationId } = ctx;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ninetyDaysOut = addDays(today, 90);
  const ninetyDaysOutIso = ninetyDaysOut.toISOString().split("T")[0];

  let personnelQuery = supabase
    .from("personnel")
    .select("id, first_name, last_name, client_id, client:client_id(name)")
    .eq("organization_id", organizationId)
    .eq("is_active", true);

  if (filters.clientId) {
    personnelQuery = personnelQuery.eq("client_id", filters.clientId);
  }

  const { data: personnel } = await personnelQuery;
  if (!personnel || personnel.length === 0) return [];
  const personnelRows = personnel as PersonnelRow[];

  const personnelIds = personnelRows.map((person) => person.id);
  const personnelMap = new Map<string, PersonnelRow>(
    personnelRows.map((person) => [person.id, person])
  );

  const { data: visits } = await supabase
    .from("medical_visits")
    .select("id, personnel_id, expiry_date")
    .in("personnel_id", personnelIds)
    .not("expiry_date", "is", null)
    .lte("expiry_date", ninetyDaysOutIso)
    .order("expiry_date", { ascending: true });

  return ((visits ?? []) as MedicalVisitRow[]).map((visit) => {
    const person = personnelMap.get(visit.personnel_id);
    const expiryDate = new Date(visit.expiry_date);
    const daysUntil = Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    let urgency: MedicalVisitDeadline["urgency"];
    if (daysUntil < 0) urgency = "overdue";
    else if (daysUntil <= 30) urgency = "warning";
    else urgency = "ok";

    return {
      id: visit.id,
      personnelId: visit.personnel_id,
      personnelName: getFullName(person ?? null),
      clientName: person ? getRelationName(person.client) : "",
      expiryDate: new Intl.DateTimeFormat("it-IT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(expiryDate),
      daysUntil,
      urgency,
    } satisfies MedicalVisitDeadline;
  });
}

export async function getDashboardActionCenter(
  filters: DashboardFilters
): Promise<DashboardActionCenter> {
  const ctx = await getOrganizationContext();
  if (!ctx) return { notifications: [], todos: [] };
  const { supabase, organizationId } = ctx;

  const { data: organization } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", organizationId)
    .single();
  const config = parseOrganizationConsoleConfig((organization as OrganizationSettingsRow | null)?.settings);

  const today = getStartOfToday();

  const { data: audits } = await applyAuditFilters(
    supabase
      .from("audits")
      .select(
        "id, title, scheduled_date, status, client_id, location_id, client:client_id(name), location:location_id(name)"
      ),
    organizationId,
    filters
  )
    .order("scheduled_date", { ascending: true })
    .limit(80);
  const auditRows = (audits ?? []) as ActionCenterAuditRow[];

  const auditIds = auditRows.map((audit) => audit.id);

  const { data: openNCs } = auditIds.length
      ? await supabase
        .from("non_conformities")
        .select("id, title, severity, status, audit_id")
        .in("audit_id", auditIds)
        .is("deleted_at", null)
        .eq("status", "open")
        .order("created_at", { ascending: false })
    : { data: [] as ActionCenterNcRow[] };
  const openNcRows = (openNCs ?? []) as ActionCenterNcRow[];

  const ncIds = openNcRows.map((nonConformity) => nonConformity.id);
  const { data: correctiveActions } = ncIds.length
      ? await supabase
        .from("corrective_actions")
        .select("id, non_conformity_id, status, target_completion_date, responsible_person_name")
        .in("non_conformity_id", ncIds)
        .is("deleted_at", null)
        .order("target_completion_date", { ascending: true, nullsFirst: false })
    : { data: [] as CorrectiveActionRow[] };

  let documentsQuery = supabase
    .from("documents")
    .select("id, title, expiry_date, status, client_id, location_id, personnel_id")
    .eq("organization_id", organizationId)
    .not("expiry_date", "is", null)
    .order("expiry_date", { ascending: true });

  if (filters.clientId) {
    documentsQuery = documentsQuery.eq("client_id", filters.clientId);
  }
  if (filters.locationId) {
    documentsQuery = documentsQuery.eq("location_id", filters.locationId);
  }

  let personnelQuery = supabase
    .from("personnel")
    .select("id, first_name, last_name, is_active, client_id, location_id")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("last_name")
    .order("first_name");

  if (filters.clientId) {
    personnelQuery = personnelQuery.eq("client_id", filters.clientId);
  }
  if (filters.locationId) {
    personnelQuery = personnelQuery.eq("location_id", filters.locationId);
  }

  const [{ data: documents }, { data: personnel }] = await Promise.all([
    documentsQuery,
    personnelQuery,
  ]);
  const documentRows = (documents ?? []) as DocumentRow[];
  const personnelRows = (personnel ?? []) as ActionCenterPersonnelRow[];

  const personnelIds = personnelRows.map((person) => person.id);
  const { data: trainingRecords } = personnelIds.length
    ? await supabase
        .from("training_records")
        .select("id, personnel_id, expiry_date, completion_date, course:course_id(title)")
        .eq("organization_id", organizationId)
        .in("personnel_id", personnelIds)
        .not("expiry_date", "is", null)
        .order("expiry_date", { ascending: true })
    : { data: [] as ActionCenterTrainingRecordRow[] };
  const correctiveActionRows = (correctiveActions ?? []) as CorrectiveActionRow[];
  const trainingRecordRows = (trainingRecords ?? []) as ActionCenterTrainingRecordRow[];

  return buildDashboardActionCenter({
    auditRows,
    config,
    correctiveActionRows,
    documentRows,
    openNcRows,
    personnelRows,
    today,
    trainingRecordRows,
  });
}
