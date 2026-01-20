'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { useAuth } from '@/lib/hooks/use-auth';
import { checkRateLimit, AUTH_RATE_LIMITS, formatResetTime } from '@/lib/security/rate-limit';

export default function SignUpPage() {
    const router = useRouter();
    const { signUp, signInWithGoogle } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const passwordStrength = {
        hasLength: password.length >= 8,
        hasNumberOrSymbol: /[0-9!@#$%^&*]/.test(password),
    };

    const strengthBars = [
        passwordStrength.hasLength,
        passwordStrength.hasLength && password.length >= 10,
        passwordStrength.hasNumberOrSymbol,
        passwordStrength.hasLength && passwordStrength.hasNumberOrSymbol && password.length >= 12,
    ];

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.auth-logo',
                { opacity: 0, y: -30, scale: 0.8 },
                { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(2)' }
            );

            gsap.fromTo('.auth-header',
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.3, delay: 0.1, ease: 'power3.out' }
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
                { opacity: 1, y: 0, duration: 0.3, delay: 0.5, ease: 'back.out(1.5)' }
            );

            gsap.fromTo('.auth-badges',
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.4, delay: 0.6 }
            );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Rate limit check
        const rateLimitKey = `signup:${email.toLowerCase()}`;
        const rateLimit = checkRateLimit(rateLimitKey, AUTH_RATE_LIMITS.signup);

        if (rateLimit.limited) {
            setError(`Too many signup attempts. Please try again in ${formatResetTime(rateLimit.resetInMs)}.`);
            gsap.fromTo('.auth-card', { x: -10 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
            return;
        }

        if (!passwordStrength.hasLength) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);

        try {
            await signUp(email, password, name);
            // Redirect to email verification page
            window.location.href = '/auth/verify-email';
        } catch (err: any) {
            console.error('Signup error:', err);
            setError(err.message || 'Failed to create account');
            gsap.fromTo('.auth-card',
                { x: -10 },
                { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' }
            );
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
        <div ref={containerRef} className="bg-[#f9fafb] min-h-screen flex flex-col items-center font-[Inter,sans-serif] antialiased relative overflow-hidden py-12 px-4">
            {/* Background */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#fbbd23]/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-orange-400/10 rounded-full blur-[100px]" />
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
            </div>

            {/* Logo */}
            <div className="auth-logo mb-8 flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-gradient-to-br from-[#fbbd23] to-orange-400 rounded-2xl flex items-center justify-center shadow-xl shadow-[#fbbd23]/30">
                    <span className="material-symbols-outlined text-white text-2xl">calendar_today</span>
                </div>
                <h2 className="text-[#1c180c] text-xl font-bold tracking-tight">Bookr</h2>
            </div>

            {/* Heading */}
            <div className="auth-header mb-8 text-center">
                <h1 className="text-[#111827] text-3xl md:text-4xl font-bold tracking-tight mb-2">Create your account</h1>
                <p className="text-gray-500 text-sm">Join thousands of professionals simplifying their calendar.</p>
            </div>

            {/* Card */}
            <div className="auth-card w-full max-w-[440px] bg-white rounded-3xl shadow-2xl shadow-gray-200/60 p-8">
                {error && (
                    <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-3">
                        <span className="material-symbols-outlined text-red-500 text-[20px]">error</span>
                        {error}
                    </div>
                )}

                {/* Google Sign Up */}
                <div className="auth-input mb-6">
                    <button
                        onClick={handleGoogleSignIn}
                        className="flex w-full cursor-pointer items-center justify-center rounded-xl h-12 px-5 bg-white border-2 border-gray-100 text-gray-700 gap-3 text-sm font-semibold transition-all hover:border-gray-200 hover:bg-gray-50 hover:scale-[1.01]"
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
                <div className="relative flex pb-6 items-center">
                    <div className="flex-grow border-t border-gray-100"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-bold uppercase tracking-widest">or</span>
                    <div className="flex-grow border-t border-gray-100"></div>
                </div>

                {/* Form */}
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="auth-input">
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-0.5">Full Name</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">person</span>
                            <input
                                className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-gray-100 bg-[#f9fafb] focus:border-[#fbbd23] focus:bg-white transition-all outline-none text-sm text-gray-900 placeholder:text-gray-400"
                                placeholder="John Doe"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="auth-input">
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-0.5">Email Address</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">mail</span>
                            <input
                                className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-gray-100 bg-[#f9fafb] focus:border-[#fbbd23] focus:bg-white transition-all outline-none text-sm text-gray-900 placeholder:text-gray-400"
                                placeholder="john@example.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="auth-input">
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-0.5">Password</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">lock</span>
                            <input
                                className="w-full h-12 pl-12 pr-12 rounded-xl border-2 border-gray-100 bg-[#f9fafb] focus:border-[#fbbd23] focus:bg-white transition-all outline-none text-sm text-gray-900 placeholder:text-gray-400"
                                placeholder="••••••••"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                            </button>
                        </div>
                        {/* Password Strength Bars */}
                        <div className="mt-3 flex gap-1 px-0.5">
                            {strengthBars.map((active, i) => (
                                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${active ? 'bg-gradient-to-r from-[#fbbd23] to-orange-400' : 'bg-gray-100'}`}></div>
                            ))}
                        </div>
                        {/* Password Requirements */}
                        <div className="mt-3 flex flex-col gap-1.5 px-0.5">
                            <div className={`flex items-center gap-2 text-[11px] font-medium transition-colors ${passwordStrength.hasLength ? 'text-green-600' : 'text-gray-400'}`}>
                                <span className="material-symbols-outlined text-[14px]">{passwordStrength.hasLength ? 'check_circle' : 'circle'}</span>
                                <span>At least 8 characters</span>
                            </div>
                            <div className={`flex items-center gap-2 text-[11px] font-medium transition-colors ${passwordStrength.hasNumberOrSymbol ? 'text-green-600' : 'text-gray-400'}`}>
                                <span className="material-symbols-outlined text-[14px]">{passwordStrength.hasNumberOrSymbol ? 'check_circle' : 'circle'}</span>
                                <span>Includes a number or symbol</span>
                            </div>
                        </div>
                    </div>
                    <button
                        className="auth-btn w-full h-12 mt-6 rounded-xl bg-gradient-to-r from-[#fbbd23] to-orange-400 text-[#1c180c] font-bold text-sm hover:shadow-lg hover:shadow-[#fbbd23]/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-[#1c180c]/30 border-t-[#1c180c] rounded-full animate-spin" />
                                Creating account...
                            </>
                        ) : (
                            <>
                                <span>Create Account</span>
                                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Terms */}
                <p className="mt-6 text-center text-[11px] text-gray-400 leading-relaxed">
                    By signing up, you agree to our{' '}
                    <a className="text-gray-600 font-medium hover:text-[#fbbd23] transition-colors" href="#">Terms of Service</a> and{' '}
                    <a className="text-gray-600 font-medium hover:text-[#fbbd23] transition-colors" href="#">Privacy Policy</a>.
                </p>
            </div>

            {/* Login Link */}
            <p className="mt-8 text-sm text-gray-500">
                Already have an account?{' '}
                <Link className="text-gray-900 font-semibold hover:text-[#fbbd23] transition-colors" href="/auth/login">Log in</Link>
            </p>

            {/* Trust Badges */}
            <div className="auth-badges mt-12 flex justify-center gap-6 text-gray-400 text-[12px] font-medium">
                <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-green-500 text-[16px]">verified_user</span>
                    <span>Secure data</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#fbbd23] text-[16px]">calendar_today</span>
                    <span>No credit card required</span>
                </div>
            </div>
        </div>
    );
}
