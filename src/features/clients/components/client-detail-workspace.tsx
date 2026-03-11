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
import { CreateAuditSheet } from '@/features/audits/components/create-audit-sheet';
import { ClientStateToggleButton } from './client-state-toggle-button';
import { LocationStateToggleButton } from './location-state-toggle-button';
import { PersonnelOperationalBadge } from '@/features/personnel/components/personnel-operational-badge';
import { PersonnelStateToggleButton } from '@/features/personnel/components/personnel-state-toggle-button';

type ClientAuditItem = {
  id: string;
  nc_count: number;
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
  openNcCount: number;
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
  openNcCount,
  personnel,
}: ClientDetailWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<ClientTab>('overview');
  const isClientActive = client.is_active ?? true;

  const stats = [
    { label: 'Sedi operative', value: client.locations.length },
    { label: 'Collaboratori', value: personnel.length },
    { label: 'Audit storici', value: audits.length },
    { label: 'NC aperte', value: openNcCount },
    {
      label: 'Ultimo audit',
      value: audits[0]?.scheduled_date
        ? new Date(audits[0].scheduled_date).toLocaleDateString('it-IT')
        : 'Mai',
    },
  ];

  const closedAudits = audits.filter((audit) => audit.status === 'Closed').length;
  const scheduledAudits = audits.filter((audit) => audit.status === 'Scheduled').length;
  const averageScore =
    audits.filter((audit) => typeof audit.score === 'number').reduce((sum, audit) => sum + (audit.score ?? 0), 0) /
      Math.max(audits.filter((audit) => typeof audit.score === 'number').length, 1);

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
          <ClientStateToggleButton clientId={client.id} isActive={isClientActive} />
          <ManageLocationSheet clientId={client.id} />
          <ManagePersonnelSheet clientOptions={clientOptions} defaultClientId={client.id} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
                      <Badge variant={isClientActive ? 'default' : 'secondary'}>
                        {isClientActive ? 'Attivo' : 'Inattivo'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Audit con NC aperte</span>
                    <p className="mt-1 text-zinc-600">
                      {openNcCount > 0
                        ? `${openNcCount} non conformita da seguire in questa scheda cliente.`
                        : 'Nessuna non conformita aperta al momento.'}
                    </p>
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
                            <Badge variant={(location.is_active ?? true) ? 'default' : 'secondary'}>
                              {(location.is_active ?? true) ? 'Attivo' : 'Inattivo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <ManageLocationSheet clientId={client.id} location={location} />
                              <LocationStateToggleButton
                                isActive={location.is_active ?? true}
                                locationId={location.id}
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
                        <TableHead>Sede</TableHead>
                        <TableHead>Formazione</TableHead>
                        <TableHead>Stato operativo</TableHead>
                        <TableHead>Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {personnel.map((person) => (
                        <TableRow key={person.id}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>
                                {person.first_name} {person.last_name}
                              </span>
                              <span className="text-xs text-zinc-500">{person.email || '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell>{person.role || '-'}</TableCell>
                          <TableCell>{person.location_name || '-'}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 text-xs">
                              <span className="text-zinc-700">
                                {person.training_record_count} corsi registrati
                              </span>
                              {person.training_expired_count > 0 ? (
                                <span className="text-rose-700">
                                  {person.training_expired_count} scaduti
                                </span>
                              ) : person.training_expiring_count > 0 ? (
                                <span className="text-amber-700">
                                  {person.training_expiring_count} in scadenza
                                </span>
                              ) : (
                                <span className="text-zinc-500">Nessuna criticita</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <PersonnelOperationalBadge status={person.operational_status} />
                              {person.next_expiry_date ? (
                                <div className="text-xs text-zinc-500">
                                  Prossima scadenza{' '}
                                  {new Date(person.next_expiry_date).toLocaleDateString('it-IT')}
                                </div>
                              ) : null}
                            </div>
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
                            <PersonnelStateToggleButton
                              isActive={person.is_active}
                              personnelId={person.id}
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
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <Card className="border-zinc-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
                      Audit chiusi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-emerald-700">{closedAudits}</div>
                  </CardContent>
                </Card>
                <Card className="border-zinc-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
                      Audit pianificati
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-sky-700">{scheduledAudits}</div>
                  </CardContent>
                </Card>
                <Card className="border-zinc-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
                      Score medio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-amber-700">
                      {Number.isFinite(averageScore) ? `${averageScore.toFixed(1)}%` : '-'}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-zinc-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
                      NC aperte
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-rose-700">{openNcCount}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Audit ({audits.length})</CardTitle>
                    <CardDescription>
                      Storico audit collegati al cliente e punto di accesso per crearne di nuovi.
                    </CardDescription>
                  </div>
                  <CreateAuditSheet
                    defaultClientId={client.id}
                    hideClientField
                    triggerLabel="Nuovo Audit"
                  />
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
                          <TableHead>NC aperte</TableHead>
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
                              <span
                                className={
                                  audit.nc_count > 0
                                    ? 'inline-flex min-w-8 items-center justify-center rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700'
                                    : 'inline-flex min-w-8 items-center justify-center rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500'
                                }
                              >
                                {audit.nc_count}
                              </span>
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
            </div>
          ) : null}

          {activeTab === 'documents' ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Card className="border-zinc-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
                      Documenti Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-zinc-900">0</div>
                    <p className="mt-2 text-sm text-zinc-500">Archivio cliente non ancora attivato.</p>
                  </CardContent>
                </Card>
                <Card className="border-zinc-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
                      Sedi da coprire
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-sky-700">{client.locations.length}</div>
                    <p className="mt-2 text-sm text-zinc-500">
                      Ogni sede potra avere documenti operativi e certificazioni dedicate.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-zinc-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
                      Collaboratori da coprire
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-violet-700">{personnel.length}</div>
                    <p className="mt-2 text-sm text-zinc-500">
                      Qui confluiranno documenti personali, scadenze e formazione.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-zinc-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
                      Audit con evidenze
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-amber-700">{audits.length}</div>
                    <p className="mt-2 text-sm text-zinc-500">
                      La cronologia audit e gia pronta a diventare base dell&apos;archivio documentale.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle>Roadmap Documentale</CardTitle>
                    <CardDescription>
                      Preparazione della Fase 4 con archivio per cliente, sedi e collaboratori.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-zinc-600">
                    <div>
                      <p className="font-medium text-zinc-900">Cosa entrera qui</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        <li>contratti, visure e allegati amministrativi del cliente</li>
                        <li>manuali, autorizzazioni e certificazioni di sede</li>
                        <li>documenti individuali, formazione e scadenze collaboratori</li>
                        <li>versioning, data scadenza e stato validazione</li>
                      </ul>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-3">
                      <p className="font-medium text-zinc-900">Stato attuale</p>
                      <p className="mt-1">
                        La scheda cliente e gia pronta a raccogliere i tre livelli del futuro archivio:
                        cliente, sede e collaboratore.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Checklist preparatoria</CardTitle>
                    <CardDescription>
                      Passi consigliati prima di attivare il modulo documenti.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="rounded-lg border border-zinc-200 p-3">
                      <p className="font-medium text-zinc-900">1. Struttura cliente</p>
                      <p className="mt-1 text-zinc-600">
                        {client.locations.length > 0
                          ? 'Le sedi sono gia censite e pronte per documenti dedicati.'
                          : 'Aggiungi almeno una sede per organizzare correttamente i documenti operativi.'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-zinc-200 p-3">
                      <p className="font-medium text-zinc-900">2. Referenti operativi</p>
                      <p className="mt-1 text-zinc-600">
                        {personnel.length > 0
                          ? 'I collaboratori sono gia presenti e potranno ricevere documenti e scadenze.'
                          : 'Aggiungi collaboratori per preparare la gestione di documenti individuali e formazione.'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-zinc-200 p-3">
                      <p className="font-medium text-zinc-900">3. Audit e priorita</p>
                      <p className="mt-1 text-zinc-600">
                        {openNcCount > 0
                          ? `Sono presenti ${openNcCount} NC aperte: la futura area documenti potra ospitare anche evidenze di risoluzione.`
                          : 'Nessuna NC aperta: la scheda e pronta per introdurre archivio e scadenze senza criticita correnti.'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
