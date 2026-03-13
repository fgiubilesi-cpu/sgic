'use client';

import type { ReactNode } from 'react';
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
import { DocumentIntakeReviewSheet } from './document-intake-review-sheet';
import { DocumentGovernanceDialog } from './document-governance-dialog';

interface DocumentsTableProps {
  clientOptions: ClientOption[];
  documents: DocumentListItem[];
  emptyAction?: ReactNode;
  emptyMessage?: string;
  personnelOptions: PersonnelListItem[];
}

function statusTone(status: string | null) {
  if (status === 'published') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'archived') return 'border-zinc-200 bg-zinc-50 text-zinc-500';
  return 'border-amber-200 bg-amber-50 text-amber-700';
}

function ingestionTone(status: string | null) {
  if (status === 'reviewed' || status === 'linked') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  if (status === 'review_required' || status === 'parsed') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }
  if (status === 'failed') {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }
  if (status === 'uploaded') {
    return 'border-sky-200 bg-sky-50 text-sky-700';
  }
  return 'border-zinc-200 bg-zinc-50 text-zinc-600';
}

function ingestionLabel(status: string | null) {
  if (status === 'uploaded') return 'Caricato';
  if (status === 'parsed') return 'Estratto';
  if (status === 'review_required') return 'Da validare';
  if (status === 'reviewed') return 'Validato';
  if (status === 'linked') return 'Collegato';
  if (status === 'failed') return 'Errore';
  return 'Manuale';
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

function workflowTone(document: DocumentListItem) {
  if (document.linked_entity_count > 0) {
    return 'border-violet-200 bg-violet-50 text-violet-700';
  }
  if (document.client_id && document.review_count > 0) {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }
  if (document.client_id) {
    return 'border-sky-200 bg-sky-50 text-sky-700';
  }
  return 'border-zinc-200 bg-zinc-50 text-zinc-600';
}

function workflowLabel(document: DocumentListItem) {
  if (document.linked_entity_count > 0) return 'Applicato al workspace';
  if (document.client_id && document.review_count > 0) return 'Review salvata, manca apply';
  if (document.client_id) return 'Pronto per il workspace';
  return 'Solo archivio documento';
}

export function DocumentsTable({
  clientOptions,
  documents,
  emptyAction,
  emptyMessage = 'Nessun documento registrato.',
  personnelOptions,
}: DocumentsTableProps) {
  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-8 text-center">
        <p className="text-sm font-medium text-zinc-700">Archivio vuoto per i filtri correnti</p>
        <p className="mt-1 text-sm text-zinc-500">{emptyMessage}</p>
        {emptyAction ? <div className="mt-4 flex justify-center">{emptyAction}</div> : null}
      </div>
    );
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
                  {document.version_count > 1 ? ` · ${document.version_count} revisioni` : ''}
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
              <div className="space-y-1">
                <Badge variant="outline" className={statusTone(document.status)}>
                  {document.status === 'published'
                    ? 'Pubblicato'
                    : document.status === 'archived'
                    ? 'Archiviato'
                    : 'Bozza'}
                </Badge>
                <Badge variant="outline" className={ingestionTone(document.ingestion_status)}>
                  {ingestionLabel(document.ingestion_status)}
                </Badge>
                <Badge variant="outline" className={workflowTone(document)}>
                  {workflowLabel(document)}
                </Badge>
                {document.linked_entity_count > 0 ? (
                  <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-700">
                    {document.linked_entity_count} link operativi
                  </Badge>
                ) : null}
                {document.review_count > 0 ? (
                  <p className="text-xs text-zinc-500">
                    {document.last_review_action
                      ? `Ultima review: ${document.last_review_action}`
                      : `${document.review_count} review registrate`}
                  </p>
                ) : null}
              </div>
            </TableCell>
            <TableCell>
              <div className={`text-sm ${expiryTone(document.expiry_date)}`}>
                {document.expiry_date
                  ? new Date(document.expiry_date).toLocaleDateString('it-IT')
                  : 'Nessuna'}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap items-center gap-2">
                {document.access_url || document.file_url ? (
                  <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-blue-600">
                    <a href={document.access_url ?? document.file_url ?? '#'} target="_blank" rel="noreferrer">
                      Apri
                    </a>
                  </Button>
                ) : (
                  <span className="text-xs text-zinc-400">File non disponibile</span>
                )}
                <DocumentIntakeReviewSheet document={document} />
                <DocumentGovernanceDialog document={document} />
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
