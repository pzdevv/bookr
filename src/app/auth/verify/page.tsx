'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/appwrite/auth';

function VerifyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        const userId = searchParams.get('userId');
        const secret = searchParams.get('secret');

        if (!userId || !secret) {
            setStatus('error');
            setMessage('Invalid verification link. Please request a new one.');
            return;
        }

        const verifyEmail = async () => {
            try {
                await authService.verifyEmail(userId, secret);
                setStatus('success');
                setMessage('Your email has been verified successfully!');
                // Redirect to dashboard after 3 seconds
                setTimeout(() => router.push('/dashboard'), 3000);
            } catch (error: any) {
                setStatus('error');
                setMessage(error.message || 'Verification failed. Please try again.');
            }
        };

        verifyEmail();
    }, [searchParams, router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#0f0f0f] flex items-center justify-center p-4 font-[Inter,sans-serif]">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#fbbd23]/10 rounded-full blur-[200px]" />
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-10 text-center shadow-2xl">
                    {status === 'loading' && (
                        <>
                            <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                                <div className="w-16 h-16 border-4 border-[#fbbd23] border-t-transparent rounded-full animate-spin" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-3">Verifying Email</h1>
                            <p className="text-gray-400">{message}</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="relative w-24 h-24 mx-auto mb-8">
                                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-xl shadow-green-500/30">
                                    <span className="material-symbols-outlined text-white text-5xl">check</span>
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-3">Email Verified!</h1>
                            <p className="text-gray-400 mb-6">{message}</p>
                            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-red-500/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-red-400 text-5xl">error</span>
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-3">Verification Failed</h1>
                            <p className="text-gray-400 mb-8">{message}</p>
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[#fbbd23] text-[#1c180c] font-bold rounded-xl hover:shadow-lg hover:shadow-[#fbbd23]/20 transition-all"
                            >
                                Go to Dashboard
                            </Link>
                        </>
                    )}
                </div>

                <p className="mt-8 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
                    Powered by
                    <span className="flex items-center gap-1.5 text-[#fbbd23] font-bold">
                        <span className="material-symbols-outlined text-lg">calendar_today</span>
                        Bookr
                    </span>
                </p>
            </div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#0f0f0f] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#fbbd23] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <VerifyContent />
        </Suspense>
    );
}
