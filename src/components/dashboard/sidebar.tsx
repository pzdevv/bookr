'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { Logo } from '@/components/ui/logo';

interface DashboardSidebarProps {
    isAdmin?: boolean;
}

const navItems = [
    { icon: 'home', label: 'Home', href: '/dashboard' },
    { icon: 'schedule', label: 'Availability', href: '/dashboard/availability' },
    { icon: 'calendar_month', label: 'Bookings', href: '/dashboard/bookings' },
    { icon: 'settings', label: 'Settings', href: '/dashboard/settings' },
];

export function DashboardHeader() {
    return null;
}

export function DashboardSidebar({ isAdmin = false }: DashboardSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { userProfile, signOut } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [copied, setCopied] = useState(false);

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
        navigator.clipboard.writeText(`${window.location.origin}/book/${slug}/meeting`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 bg-white/70 backdrop-blur-xl border-b border-white/20">
                <Logo size="sm" href="/dashboard" />
                <button className="w-10 h-10 rounded-xl bg-white/50 backdrop-blur flex items-center justify-center" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    <span className="material-symbols-outlined text-[#1c180c]">{isMobileMenuOpen ? 'close' : 'menu'}</span>
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] pt-16" onClick={() => setIsMobileMenuOpen(false)}>
                        <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="w-72 h-full bg-white/90 backdrop-blur-2xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
                            <nav className="flex flex-col gap-2 mt-4">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                                    return (
                                        <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 ${isActive
                                                ? 'bg-gradient-to-r from-[#fbbd23]/20 to-orange-400/10 text-[#1c180c]'
                                                : 'text-gray-600 hover:bg-gray-100/80'}`}>
                                            <span className={`material-symbols-outlined text-xl ${isActive ? 'text-[#fbbd23]' : ''}`}>{item.icon}</span>
                                            <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                            <div className="mt-8">
                                <button onClick={handleCopyLink} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#fbbd23] to-orange-500 py-4 px-4 text-white font-bold text-sm shadow-lg shadow-[#fbbd23]/30 hover:shadow-xl transition-all">
                                    <span className="material-symbols-outlined text-xl">{copied ? 'check' : 'content_copy'}</span>
                                    <span>{copied ? 'Link Copied!' : 'Copy Booking Link'}</span>
                                </button>
                            </div>
                            <div className="absolute bottom-6 left-6 right-6">
                                <button onClick={handleSignOut} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 py-3 text-red-600 font-medium text-sm hover:bg-red-100 transition-all">
                                    <span className="material-symbols-outlined text-xl">logout</span>
                                    Sign Out
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar - Glassmorphic */}
            <aside className="w-72 hidden md:flex flex-col fixed inset-y-0 left-0 z-40 bg-white/60 backdrop-blur-2xl border-r border-white/30 shadow-2xl shadow-black/5">
                {/* Logo */}
                <div className="p-6 pb-2">
                    <Logo size="md" href="/dashboard" />
                </div>

                {/* User Profile Mini */}
                <div className="mx-4 mt-2 mb-4 p-4 rounded-2xl bg-gradient-to-br from-white/80 to-white/40 backdrop-blur border border-white/50 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fbbd23]/20 to-orange-300/20 flex items-center justify-center">
                            <span className="text-[#fbbd23] font-bold">{userProfile?.name?.charAt(0) || 'U'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-[#1c180c] truncate">{userProfile?.name || 'User'}</p>
                            <p className="text-[11px] text-gray-400 truncate">{userProfile?.email || ''}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-3">Menu</p>
                    <div className="flex flex-col gap-1.5">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                            return (
                                <Link key={item.href} href={item.href}
                                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                        ? 'bg-gradient-to-r from-[#fbbd23]/25 to-orange-400/15 shadow-sm'
                                        : 'hover:bg-white/60'}`}>
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${isActive
                                        ? 'bg-gradient-to-br from-[#fbbd23] to-orange-500 shadow-md shadow-[#fbbd23]/30'
                                        : 'bg-gray-100/80 group-hover:bg-gray-200/80'}`}>
                                        <span className={`material-symbols-outlined text-lg ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`}>{item.icon}</span>
                                    </div>
                                    <span className={`text-sm ${isActive ? 'font-bold text-[#1c180c]' : 'font-medium text-gray-600 group-hover:text-gray-900'}`}>{item.label}</span>
                                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#fbbd23]" />}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Bottom Actions */}
                <div className="p-4 space-y-3">
                    <button onClick={handleCopyLink} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#fbbd23] to-orange-500 py-3.5 px-4 text-white font-bold text-sm shadow-lg shadow-[#fbbd23]/30 hover:shadow-xl hover:scale-[1.02] transition-all">
                        <span className="material-symbols-outlined text-lg">{copied ? 'check_circle' : 'link'}</span>
                        <span>{copied ? 'Copied!' : 'Copy Booking Link'}</span>
                    </button>
                    <button onClick={handleSignOut} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/50 hover:bg-red-50 py-2.5 text-gray-500 hover:text-red-600 font-medium text-sm transition-all">
                        <span className="material-symbols-outlined text-lg">logout</span>
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}
