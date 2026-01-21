'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/layout';
import { useAuth } from '@/lib/hooks/use-auth';
import { bookingService, eventTypeService, Booking, EventType } from '@/lib/appwrite/database';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Get booking URL base - uses current origin with /book path
const getBookingBaseUrl = () => {
    if (typeof window === 'undefined') return '/book';
    return `${window.location.origin}/book`;
};

export default function DashboardPage() {
    const { userProfile, user, isLoading: authLoading, refreshUser } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [eventTypes, setEventTypes] = useState<EventType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, upcoming: 0, week: 0 });
    const [copied, setCopied] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [error, setError] = useState('');

    // Refs for GSAP animations
    const containerRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const linkCardRef = useRef<HTMLDivElement>(null);
    const statsRef = useRef<HTMLDivElement>(null);
    const mainGridRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);

        if (authLoading) return;

        if (!user) {
            setIsLoading(false);
            return;
        }

        const loadData = async () => {
            if (!userProfile) {
                try {
                    await refreshUser();
                } catch (e) {
                    console.log('Failed to refresh user:', e);
                }
                setIsLoading(false);
                return;
            }

            try {
                const [upcomingBookings, allBookings, events] = await Promise.all([
                    bookingService.listUpcoming(userProfile.$id).catch(() => []),
                    bookingService.listByUser(userProfile.$id).catch(() => []),
                    eventTypeService.listByUser(userProfile.$id).catch(() => []),
                ]);

                setBookings(upcomingBookings);
                setEventTypes(events);

                const now = new Date();
                const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
                const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
                const weekBookings = allBookings.filter(b => {
                    const date = new Date(b.slotTime);
                    return date >= weekStart && date < weekEnd;
                });

                setStats({
                    total: allBookings.length,
                    upcoming: upcomingBookings.length,
                    week: weekBookings.length,
                });
            } catch (error: any) {
                console.error('Dashboard load error:', error);
                setError(error.message || 'Failed to load data');
            }
            finally { setIsLoading(false); }
        };

        loadData();
    }, [userProfile, user, authLoading, refreshUser]);

    // GSAP Scroll Animations - HEAVY & SMOOTH
    useEffect(() => {
        if (isLoading || authLoading) return;

        const ctx = gsap.context(() => {
            // Header entrance
            if (headerRef.current) {
                gsap.fromTo(headerRef.current,
                    { opacity: 0, y: -50, scale: 0.95 },
                    {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        duration: 1,
                        ease: 'power4.out'
                    }
                );
            }

            // Link Card - Epic entrance with rotation
            if (linkCardRef.current) {
                gsap.fromTo(linkCardRef.current,
                    {
                        opacity: 0,
                        y: 80,
                        scale: 0.9,
                        rotateX: 15
                    },
                    {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        rotateX: 0,
                        duration: 1.2,
                        ease: 'power3.out',
                        delay: 0.2
                    }
                );
            }

            // Stats Cards - Staggered pop-in
            if (statsRef.current) {
                const statCards = statsRef.current.querySelectorAll('.stat-card');
                gsap.fromTo(statCards,
                    {
                        opacity: 0,
                        y: 60,
                        scale: 0.8,
                        rotateY: -15
                    },
                    {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        rotateY: 0,
                        duration: 0.8,
                        stagger: 0.15,
                        ease: 'back.out(1.7)',
                        delay: 0.4
                    }
                );
            }

            // Main Grid sections - Animate on load instead of scroll
            if (mainGridRef.current) {
                const sections = mainGridRef.current.querySelectorAll('.animate-section');

                gsap.fromTo(sections,
                    {
                        opacity: 0,
                        y: 50,
                        scale: 0.95
                    },
                    {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        duration: 0.8,
                        stagger: 0.15,
                        ease: 'power3.out',
                        delay: 0.6
                    }
                );

                // Booking items - staggered entrance
                const bookingItems = mainGridRef.current.querySelectorAll('.booking-item');
                if (bookingItems.length > 0) {
                    gsap.fromTo(bookingItems,
                        {
                            opacity: 0,
                            x: -30
                        },
                        {
                            opacity: 1,
                            x: 0,
                            duration: 0.5,
                            stagger: 0.1,
                            ease: 'power2.out',
                            delay: 0.8
                        }
                    );
                }

                // Quick action items
                const actionItems = mainGridRef.current.querySelectorAll('.action-item');
                if (actionItems.length > 0) {
                    gsap.fromTo(actionItems,
                        {
                            opacity: 0,
                            x: 30
                        },
                        {
                            opacity: 1,
                            x: 0,
                            duration: 0.5,
                            stagger: 0.1,
                            ease: 'power2.out',
                            delay: 0.9
                        }
                    );
                }
            }

            // Parallax effect on scroll
            gsap.to('.parallax-bg', {
                yPercent: 30,
                ease: 'none',
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true
                }
            });

        }, containerRef);

        return () => ctx.revert();
    }, [isLoading, authLoading]);

    const getUserSlug = () => {
        if (userProfile?.username) return userProfile.username;
        if (userProfile?.name) return userProfile.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        return null;
    };

    const getDefaultEventSlug = () => eventTypes.length > 0 ? eventTypes[0].slug : 'meeting';

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
            { scale: 1.15, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.out' }
        );

        setTimeout(() => setCopied(false), 2000);
    };

    const formatBookingTime = (isoTime: string) => {
        const date = new Date(isoTime);
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let dayLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        if (date.toDateString() === now.toDateString()) dayLabel = 'Today';
        else if (date.toDateString() === tomorrow.toDateString()) dayLabel = 'Tomorrow';

        return {
            day: dayLabel,
            time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        };
    };

    if (isLoading || authLoading) {
        return (
            <DashboardLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-[#850000] flex items-center justify-center animate-pulse shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <span className="material-symbols-outlined text-white text-3xl">calendar_today</span>
                        </div>
                        <p className="text-[#6b4444] text-sm font-medium">Loading your dashboard...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (user && !userProfile) {
        return (
            <DashboardLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 text-center max-w-md p-6">
                        <div className="w-16 h-16 rounded-xl bg-[#850000] flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <span className="material-symbols-outlined text-white text-3xl">person_add</span>
                        </div>
                        <h2 className="text-xl font-bold text-[#1d0c0c]">Setting up your account...</h2>
                        <p className="text-[#6b4444] text-sm">This may take a moment for new accounts.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-6 py-2.5 rounded-lg bg-[#850000] text-white font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div ref={containerRef} className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6" style={{ perspective: '1000px' }}>
                {/* Welcome Header */}
                <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-[#1d0c0c]">
                            Welcome back, {userProfile?.name?.split(' ')[0]} 👋
                        </h1>
                        <p className="text-[#6b4444] text-sm mt-1">Here's what's happening with your bookings</p>
                    </div>
                    <Link href="/dashboard/settings" className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-[#850000]/10 shadow-[3px_3px_0px_0px_rgba(133,0,0,0.1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all text-sm font-medium text-[#850000]">
                        <span className="material-symbols-outlined text-lg">settings</span>
                        Settings
                    </Link>
                </div>

                {/* Booking Link Card */}
                <div ref={linkCardRef} className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1d0c0c] via-[#2a1515] to-[#1d0c0c] p-6 lg:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" style={{ transformStyle: 'preserve-3d' }}>
                    <div className="parallax-bg absolute top-0 right-0 w-80 h-80 bg-[#850000] opacity-20 blur-[120px] rounded-full" />
                    <div className="parallax-bg absolute bottom-0 left-0 w-60 h-60 bg-[#850000] opacity-15 blur-[100px] rounded-full" />

                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-lg flex items-center justify-center border border-white/20 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]">
                                    <span className="material-symbols-outlined text-[#850000] text-2xl" style={{ filter: 'brightness(2)' }}>link</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Your Booking Link</h2>
                                    <p className="text-white/50 text-xs">Share to get bookings</p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2 bg-white/5 backdrop-blur-xl p-2 pr-4 rounded-lg border border-white/10 w-fit">
                                <span className="bg-green-500 text-white px-3 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]">
                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                    LIVE
                                </span>
                                <code className="text-sm font-mono text-white/70 truncate max-w-[250px] lg:max-w-none">
                                    {mounted && getUserSlug() ? `${window.location.host}/book/${getUserSlug()}` : '...'}
                                </code>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleCopyLink} disabled={!getUserSlug()} className="copy-btn flex items-center gap-2 px-5 py-3 rounded-lg bg-[#850000] text-white font-bold shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50">
                                <span className="material-symbols-outlined">{copied ? 'check_circle' : 'content_copy'}</span>
                                {copied ? 'Copied!' : 'Copy Link'}
                            </button>
                            <Link href={mounted && getUserSlug() ? `/book/${getUserSlug()}/${getDefaultEventSlug()}` : '#'} target="_blank" className="flex items-center gap-2 px-4 py-3 rounded-lg bg-white/10 backdrop-blur border border-white/20 text-white font-medium hover:bg-white/20 transition-all shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]">
                                <span className="material-symbols-outlined">open_in_new</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="stat-card bg-white rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(133,0,0,0.15)] border border-[#850000]/5 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(133,0,0,0.1)] hover:border-[#850000]/10 transition-all duration-200 group cursor-default" style={{ transformStyle: 'preserve-3d' }}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#850000] to-[#6b0000] flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                <span className="material-symbols-outlined text-white text-xl">confirmation_number</span>
                            </div>
                            <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-md group-hover:scale-105 transition-transform">ALL TIME</span>
                        </div>
                        <p className="text-3xl font-black text-[#1d0c0c] group-hover:text-[#850000] transition-colors">{stats.total}</p>
                        <p className="text-sm text-[#6b4444] mt-0.5">Total Bookings</p>
                    </div>

                    <div className="stat-card bg-white rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(133,0,0,0.15)] border border-[#850000]/5 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(133,0,0,0.1)] hover:border-blue-200 transition-all duration-200 group cursor-default" style={{ transformStyle: 'preserve-3d' }}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                <span className="material-symbols-outlined text-white text-xl">upcoming</span>
                            </div>
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-md group-hover:scale-105 transition-transform">SCHEDULED</span>
                        </div>
                        <p className="text-3xl font-black text-[#1d0c0c] group-hover:text-blue-600 transition-colors">{stats.upcoming}</p>
                        <p className="text-sm text-[#6b4444] mt-0.5">Upcoming</p>
                    </div>

                    <div className="stat-card bg-white rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(133,0,0,0.15)] border border-[#850000]/5 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(133,0,0,0.1)] hover:border-purple-200 transition-all duration-200 group cursor-default" style={{ transformStyle: 'preserve-3d' }}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                <span className="material-symbols-outlined text-white text-xl">date_range</span>
                            </div>
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-md group-hover:scale-105 transition-transform">THIS WEEK</span>
                        </div>
                        <p className="text-3xl font-black text-[#1d0c0c] group-hover:text-purple-600 transition-colors">{stats.week}</p>
                        <p className="text-sm text-[#6b4444] mt-0.5">This Week</p>
                    </div>
                </div>

                {/* Main Grid */}
                <div ref={mainGridRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Upcoming Bookings */}
                    <div className="animate-section lg:col-span-2 bg-white rounded-xl shadow-[4px_4px_0px_0px_rgba(133,0,0,0.1)] border border-[#850000]/5 overflow-hidden">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-[#850000]/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[#850000] flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <span className="material-symbols-outlined text-white">event</span>
                                </div>
                                <h3 className="text-lg font-bold text-[#1d0c0c]">Upcoming Bookings</h3>
                            </div>
                            <Link href="/dashboard/bookings" className="text-sm font-bold text-[#850000] hover:underline flex items-center gap-1">
                                View All
                                <span className="material-symbols-outlined text-base">chevron_right</span>
                            </Link>
                        </div>

                        {bookings.length > 0 ? (
                            <div className="divide-y divide-[#850000]/5">
                                {bookings.slice(0, 4).map((booking, index) => {
                                    const { day, time } = formatBookingTime(booking.slotTime);
                                    const isFirst = index === 0;
                                    return (
                                        <div key={booking.$id} className={`booking-item group flex items-center gap-4 px-6 py-4 hover:bg-gradient-to-r hover:from-[#850000]/[0.03] hover:to-transparent transition-all duration-200 cursor-pointer ${isFirst ? 'bg-gradient-to-r from-[#850000]/[0.05] to-transparent' : ''}`}>
                                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold shrink-0 transition-all duration-200 group-hover:scale-105 ${isFirst ? 'bg-gradient-to-br from-[#850000] to-[#6b0000] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-[#850000]/10 text-[#850000] group-hover:bg-[#850000]/15'}`}>
                                                {booking.guestName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-[#1d0c0c] truncate group-hover:text-[#850000] transition-colors">{booking.guestName}</h4>
                                                    {isFirst && <span className="text-[9px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-md animate-pulse">NEXT</span>}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="flex items-center gap-1.5 text-xs text-[#6b4444] group-hover:text-[#1d0c0c] transition-colors">
                                                        <span className="material-symbols-outlined text-sm text-[#850000]/60">calendar_today</span>
                                                        {day}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-xs text-[#6b4444] group-hover:text-[#1d0c0c] transition-colors">
                                                        <span className="material-symbols-outlined text-sm text-[#850000]/60">schedule</span>
                                                        {time}
                                                    </span>
                                                </div>
                                            </div>
                                            {isFirst ? (
                                                <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#850000] to-[#6b0000] text-white text-sm font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:from-[#6b0000] hover:to-[#4d0000] transition-all duration-200">
                                                    <span className="material-symbols-outlined text-lg">videocam</span>
                                                    Join Call
                                                </button>
                                            ) : (
                                                <span className="material-symbols-outlined text-[#6b4444]/30 group-hover:text-[#850000] transition-colors">chevron_right</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-14 text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-[#850000]/10 to-[#850000]/5 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[3px_3px_0px_0px_rgba(133,0,0,0.1)]">
                                    <span className="material-symbols-outlined text-[#850000]/40 text-4xl">event_busy</span>
                                </div>
                                <h4 className="font-bold text-[#1d0c0c] mb-2 text-lg">No upcoming bookings</h4>
                                <p className="text-[#6b4444] text-sm mb-5">Share your booking link to get started!</p>
                                <button onClick={handleCopyLink} className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#850000] to-[#6b0000] text-white font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] hover:from-[#6b0000] hover:to-[#4d0000] transition-all duration-200 flex items-center gap-2 mx-auto">
                                    <span className="material-symbols-outlined">content_copy</span>
                                    Copy Your Link
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions Sidebar */}
                    <div className="space-y-4">
                        <div className="animate-section bg-white rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(133,0,0,0.15)] border border-[#850000]/5 hover:shadow-[3px_3px_0px_0px_rgba(133,0,0,0.1)] transition-all duration-200">
                            <h3 className="font-bold text-[#1d0c0c] mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#850000]">bolt</span>
                                Quick Actions
                            </h3>
                            <div className="space-y-2">
                                <Link href="/dashboard/availability" className="action-item flex items-center gap-3 p-3 rounded-xl border border-[#850000]/5 hover:bg-gradient-to-r hover:from-[#850000]/5 hover:to-transparent hover:border-[#850000]/15 transition-all duration-200 group shadow-[2px_2px_0px_0px_rgba(133,0,0,0.08)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#850000] to-[#6b0000] flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                                        <span className="material-symbols-outlined text-white text-lg">schedule</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm text-[#1d0c0c] group-hover:text-[#850000] transition-colors">Set Availability</p>
                                        <p className="text-[11px] text-[#6b4444]">Define working hours</p>
                                    </div>
                                    <span className="material-symbols-outlined text-[#6b4444]/30 group-hover:text-[#850000] group-hover:translate-x-1 transition-all">chevron_right</span>
                                </Link>
                                <Link href="/dashboard/settings" className="action-item flex items-center gap-3 p-3 rounded-xl border border-[#850000]/5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent hover:border-blue-200 transition-all duration-200 group shadow-[2px_2px_0px_0px_rgba(133,0,0,0.08)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                                        <span className="material-symbols-outlined text-white text-lg">person</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm text-[#1d0c0c] group-hover:text-blue-600 transition-colors">Edit Profile</p>
                                        <p className="text-[11px] text-[#6b4444]">Update your info</p>
                                    </div>
                                    <span className="material-symbols-outlined text-[#6b4444]/30 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">chevron_right</span>
                                </Link>
                            </div>
                        </div>

                        {/* Voice Call Promo */}
                        <div className="animate-section bg-gradient-to-br from-[#850000] via-[#6b0000] to-[#4d0000] rounded-xl p-5 text-white relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="parallax-bg absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-xl">call</span>
                                    <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-md">COMING SOON</span>
                                </div>
                                <h3 className="font-bold mb-1">Voice Calling</h3>
                                <p className="text-white/70 text-xs mb-3">Let guests call you directly from bookings.</p>
                                <button className="w-full py-2.5 rounded-lg bg-white text-[#850000] font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                                    Get Notified
                                </button>
                            </div>
                        </div>

                        {/* Event Types Section */}
                        <div className="animate-section bg-white rounded-xl shadow-[4px_4px_0px_0px_rgba(133,0,0,0.15)] border border-[#850000]/5 overflow-hidden hover:shadow-[3px_3px_0px_0px_rgba(133,0,0,0.1)] transition-all duration-200">
                            <div className="px-5 py-4 flex items-center justify-between border-b border-[#850000]/5 bg-gradient-to-r from-[#850000]/[0.02] to-transparent">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#850000] to-[#6b0000] flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,0.5)]">
                                        <span className="material-symbols-outlined text-white text-base">event</span>
                                    </div>
                                    <h3 className="font-bold text-[#1d0c0c]">Event Types</h3>
                                    <span className="text-[10px] font-bold text-[#850000] bg-[#850000]/10 px-2 py-0.5 rounded-md">{eventTypes.length}/3</span>
                                </div>
                                <Link href="/dashboard/event-types" className="text-xs font-bold text-[#850000] hover:text-[#6b0000] flex items-center gap-1 transition-colors group">
                                    Manage
                                    <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">chevron_right</span>
                                </Link>
                            </div>
                            <div className="divide-y divide-[#850000]/5">
                                {eventTypes.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <div className="w-14 h-14 bg-gradient-to-br from-[#850000]/10 to-[#850000]/5 rounded-xl flex items-center justify-center mx-auto mb-4">
                                            <span className="material-symbols-outlined text-[#850000]/40 text-3xl">add</span>
                                        </div>
                                        <p className="text-sm text-[#6b4444] mb-4">No event types yet</p>
                                        <Link href="/dashboard/event-types" className="inline-flex items-center gap-1.5 text-sm font-bold text-white bg-gradient-to-r from-[#850000] to-[#6b0000] px-4 py-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                                            <span className="material-symbols-outlined text-base">add</span>
                                            Create Event Type
                                        </Link>
                                    </div>
                                ) : (
                                    eventTypes.map((event) => (
                                        <Link key={event.$id} href="/dashboard/event-types" className="flex items-center gap-3 px-5 py-3.5 hover:bg-gradient-to-r hover:from-[#850000]/[0.03] hover:to-transparent transition-all duration-200 group cursor-pointer">
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)]"
                                                style={{ backgroundColor: `${event.color}20`, color: event.color }}
                                            >
                                                <span className="material-symbols-outlined text-lg">videocam</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm text-[#1d0c0c] truncate group-hover:text-[#850000] transition-colors">{event.title}</p>
                                                <p className="text-[11px] text-[#6b4444]">{event.duration} min</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full shrink-0 ${event.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-300'}`} title={event.isActive ? 'Active' : 'Inactive'} />
                                                <span className="material-symbols-outlined text-[#6b4444]/30 text-lg group-hover:text-[#850000] transition-colors">edit</span>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
