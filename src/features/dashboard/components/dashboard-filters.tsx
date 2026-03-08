"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ClientOption, LocationOption } from "@/features/dashboard/queries/get-dashboard-data";

interface DashboardFiltersProps {
  clients: ClientOption[];
  locations: LocationOption[];
  activeClientId: string;
  activeLocationId: string;
  activeDateFrom: string;
  activeDateTo: string;
}

export function DashboardFilters({
  clients,
  locations,
  activeClientId,
  activeLocationId,
  activeDateFrom,
  activeDateTo,
}: DashboardFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createUrl = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) {
          params.set(k, v);
        } else {
          params.delete(k);
        }
      });
      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams]
  );

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    // Reset location when client changes
    router.push(createUrl({ clientId, locationId: "" }));
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(createUrl({ locationId: e.target.value }));
  };

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    router.push(createUrl({ dateFrom: e.target.value }));
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    router.push(createUrl({ dateTo: e.target.value }));
  };

  const handleReset = () => {
    router.push(pathname);
  };

  const hasFilters =
    !!activeClientId || !!activeLocationId || !!activeDateFrom || !!activeDateTo;

  // Filter locations based on selected client
  const visibleLocations = activeClientId
    ? locations.filter((l) => l.clientId === activeClientId)
    : locations;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Client */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500">Cliente</label>
        <select
          value={activeClientId}
          onChange={handleClientChange}
          className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-300 min-w-[160px]"
        >
          <option value="">Tutti i clienti</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500">Sede</label>
        <select
          value={activeLocationId}
          onChange={handleLocationChange}
          className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-300 min-w-[150px]"
        >
          <option value="">Tutte le sedi</option>
          {visibleLocations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date from */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500">Dal</label>
        <input
          type="date"
          value={activeDateFrom}
          onChange={handleDateFromChange}
          className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-300"
        />
      </div>

      {/* Date to */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500">Al</label>
        <input
          type="date"
          value={activeDateTo}
          onChange={handleDateToChange}
          className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-300"
        />
      </div>

      {/* Reset */}
      {hasFilters && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-transparent select-none">.</label>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 gap-1.5 text-xs text-zinc-500 hover:text-zinc-900"
          >
            <X className="w-3.5 h-3.5" />
            Reset
          </Button>
        </div>
      )}
    </div>
  );
}
