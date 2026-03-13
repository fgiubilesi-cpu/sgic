import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ManageLocationSheet } from './manage-location-sheet';
import { ManagePersonnelSheet } from '@/features/personnel/components/manage-personnel-sheet';
import type { ClientOption } from '@/features/clients/queries/get-client-options';
import { ClientStateToggleButton } from './client-state-toggle-button';
import type { ClientWithStats } from '@/features/clients/queries/get-clients';

interface ClientTableProps {
  clientOptions: ClientOption[];
  clients: ClientWithStats[];
}

function serviceOverviewLabel(client: ClientWithStats) {
  if (client.service_overview_status === 'critical') return 'Scoperta';
  if (client.service_overview_status === 'warning') return 'Da presidiare';
  if (client.service_overview_status === 'covered') return 'Presidiata';
  return 'Non tracciata';
}

function serviceOverviewClassName(client: ClientWithStats) {
  if (client.service_overview_status === 'critical') {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }
  if (client.service_overview_status === 'warning') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }
  if (client.service_overview_status === 'covered') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  return 'border-zinc-200 bg-zinc-50 text-zinc-600';
}

export function ClientTable({ clientOptions, clients }: ClientTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-center">Sedi</TableHead>
            <TableHead className="text-center">Collaboratori</TableHead>
            <TableHead className="text-center">NC Aperte</TableHead>
            <TableHead>Copertura servizi</TableHead>
            <TableHead>Ultimo Audit</TableHead>
            <TableHead>Stato</TableHead>
            <TableHead className="w-[320px]">Gestione</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => {
            const clientOption = clientOptions.find((option) => option.id === client.id);
            const singleClientOptions = clientOption ? [clientOption] : [];
            const isClientActive = client.is_active ?? true;

            return (
              <TableRow key={client.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-zinc-900">{client.name}</span>
                    <span className="text-xs text-zinc-500">
                      {client.vat_number || 'Partita IVA non inserita'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{client.email || '-'}</TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                    {client.location_count}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                    {client.personnel_count}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={
                      client.open_nc_count > 0
                        ? 'inline-flex min-w-8 items-center justify-center rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700'
                        : 'inline-flex min-w-8 items-center justify-center rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500'
                    }
                  >
                    {client.open_nc_count}
                  </span>
                </TableCell>
                <TableCell>
                  {client.service_line_count === 0 ? (
                    <span className="text-sm text-zinc-500">Nessuna linea</span>
                  ) : (
                    <div className="space-y-1">
                      <Badge variant="outline" className={serviceOverviewClassName(client)}>
                        {serviceOverviewLabel(client)}
                      </Badge>
                      <p className="text-xs text-zinc-500">
                        {client.service_guarded_count}/{client.service_line_count} presidiate
                        {client.service_coverage_rate !== null ? ` · ${client.service_coverage_rate}%` : ''}
                      </p>
                      {client.service_link_gap_count > 0 ? (
                        <p className="text-xs text-amber-700">
                          {client.service_link_gap_count} task/scadenze senza linea servizio
                        </p>
                      ) : null}
                      {client.service_attention_count > 0 ? (
                        <p className="text-xs text-rose-600">
                          {client.service_attention_count} da attenzionare
                        </p>
                      ) : null}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {client.last_audit_date
                    ? new Date(client.last_audit_date).toLocaleDateString('it-IT')
                    : 'Mai'}
                </TableCell>
                <TableCell>
                  <Badge variant={isClientActive ? 'default' : 'secondary'}>
                    {isClientActive ? 'Attivo' : 'Inattivo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild size="sm" variant="outline" className="h-8">
                      <Link href={`/clients/${client.id}`}>
                        Apri scheda
                        <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <ManageLocationSheet clientId={client.id} />
                    <ManagePersonnelSheet
                      clientOptions={singleClientOptions}
                      defaultClientId={client.id}
                    />
                    <ClientStateToggleButton clientId={client.id} isActive={isClientActive} />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="border-t bg-zinc-50/60 px-4 py-3 text-xs text-zinc-500">
        Usa <span className="font-medium text-zinc-700">Apri scheda</span> per entrare nel cliente
        e gestire in dettaglio sedi e collaboratori.
      </div>
    </div>
  );
}
