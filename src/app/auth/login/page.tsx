'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { useAuth } from '@/lib/hooks/use-auth';
import { checkRateLimit, AUTH_RATE_LIMITS, formatResetTime } from '@/lib/security/rate-limit';

export default function LoginPage() {
    const router = useRouter();
    const { signIn, signInWithGoogle } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Snappy entrance animations
            gsap.fromTo('.auth-logo',
                { opacity: 0, y: -30, scale: 0.8 },
                { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(2)' }
            );

            gsap.fromTo('.auth-brand',
                { opacity: 0, x: -20 },
                { opacity: 1, x: 0, duration: 0.3, delay: 0.1, ease: 'power3.out' }
            );

            gsap.fromTo('.auth-card',
                { opacity: 0, y: 50, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 0.5, delay: 0.15, ease: 'power3.out' }
            );

            gsap.fromTo('.auth-input',
                { opacity: 0, x: -30 },
                { opacity: 1, x: 0, duration: 0.3, stagger: 0.08, delay: 0.3, ease: 'power3.out' }
            );

            gsap.fromTo('.auth-btn',
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.3, stagger: 0.1, delay: 0.5, ease: 'back.out(1.5)' }
            );

            gsap.fromTo('.auth-footer',
                { opacity: 0 },
                { opacity: 1, duration: 0.4, delay: 0.6 }
            );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Rate limit check
        const rateLimitKey = `login:${email.toLowerCase()}`;
        const rateLimit = checkRateLimit(rateLimitKey, AUTH_RATE_LIMITS.login);

        if (rateLimit.limited) {
            setError(`Too many login attempts. Please try again in ${formatResetTime(rateLimit.resetInMs)}.`);
            gsap.fromTo('.auth-card', { x: -10 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
            return;
        }

        setIsLoading(true);

        try {
            await signIn(email, password);
            window.location.href = '/dashboard';
        } catch (err: any) {
            console.error('Login error:', err);
            const errorMessage = err?.message || 'Invalid credentials. Please check the email and password.';
            setError(errorMessage);
            gsap.fromTo('.auth-card', { x: -10 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
        } catch (err: any) {
            setError(err.message || 'Failed to sign in with Google');
        }
    };

    return (
        <div ref={containerRef} className="bg-[#f9fafb] text-[#1c180c] font-[Inter,sans-serif] min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-[#fbbd23]/15 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-orange-400/10 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-[440px] flex flex-col items-center">
                {/* Header */}
                <header className="flex flex-col items-center gap-3 mb-8">
                    <div className="auth-logo w-14 h-14 bg-gradient-to-br from-[#fbbd23] to-orange-400 rounded-2xl flex items-center justify-center shadow-xl shadow-[#fbbd23]/30">
                        <span className="material-symbols-outlined text-white text-3xl">calendar_today</span>
                    </div>
                    <h2 className="auth-brand text-2xl font-bold tracking-tight">Bookr</h2>
                </header>

                {/* Main Card */}
                <main className="auth-card w-full bg-white p-8 md:p-10 rounded-3xl shadow-2xl shadow-gray-200/60">
                    <div className="flex flex-col text-center mb-8">
                        <h1 className="text-[#111827] text-2xl font-bold tracking-tight pb-1">Welcome back</h1>
                        <p className="text-gray-500 text-sm">Log in to manage your appointments.</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-3">
                            <span className="material-symbols-outlined text-red-500 text-[20px]">error</span>
                            {error}
                        </div>
                    )}

                    {/* Google Sign In */}
                    <div className="auth-input flex flex-col gap-3 mb-6">
                        <button
                            onClick={handleGoogleSignIn}
                            className="auth-btn flex w-full cursor-pointer items-center justify-center rounded-xl h-12 px-5 bg-white border-2 border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all gap-3 text-sm font-semibold text-gray-700 hover:scale-[1.01]"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                            </svg>
                            <span>Continue with Google</span>
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative flex py-4 items-center mb-4">
                        <div className="flex-grow border-t border-gray-100"></div>
                        <span className="flex-shrink mx-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">OR</span>
                        <div className="flex-grow border-t border-gray-100"></div>
                    </div>

                    {/* Form */}
                    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                        <div className="auth-input flex flex-col gap-1.5">
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
                        <div className="auth-input flex flex-col gap-1.5">
                            <div className="flex justify-between items-center ml-0.5">
                                <label className="text-sm font-semibold text-gray-700" htmlFor="password">Password</label>
                                <Link className="text-xs font-semibold text-[#fbbd23] hover:text-orange-500 transition-colors" href="/auth/forgot-password">Forgot password?</Link>
                            </div>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">lock</span>
                                <input
                                    className="flex h-12 w-full rounded-xl border-2 border-gray-100 bg-[#f9fafb] pl-12 pr-4 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#fbbd23] focus:bg-white transition-all"
                                    id="password"
                                    placeholder="••••••••"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="auth-input flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="remember"
                                className="w-4 h-4 rounded accent-[#fbbd23] cursor-pointer"
                            />
                            <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer select-none">
                                Remember me
                            </label>
                        </div>

                        <button
                            className="auth-btn mt-2 flex w-full cursor-pointer items-center justify-center rounded-xl h-12 px-5 bg-gradient-to-r from-[#fbbd23] to-orange-400 hover:shadow-lg hover:shadow-[#fbbd23]/30 hover:scale-[1.02] transition-all text-[#1c180c] text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-[#1c180c]/30 border-t-[#1c180c] rounded-full animate-spin mr-2" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign in
                                    <span className="material-symbols-outlined ml-2 text-[18px]">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Sign Up Link */}
                    <div className="auth-footer mt-8 text-center text-sm">
                        <span className="text-gray-500">Don't have an account?</span>
                        <Link className="ml-1 font-bold text-gray-900 hover:text-[#fbbd23] transition-colors" href="/auth/signup">Sign up</Link>
                    </div>
                </main>

                {/* Footer */}
                <footer className="auth-footer mt-8 text-center">
                    <div className="text-gray-400 text-xs font-medium">
                        © 2026 Bookr Inc. All rights reserved.
                    </div>
                </footer>
            </div>
        </div>
    );
}
