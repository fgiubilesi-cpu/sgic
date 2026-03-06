import { getNCList } from "@/features/quality/actions/quality-actions";
import { NCTable } from "@/features/quality/components/nc-table";
import { NCForm } from "@/features/quality/components/nc-form";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plus, ShieldAlert } from "lucide-react";

export default async function NonConformitiesPage() {
    const ncs = await getNCList();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="h-6 w-6 text-red-500" />
                        <h1 className="text-3xl font-bold tracking-tight">Non Conformità</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Gestione e monitoraggio delle Non Conformità (NC) rilevate.
                    </p>
                </div>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuova NC
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-md">
                        <SheetHeader>
                            <SheetTitle>Nuova Non Conformità</SheetTitle>
                            <SheetDescription>
                                Inserisci i dettagli della Non Conformità rilevata per avviare il processo di gestione.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="py-6">
                            <NCForm />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            <NCTable ncs={ncs} />
        </div>
    );
}
