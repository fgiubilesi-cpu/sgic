'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ManageContactSheet } from '@/features/clients/components/client-workspace-controls';
import type { ClientOption } from '@/features/clients/queries/get-client-options';
import type { ClientContactRecord } from '@/features/clients/queries/get-client-workspace';
import { ManagePersonnelSheet } from '@/features/personnel/components/manage-personnel-sheet';
import { PersonnelOperationalBadge } from '@/features/personnel/components/personnel-operational-badge';
import { PersonnelStateToggleButton } from '@/features/personnel/components/personnel-state-toggle-button';
import type { PersonnelListItem } from '@/features/personnel/queries/get-personnel';

interface ClientOrgChartTabProps {
  clientId: string;
  clientOptions: ClientOption[];
  contacts: ClientContactRecord[];
  locationMap: Map<string, string>;
  locations: Array<{ id: string; name: string }>;
  personnel: PersonnelListItem[];
}

export function ClientOrgChartTab({
  clientId,
  clientOptions,
  contacts,
  locationMap,
  locations,
  personnel,
}: ClientOrgChartTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Contatti cliente ({contacts.length})</CardTitle>
            <CardDescription>Mappa referenti cliente per ruolo, area e sede.</CardDescription>
          </div>
          <ManageContactSheet clientId={clientId} locations={locations} />
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="text-sm text-zinc-500">Nessun contatto cliente registrato.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contatto</TableHead>
                  <TableHead>Ruolo/Area</TableHead>
                  <TableHead>Sede</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-zinc-900">{contact.full_name}</p>
                        <p className="text-xs text-zinc-500">
                          {contact.email || 'Email n.d.'}
                          {contact.phone ? ` · ${contact.phone}` : ''}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-zinc-700">
                        <div>{contact.role || '-'}</div>
                        <div className="text-xs text-zinc-500">{contact.department || '-'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.location_id
                        ? locationMap.get(contact.location_id) ?? 'Sede rimossa'
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="space-x-1">
                        <Badge variant={contact.is_active ? 'default' : 'secondary'}>
                          {contact.is_active ? 'Attivo' : 'Inattivo'}
                        </Badge>
                        {contact.is_primary ? <Badge variant="outline">Principale</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ManageContactSheet clientId={clientId} contact={contact} locations={locations} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Collaboratori SGIC ({personnel.length})</CardTitle>
            <CardDescription>
              Team interno collegato al cliente per operatività quotidiana.
            </CardDescription>
          </div>
          <ManagePersonnelSheet clientOptions={clientOptions} defaultClientId={clientId} />
        </CardHeader>
        <CardContent>
          {personnel.length === 0 ? (
            <p className="text-sm text-zinc-500">Nessun collaboratore interno assegnato.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Ruolo</TableHead>
                  <TableHead>Sede</TableHead>
                  <TableHead>Stato operativo</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {personnel.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-zinc-900">
                          {person.first_name} {person.last_name}
                        </p>
                        <p className="text-xs text-zinc-500">{person.email || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>{person.role || '-'}</TableCell>
                    <TableCell>{person.location_name || '-'}</TableCell>
                    <TableCell>
                      <PersonnelOperationalBadge status={person.operational_status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-blue-600">
                          <Link href={`/personnel/${person.id}`}>Dettagli</Link>
                        </Button>
                        <ManagePersonnelSheet
                          clientOptions={clientOptions}
                          defaultClientId={clientId}
                          personnel={person}
                        />
                        <PersonnelStateToggleButton
                          isActive={person.is_active}
                          personnelId={person.id}
                        />
                      </div>
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
