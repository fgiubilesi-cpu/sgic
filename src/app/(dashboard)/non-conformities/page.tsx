"use client";

import { useState, useEffect } from "react";
import { getOpenNCList, getClientsList } from "@/features/quality/actions/quality-actions";
import { getClients } from "@/features/clients/queries/get-clients";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, ShieldAlert, Filter } from "lucide-react";

// N6: Global NC Dashboard with client filtering
export default function NonConformitiesPage() {
    const [ncs, setNcs] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [openNCs, clientsList] = await Promise.all([
                    getOpenNCList(selectedClientId || undefined),
                    getClientsList(),
                ]);
                setNcs(openNCs || []);
                setClients(clientsList || []);
            } catch (error) {
                console.error("Error fetching data:", error);
                setNcs([]);
                setClients([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [selectedClientId]);

    const openNCCount = ncs.length;
    const uniqueClientsWithNC = new Set(ncs.map(nc => nc.audit?.client_id)).size;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="h-6 w-6 text-red-500" />
                        <h1 className="text-3xl font-bold tracking-tight">Non Conformità Globale</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Dashboard globale: {openNCCount} NC aperte · {uniqueClientsWithNC} clienti interessati
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

            {/* N6: Client Filter */}
            <div className="flex items-center gap-2 bg-white p-4 rounded-lg border border-zinc-200">
                <Filter className="w-4 h-4 text-zinc-500" />
                <span className="text-sm font-medium text-zinc-600">Filtra per cliente:</span>
                <Select value={selectedClientId || "all"} onValueChange={(value) => {
                    setSelectedClientId(value === "all" ? null : value);
                }}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Tutti i clienti" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tutti i clienti ({clients.length})</SelectItem>
                        {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                                {client.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                <div className="text-center py-8 text-zinc-500">Caricamento...</div>
            ) : (
                <NCTable ncs={ncs} />
            )}
        </div>
    );
}
