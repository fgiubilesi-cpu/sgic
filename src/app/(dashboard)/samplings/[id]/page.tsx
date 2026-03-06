import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Calendar, MapPin, Beaker, User } from "lucide-react";
import Link from "next/link";
import { LabResultsTable } from "@/features/samplings/components/lab-results-table";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function SamplingDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const profileRes = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

    const profile = profileRes.data as { organization_id: string | null } | null;
    const organizationId = profile?.organization_id;
    if (!organizationId) redirect("/onboarding");

    // Fetch Sampling
    const samplingRes = await (supabase
        .from("samplings")
        .select("*")
        .eq("id", id)
        .eq("organization_id", organizationId)
        .single() as any);

    if (!samplingRes.data) notFound();

    const sampling = samplingRes.data;

    // Fetch Lab Results
    const resultsRes = await (supabase
        .from("lab_results")
        .select("*")
        .eq("sampling_id", id)
        .order("created_at", { ascending: false }) as any);

    const labResults = resultsRes.data || [];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "planned":
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Programmato</Badge>;
            case "sampled":
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Campionato</Badge>;
            case "sent_to_lab":
                return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Inviato al Lab</Badge>;
            case "completed":
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completato</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/samplings">
                        <ChevronLeft className="w-4 h-4" />
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">{sampling.title}</h1>
                {getStatusBadge(sampling.status)}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Info Card */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg">Informazioni Generali</CardTitle>
                        <CardDescription>Dettagli relativi al campionamento</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 text-sm">
                            <Beaker className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">Matrice:</span>
                            <span>{sampling.matrix}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">Data:</span>
                            <span>{format(new Date(sampling.sampling_date), "PPP", { locale: it })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">Luogo:</span>
                            <span>{sampling.location || "Non specificato"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">Operatore:</span>
                            <span>{sampling.operator_name || "Non specificato"}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Lab Results Table */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Risultati di Laboratorio</CardTitle>
                        <CardDescription>Inserisci e visualizza i parametri analizzati</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LabResultsTable
                            samplingId={id}
                            initialResults={labResults}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
