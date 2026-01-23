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
                setMessage('Your email has been verified successfully! Redirecting to login...');
                // Redirect to login after 3 seconds
                setTimeout(() => router.push('/auth/login?verified=true'), 3000);
            } catch (error: any) {
                setStatus('error');
                setMessage(error.message || 'Verification failed. Please try again.');
            }
        };

        verifyEmail();
    }, [searchParams, router]);

    return (
        <div className="min-h-screen bg-[#fcf8f8] flex items-center justify-center p-4 font-[Inter,sans-serif]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.03) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#850000]/5 rounded-full blur-[200px]" />
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white rounded-3xl border border-[#850000]/10 p-10 text-center shadow-xl">
                    {status === 'loading' && (
                        <>
                            <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                                <div className="w-16 h-16 border-4 border-[#850000] border-t-transparent rounded-full animate-spin" />
                            </div>
                            <h1 className="text-2xl font-bold text-[#1d0c0c] mb-3">Verifying Email</h1>
                            <p className="text-[#6b4444]">{message}</p>
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
                            <h1 className="text-2xl font-bold text-[#1d0c0c] mb-3">Email Verified!</h1>
                            <p className="text-[#6b4444] mb-6">{message}</p>
                            <p className="text-sm text-[#6b4444]/60">Redirecting to dashboard...</p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-red-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-red-500 text-5xl">error</span>
                            </div>
                            <h1 className="text-2xl font-bold text-[#1d0c0c] mb-3">Verification Failed</h1>
                            <p className="text-[#6b4444] mb-8">{message}</p>
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[#850000] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-[#850000]/20 hover:bg-[#6b0000] transition-all"
                            >
                                Go to Dashboard
                            </Link>
                        </>
                    )}
                </div>

                <p className="mt-8 text-center text-[#6b4444]/40 text-sm flex items-center justify-center gap-2">
                    Powered by
                    <span className="flex items-center gap-1.5 text-[#850000] font-bold">
                        <span className="material-symbols-outlined text-lg">calendar_today</span>
                        Book&Call
                    </span>
                </p>
            </div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#fcf8f8] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#850000] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <VerifyContent />
        </Suspense>
    );
}
