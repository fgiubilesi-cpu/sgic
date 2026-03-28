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
  createClientNote,
  deleteClientNote,
  updateClientNote,
} from '@/features/clients/actions/client-workspace-actions';
import {
  buildNoteForm,
  normalizeSelectValue,
  type LocationOption,
} from '@/features/clients/lib/client-workspace-controls';
import type { ClientNoteRecord } from '@/features/clients/queries/get-client-workspace';

interface ManageNoteSheetProps {
  clientId: string;
  locations: LocationOption[];
  note?: ClientNoteRecord;
}

export function ManageNoteSheet({ clientId, locations, note }: ManageNoteSheetProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isEditing = Boolean(note);
  const [form, setForm] = useState(() => buildNoteForm(note));

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
