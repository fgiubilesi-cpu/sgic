import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ArrowLeft, GraduationCap, Clock, Calendar, AlertTriangle } from "lucide-react";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import { createClient } from "@/lib/supabase/server";
import { getCourseRegistrations } from "@/features/training/queries/get-training-courses";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await getOrganizationContext();
  if (!ctx) redirect("/login");

  const { id } = await params;
  const sp = await searchParams;
  const activeTab = typeof sp.tab === "string" ? sp.tab : "registrazioni";

  const supabase = await createClient();
  const { data: course } = await supabase
    .from("training_courses")
    .select("id, title, category, duration_hours, validity_months, created_at")
    .eq("id", id)
    .eq("organization_id", ctx.organizationId)
    .single();

  if (!course) notFound();

  const registrations = await getCourseRegistrations(ctx.organizationId, id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ninetyDaysOut = new Date(today);
  ninetyDaysOut.setDate(ninetyDaysOut.getDate() + 90);

  const expiringRegistrations = registrations.filter(
    (r) => r.urgency === "overdue" || r.urgency === "warning" ||
      (r.urgency === "ok" && r.daysUntil !== null && r.daysUntil <= 90)
  );

  return (
    <section className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/training" className="flex items-center gap-1 hover:text-zinc-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Formazione
        </Link>
        <span>/</span>
        <span className="text-zinc-800 font-medium truncate">{course.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 flex-shrink-0">
          <GraduationCap className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {course.title}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">{course.category}</p>
        </div>
      </div>

      {/* Info strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-white px-4 py-3 flex items-center gap-3">
          <Clock className="w-4 h-4 text-zinc-400" />
          <div>
            <div className="text-lg font-semibold">{course.duration_hours}h</div>
            <div className="text-xs text-zinc-500">Durata</div>
          </div>
        </div>
        <div className="rounded-lg border bg-white px-4 py-3 flex items-center gap-3">
          <Calendar className="w-4 h-4 text-zinc-400" />
          <div>
            <div className="text-lg font-semibold">
              {course.validity_months ? `${course.validity_months} mesi` : "Illimitata"}
            </div>
            <div className="text-xs text-zinc-500">Validità attestato</div>
          </div>
        </div>
        <div className="rounded-lg border bg-white px-4 py-3">
          <div className="text-lg font-semibold">{registrations.length}</div>
          <div className="text-xs text-zinc-500">Registrazioni totali</div>
        </div>
        <div className="rounded-lg border bg-white px-4 py-3">
          <div className={`text-lg font-semibold ${expiringRegistrations.filter(r => r.urgency === 'overdue').length > 0 ? 'text-red-600' : expiringRegistrations.length > 0 ? 'text-amber-600' : 'text-zinc-900'}`}>
            {expiringRegistrations.filter(r => r.urgency === 'overdue').length > 0
              ? expiringRegistrations.filter(r => r.urgency === 'overdue').length
              : expiringRegistrations.length}
          </div>
          <div className="text-xs text-zinc-500">
            {expiringRegistrations.filter(r => r.urgency === 'overdue').length > 0
              ? "Attestati scaduti"
              : "In scadenza (90gg)"}
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-zinc-200">
        {[
          { key: "registrazioni", label: `Registrazioni (${registrations.length})` },
          { key: "scadenze", label: `Scadenze (${expiringRegistrations.length})` },
        ].map((tab) => (
          <Link
            key={tab.key}
            href={`/training/${id}?tab=${tab.key}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Tab: Registrazioni */}
      {activeTab === "registrazioni" && (
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          {registrations.length === 0 ? (
            <div className="py-12 text-center">
              <GraduationCap className="mx-auto h-8 w-8 text-zinc-300" />
              <p className="mt-2 text-sm text-zinc-500">Nessuna registrazione per questo corso.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Collaboratore</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data completamento</TableHead>
                  <TableHead>Scadenza attestato</TableHead>
                  <TableHead>Stato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/personnel/${reg.personnelId}`}
                        className="hover:underline text-zinc-900"
                      >
                        {reg.personnelName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-zinc-500">{reg.clientName || "—"}</TableCell>
                    <TableCell>
                      {format(new Date(reg.completionDate), "dd MMM yyyy", { locale: it })}
                    </TableCell>
                    <TableCell>
                      {reg.expiryDate
                        ? format(new Date(reg.expiryDate), "dd MMM yyyy", { locale: it })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <UrgencyBadge urgency={reg.urgency} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Tab: Scadenze */}
      {activeTab === "scadenze" && (
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          {expiringRegistrations.length === 0 ? (
            <div className="py-12 text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-zinc-300" />
              <p className="mt-2 text-sm text-zinc-500">
                Nessun attestato in scadenza nei prossimi 90 giorni.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Collaboratore</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Scadenza attestato</TableHead>
                  <TableHead>Giorni rimanenti</TableHead>
                  <TableHead>Urgenza</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiringRegistrations
                  .sort((a, b) => (a.daysUntil ?? 999) - (b.daysUntil ?? 999))
                  .map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/personnel/${reg.personnelId}`}
                          className="hover:underline text-zinc-900"
                        >
                          {reg.personnelName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-zinc-500">{reg.clientName || "—"}</TableCell>
                      <TableCell>
                        {reg.expiryDate
                          ? format(new Date(reg.expiryDate), "dd MMM yyyy", { locale: it })
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {reg.daysUntil === null ? "—" : reg.daysUntil < 0
                          ? `Scaduta da ${Math.abs(reg.daysUntil)}gg`
                          : `${reg.daysUntil}gg`}
                      </TableCell>
                      <TableCell>
                        <UrgencyBadge urgency={reg.urgency} />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </section>
  );
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  if (urgency === "overdue")
    return (
      <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
        Scaduto
      </Badge>
    );
  if (urgency === "warning")
    return (
      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
        In scadenza
      </Badge>
    );
  if (urgency === "ok")
    return (
      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
        Valido
      </Badge>
    );
  return <span className="text-zinc-400 text-xs">—</span>;
}
