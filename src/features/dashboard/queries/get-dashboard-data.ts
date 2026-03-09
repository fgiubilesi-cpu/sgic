import { createClient } from "@/lib/supabase/server";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";

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
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

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
