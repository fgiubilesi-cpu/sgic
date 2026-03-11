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
import { LocationForm } from './location-form';
import type { Database } from '@/types/database.types';

type LocationRow = Database['public']['Tables']['locations']['Row'];

interface ManageLocationSheetProps {
  clientId: string;
  location?: LocationRow;
}

export function ManageLocationSheet({ clientId, location }: ManageLocationSheetProps) {
  const [open, setOpen] = useState(false);
  const isEditing = Boolean(location);

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
            Nuova Sede
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Modifica Sede' : 'Nuova Sede'}</SheetTitle>
          <SheetDescription>
            Inserisci o aggiorna i dati operativi della sede cliente.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6">
          <LocationForm
            clientId={clientId}
            location={location}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
