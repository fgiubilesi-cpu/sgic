"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Audit, AuditStatus } from "@/features/audits/queries/get-audits";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AuditTableProps = {
  audits: Audit[];
};

function formatStatus(status: AuditStatus): { label: string; className: string } {
  switch (status) {
    case "planned":
      return {
        label: "Pianificato",
        className: "border-blue-200 bg-blue-50 text-blue-700",
      };
    case "in_progress":
      return {
        label: "In corso",
        className: "border-amber-200 bg-amber-50 text-amber-700",
      };
    case "completed":
      return {
        label: "Completato",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    default:
      return {
        label: status,
        className: "border-zinc-200 bg-zinc-50 text-zinc-700",
      };
  }
}

function formatDate(value: string | null): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function AuditTable({ audits }: AuditTableProps) {
  const router = useRouter();

  if (!audits.length) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-6 py-8 text-center text-sm text-zinc-500">
        Nessun audit in programma.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titolo</TableHead>
            <TableHead>Stato</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="w-[50px] text-right">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {audits.map((audit) => {
            const statusInfo = formatStatus(audit.status);

            return (
              <TableRow
                key={audit.id}
                className="cursor-pointer"
                onClick={() => router.push(`/audits/${audit.id}`)}
              >
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-zinc-900">
                      {audit.title ?? "Audit senza titolo"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={statusInfo.className}
                  >
                    {statusInfo.label}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(audit.scheduled_date)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                        aria-label="Azioni audit"
                        onClick={(event) => {
                          event.stopPropagation();
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault();
                          router.push(`/audits/${audit.id}`);
                        }}
                      >
                        View details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableCaption className="px-3 pb-3">
          Elenco degli audit pianificati per la tua organizzazione.
        </TableCaption>
      </Table>
    </div>
  );
}

