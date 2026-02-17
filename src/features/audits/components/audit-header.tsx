import Link from "next/link";
import type { Audit } from "@/features/audits/queries/get-audits";
import type { AuditStatus } from "@/features/audits/schemas/audit-schema";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type AuditHeaderProps = {
  audit: Audit;
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

export function AuditHeader({ audit }: AuditHeaderProps) {
  const statusInfo = formatStatus(audit.status);

  return (
    <div className="space-y-4">
      {/* Breadcrumb locale per la pagina Audit */}
      <div className="flex items-center justify-between gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <Link
                href="/audits"
                className="text-xs font-medium text-zinc-500 hover:text-zinc-700"
              >
                Audits
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-xs font-medium">
                {audit.title ?? "Dettaglio audit"}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Link href="/audits">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs text-zinc-600 hover:text-zinc-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Indietro</span>
          </Button>
        </Link>
      </div>

      {/* Header principale */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
              {audit.title ?? "Audit senza titolo"}
            </h2>
            <Badge
              variant="outline"
              className={statusInfo.className}
            >
              {statusInfo.label}
            </Badge>
          </div>
          <p className="text-sm text-zinc-500">
            Programmato per:{" "}
            <span className="font-medium text-zinc-700">
              {formatDate(audit.scheduled_date)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

