'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ClientOption } from '@/features/clients/queries/get-client-options';
import type { PersonnelListItem } from '@/features/personnel/queries/get-personnel';
import type { DocumentListItem } from '@/features/documents/queries/get-documents';
import { ManageDocumentSheet } from './manage-document-sheet';

interface DocumentsTableProps {
  clientOptions: ClientOption[];
  documents: DocumentListItem[];
  emptyMessage?: string;
  personnelOptions: PersonnelListItem[];
}

function statusTone(status: string | null) {
  if (status === 'published') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'archived') return 'border-zinc-200 bg-zinc-50 text-zinc-500';
  return 'border-amber-200 bg-amber-50 text-amber-700';
}

function expiryTone(expiryDate: string | null) {
  if (!expiryDate) return 'text-zinc-500';
  const expiry = new Date(expiryDate);
  const today = new Date();
  const inThirtyDays = new Date();
  inThirtyDays.setDate(today.getDate() + 30);

  if (expiry < today) return 'text-rose-700';
  if (expiry <= inThirtyDays) return 'text-amber-700';
  return 'text-emerald-700';
}

export function DocumentsTable({
  clientOptions,
  documents,
  emptyMessage = 'Nessun documento registrato.',
  personnelOptions,
}: DocumentsTableProps) {
  if (documents.length === 0) {
    return <p className="text-sm text-zinc-500">{emptyMessage}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Documento</TableHead>
          <TableHead>Collegamenti</TableHead>
          <TableHead>Stato</TableHead>
          <TableHead>Scadenza</TableHead>
          <TableHead>Azioni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((document) => (
          <TableRow key={document.id}>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium text-zinc-900">{document.title || 'Documento senza titolo'}</span>
                <span className="text-xs text-zinc-500">
                  {document.category || 'Categoria non definita'}
                  {document.version ? ` · ${document.version}` : ''}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1 text-xs text-zinc-600">
                {document.client_name ? <div>Cliente: {document.client_name}</div> : null}
                {document.location_name ? <div>Sede: {document.location_name}</div> : null}
                {document.personnel_name ? <div>Collaboratore: {document.personnel_name}</div> : null}
                {!document.client_name && !document.location_name && !document.personnel_name ? (
                  <div>Nessun collegamento specifico</div>
                ) : null}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className={statusTone(document.status)}>
                {document.status === 'published'
                  ? 'Pubblicato'
                  : document.status === 'archived'
                  ? 'Archiviato'
                  : 'Bozza'}
              </Badge>
            </TableCell>
            <TableCell>
              <div className={`text-sm ${expiryTone(document.expiry_date)}`}>
                {document.expiry_date
                  ? new Date(document.expiry_date).toLocaleDateString('it-IT')
                  : 'Nessuna'}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {document.file_url ? (
                  <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-blue-600">
                    <a href={document.file_url} target="_blank" rel="noreferrer">
                      Apri
                    </a>
                  </Button>
                ) : null}
                <ManageDocumentSheet
                  clientOptions={clientOptions}
                  document={document}
                  personnelOptions={personnelOptions}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
