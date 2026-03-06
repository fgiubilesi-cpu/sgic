"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { NonConformity } from "../schemas/nc-ac.schema";
import { SeverityBadge, NCStatusBadge } from "./quality-badges";
import { Button } from "@/components/ui/button";
import { ChevronRight, Calendar } from "lucide-react";
import Link from "next/link";

export function NCTable({ ncs }: { ncs: any[] }) {
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
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Titolo</TableHead>
                        <TableHead>Identificata il</TableHead>
                        <TableHead>Gravità</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {ncs.map((nc) => (
                        <TableRow key={nc.id}>
                            <TableCell className="font-medium">{nc.title}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    {new Date(nc.identified_date).toLocaleDateString("it-IT")}
                                </div>
                            </TableCell>
                            <TableCell>
                                <SeverityBadge severity={nc.severity} />
                            </TableCell>
                            <TableCell>
                                <NCStatusBadge status={nc.status} />
                            </TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon" asChild>
                                    <Link href={`/non-conformities/${nc.id}`}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
