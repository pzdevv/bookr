'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { gsap } from 'gsap';
import { useAuth } from '@/lib/hooks/use-auth';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { resetPassword } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const userId = searchParams.get('userId');
    const secret = searchParams.get('secret');

    const passwordStrength = {
        hasLength: password.length >= 8,
        hasNumberOrSymbol: /[0-9!@#$%^&*]/.test(password),
    };

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.auth-logo',
                { opacity: 0, y: -30, scale: 0.8 },
                { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.7)' }
            );

            gsap.fromTo('.auth-card',
                { opacity: 0, y: 40, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 0.5, delay: 0.2, ease: 'power3.out' }
            );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!userId || !secret) {
            setError('Invalid reset link. Please request a new one.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!passwordStrength.hasLength) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);

        try {
            await resetPassword(userId, secret, password);
            setSuccess(true);

            gsap.fromTo('.success-icon',
                { scale: 0, rotation: -180 },
                { scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(1.7)' }
            );

            setTimeout(() => router.push('/auth/login'), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    if (!userId || !secret) {
        return (
            <div ref={containerRef} className="bg-[#f9fafb] min-h-screen flex items-center justify-center p-4">
                <div className="auth-card bg-white p-8 rounded-3xl shadow-2xl max-w-md text-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-red-600 text-3xl">error</span>
                    </div>
                    <h1 className="text-xl font-bold text-[#1c180c] mb-2">Invalid Reset Link</h1>
                    <p className="text-gray-500 mb-6">This password reset link is invalid or has expired.</p>
                    <Link href="/auth/forgot-password" className="inline-block px-6 py-3 bg-gradient-to-r from-[#fbbd23] to-orange-400 text-[#1c180c] font-bold rounded-xl">
                        Request new link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="bg-[#f9fafb] text-[#1c180c] font-[Inter,sans-serif] min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#fbbd23]/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-400/10 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-[440px] flex flex-col items-center">
                <header className="auth-logo flex flex-col items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#fbbd23] to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="material-symbols-outlined text-white text-2xl">key</span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">Book&Call</h2>
                </header>

                <main className="auth-card w-full bg-white p-8 md:p-10 rounded-3xl shadow-2xl shadow-gray-200/50">
                    {success ? (
                        <div className="text-center">
                            <div className="success-icon w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                                <span className="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
                            </div>
                            <h1 className="text-2xl font-bold text-[#1c180c] mb-2">Password Reset!</h1>
                            <p className="text-gray-500 mb-6">Your password has been successfully reset. Redirecting to login...</p>
                            <div className="w-8 h-8 border-4 border-[#fbbd23] border-t-transparent rounded-full animate-spin mx-auto" />
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col text-center mb-8">
                                <h1 className="text-[#111827] text-2xl font-bold tracking-tight pb-1">Set new password</h1>
                                <p className="text-gray-500 text-sm">Your new password must be different from previous passwords.</p>
                            </div>

                            {error && (
                                <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-3">
                                    <span className="material-symbols-outlined text-red-500">error</span>
                                    {error}
                                </div>
                            )}

                            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-gray-700 ml-0.5" htmlFor="password">New Password</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">lock</span>
                                        <input
                                            className="flex h-12 w-full rounded-xl border-2 border-gray-100 bg-[#f9fafb] pl-12 pr-12 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#fbbd23] focus:bg-white transition-all"
                                            id="password"
                                            placeholder="••••••••"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                        </button>
                                    </div>
                                    {/* Password Strength */}
                                    <div className="mt-2 flex gap-1">
                                        <div className={`h-1 flex-1 rounded-full transition-colors ${passwordStrength.hasLength ? 'bg-[#fbbd23]' : 'bg-gray-200'}`} />
                                        <div className={`h-1 flex-1 rounded-full transition-colors ${passwordStrength.hasLength && password.length >= 10 ? 'bg-[#fbbd23]' : 'bg-gray-200'}`} />
                                        <div className={`h-1 flex-1 rounded-full transition-colors ${passwordStrength.hasNumberOrSymbol ? 'bg-[#fbbd23]' : 'bg-gray-200'}`} />
                                        <div className={`h-1 flex-1 rounded-full transition-colors ${passwordStrength.hasLength && passwordStrength.hasNumberOrSymbol ? 'bg-[#fbbd23]' : 'bg-gray-200'}`} />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-semibold text-gray-700 ml-0.5" htmlFor="confirmPassword">Confirm Password</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">lock</span>
                                        <input
                                            className="flex h-12 w-full rounded-xl border-2 border-gray-100 bg-[#f9fafb] pl-12 pr-4 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#fbbd23] focus:bg-white transition-all"
                                            id="confirmPassword"
                                            placeholder="••••••••"
                                            type={showPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                        {confirmPassword && (
                                            <span className={`material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[20px] ${password === confirmPassword ? 'text-green-500' : 'text-red-500'}`}>
                                                {password === confirmPassword ? 'check_circle' : 'cancel'}
                                            </span>
                                        )}
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
                                            Resetting...
                                        </>
                                    ) : (
                                        'Reset password'
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </main>

                <footer className="mt-8 text-center">
                    <div className="text-gray-400 text-xs font-medium">© 2026 Book&Call Inc.</div>
                </footer>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="bg-[#f9fafb] min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#fbbd23] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
