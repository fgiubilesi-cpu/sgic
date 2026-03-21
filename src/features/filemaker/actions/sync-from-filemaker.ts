"use server";

import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import { isFMConfigured } from "@/lib/filemaker/fm-client";
import { importClientsFromFM } from "@/features/filemaker/import/import-clients";
import { importPersonnelFromFM } from "@/features/filemaker/import/import-personnel";

export interface SyncResult {
  success: boolean;
  summary: string;
  details: {
    clients: { imported: number; updated: number; skipped: number; errors: string[] };
    personnel: { imported: number; updated: number; skipped: number; errors: string[] };
  };
  fmConfigured: boolean;
}

export async function syncFromFileMakerAction(): Promise<SyncResult> {
  const ctx = await getOrganizationContext();
  if (!ctx) {
    return {
      success: false,
      summary: "Non autenticato.",
      details: {
        clients: { imported: 0, updated: 0, skipped: 0, errors: [] },
        personnel: { imported: 0, updated: 0, skipped: 0, errors: [] },
      },
      fmConfigured: false,
    };
  }

  if (ctx.role !== "admin") {
    return {
      success: false,
      summary: "Permesso negato. Solo gli amministratori possono eseguire la sincronizzazione.",
      details: {
        clients: { imported: 0, updated: 0, skipped: 0, errors: [] },
        personnel: { imported: 0, updated: 0, skipped: 0, errors: [] },
      },
      fmConfigured: isFMConfigured(),
    };
  }

  if (!isFMConfigured()) {
    return {
      success: false,
      summary: "FileMaker Data API non configurata. Verifica FM_HOST, FM_DATABASE, FM_USERNAME, FM_PASSWORD in .env.local.",
      details: {
        clients: { imported: 0, updated: 0, skipped: 0, errors: [] },
        personnel: { imported: 0, updated: 0, skipped: 0, errors: [] },
      },
      fmConfigured: false,
    };
  }

  const { organizationId } = ctx;

  // Step 1: Import clients + locations
  const clientsResult = await importClientsFromFM(organizationId);

  // Step 2: Import personnel + medical visits
  const personnelResult = await importPersonnelFromFM(organizationId);

  const totalImported = clientsResult.imported + personnelResult.imported;
  const totalUpdated = clientsResult.updated + personnelResult.updated;
  const totalErrors = clientsResult.errors.length + personnelResult.errors.length;

  const success = totalErrors === 0;
  const summary = success
    ? `Sincronizzazione completata: ${totalImported} record importati, ${totalUpdated} aggiornati.`
    : `Completata con ${totalErrors} errore${totalErrors > 1 ? "i" : ""}: ${totalImported} importati, ${totalUpdated} aggiornati.`;

  return {
    success,
    summary,
    details: {
      clients: clientsResult,
      personnel: personnelResult,
    },
    fmConfigured: true,
  };
}
