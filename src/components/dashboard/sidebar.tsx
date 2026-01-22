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
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}


const navItems = [
    { icon: 'home', label: 'Home', href: '/dashboard' },
    { icon: 'event', label: 'Event Types', href: '/dashboard/event-types' },
    { icon: 'schedule', label: 'Availability', href: '/dashboard/availability' },
    { icon: 'calendar_month', label: 'Bookings', href: '/dashboard/bookings' },
    { icon: 'history', label: 'Call History', href: '/dashboard/call-history' },
    { icon: 'settings', label: 'Settings', href: '/dashboard/settings' },
];

// Get booking URL base - uses current origin with /book path
const getBookingBaseUrl = () => {
    if (typeof window === 'undefined') return '/book';
    return `${window.location.origin}/book`;
};

export function DashboardHeader() {
    return null;
}

export function DashboardSidebar({ isAdmin = false, isCollapsed = false, onToggleCollapse }: DashboardSidebarProps) {
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

        // Get dynamic booking URL
        const baseUrl = getBookingBaseUrl();
        const bookingUrl = baseUrl.includes('/book')
            ? `${baseUrl}/${slug}`
            : `${baseUrl}/${slug}`;
        navigator.clipboard.writeText(bookingUrl);
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
                        <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="w-72 h-full bg-white shadow-2xl p-6 flex flex-col" onClick={(e) => e.stopPropagation()}>
                            <div className="mb-6">
                                <Logo size="md" href="/dashboard" />
                            </div>
                            <nav className="flex flex-col gap-2 flex-1">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                                    return (
                                        <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${isActive
                                                ? 'bg-[#1d0c0c] text-white shadow-lg shadow-[#1d0c0c]/20'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-[#1d0c0c]'}`}>
                                            <span className="material-symbols-outlined text-xl">{item.icon}</span>
                                            <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                            <div className="space-y-3 mt-auto">
                                <button onClick={handleCopyLink} className="copy-btn flex w-full items-center justify-center gap-2 rounded-xl bg-[#850000] py-3.5 px-4 text-white font-bold text-sm shadow-md hover:shadow-lg hover:bg-[#6b0000] transition-all active:scale-95">
                                    <span className="material-symbols-outlined text-xl">{copied ? 'check' : 'content_copy'}</span>
                                    <span>{copied ? 'Link Copied!' : 'Copy Booking Link'}</span>
                                </button>
                                <button onClick={handleSignOut} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-50 py-3 text-red-600 font-medium text-sm hover:bg-red-50 transition-all border border-gray-100">
                                    <span className="material-symbols-outlined text-xl">logout</span>
                                    Sign Out
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <aside className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-100 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'}`}>
                {/* Logo */}
                <div className={`p-6 pb-2 ${isCollapsed ? 'flex justify-center' : ''}`} ref={logoRef}>
                    <Logo size={isCollapsed ? "sm" : "md"} href="/dashboard" />
                </div>

                {/* Toggle Button (Desktop Only) */}
                <button
                    onClick={onToggleCollapse}
                    className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-100 rounded-full shadow-sm flex items-center justify-center text-gray-400 hover:text-[#850000] z-50 transition-colors"
                >
                    <span className="material-symbols-outlined text-sm">{isCollapsed ? 'chevron_right' : 'chevron_left'}</span>
                </button>

                {/* User Profile Mini */}
                <div className={`mx-4 mt-2 mb-4 p-2 rounded-2xl bg-gray-50 border border-gray-100 hover:border-[#850000]/20 transition-all cursor-pointer group ${isCollapsed ? 'justify-center mx-2' : ''}`}>
                    <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                        <div
                            className="w-10 h-10 rounded-xl bg-[#1d0c0c] flex items-center justify-center text-white shadow-md bg-cover bg-center group-hover:scale-105 transition-transform"
                            style={userProfile?.avatar ? { backgroundImage: `url('${userProfile.avatar}')` } : undefined}
                        >
                            {!userProfile?.avatar && <span className="font-bold">{userProfile?.name?.charAt(0) || 'U'}</span>}
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-[#1d0c0c] truncate group-hover:text-[#850000] transition-colors">{userProfile?.name || 'User'}</p>
                                <p className="text-xs text-gray-500 truncate">{userProfile?.email || ''}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className={`flex-1 overflow-y-auto px-4 py-2 ${isCollapsed ? 'px-2' : ''}`} ref={navRef}>
                    {!isCollapsed && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 mb-3">Main Menu</p>}
                    <div className="flex flex-col gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                            return (
                                <Link key={item.href} href={item.href}
                                    title={isCollapsed ? item.label : ''}
                                    className={`nav-item flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive
                                        ? 'bg-[#1d0c0c] text-white shadow-lg shadow-[#1d0c0c]/10'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-[#1d0c0c]'} ${isCollapsed ? 'justify-center px-0' : ''}`}>
                                    <span className={`material-symbols-outlined text-xl transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#850000]'}`}>{item.icon}</span>
                                    {!isCollapsed && <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>}
                                    {!isCollapsed && isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Bottom Actions */}
                <div className={`p-6 space-y-3 border-t border-gray-50 ${isCollapsed ? 'p-3' : ''}`}>
                    <button onClick={handleCopyLink} className={`copy-btn flex w-full items-center justify-center gap-2 rounded-xl bg-[#850000] py-3.5 ${isCollapsed ? 'px-0' : 'px-4'} text-white font-bold text-sm shadow-md hover:shadow-lg hover:bg-[#6b0000] transition-all active:scale-95`} title={isCollapsed ? "Copy Link" : ""}>
                        <span className="material-symbols-outlined text-lg">{copied ? 'check_circle' : 'link'}</span>
                        {!isCollapsed && <span>{copied ? 'Copied!' : 'Copy Link'}</span>}
                    </button>
                    <button onClick={handleSignOut} className={`flex w-full items-center justify-center gap-2 rounded-xl bg-white hover:bg-red-50 py-2.5 text-gray-500 hover:text-red-600 font-medium text-sm transition-all border border-gray-200 hover:border-red-200 ${isCollapsed ? 'px-0' : ''}`} title={isCollapsed ? "Sign Out" : ""}>
                        <span className="material-symbols-outlined text-lg">logout</span>
                        {!isCollapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
