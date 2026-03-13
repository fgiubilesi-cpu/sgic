import { AlertTriangle, CalendarClock, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getServiceCoverageStatusClassName,
  getServiceCoverageStatusLabel,
  type ClientServiceCoverageItem,
  type ClientServiceCoverageSnapshot,
} from '@/features/clients/lib/client-service-coverage';

interface ClientServiceCoverageCardProps {
  coverage: ClientServiceCoverageSnapshot;
  onOpenActivities?: () => void;
  onOpenDeadlines?: () => void;
}

function toDateLabel(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('it-IT');
}

function secondaryLine(item: ClientServiceCoverageItem) {
  if (item.nextPlannedAt) return `Prossimo presidio ${toDateLabel(item.nextPlannedAt)}`;
  if (item.lastEvidenceAt) return `Ultima evidenza ${toDateLabel(item.lastEvidenceAt)}`;
  return 'Nessun presidio rilevato';
}

export function ClientServiceCoverageCard({
  coverage,
  onOpenActivities,
  onOpenDeadlines,
}: ClientServiceCoverageCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Copertura servizi</CardTitle>
          <CardDescription>
            Quanto del perimetro concordato risulta già presidiato da attività, audit, documenti e
            scadenze.
          </CardDescription>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-right">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Copertura</p>
          <p className="text-2xl font-semibold text-zinc-900">{coverage.summary.coverageRate}%</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {coverage.summary.total === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-600">
            Nessuna linea servizio attiva da monitorare. Appena importi il perimetro contrattuale,
            qui vedrai copertura, buchi operativi e segnali di rischio.
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Presidiate</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-700">
                  {coverage.summary.guarded}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500">A rischio</p>
                <p className="mt-2 text-2xl font-semibold text-amber-700">
                  {coverage.summary.atRisk}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Scoperte / in ritardo</p>
                <p className="mt-2 text-2xl font-semibold text-rose-700">
                  {coverage.summary.missing + coverage.summary.overdue}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Ricorrenti</p>
                <p className="mt-2 text-2xl font-semibold text-sky-700">
                  {coverage.summary.recurring}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-800">
                <AlertTriangle className="h-4 w-4 text-zinc-400" />
                Linee da attenzionare
              </div>
              {coverage.attentionItems.length === 0 ? (
                <div className="rounded-lg border border-zinc-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Tutte le linee attive risultano presidiate o già pianificate.
                </div>
              ) : (
                coverage.attentionItems.slice(0, 5).map((item) => (
                  <div
                    key={item.lineId}
                    className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 lg:flex-row lg:items-start lg:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-zinc-900">{item.lineTitle}</p>
                        <Badge
                          variant="outline"
                          className={getServiceCoverageStatusClassName(item.status)}
                        >
                          {getServiceCoverageStatusLabel(item.status)}
                        </Badge>
                        {item.locationName ? (
                          <Badge variant="outline" className="border-zinc-200 bg-white text-zinc-600">
                            {item.locationName}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-zinc-600">{secondaryLine(item)}</p>
                      <p className="text-xs text-zinc-500">{item.reasons[0]}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                      <span className="inline-flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {item.matchingSignals.tasks} task
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {item.matchingSignals.deadlines + item.matchingSignals.audits} scadenze
                      </span>
                      <span>{item.matchingSignals.documents} documenti</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        <div className="flex flex-wrap gap-2">
          {onOpenActivities ? (
            <Button variant="outline" size="sm" onClick={onOpenActivities}>
              Apri attività
            </Button>
          ) : null}
          {onOpenDeadlines ? (
            <Button variant="outline" size="sm" onClick={onOpenDeadlines}>
              Apri scadenze
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
