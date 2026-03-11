'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, ClipboardCheck, FileText, MapPin, Users } from 'lucide-react';
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
import type { ClientDetail } from '@/features/clients/queries/get-client';
import type { ClientOption } from '@/features/clients/queries/get-client-options';
import type { PersonnelListItem } from '@/features/personnel/queries/get-personnel';
import { ClientForm } from './client-form';
import { ManageLocationSheet } from './manage-location-sheet';
import { ManagePersonnelSheet } from '@/features/personnel/components/manage-personnel-sheet';

type ClientAuditItem = {
  id: string;
  title: string | null;
  status: string;
  scheduled_date: string | null;
  score: number | null;
  location_name: string | null;
};

type ClientTab = 'overview' | 'locations' | 'personnel' | 'audits' | 'documents';

interface ClientDetailWorkspaceProps {
  audits: ClientAuditItem[];
  client: ClientDetail;
  clientOptions: ClientOption[];
  personnel: PersonnelListItem[];
}

const tabs: Array<{ id: ClientTab; label: string; icon: React.ElementType }> = [
  { id: 'overview', label: 'Panoramica', icon: Building2 },
  { id: 'locations', label: 'Sedi', icon: MapPin },
  { id: 'personnel', label: 'Collaboratori', icon: Users },
  { id: 'audits', label: 'Audit', icon: ClipboardCheck },
  { id: 'documents', label: 'Documenti', icon: FileText },
];

function statusTone(status: string) {
  if (status === 'Closed') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'In Progress') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-sky-200 bg-sky-50 text-sky-700';
}

export function ClientDetailWorkspace({
  audits,
  client,
  clientOptions,
  personnel,
}: ClientDetailWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<ClientTab>('overview');

  const stats = [
    { label: 'Sedi operative', value: client.locations.length },
    { label: 'Collaboratori', value: personnel.length },
    { label: 'Audit storici', value: audits.length },
    {
      label: 'Ultimo audit',
      value: audits[0]?.scheduled_date
        ? new Date(audits[0].scheduled_date).toLocaleDateString('it-IT')
        : 'Mai',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Button asChild variant="ghost" className="px-0 text-zinc-500 hover:bg-transparent">
            <Link href="/clients">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Torna ai clienti
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Gestisci anagrafica, sedi, collaboratori, audit e documenti da un unico punto.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ManageLocationSheet clientId={client.id} />
          <ManagePersonnelSheet clientOptions={clientOptions} defaultClientId={client.id} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-zinc-200 bg-white/90 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-zinc-900">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-wrap gap-2 border-b px-4 py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={
                  isActive
                    ? 'inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white'
                    : 'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100'
                }
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-4">
          {activeTab === 'overview' ? (
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Anagrafica cliente</CardTitle>
                  <CardDescription>Dati amministrativi e di contatto.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ClientForm client={client} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quadro rapido</CardTitle>
                  <CardDescription>Informazioni chiave e stato operativo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <span className="font-medium">Partita IVA</span>
                    <p className="mt-1 text-zinc-600">{client.vat_number || '-'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Email</span>
                    <p className="mt-1 text-zinc-600">{client.email || '-'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Telefono</span>
                    <p className="mt-1 text-zinc-600">{client.phone || '-'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Stato</span>
                    <div className="mt-2">
                      <Badge variant={client.is_active ? 'default' : 'secondary'}>
                        {client.is_active ? 'Attivo' : 'Inattivo'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Note</span>
                    <p className="mt-1 text-zinc-600">{client.notes || 'Nessuna nota operativa.'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeTab === 'locations' ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Sedi ({client.locations.length})</CardTitle>
                  <CardDescription>Elenco delle sedi operative del cliente.</CardDescription>
                </div>
                <ManageLocationSheet clientId={client.id} />
              </CardHeader>
              <CardContent>
                {client.locations.length === 0 ? (
                  <p className="text-sm text-zinc-500">Nessuna sede registrata.</p>
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
          ) : null}

          {activeTab === 'personnel' ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Collaboratori ({personnel.length})</CardTitle>
                  <CardDescription>Referenti e operatori collegati a questo cliente.</CardDescription>
                </div>
                <ManagePersonnelSheet clientOptions={clientOptions} defaultClientId={client.id} />
              </CardHeader>
              <CardContent>
                {personnel.length === 0 ? (
                  <p className="text-sm text-zinc-500">Nessun collaboratore registrato.</p>
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
                            <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-blue-600">
                              <Link href={`/personnel/${person.id}`}>Dettagli</Link>
                            </Button>
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
          ) : null}

          {activeTab === 'audits' ? (
            <Card>
              <CardHeader>
                <CardTitle>Audit ({audits.length})</CardTitle>
                <CardDescription>
                  Storico audit collegati al cliente. Il prossimo passo sarà creare audit direttamente da qui.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {audits.length === 0 ? (
                  <p className="text-sm text-zinc-500">Nessun audit collegato a questo cliente.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Titolo</TableHead>
                        <TableHead>Sede</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Apri</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {audits.map((audit) => (
                        <TableRow key={audit.id}>
                          <TableCell className="font-medium">{audit.title || 'Audit senza titolo'}</TableCell>
                          <TableCell>{audit.location_name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusTone(audit.status)}>
                              {audit.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {audit.scheduled_date
                              ? new Date(audit.scheduled_date).toLocaleDateString('it-IT')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {typeof audit.score === 'number' ? `${audit.score.toFixed(1)}%` : '-'}
                          </TableCell>
                          <TableCell>
                            <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-blue-600">
                              <Link href={`/audits/${audit.id}`}>Apri audit</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ) : null}

          {activeTab === 'documents' ? (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle>Documenti</CardTitle>
                <CardDescription>
                  Placeholder pronto per la Fase 4: documenti cliente, sede e collaboratore con scadenze e versioni.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-zinc-600">
                <p>
                  Qui confluiranno contratti, certificazioni, documenti operativi e allegati legati al cliente.
                </p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>documenti generali del cliente</li>
                  <li>documenti per sede</li>
                  <li>documenti per collaboratore</li>
                  <li>scadenze e versioning</li>
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
