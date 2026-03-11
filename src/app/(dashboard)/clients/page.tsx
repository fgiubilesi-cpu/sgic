import { redirect } from 'next/navigation';
import { getClients } from '@/features/clients/queries/get-clients';
import { getClientOptions } from '@/features/clients/queries/get-client-options';
import { getOrganizationContext } from '@/lib/supabase/get-org-context';
import { ClientTable } from '@/features/clients/components/client-table';
import { CreateClientSheet } from '@/features/clients/components/create-client-sheet';

export const metadata = {
  title: 'Clienti - SGIC',
  description: 'Gestione clienti',
};

export default async function ClientsPage() {
  const orgContext = await getOrganizationContext();

  if (!orgContext) {
    redirect('/login');
  }

  const [clients, clientOptions] = await Promise.all([
    getClients(orgContext.organizationId),
    getClientOptions(orgContext.organizationId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Clienti</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Hub unico per gestire anagrafica cliente, sedi operative e collaboratori.
          </p>
        </div>
        <CreateClientSheet />
      </div>

      {clients.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-gray-500">
            Nessun cliente registrato. Crea il primo cliente e poi aggiungi sedi e collaboratori
            dalla sua scheda.
          </p>
        </div>
      ) : (
        <ClientTable clientOptions={clientOptions} clients={clients} />
      )}
    </div>
  );
}
