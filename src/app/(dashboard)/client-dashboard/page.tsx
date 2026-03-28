import { getClientAudits } from "@/features/audits/queries/get-client-audits";
import { ClientRiskRadarCard } from "@/features/clients/components/client-risk-radar-card";
import { getClientRiskRadar } from "@/features/clients/queries/get-client-risk-radar";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

function getStatusColor(status: string) {
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
}

function getScoreColor(score: number | null) {
  if (score === null) return "text-gray-500";
  if (score >= 85) return "text-green-600";
  if (score >= 70) return "text-yellow-600";
  return "text-red-600";
}

export default async function ClientDashboard() {
  const [ctx, audits, radarData] = await Promise.all([
    getOrganizationContext(),
    getClientAudits(),
    getClientRiskRadar(),
  ]);

  let clientName = "";

  if (ctx?.supabase && ctx.clientId) {
    const { data: client } = await ctx.supabase
      .from("clients")
      .select("name")
      .eq("id", ctx.clientId)
      .is("deleted_at", null)
      .single();

    if (client?.name) {
      clientName = client.name;
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const openAudits = audits.filter((audit) => audit.status !== "Closed");
  const upcomingAudit =
    audits
      .filter(
        (audit) =>
          audit.scheduled_date !== null &&
          audit.status !== "Closed" &&
          new Date(audit.scheduled_date) >= today
      )
      .sort(
        (left, right) =>
          new Date(left.scheduled_date ?? "").getTime() -
          new Date(right.scheduled_date ?? "").getTime()
      )[0] ?? null;
  const latestScoredAudit =
    audits.find((audit) => audit.status === "Closed" && audit.score !== null) ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Audit Dashboard {clientName && `— ${clientName}`}
          </h1>
          <p className="text-slate-600">
            Vista sintetica degli audit da seguire e dei risultati più recenti.
          </p>
          <div className="mt-4">
            <Link
              href="/audit-history"
              className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              View Complete History →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Prossimo Audit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {upcomingAudit?.scheduled_date
                  ? new Date(upcomingAudit.scheduled_date).toLocaleDateString("it-IT")
                  : "Nessuno"}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {upcomingAudit?.title || "Nessun audit pianificato in agenda"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Audit Aperti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {openAudits.length}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                In attesa, in corso o ancora da chiudere
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Ultimo Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {latestScoredAudit?.score !== null && latestScoredAudit?.score !== undefined
                  ? `${Math.round(latestScoredAudit.score)}%`
                  : "N/D"}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {latestScoredAudit?.title || "Nessun audit chiuso con score disponibile"}
              </p>
            </CardContent>
          </Card>

          <ClientRiskRadarCard data={radarData} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Audit Recenti</CardTitle>
            <CardDescription>Elenco di tutti gli audit disponibili</CardDescription>
          </CardHeader>
          <CardContent>
            {audits.length === 0 ? (
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
                      <tr
                        key={audit.id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
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
                        <td
                          className={`py-3 px-4 text-right font-bold ${getScoreColor(audit.score)}`}
                        >
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
