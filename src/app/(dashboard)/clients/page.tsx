import { redirect } from 'next/navigation';
import { getClients } from '@/features/clients/queries/get-clients';
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

  const clients = await getClients(orgContext.organizationId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clienti</h1>
        <CreateClientSheet />
      </div>

      {clients.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-gray-500">Nessun cliente creato yet.</p>
        </div>
      ) : (
        <ClientTable clients={clients} />
      )}
    </div>
  );
}
