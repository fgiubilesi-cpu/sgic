'use client';

import { Wifi, CloudOff, Loader2 } from 'lucide-react';
import { useSync } from '@/lib/offline/sync-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function NetworkStatus() {
    const { isOnline, pendingCount, syncInProgress, manualSync } = useSync();

    return (
        <div className="flex items-center gap-2">
            {!isOnline ? (
                <Badge variant="destructive" className="flex items-center gap-1">
                    <CloudOff className="h-3 w-3" />
                    <span className="hidden sm:inline">Offline</span>
                    {pendingCount > 0 && <span>({pendingCount} in coda)</span>}
                </Badge>
            ) : (
                <div className="flex items-center gap-2">
                    {pendingCount > 0 ? (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs flex gap-1.5 border-amber-500 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            onClick={() => manualSync()}
                            disabled={syncInProgress}
                        >
                            {syncInProgress ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <Wifi className="h-3 w-3" />
                            )}
                            Sincronizza ({pendingCount})
                        </Button>
                    ) : (
                        <Badge variant="secondary" className="flex items-center gap-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                            <Wifi className="h-3 w-3" />
                            <span className="hidden sm:inline">Online</span>
                        </Badge>
                    )}
                </div>
            )}
        </div>
    );
}
