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
  createClientContact,
  deleteClientContact,
  updateClientContact,
} from '@/features/clients/actions/client-workspace-actions';
import {
  buildContactForm,
  normalizeSelectValue,
  type LocationOption,
} from '@/features/clients/lib/client-workspace-controls';
import type { ClientContactRecord } from '@/features/clients/queries/get-client-workspace';

interface ManageContactSheetProps {
  clientId: string;
  contact?: ClientContactRecord;
  locations: LocationOption[];
}

export function ManageContactSheet({
  clientId,
  contact,
  locations,
}: ManageContactSheetProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isEditing = Boolean(contact);
  const [form, setForm] = useState(() => buildContactForm(contact));

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
              onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
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
