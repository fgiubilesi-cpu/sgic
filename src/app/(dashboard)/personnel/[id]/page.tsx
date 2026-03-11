import { getPersonnelDetail } from "@/features/personnel/actions/personnel-actions";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, GraduationCap, Calendar, CreditCard, Briefcase, Building2, Mail, MapPin, TriangleAlert, ShieldCheck, Clock3 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { TrainingRecordTable } from "@/features/training/components/training-record-table";
import { PersonnelOperationalBadge } from "@/features/personnel/components/personnel-operational-badge";
import { PersonnelStateToggleButton } from "@/features/personnel/components/personnel-state-toggle-button";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import { getTrainingCourses } from "@/features/training/queries/get-training-courses";
import { RegisterTrainingSheet } from "@/features/training/components/register-training-sheet";
import { CreateCourseSheet } from "@/features/training/components/create-course-sheet";
import { getClientOptions } from "@/features/clients/queries/get-client-options";
import { getPersonnelList } from "@/features/personnel/queries/get-personnel";
import { getDocuments } from "@/features/documents/queries/get-documents";
import { DocumentsTable } from "@/features/documents/components/documents-table";
import { ManageDocumentSheet } from "@/features/documents/components/manage-document-sheet";

type PageProps = {
    params: Promise<{ id: string }>;
};

export default async function PersonnelDetailPage({ params }: PageProps) {
    const { id } = await params;
    const ctx = await getOrganizationContext();
    const person = await getPersonnelDetail(id);

    if (!person) {
        notFound();
    }

    if (!ctx) {
        notFound();
    }

    const [courses, clientOptions, personnelOptions, documents] = await Promise.all([
        getTrainingCourses(ctx.organizationId),
        getClientOptions(ctx.organizationId),
        getPersonnelList(ctx.organizationId, person.client_id ?? undefined),
        getDocuments({
            organizationId: ctx.organizationId,
            personnelIds: [person.id],
        }),
    ]);

    const personnelSeed = [
        {
            id: person.id,
            organization_id: person.organization_id,
            first_name: person.first_name,
            last_name: person.last_name,
            role: person.role,
            tax_code: person.tax_code,
            hire_date: person.hire_date,
            is_active: person.is_active,
            created_at: null,
            email: person.email,
            client_id: person.client_id,
            location_id: person.location_id,
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={person.client_id ? `/clients/${person.client_id}` : "/clients"}>
                        <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {person.first_name} {person.last_name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                            <Briefcase className="h-4 w-4" />
                            <span>{person.role || "Ruolo non definito"}</span>
                            <span className="text-zinc-300">|</span>
                            <PersonnelOperationalBadge status={person.operational_status} />
                            {person.training_expired_count > 0 ? (
                                <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
                                    {person.training_expired_count} scadenze bloccanti
                                </Badge>
                            ) : null}
                            {person.training_expiring_count > 0 ? (
                                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                                    {person.training_expiring_count} in scadenza
                                </Badge>
                            ) : null}
                        </div>
                    </div>
                </div>
                <PersonnelStateToggleButton isActive={person.is_active} personnelId={person.id} />
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Card className="border-zinc-200 bg-white/90 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                            Stato operativo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-emerald-600" />
                        <div>
                            <PersonnelOperationalBadge status={person.operational_status} />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-zinc-200 bg-white/90 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                            Formazione scaduta
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-3">
                        <TriangleAlert className="h-5 w-5 text-rose-600" />
                        <div className="text-2xl font-semibold text-rose-700">{person.training_expired_count}</div>
                    </CardContent>
                </Card>
                <Card className="border-zinc-200 bg-white/90 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                            In scadenza
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-3">
                        <Clock3 className="h-5 w-5 text-amber-600" />
                        <div className="text-2xl font-semibold text-amber-700">{person.training_expiring_count}</div>
                    </CardContent>
                </Card>
                <Card className="border-zinc-200 bg-white/90 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                            Prossima scadenza
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-semibold text-zinc-900">
                            {person.next_expiry_date
                                ? format(new Date(person.next_expiry_date), "dd MMM yyyy", { locale: it })
                                : "Nessuna"}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Info Card */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg">Profilo Collaboratore</CardTitle>
                        <CardDescription>Dati anagrafici, collocazione e stato operativo.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-zinc-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-zinc-500 uppercase font-semibold">Email</span>
                                <span>{person.email || "-"}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Building2 className="h-4 w-4 text-zinc-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-zinc-500 uppercase font-semibold">Cliente</span>
                                <span>{person.client_name || "-"}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-zinc-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-zinc-500 uppercase font-semibold">Sede</span>
                                <span>{person.location_name || "-"}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <CreditCard className="h-4 w-4 text-zinc-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-zinc-500 uppercase font-semibold">Codice Fiscale</span>
                                <span className="font-mono">{person.tax_code || "-"}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-zinc-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-zinc-500 uppercase font-semibold">Data Ingresso</span>
                                <span>
                                    {person.hire_date
                                        ? format(new Date(person.hire_date), "dd MMMM yyyy", { locale: it })
                                        : "-"}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <User className="h-4 w-4 text-zinc-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-zinc-500 uppercase font-semibold">ID Sistema</span>
                                <span className="text-xs text-zinc-400 truncate w-48">{person.id}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Training History */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-lg">Storico Formazione</CardTitle>
                            <CardDescription>
                                Elenco dei corsi completati e delle scadenze che influenzano lo stato operativo.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <CreateCourseSheet />
                            <RegisterTrainingSheet
                                courses={courses}
                                defaultPersonnelId={person.id}
                                personnel={personnelSeed}
                                triggerLabel="Registra Corso"
                            />
                            <GraduationCap className="h-5 w-5 text-zinc-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <TrainingRecordTable records={person.training_records as any} showPerson={false} />
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Timeline Operativa</CardTitle>
                        <CardDescription>
                            Eventi principali che impattano l&apos;operativita del collaboratore.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {person.timeline.length === 0 ? (
                            <p className="text-sm text-zinc-500">Nessun evento operativo registrato.</p>
                        ) : (
                            <div className="space-y-4">
                                {person.timeline.map((event, index) => (
                                    <div key={`${event.title}-${event.date}-${index}`} className="flex gap-4">
                                        <div className="flex w-24 shrink-0 flex-col text-xs text-zinc-500">
                                            <span>{format(new Date(event.date), "dd MMM yyyy", { locale: it })}</span>
                                        </div>
                                        <div className="flex-1 rounded-lg border border-zinc-200 p-3">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={
                                                        event.tone === "danger"
                                                            ? "h-2.5 w-2.5 rounded-full bg-rose-500"
                                                            : event.tone === "warning"
                                                            ? "h-2.5 w-2.5 rounded-full bg-amber-500"
                                                            : "h-2.5 w-2.5 rounded-full bg-emerald-500"
                                                    }
                                                />
                                                <p className="font-medium text-zinc-900">{event.title}</p>
                                            </div>
                                            <p className="mt-1 text-sm text-zinc-600">{event.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                        <CardTitle className="text-lg">Sintesi Scadenze</CardTitle>
                        <CardDescription>
                            Lettura rapida per capire se il collaboratore e pronto, da monitorare o da sospendere.
                        </CardDescription>
                        </div>
                        <ManageDocumentSheet
                            clientOptions={clientOptions}
                            defaultClientId={person.client_id ?? undefined}
                            defaultLocationId={person.location_id ?? undefined}
                            defaultPersonnelId={person.id}
                            personnelOptions={personnelOptions}
                            triggerLabel="Nuovo Documento"
                        />
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="rounded-lg border border-zinc-200 p-3">
                            <p className="font-medium text-zinc-900">Formazione completata</p>
                            <p className="mt-1 text-zinc-600">
                                {person.training_records.length > 0
                                    ? `${person.training_records.length} corsi registrati nello storico.`
                                    : "Nessun corso registrato: conviene completare il profilo formativo."}
                            </p>
                        </div>
                        <div className="rounded-lg border border-zinc-200 p-3">
                            <p className="font-medium text-zinc-900">Criticita immediate</p>
                            <p className="mt-1 text-zinc-600">
                                {person.training_expired_count > 0
                                    ? `${person.training_expired_count} corsi scaduti: lo stato operativo viene considerato sospeso.`
                                    : "Nessuna scadenza bloccante registrata."}
                            </p>
                        </div>
                        <div className="rounded-lg border border-zinc-200 p-3">
                            <p className="font-medium text-zinc-900">Monitoraggio breve termine</p>
                            <p className="mt-1 text-zinc-600">
                                {person.training_expiring_count > 0
                                    ? `${person.training_expiring_count} corsi scadono entro 30 giorni.`
                                    : "Nessuna scadenza imminente nei prossimi 30 giorni."}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle className="text-lg">Documenti Collaboratore</CardTitle>
                        <CardDescription>
                            Certificati, attestati e allegati individuali collegati al collaboratore.
                        </CardDescription>
                    </div>
                    <ManageDocumentSheet
                        clientOptions={clientOptions}
                        defaultClientId={person.client_id ?? undefined}
                        defaultLocationId={person.location_id ?? undefined}
                        defaultPersonnelId={person.id}
                        personnelOptions={personnelOptions}
                        triggerLabel="Nuovo Documento"
                    />
                </CardHeader>
                <CardContent>
                    <DocumentsTable
                        clientOptions={clientOptions}
                        documents={documents}
                        emptyMessage="Nessun documento personale collegato a questo collaboratore."
                        personnelOptions={personnelOptions}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
