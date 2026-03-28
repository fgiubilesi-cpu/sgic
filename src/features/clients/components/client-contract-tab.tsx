'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { reprocessDocumentIntake } from '@/features/documents/actions/document-actions';
import { DocumentIntakeReviewSheet } from '@/features/documents/components/document-intake-review-sheet';
import type { DocumentListItem } from '@/features/documents/queries/get-documents';
import { upsertClientContract } from '@/features/clients/actions/client-workspace-actions';
import {
  buildContractForm,
  getContractProposal,
  isContractLikeDocument,
  preferredDocumentAccessUrl,
  toDateLabel,
} from '@/features/clients/lib/client-workspace-view';
import type {
  ClientContractRecord,
  ClientContractStatus,
} from '@/features/clients/queries/get-client-workspace';

interface ClientContractTabProps {
  clientId: string;
  contract: ClientContractRecord | null;
  contractDocumentMismatches: DocumentListItem[];
  documents: DocumentListItem[];
  onOpenDocuments: () => void;
}

export function ClientContractTab({
  clientId,
  contract,
  contractDocumentMismatches,
  documents,
  onOpenDocuments,
}: ClientContractTabProps) {
  const router = useRouter();
  const [contractForm, setContractForm] = useState(() => buildContractForm(contract));
  const [savingContract, startSavingContract] = useTransition();
  const [reprocessingContractDocument, startReprocessingContractDocument] = useTransition();
  const contractProposalAutofillRef = useRef<string | null>(null);

  const contractDocuments = useMemo(
    () => documents.filter((document) => isContractLikeDocument(document)),
    [documents]
  );
  const latestContractDocument = contractDocuments[0] ?? null;
  const latestContractProposal = latestContractDocument
    ? getContractProposal(latestContractDocument)
    : null;
  const contractAttachmentUrl =
    preferredDocumentAccessUrl(latestContractDocument) ?? contractForm.attachment_url ?? null;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setContractForm(buildContractForm(contract));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [contract]);

  useEffect(() => {
    if (!latestContractDocument || !latestContractProposal) return;

    const formIsEmpty =
      !contractForm.start_date &&
      !contractForm.issue_date &&
      !contractForm.renewal_date &&
      !contractForm.end_date &&
      !contractForm.protocol_code &&
      !contractForm.duration_terms &&
      !contractForm.validity_terms &&
      !contractForm.exercised_activity &&
      !contractForm.client_references &&
      !contractForm.supervisor_name &&
      !contractForm.service_scope &&
      !contractForm.activity_frequency &&
      !contractForm.internal_owner &&
      !contractForm.notes &&
      (!contractForm.contract_type || contractForm.contract_type === 'standard');

    if (!formIsEmpty) return;
    if (contractProposalAutofillRef.current === latestContractDocument.id) return;

    contractProposalAutofillRef.current = latestContractDocument.id;
    const timer = window.setTimeout(() => {
      setContractForm((prev) => ({
        ...prev,
        activity_frequency:
          latestContractProposal.activity_frequency?.trim() || prev.activity_frequency,
        attachment_url: preferredDocumentAccessUrl(latestContractDocument) ?? prev.attachment_url,
        client_references:
          latestContractProposal.client_references?.trim() || prev.client_references,
        contract_type: latestContractProposal.contract_type?.trim() || prev.contract_type,
        duration_terms: latestContractProposal.duration_terms?.trim() || prev.duration_terms,
        end_date: latestContractProposal.end_date?.trim() || prev.end_date,
        exercised_activity:
          latestContractProposal.exercised_activity?.trim() || prev.exercised_activity,
        internal_owner: latestContractProposal.internal_owner?.trim() || prev.internal_owner,
        issue_date: latestContractProposal.issue_date?.trim() || prev.issue_date,
        notes: latestContractProposal.notes?.trim() || prev.notes,
        protocol_code: latestContractProposal.protocol_code?.trim() || prev.protocol_code,
        renewal_date: latestContractProposal.renewal_date?.trim() || prev.renewal_date,
        service_scope: latestContractProposal.service_scope?.trim() || prev.service_scope,
        start_date: latestContractProposal.start_date?.trim() || prev.start_date,
        supervisor_name: latestContractProposal.supervisor_name?.trim() || prev.supervisor_name,
        validity_terms: latestContractProposal.validity_terms?.trim() || prev.validity_terms,
      }));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [contractForm, latestContractDocument, latestContractProposal]);

  const saveContract = () => {
    startSavingContract(async () => {
      const result = await upsertClientContract(clientId, contractForm);
      if (!result.success) {
        toast.error(result.error ?? 'Impossibile salvare contratto');
        return;
      }
      toast.success('Contratto aggiornato');
    });
  };

  const loadLatestContractProposal = () => {
    if (!latestContractProposal) return;

    setContractForm((prev) => ({
      ...prev,
      activity_frequency:
        latestContractProposal.activity_frequency?.trim() || prev.activity_frequency,
      attachment_url: preferredDocumentAccessUrl(latestContractDocument) ?? prev.attachment_url,
      client_references:
        latestContractProposal.client_references?.trim() || prev.client_references,
      contract_type: latestContractProposal.contract_type?.trim() || prev.contract_type,
      duration_terms: latestContractProposal.duration_terms?.trim() || prev.duration_terms,
      end_date: latestContractProposal.end_date?.trim() || prev.end_date,
      exercised_activity:
        latestContractProposal.exercised_activity?.trim() || prev.exercised_activity,
      internal_owner: latestContractProposal.internal_owner?.trim() || prev.internal_owner,
      issue_date: latestContractProposal.issue_date?.trim() || prev.issue_date,
      notes: latestContractProposal.notes?.trim() || prev.notes,
      protocol_code: latestContractProposal.protocol_code?.trim() || prev.protocol_code,
      renewal_date: latestContractProposal.renewal_date?.trim() || prev.renewal_date,
      service_scope: latestContractProposal.service_scope?.trim() || prev.service_scope,
      start_date: latestContractProposal.start_date?.trim() || prev.start_date,
      supervisor_name: latestContractProposal.supervisor_name?.trim() || prev.supervisor_name,
      validity_terms: latestContractProposal.validity_terms?.trim() || prev.validity_terms,
    }));

    toast.success('Proposta documento caricata nel form contratto');
  };

  const reprocessLatestContractDocument = () => {
    if (!latestContractDocument) return;

    startReprocessingContractDocument(async () => {
      const result = await reprocessDocumentIntake(latestContractDocument.id);
      if (!result.success) {
        toast.error(result.error ?? 'Impossibile rileggere il documento');
        return;
      }

      router.refresh();
      toast.success('Documento riletto. La proposta è stata aggiornata.');
    });
  };

  return (
    <div className="space-y-4">
      {latestContractDocument ? (
        <div
          className={
            contract
              ? 'rounded-xl border border-sky-200 bg-sky-50 px-4 py-3'
              : 'rounded-xl border border-amber-200 bg-amber-50 px-4 py-3'
          }
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-zinc-900">Documento contratto rilevato</p>
              <p className="text-sm text-zinc-700">
                {latestContractDocument.title || 'Documento senza titolo'}
              </p>
              <p className="text-xs text-zinc-500">
                Intake: {latestContractDocument.ingestion_status || 'manuale'}
                {latestContractDocument.version ? ` · versione ${latestContractDocument.version}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {contractAttachmentUrl ? (
                <Button asChild variant="outline" size="sm">
                  <a href={contractAttachmentUrl} target="_blank" rel="noreferrer">
                    Apri file
                  </a>
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={reprocessLatestContractDocument}
                disabled={reprocessingContractDocument}
              >
                {reprocessingContractDocument ? 'Rilettura...' : 'Rileggi file'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadLatestContractProposal}
                disabled={!latestContractProposal}
              >
                Carica proposta nel form
              </Button>
              <DocumentIntakeReviewSheet document={latestContractDocument} />
              <Button type="button" variant="outline" size="sm" onClick={onOpenDocuments}>
                Vai ai documenti
              </Button>
            </div>
          </div>
          {!contract ? (
            <p className="mt-2 text-sm text-amber-800">
              Hai caricato un contratto, ma i dati non sono ancora stati applicati al workspace
              cliente. Puoi farlo dalla review oppure caricando la proposta nel form e salvando il
              contratto.
            </p>
          ) : contractDocumentMismatches.some((document) => document.id === latestContractDocument.id) ? (
            <p className="mt-2 text-sm text-rose-700">
              Il documento contratto propone dati diversi da quelli oggi confermati nel workspace.
            </p>
          ) : (
            <p className="mt-2 text-sm text-sky-700">
              Il file contratto è disponibile direttamente da questa scheda.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          Nessun documento categoria contratto collegato a questo cliente. Caricalo dalla tab
          Documenti o dal pulsante Nuovo Documento.
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Perimetro contrattuale</CardTitle>
            <CardDescription>
              Definisci contratto corrente, milestone e servizi inclusi.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo contratto</Label>
                <Input
                  value={contractForm.contract_type}
                  onChange={(event) =>
                    setContractForm((prev) => ({ ...prev, contract_type: event.target.value }))
                  }
                  placeholder="Es. HACCP Full Service"
                />
              </div>
              <div className="space-y-2">
                <Label>Stato</Label>
                <select
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                  value={contractForm.status}
                  onChange={(event) =>
                    setContractForm((prev) => ({
                      ...prev,
                      status: event.target.value as ClientContractStatus,
                    }))
                  }
                >
                  <option value="draft">Bozza</option>
                  <option value="active">Attivo</option>
                  <option value="paused">In pausa</option>
                  <option value="expired">Scaduto</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Protocollo</Label>
                <Input
                  value={contractForm.protocol_code ?? ''}
                  onChange={(event) =>
                    setContractForm((prev) => ({ ...prev, protocol_code: event.target.value }))
                  }
                  placeholder="Es. 2026/HACCP/034"
                />
              </div>
              <div className="space-y-2">
                <Label>Emissione</Label>
                <Input
                  type="date"
                  value={contractForm.issue_date ?? ''}
                  onChange={(event) =>
                    setContractForm((prev) => ({ ...prev, issue_date: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Inizio</Label>
                <Input
                  type="date"
                  value={contractForm.start_date ?? ''}
                  onChange={(event) =>
                    setContractForm((prev) => ({ ...prev, start_date: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Rinnovo</Label>
                <Input
                  type="date"
                  value={contractForm.renewal_date ?? ''}
                  onChange={(event) =>
                    setContractForm((prev) => ({ ...prev, renewal_date: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Scadenza</Label>
                <Input
                  type="date"
                  value={contractForm.end_date ?? ''}
                  onChange={(event) =>
                    setContractForm((prev) => ({ ...prev, end_date: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Durata / termini</Label>
                <Input
                  value={contractForm.duration_terms ?? ''}
                  onChange={(event) =>
                    setContractForm((prev) => ({ ...prev, duration_terms: event.target.value }))
                  }
                  placeholder="Es. 1 ANNO - Tacito rinnovo"
                />
              </div>
              <div className="space-y-2">
                <Label>Validità offerta / note temporali</Label>
                <Input
                  value={contractForm.validity_terms ?? ''}
                  onChange={(event) =>
                    setContractForm((prev) => ({ ...prev, validity_terms: event.target.value }))
                  }
                  placeholder="Es. 30gg"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Attività esercitata dal cliente</Label>
                <Input
                  value={contractForm.exercised_activity ?? ''}
                  onChange={(event) =>
                    setContractForm((prev) => ({
                      ...prev,
                      exercised_activity: event.target.value,
                    }))
                  }
                  placeholder="Es. Importazione e distribuzione di MOCA"
                />
              </div>
              <div className="space-y-2">
                <Label>Referenti cliente</Label>
                <Input
                  value={contractForm.client_references ?? ''}
                  onChange={(event) =>
                    setContractForm((prev) => ({ ...prev, client_references: event.target.value }))
                  }
                  placeholder="Es. Nome Cognome, Nome Cognome"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Servizi inclusi</Label>
              <Textarea
                rows={3}
                value={contractForm.service_scope ?? ''}
                onChange={(event) =>
                  setContractForm((prev) => ({ ...prev, service_scope: event.target.value }))
                }
                placeholder="Elenca perimetro operativo, SLA e deliverable"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Frequenza attività previste</Label>
                <Input
                  value={contractForm.activity_frequency ?? ''}
                  onChange={(event) =>
                    setContractForm((prev) => ({
                      ...prev,
                      activity_frequency: event.target.value,
                    }))
                  }
                  placeholder="Es. Audit mensile + review trimestrale"
                />
              </div>
              <div className="space-y-2">
                <Label>Referente interno</Label>
                <Input
                  value={contractForm.internal_owner ?? ''}
                  onChange={(event) =>
                    setContractForm((prev) => ({ ...prev, internal_owner: event.target.value }))
                  }
                  placeholder="Es. f.giubilesi@..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Supervisore</Label>
              <Input
                value={contractForm.supervisor_name ?? ''}
                onChange={(event) =>
                  setContractForm((prev) => ({ ...prev, supervisor_name: event.target.value }))
                }
                placeholder="Es. Dott. Massimo A. Giubilesi"
              />
            </div>

            <div className="space-y-2">
              <Label>URL allegato contratto</Label>
              <Input
                value={contractForm.attachment_url ?? ''}
                onChange={(event) =>
                  setContractForm((prev) => ({ ...prev, attachment_url: event.target.value }))
                }
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Note contrattuali</Label>
              <Textarea
                rows={4}
                value={contractForm.notes ?? ''}
                onChange={(event) =>
                  setContractForm((prev) => ({ ...prev, notes: event.target.value }))
                }
                placeholder="Vincoli, eccezioni, extra-canone, ecc."
              />
            </div>

            <Button
              type="button"
              onClick={saveContract}
              disabled={savingContract || contractForm.contract_type.trim() === ''}
              className="w-full"
            >
              {savingContract ? 'Salvataggio...' : 'Salva contratto'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sintesi contratto</CardTitle>
            <CardDescription>
              Dati chiave per lettura rapida e alimentazione scadenze.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Tipo</p>
              <p className="font-medium text-zinc-900">{contractForm.contract_type || '-'}</p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Protocollo</p>
              <p className="font-medium text-zinc-900">{contractForm.protocol_code || '-'}</p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Emissione</p>
              <p className="font-medium text-zinc-900">{toDateLabel(contractForm.issue_date)}</p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Stato</p>
              <p className="font-medium text-zinc-900">{contractForm.status}</p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Durata</p>
              <p className="font-medium text-zinc-900">{contractForm.duration_terms || '-'}</p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Rinnovo</p>
              <p className="font-medium text-zinc-900">{toDateLabel(contractForm.renewal_date)}</p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Scadenza</p>
              <p className="font-medium text-zinc-900">{toDateLabel(contractForm.end_date)}</p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Owner interno</p>
              <p className="font-medium text-zinc-900">{contractForm.internal_owner || '-'}</p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Supervisore</p>
              <p className="font-medium text-zinc-900">{contractForm.supervisor_name || '-'}</p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Attività esercitata</p>
              <p className="font-medium text-zinc-900">{contractForm.exercised_activity || '-'}</p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Referenti cliente</p>
              <p className="font-medium text-zinc-900">{contractForm.client_references || '-'}</p>
            </div>
            {contractAttachmentUrl ? (
              <Button asChild variant="outline" className="w-full">
                <a href={contractAttachmentUrl} target="_blank" rel="noreferrer">
                  Apri allegato contratto
                </a>
              </Button>
            ) : (
              <p className="text-xs text-zinc-500">Nessun allegato contratto collegato.</p>
            )}
            {latestContractProposal ? (
              <div className="space-y-2 rounded-md border border-dashed border-zinc-200 bg-zinc-50 px-3 py-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Dati proposti dal documento
                </p>
                <div className="grid gap-2 text-sm text-zinc-700">
                  <p>
                    <span className="font-medium text-zinc-900">Tipo:</span>{' '}
                    {latestContractProposal.contract_type || '-'}
                  </p>
                  <p>
                    <span className="font-medium text-zinc-900">Protocollo:</span>{' '}
                    {latestContractProposal.protocol_code || '-'}
                  </p>
                  <p>
                    <span className="font-medium text-zinc-900">Emissione:</span>{' '}
                    {toDateLabel(latestContractProposal.issue_date)}
                  </p>
                  <p>
                    <span className="font-medium text-zinc-900">Inizio:</span>{' '}
                    {toDateLabel(latestContractProposal.start_date)}
                  </p>
                  <p>
                    <span className="font-medium text-zinc-900">Rinnovo:</span>{' '}
                    {toDateLabel(latestContractProposal.renewal_date)}
                  </p>
                  <p>
                    <span className="font-medium text-zinc-900">Scadenza:</span>{' '}
                    {toDateLabel(latestContractProposal.end_date)}
                  </p>
                  <p>
                    <span className="font-medium text-zinc-900">Frequenza:</span>{' '}
                    {latestContractProposal.activity_frequency || '-'}
                  </p>
                  <p>
                    <span className="font-medium text-zinc-900">Owner:</span>{' '}
                    {latestContractProposal.internal_owner || '-'}
                  </p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
