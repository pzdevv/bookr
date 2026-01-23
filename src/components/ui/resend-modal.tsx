'use client';

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { authService } from '@/lib/appwrite/auth';
import { checkRateLimit, AUTH_RATE_LIMITS, formatResetTime } from '@/lib/security/rate-limit';

interface ResendModalProps {
    isOpen: boolean;
    onClose: () => void;
    email?: string;
}

export function ResendModal({ isOpen, onClose, email = '' }: ResendModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'rate-limited'>('idle');
    const [message, setMessage] = useState('');
    const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

    const modalRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Reset state on open
            setStatus('idle');
            setMessage('');

            // Check current rate limit status without consuming
            // Note: In a real app, we might need a specific "check" endpoint or store state externally
            // For this client-side demo, we'll just check the store
            // We use a dummy check or just show the initial UI

            // Anim In
            const ctx = gsap.context(() => {
                gsap.to(overlayRef.current, { opacity: 1, duration: 0.3, ease: 'power2.out' });
                gsap.fromTo(contentRef.current,
                    { opacity: 0, scale: 0.9, y: 20 },
                    { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.7)', delay: 0.1 }
                );
            }, modalRef);
            return () => ctx.revert();
        }
    }, [isOpen]);

    const handleClose = () => {
        const ctx = gsap.context(() => {
            gsap.to(contentRef.current, { opacity: 0, scale: 0.9, y: 20, duration: 0.3, ease: 'power2.in' });
            gsap.to(overlayRef.current, {
                opacity: 0,
                duration: 0.3,
                delay: 0.1,
                onComplete: onClose
            });
        }, modalRef);
    };

    const handleResend = async () => {
        setIsLoading(true);
        setMessage('');

        // Check rate limit
        // Use a generic key or email specific if available
        const key = `resend-verification:${email || 'user'}`;
        const limit = checkRateLimit(key, AUTH_RATE_LIMITS.resendVerification);

        if (limit.limited) {
            setStatus('rate-limited');
            setMessage(`Please wait ${formatResetTime(limit.resetInMs)} before trying again.`);
            setIsLoading(false);
            return;
        }

        setRemainingAttempts(limit.remainingAttempts);

        try {
            await authService.sendVerificationEmail();
            setStatus('success');
            setTimeout(() => {
                handleClose();
            }, 3000); // Close after 3 seconds of success
        } catch (error: any) {
            console.error('Resend error:', error);
            setStatus('error');
            setMessage(error.message || 'Failed to send email. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div ref={modalRef} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                ref={overlayRef}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0"
                onClick={handleClose}
            />

            {/* Modal Content */}
            <div
                ref={contentRef}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden opacity-0"
            >
                {/* Header Pattern */}
                <div className="h-24 bg-gradient-to-br from-[#850000] to-[#6b0000] relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}
                    />
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg">
                        <span className="material-symbols-outlined text-white text-2xl">mark_email_read</span>
                    </div>
                </div>

                <div className="p-6 text-center">
                    <h3 className="text-xl font-bold text-[#1d0c0c] mb-2">Resend Verification</h3>

                    {status === 'idle' && (
                        <p className="text-[#6b4444] text-sm mb-6">
                            Didn't receive the email? We can send you a new verification link.
                            {remainingAttempts !== null && (
                                <span className="block mt-2 text-xs text-[#850000]/60 font-medium">
                                    {remainingAttempts} attempts remaining
                                </span>
                            )}
                        </p>
                    )}

                    {status === 'success' && (
                        <div className="mb-6">
                            <p className="text-green-600 font-medium text-sm mb-1">Email Sent Successfully!</p>
                            <p className="text-[#6b4444] text-xs">Check your inbox (and spam folder)</p>
                        </div>
                    )}

                    {status === 'rate-limited' && (
                        <div className="mb-6 bg-orange-50 p-3 rounded-lg border border-orange-100">
                            <div className="flex items-center justify-center gap-2 text-orange-700 font-bold text-sm mb-1">
                                <span className="material-symbols-outlined text-lg">timer</span>
                                Too Many Attempts
                            </div>
                            <p className="text-orange-600 text-xs">{message}</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="mb-6 bg-red-50 p-3 rounded-lg border border-red-100">
                            <p className="text-red-600 font-medium text-sm mb-1">Something went wrong</p>
                            <p className="text-red-500 text-xs">{message}</p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={handleClose}
                            className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleResend}
                            disabled={isLoading || status === 'success' || status === 'rate-limited'}
                            className={`flex-1 py-2.5 rounded-lg font-bold text-sm text-white shadow-md flex items-center justify-center gap-2 transition-all
                                ${isLoading ? 'bg-[#850000]/80 cursor-wait' :
                                    status === 'success' ? 'bg-green-600' :
                                        status === 'rate-limited' ? 'bg-gray-400 cursor-not-allowed' :
                                            'bg-[#850000] hover:bg-[#6b0000] hover:-translate-y-0.5'
                                }`}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Sending...
                                </>
                            ) : status === 'success' ? (
                                <>
                                    <span className="material-symbols-outlined text-lg">check</span>
                                    Sent!
                                </>
                            ) : (
                                'Send Email'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
