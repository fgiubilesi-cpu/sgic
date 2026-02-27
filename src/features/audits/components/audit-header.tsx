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
    case "Scheduled":
      return { label: "Scheduled", className: "border-slate-200 bg-slate-50 text-slate-700" };
    case "In Progress":
      return { label: "In Progress", className: "border-blue-200 bg-blue-50 text-blue-700" };
    case "Review":
      return { label: "Review", className: "border-amber-200 bg-amber-50 text-amber-700" };
    case "Closed":
      return { label: "Closed", className: "border-green-200 bg-green-50 text-green-700" };
    default:
      return { label: status, className: "border-zinc-200 bg-zinc-50 text-zinc-700" };
  }
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function AuditHeader({ audit }: AuditHeaderProps) {
  const statusInfo = formatStatus(audit.status);

  return (
    <div className="space-y-4">
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
                {audit.title ?? "Audit detail"}
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
            <span>Back</span>
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
              {audit.title ?? "Untitled Audit"}
            </h2>
            <Badge variant="outline" className={statusInfo.className}>
              {statusInfo.label}
            </Badge>
          </div>
          <p className="text-sm text-zinc-500">
            Scheduled for:{" "}
            <span className="font-medium text-zinc-700">
              {formatDate(audit.scheduled_date)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
