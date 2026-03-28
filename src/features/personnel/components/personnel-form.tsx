'use client';

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  personnelSchema,
  type PersonnelFormInput,
} from '../schemas/personnel-schema';
import { createPersonnel, updatePersonnel } from '../actions/personnel-actions';
import type { Tables } from '@/types/database.types';
import type { ClientOption } from '@/features/clients/queries/get-client-options';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type PersonnelRow = Tables<'personnel'>;

interface PersonnelFormProps {
  clientOptions: ClientOption[];
  defaultClientId?: string;
  personnel?: PersonnelRow;
  onSuccess?: (data: PersonnelRow) => void;
}

export function PersonnelForm({
  clientOptions,
  defaultClientId,
  personnel,
  onSuccess,
}: PersonnelFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<PersonnelFormInput>({
    resolver: zodResolver(personnelSchema),
    defaultValues: {
      first_name: personnel?.first_name || '',
      last_name: personnel?.last_name || '',
      role: personnel?.role || '',
      email: personnel?.email || '',
      client_id: personnel?.client_id || defaultClientId || '',
      location_id: personnel?.location_id || 'none',
      tax_code: personnel?.tax_code || '',
      hire_date: personnel?.hire_date || '',
      is_active: personnel?.is_active ?? true,
    },
  });

  const selectedClientId = useWatch({
    control: form.control,
    name: 'client_id',
  });

  const locationOptions =
    clientOptions.find((client) => client.id === selectedClientId)?.locations ?? [];

  useEffect(() => {
    const availableLocations =
      clientOptions.find((client) => client.id === selectedClientId)?.locations ?? [];
    const currentLocationId = form.getValues('location_id');

    if (currentLocationId && currentLocationId !== 'none') {
      const locationStillAvailable = availableLocations.some(
        (location) => location.id === currentLocationId
      );

      if (!locationStillAvailable) {
        form.setValue('location_id', 'none', {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    }
  }, [clientOptions, form, selectedClientId]);

  async function onSubmit(values: PersonnelFormInput) {
    setLoading(true);
    try {
      const result = personnel
        ? await updatePersonnel(personnel.id, values)
        : await createPersonnel(values);

      if (result.success) {
        toast.success(personnel ? 'Collaboratore aggiornato' : 'Collaboratore creato');
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
        {!defaultClientId ? (
          <FormField
            control={form.control}
            name="client_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clientOptions.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Es. Mario" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cognome *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Es. Rossi" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ruolo *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Es. Responsabile qualità" />
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
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="Es. mario.rossi@cliente.it" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="tax_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Codice fiscale</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Es. RSSMRA80A01H501U" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hire_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data ingresso</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="location_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sede</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || 'none'}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona sede" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Nessuna sede specifica</SelectItem>
                  {locationOptions.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Salvataggio...' : personnel ? 'Aggiorna collaboratore' : 'Crea collaboratore'}
        </Button>
      </form>
    </Form>
  );
}
