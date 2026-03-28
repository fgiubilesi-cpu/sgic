"use client";

import { useState, useEffect } from "react";
import { getOpenNCList, getClientsList } from "@/features/quality/actions/quality-actions";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getNonConformityOverviewMetrics } from "@/features/quality/lib/quality-process";

type OpenNCListItem = NonNullable<Awaited<ReturnType<typeof getOpenNCList>>>[number];
type ClientListItem = NonNullable<Awaited<ReturnType<typeof getClientsList>>>[number];

// N6: Global NC Dashboard with client filtering
export default function NonConformitiesPage() {
    const [ncs, setNcs] = useState<OpenNCListItem[]>([]);
    const [clients, setClients] = useState<ClientListItem[]>([]);
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

    const metrics = getNonConformityOverviewMetrics(ncs);
    const uniqueClientsWithNC = new Set(ncs.map(nc => nc.audit?.client_id).filter(Boolean)).size;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="h-6 w-6 text-red-500" />
                        <h1 className="text-3xl font-bold tracking-tight">Non Conformità Attive</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Vista di triage sulle NC aperte: focus su criticità, ritardi e pratiche senza piano.
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

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">NC aperte</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-semibold">{metrics.total}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Critiche</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-semibold text-red-600">{metrics.critical}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">AC in ritardo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-semibold text-red-600">{metrics.overdue}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Da pianificare</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-semibold text-amber-600">{metrics.unplanned}</p>
                        <p className="text-xs text-muted-foreground">{uniqueClientsWithNC} clienti impattati</p>
                    </CardContent>
                </Card>
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
