import { redirect } from 'next/navigation';
import { getClient } from '@/features/clients/queries/get-client';
import { getOrganizationContext } from '@/lib/supabase/get-org-context';
import { ClientForm } from '@/features/clients/components/client-form';
import { LocationForm } from '@/features/clients/components/location-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Dettaglio Cliente - SGIC',
  description: 'Dettaglio cliente e sedi',
};

interface ClientDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClientDetailPage({ params: paramsProm }: ClientDetailPageProps) {
  const params = await paramsProm;
  const orgContext = await getOrganizationContext();

  if (!orgContext) {
    redirect('/login');
  }

  const client = await getClient(params.id, orgContext.organizationId);

  if (!client) {
    redirect('/clients');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{client.name}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Client Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Informazioni Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientForm client={client} />
          </CardContent>
        </Card>

        {/* Client Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Dettagli</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="font-medium">Partita IVA:</span>
              <p>{client.vat_number || '-'}</p>
            </div>
            <div>
              <span className="font-medium">Email:</span>
              <p>{client.email || '-'}</p>
            </div>
            <div>
              <span className="font-medium">Telefono:</span>
              <p>{client.phone || '-'}</p>
            </div>
            <div>
              <span className="font-medium">Stato:</span>
              <div className="mt-1">
                <Badge variant={client.is_active ? 'default' : 'secondary'}>
                  {client.is_active ? 'Attivo' : 'Inattivo'}
                </Badge>
              </div>
            </div>
            {client.notes && (
              <div>
                <span className="font-medium">Note:</span>
                <p className="mt-1 text-gray-600">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Locations Section */}
      <Card>
        <CardHeader>
          <CardTitle>Sedi ({client.locations.length})</CardTitle>
          <CardDescription>
            Elenco delle sedi operative del cliente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {client.locations.length === 0 ? (
            <p className="text-sm text-gray-500">Nessuna sede registrata.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Città</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">{location.name}</TableCell>
                    <TableCell>{location.city || '-'}</TableCell>
                    <TableCell>{location.type || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={location.is_active ? 'default' : 'secondary'}>
                        {location.is_active ? 'Attivo' : 'Inattivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-blue-600">
                      <button className="hover:underline">Modifica</button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Add Location Form */}
          <div className="border-t pt-6">
            <h3 className="mb-4 font-semibold">Aggiungi Nuova Sede</h3>
            <LocationForm clientId={client.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
