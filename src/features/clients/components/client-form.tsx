'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { clientSchema, type ClientForm } from '../schemas/client-schema';
import { createClient, updateClient } from '../actions/client-actions';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Database } from '@/types/database.types';

type ClientRow = Database['public']['Tables']['clients']['Row'];

interface ClientFormProps {
  client?: ClientRow;
  onSuccess?: (data: ClientRow) => void;
}

export function ClientForm({ client, onSuccess }: ClientFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name || '',
      vat_number: client?.vat_number || '',
      email: client?.email || '',
      phone: client?.phone || '',
      notes: client?.notes || '',
      is_active: client?.is_active ?? true,
    },
  });

  async function onSubmit(values: ClientForm) {
    setLoading(true);
    try {
      const result = client
        ? await updateClient(client.id, values)
        : await createClient(values);

      if (result.success) {
        toast.success(client ? 'Cliente aggiornato' : 'Cliente creato');
        onSuccess?.(result.data);
      } else {
        toast.error(result.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Cliente *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Es. Ristorante Rossi" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vat_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Partita IVA</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} placeholder="Es. IT12345678901" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  value={field.value || ''}
                  placeholder="Es. info@ristorante.it"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefono</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} placeholder="Es. +39 02 1234 5678" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ''}
                  placeholder="Note interne sul cliente..."
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Salvataggio...' : client ? 'Aggiorna' : 'Crea Cliente'}
        </Button>
      </form>
    </Form>
  );
}
