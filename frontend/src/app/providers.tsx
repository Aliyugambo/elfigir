'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import '@/globals.css';
import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
    },
  },
});

function AuthHydrator() {
  useEffect(() => {
    useAuthStore.getState().hydrateFromToken();
  }, []);
  return null;
}

export function RootLayoutClient({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthHydrator />
      {children}
      <Toaster position="bottom-right" richColors />
    </QueryClientProvider>
  );
}
