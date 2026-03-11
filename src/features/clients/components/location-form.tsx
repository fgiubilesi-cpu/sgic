'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { locationSchema, type LocationFormInput } from '../schemas/client-schema';
import { createLocation, updateLocation } from '../actions/client-actions';
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

type LocationRow = Database['public']['Tables']['locations']['Row'];

interface LocationFormProps {
  clientId: string;
  location?: LocationRow;
  onSuccess?: (data: LocationRow) => void;
}

export function LocationForm({ clientId, location, onSuccess }: LocationFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<LocationFormInput>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: location?.name || '',
      address: location?.address || '',
      city: location?.city || '',
      type: location?.type || '',
      notes: location?.notes || '',
      is_active: location?.is_active ?? true,
    },
  });

  async function onSubmit(values: LocationFormInput) {
    setLoading(true);
    try {
      const result = location
        ? await updateLocation(location.id, values)
        : await createLocation(clientId, values);

      if (result.success) {
        toast.success(location ? 'Sede aggiornata' : 'Sede creata');
        form.reset();
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
              <FormLabel>Nome Sede *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Es. Sede principale" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Indirizzo</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="Es. Via Roma 1"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Città</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="Es. Milano"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="Es. Ristorante, Magazzino..."
                />
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
                  placeholder="Note interne sulla sede..."
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Salvataggio...' : location ? 'Aggiorna' : 'Crea Sede'}
        </Button>
      </form>
    </Form>
  );
}
