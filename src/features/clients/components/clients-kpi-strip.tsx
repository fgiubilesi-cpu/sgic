import { Building2, ClipboardCheck, MapPin, ShieldAlert, TriangleAlert, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ClientWithStats } from '@/features/clients/queries/get-clients';

interface ClientsKpiStripProps {
  clients: ClientWithStats[];
}

function formatValue(value: number) {
  return new Intl.NumberFormat('it-IT').format(value);
}

export function ClientsKpiStrip({ clients }: ClientsKpiStripProps) {
  const totalClients = clients.length;
  const activeClients = clients.filter((client) => client.is_active).length;
  const totalLocations = clients.reduce((sum, client) => sum + client.location_count, 0);
  const totalPersonnel = clients.reduce((sum, client) => sum + client.personnel_count, 0);
  const totalAudits = clients.reduce((sum, client) => sum + client.audit_count, 0);
  const totalOpenNc = clients.reduce((sum, client) => sum + client.open_nc_count, 0);
  const totalServiceLinkGaps = clients.reduce(
    (sum, client) => sum + client.service_link_gap_count,
    0
  );
  const clientsWithoutStructure = clients.filter(
    (client) => client.location_count === 0 || client.personnel_count === 0
  ).length;
  const clientsWithServiceAttention = clients.filter(
    (client) => client.service_attention_count > 0
  ).length;
  const clientsWithServiceLinkGaps = clients.filter(
    (client) => client.service_link_gap_count > 0
  ).length;

  const items = [
    {
      label: 'Clienti Totali',
      value: formatValue(totalClients),
      icon: Building2,
      tone: 'text-zinc-700',
    },
    {
      label: 'Clienti Attivi',
      value: formatValue(activeClients),
      icon: Building2,
      tone: 'text-emerald-700',
    },
    {
      label: 'Sedi',
      value: formatValue(totalLocations),
      icon: MapPin,
      tone: 'text-sky-700',
    },
    {
      label: 'Collaboratori',
      value: formatValue(totalPersonnel),
      icon: Users,
      tone: 'text-violet-700',
    },
    {
      label: 'Audit Storici',
      value: formatValue(totalAudits),
      icon: ClipboardCheck,
      tone: 'text-amber-700',
    },
    {
      label: 'NC Aperte',
      value: formatValue(totalOpenNc),
      icon: TriangleAlert,
      tone: 'text-rose-700',
    },
    {
      label: 'Clienti Da Completare',
      value: formatValue(clientsWithoutStructure),
      icon: TriangleAlert,
      tone: 'text-orange-700',
    },
    {
      label: 'Servizi Da Presidiare',
      value: formatValue(clientsWithServiceAttention),
      icon: ShieldAlert,
      tone: 'text-rose-700',
    },
    {
      label: 'Link Servizio Mancanti',
      value: formatValue(totalServiceLinkGaps),
      icon: TriangleAlert,
      tone: clientsWithServiceLinkGaps > 0 ? 'text-amber-700' : 'text-emerald-700',
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-9">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.label} className="border-zinc-200 bg-white/90 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {item.label}
              </CardTitle>
              <Icon className={`h-4 w-4 ${item.tone}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-semibold ${item.tone}`}>{item.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
