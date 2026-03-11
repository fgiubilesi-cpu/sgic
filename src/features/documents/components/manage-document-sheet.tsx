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
import type { Tables } from '@/types/database.types';
import type { ClientOption } from '@/features/clients/queries/get-client-options';
import type { PersonnelListItem } from '@/features/personnel/queries/get-personnel';
import { DocumentForm } from './document-form';

type DocumentRow = Tables<'documents'>;

interface ManageDocumentSheetProps {
  clientOptions: ClientOption[];
  defaultClientId?: string;
  defaultLocationId?: string;
  defaultPersonnelId?: string;
  document?: DocumentRow;
  personnelOptions: PersonnelListItem[];
  triggerLabel?: string;
}

export function ManageDocumentSheet({
  clientOptions,
  defaultClientId,
  defaultLocationId,
  defaultPersonnelId,
  document,
  personnelOptions,
  triggerLabel,
}: ManageDocumentSheetProps) {
  const [open, setOpen] = useState(false);
  const isEditing = Boolean(document);

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
            {triggerLabel ?? 'Nuovo Documento'}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Modifica Documento' : 'Nuovo Documento'}</SheetTitle>
          <SheetDescription>
            Collega il documento a cliente, sede o collaboratore e gestiscine le scadenze.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6">
          <DocumentForm
            clientOptions={clientOptions}
            defaultClientId={defaultClientId}
            defaultLocationId={defaultLocationId}
            defaultPersonnelId={defaultPersonnelId}
            document={document}
            onSuccess={() => setOpen(false)}
            personnelOptions={personnelOptions}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
