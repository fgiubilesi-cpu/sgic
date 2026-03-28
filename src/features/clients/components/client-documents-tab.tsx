'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, RefreshCcw, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ManageDocumentSheet } from '@/features/documents/components/manage-document-sheet';
import { DocumentsTable } from '@/features/documents/components/documents-table';
import type { DocumentListItem } from '@/features/documents/queries/get-documents';
import {
  documentFocusLabel,
  isContractLikeDocument,
  toDateStart,
  type ClientWorkspaceDocumentFocus,
} from '@/features/clients/lib/client-workspace-view';
import type { ClientOption } from '@/features/clients/queries/get-client-options';
import type { PersonnelListItem } from '@/features/personnel/queries/get-personnel';

interface ClientDocumentsTabProps {
  clientId: string;
  clientOptions: ClientOption[];
  contractDocumentMismatches: DocumentListItem[];
  documentExpiredCount: number;
  documentExpiringSoonCount: number;
  documentReviewQueue: DocumentListItem[];
  documents: DocumentListItem[];
  personnel: PersonnelListItem[];
}

export function ClientDocumentsTab({
  clientId,
  clientOptions,
  contractDocumentMismatches,
  documentExpiredCount,
  documentExpiringSoonCount,
  documentReviewQueue,
  documents,
  personnel,
}: ClientDocumentsTabProps) {
  const [docSearch, setDocSearch] = useState('');
  const [docFocus, setDocFocus] = useState<ClientWorkspaceDocumentFocus>('all');
  const [docCategory, setDocCategory] = useState('all');
  const [docStatus, setDocStatus] = useState('all');
  const [docIngestion, setDocIngestion] = useState('all');
  const [docScope, setDocScope] = useState<'all' | 'client' | 'location' | 'personnel'>('all');

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          documents
            .map((document) => document.category)
            .filter(
              (category): category is NonNullable<DocumentListItem['category']> =>
                Boolean(category)
            )
        )
      ),
    [documents]
  );

  const filteredDocuments = useMemo(
    () =>
      documents.filter((document) => {
        const search = docSearch.trim().toLowerCase();
        const matchesSearch =
          search === '' ||
          (document.title ?? '').toLowerCase().includes(search) ||
          (document.description ?? '').toLowerCase().includes(search) ||
          (document.file_name ?? '').toLowerCase().includes(search);
        const matchesCategory = docCategory === 'all' || document.category === docCategory;
        const matchesStatus = docStatus === 'all' || document.status === docStatus;
        const matchesIngestion =
          docIngestion === 'all' || document.ingestion_status === docIngestion;
        const matchesScope =
          docScope === 'all' ||
          (docScope === 'client' &&
            Boolean(document.client_id && !document.location_id && !document.personnel_id)) ||
          (docScope === 'location' && Boolean(document.location_id)) ||
          (docScope === 'personnel' && Boolean(document.personnel_id));
        const matchesFocus =
          docFocus === 'all' ||
          (docFocus === 'review' && document.ingestion_status === 'review_required') ||
          (docFocus === 'expired' &&
            Boolean(document.expiry_date) &&
            toDateStart(document.expiry_date as string) < new Date(new Date().setHours(0, 0, 0, 0))) ||
          (docFocus === 'contracts' && isContractLikeDocument(document)) ||
          (docFocus === 'mismatch' &&
            contractDocumentMismatches.some((item) => item.id === document.id)) ||
          (docFocus === 'versioned' && document.version_count > 1);
        return (
          matchesSearch &&
          matchesCategory &&
          matchesStatus &&
          matchesIngestion &&
          matchesScope &&
          matchesFocus
        );
      }),
    [
      contractDocumentMismatches,
      docCategory,
      docFocus,
      docIngestion,
      docScope,
      docSearch,
      docStatus,
      documents,
    ]
  );

  const activeDocumentFilters = useMemo(
    () =>
      [
        docFocus !== 'all' ? `Preset: ${documentFocusLabel(docFocus)}` : null,
        docCategory !== 'all' ? `Categoria: ${docCategory}` : null,
        docStatus !== 'all' ? `Stato: ${docStatus}` : null,
        docIngestion !== 'all' ? `Intake: ${docIngestion}` : null,
        docScope !== 'all'
          ? `Ambito: ${
              docScope === 'client'
                ? 'Cliente'
                : docScope === 'location'
                  ? 'Sede'
                  : 'Collaboratore'
            }`
          : null,
        docSearch.trim() !== '' ? `Ricerca: "${docSearch.trim()}"` : null,
      ].filter((value): value is string => Boolean(value)),
    [docCategory, docFocus, docIngestion, docScope, docSearch, docStatus]
  );

  const applyDocumentPreset = (preset: ClientWorkspaceDocumentFocus) => {
    setDocFocus(preset);
    setDocSearch('');
    setDocStatus('all');
    setDocIngestion('all');
    setDocScope('all');
    setDocCategory('all');

    if (preset === 'review') setDocIngestion('review_required');
    if (preset === 'contracts' || preset === 'mismatch') {
      setDocCategory('Contract');
    }
  };

  const resetDocumentFilters = () => {
    applyDocumentPreset('all');
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
              In coda review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-amber-700">{documentReviewQueue.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
              Critici
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-rose-700">
              {documentExpiredCount + documentExpiringSoonCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
              Mismatch contratto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-rose-700">
              {contractDocumentMismatches.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Archivio documentale ({documents.length})</CardTitle>
            <CardDescription>
              Repository operativo con categorie, stato e livello di contesto.
            </CardDescription>
          </div>
          <ManageDocumentSheet
            clientOptions={clientOptions}
            defaultClientId={clientId}
            personnelOptions={personnel}
          />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyDocumentPreset('all')}
              className={
                docFocus === 'all'
                  ? 'rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white'
                  : 'rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600'
              }
            >
              Tutti
            </button>
            <button
              type="button"
              onClick={() => applyDocumentPreset('review')}
              className={
                docFocus === 'review'
                  ? 'rounded-full bg-amber-600 px-3 py-1.5 text-xs font-medium text-white'
                  : 'rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700'
              }
            >
              Da validare
            </button>
            <button
              type="button"
              onClick={() => applyDocumentPreset('expired')}
              className={
                docFocus === 'expired'
                  ? 'rounded-full bg-rose-600 px-3 py-1.5 text-xs font-medium text-white'
                  : 'rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700'
              }
            >
              Scaduti
            </button>
            <button
              type="button"
              onClick={() => applyDocumentPreset('contracts')}
              className={
                docFocus === 'contracts'
                  ? 'rounded-full bg-sky-600 px-3 py-1.5 text-xs font-medium text-white'
                  : 'rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700'
              }
            >
              Contratti
            </button>
            <button
              type="button"
              onClick={() => applyDocumentPreset('mismatch')}
              className={
                docFocus === 'mismatch'
                  ? 'rounded-full bg-violet-600 px-3 py-1.5 text-xs font-medium text-white'
                  : 'rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700'
              }
            >
              Mismatch
            </button>
            <button
              type="button"
              onClick={() => applyDocumentPreset('versioned')}
              className={
                docFocus === 'versioned'
                  ? 'rounded-full bg-zinc-700 px-3 py-1.5 text-xs font-medium text-white'
                  : 'rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700'
              }
            >
              Versionati
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-900">
                {filteredDocuments.length} documenti visibili su {documents.length}
              </p>
              <div className="flex flex-wrap gap-2">
                {activeDocumentFilters.length > 0 ? (
                  activeDocumentFilters.map((filter) => (
                    <Badge
                      key={filter}
                      variant="outline"
                      className="border-zinc-200 bg-white text-zinc-700"
                    >
                      {filter}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-zinc-500">
                    Nessun filtro attivo: stai vedendo l&apos;archivio completo.
                  </span>
                )}
              </div>
            </div>
            {activeDocumentFilters.length > 0 ? (
              <Button variant="outline" size="sm" onClick={resetDocumentFilters}>
                <RefreshCcw className="mr-2 h-3.5 w-3.5" />
                Reset filtri
              </Button>
            ) : null}
          </div>

          {documentReviewQueue.length > 0 || contractDocumentMismatches.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    Queue intake
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-amber-200 bg-white text-amber-800 hover:bg-amber-100"
                    onClick={() => applyDocumentPreset('review')}
                  >
                    Apri coda
                  </Button>
                </div>
                <p className="mt-1 text-sm text-amber-700">
                  {documentReviewQueue.length > 0
                    ? `${documentReviewQueue.length} documenti richiedono review o sono andati in errore.`
                    : 'Nessun documento bloccato in intake.'}
                </p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-rose-800">
                    <ShieldAlert className="h-4 w-4" />
                    Allineamento workspace
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-rose-200 bg-white text-rose-800 hover:bg-rose-100"
                    onClick={() => applyDocumentPreset('mismatch')}
                  >
                    Vedi mismatch
                  </Button>
                </div>
                <p className="mt-1 text-sm text-rose-700">
                  {contractDocumentMismatches.length > 0
                    ? `${contractDocumentMismatches.length} documenti contratto propongono dati diversi dalla tab contratto.`
                    : 'Nessun mismatch rilevato sul contratto cliente.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Archivio documentale allineato: nessuna review bloccata e nessun mismatch contratto
              rilevato.
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Ricerca</Label>
              <Input
                value={docSearch}
                onChange={(event) => setDocSearch(event.target.value)}
                placeholder="Titolo, descrizione o nome file"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <select
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                value={docCategory}
                onChange={(event) => setDocCategory(event.target.value)}
              >
                <option value="all">Tutte</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Stato</Label>
              <select
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                value={docStatus}
                onChange={(event) => setDocStatus(event.target.value)}
              >
                <option value="all">Tutti</option>
                <option value="draft">Bozza</option>
                <option value="published">Pubblicato</option>
                <option value="archived">Archiviato</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Intake</Label>
              <select
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                value={docIngestion}
                onChange={(event) => setDocIngestion(event.target.value)}
              >
                <option value="all">Tutti</option>
                <option value="manual">Manuale</option>
                <option value="uploaded">Caricato</option>
                <option value="parsed">Estratto</option>
                <option value="review_required">Da validare</option>
                <option value="reviewed">Validato</option>
                <option value="linked">Collegato</option>
                <option value="failed">Errore</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Ambito</Label>
              <select
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                value={docScope}
                onChange={(event) =>
                  setDocScope(event.target.value as 'all' | 'client' | 'location' | 'personnel')
                }
              >
                <option value="all">Tutti</option>
                <option value="client">Cliente</option>
                <option value="location">Sede</option>
                <option value="personnel">Collaboratore</option>
              </select>
            </div>
          </div>

          <DocumentsTable
            clientOptions={clientOptions}
            documents={filteredDocuments}
            emptyAction={
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" size="sm" onClick={resetDocumentFilters}>
                  <RefreshCcw className="mr-2 h-3.5 w-3.5" />
                  Reset filtri
                </Button>
                <ManageDocumentSheet
                  clientOptions={clientOptions}
                  defaultClientId={clientId}
                  personnelOptions={personnel}
                />
              </div>
            }
            emptyMessage="Nessun documento coerente con i filtri selezionati."
            personnelOptions={personnel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
