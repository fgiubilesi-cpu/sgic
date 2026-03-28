'use client';

import { useState, useTransition } from 'react';
import { Plus, SquarePen } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import {
  createClientTask,
  updateClientTask,
} from '@/features/clients/actions/client-workspace-actions';
import {
  buildTaskForm,
  getServiceLineOptionLabel,
  normalizeSelectValue,
  type LocationOption,
  type ServiceLineOption,
} from '@/features/clients/lib/client-workspace-controls';
import type {
  ClientTaskPriority,
  ClientTaskRecord,
  ClientTaskStatus,
} from '@/features/clients/queries/get-client-workspace';

interface AuditOption {
  id: string;
  title: string | null;
}

interface ManageTaskSheetProps {
  audits: AuditOption[];
  clientId: string;
  locations: LocationOption[];
  serviceLines: ServiceLineOption[];
  task?: ClientTaskRecord;
}

export function ManageTaskSheet({
  audits,
  clientId,
  locations,
  serviceLines,
  task,
}: ManageTaskSheetProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isEditing = Boolean(task);
  const [form, setForm] = useState(() => buildTaskForm(task));

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
            <Label>Linea servizio</Label>
            <select
              className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
              value={form.service_line_id || 'none'}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  service_line_id: normalizeSelectValue(event.target.value),
                }))
              }
            >
              <option value="none">Nessuna linea servizio</option>
              {serviceLines.map((serviceLine) => (
                <option key={serviceLine.id} value={serviceLine.id}>
                  {getServiceLineOptionLabel(serviceLine, locations)}
                </option>
              ))}
            </select>
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
