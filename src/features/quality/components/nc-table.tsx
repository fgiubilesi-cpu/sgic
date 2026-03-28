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
import {
    getNonConformityActionSummary,
    getNonConformityProcessPressure,
    getObservedDate,
} from "../lib/quality-process";

type NCTableRecord = NonConformity & {
    audit?: {
        client?: { name?: string | null } | null;
        location?: { name?: string | null } | null;
    } | null;
    corrective_actions?: Array<{
        due_date?: string | null;
        status: string;
        target_completion_date: string | null;
    }> | null;
    created_at?: string | null;
    id: string;
    identified_date?: string | null;
};

export function NCTable({ ncs }: { ncs: NCTableRecord[] }) {
    const [filterLocation, setFilterLocation] = useState<string>("");
    const [filterSeverity, setFilterSeverity] = useState<string>("");
    const [filterPressure, setFilterPressure] = useState<string>("");

    const locations = useMemo(() => {
        const seen = new Set<string>();
        return ncs.reduce<string[]>((items, nc) => {
            const locationName = nc.audit?.location?.name;
            if (!locationName || seen.has(locationName)) return items;
            seen.add(locationName);
            items.push(locationName);
            return items;
        }, []).sort();
    }, [ncs]);

    // Filter NCs based on selected filters
    const filteredNCs = useMemo(() => {
        return (ncs || []).filter(nc => {
            if (filterLocation && nc.audit?.location?.name !== filterLocation) return false;
            if (filterSeverity && nc.severity !== filterSeverity) return false;
            if (filterPressure && getNonConformityProcessPressure(nc) !== filterPressure) return false;
            return true;
        });
    }, [ncs, filterLocation, filterSeverity, filterPressure]);

    const toDateLabel = (value: string | null | undefined) => {
        if (!value) return "—";
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("it-IT");
    };

    const pressureLabel = (pressure: ReturnType<typeof getNonConformityProcessPressure>) => {
        if (pressure === "overdue") return "AC in ritardo";
        if (pressure === "unplanned") return "Da pianificare";
        if (pressure === "ready_for_verification") return "Pronta per verifica";
        return "In esecuzione";
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
            <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
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
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Pressione operativa</label>
                    <Select value={filterPressure} onValueChange={setFilterPressure}>
                        <SelectTrigger className="h-9 bg-white">
                            <SelectValue placeholder="Tutte" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Tutte</SelectItem>
                            <SelectItem value="overdue">AC in ritardo</SelectItem>
                            <SelectItem value="unplanned">Da pianificare</SelectItem>
                            <SelectItem value="in_execution">In esecuzione</SelectItem>
                            <SelectItem value="ready_for_verification">Pronte per verifica</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>NC</TableHead>
                            <TableHead>Priorità</TableHead>
                            <TableHead>Azioni correttive</TableHead>
                            <TableHead>Rilevata</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredNCs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    Nessun risultato
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredNCs.map((nc) => {
                                const pressure = getNonConformityProcessPressure(nc);
                                const actionSummary = getNonConformityActionSummary(nc);
                                const observedDate = getObservedDate(nc);
                                const contextLabel = [nc.audit?.client?.name, nc.audit?.location?.name].filter(Boolean).join(" · ");

                                const rowClassName =
                                    pressure === "overdue"
                                        ? "bg-red-50 hover:bg-red-100"
                                        : pressure === "unplanned"
                                            ? "bg-amber-50 hover:bg-amber-100"
                                            : "";

                                return (
                                    <TableRow key={nc.id} className={rowClassName}>
                                        <TableCell className="font-medium">
                                            <div className="space-y-1">
                                                <div className="flex items-start gap-2">
                                                    {pressure === "overdue" ? <AlertTriangle className="mt-0.5 h-4 w-4 text-red-600" /> : null}
                                                    <div>
                                                        <p className="font-medium leading-snug">{nc.title}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {contextLabel || "Cliente non associato"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-2">
                                                <SeverityBadge severity={nc.severity} />
                                                <p className="text-xs text-muted-foreground">{pressureLabel(pressure)}</p>
                                                <NCStatusBadge status={nc.status} />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            <div className="space-y-1">
                                                <p className="font-medium">{actionSummary.label}</p>
                                                {actionSummary.detail ? (
                                                    <p
                                                        className={
                                                            actionSummary.tone === "critical"
                                                                ? "text-xs text-red-600"
                                                                : actionSummary.tone === "success"
                                                                    ? "text-xs text-emerald-600"
                                                                    : "text-xs text-muted-foreground"
                                                        }
                                                    >
                                                        {actionSummary.detail}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                                {toDateLabel(observedDate)}
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
