"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NCStatus } from "../schemas/nc-ac.schema";
import { SeverityBadge, NCStatusBadge } from "./quality-badges";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateNC } from "../actions/quality-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useOptimistic, useState } from "react";
import {
    countCompletedCorrectiveActions,
    countOpenCorrectiveActions,
    countOverdueCorrectiveActions,
    getNextCorrectiveActionDeadline,
    getObservedDate,
} from "../lib/quality-process";

type CorrectiveActionStatusRow = {
    due_date?: string | null;
    status: string;
    target_completion_date?: string | null;
};

type NcDetailRecord = {
    corrective_actions?: CorrectiveActionStatusRow[] | null;
    created_at: string;
    description: string;
    id: string;
    identified_date: string;
    severity: "critical" | "major" | "minor";
    status: NCStatus;
    title: string;
};

export function NCDetailInfo({ nc }: { nc: NcDetailRecord }) {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const [optimisticStatus, setOptimisticStatus] = useOptimistic(
        nc.status as NCStatus,
        (state, newStatus: NCStatus) => newStatus
    );

    const allAcCompleted = (nc.corrective_actions?.length ?? 0) > 0 &&
        (nc.corrective_actions ?? []).every((ac) => ac.status === "completed");
    const completedActions = countCompletedCorrectiveActions(nc.corrective_actions);
    const openActions = countOpenCorrectiveActions(nc.corrective_actions);
    const overdueActions = countOverdueCorrectiveActions(nc.corrective_actions);
    const nextDeadline = getNextCorrectiveActionDeadline(nc.corrective_actions);
    const observedDate = getObservedDate(nc);
    const totalActions = nc.corrective_actions?.length ?? 0;

    const toDateLabel = (value: string | null | undefined) => {
        if (!value) return "—";
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("it-IT");
    };

    async function handleStatusChange(newStatus: NCStatus) {
        if (newStatus === "closed" && !allAcCompleted) {
            toast.error("Impossibile chiudere la NC se ci sono azioni correttive ancora aperte");
            return;
        }

        setIsPending(true);
        setOptimisticStatus(newStatus);
        try {
            await updateNC(nc.id, { status: newStatus });
            toast.success("Stato aggiornato");
            router.refresh();
        } catch (error) {
            toast.error("Errore durante l'aggiornamento dello stato");
            console.error(error);
        } finally {
            setIsPending(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Stato</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <NCStatusBadge status={optimisticStatus} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Gravità</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SeverityBadge severity={nc.severity} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Avanzamento AC</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold">{completedActions} / {totalActions}</p>
                        <p className="text-xs text-muted-foreground">
                            {openActions > 0 ? `${openActions} ancora aperte` : "Nessuna azione aperta"}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pressione</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className={overdueActions > 0 ? "text-2xl font-semibold text-red-600" : "text-2xl font-semibold"}>
                            {overdueActions > 0 ? `${overdueActions} ritardo` : toDateLabel(nextDeadline)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {overdueActions > 0 ? "Serve riallineare le azioni correttive." : "Prossima data obiettivo"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-xl">Contesto operativo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Descrizione</h4>
                            <p className="whitespace-pre-wrap text-zinc-700">{nc.description}</p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Data rilevazione</h4>
                                <p>{toDateLabel(observedDate)}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Creato il</h4>
                                <p>{toDateLabel(nc.created_at)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Workflow</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Segnali da presidiare</p>
                            {totalActions === 0 ? (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                    Nessuna azione correttiva definita: prima di chiudere serve un piano minimo.
                                </div>
                            ) : overdueActions > 0 ? (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                                    Ci sono {overdueActions} azioni correttive in ritardo da riallineare.
                                </div>
                            ) : allAcCompleted ? (
                                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                                    Tutte le azioni correttive sono completate: puoi portare la NC a chiusura.
                                </div>
                            ) : (
                                <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                                    La NC è ancora in esecuzione: mantieni aggiornato stato e avanzamento delle AC.
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Cambia Stato</h4>
                            <div className="flex flex-col gap-2">
                                <Button
                                    variant={optimisticStatus === "open" ? "secondary" : "outline"}
                                    size="sm"
                                    onClick={() => handleStatusChange("open")}
                                    disabled={isPending || optimisticStatus === "open"}
                                >
                                    Apri
                                </Button>
                                <Button
                                    variant={optimisticStatus === "pending_verification" ? "secondary" : "outline"}
                                    size="sm"
                                    onClick={() => handleStatusChange("pending_verification")}
                                    disabled={isPending || optimisticStatus === "pending_verification"}
                                >
                                    Passa in verifica
                                </Button>

                                <div className="w-full" title={!allAcCompleted ? "Tutte le azioni correttive devono essere completate per chiudere la NC" : ""}>
                                    <Button
                                        variant={optimisticStatus === "closed" ? "secondary" : "destructive"}
                                        size="sm"
                                        className="w-full"
                                        onClick={() => handleStatusChange("closed")}
                                        disabled={isPending || optimisticStatus === "closed" || !allAcCompleted}
                                    >
                                        Chiudi NC
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Pronta alla chiusura</span>
                                <Badge variant="secondary">{allAcCompleted ? "Si" : "No"}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
