'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

interface IframeGuardProps {
    children: React.ReactNode;
    allowEmbedding?: boolean;
    username?: string;
}

export function IframeGuard({ children, allowEmbedding = false, username }: IframeGuardProps) {
    const [isEmbedded, setIsEmbedded] = useState(false);
    const [isAllowed, setIsAllowed] = useState(true);

    useEffect(() => {
        // Check if running in an iframe
        const checkIsEmbedded = () => {
            try {
                return window.self !== window.top;
            } catch (e) {
                return true;
            }
        };

        if (checkIsEmbedded()) {
            setIsEmbedded(true);
            if (!allowEmbedding) {
                setIsAllowed(false);
            }
        }
    }, [allowEmbedding]);

    if (!isAllowed) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-3xl text-red-600">block</span>
                </div>
                <h1 className="text-2xl font-bold text-[#1d0c0c] mb-2">Embedding Not Allowed</h1>
                <p className="text-[#6b4444] max-w-md mb-8">
                    The owner of this booking page has disabled embedding on external websites.
                </p>
                <div className="space-y-4">
                    <a
                        href={`/book/${username || ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#850000] text-white font-bold rounded-lg hover:bg-[#6b0000] transition-colors shadow-lg"
                    >
                        <span>Open in New Tab</span>
                        <span className="material-symbols-outlined">open_in_new</span>
                    </a>
                </div>
                <div className="mt-12 opacity-50">
                    <Logo size="sm" className="scale-75" />
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
