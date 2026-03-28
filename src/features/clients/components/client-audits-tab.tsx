'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreateAuditSheet } from '@/features/audits/components/create-audit-sheet';
import type { AuditTimelineEvent } from '@/features/audits/queries/get-audit-timeline';
import { ClientAuditInsights } from '@/features/clients/components/client-audit-insights';
import {
  summarizeClientAudits,
  toDateLabel,
  type ClientWorkspaceAuditItem,
} from '@/features/clients/lib/client-workspace-view';

interface ClientAuditsTabProps {
  audits: ClientWorkspaceAuditItem[];
  clientId: string;
  openNcCount: number;
  timelineEvents: AuditTimelineEvent[];
}

export function ClientAuditsTab({
  audits,
  clientId,
  openNcCount,
  timelineEvents,
}: ClientAuditsTabProps) {
  const { averageScore, closedAudits, scheduledAudits } = summarizeClientAudits(audits);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-zinc-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
              Audit chiusi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-emerald-700">{closedAudits}</div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
              Audit pianificati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-sky-700">{scheduledAudits}</div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
              Score medio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-amber-700">
              {Number.isFinite(averageScore) ? `${averageScore.toFixed(1)}%` : '-'}
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
              NC aperte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-rose-700">{openNcCount}</div>
          </CardContent>
        </Card>
      </div>

      <ClientAuditInsights audits={audits} timelineEvents={timelineEvents} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Audit ({audits.length})</CardTitle>
            <CardDescription>
              Storico audit collegati al cliente e punto di accesso per crearne di nuovi.
            </CardDescription>
          </div>
          <CreateAuditSheet defaultClientId={clientId} hideClientField triggerLabel="Nuovo Audit" />
        </CardHeader>
        <CardContent>
          {audits.length === 0 ? (
            <p className="text-sm text-zinc-500">Nessun audit collegato a questo cliente.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titolo</TableHead>
                  <TableHead>Sede</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>NC aperte</TableHead>
                  <TableHead>Apri</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audits.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell className="font-medium">{audit.title || 'Audit senza titolo'}</TableCell>
                    <TableCell>{audit.location_name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{audit.status}</Badge>
                    </TableCell>
                    <TableCell>{toDateLabel(audit.scheduled_date)}</TableCell>
                    <TableCell>
                      {typeof audit.score === 'number' ? `${audit.score.toFixed(1)}%` : '-'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          audit.nc_count > 0
                            ? 'inline-flex min-w-8 items-center justify-center rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700'
                            : 'inline-flex min-w-8 items-center justify-center rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500'
                        }
                      >
                        {audit.nc_count}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-blue-600">
                        <Link href={`/audits/${audit.id}`}>Apri audit</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
