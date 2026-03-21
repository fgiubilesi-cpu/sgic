import { redirect } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import { getTrainingCourses, getTrainingRecords } from "@/features/training/queries/get-training-courses";
import { getPersonnelList } from "@/features/personnel/queries/get-personnel";
import { CreateCourseSheet } from "@/features/training/components/create-course-sheet";
import { RegisterTrainingSheet } from "@/features/training/components/register-training-sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TrainingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await getOrganizationContext();
  if (!ctx) redirect("/login");

  const params = await searchParams;
  const clientFilter = typeof params.client === "string" ? params.client : undefined;

  const [courses, records, personnel] = await Promise.all([
    getTrainingCourses(ctx.organizationId, clientFilter),
    getTrainingRecords(ctx.organizationId, clientFilter),
    getPersonnelList(ctx.organizationId, clientFilter),
  ]);

  const expiredCount = records.filter(
    (r) => r.expiry_date && new Date(r.expiry_date) < new Date(),
  ).length;
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);
  const expiringCount = records.filter((r) => {
    if (!r.expiry_date) return false;
    const exp = new Date(r.expiry_date);
    return exp >= new Date() && exp <= in30;
  }).length;

  const personnelSeed = personnel.map((p) => ({
    id: p.id,
    organization_id: p.organization_id,
    first_name: p.first_name,
    last_name: p.last_name,
    role: p.role,
    tax_code: p.tax_code,
    hire_date: p.hire_date,
    is_active: p.is_active,
    created_at: null,
    email: p.email,
    client_id: p.client_id,
    location_id: p.location_id,
  }));

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Formazione
          </h1>
          <p className="max-w-2xl text-sm text-zinc-500">
            Corsi, registrazioni e scadenze attestati per il personale dei clienti.
          </p>
        </div>
        <div className="flex gap-2">
          <CreateCourseSheet />
          <RegisterTrainingSheet
            courses={courses}
            personnel={personnelSeed}
            triggerLabel="Registra Corso"
          />
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-white px-4 py-3">
          <div className="text-2xl font-semibold">{courses.length}</div>
          <div className="text-xs text-zinc-500">Corsi disponibili</div>
        </div>
        <div className="rounded-lg border bg-white px-4 py-3">
          <div className="text-2xl font-semibold">{records.length}</div>
          <div className="text-xs text-zinc-500">Registrazioni totali</div>
        </div>
        <div className="rounded-lg border bg-white px-4 py-3">
          <div className="text-2xl font-semibold text-rose-600">{expiredCount}</div>
          <div className="text-xs text-zinc-500">Attestati scaduti</div>
        </div>
        <div className="rounded-lg border bg-white px-4 py-3">
          <div className="text-2xl font-semibold text-amber-600">{expiringCount}</div>
          <div className="text-xs text-zinc-500">In scadenza (30gg)</div>
        </div>
      </div>

      {/* Courses catalog */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Catalogo Corsi</CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="py-6 text-center">
              <GraduationCap className="mx-auto h-8 w-8 text-zinc-300" />
              <p className="mt-2 text-sm text-zinc-500">Nessun corso registrato.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titolo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Durata (h)</TableHead>
                  <TableHead>Validità (mesi)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/training/${course.id}`}
                        className="hover:underline text-zinc-900"
                      >
                        {course.title}
                      </Link>
                    </TableCell>
                    <TableCell>{course.category ?? "-"}</TableCell>
                    <TableCell>{course.duration_hours}</TableCell>
                    <TableCell>{course.validity_months ?? "Illimitata"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent records */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registrazioni Recenti</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-500">Nessuna registrazione.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Collaboratore</TableHead>
                  <TableHead>Corso</TableHead>
                  <TableHead>Completamento</TableHead>
                  <TableHead>Scadenza</TableHead>
                  <TableHead>Stato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.slice(0, 50).map((record) => {
                  const isExpired =
                    record.expiry_date && new Date(record.expiry_date) < new Date();
                  return (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.personnel_name}</TableCell>
                      <TableCell>{record.course_title}</TableCell>
                      <TableCell>
                        {format(new Date(record.completion_date), "dd MMM yyyy", {
                          locale: it,
                        })}
                      </TableCell>
                      <TableCell>
                        {record.expiry_date
                          ? format(new Date(record.expiry_date), "dd MMM yyyy", {
                              locale: it,
                            })
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            isExpired
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700"
                          }
                        >
                          {isExpired ? "Scaduto" : "Valido"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
