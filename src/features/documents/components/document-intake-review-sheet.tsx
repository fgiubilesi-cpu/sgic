'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
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

export function DocumentIntakeReviewSheet({ document }: DocumentIntakeReviewSheetProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [proposal, setProposal] = useState<DocumentIntakeProposal | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [action, setAction] = useState<ReviewAction>('save_review');
  const [createFollowupTask, setCreateFollowupTask] = useState(false);

  const canApplyToWorkspace = Boolean(document.client_id);

  useEffect(() => {
    if (!open) return;
    let active = true;

    setLoading(true);
    getDocumentIntakeData(document.id)
      .then((result) => {
        if (!active) return;
        if (!result.success) {
          toast.error(result.error ?? 'Impossibile caricare intake');
          return;
        }
        setProposal(result.data.proposal);
        setReviewerNotes(result.data.reviewerNotes ?? '');
        setAction((result.data.action as ReviewAction) ?? 'save_review');
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
  }, [document.id, open]);

  const category = useMemo(() => document.category ?? 'Other', [document.category]);

  const saveReview = () => {
    if (!proposal) return;

    startTransition(async () => {
      const result = await submitDocumentIntakeReview(document.id, {
        action: action === 'apply_to_workspace' && canApplyToWorkspace ? 'apply_to_workspace' : 'save_review',
        category,
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-violet-700">
          <SquarePen className="mr-2 h-3.5 w-3.5" />
          Review
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-2xl">
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
                <Badge variant="outline">Categoria: {category}</Badge>
                <Badge variant="outline">Intake: {ingestionLabel(document.ingestion_status)}</Badge>
                <Badge variant="outline">Confidenza: {confidenceLabel(proposal.confidence)}</Badge>
              </div>
              <p className="mt-2">Documento: {document.title || 'Senza titolo'}</p>
              <p>Contesto: {scopeHint(document)}</p>
            </div>

            <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700">
              {canApplyToWorkspace
                ? "Puoi correggere la proposta e applicarla al workspace cliente. Nessuna scrittura viene fatta senza questa conferma."
                : "Il documento non è collegato a un cliente. Puoi validare la proposta, ma non applicarla ancora al workspace."}
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

            {category === 'Contract' ? (
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
                    <Label>Owner interno</Label>
                    <Input
                      value={proposal.contract?.internal_owner ?? ''}
                      onChange={(event) => updateContract('internal_owner', event.target.value)}
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

            {category === 'OrgChart' ? (
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

            {category === 'Manual' ||
            category === 'Procedure' ||
            category === 'Instruction' ||
            category === 'Form' ? (
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
