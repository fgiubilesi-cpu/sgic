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
import { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { ManageLocationSheet } from './manage-location-sheet';
import { ManagePersonnelSheet } from '@/features/personnel/components/manage-personnel-sheet';
import type { ClientOption } from '@/features/clients/queries/get-client-options';

type ClientRow = Database['public']['Tables']['clients']['Row'];

interface ClientWithStats extends ClientRow {
  location_count: number;
  personnel_count: number;
  last_audit_date: string | null;
}

interface ClientTableProps {
  clientOptions: ClientOption[];
  clients: ClientWithStats[];
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
            <TableHead>Ultimo Audit</TableHead>
            <TableHead>Stato</TableHead>
            <TableHead className="w-[320px]">Gestione</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => {
            const clientOption = clientOptions.find((option) => option.id === client.id);
            const singleClientOptions = clientOption ? [clientOption] : [];

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
                <TableCell>
                  {client.last_audit_date
                    ? new Date(client.last_audit_date).toLocaleDateString('it-IT')
                    : 'Mai'}
                </TableCell>
                <TableCell>
                  <Badge variant={client.is_active ? 'default' : 'secondary'}>
                    {client.is_active ? 'Attivo' : 'Inattivo'}
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
