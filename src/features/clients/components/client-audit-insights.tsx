'use client';

import { AuditTimeline } from '@/features/audits/components/audit-timeline';
import type { AuditTimelineEvent } from '@/features/audits/queries/get-audit-timeline';
import {
  buildClientAuditInsights,
  type ClientAuditItem,
} from '@/features/clients/lib/client-audit-insights';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ClientAuditInsightsProps {
  audits: ClientAuditItem[];
  timelineEvents: AuditTimelineEvent[];
}

export function ClientAuditInsights({
  audits,
  timelineEvents,
}: ClientAuditInsightsProps) {
  const insights = buildClientAuditInsights(audits, timelineEvents);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Trend Score Cliente</CardTitle>
            <CardDescription>
              Confronto degli ultimi audit con score disponibile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-zinc-200 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Ultimo score</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-900">
                  {insights.latestScore !== null ? `${insights.latestScore.toFixed(1)}%` : '-'}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Score medio</p>
                <p className="mt-2 text-2xl font-semibold text-amber-700">
                  {insights.averageScore !== null ? `${insights.averageScore.toFixed(1)}%` : '-'}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Delta ultimo audit</p>
                <p
                  className={
                    insights.scoreDelta === null
                      ? 'mt-2 text-2xl font-semibold text-zinc-500'
                      : insights.scoreDelta >= 0
                      ? 'mt-2 text-2xl font-semibold text-emerald-700'
                      : 'mt-2 text-2xl font-semibold text-rose-700'
                  }
                >
                  {insights.scoreDelta === null ? '-' : `${insights.scoreDelta > 0 ? '+' : ''}${insights.scoreDelta.toFixed(1)}`}
                </p>
              </div>
            </div>

            {insights.recentTrend.length === 0 ? (
              <p className="text-sm text-zinc-500">Non ci sono ancora abbastanza audit con score per mostrare un trend.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {insights.recentTrend.map((audit) => (
                  <div key={audit.id} className="rounded-lg border border-zinc-200 p-3">
                    <p className="truncate text-sm font-medium text-zinc-900">
                      {audit.title || 'Audit senza titolo'}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {audit.date ? new Date(audit.date).toLocaleDateString('it-IT') : 'Data non definita'}
                    </p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className={
                          audit.score >= 85
                            ? 'h-full rounded-full bg-emerald-500'
                            : audit.score >= 70
                            ? 'h-full rounded-full bg-amber-500'
                            : 'h-full rounded-full bg-rose-500'
                        }
                        style={{ width: `${Math.max(Math.min(audit.score, 100), 0)}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-700">{audit.score.toFixed(1)}%</span>
                      <span className={audit.nc_count > 0 ? 'text-rose-700' : 'text-zinc-500'}>
                        {audit.nc_count} NC
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Confronto Sedi</CardTitle>
            <CardDescription>
              Lettura sintetica delle performance audit per sede del cliente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.strongestLocation || insights.weakestLocation ? (
              <>
                {insights.strongestLocation ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Sede piu solida</p>
                    <p className="mt-1 font-semibold text-emerald-900">{insights.strongestLocation.locationName}</p>
                    <p className="mt-1 text-sm text-emerald-800">
                      {insights.strongestLocation.averageScore !== null
                        ? `${insights.strongestLocation.averageScore.toFixed(1)}% medio su ${insights.strongestLocation.auditCount} audit`
                        : `${insights.strongestLocation.auditCount} audit senza score disponibile`}
                    </p>
                  </div>
                ) : null}

                {insights.weakestLocation ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-rose-700">Sede da presidiare</p>
                    <p className="mt-1 font-semibold text-rose-900">{insights.weakestLocation.locationName}</p>
                    <p className="mt-1 text-sm text-rose-800">
                      {insights.weakestLocation.averageScore !== null
                        ? `${insights.weakestLocation.averageScore.toFixed(1)}% medio · ${insights.weakestLocation.openNcCount} NC aperte`
                        : `${insights.weakestLocation.openNcCount} NC aperte senza storico score`}
                    </p>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-zinc-500">Servono audit distribuiti sulle sedi per costruire il confronto.</p>
            )}

            <div className="rounded-lg border border-zinc-200 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Azioni consigliate</p>
              <ul className="mt-2 space-y-2 text-sm text-zinc-600">
                {insights.recommendations.map((recommendation) => (
                  <li key={recommendation} className="rounded-md bg-zinc-50 px-3 py-2">
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Timeline Audit Cliente</CardTitle>
          <CardDescription>
            Cronologia audit del cliente per leggere continuita, chiusure e criticita nel tempo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditTimeline
            events={timelineEvents}
            emptyMessage="Nessuna timeline disponibile per questo cliente."
          />
        </CardContent>
      </Card>
    </div>
  );
}
