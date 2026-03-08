"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportExcelButtonProps {
  auditId: string;
  auditTitle?: string | null;
}

export function ExportExcelButton({ auditId, auditTitle }: ExportExcelButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    const toastId = toast.loading("Generazione Excel in corso…");
    try {
      const res = await fetch(`/api/audits/${auditId}/export`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Errore durante l'esportazione.");
      }

      // Determine filename from Content-Disposition or build a fallback
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename =
        match?.[1] ??
        `audit_${(auditTitle ?? auditId).replace(/\s+/g, "_")}.xlsx`;

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("File Excel scaricato.", { id: toastId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Errore sconosciuto.";
      toast.error(message, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isLoading}
      className="gap-2"
    >
      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
      {isLoading ? "Esportazione…" : "Esporta Excel"}
    </Button>
  );
}
