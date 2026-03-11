import type { AuditStatus } from "@/features/audits/queries/get-audits";
import type { AuditWithNCCount } from "@/features/audits/queries/get-audits";

export type AuditsListViewMode = "table" | "cards";
export type AuditsListGroupBy = "none" | "month" | "client" | "location" | "status";
export type AuditsListSort =
  | "scheduled_desc"
  | "scheduled_asc"
  | "score_desc"
  | "score_asc"
  | "nc_desc"
  | "title_asc";
export type AuditsListPeriod = "all" | "upcoming" | "past_due" | "last_90d" | "this_year";
export type AuditsListScoreBand = "all" | "lt70" | "70_85" | "gte85" | "unscored";

export type AuditsListState = {
  search: string;
  status: "all" | AuditStatus;
  clientId: string;
  locationId: string;
  period: AuditsListPeriod;
  hasOpenNc: boolean;
  scoreBand: AuditsListScoreBand;
  sort: AuditsListSort;
  groupBy: AuditsListGroupBy;
  viewMode: AuditsListViewMode;
};

export type AuditsListOptions = {
  clients: Array<{ id: string; label: string }>;
  locations: Array<{ id: string; label: string }>;
};

export type AuditsListKpis = {
  total: number;
  scheduled: number;
  inProgress: number;
  closed: number;
  openNc: number;
  averageScore: number | null;
};

export type AuditsListSection = {
  id: string;
  label: string;
  audits: AuditWithNCCount[];
};

type SearchParamValue = string | string[] | undefined;
type SearchParamsLike = Record<string, SearchParamValue>;

const DEFAULT_AUDITS_LIST_STATE: AuditsListState = {
  search: "",
  status: "all",
  clientId: "all",
  locationId: "all",
  period: "all",
  hasOpenNc: false,
  scoreBand: "all",
  sort: "scheduled_desc",
  groupBy: "none",
  viewMode: "table",
};

const VALID_STATUSES: AuditStatus[] = ["Scheduled", "In Progress", "Review", "Closed"];
const VALID_PERIODS: AuditsListPeriod[] = ["all", "upcoming", "past_due", "last_90d", "this_year"];
const VALID_SCORE_BANDS: AuditsListScoreBand[] = ["all", "lt70", "70_85", "gte85", "unscored"];
const VALID_SORTS: AuditsListSort[] = [
  "scheduled_desc",
  "scheduled_asc",
  "score_desc",
  "score_asc",
  "nc_desc",
  "title_asc",
];
const VALID_GROUPS: AuditsListGroupBy[] = ["none", "month", "client", "location", "status"];
const VALID_VIEWS: AuditsListViewMode[] = ["table", "cards"];

function getSingleValue(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isValidValue<T extends string>(value: string | undefined, validValues: readonly T[]): value is T {
  return Boolean(value) && validValues.includes(value as T);
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseAuditsListState(searchParams: SearchParamsLike): AuditsListState {
  const search = getSingleValue(searchParams.search)?.trim() ?? "";
  const status = getSingleValue(searchParams.status);
  const clientId = getSingleValue(searchParams.client) ?? "all";
  const locationId = getSingleValue(searchParams.location) ?? "all";
  const period = getSingleValue(searchParams.period);
  const hasOpenNc = getSingleValue(searchParams.hasOpenNc) === "true";
  const scoreBand = getSingleValue(searchParams.scoreBand);
  const sort = getSingleValue(searchParams.sort);
  const groupBy = getSingleValue(searchParams.groupBy);
  const viewMode = getSingleValue(searchParams.view);

  return {
    search,
    status: isValidValue(status, VALID_STATUSES) ? status : DEFAULT_AUDITS_LIST_STATE.status,
    clientId,
    locationId,
    period: isValidValue(period, VALID_PERIODS) ? period : DEFAULT_AUDITS_LIST_STATE.period,
    hasOpenNc,
    scoreBand: isValidValue(scoreBand, VALID_SCORE_BANDS)
      ? scoreBand
      : DEFAULT_AUDITS_LIST_STATE.scoreBand,
    sort: isValidValue(sort, VALID_SORTS) ? sort : DEFAULT_AUDITS_LIST_STATE.sort,
    groupBy: isValidValue(groupBy, VALID_GROUPS) ? groupBy : DEFAULT_AUDITS_LIST_STATE.groupBy,
    viewMode: isValidValue(viewMode, VALID_VIEWS) ? viewMode : DEFAULT_AUDITS_LIST_STATE.viewMode,
  };
}

export function getAuditsListOptions(audits: AuditWithNCCount[]): AuditsListOptions {
  const clients = Array.from(
    new Map(
      audits
        .filter((audit) => audit.client_id && audit.client_name)
        .map((audit) => [audit.client_id!, audit.client_name!])
    )
  )
    .map(([id, label]) => ({ id, label }))
    .sort((left, right) => left.label.localeCompare(right.label));

  const locations = Array.from(
    new Map(
      audits
        .filter((audit) => audit.location_id && audit.location_name)
        .map((audit) => [audit.location_id!, audit.location_name!])
    )
  )
    .map(([id, label]) => ({ id, label }))
    .sort((left, right) => left.label.localeCompare(right.label));

  return { clients, locations };
}

export function filterAndSortAudits(
  audits: AuditWithNCCount[],
  state: AuditsListState
): AuditWithNCCount[] {
  const normalizedSearch = state.search.toLowerCase();
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const last90Days = new Date(todayStart);
  last90Days.setDate(todayStart.getDate() - 90);

  const filtered = audits.filter((audit) => {
    const auditDate = parseDate(audit.scheduled_date);
    const matchesSearch =
      normalizedSearch.length === 0 ||
      [audit.title, audit.client_name, audit.location_name]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch));

    const matchesStatus = state.status === "all" || audit.status === state.status;
    const matchesClient = state.clientId === "all" || audit.client_id === state.clientId;
    const matchesLocation =
      state.locationId === "all" || audit.location_id === state.locationId;
    const matchesOpenNc = !state.hasOpenNc || audit.nc_count > 0;

    const matchesPeriod =
      state.period === "all" ||
      (state.period === "upcoming" && auditDate !== null && auditDate >= todayStart) ||
      (state.period === "past_due" &&
        auditDate !== null &&
        auditDate < todayStart &&
        audit.status !== "Closed") ||
      (state.period === "last_90d" &&
        auditDate !== null &&
        auditDate >= last90Days &&
        auditDate <= todayStart) ||
      (state.period === "this_year" &&
        auditDate !== null &&
        auditDate.getFullYear() === todayStart.getFullYear());

    const matchesScore =
      state.scoreBand === "all" ||
      (state.scoreBand === "unscored" && audit.score === null) ||
      (state.scoreBand === "lt70" && audit.score !== null && audit.score < 70) ||
      (state.scoreBand === "70_85" &&
        audit.score !== null &&
        audit.score >= 70 &&
        audit.score < 85) ||
      (state.scoreBand === "gte85" && audit.score !== null && audit.score >= 85);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesClient &&
      matchesLocation &&
      matchesOpenNc &&
      matchesPeriod &&
      matchesScore
    );
  });

  return filtered.sort((left, right) => {
    const leftDate = parseDate(left.scheduled_date)?.getTime() ?? 0;
    const rightDate = parseDate(right.scheduled_date)?.getTime() ?? 0;
    const leftScore = left.score ?? -1;
    const rightScore = right.score ?? -1;
    const leftTitle = left.title ?? "";
    const rightTitle = right.title ?? "";

    switch (state.sort) {
      case "scheduled_asc":
        return leftDate - rightDate;
      case "score_desc":
        return rightScore - leftScore;
      case "score_asc":
        return leftScore - rightScore;
      case "nc_desc":
        return right.nc_count - left.nc_count;
      case "title_asc":
        return leftTitle.localeCompare(rightTitle);
      case "scheduled_desc":
      default:
        return rightDate - leftDate;
    }
  });
}

export function buildAuditsSections(
  audits: AuditWithNCCount[],
  groupBy: AuditsListGroupBy
): AuditsListSection[] {
  if (groupBy === "none") {
    return [{ id: "all", label: "All Audits", audits }];
  }

  const grouped = new Map<string, AuditsListSection>();

  for (const audit of audits) {
    const group = getAuditGroup(groupBy, audit);
    const existing = grouped.get(group.id);

    if (existing) {
      existing.audits.push(audit);
      continue;
    }

    grouped.set(group.id, {
      id: group.id,
      label: group.label,
      audits: [audit],
    });
  }

  return Array.from(grouped.values());
}

function getAuditGroup(
  groupBy: AuditsListGroupBy,
  audit: AuditWithNCCount
): { id: string; label: string } {
  if (groupBy === "month") {
    const date = parseDate(audit.scheduled_date);
    if (!date) {
      return { id: "no-date", label: "No Scheduled Date" };
    }

    return {
      id: `${date.getFullYear()}-${date.getMonth() + 1}`,
      label: new Intl.DateTimeFormat("en-GB", {
        month: "long",
        year: "numeric",
      }).format(date),
    };
  }

  if (groupBy === "client") {
    return {
      id: audit.client_id ?? "no-client",
      label: audit.client_name ?? "No Client",
    };
  }

  if (groupBy === "location") {
    return {
      id: audit.location_id ?? "no-location",
      label: audit.location_name ?? "No Location",
    };
  }

  return {
    id: audit.status,
    label: audit.status,
  };
}

export function getAuditsListKpis(audits: AuditWithNCCount[]): AuditsListKpis {
  const scoredAudits = audits.filter((audit) => audit.score !== null);

  return {
    total: audits.length,
    scheduled: audits.filter((audit) => audit.status === "Scheduled").length,
    inProgress: audits.filter((audit) => audit.status === "In Progress").length,
    closed: audits.filter((audit) => audit.status === "Closed").length,
    openNc: audits.reduce((total, audit) => total + audit.nc_count, 0),
    averageScore:
      scoredAudits.length > 0
        ? Math.round(
            scoredAudits.reduce((total, audit) => total + (audit.score ?? 0), 0) /
              scoredAudits.length
          )
        : null,
  };
}

export function getActiveFilterLabels(
  state: AuditsListState,
  options: AuditsListOptions
): Array<{ key: string; label: string }> {
  const activeFilters: Array<{ key: string; label: string }> = [];

  if (state.search) activeFilters.push({ key: "search", label: `Search: ${state.search}` });
  if (state.status !== "all") activeFilters.push({ key: "status", label: state.status });
  if (state.clientId !== "all") {
    const client = options.clients.find((item) => item.id === state.clientId);
    activeFilters.push({ key: "client", label: `Client: ${client?.label ?? state.clientId}` });
  }
  if (state.locationId !== "all") {
    const location = options.locations.find((item) => item.id === state.locationId);
    activeFilters.push({
      key: "location",
      label: `Location: ${location?.label ?? state.locationId}`,
    });
  }
  if (state.period !== "all") activeFilters.push({ key: "period", label: getPeriodLabel(state.period) });
  if (state.hasOpenNc) activeFilters.push({ key: "hasOpenNc", label: "With open NC" });
  if (state.scoreBand !== "all") {
    activeFilters.push({ key: "scoreBand", label: getScoreBandLabel(state.scoreBand) });
  }

  return activeFilters;
}

export function getPeriodLabel(period: AuditsListPeriod): string {
  switch (period) {
    case "upcoming":
      return "Upcoming";
    case "past_due":
      return "Past due";
    case "last_90d":
      return "Last 90 days";
    case "this_year":
      return "This year";
    case "all":
    default:
      return "All periods";
  }
}

export function getScoreBandLabel(scoreBand: AuditsListScoreBand): string {
  switch (scoreBand) {
    case "lt70":
      return "Score < 70%";
    case "70_85":
      return "Score 70-84%";
    case "gte85":
      return "Score >= 85%";
    case "unscored":
      return "Unscored";
    case "all":
    default:
      return "All scores";
  }
}

export function getDefaultAuditsListState(): AuditsListState {
  return DEFAULT_AUDITS_LIST_STATE;
}
