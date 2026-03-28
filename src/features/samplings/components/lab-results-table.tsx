"use client";

import { useOptimistic, useTransition, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Plus, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { createLabResult } from "../actions/sampling-actions";
import { toast } from "sonner";

interface LabResult {
    id: string;
    parameter: string;
    uom: string;
    result_value: number;
    limit_value: number | null;
    outcome: "pass" | "fail" | "pending";
    created_at: string;
}

interface LabResultsTableProps {
    samplingId: string;
    initialResults: LabResult[];
}

export function LabResultsTable({ samplingId, initialResults }: LabResultsTableProps) {
    const [isPending, startTransition] = useTransition();
    const [optimisticResults, addOptimisticResult] = useOptimistic(
        initialResults,
        (state, newResult: LabResult) => [newResult, ...state]
    );

    const [newParameter, setNewParameter] = useState("");
    const [newUom, setNewUom] = useState("");
    const [newValue, setNewValue] = useState("");
    const [newLimit, setNewLimit] = useState("");
    const [newOutcome, setNewOutcome] = useState<LabResult["outcome"]>("pending");

    async function handleAddResult() {
        if (!newParameter || !newUom || !newValue) {
            toast.error("Compila i campi obbligatori (Parametro, UdM, Valore)");
            return;
        }

        const tempId = Math.random().toString(36).substring(7);
        const newResult: LabResult = {
            id: tempId,
            parameter: newParameter,
            uom: newUom,
            result_value: Number(newValue),
            limit_value: newLimit ? Number(newLimit) : null,
            outcome: newOutcome,
            created_at: new Date().toISOString(),
        };

        startTransition(async () => {
            addOptimisticResult(newResult);

            try {
                const res = await createLabResult({
                    sampling_id: samplingId,
                    parameter: newParameter,
                    uom: newUom,
                    result_value: Number(newValue),
                    limit_value: newLimit ? Number(newLimit) : null,
                    outcome: newOutcome,
                });

                if (res.error) {
                    toast.error("Errore durante il salvataggio: " + res.error);
                } else {
                    toast.success("Risultato aggiunto con successo");
                    setNewParameter("");
                    setNewUom("");
                    setNewValue("");
                    setNewLimit("");
                    setNewOutcome("pending");
                }
            } catch {
                toast.error("Si è verificato un errore");
            }
        });
    }

    const getOutcomeBadge = (outcome: string) => {
        switch (outcome) {
            case "pass":
                return (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Conforme
                    </Badge>
                );
            case "fail":
                return (
                    <Badge variant="destructive" className="gap-1">
                        <XCircle className="w-3 h-3" /> Non Conforme
                    </Badge>
                );
            case "pending":
                return (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1">
                        <AlertCircle className="w-3 h-3" /> In attesa
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{outcome}</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Parametro</TableHead>
                            <TableHead>UdM</TableHead>
                            <TableHead>Valore</TableHead>
                            <TableHead>Limite</TableHead>
                            <TableHead>Esito</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* Inline Add Form */}
                        <TableRow className="bg-muted/30">
                            <TableCell>
                                <Input
                                    placeholder="es. pH"
                                    value={newParameter}
                                    onChange={(e) => setNewParameter(e.target.value)}
                                    disabled={isPending}
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                    placeholder="es. mg/L"
                                    value={newUom}
                                    onChange={(e) => setNewUom(e.target.value)}
                                    disabled={isPending}
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                    placeholder="es. 7.2"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    disabled={isPending}
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                    placeholder="es. < 9.5"
                                    value={newLimit}
                                    onChange={(e) => setNewLimit(e.target.value)}
                                    disabled={isPending}
                                />
                            </TableCell>
                            <TableCell>
                                <Select
                                    value={newOutcome}
                                    onValueChange={(value: LabResult["outcome"]) => setNewOutcome(value)}
                                    disabled={isPending}
                                >
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Esito" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pass">Conforme</SelectItem>
                                        <SelectItem value="fail">Non Conforme</SelectItem>
                                        <SelectItem value="pending">In attesa</SelectItem>
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            <TableCell>
                                <Button
                                    size="icon"
                                    onClick={handleAddResult}
                                    disabled={isPending}
                                >
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                </Button>
                            </TableCell>
                        </TableRow>

                        {optimisticResults.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    Nessun risultato registrato.
                                </TableCell>
                            </TableRow>
                        ) : (
                            optimisticResults.map((result) => (
                                <TableRow key={result.id}>
                                    <TableCell className="font-medium">{result.parameter}</TableCell>
                                    <TableCell>{result.uom}</TableCell>
                                    <TableCell>{result.result_value}</TableCell>
                                    <TableCell>{result.limit_value || "-"}</TableCell>
                                    <TableCell>{getOutcomeBadge(result.outcome)}</TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
