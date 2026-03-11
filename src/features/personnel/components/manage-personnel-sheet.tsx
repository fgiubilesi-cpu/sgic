'use client';

import { useState } from 'react';
import { Plus, SquarePen } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { PersonnelForm } from './personnel-form';
import type { Tables } from '@/types/database.types';
import type { ClientOption } from '@/features/clients/queries/get-client-options';

type PersonnelRow = Tables<'personnel'>;

interface ManagePersonnelSheetProps {
  clientOptions: ClientOption[];
  defaultClientId?: string;
  personnel?: PersonnelRow;
}

export function ManagePersonnelSheet({
  clientOptions,
  defaultClientId,
  personnel,
}: ManagePersonnelSheetProps) {
  const [open, setOpen] = useState(false);
  const isEditing = Boolean(personnel);

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
            Nuovo Collaboratore
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {isEditing ? 'Modifica Collaboratore' : 'Nuovo Collaboratore'}
          </SheetTitle>
          <SheetDescription>
            Gestisci i riferimenti operativi del collaboratore collegato al cliente.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6">
          <PersonnelForm
            clientOptions={clientOptions}
            defaultClientId={defaultClientId}
            personnel={personnel}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
