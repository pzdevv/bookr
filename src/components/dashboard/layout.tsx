'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from './sidebar';
import { useAuth } from '@/lib/hooks/use-auth';

interface DashboardLayoutProps {
    children: React.ReactNode;
    isAdmin?: boolean;
}

export function DashboardLayout({ children, isAdmin = false }: DashboardLayoutProps) {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/auth/login');
        }
    }, [user, isLoading, router]);

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#fcfbf8]">
                <div className="w-8 h-8 border-4 border-[#fbbd23] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Don't render anything if not authenticated
    if (!user) {
        return null;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-[#f8f6f0] via-[#fdfcf9] to-[#f5f2ea]">
            <DashboardSidebar isAdmin={isAdmin} />
            <main className="flex-1 overflow-y-auto md:ml-72 pt-16 md:pt-0">
                {children}
            </main>
        </div>
    );
}

