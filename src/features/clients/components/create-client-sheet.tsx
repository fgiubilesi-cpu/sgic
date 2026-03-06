'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ClientForm } from './client-form';
import { Database } from '@/types/database.types';

type ClientRow = Database['public']['Tables']['clients']['Row'];

interface CreateClientSheetProps {
  onClientCreated?: (client: ClientRow) => void;
}

export function CreateClientSheet({ onClientCreated }: CreateClientSheetProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = (client: ClientRow) => {
    setOpen(false);
    onClientCreated?.(client);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>Nuovo Cliente</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Crea Nuovo Cliente</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <ClientForm onSuccess={handleSuccess} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
