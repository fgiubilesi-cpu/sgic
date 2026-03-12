'use client';

import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { Tables } from '@/types/database.types';
import type { ClientOption } from '@/features/clients/queries/get-client-options';
import type { PersonnelListItem } from '@/features/personnel/queries/get-personnel';
import { createDocument, updateDocument } from '@/features/documents/actions/document-actions';
import { documentSchema, type DocumentFormInput } from '@/features/documents/schemas/document-schema';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type DocumentRow = Tables<'documents'>;

interface DocumentFormProps {
  clientOptions: ClientOption[];
  defaultClientId?: string;
  defaultLocationId?: string;
  defaultPersonnelId?: string;
  document?: DocumentRow;
  onSuccess?: (document: DocumentRow) => void;
  personnelOptions: PersonnelListItem[];
}

export function DocumentForm({
  clientOptions,
  defaultClientId,
  defaultLocationId,
  defaultPersonnelId,
  document,
  onSuccess,
  personnelOptions,
}: DocumentFormProps) {
  const form = useForm<DocumentFormInput>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      category: document?.category ?? 'Procedure',
      client_id: document?.client_id ?? defaultClientId ?? 'none',
      description: document?.description ?? '',
      expiry_date: document?.expiry_date ?? '',
      file_url: document?.file_url ?? '',
      issue_date: document?.issue_date ?? '',
      location_id: document?.location_id ?? defaultLocationId ?? 'none',
      personnel_id: document?.personnel_id ?? defaultPersonnelId ?? 'none',
      status: document?.status ?? 'draft',
      title: document?.title ?? '',
      version: document?.version ?? '',
    },
  });

  const selectedClientId = useWatch({
    control: form.control,
    name: 'client_id',
  });

  const locationOptions = useMemo(
    () => clientOptions.find((client) => client.id === selectedClientId)?.locations ?? [],
    [clientOptions, selectedClientId]
  );

  const filteredPersonnel = useMemo(() => {
    if (!selectedClientId || selectedClientId === 'none') return personnelOptions;
    return personnelOptions.filter((person) => person.client_id === selectedClientId);
  }, [personnelOptions, selectedClientId]);

  const onSubmit = async (values: DocumentFormInput) => {
    const result = document
      ? await updateDocument(document.id, values)
      : await createDocument(values);

    if (!result.success) {
      toast.error(result.error ?? 'Impossibile salvare il documento.');
      return;
    }

    toast.success(document ? 'Documento aggiornato' : 'Documento creato');
    onSuccess?.(result.data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {!defaultClientId ? (
          <FormField
            control={form.control}
            name="client_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Nessun cliente specifico</SelectItem>
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

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titolo</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Es. DVR aggiornato 2026" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Procedure">Procedura</SelectItem>
                    <SelectItem value="Manual">Manuale</SelectItem>
                    <SelectItem value="Instruction">Istruzione</SelectItem>
                    <SelectItem value="Form">Modulo</SelectItem>
                    <SelectItem value="Contract">Contratto</SelectItem>
                    <SelectItem value="Certificate">Certificato</SelectItem>
                    <SelectItem value="Other">Altro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stato</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Bozza</SelectItem>
                    <SelectItem value="published">Pubblicato</SelectItem>
                    <SelectItem value="archived">Archiviato</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="location_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sede</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Nessuna sede" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Nessuna sede</SelectItem>
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

          <FormField
            control={form.control}
            name="personnel_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Collaboratore</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Nessun collaboratore" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Nessun collaboratore</SelectItem>
                    {filteredPersonnel.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.first_name} {person.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="version"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Versione</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Es. v1.2" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="issue_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data emissione</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expiry_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data scadenza</FormLabel>
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
          name="file_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL file</FormLabel>
              <FormControl>
                <Input {...field} placeholder="https://..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrizione</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} placeholder="Contesto, utilizzo o note sul documento..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {document ? 'Aggiorna documento' : 'Crea documento'}
        </Button>
      </form>
    </Form>
  );
}
