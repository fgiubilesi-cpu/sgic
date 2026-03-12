'use client';

import type { ReactNode } from 'react';
import { SyncProvider } from '@/lib/offline/sync-provider';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return <SyncProvider>{children}</SyncProvider>;
}
