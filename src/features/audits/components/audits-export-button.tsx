"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuditWithNCCount } from "@/features/audits/queries/get-audits";

type AuditsExportButtonProps = {
  audits: AuditWithNCCount[];
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default";
  filename?: string;
};

function formatDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function AuditsExportButton({
  audits,
  label = "Export view",
  variant = "outline",
  size = "sm",
  filename = "audits-export",
}: AuditsExportButtonProps) {
  function handleExport() {
    const rows = [
      ["Title", "Client", "Location", "Status", "Score", "Open NC", "Scheduled Date"],
      ...audits.map((audit) => [
        audit.title ?? "",
        audit.client_name ?? "",
        audit.location_name ?? "",
        audit.status,
        audit.score !== null ? `${audit.score.toFixed(1)}%` : "",
        String(audit.nc_count),
        formatDate(audit.scheduled_date),
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" variant={variant} size={size} onClick={handleExport} disabled={audits.length === 0}>
      <Download className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
