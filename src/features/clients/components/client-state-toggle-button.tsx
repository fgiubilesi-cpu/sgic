'use client';

import { useTransition } from 'react';
import { Archive, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { setClientActiveState } from '@/features/clients/actions/client-actions';

interface ClientStateToggleButtonProps {
  clientId: string;
  isActive: boolean;
}

export function ClientStateToggleButton({
  clientId,
  isActive,
}: ClientStateToggleButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await setClientActiveState(clientId, !isActive);

      if (!result.success) {
        toast.error(result.error ?? 'Impossibile aggiornare lo stato del cliente.');
        return;
      }

      toast.success(
        isActive ? 'Cliente archiviato' : 'Cliente riattivato',
        {
          description: isActive
            ? 'Il cliente resta visibile ma non viene piu considerato attivo.'
            : 'Il cliente e tornato operativo.',
        }
      );
    });
  };

  const Icon = isActive ? Archive : RotateCcw;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 px-2 text-zinc-600"
      disabled={isPending}
      onClick={handleClick}
    >
      <Icon className="mr-2 h-3.5 w-3.5" />
      {isPending ? 'Aggiorno...' : isActive ? 'Archivia' : 'Riattiva'}
    </Button>
  );
}
