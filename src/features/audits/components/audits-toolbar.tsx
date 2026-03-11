"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuditsExportButton } from "@/features/audits/components/audits-export-button";
import type { AuditWithNCCount } from "@/features/audits/queries/get-audits";
import type {
  AuditsListOptions,
  AuditsListState,
  AuditsListViewMode,
  AuditsListGroupBy,
  AuditsListSort,
  AuditsListPeriod,
  AuditsListScoreBand,
} from "@/features/audits/lib/audits-list";
import { getActiveFilterLabels, getDefaultAuditsListState } from "@/features/audits/lib/audits-list";
import type { AuditStatus } from "@/features/audits/queries/get-audits";
import { cn } from "@/lib/utils";

type AuditsToolbarProps = {
  state: AuditsListState;
  options: AuditsListOptions;
  totalCount: number;
  filteredCount: number;
  audits: AuditWithNCCount[];
};

const STATUS_OPTIONS: Array<{ value: "all" | AuditStatus; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "Scheduled", label: "Scheduled" },
  { value: "In Progress", label: "In Progress" },
  { value: "Review", label: "Review" },
  { value: "Closed", label: "Closed" },
];

const PERIOD_OPTIONS: Array<{ value: AuditsListPeriod; label: string }> = [
  { value: "all", label: "All periods" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past_due", label: "Past due" },
  { value: "last_90d", label: "Last 90 days" },
  { value: "this_year", label: "This year" },
];

const SCORE_OPTIONS: Array<{ value: AuditsListScoreBand; label: string }> = [
  { value: "all", label: "All scores" },
  { value: "lt70", label: "Score < 70%" },
  { value: "70_85", label: "Score 70-84%" },
  { value: "gte85", label: "Score >= 85%" },
  { value: "unscored", label: "Unscored" },
];

const SORT_OPTIONS: Array<{ value: AuditsListSort; label: string }> = [
  { value: "scheduled_desc", label: "Newest first" },
  { value: "scheduled_asc", label: "Oldest first" },
  { value: "score_desc", label: "Highest score" },
  { value: "score_asc", label: "Lowest score" },
  { value: "nc_desc", label: "Most NC" },
  { value: "title_asc", label: "Title A-Z" },
];

const GROUP_OPTIONS: Array<{ value: AuditsListGroupBy; label: string }> = [
  { value: "none", label: "No grouping" },
  { value: "month", label: "Month" },
  { value: "client", label: "Client" },
  { value: "location", label: "Location" },
  { value: "status", label: "Status" },
];

const VIEW_OPTIONS: Array<{ value: AuditsListViewMode; label: string }> = [
  { value: "table", label: "Table" },
  { value: "cards", label: "Cards" },
];

const SAVED_VIEWS = [
  {
    id: "all",
    label: "All",
    params: {},
  },
  {
    id: "open_nc",
    label: "Open NC",
    params: { hasOpenNc: "true", sort: "nc_desc" },
  },
  {
    id: "low_score",
    label: "Low score",
    params: { scoreBand: "lt70", sort: "score_asc" },
  },
  {
    id: "upcoming",
    label: "Upcoming",
    params: { period: "upcoming", sort: "scheduled_asc" },
  },
  {
    id: "by_client",
    label: "By client",
    params: { groupBy: "client", view: "cards" },
  },
] as const;

export function AuditsToolbar({
  state,
  options,
  totalCount,
  filteredCount,
  audits,
}: AuditsToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(state.search);
  const activeFilters = getActiveFilterLabels(state, options);

  useEffect(() => {
    setSearchValue(state.search);
  }, [state.search]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (searchValue === state.search) return;
      updateParams({ search: searchValue });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchValue, state.search]);

  function updateParams(
    updates: Partial<Record<"search" | "status" | "client" | "location" | "period" | "hasOpenNc" | "scoreBand" | "sort" | "groupBy" | "view", string>>
  ) {
    const nextParams = new URLSearchParams(currentSearchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === "all" || value === "false" || value === "none" || value === "table") {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    }

    const nextUrl = nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname;

    startTransition(() => {
      router.replace(nextUrl);
    });
  }

  function clearFilter(filterKey: string) {
    if (filterKey === "hasOpenNc") {
      updateParams({ hasOpenNc: "false" });
      return;
    }

    const defaults = getDefaultAuditsListState();
    const mapping: Record<string, string> = {
      search: defaults.search,
      status: defaults.status,
      client: defaults.clientId,
      location: defaults.locationId,
      period: defaults.period,
      scoreBand: defaults.scoreBand,
    };

    if (filterKey in mapping) {
      updateParams({ [filterKey]: mapping[filterKey] });
    }
  }

  function resetAllFilters() {
    startTransition(() => {
      router.replace(pathname);
    });
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 p-4 md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
              <SlidersHorizontal className="h-4 w-4 text-zinc-500" />
              Audit Explorer
            </div>
            <p className="text-sm text-zinc-500">
              Showing {filteredCount} of {totalCount} audits
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {SAVED_VIEWS.map((savedView) => {
                const isActive = Object.entries(savedView.params).every(([key, value]) => {
                  const paramValue = currentSearchParams.get(key);
                  return (paramValue ?? "") === value;
                });

                return (
                  <Button
                    key={savedView.id}
                    type="button"
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className="h-8 rounded-full px-3"
                    onClick={() => updateParams(savedView.params)}
                    disabled={isPending}
                  >
                    {savedView.label}
                  </Button>
                );
              })}
            </div>

            <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-1">
              {VIEW_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "h-8 rounded-md px-3 text-xs font-medium",
                    state.viewMode === option.value
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900"
                  )}
                  onClick={() => updateParams({ view: option.value })}
                  disabled={isPending}
                >
                  {option.label}
                </Button>
              ))}
            </div>

            <Button
              type="button"
              variant={state.hasOpenNc ? "default" : "outline"}
              size="sm"
              className="h-9"
              onClick={() =>
                updateParams({
                  hasOpenNc: state.hasOpenNc ? "false" : "true",
                })
              }
              disabled={isPending}
            >
              Open NC only
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 text-zinc-500"
              onClick={resetAllFilters}
              disabled={isPending}
            >
              Reset all
            </Button>

            <AuditsExportButton audits={audits} />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="xl:col-span-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search title, client or location..."
                className="pl-9"
              />
            </div>
          </div>

          <Select value={state.status} onValueChange={(value) => updateParams({ status: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={state.clientId} onValueChange={(value) => updateParams({ client: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clients</SelectItem>
              {options.clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={state.locationId}
            onValueChange={(value) => updateParams({ location: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {options.locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={state.period} onValueChange={(value) => updateParams({ period: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Select
            value={state.scoreBand}
            onValueChange={(value) => updateParams({ scoreBand: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Score band" />
            </SelectTrigger>
            <SelectContent>
              {SCORE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={state.sort} onValueChange={(value) => updateParams({ sort: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={state.groupBy} onValueChange={(value) => updateParams({ groupBy: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              {GROUP_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {activeFilters.map((filter) => (
              <Badge
                key={filter.key}
                variant="outline"
                className="gap-1 rounded-full border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700"
              >
                {filter.label}
                <button
                  type="button"
                  className="text-zinc-400 transition-colors hover:text-zinc-700"
                  onClick={() => clearFilter(filter.key)}
                  aria-label={`Clear ${filter.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
