"use client";

import { useState, useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { NonConformity } from "../schemas/nc-ac.schema";
import { SeverityBadge, NCStatusBadge } from "./quality-badges";
import { Button } from "@/components/ui/button";
import { ChevronRight, Calendar, AlertTriangle } from "lucide-react";
import Link from "next/link";

export function NCTable({ ncs }: { ncs: any[] }) {
    const [filterClient, setFilterClient] = useState<string>("");
    const [filterLocation, setFilterLocation] = useState<string>("");
    const [filterSeverity, setFilterSeverity] = useState<string>("");
    const [filterStatus, setFilterStatus] = useState<string>("");

    // Extract unique clients and locations
    const clients = useMemo(() => {
        const seen = new Set<string>();
        return ncs
            .filter(nc => nc.audit?.client?.name)
            .map(nc => nc.audit.client.name)
            .filter(name => {
                if (seen.has(name)) return false;
                seen.add(name);
                return true;
            })
            .sort();
    }, [ncs]);

    const locations = useMemo(() => {
        const seen = new Set<string>();
        return ncs
            .filter(nc => nc.audit?.location?.name)
            .map(nc => nc.audit.location.name)
            .filter(name => {
                if (seen.has(name)) return false;
                seen.add(name);
                return true;
            })
            .sort();
    }, [ncs]);

    // Filter NCs based on selected filters
    const filteredNCs = useMemo(() => {
        return (ncs || []).filter(nc => {
            if (filterClient && nc.audit?.client?.name !== filterClient) return false;
            if (filterLocation && nc.audit?.location?.name !== filterLocation) return false;
            if (filterSeverity && nc.severity !== filterSeverity) return false;
            if (filterStatus && nc.status !== filterStatus) return false;
            return true;
        });
    }, [ncs, filterClient, filterLocation, filterSeverity, filterStatus]);

    // Check if NC has overdue corrective actions
    const isNCOverdue = (nc: any): boolean => {
        if (!nc.corrective_actions || nc.corrective_actions.length === 0) return false;
        const now = new Date();
        return nc.corrective_actions.some((ca: any) => {
            if (ca.status === "completed") return false;
            const targetDate = new Date(ca.target_completion_date);
            return targetDate < now;
        });
    };

    if (!ncs || ncs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
                    <ChevronRight className="h-6 w-6 text-zinc-400" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Nessuna Non Conformità</h3>
                <p className="mt-2 text-sm text-zinc-500">
                    Non sono state ancora registrate Non Conformità (NC) per la tua organizzazione.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Cliente</label>
                    <Select value={filterClient} onValueChange={setFilterClient}>
                        <SelectTrigger className="h-9 bg-white">
                            <SelectValue placeholder="Tutti" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Tutti</SelectItem>
                            {clients.map((client) => (
                                <SelectItem key={client} value={client}>{client}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Sede</label>
                    <Select value={filterLocation} onValueChange={setFilterLocation}>
                        <SelectTrigger className="h-9 bg-white">
                            <SelectValue placeholder="Tutti" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Tutti</SelectItem>
                            {locations.map((location) => (
                                <SelectItem key={location} value={location}>{location}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Gravità</label>
                    <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                        <SelectTrigger className="h-9 bg-white">
                            <SelectValue placeholder="Tutte" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Tutte</SelectItem>
                            <SelectItem value="minor">Minor</SelectItem>
                            <SelectItem value="major">Major</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Stato</label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="h-9 bg-white">
                            <SelectValue placeholder="Tutti" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Tutti</SelectItem>
                            <SelectItem value="open">Aperta</SelectItem>
                            <SelectItem value="in_progress">In Corso</SelectItem>
                            <SelectItem value="closed">Chiusa</SelectItem>
                            <SelectItem value="on_hold">Sospesa</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Titolo</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Gravità</TableHead>
                            <TableHead>Stato</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredNCs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                    Nessun risultato
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredNCs.map((nc) => {
                                const isOverdue = isNCOverdue(nc);
                                return (
                                    <TableRow key={nc.id} className={isOverdue ? "bg-red-50 hover:bg-red-100" : ""}>
                                        <TableCell className="font-medium">
                                            {isOverdue && <AlertTriangle className="h-4 w-4 text-red-600 inline mr-2" />}
                                            {nc.title}
                                        </TableCell>
                                        <TableCell className="text-sm">{nc.audit?.client?.name || "-"}</TableCell>
                                        <TableCell>
                                            <SeverityBadge severity={nc.severity} />
                                        </TableCell>
                                        <TableCell>
                                            <NCStatusBadge status={nc.status} />
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                                {new Date(nc.identified_date).toLocaleDateString("it-IT")}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/non-conformities/${nc.id}`}>
                                                    <ChevronRight className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
