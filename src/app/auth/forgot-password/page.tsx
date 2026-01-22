'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { useAuth } from '@/lib/hooks/use-auth';

export default function ForgotPasswordPage() {
    const { sendPasswordRecovery } = useAuth();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Entrance animations
            gsap.fromTo('.auth-logo',
                { opacity: 0, y: -30, scale: 0.8 },
                { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.7)' }
            );

            gsap.fromTo('.auth-title',
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.4, delay: 0.1, ease: 'power3.out' }
            );

            gsap.fromTo('.auth-card',
                { opacity: 0, y: 40, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 0.5, delay: 0.2, ease: 'power3.out' }
            );

            gsap.fromTo('.auth-footer',
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.4, delay: 0.4, ease: 'power3.out' }
            );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Please enter your email address');
            return;
        }

        setIsLoading(true);

        try {
            await sendPasswordRecovery(email);
            setSuccess(true);

            // Success animation
            gsap.fromTo('.success-icon',
                { scale: 0, rotation: -180 },
                { scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(1.7)' }
            );
        } catch (err: any) {
            setError(err.message || 'Failed to send recovery email');

            // Error shake animation
            gsap.fromTo('.auth-card',
                { x: -10 },
                { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' }
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div ref={containerRef} className="bg-[#f9fafb] text-[#1c180c] font-[Inter,sans-serif] min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#fbbd23]/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-400/10 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-[440px] flex flex-col items-center">
                {/* Header */}
                <header className="auth-logo flex flex-col items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#fbbd23] to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="material-symbols-outlined text-white text-2xl">lock_reset</span>
                    </div>
                    <h2 className="auth-title text-2xl font-bold tracking-tight">Book&Call</h2>
                </header>

                {/* Main Card */}
                <main className="auth-card w-full bg-white p-8 md:p-10 rounded-3xl shadow-2xl shadow-gray-200/50">
                    {success ? (
                        // Success State
                        <div className="text-center">
                            <div className="success-icon w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                                <span className="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
                            </div>
                            <h1 className="text-2xl font-bold text-[#1c180c] mb-2">Check your email</h1>
                            <p className="text-gray-500 mb-6">
                                We've sent a password reset link to <strong>{email}</strong>
                            </p>
                            <p className="text-sm text-gray-400 mb-8">
                                Didn't receive it? Check your spam folder or try again.
                            </p>
                            <button
                                onClick={() => setSuccess(false)}
                                className="w-full py-3.5 rounded-xl bg-[#f4f0e6] text-[#1c180c] font-bold hover:bg-[#e9e1cd] transition-all"
                            >
                                Try another email
                            </button>
                        </div>
                    ) : (
                        // Form State
                        <>
                            <div className="flex flex-col text-center mb-8">
                                <h1 className="text-[#111827] text-2xl font-bold tracking-tight pb-1">Forgot password?</h1>
                                <p className="text-gray-500 text-sm">No worries, we'll send you reset instructions.</p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-3">
                                    <span className="material-symbols-outlined text-red-500">error</span>
                                    {error}
                                </div>
                            )}

                            {/* Form */}
                            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-gray-700 ml-0.5" htmlFor="email">Email address</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">mail</span>
                                        <input
                                            className="flex h-12 w-full rounded-xl border-2 border-gray-100 bg-[#f9fafb] pl-12 pr-4 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#fbbd23] focus:bg-white transition-all"
                                            id="email"
                                            placeholder="name@company.com"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <button
                                    className="mt-2 flex w-full cursor-pointer items-center justify-center rounded-xl h-12 px-5 bg-gradient-to-r from-[#fbbd23] to-orange-400 hover:shadow-lg hover:scale-[1.02] transition-all text-[#1c180c] text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    type="submit"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-[#1c180c]/30 border-t-[#1c180c] rounded-full animate-spin mr-2" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            Send reset link
                                            <span className="material-symbols-outlined ml-2 text-[18px]">send</span>
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Back to Login */}
                            <Link
                                href="/auth/login"
                                className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-[#fbbd23] transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                                Back to login
                            </Link>
                        </>
                    )}
                </main>

                {/* Footer */}
                <footer className="auth-footer mt-8 text-center">
                    <div className="text-gray-400 text-xs font-medium">
                        © 2026 Book&Call Inc. All rights reserved.
                    </div>
                </footer>
            </div>
        </div>
    );
}
