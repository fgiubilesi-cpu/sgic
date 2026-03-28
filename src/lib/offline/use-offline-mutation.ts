import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import type { MutationFunctionContext } from '@tanstack/react-query';
import { useSync } from './sync-provider';
import { toast } from 'sonner';

export interface OfflineMutationOptions<TData, TError, TVariables, TContext>
    extends UseMutationOptions<TData, TError, TVariables, TContext> {
    actionType: string;
    generateOfflineId?: (variables: TVariables) => string;
}

type MutationResultWithError = {
    error?: string;
};

function hasResultError(value: unknown): value is MutationResultWithError {
    return typeof value === 'object' && value !== null && 'error' in value && typeof value.error === 'string';
}

function isNetworkError(error: unknown): error is Error {
    return error instanceof Error;
}

export function useOfflineMutation<TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
    options: OfflineMutationOptions<TData, TError, TVariables, TContext>
) {
    const { enqueueMutation, isOnline } = useSync();

    return useMutation<TData, TError, TVariables, TContext>({
        ...options,
        mutationFn: async (variables: TVariables, context: MutationFunctionContext) => {
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
            const mutationFn = options.mutationFn;
            if (!mutationFn) {
                throw new Error('mutationFn is required');
            }

            try {
                const result = await mutationFn(variables, context);

                // If the server action returned an integrated error object
                if (hasResultError(result)) {
                    throw new Error(result.error);
                }

                return result;
            } catch (err: unknown) {
                // If the request fails specifically due to sudden network loss
                if (
                    !navigator.onLine ||
                    (isNetworkError(err) && (
                        err.message.toLowerCase().includes('fetch') ||
                        err.message.toLowerCase().includes('network')
                    ))
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
