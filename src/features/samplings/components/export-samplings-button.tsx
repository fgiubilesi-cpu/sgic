"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportSamplingsButtonProps {
  clientId?: string;
}

export function ExportSamplingsButton({ clientId }: ExportSamplingsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    const toastId = toast.loading("Generazione Excel in corso…");
    try {
      const url = clientId
        ? `/api/samplings/export?clientId=${encodeURIComponent(clientId)}`
        : "/api/samplings/export";

      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Errore durante l'esportazione.");
      }

      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] ?? "campionamenti.xlsx";

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);

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
      {isLoading ? "Esportazione…" : "Esporta XLS"}
    </Button>
  );
}
