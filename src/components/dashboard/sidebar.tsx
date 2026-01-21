'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { Logo } from '@/components/ui/logo';
import gsap from 'gsap';

interface DashboardSidebarProps {
    isAdmin?: boolean;
}

const navItems = [
    { icon: 'home', label: 'Home', href: '/dashboard' },
    { icon: 'schedule', label: 'Availability', href: '/dashboard/availability' },
    { icon: 'calendar_month', label: 'Bookings', href: '/dashboard/bookings' },
    { icon: 'settings', label: 'Settings', href: '/dashboard/settings' },
];

// Production domain for booking links
const BOOKING_DOMAIN = 'bookncall.me';

export function DashboardHeader() {
    return null;
}

export function DashboardSidebar({ isAdmin = false }: DashboardSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { userProfile, signOut } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const logoRef = useRef<HTMLDivElement>(null);
    const navRef = useRef<HTMLDivElement>(null);

    // GSAP entrance animation
    useEffect(() => {
        if (logoRef.current) {
            gsap.fromTo(logoRef.current,
                { opacity: 0, x: -20, scale: 0.9 },
                { opacity: 1, x: 0, scale: 1, duration: 0.6, ease: 'back.out(1.7)', delay: 0.2 }
            );
        }
        if (navRef.current) {
            const navItems = navRef.current.querySelectorAll('.nav-item');
            gsap.fromTo(navItems,
                { opacity: 0, x: -30 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 0.5,
                    stagger: 0.1,
                    ease: 'power3.out',
                    delay: 0.4
                }
            );
        }
    }, []);

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    const getUserSlug = () => {
        if (userProfile?.username) return userProfile.username;
        if (userProfile?.name) return userProfile.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        return null;
    };

    const handleCopyLink = () => {
        const slug = getUserSlug();
        if (!slug) return;

        // Use the production domain for booking links
        navigator.clipboard.writeText(`https://${BOOKING_DOMAIN}/${slug}`);
        setCopied(true);

        // GSAP animation on copy
        gsap.fromTo('.copy-btn',
            { scale: 1 },
            { scale: 1.1, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.out' }
        );

        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4" style={{ background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(133, 0, 0, 0.05)' }}>
                <Logo size="sm" href="/dashboard" />
                <button className="w-10 h-10 rounded-lg bg-[#850000]/5 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    <span className="material-symbols-outlined text-[#1d0c0c]">{isMobileMenuOpen ? 'close' : 'menu'}</span>
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] pt-16" onClick={() => setIsMobileMenuOpen(false)}>
                        <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="w-72 h-full bg-white shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
                            <nav className="flex flex-col gap-2 mt-4">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                                    return (
                                        <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center gap-4 px-4 py-3.5 rounded-lg transition-all ${isActive
                                                ? 'bg-[#850000] text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                                                : 'text-[#6b4444] hover:bg-[#850000]/5'}`}>
                                            <span className="material-symbols-outlined text-xl">{item.icon}</span>
                                            <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                            <div className="mt-8">
                                <button onClick={handleCopyLink} className="copy-btn flex w-full items-center justify-center gap-2 rounded-lg bg-[#850000] py-4 px-4 text-white font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                                    <span className="material-symbols-outlined text-xl">{copied ? 'check' : 'content_copy'}</span>
                                    <span>{copied ? 'Link Copied!' : 'Copy Booking Link'}</span>
                                </button>
                            </div>
                            <div className="absolute bottom-6 left-6 right-6">
                                <button onClick={handleSignOut} className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 py-3 text-red-600 font-medium text-sm hover:bg-red-100 transition-all border border-red-100">
                                    <span className="material-symbols-outlined text-xl">logout</span>
                                    Sign Out
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <aside className="w-72 hidden md:flex flex-col fixed inset-y-0 left-0 z-40 bg-white border-r border-[#850000]/5">
                {/* Logo */}
                <div className="p-6 pb-2" ref={logoRef}>
                    <Logo size="md" href="/dashboard" />
                </div>

                {/* User Profile Mini */}
                <div className="mx-4 mt-2 mb-4 p-4 rounded-xl bg-[#850000]/5 border border-[#850000]/10 shadow-[3px_3px_0px_0px_rgba(133,0,0,0.1)]">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-lg bg-[#850000] flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-cover bg-center"
                            style={userProfile?.avatar ? { backgroundImage: `url('${userProfile.avatar}')` } : undefined}
                        >
                            {!userProfile?.avatar && <span className="text-white font-bold">{userProfile?.name?.charAt(0) || 'U'}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-[#1d0c0c] truncate">{userProfile?.name || 'User'}</p>
                            <p className="text-[11px] text-[#6b4444] truncate">{userProfile?.email || ''}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-2" ref={navRef}>
                    <p className="text-[10px] font-bold text-[#6b4444] uppercase tracking-wider px-3 mb-3">Menu</p>
                    <div className="flex flex-col gap-1.5">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                            return (
                                <Link key={item.href} href={item.href}
                                    className={`nav-item flex items-center gap-4 px-4 py-3 rounded-lg transition-all group ${isActive
                                        ? 'bg-[#850000] text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                                        : 'hover:bg-[#850000]/5'}`}>
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${isActive
                                        ? 'bg-white/20'
                                        : 'bg-[#850000]/5 group-hover:bg-[#850000]/10'}`}>
                                        <span className={`material-symbols-outlined text-lg ${isActive ? 'text-white' : 'text-[#6b4444] group-hover:text-[#850000]'}`}>{item.icon}</span>
                                    </div>
                                    <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium text-[#6b4444] group-hover:text-[#1d0c0c]'}`}>{item.label}</span>
                                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Bottom Actions */}
                <div className="p-4 space-y-3">
                    <button onClick={handleCopyLink} className="copy-btn flex w-full items-center justify-center gap-2 rounded-lg bg-[#850000] py-3.5 px-4 text-white font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                        <span className="material-symbols-outlined text-lg">{copied ? 'check_circle' : 'link'}</span>
                        <span>{copied ? 'Copied!' : 'Copy Booking Link'}</span>
                    </button>
                    <button onClick={handleSignOut} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#850000]/5 hover:bg-red-50 py-2.5 text-[#4a2c2c] hover:text-red-600 font-medium text-sm transition-all border border-[#850000]/10">
                        <span className="material-symbols-outlined text-lg">logout</span>
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}
