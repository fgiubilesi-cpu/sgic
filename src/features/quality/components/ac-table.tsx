"use client";

import { useMemo, useOptimistic } from "react";

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
import { Clock, Calendar } from "lucide-react";
import { updateAC } from "../actions/quality-actions";
import { toast } from "sonner";
import {
    countOpenCorrectiveActions,
    countOverdueCorrectiveActions,
    getCorrectiveActionDeadline,
    getNextCorrectiveActionDeadline,
} from "../lib/quality-process";

type CorrectiveActionRow = CorrectiveAction & {
    due_date?: string | null;
    id: string;
    status: ACStatus;
    target_completion_date?: string | null;
};

export function ACTable({ acs, ncId }: { acs: CorrectiveActionRow[]; ncId: string }) {
    const [optimisticAcs, addOptimisticAc] = useOptimistic(
        acs,
        (state, updatedAc: CorrectiveActionRow) =>
            state.map((ac) => (ac.id === updatedAc.id ? { ...ac, ...updatedAc } : ac))
    );

    async function handleStatusChange(ac: CorrectiveActionRow, newStatus: ACStatus) {
        addOptimisticAc({ ...ac, status: newStatus });
        try {
            await updateAC(ac.id, ncId, { status: newStatus });
            toast.success("Azione correttiva aggiornata");
        } catch (error) {
            toast.error("Errore durante l'aggiornamento dello stato");
            console.error(error);
        }
    }

    const summary = useMemo(() => {
        const openCount = countOpenCorrectiveActions(optimisticAcs);
        const overdueCount = countOverdueCorrectiveActions(optimisticAcs);
        const nextDeadline = getNextCorrectiveActionDeadline(optimisticAcs);

        return {
            nextDeadline,
            openCount,
            overdueCount,
        };
    }, [optimisticAcs]);

    const toDateLabel = (value: string | null | undefined) => {
        if (!value) return "—";
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("it-IT");
    };

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
        <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Aperte</p>
                    <p className="mt-1 text-2xl font-semibold">{summary.openCount}</p>
                </div>
                <div className="rounded-lg border bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">In ritardo</p>
                    <p className="mt-1 text-2xl font-semibold text-red-600">{summary.overdueCount}</p>
                </div>
                <div className="rounded-lg border bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Prossima scadenza</p>
                    <p className="mt-1 text-lg font-semibold">{toDateLabel(summary.nextDeadline)}</p>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Azione</TableHead>
                            <TableHead>Scadenza</TableHead>
                            <TableHead>Stato</TableHead>
                            <TableHead className="text-right">Chiusura</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {optimisticAcs.map((ac) => {
                            const deadline = getCorrectiveActionDeadline(ac);
                            const isOverdue = ac.status !== "completed" && deadline !== null
                                ? new Date(deadline) < new Date()
                                : false;

                            return (
                                <TableRow key={ac.id} className={isOverdue ? "bg-red-50 hover:bg-red-100" : ""}>
                                    <TableCell className="max-w-[360px]">
                                        <div className="space-y-1">
                                            <p className="font-medium leading-snug">{ac.description}</p>
                                            {isOverdue ? (
                                                <p className="text-xs text-red-600">Azione oltre la data obiettivo.</p>
                                            ) : null}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-xs">
                                            <Calendar className="h-3 w-3 text-muted-foreground" />
                                            {toDateLabel(deadline)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <ACStatusBadge status={ac.status} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {ac.status !== "completed" ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleStatusChange(ac, "completed")}
                                                >
                                                    Segna completata
                                                </Button>
                                            ) : null}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
