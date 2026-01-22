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
        <div ref={containerRef} className="min-h-screen bg-[#fcf8f8] flex items-center justify-center p-4 font-[Inter,sans-serif]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.03) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
            {/* Background */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#850000]/5 rounded-full blur-[200px]" />
            </div>

            <div className="w-full max-w-md text-center">
                {/* Icon */}
                <div className="verify-icon w-24 h-24 mx-auto mb-8 relative">
                    <div className="absolute inset-0 bg-[#850000]/20 rounded-full animate-ping" />
                    <div className="relative w-24 h-24 bg-gradient-to-br from-[#850000] to-[#6b0000] rounded-full flex items-center justify-center shadow-2xl shadow-[#850000]/30">
                        <span className="material-symbols-outlined text-white text-5xl">mark_email_unread</span>
                    </div>
                </div>

                {/* Content */}
                <div className="verify-content">
                    <h1 className="text-3xl font-bold text-[#1d0c0c] mb-3">Check your email</h1>
                    <p className="text-[#6b4444] mb-2">We've sent a verification link to your email address.</p>
                    <p className="text-[#6b4444]/70 text-sm mb-8">Click the link in the email to verify your account and get started.</p>
                </div>

                {/* Actions */}
                <div className="verify-actions space-y-4">
                    <div className="bg-white rounded-2xl p-6 shadow-xl border border-[#850000]/10">
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-12 h-12 bg-[#850000]/10 rounded-xl flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[#850000] text-2xl">inbox</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-[#1d0c0c]">Check your inbox</h3>
                                <p className="text-sm text-[#6b4444]">Look for an email from Book&Call</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleResendEmail}
                            className="flex-1 py-3 px-4 rounded-xl bg-white border border-[#850000]/10 text-[#6b4444] font-medium text-sm hover:bg-[#850000]/5 hover:text-[#850000] transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">refresh</span>
                            Resend Email
                        </button>
                        <Link
                            href="/auth/login"
                            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#850000] to-[#6b0000] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">login</span>
                            Go to Login
                        </Link>
                    </div>

                    <p className="text-xs text-[#6b4444]/60 mt-6">
                        Didn't receive it? Check your spam folder or{' '}
                        <button onClick={handleResendEmail} className="text-[#850000] font-medium hover:underline">
                            resend verification email
                        </button>
                    </p>
                </div>

                {/* Footer */}
                <p className="mt-12 text-[#6b4444]/40 text-xs flex items-center justify-center gap-2">
                    Powered by
                    <span className="flex items-center gap-1 text-[#850000] font-bold">
                        <span className="material-symbols-outlined text-base">calendar_today</span>
                        Book&Call
                    </span>
                </p>
            </div>
        </div>
    );
}
