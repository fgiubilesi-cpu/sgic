'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cloneTemplateForClient } from '@/features/audits/actions';
import { createClient } from '@/lib/supabase/client';

type Client = {
  id: string;
  name: string;
};

type CloneTemplateSheetProps = {
  templateId: string;
};

export function CloneTemplateSheet({ templateId }: CloneTemplateSheetProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!open) return;

    async function fetchClients() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, name')
          .is('deleted_at', null)
          .order('name');

        if (data) setClients(data);
        if (error) toast.error('Failed to load clients.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchClients();
  }, [open, supabase]);

  async function handleClone() {
    if (!selectedClientId) {
      toast.error('Please select a client.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await cloneTemplateForClient({
        templateId,
        clientId: selectedClientId,
      });

      if (result.success) {
        toast.success('Template cloned successfully.');
        setOpen(false);
        setSelectedClientId('');
        router.push(`/templates/${result.templateId}`);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Clone error:', error);
      toast.error('Failed to clone template.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2" size="sm">
          <Copy className="h-4 w-4" /> Clone for Client
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-[450px] pointer-events-auto">
        <SheetHeader className="text-left border-b pb-4">
          <SheetTitle className="text-xl">Clone Template for Client</SheetTitle>
          <SheetDescription>
            Create a client-specific version of this template. You can modify it independently.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Client</label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger className="w-full bg-white border-zinc-200">
                <SelectValue placeholder={isLoading ? 'Loading...' : 'Select a client...'} />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[100]">
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
                {clients.length === 0 && !isLoading && (
                  <div className="px-2 py-4 text-sm text-center text-zinc-400">
                    No clients found. Create one first.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleClone}
            disabled={isLoading || !selectedClientId}
            className="w-full h-11 bg-zinc-900"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Clone Template'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
