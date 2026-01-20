'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { authService } from '@/lib/appwrite/auth';

export default function VerifyEmailPendingPage() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.verify-icon',
                { opacity: 0, scale: 0.5, y: -20 },
                { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(2)' }
            );
            gsap.fromTo('.verify-content',
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.5, delay: 0.2, ease: 'power3.out' }
            );
            gsap.fromTo('.verify-actions',
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.4, delay: 0.4, ease: 'power3.out' }
            );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    const handleResendEmail = async () => {
        try {
            await authService.sendVerificationEmail();
            alert('Verification email sent! Check your inbox.');
        } catch (error) {
            console.error('Failed to resend:', error);
            alert('Failed to resend email. Please try again.');
        }
    };

    return (
        <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-[#f8f6f0] via-[#fdfcf9] to-[#f5f2ea] flex items-center justify-center p-4 font-[Inter,sans-serif]">
            {/* Background */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#fbbd23]/20 rounded-full blur-[200px]" />
            </div>

            <div className="w-full max-w-md text-center">
                {/* Icon */}
                <div className="verify-icon w-24 h-24 mx-auto mb-8 relative">
                    <div className="absolute inset-0 bg-[#fbbd23]/20 rounded-full animate-ping" />
                    <div className="relative w-24 h-24 bg-gradient-to-br from-[#fbbd23] to-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-[#fbbd23]/40">
                        <span className="material-symbols-outlined text-white text-5xl">mark_email_unread</span>
                    </div>
                </div>

                {/* Content */}
                <div className="verify-content">
                    <h1 className="text-3xl font-bold text-[#1c180c] mb-3">Check your email</h1>
                    <p className="text-gray-500 mb-2">We've sent a verification link to your email address.</p>
                    <p className="text-gray-400 text-sm mb-8">Click the link in the email to verify your account and get started.</p>
                </div>

                {/* Actions */}
                <div className="verify-actions space-y-4">
                    <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-lg">
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-blue-600 text-2xl">inbox</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-[#1c180c]">Check your inbox</h3>
                                <p className="text-sm text-gray-500">Look for an email from Bookr</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleResendEmail}
                            className="flex-1 py-3 px-4 rounded-xl bg-white/60 backdrop-blur text-gray-700 font-medium text-sm hover:bg-white/80 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">refresh</span>
                            Resend Email
                        </button>
                        <Link
                            href="/auth/login"
                            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#fbbd23] to-orange-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">login</span>
                            Go to Login
                        </Link>
                    </div>

                    <p className="text-xs text-gray-400 mt-6">
                        Didn't receive it? Check your spam folder or{' '}
                        <button onClick={handleResendEmail} className="text-[#fbbd23] font-medium hover:underline">
                            resend verification email
                        </button>
                    </p>
                </div>

                {/* Footer */}
                <p className="mt-12 text-gray-400 text-xs flex items-center justify-center gap-2">
                    Powered by
                    <span className="flex items-center gap-1 text-[#fbbd23] font-bold">
                        <span className="material-symbols-outlined text-base">calendar_today</span>
                        Bookr
                    </span>
                </p>
            </div>
        </div>
    );
}
