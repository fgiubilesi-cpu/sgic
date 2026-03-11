'use client';

import { useTransition } from 'react';
import { Archive, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { setPersonnelActiveState } from '@/features/personnel/actions/personnel-actions';

interface PersonnelStateToggleButtonProps {
  isActive: boolean;
  personnelId: string;
}

export function PersonnelStateToggleButton({
  isActive,
  personnelId,
}: PersonnelStateToggleButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await setPersonnelActiveState(personnelId, !isActive);

      if (!result.success) {
        toast.error(result.error ?? 'Impossibile aggiornare lo stato del collaboratore.');
        return;
      }

      toast.success(isActive ? 'Collaboratore archiviato' : 'Collaboratore riattivato');
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
