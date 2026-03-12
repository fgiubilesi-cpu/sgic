'use client';

import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { Tables } from '@/types/database.types';
import type { ClientOption } from '@/features/clients/queries/get-client-options';
import type { PersonnelListItem } from '@/features/personnel/queries/get-personnel';
import { createDocument, updateDocument } from '@/features/documents/actions/document-actions';
import {
  documentSchema,
  type DocumentFormInput,
  type DocumentFormValues,
} from '@/features/documents/schemas/document-schema';
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client';
import {
  buildInitialExtractionPayload,
  sanitizeFileName,
  suggestDocumentCategoryFromName,
  suggestDocumentTitleFromName,
} from '@/features/documents/lib/document-intelligence';
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

const INGESTION_STATUSES: ReadonlyArray<NonNullable<DocumentFormValues['ingestion_status']>> = [
  'manual',
  'uploaded',
  'parsed',
  'review_required',
  'reviewed',
  'linked',
  'failed',
];

function coerceIngestionStatus(value: string | null | undefined): DocumentFormValues['ingestion_status'] {
  if (!value) return 'manual';
  return INGESTION_STATUSES.includes(value as NonNullable<DocumentFormValues['ingestion_status']>)
    ? (value as NonNullable<DocumentFormValues['ingestion_status']>)
    : 'manual';
}

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
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadedFilePath, setUploadedFilePath] = useState(document?.storage_path ?? null);

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      category: document?.category ?? 'Procedure',
      client_id: document?.client_id ?? defaultClientId ?? 'none',
      description: document?.description ?? '',
      expiry_date: document?.expiry_date ?? '',
      extracted_payload: document?.extracted_payload ?? null,
      file_name: document?.file_name ?? '',
      file_size_bytes: document?.file_size_bytes ?? null,
      file_url: document?.file_url ?? '',
      ingestion_status: coerceIngestionStatus(document?.ingestion_status),
      issue_date: document?.issue_date ?? '',
      location_id: document?.location_id ?? defaultLocationId ?? 'none',
      mime_type: document?.mime_type ?? '',
      personnel_id: document?.personnel_id ?? defaultPersonnelId ?? 'none',
      storage_path: document?.storage_path ?? '',
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

  const uploadDocumentFile = async (file: File) => {
    setIsUploadingFile(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Sessione utente non disponibile per upload file.');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.organization_id) {
        throw new Error('Profilo organizzazione non disponibile.');
      }

      const safeName = sanitizeFileName(file.name || `document-${Date.now()}`);
      const clientScope = selectedClientId && selectedClientId !== 'none' ? selectedClientId : 'shared';
      const storagePath = `${profile.organization_id}/${clientScope}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: signedData } = await supabase.storage
        .from('documents')
        .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

      const suggestedCategory = suggestDocumentCategoryFromName(file.name);
      if (suggestedCategory) {
        form.setValue('category', suggestedCategory, { shouldDirty: true, shouldValidate: true });
      }
      if (!form.getValues('title').trim()) {
        form.setValue('title', suggestDocumentTitleFromName(file.name), {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      const extractionPayload = buildInitialExtractionPayload({
        category: suggestedCategory ?? form.getValues('category'),
        file,
        originalFileName: file.name,
      });

      form.setValue('storage_path', storagePath, { shouldDirty: true, shouldValidate: true });
      form.setValue('file_name', file.name, { shouldDirty: true, shouldValidate: false });
      form.setValue('mime_type', file.type || '', { shouldDirty: true, shouldValidate: false });
      form.setValue('file_size_bytes', file.size, { shouldDirty: true, shouldValidate: false });
      form.setValue('file_url', signedData?.signedUrl ?? '', { shouldDirty: true, shouldValidate: false });
      form.setValue('ingestion_status', 'uploaded', { shouldDirty: true, shouldValidate: true });
      form.setValue('extracted_payload', extractionPayload, {
        shouldDirty: true,
        shouldValidate: false,
      });
      setUploadedFilePath(storagePath);
      return true;
    } finally {
      setIsUploadingFile(false);
    }
  };

  const onSubmit = async (values: DocumentFormValues) => {
    if (selectedFile) {
      try {
        await uploadDocumentFile(selectedFile);
        setSelectedFile(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload file non riuscito';
        toast.error(message);
        return;
      }
    }

    const payload: DocumentFormInput = {
      ...values,
      storage_path: form.getValues('storage_path'),
      file_name: form.getValues('file_name'),
      mime_type: form.getValues('mime_type'),
      file_size_bytes: form.getValues('file_size_bytes'),
      ingestion_status: form.getValues('ingestion_status'),
      extracted_payload: form.getValues('extracted_payload'),
      file_url: form.getValues('file_url'),
    };

    const result = document
      ? await updateDocument(document.id, payload)
      : await createDocument(payload);

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
                    <SelectItem value="OrgChart">Organigramma</SelectItem>
                    <SelectItem value="Certificate">Certificato</SelectItem>
                    <SelectItem value="Authorization">Autorizzazione</SelectItem>
                    <SelectItem value="Registry">Visura / Registro</SelectItem>
                    <SelectItem value="Report">Report / Verbale</SelectItem>
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
          name="storage_path"
          render={() => (
            <FormItem>
              <FormLabel>File documento</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setSelectedFile(file);
                    if (!file) return;
                    if (!form.getValues('title').trim()) {
                      form.setValue('title', suggestDocumentTitleFromName(file.name), {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                    const suggestedCategory = suggestDocumentCategoryFromName(file.name);
                    if (suggestedCategory) {
                      form.setValue('category', suggestedCategory, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                  }}
                />
              </FormControl>
              <div className="text-xs text-zinc-500">
                {selectedFile
                  ? `Pronto per upload: ${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)`
                  : uploadedFilePath
                  ? `File già caricato: ${uploadedFilePath}`
                  : 'Carica un file per registrarlo in storage e avviare intake documentale.'}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="file_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL file (manuale o firmato)</FormLabel>
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
          {isUploadingFile
            ? 'Upload in corso...'
            : document
            ? 'Aggiorna documento'
            : 'Crea documento'}
        </Button>
      </form>
    </Form>
  );
}
