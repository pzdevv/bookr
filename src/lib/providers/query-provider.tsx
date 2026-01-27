'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Stale time: 1 minute (data considered fresh)
                        staleTime: 60 * 1000,
                        // Cache time: 5 minutes
                        gcTime: 5 * 60 * 1000,
                        // Retry failed requests twice
                        retry: 2,
                        // Refetch on window focus (great for dashboards)
                        refetchOnWindowFocus: true,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
