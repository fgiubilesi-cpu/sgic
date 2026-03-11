'use client';

import { useTransition } from 'react';
import { Archive, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { setLocationActiveState } from '@/features/clients/actions/client-actions';

interface LocationStateToggleButtonProps {
  isActive: boolean;
  locationId: string;
}

export function LocationStateToggleButton({
  isActive,
  locationId,
}: LocationStateToggleButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await setLocationActiveState(locationId, !isActive);

      if (!result.success) {
        toast.error(result.error ?? 'Impossibile aggiornare lo stato della sede.');
        return;
      }

      toast.success(
        isActive ? 'Sede archiviata' : 'Sede riattivata',
        {
          description: isActive
            ? 'La sede resta nello storico cliente ma non viene piu considerata attiva.'
            : 'La sede e tornata disponibile per audit e collaboratori.',
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
