'use client';

import { useEffect, useState } from 'react';
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
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/auth/login');
        }
    }, [user, isLoading, router]);

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#fcf8f8]">
                <div className="w-8 h-8 border-4 border-[#850000] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Don't render anything if not authenticated
    if (!user) {
        return null;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-[#fcf8f8]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.02) 1px, transparent 0)', backgroundSize: '32px 32px' }}>
            <DashboardSidebar
                isAdmin={isAdmin}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
            <main className={`flex-1 overflow-y-auto pt-16 md:pt-0 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-72'}`}>
                {children}
            </main>
        </div>
    );
}
