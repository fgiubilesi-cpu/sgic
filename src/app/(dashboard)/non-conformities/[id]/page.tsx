import { getNCDetail } from "@/features/quality/actions/quality-actions";
import { NCDetailInfo } from "@/features/quality/components/nc-detail-info";
import { ACTable } from "@/features/quality/components/ac-table";
import { ACForm } from "@/features/quality/components/ac-form";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plus, ShieldCheck, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function NonConformityDetailPage({ params }: PageProps) {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const nc = await getNCDetail(id);

    if (!nc) {
        notFound();
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/non-conformities">
                            <ChevronLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Dettaglio NC</h1>
                        <p className="text-sm text-muted-foreground">ID: {nc.id}</p>
                    </div>
                </div>

                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="default">
                            <Plus className="mr-2 h-4 w-4" />
                            Aggiungi Azione Correttiva
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-md">
                        <SheetHeader>
                            <SheetTitle>Nuova Azione Correttiva (AC)</SheetTitle>
                            <SheetDescription>
                                Definisci l'azione da intraprendere per risolvere questa Non Conformità.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="py-6">
                            <ACForm ncId={nc.id} />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            <NCDetailInfo nc={nc} />

            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                    <h2 className="text-xl font-bold tracking-tight">Azioni Correttive</h2>
                </div>
                <ACTable acs={nc.corrective_actions || []} ncId={nc.id} />
            </div>
        </div>
    );
}
