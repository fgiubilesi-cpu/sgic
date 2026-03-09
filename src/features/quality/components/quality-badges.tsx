import { Badge } from "@/components/ui/badge";
import { NCSeverity, NCStatus, ACStatus } from "../schemas/nc-ac.schema";

export function SeverityBadge({ severity }: { severity: NCSeverity }) {
    const config = {
        critical: { label: "Critica", className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200" },
        major: { label: "Maggiore", className: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200" },
        minor: { label: "Minore", className: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200" },
    };

    const { label, className } = config[severity];

    return (
        <Badge variant="outline" className={className}>
            {label}
        </Badge>
    );
}

export function NCStatusBadge({ status }: { status: NCStatus }) {
    const config = {
        open: { label: "Aperta", className: "bg-blue-100 text-blue-800 border-blue-200" },
        pending_verification: { label: "In Verifica", className: "bg-amber-100 text-amber-800 border-amber-200" },
        closed: { label: "Chiusa", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    };

    const { label, className } = config[status];

    return (
        <Badge variant="outline" className={className}>
            {label}
        </Badge>
    );
}

export function ACStatusBadge({ status }: { status: ACStatus }) {
    const config = {
        pending: { label: "In attesa", className: "bg-zinc-100 text-zinc-700 border-zinc-200" },
        in_progress: { label: "In corso", className: "bg-blue-100 text-blue-800 border-blue-200" },
        completed: { label: "Completata", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    };

    const { label, className } = config[status];

    return (
        <Badge variant="outline" className={className}>
            {label}
        </Badge>
    );
}
