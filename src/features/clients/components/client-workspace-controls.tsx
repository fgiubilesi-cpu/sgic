'use client';

import { useMemo, useState, useTransition } from 'react';
import { Plus, SquarePen, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  createClientContact,
  createClientDeadline,
  createClientNote,
  createClientTask,
  deleteClientContact,
  deleteClientDeadline,
  deleteClientNote,
  setClientNotePinned,
  setClientTaskStatus,
  updateClientContact,
  updateClientDeadline,
  updateClientNote,
  updateClientTask,
} from '@/features/clients/actions/client-workspace-actions';
import type {
  ClientContactRecord,
  ClientManualDeadlineRecord,
  ClientNoteRecord,
  ClientTaskPriority,
  ClientTaskRecord,
  ClientTaskStatus,
} from '@/features/clients/queries/get-client-workspace';

interface LocationOption {
  id: string;
  name: string;
}

interface AuditOption {
  id: string;
  title: string | null;
}

interface ManageTaskSheetProps {
  audits: AuditOption[];
  clientId: string;
  locations: LocationOption[];
  task?: ClientTaskRecord;
}

function normalizeSelectValue(value: string) {
  return value === 'none' ? '' : value;
}

export function ManageTaskSheet({ audits, clientId, locations, task }: ManageTaskSheetProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isEditing = Boolean(task);
  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? ('open' as ClientTaskStatus),
    priority: task?.priority ?? 'medium',
    due_date: task?.due_date ?? '',
    owner_name: task?.owner_name ?? '',
    location_id: task?.location_id ?? '',
    audit_id: task?.audit_id ?? '',
    is_recurring: task?.is_recurring ?? false,
    recurrence_label: task?.recurrence_label ?? '',
  });

  const submit = () => {
    startTransition(async () => {
      const result = task
        ? await updateClientTask(task.id, clientId, form)
        : await createClientTask(clientId, form);
      if (!result.success) {
        toast.error(result.error ?? 'Impossibile salvare attività');
        return;
      }
      toast.success(isEditing ? 'Attività aggiornata' : 'Attività creata');
      setOpen(false);
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600">
            <SquarePen className="mr-2 h-3.5 w-3.5" />
            Modifica
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuova attività
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Modifica attività' : 'Nuova attività'}</SheetTitle>
          <SheetDescription>
            Crea o aggiorna una task operativa collegata al cliente.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-6">
          <div className="space-y-2">
            <Label>Titolo</Label>
            <Input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Es. Aggiornare manuale HACCP"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Stato</Label>
              <select
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                value={form.status}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, status: event.target.value as ClientTaskStatus }))
                }
              >
                <option value="open">Aperta</option>
                <option value="in_progress">In lavorazione</option>
                <option value="blocked">Bloccata</option>
                <option value="done">Completata</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Priorità</Label>
              <select
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                value={form.priority}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    priority: event.target.value as ClientTaskPriority,
                  }))
                }
              >
                <option value="low">Bassa</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Critica</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Scadenza</Label>
              <Input
                type="date"
                value={form.due_date ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, due_date: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Assegnatario</Label>
              <Input
                value={form.owner_name ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, owner_name: event.target.value }))}
                placeholder="Es. Mario Rossi"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Sede</Label>
              <select
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                value={form.location_id || 'none'}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    location_id: normalizeSelectValue(event.target.value),
                  }))
                }
              >
                <option value="none">Nessuna sede</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Audit collegato</Label>
              <select
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                value={form.audit_id || 'none'}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    audit_id: normalizeSelectValue(event.target.value),
                  }))
                }
              >
                <option value="none">Nessun audit</option>
                {audits.map((audit) => (
                  <option key={audit.id} value={audit.id}>
                    {audit.title || 'Audit senza titolo'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrizione</Label>
            <Textarea
              rows={3}
              value={form.description ?? ''}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Contesto operativo e aspettative di chiusura"
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2">
            <div>
              <p className="text-sm font-medium text-zinc-900">Task ricorrente</p>
              <p className="text-xs text-zinc-500">Abilita se va ripianificata periodicamente</p>
            </div>
            <input
              type="checkbox"
              checked={form.is_recurring}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, is_recurring: event.target.checked }))
              }
            />
          </div>

          {form.is_recurring ? (
            <div className="space-y-2">
              <Label>Ricorrenza</Label>
              <Input
                value={form.recurrence_label ?? ''}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, recurrence_label: event.target.value }))
                }
                placeholder="Es. Ogni 30 giorni"
              />
            </div>
          ) : null}

          <Button
            type="button"
            onClick={submit}
            disabled={pending || form.title.trim() === ''}
            className="w-full"
          >
            {pending ? 'Salvataggio...' : isEditing ? 'Aggiorna attività' : 'Crea attività'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface ManageContactSheetProps {
  clientId: string;
  contact?: ClientContactRecord;
  locations: LocationOption[];
}

export function ManageContactSheet({ clientId, contact, locations }: ManageContactSheetProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isEditing = Boolean(contact);
  const [form, setForm] = useState({
    full_name: contact?.full_name ?? '',
    role: contact?.role ?? '',
    department: contact?.department ?? '',
    email: contact?.email ?? '',
    phone: contact?.phone ?? '',
    location_id: contact?.location_id ?? '',
    is_primary: contact?.is_primary ?? false,
    is_active: contact?.is_active ?? true,
    notes: contact?.notes ?? '',
  });

  const submit = () => {
    startTransition(async () => {
      const result = contact
        ? await updateClientContact(contact.id, clientId, form)
        : await createClientContact(clientId, form);
      if (!result.success) {
        toast.error(result.error ?? 'Impossibile salvare contatto');
        return;
      }
      toast.success(isEditing ? 'Contatto aggiornato' : 'Contatto creato');
      setOpen(false);
    });
  };

  const remove = () => {
    if (!contact) return;
    startTransition(async () => {
      const result = await deleteClientContact(contact.id, clientId);
      if (!result.success) {
        toast.error(result.error ?? 'Impossibile eliminare contatto');
        return;
      }
      toast.success('Contatto eliminato');
      setOpen(false);
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600">
            <SquarePen className="mr-2 h-3.5 w-3.5" />
            Modifica
          </Button>
        ) : (
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Nuovo contatto
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Modifica contatto' : 'Nuovo contatto cliente'}</SheetTitle>
          <SheetDescription>
            Gestisci referenti, ruolo, area e sede di riferimento.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-6">
          <div className="space-y-2">
            <Label>Nome e cognome</Label>
            <Input
              value={form.full_name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, full_name: event.target.value }))
              }
              placeholder="Es. Luca Bianchi"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Ruolo</Label>
              <Input
                value={form.role ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
                placeholder="Es. Responsabile qualità"
              />
            </div>
            <div className="space-y-2">
              <Label>Area</Label>
              <Input
                value={form.department ?? ''}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, department: event.target.value }))
                }
                placeholder="Es. Produzione"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={form.email ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="nome@cliente.it"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefono</Label>
              <Input
                value={form.phone ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="+39 ..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sede</Label>
            <select
              className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
              value={form.location_id || 'none'}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  location_id: normalizeSelectValue(event.target.value),
                }))
              }
            >
              <option value="none">Nessuna sede specifica</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-sm">
              <span>Contatto principale</span>
              <input
                type="checkbox"
                checked={form.is_primary}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, is_primary: event.target.checked }))
                }
              />
            </label>
            <label className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-sm">
              <span>Contatto attivo</span>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, is_active: event.target.checked }))
                }
              />
            </label>
          </div>

          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea
              rows={3}
              value={form.notes ?? ''}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="Informazioni relazionali o operative"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={submit}
              disabled={pending || form.full_name.trim() === ''}
              className="flex-1"
            >
              {pending ? 'Salvataggio...' : isEditing ? 'Aggiorna contatto' : 'Crea contatto'}
            </Button>
            {isEditing ? (
              <Button type="button" variant="outline" onClick={remove} disabled={pending}>
                <Trash2 className="mr-2 h-4 w-4" />
                Elimina
              </Button>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface ManageDeadlineSheetProps {
  clientId: string;
  deadline?: ClientManualDeadlineRecord;
  locations: LocationOption[];
}

export function ManageDeadlineSheet({ clientId, deadline, locations }: ManageDeadlineSheetProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isEditing = Boolean(deadline);
  const [form, setForm] = useState({
    title: deadline?.title ?? '',
    description: deadline?.description ?? '',
    due_date: deadline?.due_date ?? '',
    priority: deadline?.priority ?? 'medium',
    status: deadline?.status ?? 'open',
    location_id: deadline?.location_id ?? '',
  });

  const submit = () => {
    startTransition(async () => {
      const result = deadline
        ? await updateClientDeadline(deadline.id, clientId, form)
        : await createClientDeadline(clientId, form);
      if (!result.success) {
        toast.error(result.error ?? 'Impossibile salvare scadenza');
        return;
      }
      toast.success(isEditing ? 'Scadenza aggiornata' : 'Scadenza creata');
      setOpen(false);
    });
  };

  const remove = () => {
    if (!deadline) return;
    startTransition(async () => {
      const result = await deleteClientDeadline(deadline.id, clientId);
      if (!result.success) {
        toast.error(result.error ?? 'Impossibile eliminare scadenza');
        return;
      }
      toast.success('Scadenza eliminata');
      setOpen(false);
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600">
            <SquarePen className="mr-2 h-3.5 w-3.5" />
            Modifica
          </Button>
        ) : (
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Nuova scadenza manuale
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Modifica scadenza' : 'Nuova scadenza manuale'}</SheetTitle>
          <SheetDescription>
            Inserisci scadenze contrattuali o operative non coperte da audit/documenti/task.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-6">
          <div className="space-y-2">
            <Label>Titolo</Label>
            <Input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Es. Rinnovo autorizzazione sanitaria"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Data scadenza</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, due_date: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Sede</Label>
              <select
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                value={form.location_id || 'none'}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    location_id: normalizeSelectValue(event.target.value),
                  }))
                }
              >
                <option value="none">Nessuna sede</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Priorità</Label>
              <select
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                value={form.priority}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    priority: event.target.value as ClientTaskPriority,
                  }))
                }
              >
                <option value="low">Bassa</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Critica</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Stato</Label>
              <select
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                value={form.status}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    status: event.target.value as ClientManualDeadlineRecord['status'],
                  }))
                }
              >
                <option value="open">Aperta</option>
                <option value="completed">Completata</option>
                <option value="cancelled">Annullata</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrizione</Label>
            <Textarea
              rows={3}
              value={form.description ?? ''}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Dettaglio operativo e responsabilità"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={submit}
              disabled={pending || form.title.trim() === '' || form.due_date.trim() === ''}
              className="flex-1"
            >
              {pending ? 'Salvataggio...' : isEditing ? 'Aggiorna scadenza' : 'Crea scadenza'}
            </Button>
            {isEditing ? (
              <Button type="button" variant="outline" onClick={remove} disabled={pending}>
                <Trash2 className="mr-2 h-4 w-4" />
                Elimina
              </Button>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface ManageNoteSheetProps {
  clientId: string;
  locations: LocationOption[];
  note?: ClientNoteRecord;
}

export function ManageNoteSheet({ clientId, locations, note }: ManageNoteSheetProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isEditing = Boolean(note);
  const [form, setForm] = useState({
    title: note?.title ?? '',
    body: note?.body ?? '',
    note_type: note?.note_type ?? 'operational',
    pinned: note?.pinned ?? false,
    location_id: note?.location_id ?? '',
  });

  const submit = () => {
    startTransition(async () => {
      const result = note
        ? await updateClientNote(note.id, clientId, form)
        : await createClientNote(clientId, form);
      if (!result.success) {
        toast.error(result.error ?? 'Impossibile salvare nota');
        return;
      }
      toast.success(isEditing ? 'Nota aggiornata' : 'Nota creata');
      setOpen(false);
    });
  };

  const remove = () => {
    if (!note) return;
    startTransition(async () => {
      const result = await deleteClientNote(note.id, clientId);
      if (!result.success) {
        toast.error(result.error ?? 'Impossibile eliminare nota');
        return;
      }
      toast.success('Nota eliminata');
      setOpen(false);
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600">
            <SquarePen className="mr-2 h-3.5 w-3.5" />
            Modifica
          </Button>
        ) : (
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Nuova nota
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Modifica nota' : 'Nuova nota interna'}</SheetTitle>
          <SheetDescription>
            Memoria operativa interna: warning, decisioni e appunti contestuali.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-6">
          <div className="space-y-2">
            <Label>Titolo</Label>
            <Input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Es. Decisione su audit straordinario"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo nota</Label>
              <select
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                value={form.note_type}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    note_type: event.target.value as ClientNoteRecord['note_type'],
                  }))
                }
              >
                <option value="operational">Operativa</option>
                <option value="warning">Warning</option>
                <option value="decision">Decisione</option>
                <option value="info">Informativa</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Sede</Label>
              <select
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                value={form.location_id || 'none'}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    location_id: normalizeSelectValue(event.target.value),
                  }))
                }
              >
                <option value="none">Nessuna sede</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-sm">
            <span>Nota in evidenza</span>
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(event) => setForm((prev) => ({ ...prev, pinned: event.target.checked }))}
            />
          </label>

          <div className="space-y-2">
            <Label>Contenuto</Label>
            <Textarea
              rows={5}
              value={form.body}
              onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
              placeholder="Scrivi il contesto, la decisione e i prossimi passi..."
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={submit}
              disabled={pending || form.title.trim() === '' || form.body.trim() === ''}
              className="flex-1"
            >
              {pending ? 'Salvataggio...' : isEditing ? 'Aggiorna nota' : 'Crea nota'}
            </Button>
            {isEditing ? (
              <Button type="button" variant="outline" onClick={remove} disabled={pending}>
                <Trash2 className="mr-2 h-4 w-4" />
                Elimina
              </Button>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function TaskStatusQuickAction({
  clientId,
  status,
  taskId,
}: {
  clientId: string;
  status: ClientTaskStatus;
  taskId: string;
}) {
  const [pending, startTransition] = useTransition();

  const nextStatus = useMemo(() => {
    if (status === 'open') return 'in_progress';
    if (status === 'in_progress') return 'done';
    if (status === 'blocked') return 'in_progress';
    return 'open';
  }, [status]);

  const label = useMemo(() => {
    if (status === 'open') return 'Avvia';
    if (status === 'in_progress') return 'Chiudi';
    if (status === 'blocked') return 'Sblocca';
    return 'Riapri';
  }, [status]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() =>
        startTransition(async () => {
          const result = await setClientTaskStatus(taskId, clientId, nextStatus);
          if (!result.success) {
            toast.error(result.error ?? 'Impossibile aggiornare stato attività');
            return;
          }
          toast.success('Stato attività aggiornato');
        })
      }
      disabled={pending}
    >
      {label}
    </Button>
  );
}

export function NotePinAction({
  clientId,
  note,
}: {
  clientId: string;
  note: Pick<ClientNoteRecord, 'id' | 'pinned'>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await setClientNotePinned(note.id, clientId, !note.pinned);
          if (!result.success) {
            toast.error(result.error ?? 'Impossibile aggiornare evidenza nota');
            return;
          }
          toast.success(note.pinned ? 'Nota rimossa dai pin' : 'Nota fissata in alto');
        })
      }
    >
      {note.pinned ? 'Rimuovi pin' : 'Fissa'}
    </Button>
  );
}
