import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { useSync } from './sync-provider';
import { toast } from 'sonner';

export interface OfflineMutationOptions<TData, TError, TVariables, TContext>
    extends UseMutationOptions<TData, TError, TVariables, TContext> {
    actionType: string;
    generateOfflineId?: (variables: TVariables) => string;
}

export function useOfflineMutation<TData = any, TError = any, TVariables = any, TContext = any>(
    options: OfflineMutationOptions<TData, TError, TVariables, TContext>
) {
    const { enqueueMutation, isOnline } = useSync();

    return useMutation<TData, TError, TVariables, TContext>({
        ...options,
        mutationFn: async (variables: TVariables) => {
            // Force offline queuing if the browser is completely offline
            if (!isOnline) {
                await enqueueMutation(options.actionType, variables);
                toast.info('Sei offline. Azione salvata e in attesa di sincronizzazione.');

                let offlineId;
                if (options.generateOfflineId) {
                    offlineId = options.generateOfflineId(variables);
                }

                // Return a mock successful response expected by our Server Actions
                return { success: true, offline: true, id: offlineId, data: variables } as unknown as TData;
            }

            // If online, execute the real mutation
            if (!options.mutationFn) {
                throw new Error('mutationFn is required');
            }

            try {
                // @ts-ignore
                const result = await options.mutationFn(variables);

                // If the server action returned an integrated error object
                if ((result as any)?.error) {
                    throw new Error((result as any).error);
                }

                return result;
            } catch (err: any) {
                // If the request fails specifically due to sudden network loss
                if (
                    !navigator.onLine ||
                    err?.message?.toLowerCase().includes('fetch') ||
                    err?.message?.toLowerCase().includes('network')
                ) {
                    await enqueueMutation(options.actionType, variables);
                    toast.info('Rete instabile. Azione salvata in coda.');

                    let offlineId;
                    if (options.generateOfflineId) {
                        offlineId = options.generateOfflineId(variables);
                    }
                    return { success: true, offline: true, id: offlineId, data: variables } as unknown as TData;
                }
                throw err;
            }
        },
    });
}
