import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
    return (
        <div className="flex h-[50vh] w-full flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            <p className="text-sm font-medium text-zinc-500">Caricamento in corso...</p>
        </div>
    );
}
