"use client";

import { useEffect, useState } from "react";
import { getClientAudits } from "@/features/audits/queries/get-client-audits";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClientAudit } from "@/features/audits/queries/get-client-audits";

export default function ClientDashboard() {
  const [audits, setAudits] = useState<ClientAudit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clientName, setClientName] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const ctx = await getOrganizationContext();

        // Get client name if available
        if (ctx?.supabase && ctx?.clientId) {
          const { data: client } = await ctx.supabase
            .from("clients")
            .select("name")
            .eq("id", ctx.clientId)
            .single();

          if (client?.name) {
            setClientName(client.name);
          }
        }

        const auditData = await getClientAudits();
        setAudits(auditData);
      } catch (error) {
        console.error("Failed to fetch client audits:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "bg-blue-100 text-blue-800";
      case "In Progress":
        return "bg-yellow-100 text-yellow-800";
      case "Closed":
        return "bg-green-100 text-green-800";
      case "Review":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-gray-500";
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Audit Dashboard {clientName && `— ${clientName}`}
          </h1>
          <p className="text-slate-600">
          <div className="mt-4">
            <Link
              href="/audit-history"
              className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              View Complete History →
            </Link>
          </div>

            Visualizza e scarica i risultati degli audit della tua organizzazione
          </p>
        </div>

        {/* Audit Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Totale Audit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{audits.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">In Corso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {audits.filter((a) => a.status === "In Progress").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Completati</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {audits.filter((a) => a.status === "Closed").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audit List */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Recenti</CardTitle>
            <CardDescription>Elenco di tutti gli audit disponibili</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            ) : audits.length === 0 ? (
              <p className="text-center text-slate-500 py-8">
                Nessun audit disponibile al momento
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        Titolo
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">
                        Sede
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-700">
                        Data
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-700">
                        Stato
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">
                        Score
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">
                        Azioni
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {audits.map((audit) => (
                      <tr key={audit.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {audit.title || "Senza titolo"}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {audit.location_name || "—"}
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-slate-600">
                          {audit.scheduled_date
                            ? new Date(audit.scheduled_date).toLocaleDateString("it-IT")
                            : "—"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge className={getStatusColor(audit.status)}>
                            {audit.status}
                          </Badge>
                        </td>
                        <td className={`py-3 px-4 text-right font-bold ${getScoreColor(audit.score)}`}>
                          {audit.score !== null ? `${Math.round(audit.score)}%` : "—"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/audits/${audit.id}`}
                            className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                          >
                            Visualizza →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Note: Timeline component can be added to this page by importing:
// import { AuditTimeline } from "@/features/audits/components/audit-timeline";
// And using: <AuditTimeline events={timelineEvents} />
// after fetching with: const timelineEvents = await getAuditTimeline();
