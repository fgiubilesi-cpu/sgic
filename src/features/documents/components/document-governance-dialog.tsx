'use client';

import { useEffect, useState } from 'react';
import { History, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Tables } from '@/types/database.types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getDocumentGovernanceData } from '@/features/documents/actions/document-actions';
import type { DocumentListItem } from '@/features/documents/queries/get-documents';

interface DocumentGovernanceDialogProps {
  document: DocumentListItem;
}

interface DocumentGovernanceData {
  document: Pick<
    Tables<'documents'>,
    'id' | 'title' | 'category' | 'status' | 'version' | 'created_at' | 'updated_at' | 'ingestion_status'
  >;
  entities: Array<
    Pick<
      Tables<'document_entities'>,
      'id' | 'entity_type' | 'linked_table' | 'linked_record_id' | 'confidence' | 'created_at'
    >
  >;
  reviews: Array<
    Pick<
      Tables<'document_extraction_reviews'>,
      'id' | 'status' | 'review_action' | 'reviewer_notes' | 'reviewed_at' | 'created_at'
    >
  >;
  versions: Array<Pick<Tables<'document_versions'>, 'id' | 'created_at'>>;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  return new Date(value).toLocaleString('it-IT');
}

export function DocumentGovernanceDialog({ document }: DocumentGovernanceDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DocumentGovernanceData | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;

    setLoading(true);
    getDocumentGovernanceData(document.id)
      .then((result) => {
        if (!active) return;
        if (!result.success) {
          toast.error(result.error ?? 'Impossibile caricare governance documento');
          return;
        }
        setData(result.data as DocumentGovernanceData);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [document.id, open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-zinc-700">
          <History className="mr-2 h-3.5 w-3.5" />
          Governance
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Governance documento</DialogTitle>
          <DialogDescription>
            Storico versioni, review effettuate e collegamenti operativi generati da questo documento.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-sm text-zinc-500">Caricamento governance...</div>
        ) : data ? (
          <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Versioni</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-900">{data.versions.length}</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Review</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-900">{data.reviews.length}</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Entità collegate</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-900">{data.entities.length}</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Stato intake</p>
                <p className="mt-2 text-sm font-semibold text-zinc-900">{data.document.ingestion_status ?? 'manual'}</p>
              </div>
            </div>

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">Versioni file</h3>
                <p className="text-xs text-zinc-500">Ogni sostituzione del file crea una revisione storica.</p>
              </div>
              {data.versions.length === 0 ? (
                <p className="text-sm text-zinc-500">Nessuna revisione registrata.</p>
              ) : (
                <div className="space-y-2">
                  {data.versions.map((version, index) => (
                    <div key={version.id} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-zinc-900">Revisione #{data.versions.length - index}</span>
                        <span className="text-xs text-zinc-500">{formatDate(version.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">Storico review</h3>
                <p className="text-xs text-zinc-500">Conferme manuali del payload estratto.</p>
              </div>
              {data.reviews.length === 0 ? (
                <p className="text-sm text-zinc-500">Nessuna review registrata.</p>
              ) : (
                <div className="space-y-2">
                  {data.reviews.map((review) => (
                    <div key={review.id} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{review.status}</Badge>
                          <Badge variant="outline">{review.review_action}</Badge>
                        </div>
                        <span className="text-xs text-zinc-500">{formatDate(review.reviewed_at ?? review.created_at)}</span>
                      </div>
                      {review.reviewer_notes ? (
                        <p className="mt-2 text-xs text-zinc-600">{review.reviewer_notes}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">Collegamenti operativi</h3>
                <p className="text-xs text-zinc-500">Record generati o aggiornati dal documento.</p>
              </div>
              {data.entities.length === 0 ? (
                <p className="text-sm text-zinc-500">Nessuna entità collegata.</p>
              ) : (
                <div className="space-y-2">
                  {data.entities.map((entity) => (
                    <div key={entity.id} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Link2 className="h-3.5 w-3.5 text-zinc-400" />
                          <span className="font-medium text-zinc-900">{entity.entity_type}</span>
                          <Badge variant="outline">{entity.confidence}</Badge>
                        </div>
                        <span className="text-xs text-zinc-500">{formatDate(entity.created_at)}</span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-600">
                        {entity.linked_table ? `${entity.linked_table} · ${entity.linked_record_id ?? 'n/d'}` : 'Non collegato a tabella target'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="py-8 text-sm text-zinc-500">Nessun dato governance disponibile.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
