'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Link2, SquarePen } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  getDocumentIntakeData,
  submitDocumentIntakeReview,
} from '@/features/documents/actions/document-actions';
import type { DocumentIntakeProposal } from '@/features/documents/lib/document-intelligence';
import type { DocumentListItem } from '@/features/documents/queries/get-documents';

type ReviewAction = 'save_review' | 'apply_to_workspace';
type ReviewCategory =
  | 'Procedure'
  | 'Manual'
  | 'Instruction'
  | 'Form'
  | 'Contract'
  | 'Certificate'
  | 'Other'
  | 'OrgChart'
  | 'Authorization'
  | 'Registry'
  | 'Report';

interface DocumentIntakeReviewSheetProps {
  document: DocumentListItem;
}

function scopeHint(document: DocumentListItem) {
  const pieces = [];
  if (document.client_name) pieces.push(`cliente ${document.client_name}`);
  if (document.location_name) pieces.push(`sede ${document.location_name}`);
  if (document.personnel_name) pieces.push(`collaboratore ${document.personnel_name}`);
  return pieces.length > 0 ? pieces.join(' · ') : 'nessun contesto specifico';
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

function confidenceLabel(value: DocumentIntakeProposal['confidence']) {
  if (value === 'high') return 'Alta';
  if (value === 'medium') return 'Media';
  return 'Bassa';
}

function inferReviewCategory(
  documentMeta: Pick<DocumentListItem, 'category' | 'file_name' | 'title'>,
  proposal: DocumentIntakeProposal | null
): ReviewCategory {
  if (proposal?.contract || (proposal?.service_lines?.length ?? 0) > 0) return 'Contract';
  const lower = `${documentMeta.title ?? ''} ${documentMeta.file_name ?? ''}`.toLowerCase();
  if (
    lower.includes('offerta') ||
    lower.includes('contratto') ||
    lower.includes('progetto di consulenza')
  ) {
    return 'Contract';
  }
  return (documentMeta.category ?? 'Other') as ReviewCategory;
}

function defaultReviewAction(
  documentContext: Pick<DocumentListItem, 'client_id' | 'linked_entity_count'>,
  latestAction: ReviewAction | null | undefined
): ReviewAction {
  if (!documentContext.client_id) return 'save_review';
  if (documentContext.linked_entity_count > 0) return 'save_review';
  if (latestAction === 'apply_to_workspace') return 'save_review';
  return 'apply_to_workspace';
}

export function DocumentIntakeReviewSheet({ document }: DocumentIntakeReviewSheetProps) {
  const documentCategory = document.category;
  const documentClientId = document.client_id;
  const documentFileName = document.file_name;
  const documentId = document.id;
  const documentIngestionStatus = document.ingestion_status;
  const documentLastReviewAction = document.last_review_action as ReviewAction | null;
  const documentLinkedEntityCount = document.linked_entity_count;
  const documentTitle = document.title;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [proposal, setProposal] = useState<DocumentIntakeProposal | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [action, setAction] = useState<ReviewAction>(
    defaultReviewAction(
      { client_id: documentClientId, linked_entity_count: documentLinkedEntityCount },
      documentLastReviewAction
    )
  );
  const [createFollowupTask, setCreateFollowupTask] = useState(false);
  const [latestIngestionStatus, setLatestIngestionStatus] = useState<string | null>(documentIngestionStatus);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [reviewCategory, setReviewCategory] = useState<ReviewCategory>((documentCategory ?? 'Other') as ReviewCategory);
  const router = useRouter();

  const canApplyToWorkspace = Boolean(documentClientId);
  const needsWorkspaceApply = canApplyToWorkspace && documentLinkedEntityCount === 0;
  const hasSavedReviewOnly = needsWorkspaceApply && documentLastReviewAction === 'save_review';

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setLoading(true);
      setProposal(null);
      setReviewerNotes('');
      setAction(
        defaultReviewAction(
          { client_id: documentClientId, linked_entity_count: documentLinkedEntityCount },
          documentLastReviewAction
        )
      );
      setCreateFollowupTask(false);
      setLatestIngestionStatus(documentIngestionStatus);
      setExtractedText(null);
      setReviewCategory((documentCategory ?? 'Other') as ReviewCategory);
      return;
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!open) return;
    let active = true;

    getDocumentIntakeData(documentId)
      .then((result) => {
        if (!active) return;
        if (!result.success) {
          toast.error(result.error ?? 'Impossibile caricare intake');
          return;
        }
        setProposal(result.data.proposal);
        setReviewerNotes(result.data.reviewerNotes ?? '');
        setAction(
          defaultReviewAction(
            { client_id: documentClientId, linked_entity_count: documentLinkedEntityCount },
            (result.data.action as ReviewAction) ?? null
          )
        );
        setLatestIngestionStatus(result.data.latestIngestionStatus ?? documentIngestionStatus);
        setExtractedText(result.data.extractedText ?? null);
        setReviewCategory(
          inferReviewCategory(
            { category: documentCategory, file_name: documentFileName, title: documentTitle },
            result.data.proposal
          )
        );
      })
      .catch(() => {
        if (!active) return;
        toast.error('Impossibile caricare intake documento');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    documentCategory,
    documentClientId,
    documentFileName,
    documentId,
    documentIngestionStatus,
    documentLinkedEntityCount,
    documentTitle,
    open,
  ]);

  const saveReview = () => {
    if (!proposal) return;

    startTransition(async () => {
      const result = await submitDocumentIntakeReview(documentId, {
        action: action === 'apply_to_workspace' && canApplyToWorkspace ? 'apply_to_workspace' : 'save_review',
        category: reviewCategory,
        create_followup_task: createFollowupTask,
        proposal,
        reviewer_notes: reviewerNotes,
      });

      if (!result.success) {
        toast.error(result.error ?? 'Errore salvataggio review');
        return;
      }

      toast.success(
        action === 'apply_to_workspace' && canApplyToWorkspace
          ? 'Dati applicati al workspace cliente'
          : 'Review documento salvata'
      );
      router.refresh();
      setOpen(false);
    });
  };

  const updateContract = (key: string, value: string) => {
    setProposal((prev) => ({
      ...(prev ?? { confidence: 'medium', parser: 'manual', summary: '' }),
      contract: {
        ...(prev?.contract ?? {}),
        [key]: value,
      },
    }));
  };

  const updateDeadline = (key: string, value: string) => {
    setProposal((prev) => ({
      ...(prev ?? { confidence: 'medium', parser: 'manual', summary: '' }),
      deadline: {
        ...(prev?.deadline ?? {}),
        [key]: value,
      },
    }));
  };

  const ensureFirstContact = () => {
    setProposal((prev) => {
      const contacts = prev?.contacts ?? [];
      if (contacts.length > 0) return prev ?? { confidence: 'medium', parser: 'manual', summary: '' };
      return {
        ...(prev ?? { confidence: 'medium', parser: 'manual', summary: '' }),
        contacts: [{ full_name: '', role: '', email: '', phone: '', department: '', is_primary: true }],
      };
    });
  };

  const updateFirstContact = (key: string, value: string) => {
    setProposal((prev) => {
      const contacts = prev?.contacts?.length ? [...prev.contacts] : [{}];
      contacts[0] = {
        ...contacts[0],
        [key]: value,
      };
      return {
        ...(prev ?? { confidence: 'medium', parser: 'manual', summary: '' }),
        contacts,
      };
    });
  };

  const updateManual = (key: string, value: string) => {
    setProposal((prev) => ({
      ...(prev ?? { confidence: 'medium', parser: 'manual', summary: '' }),
      manual: {
        ...(prev?.manual ?? {}),
        [key]: value,
      },
    }));
  };

  const updateServiceLine = (index: number, key: string, value: string) => {
    setProposal((prev) => {
      const currentLines = prev?.service_lines ? [...prev.service_lines] : [];
      const currentLine = currentLines[index] ?? {};
      currentLines[index] = {
        ...currentLine,
        [key]: value,
        is_recurring:
          key === 'frequency_label'
            ? value.trim() !== ''
            : (currentLine.is_recurring ?? Boolean(currentLine.frequency_label)),
      };

      return {
        ...(prev ?? { confidence: 'medium', parser: 'manual', summary: '' }),
        service_lines: currentLines,
      };
    });
  };

  const addEmptyServiceLine = () => {
    setProposal((prev) => ({
      ...(prev ?? { confidence: 'medium', parser: 'manual', summary: '' }),
      service_lines: [
        ...(prev?.service_lines ?? []),
        {
          billing_phase: '',
          code: '',
          frequency_label: '',
          is_recurring: false,
          notes: '',
          quantity: '',
          section: '',
          title: '',
          total_price: '',
          unit: '',
          unit_price: '',
        },
      ],
    }));
  };

  const removeServiceLine = (index: number) => {
    setProposal((prev) => ({
      ...(prev ?? { confidence: 'medium', parser: 'manual', summary: '' }),
      service_lines: (prev?.service_lines ?? []).filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-violet-700">
          <SquarePen className="mr-2 h-3.5 w-3.5" />
          Review
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto pb-8 sm:max-w-3xl lg:max-w-4xl">
        <SheetHeader>
          <SheetTitle>Intake documento</SheetTitle>
          <SheetDescription>
            Valida i dati estratti e, se vuoi, applicali al workspace cliente.
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="py-8 text-sm text-zinc-500">Caricamento proposta...</div>
        ) : proposal ? (
          <div className="space-y-4 py-6">
            <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
              <div className="flex items-center gap-2 font-medium text-zinc-700">
                <Bot className="h-3.5 w-3.5" />
                Parser {proposal.parser}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline">Categoria origine: {document.category ?? 'Other'}</Badge>
                <Badge variant="outline">Categoria corrente: {reviewCategory}</Badge>
                <Badge variant="outline">Intake: {ingestionLabel(latestIngestionStatus)}</Badge>
                <Badge variant="outline">Confidenza: {confidenceLabel(proposal.confidence)}</Badge>
                <Badge variant="outline">Link operativi: {document.linked_entity_count}</Badge>
              </div>
              <p className="mt-2">Documento: {document.title || 'Senza titolo'}</p>
              <p>Contesto: {scopeHint(document)}</p>
            </div>

            {extractedText ? (
              <div className="space-y-2 rounded-md border border-zinc-200 bg-white p-3">
                <Label>Anteprima testo estratto</Label>
                <div className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-md bg-zinc-50 p-3 text-xs text-zinc-600">
                  {extractedText.slice(0, 1600)}
                </div>
              </div>
            ) : null}

            <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700">
              {canApplyToWorkspace
                ? "Puoi correggere la proposta e applicarla al workspace cliente. Nessuna scrittura viene fatta senza questa conferma."
                : "Il documento non è collegato a un cliente. Puoi validare la proposta, ma non applicarla ancora al workspace."}
            </div>

            {hasSavedReviewOnly ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                La review risulta gia salvata, ma il documento non ha ancora creato collegamenti operativi nel
                workspace cliente.
                Se confermi `Applica al workspace cliente`, verranno scritti i record relazionali collegati.
              </div>
            ) : needsWorkspaceApply ? (
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                Questo documento e collegato a un cliente ma non ha ancora generato contratti, contatti, scadenze o
                attivita nel workspace.
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Categoria documento</Label>
              <Select value={reviewCategory} onValueChange={(value) => setReviewCategory(value as ReviewCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    'Contract',
                    'Procedure',
                    'Manual',
                    'Instruction',
                    'Form',
                    'OrgChart',
                    'Certificate',
                    'Authorization',
                    'Registry',
                    'Report',
                    'Other',
                  ].map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Riassunto operativo</Label>
              <Textarea
                value={proposal.summary ?? ''}
                onChange={(event) =>
                  setProposal((prev) => ({
                    ...(prev ?? { confidence: 'medium', parser: 'manual', summary: '' }),
                    summary: event.target.value,
                  }))
                }
                rows={3}
                placeholder="Cosa contiene il documento e cosa bisogna fare"
              />
            </div>

            {proposal.contract || reviewCategory === 'Contract' ? (
              <div className="space-y-3 rounded-md border border-zinc-200 p-3">
                <p className="text-sm font-medium text-zinc-900">Dati contratto</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Tipo contratto</Label>
                    <Input
                      value={proposal.contract?.contract_type ?? ''}
                      onChange={(event) => updateContract('contract_type', event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Frequenza attività</Label>
                    <Input
                      value={proposal.contract?.activity_frequency ?? ''}
                      onChange={(event) => updateContract('activity_frequency', event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Protocollo / codice offerta</Label>
                    <Input
                      value={proposal.contract?.protocol_code ?? ''}
                      onChange={(event) => updateContract('protocol_code', event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Data emissione / offerta</Label>
                    <Input
                      type="date"
                      value={proposal.contract?.issue_date ?? ''}
                      onChange={(event) => updateContract('issue_date', event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Data inizio</Label>
                    <Input
                      type="date"
                      value={proposal.contract?.start_date ?? ''}
                      onChange={(event) => updateContract('start_date', event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Data rinnovo</Label>
                    <Input
                      type="date"
                      value={proposal.contract?.renewal_date ?? ''}
                      onChange={(event) => updateContract('renewal_date', event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Data fine</Label>
                    <Input
                      type="date"
                      value={proposal.contract?.end_date ?? ''}
                      onChange={(event) => updateContract('end_date', event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Durata / termini</Label>
                    <Input
                      value={proposal.contract?.duration_terms ?? ''}
                      onChange={(event) => updateContract('duration_terms', event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Validità offerta / note temporali</Label>
                    <Input
                      value={proposal.contract?.validity_terms ?? ''}
                      onChange={(event) => updateContract('validity_terms', event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Attività esercitata</Label>
                    <Input
                      value={proposal.contract?.exercised_activity ?? ''}
                      onChange={(event) => updateContract('exercised_activity', event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Referenti cliente</Label>
                    <Input
                      value={proposal.contract?.client_references ?? ''}
                      onChange={(event) => updateContract('client_references', event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Owner interno</Label>
                    <Input
                      value={proposal.contract?.internal_owner ?? ''}
                      onChange={(event) => updateContract('internal_owner', event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Supervisore</Label>
                    <Input
                      value={proposal.contract?.supervisor_name ?? ''}
                      onChange={(event) => updateContract('supervisor_name', event.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Scope servizio</Label>
                  <Textarea
                    rows={2}
                    value={proposal.contract?.service_scope ?? ''}
                    onChange={(event) => updateContract('service_scope', event.target.value)}
                  />
                </div>
              </div>
            ) : null}

            {reviewCategory === 'OrgChart' ? (
              <div className="space-y-3 rounded-md border border-zinc-200 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-900">Contatto proposto</p>
                  <Button type="button" size="sm" variant="outline" onClick={ensureFirstContact}>
                    <Link2 className="mr-2 h-3.5 w-3.5" />
                    Aggiungi contatto
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Nome completo</Label>
                    <Input
                      value={proposal.contacts?.[0]?.full_name ?? ''}
                      onChange={(event) => updateFirstContact('full_name', event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Ruolo</Label>
                    <Input
                      value={proposal.contacts?.[0]?.role ?? ''}
                      onChange={(event) => updateFirstContact('role', event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input
                      value={proposal.contacts?.[0]?.email ?? ''}
                      onChange={(event) => updateFirstContact('email', event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Telefono</Label>
                    <Input
                      value={proposal.contacts?.[0]?.phone ?? ''}
                      onChange={(event) => updateFirstContact('phone', event.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {reviewCategory === 'Manual' ||
            reviewCategory === 'Procedure' ||
            reviewCategory === 'Instruction' ||
            reviewCategory === 'Form' ? (
              <div className="space-y-3 rounded-md border border-zinc-200 p-3">
                <p className="text-sm font-medium text-zinc-900">Dati revisione documento</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Revisione</Label>
                    <Input
                      value={proposal.manual?.revision ?? ''}
                      onChange={(event) => updateManual('revision', event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Owner</Label>
                    <Input
                      value={proposal.manual?.owner ?? ''}
                      onChange={(event) => updateManual('owner', event.target.value)}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label>Data review</Label>
                    <Input
                      type="date"
                      value={proposal.manual?.review_date ?? ''}
                      onChange={(event) => updateManual('review_date', event.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {proposal.service_lines?.length ? (
              <div className="space-y-3 rounded-md border border-zinc-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                  <p className="text-sm font-medium text-zinc-900">
                    Attività / righe contrattuali ({proposal.service_lines.length})
                  </p>
                  <p className="text-xs text-zinc-500">
                    Correggi le righe importate dal documento prima di applicarle al workspace cliente.
                  </p>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={addEmptyServiceLine}>
                    Aggiungi riga
                  </Button>
                </div>
                <div className="space-y-3">
                  {proposal.service_lines.map((line, index) => (
                    <div key={`${line.code ?? 'line'}-${index}`} className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                          Riga {index + 1}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-rose-700"
                          onClick={() => removeServiceLine(index)}
                        >
                          Rimuovi
                        </Button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label>Attività</Label>
                          <Input
                            value={line.title ?? ''}
                            onChange={(event) => updateServiceLine(index, 'title', event.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Codice</Label>
                          <Input
                            value={line.code ?? ''}
                            onChange={(event) => updateServiceLine(index, 'code', event.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Sezione</Label>
                          <Input
                            value={line.section ?? ''}
                            onChange={(event) => updateServiceLine(index, 'section', event.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Fase fatturazione</Label>
                          <Input
                            value={line.billing_phase ?? ''}
                            onChange={(event) => updateServiceLine(index, 'billing_phase', event.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Frequenza</Label>
                          <Input
                            value={line.frequency_label ?? ''}
                            onChange={(event) => updateServiceLine(index, 'frequency_label', event.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Quantità</Label>
                          <Input
                            value={line.quantity ?? ''}
                            onChange={(event) => updateServiceLine(index, 'quantity', event.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Unità</Label>
                          <Input
                            value={line.unit ?? ''}
                            onChange={(event) => updateServiceLine(index, 'unit', event.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Prezzo unitario</Label>
                          <Input
                            value={line.unit_price ?? ''}
                            onChange={(event) => updateServiceLine(index, 'unit_price', event.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Totale</Label>
                          <Input
                            value={line.total_price ?? ''}
                            onChange={(event) => updateServiceLine(index, 'total_price', event.target.value)}
                          />
                        </div>
                      </div>
                      <div className="mt-3 space-y-1">
                        <Label>Note</Label>
                        <Textarea
                          rows={2}
                          value={line.notes ?? ''}
                          onChange={(event) => updateServiceLine(index, 'notes', event.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {!proposal.service_lines?.length ? (
              <div className="rounded-md border border-dashed border-zinc-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">Attività / righe contrattuali</p>
                    <p className="text-xs text-zinc-500">
                      Nessuna riga rilevata. Puoi inserirle manualmente da qui.
                    </p>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={addEmptyServiceLine}>
                    Aggiungi riga
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="space-y-3 rounded-md border border-zinc-200 p-3">
              <p className="text-sm font-medium text-zinc-900">Scadenza / follow-up</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1 md:col-span-2">
                  <Label>Titolo scadenza</Label>
                  <Input
                    value={proposal.deadline?.title ?? ''}
                    onChange={(event) => updateDeadline('title', event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Data scadenza</Label>
                  <Input
                    type="date"
                    value={proposal.deadline?.due_date ?? ''}
                    onChange={(event) => updateDeadline('due_date', event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Priorità</Label>
                  <Select
                    value={proposal.deadline?.priority ?? 'medium'}
                    onValueChange={(value) => updateDeadline('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Bassa</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Critica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Textarea
                rows={2}
                value={proposal.deadline?.description ?? ''}
                onChange={(event) => updateDeadline('description', event.target.value)}
                placeholder="Note operative sulla scadenza"
              />
            </div>

            <div className="space-y-2">
              <Label>Note revisore</Label>
              <Textarea
                value={reviewerNotes}
                onChange={(event) => setReviewerNotes(event.target.value)}
                rows={3}
                placeholder="Correzioni o motivazioni della review"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Azione finale</Label>
                <Select value={action} onValueChange={(value) => setAction(value as ReviewAction)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="save_review">Salva review</SelectItem>
                    <SelectItem value="apply_to_workspace" disabled={!canApplyToWorkspace}>
                      Applica al workspace cliente
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className="mt-6 flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={createFollowupTask}
                  onChange={(event) => setCreateFollowupTask(event.target.checked)}
                />
                Crea task follow-up
              </label>
            </div>

            {!canApplyToWorkspace ? (
              <p className="text-xs text-amber-700">
                Questo documento non è collegato a un cliente: puoi solo salvare la review.
              </p>
            ) : action === 'save_review' && needsWorkspaceApply ? (
              <p className="text-xs text-amber-700">
                Con `Salva review` confermi solo il payload estratto. I record del workspace cliente non verranno ancora creati o aggiornati.
              </p>
            ) : null}

            <Button type="button" className="w-full" disabled={pending} onClick={saveReview}>
              {pending
                ? 'Salvataggio in corso...'
                : action === 'apply_to_workspace' && canApplyToWorkspace
                ? 'Salva e applica al workspace'
                : 'Salva review'}
            </Button>
          </div>
        ) : (
          <div className="py-8 text-sm text-zinc-500">Nessuna proposta disponibile.</div>
        )}
      </SheetContent>
    </Sheet>
  );
}
