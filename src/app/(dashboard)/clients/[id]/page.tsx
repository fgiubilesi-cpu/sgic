import { redirect } from 'next/navigation';
import { getClient } from '@/features/clients/queries/get-client';
import { getOrganizationContext } from '@/lib/supabase/get-org-context';
import { ClientForm } from '@/features/clients/components/client-form';
import { ManageLocationSheet } from '@/features/clients/components/manage-location-sheet';
import { ManagePersonnelSheet } from '@/features/personnel/components/manage-personnel-sheet';
import { getPersonnelList } from '@/features/personnel/queries/get-personnel';
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
import Link from 'next/link';

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

  const personnel = await getPersonnelList(orgContext.organizationId, client.id);
  const clientOptions = [
    {
      id: client.id,
      name: client.name,
      locations: client.locations.map((location) => ({
        id: location.id,
        name: location.name,
      })),
    },
  ];

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
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Sedi ({client.locations.length})</CardTitle>
              <CardDescription>
                Elenco delle sedi operative del cliente
              </CardDescription>
            </div>
            <ManageLocationSheet clientId={client.id} />
          </div>
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
                    <TableCell>
                      <ManageLocationSheet clientId={client.id} location={location} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Collaboratori ({personnel.length})</CardTitle>
              <CardDescription>
                Referenti e operatori collegati a questo cliente.
              </CardDescription>
            </div>
            <ManagePersonnelSheet
              clientOptions={clientOptions}
              defaultClientId={client.id}
            />
          </div>
        </CardHeader>
        <CardContent>
          {personnel.length === 0 ? (
            <p className="text-sm text-gray-500">Nessun collaboratore registrato.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Ruolo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Sede</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {personnel.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell className="font-medium">
                      {person.first_name} {person.last_name}
                    </TableCell>
                    <TableCell>{person.role || '-'}</TableCell>
                    <TableCell>{person.email || '-'}</TableCell>
                    <TableCell>{person.location_name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={person.is_active ? 'default' : 'secondary'}>
                        {person.is_active ? 'Attivo' : 'Inattivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex items-center gap-1">
                      <Link
                        href={`/personnel/${person.id}`}
                        className="inline-flex h-8 items-center rounded-md px-2 text-sm text-blue-600 hover:underline"
                      >
                        Dettagli
                      </Link>
                      <ManagePersonnelSheet
                        clientOptions={clientOptions}
                        defaultClientId={client.id}
                        personnel={person}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
