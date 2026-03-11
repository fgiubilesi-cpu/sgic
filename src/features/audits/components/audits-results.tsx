"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, MoreHorizontal, Table2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AuditsExportButton } from "@/features/audits/components/audits-export-button";
import { updateAuditStatus } from "@/features/audits/actions";
import type { AuditWithNCCount, AuditStatus } from "@/features/audits/queries/get-audits";
import type {
  AuditRiskSignal,
  AuditsListGroupBy,
  AuditsListSection,
  AuditsListViewMode,
} from "@/features/audits/lib/audits-list";
import { getAuditNextStep, getAuditRiskSignals } from "@/features/audits/lib/audits-list";
import { cn } from "@/lib/utils";

type AuditsResultsProps = {
  sections: AuditsListSection[];
  viewMode: AuditsListViewMode;
  groupBy: AuditsListGroupBy;
};

type VisibleColumns = {
  client: boolean;
  location: boolean;
  score: boolean;
  nc: boolean;
  scheduled: boolean;
};

const DEFAULT_VISIBLE_COLUMNS: VisibleColumns = {
  client: true,
  location: true,
  score: true,
  nc: true,
  scheduled: true,
};

function formatStatus(status: AuditStatus): { label: string; className: string } {
  switch (status) {
    case "Scheduled":
      return { label: "Scheduled", className: "border-slate-200 bg-slate-50 text-slate-700" };
    case "In Progress":
      return { label: "In Progress", className: "border-blue-200 bg-blue-50 text-blue-700" };
    case "Review":
      return { label: "Review", className: "border-amber-200 bg-amber-50 text-amber-700" };
    case "Closed":
      return { label: "Closed", className: "border-green-200 bg-green-50 text-green-700" };
    default:
      return { label: status, className: "border-zinc-200 bg-zinc-50 text-zinc-700" };
  }
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function AuditsResults({ sections, viewMode, groupBy }: AuditsResultsProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>(DEFAULT_VISIBLE_COLUMNS);
  const [collapsedSections, setCollapsedSections] = useState<string[]>([]);
  const [isBulkPending, startBulkTransition] = useTransition();
  const allAudits = sections.flatMap((section) => section.audits);
  const allAuditIds = allAudits.map((audit) => audit.id);
  const allSelected =
    allAuditIds.length > 0 && allAuditIds.every((id) => selectedIds.includes(id));

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => allAuditIds.includes(id)));
    setExpandedIds((current) => current.filter((id) => allAuditIds.includes(id)));
  }, [allAuditIds.join("|")]);

  if (sections.every((section) => section.audits.length === 0)) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-base font-medium text-zinc-900">No audits match the current filters.</p>
        <p className="mt-2 text-sm text-zinc-500">
          Try broadening the period, removing a filter, or switching to another saved view later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="text-sm font-medium text-zinc-900">Display controls</div>
          <p className="text-sm text-zinc-500">
            {groupBy === "none"
              ? "Single stream of audits"
              : `${sections.length} groups in the current view`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && (
            <>
              <Badge variant="outline" className="h-9 rounded-full px-3 text-sm">
                {selectedIds.length} selected
              </Badge>
              <AuditsExportButton
                audits={allAudits.filter((audit) => selectedIds.includes(audit.id))}
                label="Export selected"
              />
              {(["Scheduled", "In Progress", "Review", "Closed"] as AuditStatus[]).map(
                (status) => (
                  <Button
                    key={status}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9"
                    disabled={isBulkPending}
                    onClick={() => applyBulkStatus(selectedIds, status)}
                  >
                    Mark {status}
                  </Button>
                )
              )}
            </>
          )}

          {viewMode === "table" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="h-9">
                  <Table2 className="mr-2 h-4 w-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.client}
                  onCheckedChange={() =>
                    setVisibleColumns((current) => ({ ...current, client: !current.client }))
                  }
                >
                  Client
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.location}
                  onCheckedChange={() =>
                    setVisibleColumns((current) => ({
                      ...current,
                      location: !current.location,
                    }))
                  }
                >
                  Location
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.score}
                  onCheckedChange={() =>
                    setVisibleColumns((current) => ({ ...current, score: !current.score }))
                  }
                >
                  Score
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.nc}
                  onCheckedChange={() =>
                    setVisibleColumns((current) => ({ ...current, nc: !current.nc }))
                  }
                >
                  Open NC
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.scheduled}
                  onCheckedChange={() =>
                    setVisibleColumns((current) => ({
                      ...current,
                      scheduled: !current.scheduled,
                    }))
                  }
                >
                  Scheduled
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9"
            onClick={() => {
              if (allSelected) {
                setSelectedIds([]);
                return;
              }

              setSelectedIds(allAuditIds);
            }}
          >
            {allSelected ? "Clear selection" : "Select all"}
          </Button>
        </div>
      </div>

      {sections.map((section) => (
        <section key={section.id} className="space-y-3">
          {groupBy !== "none" && (
            <div className="flex items-center justify-between">
              <div>
                <button
                  type="button"
                  className="flex items-center gap-2 text-left text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500"
                  onClick={() =>
                    setCollapsedSections((current) =>
                      current.includes(section.id)
                        ? current.filter((id) => id !== section.id)
                        : [...current, section.id]
                    )
                  }
                >
                  {collapsedSections.includes(section.id) ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  {section.label}
                </button>
                <p className="mt-1 text-sm text-zinc-500">{section.audits.length} audits</p>
              </div>
            </div>
          )}

          {collapsedSections.includes(section.id) && groupBy !== "none" ? null : viewMode === "cards" ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {section.audits.map((audit) => (
                <AuditCard
                  key={audit.id}
                  audit={audit}
                  selected={selectedIds.includes(audit.id)}
                  expanded={expandedIds.includes(audit.id)}
                  onOpen={() => router.push(`/audits/${audit.id}`)}
                  onToggleSelected={() => toggleSelection(audit.id)}
                  onToggleExpanded={() => toggleExpanded(audit.id)}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50/80">
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={
                          section.audits.length > 0 &&
                          section.audits.every((audit) => selectedIds.includes(audit.id))
                        }
                        onChange={() =>
                          toggleSectionSelection(section.audits.map((audit) => audit.id))
                        }
                        aria-label={`Select ${section.label}`}
                      />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    {visibleColumns.client && <TableHead>Client</TableHead>}
                    {visibleColumns.location && <TableHead>Location</TableHead>}
                    <TableHead>Status</TableHead>
                    {visibleColumns.score && <TableHead>Score</TableHead>}
                    {visibleColumns.nc && <TableHead>Open NC</TableHead>}
                    {visibleColumns.scheduled && <TableHead>Scheduled</TableHead>}
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {section.audits.map((audit) => (
                    <AuditRow
                      key={audit.id}
                      audit={audit}
                      visibleColumns={visibleColumns}
                      selected={selectedIds.includes(audit.id)}
                      expanded={expandedIds.includes(audit.id)}
                      onOpen={() => router.push(`/audits/${audit.id}`)}
                      onToggleSelected={() => toggleSelection(audit.id)}
                      onToggleExpanded={() => toggleExpanded(audit.id)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      ))}
    </div>
  );

  function toggleSelection(auditId: string) {
    setSelectedIds((current) =>
      current.includes(auditId) ? current.filter((id) => id !== auditId) : [...current, auditId]
    );
  }

  function toggleExpanded(auditId: string) {
    setExpandedIds((current) =>
      current.includes(auditId) ? current.filter((id) => id !== auditId) : [...current, auditId]
    );
  }

  function toggleSectionSelection(sectionIds: string[]) {
    const allSectionSelected = sectionIds.every((id) => selectedIds.includes(id));
    setSelectedIds((current) => {
      if (allSectionSelected) {
        return current.filter((id) => !sectionIds.includes(id));
      }

      return Array.from(new Set([...current, ...sectionIds]));
    });
  }

  function applyBulkStatus(auditIds: string[], status: AuditStatus) {
    startBulkTransition(async () => {
      const results = await Promise.all(
        auditIds.map((auditId) => updateAuditStatus(auditId, status))
      );
      const failures = results.filter((result) => "error" in result);

      if (failures.length > 0) {
        toast.error(`Bulk update partially failed (${failures.length}/${auditIds.length}).`);
      } else {
        toast.success(`Updated ${auditIds.length} audits to ${status}.`);
      }

      setSelectedIds([]);
      router.refresh();
    });
  }
}

function AuditRow({
  audit,
  visibleColumns,
  selected,
  expanded,
  onOpen,
  onToggleSelected,
  onToggleExpanded,
}: {
  audit: AuditWithNCCount;
  visibleColumns: VisibleColumns;
  selected: boolean;
  expanded: boolean;
  onOpen: () => void;
  onToggleSelected: () => void;
  onToggleExpanded: () => void;
}) {
  const statusInfo = formatStatus(audit.status);
  const signals = getAuditRiskSignals(audit);
  const previewColspan =
    3 +
    (visibleColumns.client ? 1 : 0) +
    (visibleColumns.location ? 1 : 0) +
    (visibleColumns.score ? 1 : 0) +
    (visibleColumns.nc ? 1 : 0) +
    (visibleColumns.scheduled ? 1 : 0);

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-zinc-50/80" onClick={onOpen}>
        <TableCell onClick={(event) => event.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelected}
            aria-label={`Select ${audit.title ?? "audit"}`}
          />
        </TableCell>
        <TableCell>
          <div className="space-y-1">
            <div className="font-medium text-zinc-900">{audit.title ?? "Untitled Audit"}</div>
            <div className="flex flex-wrap gap-1">
              {signals.map((signal) => (
                <RiskBadge key={signal.key} signal={signal} />
              ))}
            </div>
          </div>
        </TableCell>
        {visibleColumns.client && (
          <TableCell className="text-sm text-zinc-600">{audit.client_name ?? "—"}</TableCell>
        )}
        {visibleColumns.location && (
          <TableCell className="text-sm text-zinc-600">{audit.location_name ?? "—"}</TableCell>
        )}
        <TableCell>
          <Badge variant="outline" className={statusInfo.className}>
            {statusInfo.label}
          </Badge>
        </TableCell>
        {visibleColumns.score && (
          <TableCell className="text-sm text-zinc-600">
            {audit.score !== null ? `${audit.score.toFixed(1)}%` : "—"}
          </TableCell>
        )}
        {visibleColumns.nc && (
          <TableCell className="text-sm text-zinc-600">
            {audit.nc_count > 0 ? (
              <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">
                {audit.nc_count}
              </span>
            ) : (
              <span className="text-zinc-400">—</span>
            )}
          </TableCell>
        )}
        {visibleColumns.scheduled && (
          <TableCell className="text-sm text-zinc-600">{formatDate(audit.scheduled_date)}</TableCell>
        )}
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={(event) => {
                event.stopPropagation();
                onToggleExpanded();
              }}
            >
              {expanded ? "Hide" : "Preview"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                  onClick={(event) => event.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    onOpen();
                  }}
                >
                  View details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="bg-zinc-50/60">
          <TableCell colSpan={previewColspan}>
            <InlinePreview audit={audit} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function AuditCard({
  audit,
  selected,
  expanded,
  onOpen,
  onToggleSelected,
  onToggleExpanded,
}: {
  audit: AuditWithNCCount;
  selected: boolean;
  expanded: boolean;
  onOpen: () => void;
  onToggleSelected: () => void;
  onToggleExpanded: () => void;
}) {
  const statusInfo = formatStatus(audit.status);
  const signals = getAuditRiskSignals(audit);

  return (
    <Card
      className={cn(
        "gap-4 rounded-2xl border-zinc-200 py-4 shadow-sm transition-shadow hover:shadow-md",
        selected && "ring-2 ring-zinc-900 ring-offset-2"
      )}
      onClick={onOpen}
    >
      <CardContent className="space-y-4 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Badge variant="outline" className={statusInfo.className}>
              {statusInfo.label}
            </Badge>
            <div className="text-lg font-semibold tracking-tight text-zinc-900">
              {audit.title ?? "Untitled Audit"}
            </div>
            <div className="flex flex-wrap gap-1">
              {signals.map((signal) => (
                <RiskBadge key={signal.key} signal={signal} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant={selected ? "default" : "outline"}
              size="sm"
              className="h-8 rounded-full px-3"
              onClick={(event) => {
                event.stopPropagation();
                onToggleSelected();
              }}
            >
              {selected ? "Selected" : "Select"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={(event) => {
                event.stopPropagation();
                onToggleExpanded();
              }}
            >
              {expanded ? "Hide" : "Preview"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"
              onClick={(event) => {
                event.stopPropagation();
                onOpen();
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-3 text-sm text-zinc-600 sm:grid-cols-2">
          <AuditCardMetric label="Client" value={audit.client_name ?? "—"} />
          <AuditCardMetric label="Location" value={audit.location_name ?? "—"} />
          <AuditCardMetric label="Scheduled" value={formatDate(audit.scheduled_date)} />
          <AuditCardMetric
            label="Score"
            value={audit.score !== null ? `${audit.score.toFixed(1)}%` : "—"}
          />
        </div>

        <div className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2">
          <span className="text-sm text-zinc-500">Open NC</span>
          <span
            className={cn(
              "inline-flex min-w-8 items-center justify-center rounded-full px-2 py-1 text-xs font-semibold",
              audit.nc_count > 0 ? "bg-rose-100 text-rose-700" : "bg-zinc-200 text-zinc-500"
            )}
          >
            {audit.nc_count}
          </span>
        </div>

        {expanded && <InlinePreview audit={audit} compact />}
      </CardContent>
    </Card>
  );
}

function AuditCardMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">{label}</div>
      <div className="font-medium text-zinc-800">{value}</div>
    </div>
  );
}

function RiskBadge({ signal }: { signal: AuditRiskSignal }) {
  return (
    <Badge variant="outline" className={`rounded-full ${signal.tone}`}>
      {signal.label}
    </Badge>
  );
}

function InlinePreview({
  audit,
  compact = false,
}: {
  audit: AuditWithNCCount;
  compact?: boolean;
}) {
  const nextStep = getAuditNextStep(audit);

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white p-4",
        compact && "border-none bg-zinc-50 px-0 py-0"
      )}
    >
      <div className={cn("grid gap-4", compact ? "md:grid-cols-1" : "md:grid-cols-[1fr_0.7fr]")}>
        <div className="space-y-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
              Quick preview
            </div>
            <div className="mt-1 text-sm text-zinc-600">
              {audit.client_name ?? "No client"} · {audit.location_name ?? "No location"}
            </div>
          </div>
          <div className="grid gap-2 text-sm text-zinc-600 md:grid-cols-3">
            <div className="rounded-lg bg-zinc-50 px-3 py-2">
              <div className="text-xs uppercase tracking-[0.14em] text-zinc-400">Status</div>
              <div className="mt-1 font-medium text-zinc-900">{audit.status}</div>
            </div>
            <div className="rounded-lg bg-zinc-50 px-3 py-2">
              <div className="text-xs uppercase tracking-[0.14em] text-zinc-400">Score</div>
              <div className="mt-1 font-medium text-zinc-900">
                {audit.score !== null ? `${audit.score.toFixed(1)}%` : "Not available"}
              </div>
            </div>
            <div className="rounded-lg bg-zinc-50 px-3 py-2">
              <div className="text-xs uppercase tracking-[0.14em] text-zinc-400">Scheduled</div>
              <div className="mt-1 font-medium text-zinc-900">{formatDate(audit.scheduled_date)}</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-zinc-900 px-4 py-4 text-white">
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
            Suggested next step
          </div>
          <div className="mt-2 text-sm font-medium leading-6">{nextStep}</div>
        </div>
      </div>
    </div>
  );
}
