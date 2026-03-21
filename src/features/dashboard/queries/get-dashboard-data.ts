import { createClient } from "@/lib/supabase/server";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import { parseOrganizationConsoleConfig } from "@/features/organization/lib/organization-console-config";

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

export interface DashboardNotification {
  id: string;
  title: string;
  description: string;
  href: string;
  tone: "default" | "warning" | "danger";
}

export interface DashboardTodoItem {
  id: string;
  title: string;
  description: string;
  href: string;
  badge?: string;
  priority: "normal" | "high" | "urgent";
}

export interface DashboardActionCenter {
  notifications: DashboardNotification[];
  todos: DashboardTodoItem[];
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
      .order("name"),
    supabase
      .from("locations")
      .select("id, name, client_id")
      .eq("organization_id", organizationId)
      .order("name"),
  ]);

  return {
    clients: (clients ?? []).map((c: any) => ({ id: c.id, name: c.name })),
    locations: (locations ?? []).map((l: any) => ({
      id: l.id,
      name: l.name,
      clientId: l.client_id,
    })),
  };
}

// ─── Build audit WHERE clause from filters ─────────────────────────────────
function applyAuditFilters(
  query: any,
  organizationId: string,
  filters: DashboardFilters
) {
  query = query.eq("organization_id", organizationId);
  if (filters.clientId) query = query.eq("client_id", filters.clientId);
  if (filters.locationId) query = query.eq("location_id", filters.locationId);
  if (filters.dateFrom) query = query.gte("scheduled_date", filters.dateFrom);
  if (filters.dateTo) query = query.lte("scheduled_date", filters.dateTo);
  return query;
}

function getStartOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDateLabel(dateString: string | null) {
  if (!dateString) return "Senza data";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
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

  const auditIds = (auditsData ?? []).map((a: any) => a.id as string);
  const scores = (auditsData ?? [])
    .map((a: any) => a.score)
    .filter((s: any) => s !== null && s !== undefined) as number[];
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
      .eq("status", "open");
    openNCs = count ?? 0;
  }

  // 3. Overdue ACs (from NCs in filtered audits)
  let overdueACs = 0;
  if (auditIds.length > 0) {
    const { data: ncIds } = await supabase
      .from("non_conformities")
      .select("id")
      .in("audit_id", auditIds);

    const ncIdList = (ncIds ?? []).map((nc: any) => nc.id as string);
    if (ncIdList.length > 0) {
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase
        .from("corrective_actions")
        .select("id", { count: "exact", head: true })
        .in("non_conformity_id", ncIdList)
        .neq("status", "verified")
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

  type AuditInfo = { title: string; date: string | null; clientName: string; locationName: string };
  const auditMap = new Map<string, AuditInfo>(
    audits.map((a: any) => [
      a.id as string,
      {
        title: (a.title ?? "") as string,
        date: (a.scheduled_date ?? null) as string | null,
        clientName: (a.client?.name ?? "") as string,
        locationName: (a.location?.name ?? "") as string,
      },
    ])
  );
  const auditIds = audits.map((a: any) => a.id as string);

  // Fetch NCs for those audits (excluding cancelled)
  const { data: ncs } = await supabase
    .from("non_conformities")
    .select(
      "id, title, severity, status, audit_id, checklist_items:checklist_item_id(question)"
    )
    .in("audit_id", auditIds)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(100);

  return (ncs ?? []).map((nc: any) => {
    const audit = auditMap.get(nc.audit_id);
    const itemQuestion = Array.isArray(nc.checklist_items)
      ? nc.checklist_items[0]?.question ?? null
      : nc.checklist_items?.question ?? null;

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

  return (audits ?? [])
    .filter((a: any) => a.score !== null && a.scheduled_date)
    .sort((a: any, b: any) =>
      new Date(a.scheduled_date).getTime() -
      new Date(b.scheduled_date).getTime()
    )
    .map((a: any) => ({
      date: new Intl.DateTimeFormat("it-IT", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      }).format(new Date(a.scheduled_date)),
      score: Number(Number(a.score).toFixed(1)),
      auditTitle: a.title ?? "",
      clientName: a.client?.name ?? "",
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

  return (audits ?? []).map((a: any) => ({
    id: a.id,
    title: a.title ?? "",
    clientName: a.client?.name ?? "",
    locationName: a.location?.name ?? "",
    scheduledDate: a.scheduled_date,
    status: a.status ?? "planned",
    score: a.score ?? null,
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
  const config = parseOrganizationConsoleConfig(organization?.settings);
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

  return (audits ?? []).map((a: any) => {
    const auditDate = new Date(a.scheduled_date);
    const diff = Math.ceil(
      (auditDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      id: a.id,
      title: a.title ?? "",
      clientName: a.client?.name ?? "",
      locationName: a.location?.name ?? "",
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

  const scores = (auditScores ?? [])
    .map((a: any) => a.score)
    .filter((s: any) => s !== null && s !== undefined) as number[];
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

  const personnelIds = personnel.map((p: any) => p.id as string);
  const personnelMap = new Map<string, any>(
    personnel.map((p: any) => [p.id as string, p])
  );

  const { data: records } = await supabase
    .from("training_records")
    .select("id, personnel_id, course_id, expiry_date")
    .in("personnel_id", personnelIds)
    .not("expiry_date", "is", null)
    .lte("expiry_date", ninetyDaysOutIso)
    .order("expiry_date", { ascending: true });

  if (!records || records.length === 0) return [];

  const courseIds = Array.from(new Set(records.map((r: any) => r.course_id as string)));
  const { data: courses } = await supabase
    .from("training_courses")
    .select("id, title")
    .in("id", courseIds);

  const courseMap = new Map<string, string>(
    (courses ?? []).map((c: any) => [c.id as string, c.title as string])
  );

  return records.map((r: any) => {
    const person = personnelMap.get(r.personnel_id);
    const expiryDate = new Date(r.expiry_date);
    const daysUntil = Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    let urgency: TrainingDeadline["urgency"];
    if (daysUntil < 0) urgency = "overdue";
    else if (daysUntil <= 30) urgency = "warning";
    else urgency = "ok";

    return {
      id: r.id,
      personnelId: r.personnel_id,
      personnelName: person
        ? `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim()
        : "Collaboratore",
      clientName: (person?.client as any)?.name ?? "",
      courseTitle: courseMap.get(r.course_id) ?? "Corso sconosciuto",
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

  const personnelIds = personnel.map((p: any) => p.id as string);
  const personnelMap = new Map<string, any>(
    personnel.map((p: any) => [p.id as string, p])
  );

  const { data: visits } = await supabase
    .from("medical_visits")
    .select("id, personnel_id, expiry_date")
    .in("personnel_id", personnelIds)
    .not("expiry_date", "is", null)
    .lte("expiry_date", ninetyDaysOutIso)
    .order("expiry_date", { ascending: true });

  return (visits ?? []).map((visit: any) => {
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
      personnelName: person
        ? `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim()
        : "Collaboratore",
      clientName: (person?.client as any)?.name ?? "",
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
  const config = parseOrganizationConsoleConfig(organization?.settings);

  const today = getStartOfToday();
  const sevenDaysOut = addDays(today, config.rules.auditAlertDays);
  const thirtyDaysOut = addDays(today, Math.max(config.rules.documentAlertDays, config.rules.trainingAlertDays));
  const todayIso = today.toISOString().split("T")[0];
  const sevenDaysOutIso = sevenDaysOut.toISOString().split("T")[0];

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

  const auditIds = (audits ?? []).map((audit: any) => audit.id as string);
  const auditsById = new Map<string, any>((audits ?? []).map((audit: any) => [audit.id as string, audit]));

  const { data: openNCs } = auditIds.length
    ? await supabase
        .from("non_conformities")
        .select("id, title, severity, status, audit_id")
        .in("audit_id", auditIds)
        .eq("status", "open")
        .order("created_at", { ascending: false })
    : { data: [] as any[] };

  const ncIds = (openNCs ?? []).map((nc: any) => nc.id as string);
  const { data: correctiveActions } = ncIds.length
    ? await supabase
        .from("corrective_actions")
        .select("id, non_conformity_id, status, target_completion_date, responsible_person_name")
        .in("non_conformity_id", ncIds)
        .order("target_completion_date", { ascending: true, nullsFirst: false })
    : { data: [] as any[] };

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

  const personnelIds = (personnel ?? []).map((person: any) => person.id as string);
  const { data: trainingRecords } = personnelIds.length
    ? await supabase
        .from("training_records")
        .select("id, personnel_id, expiry_date, completion_date, course:course_id(title)")
        .eq("organization_id", organizationId)
        .in("personnel_id", personnelIds)
        .not("expiry_date", "is", null)
        .order("expiry_date", { ascending: true })
    : { data: [] as any[] };

  const overdueAudits = (audits ?? []).filter((audit: any) => {
    if (!audit.scheduled_date) return false;
    const status = (audit.status ?? "").toLowerCase();
    if (["closed", "completed", "cancelled"].includes(status)) return false;
    return new Date(audit.scheduled_date) < today;
  });

  const upcomingAudits = (audits ?? []).filter((audit: any) => {
    if (!audit.scheduled_date) return false;
    const status = (audit.status ?? "").toLowerCase();
    if (["closed", "completed", "cancelled"].includes(status)) return false;
    const scheduledDate = new Date(audit.scheduled_date);
    return scheduledDate >= today && scheduledDate <= sevenDaysOut;
  });

  const criticalNCs = (openNCs ?? []).filter((nc: any) =>
    ["critical", "major"].includes((nc.severity ?? "").toLowerCase())
  );

  const overdueCorrectiveActions = (correctiveActions ?? []).filter((action: any) => {
    const status = (action.status ?? "").toLowerCase();
    if (["verified", "completed", "closed"].includes(status)) return false;
    if (!action.target_completion_date) return false;
    return new Date(action.target_completion_date) < today;
  });

  const overdueDocuments = (documents ?? []).filter((document: any) => {
    if (!document.expiry_date) return false;
    return new Date(document.expiry_date) < today;
  });

  const expiringDocuments = (documents ?? []).filter((document: any) => {
    if (!document.expiry_date) return false;
    const expiryDate = new Date(document.expiry_date);
    return expiryDate >= today && expiryDate <= addDays(today, config.rules.documentAlertDays);
  });

  const personNameById = new Map<string, string>(
    (personnel ?? []).map((person: any) => [
      person.id as string,
      `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim() || "Collaboratore",
    ])
  );

  const expiredTraining = (trainingRecords ?? []).filter((record: any) => {
    if (!record.expiry_date) return false;
    return new Date(record.expiry_date) < today;
  });

  const expiringTraining = (trainingRecords ?? []).filter((record: any) => {
    if (!record.expiry_date) return false;
    const expiryDate = new Date(record.expiry_date);
    return expiryDate >= today && expiryDate <= addDays(today, config.rules.trainingAlertDays);
  });

  const notifications: DashboardNotification[] = [];

  if (config.notifications.sendOverdueActions && overdueCorrectiveActions.length > 0) {
    notifications.push({
      id: "overdue-corrective-actions",
      title: `${overdueCorrectiveActions.length} azioni correttive scadute`,
      description: "Richiedono follow-up immediato e riallineamento con il responsabile.",
      href: "/non-conformities",
      tone: "danger",
    });
  }

  if (config.notifications.sendOpenNonConformities && criticalNCs.length > 0) {
    notifications.push({
      id: "critical-ncs",
      title: `${criticalNCs.length} non conformita prioritarie`,
      description: "Sono presenti NC critiche o maggiori ancora aperte nel perimetro filtrato.",
      href: "/non-conformities",
      tone: "warning",
    });
  }

  if (config.notifications.sendDocumentExpiry && (overdueDocuments.length > 0 || expiringDocuments.length > 0)) {
    notifications.push({
      id: "document-deadlines",
      title:
        overdueDocuments.length > 0
          ? `${overdueDocuments.length} documenti scaduti`
          : `${expiringDocuments.length} documenti in scadenza`,
      description:
        overdueDocuments.length > 0
          ? "Aggiornare o archiviare i documenti scaduti collegati a clienti, sedi o collaboratori."
          : "Verificare i documenti in scadenza nei prossimi 30 giorni.",
      href: "/clients",
      tone: overdueDocuments.length > 0 ? "danger" : "warning",
    });
  }

  if (config.notifications.sendTrainingExpiry && (expiredTraining.length > 0 || expiringTraining.length > 0)) {
    notifications.push({
      id: "training-deadlines",
      title:
        expiredTraining.length > 0
          ? `${expiredTraining.length} corsi formazione scaduti`
          : `${expiringTraining.length} corsi in scadenza`,
      description:
        expiredTraining.length > 0
          ? "Alcuni collaboratori hanno formazione non piu valida."
          : "Ci sono rinnovi formativi da pianificare entro 30 giorni.",
      href: "/clients",
      tone: expiredTraining.length > 0 ? "danger" : "warning",
    });
  }

  if (config.notifications.sendAuditUpcoming && upcomingAudits.length > 0) {
    notifications.push({
      id: "upcoming-audits",
      title: `${upcomingAudits.length} audit nei prossimi 7 giorni`,
      description: "Conviene confermare disponibilita, sede e checklist operative prima della settimana.",
      href: "/audits",
      tone: "default",
    });
  }

  const todos: DashboardTodoItem[] = [];

  for (const audit of overdueAudits.slice(0, 3)) {
    todos.push({
      id: `audit-${audit.id}`,
      title: audit.title ?? "Audit da riallineare",
      description: `Audit pianificato per ${formatDateLabel(audit.scheduled_date)} presso ${audit.client?.name ?? "cliente"}.`,
      href: `/audits/${audit.id}`,
      badge: "Audit scaduto",
      priority: "urgent",
    });
  }

  for (const action of overdueCorrectiveActions.slice(0, 3)) {
    todos.push({
      id: `ac-${action.id}`,
      title: action.responsible_person_name
        ? `Riallinea AC con ${action.responsible_person_name}`
        : "Aggiorna azione correttiva scaduta",
      description: `Target ${formatDateLabel(action.target_completion_date)}. Serve un avanzamento o una nuova data.`,
      href: `/non-conformities/${action.non_conformity_id}`,
      badge: "AC scaduta",
      priority: "urgent",
    });
  }

  for (const document of [...overdueDocuments, ...expiringDocuments].slice(0, 3)) {
    const href =
      document.personnel_id
        ? `/personnel/${document.personnel_id}`
        : document.client_id
          ? `/clients/${document.client_id}`
          : "/clients";

    todos.push({
      id: `document-${document.id}`,
      title: document.title ?? "Documento da aggiornare",
      description: `Scadenza ${formatDateLabel(document.expiry_date)}. Verificare validita e versioning.`,
      href,
      badge: new Date(document.expiry_date).getTime() < today.getTime() ? "Documento scaduto" : "Documento in scadenza",
      priority: new Date(document.expiry_date).getTime() < today.getTime() ? "high" : "normal",
    });
  }

  for (const record of [...expiredTraining, ...expiringTraining].slice(0, 3)) {
    todos.push({
      id: `training-${record.id}`,
      title: personNameById.get(record.personnel_id) ?? "Collaboratore da riallineare",
      description: `${record.course?.title ?? "Formazione"} con scadenza ${formatDateLabel(record.expiry_date)}.`,
      href: `/personnel/${record.personnel_id}`,
      badge: new Date(record.expiry_date).getTime() < today.getTime() ? "Formazione scaduta" : "Formazione in scadenza",
      priority: new Date(record.expiry_date).getTime() < today.getTime() ? "high" : "normal",
    });
  }

  if (todos.length === 0) {
    for (const audit of upcomingAudits.slice(0, 3)) {
      todos.push({
        id: `upcoming-audit-${audit.id}`,
        title: `Conferma audit: ${audit.title}`,
        description: `Previsto per ${formatDateLabel(audit.scheduled_date)} presso ${audit.client?.name ?? "cliente"}.`,
        href: `/audits/${audit.id}`,
        badge: "Prossimo audit",
        priority: "normal",
      });
    }
  }

  const priorityRank: Record<DashboardTodoItem["priority"], number> = {
    urgent: 0,
    high: 1,
    normal: 2,
  };

  return {
    notifications: notifications.slice(0, 4),
    todos: todos.sort((left, right) => priorityRank[left.priority] - priorityRank[right.priority]).slice(0, 8),
  };
}
