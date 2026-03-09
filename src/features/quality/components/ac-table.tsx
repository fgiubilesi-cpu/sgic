"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CorrectiveAction, ACStatus } from "../schemas/nc-ac.schema";
import { ACStatusBadge } from "./quality-badges";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Calendar } from "lucide-react";
import { updateAC } from "../actions/quality-actions";
import { useOptimistic } from "react";
import { toast } from "sonner";

export function ACTable({ acs, ncId }: { acs: any[], ncId: string }) {
    const [optimisticAcs, addOptimisticAc] = useOptimistic(
        acs,
        (state, updatedAc: any) =>
            state.map((ac) => (ac.id === updatedAc.id ? { ...ac, ...updatedAc } : ac))
    );

    async function handleStatusChange(ac: any, newStatus: ACStatus) {
        addOptimisticAc({ ...ac, status: newStatus });
        try {
            await updateAC(ac.id, ncId, { status: newStatus });
        } catch (error) {
            toast.error("Errore durante l'aggiornamento dello stato");
            console.error(error);
        }
    }

    if (!acs || acs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center bg-zinc-50/50">
                <Clock className="h-8 w-8 text-zinc-400" />
                <h4 className="mt-2 font-medium">Nessuna Azione Correttiva</h4>
                <p className="text-sm text-zinc-500">
                    Non sono state ancora aggiunte azioni correttive per questa NC.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Descrizione</TableHead>
                        <TableHead>Scadenza</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {optimisticAcs.map((ac) => (
                        <TableRow key={ac.id}>
                            <TableCell className="max-w-[300px] truncate">
                                {ac.description}
                            </TableCell>
                            <TableCell>
                                {ac.due_date ? (
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <Calendar className="h-3 w-3 text-muted-foreground" />
                                        {new Date(ac.due_date).toLocaleDateString("it-IT")}
                                    </div>
                                ) : "—"}
                            </TableCell>
                            <TableCell>
                                <ACStatusBadge status={ac.status} />
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    {ac.status === "open" && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleStatusChange(ac, "completed")}
                                        >
                                            Completa
                                        </Button>
                                    )}
                                    {/* Status is now final when completed, no verification step */}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
