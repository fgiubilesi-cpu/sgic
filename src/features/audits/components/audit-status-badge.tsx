"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateAuditStatus } from "../actions/audit-actions";

type Props = {
  auditId: string;
  currentStatus: string;
};

export function AuditStatusBadge({ auditId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  // Mappa visiva degli stati
  const config: Record<string, { label: string; color: string }> = {
    planned: { label: "Pianificato", color: "bg-blue-100 text-blue-700 border-blue-200" },
    in_progress: { label: "In Corso", color: "bg-amber-100 text-amber-700 border-amber-200" },
    completed: { label: "Completato", color: "bg-green-100 text-green-700 border-green-200" },
    archived: { label: "Archiviato", color: "bg-slate-100 text-slate-700 border-slate-200" },
  };

  const activeConfig = config[status] || config["planned"];

  const handleChange = async (newStatus: string) => {
    setLoading(true);
    // Aggiornamento ottimistico (cambia subito visivamente)
    const oldStatus = status;
    setStatus(newStatus);

    try {
      await updateAuditStatus(auditId, newStatus);
      toast.success(`Stato aggiornato: ${config[newStatus].label}`);
    } catch (error) {
      // Revert in caso di errore
      setStatus(oldStatus);
      toast.error("Errore nell'aggiornamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block group">
      {/* Badge Visivo */}
      <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-colors ${activeConfig.color}`}>
        <span className="relative flex h-2 w-2">
          {status === 'in_progress' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current"></span>
          )}
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
        </span>
        {activeConfig.label}
        
        {/* Freccia giù piccola */}
        <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>

        {/* Selettore Invisibile Sovrapposto (Il trucco per farlo funzionare ovunque) */}
        <select
          value={status}
          onChange={(e) => handleChange(e.target.value)}
          disabled={loading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        >
          <option value="planned">Pianificato</option>
          <option value="in_progress">In Corso</option>
          <option value="completed">Completato</option>
          <option value="archived">Archiviato</option>
        </select>
      </div>
    </div>
  );
}