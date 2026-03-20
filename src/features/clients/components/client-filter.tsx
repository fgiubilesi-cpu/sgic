"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

export interface ClientFilterOption {
  id: string;
  name: string;
}

interface ClientFilterProps {
  clients: ClientFilterOption[];
}

export function ClientFilter({ clients }: ClientFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentClientId = searchParams.get("client") ?? "all";

  const handleChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") {
        params.delete("client");
      } else {
        params.set("client", value);
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams],
  );

  if (clients.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-zinc-400 shrink-0" />
      <Select value={currentClientId} onValueChange={handleChange}>
        <SelectTrigger className="h-8 w-[200px] text-xs">
          <SelectValue placeholder="Tutti i clienti" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tutti i clienti</SelectItem>
          {clients.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
