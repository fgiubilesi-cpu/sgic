'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ClientOption } from '@/features/clients/queries/get-client-options';
import type { ClientWithStats } from '@/features/clients/queries/get-clients';
import { ClientsKpiStrip } from './clients-kpi-strip';
import { ClientTable } from './client-table';

type StatusFilter = 'all' | 'active' | 'inactive';
type StructureFilter = 'all' | 'missing-locations' | 'missing-personnel' | 'complete';
type SortBy = 'name' | 'last-audit' | 'locations' | 'personnel' | 'audits';

interface ClientsExplorerProps {
  clientOptions: ClientOption[];
  clients: ClientWithStats[];
}

export function ClientsExplorer({ clientOptions, clients }: ClientsExplorerProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [structure, setStructure] = useState<StructureFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('name');

  const normalizedSearch = search.trim().toLowerCase();

  const filteredClients = clients
    .filter((client) => {
      if (status === 'active' && !client.is_active) return false;
      if (status === 'inactive' && client.is_active) return false;

      if (structure === 'missing-locations' && client.location_count > 0) return false;
      if (structure === 'missing-personnel' && client.personnel_count > 0) return false;
      if (
        structure === 'complete' &&
        (client.location_count === 0 || client.personnel_count === 0)
      ) {
        return false;
      }

      if (!normalizedSearch) return true;

      const haystack = [
        client.name,
        client.email ?? '',
        client.vat_number ?? '',
        client.notes ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    })
    .sort((left, right) => {
      if (sortBy === 'name') {
        return left.name.localeCompare(right.name, 'it');
      }

      if (sortBy === 'locations') {
        return right.location_count - left.location_count || left.name.localeCompare(right.name, 'it');
      }

      if (sortBy === 'personnel') {
        return right.personnel_count - left.personnel_count || left.name.localeCompare(right.name, 'it');
      }

      if (sortBy === 'audits') {
        return right.audit_count - left.audit_count || left.name.localeCompare(right.name, 'it');
      }

      const leftDate = left.last_audit_date ? new Date(left.last_audit_date).getTime() : 0;
      const rightDate = right.last_audit_date ? new Date(right.last_audit_date).getTime() : 0;
      return rightDate - leftDate || left.name.localeCompare(right.name, 'it');
    });

  const activeFilterCount =
    (normalizedSearch ? 1 : 0) +
    (status !== 'all' ? 1 : 0) +
    (structure !== 'all' ? 1 : 0) +
    (sortBy !== 'name' ? 1 : 0);

  const resetFilters = () => {
    setSearch('');
    setStatus('all');
    setStructure('all');
    setSortBy('name');
  };

  return (
    <div className="space-y-5">
      <ClientsKpiStrip clients={clients} />

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
              <SlidersHorizontal className="h-4 w-4" />
              Esplora clienti
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Filtra l’anagrafica per stato, struttura minima e carico operativo.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span>{filteredClients.length} risultati</span>
            {activeFilterCount > 0 ? (
              <Badge variant="secondary" className="bg-zinc-100 text-zinc-700">
                {activeFilterCount} filtri attivi
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 px-4 py-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cerca per nome, email, P.IVA o note"
              className="pl-9"
            />
          </div>

          <Select value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
            <SelectTrigger>
              <SelectValue placeholder="Stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              <SelectItem value="active">Solo attivi</SelectItem>
              <SelectItem value="inactive">Solo inattivi</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={structure}
            onValueChange={(value) => setStructure(value as StructureFilter)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Struttura" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualsiasi struttura</SelectItem>
              <SelectItem value="missing-locations">Senza sedi</SelectItem>
              <SelectItem value="missing-personnel">Senza collaboratori</SelectItem>
              <SelectItem value="complete">Struttura completa</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
            <SelectTrigger>
              <SelectValue placeholder="Ordina per" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nome cliente</SelectItem>
              <SelectItem value="last-audit">Ultimo audit</SelectItem>
              <SelectItem value="locations">Numero sedi</SelectItem>
              <SelectItem value="personnel">Numero collaboratori</SelectItem>
              <SelectItem value="audits">Numero audit</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center justify-end">
            <Button variant="ghost" onClick={resetFilters} disabled={activeFilterCount === 0}>
              Reset
            </Button>
          </div>
        </div>

        {filteredClients.length === 0 ? (
          <div className="border-t px-4 py-10 text-center text-sm text-zinc-500">
            Nessun cliente corrisponde ai filtri correnti.
          </div>
        ) : (
          <ClientTable clientOptions={clientOptions} clients={filteredClients} />
        )}
      </div>
    </div>
  );
}
