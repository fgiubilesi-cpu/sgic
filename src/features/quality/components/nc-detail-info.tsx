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

export function NCDetailInfo({ nc }: { nc: any }) {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const [optimisticStatus, setOptimisticStatus] = useOptimistic(
        nc.status as NCStatus,
        (state, newStatus: NCStatus) => newStatus
    );

    const allAcVerified = nc.corrective_actions?.length > 0 &&
        nc.corrective_actions.every((ac: any) => ac.status === "verified");

    async function handleStatusChange(newStatus: NCStatus) {
        if (newStatus === "closed" && !allAcVerified) {
            toast.error("Impossibile chiudere la NC se ci sono azioni non verificate");
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
        <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">Dettagli Non Conformità</CardTitle>
                        <SeverityBadge severity={nc.severity} />
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Titolo</h4>
                        <p className="text-lg font-semibold">{nc.title}</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Descrizione</h4>
                        <p className="whitespace-pre-wrap text-zinc-700">{nc.description}</p>
                    </div>
                    <div className="flex gap-8">
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Data Identificazione</h4>
                            <p>{new Date(nc.identified_date).toLocaleDateString("it-IT")}</p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Creato il</h4>
                            <p>{new Date(nc.created_at).toLocaleDateString("it-IT")}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Stato NC</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex justify-center py-4">
                        <NCStatusBadge status={optimisticStatus} />
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
                                In Verifica
                            </Button>

                            <div className="w-full" title={!allAcVerified ? "Tutte le azioni correttive devono essere verificate per chiudere la NC" : ""}>
                                <Button
                                    variant={optimisticStatus === "closed" ? "secondary" : "destructive"}
                                    size="sm"
                                    className="w-full"
                                    onClick={() => handleStatusChange("closed")}
                                    disabled={isPending || optimisticStatus === "closed" || !allAcVerified}
                                >
                                    Chiudi NC
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Azioni Verificate:</span>
                            <Badge variant="secondary">
                                {nc.corrective_actions?.filter((ac: any) => ac.status === "verified").length ?? 0} / {nc.corrective_actions?.length ?? 0}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
