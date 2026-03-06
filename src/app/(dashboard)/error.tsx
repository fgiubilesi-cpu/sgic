"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Optionally log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex h-[50vh] w-full flex-col items-center justify-center space-y-6">
            <div className="flex flex-col items-center space-y-2 text-center">
                <div className="rounded-full bg-red-100 p-3">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
                    Qualcosa è andato storto!
                </h2>
                <p className="text-sm text-zinc-500 max-w-md">
                    Si è verificato un errore imprevisto durante il caricamento di questa pagina.
                    {error.message && (
                        <span className="block mt-2 italic text-zinc-400">"{error.message}"</span>
                    )}
                </p>
            </div>
            <Button variant="outline" onClick={() => reset()}>
                Riprova
            </Button>
        </div>
    );
}
