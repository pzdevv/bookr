'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { useAuth } from '@/lib/hooks/use-auth';
import { Logo } from '@/components/ui/logo';
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

            gsap.fromTo('.glass-card',
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
        }, containerRef);

        return () => ctx.revert();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const rateLimitKey = `signup:${email.toLowerCase()}`;
        const rateLimit = checkRateLimit(rateLimitKey, AUTH_RATE_LIMITS.signup);

        if (rateLimit.limited) {
            setError(`Too many signup attempts. Please try again in ${formatResetTime(rateLimit.resetInMs)}.`);
            gsap.fromTo('.glass-card', { x: -10 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
            return;
        }

        if (!passwordStrength.hasLength) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);

        try {
            await signUp(email, password, name);
            router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
        } catch (err: any) {
            console.error('Signup error:', err);
            setError(err.message || 'Failed to create account');
            gsap.fromTo('.glass-card', { x: -10 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
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
        <div
            ref={containerRef}
            className="min-h-screen text-[#1d0c0c] antialiased"
            style={{
                fontFamily: "'Inter', sans-serif",
                backgroundColor: '#fcf8f8',
                backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.03) 1px, transparent 0)',
                backgroundSize: '40px 40px'
            }}
        >
            {/* Background Blurs */}
            <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#850000]/5 rounded-full blur-[120px] -z-10" aria-hidden="true"></div>
            <div className="fixed bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-[#850000]/10 rounded-full blur-[100px] -z-10" aria-hidden="true"></div>

            {/* Geometric Shapes */}
            <div className="absolute top-[15%] left-[10%] pointer-events-none opacity-[0.03] text-[#850000]" aria-hidden="true">
                <svg height="200" viewBox="0 0 200 200" width="200"><rect fill="none" height="120" stroke="currentColor" strokeWidth="2" transform="rotate(15 100 100)" width="120" x="40" y="40"></rect></svg>
            </div>
            <div className="absolute bottom-[10%] right-[5%] pointer-events-none opacity-[0.03] text-[#850000]" aria-hidden="true">
                <svg height="300" viewBox="0 0 200 200" width="300"><circle cx="100" cy="100" fill="none" r="80" stroke="currentColor" strokeWidth="1.5"></circle></svg>
            </div>

            {/* Logo Header - Not sticky */}
            <div className="pt-8 pb-4 flex justify-center px-4">
                <div className="auth-logo">
                    <Logo size="lg" href="/" />
                </div>
            </div>

            {/* Main Content */}
            <main className="relative pb-20 flex items-center justify-center px-4">
                <div className="w-full max-w-6xl">
                    {/* Glass Island Card */}
                    <div
                        className="glass-card rounded-[40px] flex flex-col lg:flex-row overflow-hidden min-h-[700px]"
                        style={{
                            background: 'rgba(255, 255, 255, 0.7)',
                            backdropFilter: 'blur(24px)',
                            WebkitBackdropFilter: 'blur(24px)',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            boxShadow: '24px 24px 0px rgba(29, 12, 12, 0.08)'
                        }}
                    >
                        {/* Left Side - Branding */}
                        <div className="lg:w-5/12 bg-[#850000]/5 p-12 flex flex-col justify-between" style={{ borderRight: '1px solid rgba(255, 255, 255, 0.2)' }}>
                            <div className="space-y-6">
                                <div className="flex flex-col text-4xl lg:text-5xl leading-[1.1]">
                                    <span className="text-[#850000] font-extrabold uppercase tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>Elevate your</span>
                                    <span className="text-[#1d0c0c] italic font-bold capitalize" style={{ fontFamily: "'Playfair Display', serif" }}>Scheduling Experience</span>
                                </div>
                                <p className="text-[#6b4444] text-lg leading-relaxed max-w-sm">
                                    Experience the most refined way to book meetings. Seamlessly integrated, beautifully designed.
                                </p>
                            </div>

                            {/* Decorative Card */}
                            <div className="relative py-12">
                                <div className="bg-white/40 p-6 rounded-3xl space-y-4" style={{ border: '1px solid rgba(255, 255, 255, 0.6)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)' }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#850000]/10 flex items-center justify-center text-[#850000]">
                                            <span className="material-symbols-outlined" aria-hidden="true">verified</span>
                                        </div>
                                        <div>
                                            <div className="h-3 w-24 bg-[#850000]/20 rounded-full mb-1"></div>
                                            <div className="h-2 w-16 bg-[#850000]/10 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-2 w-full bg-[#1d0c0c]/5 rounded-full"></div>
                                        <div className="h-2 w-4/5 bg-[#1d0c0c]/5 rounded-full"></div>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#6b4444]">Free Forever Plan</span>
                                        <div className="w-6 h-6 rounded-md bg-[#850000]/80"></div>
                                    </div>
                                </div>
                                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-[#850000]/10 rounded-full blur-2xl" aria-hidden="true"></div>
                            </div>

                            {/* Trust Indicator */}
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-stone-200" style={{ border: '2px solid white' }}></div>
                                    <div className="w-10 h-10 rounded-full bg-stone-300" style={{ border: '2px solid white' }}></div>
                                    <div className="w-10 h-10 rounded-full bg-stone-400" style={{ border: '2px solid white' }}></div>
                                </div>
                                <p className="text-xs font-bold text-[#6b4444] uppercase tracking-wider">Trusted by 20k+ creators</p>
                            </div>
                        </div>

                        {/* Right Side - Form */}
                        <div className="lg:w-7/12 p-12 lg:p-16 flex flex-col justify-center">
                            <div className="max-w-md mx-auto w-full">
                                <div className="mb-10">
                                    <h1 className="text-3xl font-extrabold text-[#1d0c0c] tracking-tight mb-2">Create your account</h1>
                                    <p className="text-[#6b4444]">Join the elite circle of organized professionals.</p>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="auth-input mb-6 p-4 rounded-lg bg-red-50 text-red-700 text-sm flex items-center gap-3" style={{ border: '1px solid rgba(239, 68, 68, 0.2)' }} role="alert">
                                        <span className="material-symbols-outlined text-red-600 text-[20px]" aria-hidden="true">error</span>
                                        {error}
                                    </div>
                                )}

                                <form className="space-y-6" onSubmit={handleSubmit}>
                                    {/* Social Login */}
                                    <div className="auth-input">
                                        <button
                                            onClick={handleGoogleSignIn}
                                            type="button"
                                            className="auth-btn w-full flex items-center justify-center gap-3 h-12 rounded-lg bg-white hover:bg-[#f3f4f6] transition-colors font-semibold text-sm text-[#374151] shadow-sm"
                                            style={{ border: '1px solid rgba(0, 0, 0, 0.08)' }}
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                                            </svg>
                                            Continue with Google
                                        </button>
                                    </div>

                                    {/* Divider */}
                                    <div className="relative flex items-center py-2">
                                        <div className="flex-grow" style={{ borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}></div>
                                        <span className="mx-4 text-[10px] font-bold text-[#6b4444]/60 uppercase tracking-[0.2em]">or use email</span>
                                        <div className="flex-grow" style={{ borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}></div>
                                    </div>

                                    {/* Form Fields */}
                                    <div className="space-y-4">
                                        <div className="auth-input flex flex-col gap-1.5">
                                            <label htmlFor="name" className="text-xs font-bold text-[#1d0c0c] uppercase tracking-wider ml-1">Full Name</label>
                                            <input
                                                id="name"
                                                className="w-full h-12 px-5 rounded-lg bg-white/50 focus:bg-white focus:ring-2 focus:ring-[#850000]/20 outline-none transition-all placeholder:text-[#9ca3af] text-[#1d0c0c]"
                                                style={{ border: '1px solid rgba(0, 0, 0, 0.08)' }}
                                                placeholder="Alex Sterling"
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required
                                                autoComplete="name"
                                            />
                                        </div>
                                        <div className="auth-input flex flex-col gap-1.5">
                                            <label htmlFor="email" className="text-xs font-bold text-[#1d0c0c] uppercase tracking-wider ml-1">Email Address</label>
                                            <input
                                                id="email"
                                                className="w-full h-12 px-5 rounded-lg bg-white/50 focus:bg-white focus:ring-2 focus:ring-[#850000]/20 outline-none transition-all placeholder:text-[#9ca3af] text-[#1d0c0c]"
                                                style={{ border: '1px solid rgba(0, 0, 0, 0.08)' }}
                                                placeholder="alex@refined.com"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                autoComplete="email"
                                            />
                                        </div>
                                        <div className="auth-input flex flex-col gap-1.5">
                                            <label htmlFor="password" className="text-xs font-bold text-[#1d0c0c] uppercase tracking-wider ml-1">Password</label>
                                            <div className="relative">
                                                <input
                                                    id="password"
                                                    className="w-full h-12 px-5 rounded-lg bg-white/50 focus:bg-white focus:ring-2 focus:ring-[#850000]/20 outline-none transition-all placeholder:text-[#9ca3af] text-[#1d0c0c]"
                                                    style={{ border: '1px solid rgba(0, 0, 0, 0.08)' }}
                                                    placeholder="••••••••"
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                    autoComplete="new-password"
                                                    aria-describedby="password-requirements"
                                                />
                                                <button
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b4444] hover:text-[#850000] transition-colors"
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                                >
                                                    <span className="material-symbols-outlined text-lg" aria-hidden="true">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                                </button>
                                            </div>
                                            {/* Password Strength Bars */}
                                            <div className="mt-3 flex gap-1 px-0.5" aria-hidden="true">
                                                {strengthBars.map((active, i) => (
                                                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${active ? 'bg-[#850000]' : 'bg-[#e5e7eb]'}`}></div>
                                                ))}
                                            </div>
                                            {/* Password Requirements */}
                                            <div id="password-requirements" className="mt-3 flex flex-col gap-1.5 px-0.5">
                                                <div className={`flex items-center gap-2 text-[11px] font-medium transition-colors ${passwordStrength.hasLength ? 'text-green-700' : 'text-[#6b7280]'}`}>
                                                    <span className="material-symbols-outlined text-[14px]" aria-hidden="true">{passwordStrength.hasLength ? 'check_circle' : 'circle'}</span>
                                                    <span>At least 8 characters</span>
                                                </div>
                                                <div className={`flex items-center gap-2 text-[11px] font-medium transition-colors ${passwordStrength.hasNumberOrSymbol ? 'text-green-700' : 'text-[#6b7280]'}`}>
                                                    <span className="material-symbols-outlined text-[14px]" aria-hidden="true">{passwordStrength.hasNumberOrSymbol ? 'check_circle' : 'circle'}</span>
                                                    <span>Includes a number or symbol</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="pt-4">
                                        <button
                                            className="auth-btn w-full h-14 bg-[#850000] text-white font-extrabold rounded-lg hover:bg-[#6b0000] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                            style={{ boxShadow: '0 25px 50px -12px rgba(133, 0, 0, 0.3)' }}
                                            type="submit"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true"></div>
                                                    Creating account...
                                                </span>
                                            ) : (
                                                'Create My Account'
                                            )}
                                        </button>

                                        {/* Terms */}
                                        <p className="text-center text-[11px] text-[#6b4444] mt-6 leading-relaxed">
                                            By clicking the button above, you agree to our <br />
                                            <Link className="font-bold underline text-[#1d0c0c] hover:text-[#850000] transition-colors" href="#">Terms of Service</Link> and <Link className="font-bold underline text-[#1d0c0c] hover:text-[#850000] transition-colors" href="#">Privacy Policy</Link>.
                                        </p>

                                        {/* Login Link */}
                                        <p className="text-center text-sm text-[#6b4444] mt-6">
                                            Already have an account? <Link className="font-bold text-[#1d0c0c] hover:text-[#850000] transition-colors" href="/auth/login">Sign in</Link>
                                        </p>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Quote */}
                    <div className="mt-16 text-center">
                        <p className="italic text-2xl text-[#1d0c0c] opacity-80" style={{ fontFamily: "'Playfair Display', serif" }}>"The easiest way to value your time is to manage it beautifully."</p>
                        <div className="mt-4 flex justify-center gap-1" aria-hidden="true">
                            <div className="w-1 h-1 rounded-full bg-[#850000]/40"></div>
                            <div className="w-1 h-1 rounded-full bg-[#850000]/20"></div>
                            <div className="w-1 h-1 rounded-full bg-[#850000]/10"></div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
