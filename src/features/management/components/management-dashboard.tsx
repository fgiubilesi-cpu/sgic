import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarClock,
  DatabaseZap,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  ManagementCoverageRow,
  ManagementDashboardData,
  ManagementDueItem,
  ManagementMetric,
  ManagementPortfolioRow,
} from "@/features/management/queries/get-management-dashboard";

function formatDate(dateString: string | null) {
  if (!dateString) return "Nessuna data";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

function formatDateTime(dateString: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function formatMoney(value: number) {
  if (!Number.isFinite(value) || value === 0) return "n/d";
  return new Intl.NumberFormat("it-IT", {
    currency: "EUR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatHours(value: number) {
  if (!Number.isFinite(value) || value === 0) return "0h";
  return `${new Intl.NumberFormat("it-IT", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value)}h`;
}

function metricToneClass(tone: ManagementMetric["tone"]) {
  if (tone === "danger") return "border-rose-200 bg-rose-50/70";
  if (tone === "warning") return "border-amber-200 bg-amber-50/80";
  return "border-zinc-200 bg-white";
}

function coverageBadge(row: ManagementPortfolioRow) {
  if (row.coverageStatus === "covered") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (row.coverageStatus === "partial") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-rose-200 bg-rose-50 text-rose-700";
}

function dueStatusBadge(item: ManagementDueItem) {
  if (item.status === "overdue") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (item.status === "due_soon") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

function dueTypeLabel(item: ManagementDueItem) {
  if (item.type === "deadline") return "Scadenza";
  if (item.type === "task") return "Task";
  if (item.type === "contract") return "Contratto";
  if (item.type === "document") return "Documento";
  return "Audit";
}

function portfolioSourceBadge(source: ManagementPortfolioRow["source"]) {
  if (source === "staging") {
    return {
      className: "border-sky-200 bg-sky-50 text-sky-700",
      label: "FileMaker",
    };
  }

  if (source === "merged") {
    return {
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      label: "SGIC + FileMaker",
    };
  }

  return {
    className: "border-zinc-200 bg-zinc-50 text-zinc-700",
    label: "SGIC",
  };
}

function coverageSourceBadge(source: ManagementCoverageRow["source"]) {
  if (source === "staging") {
    return {
      className: "border-sky-200 bg-sky-50 text-sky-700",
      label: "staging",
    };
  }

  if (source === "blended") {
    return {
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      label: "mista",
    };
  }

  return null;
}

function MetricCard({ metric }: { metric: ManagementMetric }) {
  return (
    <Link
      href={metric.href}
      className={`rounded-2xl border p-4 shadow-sm transition-colors hover:border-zinc-300 ${metricToneClass(metric.tone)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
            {metric.label}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
            {metric.value}
          </p>
          <p className="mt-2 text-sm text-zinc-600">{metric.hint}</p>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 text-zinc-400" />
      </div>
    </Link>
  );
}

function PortfolioRowCard({ row }: { row: ManagementPortfolioRow }) {
  const sourceBadge = portfolioSourceBadge(row.source);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={row.clientHref}
              className="truncate text-sm font-semibold text-zinc-900 hover:text-zinc-700"
            >
              {row.clientName}
            </Link>
            <Badge variant="outline" className={sourceBadge.className}>
              {sourceBadge.label}
            </Badge>
            <Badge variant="outline" className={coverageBadge(row)}>
              {row.coverageStatus === "covered"
                ? "coperto"
                : row.coverageStatus === "partial"
                  ? "parziale"
                  : "scoperto"}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-zinc-600">
            {row.serviceLines} servizi attivi · {row.serviceAreas} aree · {row.activePersonnel} presidio
            interno · {row.activeLocations} sedi
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {row.attentionReasons.slice(0, 3).map((reason) => (
              <Badge key={reason} variant="secondary" className="bg-zinc-100 text-zinc-700">
                {reason}
              </Badge>
            ))}
          </div>
        </div>

        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Risk score
          </p>
          <p
            className={`mt-1 text-2xl font-semibold ${
              row.riskScore >= 10
                ? "text-rose-700"
                : row.riskScore >= 6
                  ? "text-amber-700"
                  : "text-zinc-900"
            }`}
          >
            {row.riskScore}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            NC {row.openNCs} · AC {row.overdueActions} · scadenze {row.overdueItems}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            ultimo audit {formatDate(row.lastAuditDate)}
          </p>
        </div>
      </div>
    </div>
  );
}

function CoverageRowCard({ row }: { row: ManagementCoverageRow }) {
  const sourceBadge = coverageSourceBadge(row.source);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-zinc-900">{row.label}</p>
            {sourceBadge ? (
              <Badge variant="outline" className={sourceBadge.className}>
                {sourceBadge.label}
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {row.serviceLineCount} linee attive · {row.clientCount} clienti serviti · {row.recurringCount} ricorrenti
          </p>
          {row.source !== "native" ? (
            <p className="mt-2 text-xs text-zinc-400">
              {row.source === "staging"
                ? `${row.stagingClientCount} clienti importati da FileMaker`
                : `${row.nativeClientCount} clienti SGIC + ${row.stagingClientCount} staging`}
            </p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-zinc-500">Valore indicativo</p>
          <p className="text-sm font-semibold text-zinc-900">{formatMoney(row.annualValue)}</p>
        </div>
      </div>
    </div>
  );
}

function DueItemRow({ item }: { item: ManagementDueItem }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-100 py-3 last:border-0">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={dueStatusBadge(item)}>
            {dueTypeLabel(item)}
          </Badge>
          {item.source === "staging" ? (
            <Badge variant="secondary" className="bg-sky-50 text-sky-700">
              FileMaker
            </Badge>
          ) : null}
          <Link href={item.href} className="text-sm font-semibold text-zinc-900 hover:text-zinc-700">
            {item.label}
          </Link>
        </div>
        <p className="mt-1 text-sm text-zinc-600">{item.clientName}</p>
        <p className="mt-1 text-xs text-zinc-400">
          {item.priority ? `priorita ${item.priority} · ` : ""}
          {item.status === "overdue"
            ? "oltre termine"
            : item.status === "due_soon"
              ? "entro 30 giorni"
              : "programmata"}
        </p>
      </div>
      <div className="text-right text-xs font-medium text-zinc-500">
        {formatDate(item.dueDate)}
      </div>
    </div>
  );
}

export function ManagementDashboard({
  data,
}: {
  data: ManagementDashboardData;
}) {
  const latestSyncLabel = data.sourceStatus.lastSync
    ? `Ultimo sync ${formatDateTime(
        data.sourceStatus.lastSync.finished_at ?? data.sourceStatus.lastSync.started_at
      )}`
    : data.sourceStatus.mode === "sgic-plus-staging"
      ? "Staging pronta, sync non ancora eseguito"
      : "Vista alimentata solo da SGIC";

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-zinc-200 bg-[linear-gradient(135deg,#ffffff_0%,#f5f5f4_55%,#efe7d8_100%)] p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-zinc-300 bg-white/80 text-zinc-700">
                {data.organizationName ?? "SGIC"}
              </Badge>
              <Badge
                variant="outline"
                className={
                  data.sourceStatus.mode === "sgic-plus-staging"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }
              >
                {data.sourceStatus.mode === "sgic-plus-staging"
                  ? "SGIC + staging FileMaker"
                  : "SGIC native only"}
              </Badge>
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
                Management
              </h1>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Control room per direzione e proprieta: portafoglio clienti, copertura servizi,
                rischio operativo, scadenze e capacita interna in una vista unica, con drill-down
                verso i moduli operativi SGIC.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Stato dati
            </p>
            <p className="mt-2 text-sm font-medium text-zinc-900">{latestSyncLabel}</p>
            <p className="mt-1 text-xs text-zinc-500">
              Snapshot generato {formatDateTime(data.generatedAt)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        {data.metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-zinc-500" />
              Portafoglio sotto presidio
            </CardTitle>
            <CardDescription>
              Clienti ordinati per attenzione direzionale, combinando rischio operativo,
              scadenze e copertura.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.portfolioRows.length === 0 ? (
              <p className="text-sm text-zinc-500">Nessun cliente attivo disponibile.</p>
            ) : (
              data.portfolioRows.map((row) => <PortfolioRowCard key={row.clientKey} row={row} />)
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-zinc-500" />
              Copertura servizi
            </CardTitle>
            <CardDescription>
              Lettura per area di servizio, utile a capire dove il portafoglio e realmente
              strutturato.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.coverageRows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-5 text-sm text-zinc-500">
                Nessuna service line disponibile. Questa vista si popola quando il workspace cliente
                o il sync FileMaker iniziano a scrivere `client_service_lines` o
                `management_service_lines_staging`.
              </div>
            ) : (
              data.coverageRows.slice(0, 8).map((row) => (
                <CoverageRowCard key={row.label} row={row} />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4 text-zinc-500" />
              Scadenze e rinnovi
            </CardTitle>
            <CardDescription>
              Agenda unificata tra audit, task, deadlines, documenti e contratti.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.dueItems.length === 0 ? (
              <p className="text-sm text-zinc-500">Nessuna scadenza rilevante nel perimetro attuale.</p>
            ) : (
              data.dueItems.map((item) => (
                <DueItemRow
                  key={`${item.type}-${item.clientId ?? item.clientName}-${item.label}-${item.dueDate}`}
                  item={item}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-zinc-500" />
              Capacita interna
            </CardTitle>
            <CardDescription>
              Presidio operativo minimo, pressione sul team e warning formazione.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Persone attive
                </p>
                <p className="mt-2 text-2xl font-semibold text-zinc-900">
                  {data.capacity.activePersonnel}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {data.capacity.linkedPersonnel} gia collegate a clienti
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Presidi staging
                </p>
                <p className="mt-2 text-2xl font-semibold text-zinc-900">
                  {data.capacity.stagedAssignments}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {formatHours(data.capacity.plannedHours)} pianificate su {data.capacity.stagedClientsCovered} clienti
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Clienti senza presidio
                </p>
                <p className="mt-2 text-2xl font-semibold text-zinc-900">
                  {data.capacity.clientsWithoutPersonnel}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {data.capacity.stagedUnmappedClients > 0
                    ? `${data.capacity.stagedUnmappedClients} anche solo staging`
                    : "portafoglio senza presidio operativo letto"}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Training in warning
                </p>
                <p className="mt-2 text-2xl font-semibold text-zinc-900">
                  {data.capacity.expiringTrainingCount}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {data.capacity.expiredTrainingCount} persone con training gia scaduto
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Rapporto clienti / presidio</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Lettura veloce della pressione minima sul presidio interno letto tra SGIC e staging.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-semibold text-zinc-900">
                    {data.capacity.ratioClientsPerPerson ?? "N/D"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {data.capacity.effectiveCoverageUnits} presidi nel perimetro letto
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {data.sourceStatus.mode === "sgic-plus-staging" ? (
              <ShieldCheck className="h-4 w-4 text-zinc-500" />
            ) : (
              <DatabaseZap className="h-4 w-4 text-zinc-500" />
            )}
            Stato dati e integrazione
          </CardTitle>
          <CardDescription>
            Base tecnica per far convivere SGIC e FileMaker senza dipendenze live lato UI.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-zinc-900">Modalita attuale</p>
            <p className="text-sm text-zinc-600">
              {data.sourceStatus.mode === "sgic-plus-staging"
                ? "La dashboard legge SGIC nativo e snapshot FileMaker, usando lo staging come layer di integrazione senza dipendenze live lato UI."
                : "La dashboard usa solo il dato SGIC gia presente. Il layer staging FileMaker va applicato o inizializzato per completare la lettura gestionale."}
            </p>
            {data.sourceStatus.lastSync ? (
              <p className="text-xs text-zinc-500">
                Ultimo run `{data.sourceStatus.lastSync.sync_scope}` con stato `{data.sourceStatus.lastSync.status}`
                , {data.sourceStatus.lastSync.records_written ?? 0} record scritti.
              </p>
            ) : null}
            {data.sourceStatus.stagingSnapshot.clientCount > 0 ? (
              <p className="text-xs text-zinc-500">
                Snapshot staging: {data.sourceStatus.stagingSnapshot.clientCount} clienti,{" "}
                {data.sourceStatus.stagingSnapshot.serviceLineCount} service line,{" "}
                {formatHours(data.sourceStatus.stagingSnapshot.plannedHours)} pianificate.
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-zinc-900">Tabelle opzionali mancanti</p>
            <div className="flex flex-wrap gap-2">
              {data.sourceStatus.missingOperationalTables.length === 0 &&
              data.sourceStatus.missingIntegrationTables.length === 0 ? (
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                  Nessuna mancante
                </Badge>
              ) : (
                <>
                  {data.sourceStatus.missingOperationalTables.map((tableName) => (
                    <Badge key={tableName} variant="secondary" className="bg-zinc-100 text-zinc-700">
                      {tableName}
                    </Badge>
                  ))}
                  {data.sourceStatus.missingIntegrationTables.map((tableName) => (
                    <Badge key={tableName} variant="secondary" className="bg-amber-50 text-amber-700">
                      {tableName}
                    </Badge>
                  ))}
                </>
              )}
            </div>
            {data.sourceStatus.stagingSnapshot.unmappedClientCount > 0 ? (
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-sky-50 text-sky-700">
                  {data.sourceStatus.stagingSnapshot.unmappedClientCount} clienti staging non riconciliati
                </Badge>
                <Badge variant="secondary" className="bg-zinc-100 text-zinc-700">
                  {data.sourceStatus.stagingSnapshot.mappedClientCount} gia agganciati a SGIC
                </Badge>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild variant="outline">
              <Link href="/clients">Apri clienti</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/audits">Apri audit</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/personnel">Apri personale</Link>
            </Button>
            <Button asChild>
              <Link href="/organization">Vai in organization</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
