'use client';

import { useState, useTransition } from 'react';
import { Plus, SquarePen, Trash2 } from 'lucide-react';
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
  createClientDeadline,
  deleteClientDeadline,
  updateClientDeadline,
} from '@/features/clients/actions/client-workspace-actions';
import {
  buildDeadlineForm,
  getServiceLineOptionLabel,
  normalizeSelectValue,
  type LocationOption,
  type ServiceLineOption,
} from '@/features/clients/lib/client-workspace-controls';
import type {
  ClientManualDeadlineRecord,
  ClientTaskPriority,
} from '@/features/clients/queries/get-client-workspace';

interface ManageDeadlineSheetProps {
  clientId: string;
  deadline?: ClientManualDeadlineRecord;
  locations: LocationOption[];
  serviceLines: ServiceLineOption[];
}

export function ManageDeadlineSheet({
  clientId,
  deadline,
  locations,
  serviceLines,
}: ManageDeadlineSheetProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isEditing = Boolean(deadline);
  const [form, setForm] = useState(() => buildDeadlineForm(deadline));

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
