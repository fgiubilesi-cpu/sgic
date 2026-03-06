import { getPersonnelDetail } from "@/features/personnel/actions/personnel-actions";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, GraduationCap, Calendar, CreditCard, Briefcase } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { TrainingRecordTable } from "@/features/training/components/training-record-table";

type PageProps = {
    params: Promise<{ id: string }>;
};

export default async function PersonnelDetailPage({ params }: PageProps) {
    const { id } = await params;
    const person = await getPersonnelDetail(id);

    if (!person) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/personnel">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {person.first_name} {person.last_name}
                    </h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        <span>{person.role}</span>
                        <span className="text-zinc-300">|</span>
                        <Badge
                            variant="outline"
                            className={
                                person.is_active
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-zinc-200 bg-zinc-50 text-zinc-500"
                            }
                        >
                            {person.is_active ? "Attivo" : "Inattivo"}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Info Card */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg">Informazioni Personali</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <CreditCard className="h-4 w-4 text-zinc-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-zinc-500 uppercase font-semibold">Codice Fiscale</span>
                                <span className="font-mono">{person.tax_code}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-zinc-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-zinc-500 uppercase font-semibold">Data Assunzione</span>
                                <span>{format(new Date(person.hire_date), "dd MMMM yyyy", { locale: it })}</span>
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
                                Elenco dei corsi completati e certificazioni ottenute.
                            </CardDescription>
                        </div>
                        <GraduationCap className="h-5 w-5 text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <TrainingRecordTable records={person.training_records as any} showPerson={false} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
