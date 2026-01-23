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
    const [stats, setStats] = useState({ total: 0, upcoming: 0, week: 0, pending: 0 });
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
                    pending: allBookings.filter(b => b.status === 'pending').length
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
                <div ref={headerRef} className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-[#1d0c0c] tracking-tight">
                            Welcome back, {userProfile?.name?.split(' ')[0]} 👋
                        </h1>
                        <p className="text-[#6b4444] mt-1 text-base">Here's what's happening today</p>
                    </div>
                    <Link href="/dashboard/settings" className="self-start md:self-auto flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-[#850000]/20 transition-all text-sm font-medium text-[#1d0c0c]">
                        <span className="material-symbols-outlined text-lg">settings</span>
                        Settings
                    </Link>
                </div>

                {/* Booking Link Card - Modern & Sleek */}
                <div ref={linkCardRef} className="relative overflow-hidden rounded-3xl bg-[#1d0c0c] p-8 shadow-2xl ring-1 ring-white/10">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#850000] opacity-20 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />

                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-[#850000] to-[#6b0000] rounded-2xl flex items-center justify-center shadow-lg shadow-[#850000]/20">
                                    <span className="material-symbols-outlined text-white text-2xl">link</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-1">Your Booking Page</h2>
                                    <p className="text-white/60">Share this link to let people book time with you</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md p-2 pr-5 rounded-xl border border-white/10 w-fit hover:bg-white/10 transition-colors">
                                <span className="bg-green-500/20 text-green-400 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider flex items-center gap-1.5 border border-green-500/20">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                    LIVE
                                </span>
                                <code className="text-sm font-mono text-white/90">
                                    {mounted && getUserSlug() ? `${window.location.host}/book/${getUserSlug()}` : '...'}
                                </code>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full lg:w-auto">
                            <button onClick={handleCopyLink} disabled={!getUserSlug()} className="copy-btn flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-[#1d0c0c] font-bold hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50">
                                <span className="material-symbols-outlined text-xl">{copied ? 'check_circle' : 'content_copy'}</span>
                                {copied ? 'Copied' : 'Copy Link'}
                            </button>
                            <Link href={mounted && getUserSlug() ? `/book/${getUserSlug()}/${getDefaultEventSlug()}` : '#'} target="_blank" className="flex items-center justify-center px-4 py-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-all active:scale-95">
                                <span className="material-symbols-outlined text-xl">open_in_new</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="stat-card bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-[#850000]/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[#850000] text-2xl">confirmation_number</span>
                            </div>
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">ALL TIME</span>
                        </div>
                        <p className="text-4xl font-extrabold text-[#1d0c0c] tracking-tight">{stats.total}</p>
                        <p className="text-sm font-medium text-gray-500 mt-1">Total Bookings</p>
                    </div>

                    <div className="stat-card bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                                <span className="material-symbols-outlined text-orange-600 text-2xl">hourglass_empty</span>
                            </div>
                            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">ACTION NEEDED</span>
                        </div>
                        <p className="text-4xl font-extrabold text-[#1d0c0c] tracking-tight">{stats.pending}</p>
                        <p className="text-sm font-medium text-gray-500 mt-1">Pending Requests</p>
                    </div>

                    <div className="stat-card bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                                <span className="material-symbols-outlined text-blue-600 text-2xl">upcoming</span>
                            </div>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">SCHEDULED</span>
                        </div>
                        <p className="text-4xl font-extrabold text-[#1d0c0c] tracking-tight">{stats.upcoming}</p>
                        <p className="text-sm font-medium text-gray-500 mt-1">Upcoming</p>
                    </div>

                    <div className="stat-card bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                                <span className="material-symbols-outlined text-purple-600 text-2xl">date_range</span>
                            </div>
                            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">THIS WEEK</span>
                        </div>
                        <p className="text-4xl font-extrabold text-[#1d0c0c] tracking-tight">{stats.week}</p>
                        <p className="text-sm font-medium text-gray-500 mt-1">This Week</p>
                    </div>
                </div>

                {/* Main Grid */}
                <div ref={mainGridRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Upcoming Bookings */}
                    <div className="animate-section lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-8 py-6 flex items-center justify-between border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#850000] text-3xl">event_upcoming</span>
                                <h3 className="text-xl font-bold text-[#1d0c0c]">Upcoming Bookings</h3>
                            </div>
                            <Link href="/dashboard/bookings" className="px-4 py-2 rounded-full bg-gray-50 text-sm font-bold text-[#1d0c0c] hover:bg-gray-100 transition-colors flex items-center gap-1">
                                View All
                                <span className="material-symbols-outlined text-base">arrow_forward</span>
                            </Link>
                        </div>

                        {bookings.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {bookings.slice(0, 4).map((booking, index) => {
                                    const { day, time } = formatBookingTime(booking.slotTime);
                                    const isFirst = index === 0;
                                    return (
                                        <div key={booking.$id} className={`booking-item group flex items-center gap-6 px-8 py-6 hover:bg-gray-50/50 transition-all duration-200 cursor-pointer ${isFirst ? 'bg-[#850000]/[0.02]' : ''}`}>
                                            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-bold shrink-0 text-xl transition-all duration-200 ${isFirst ? 'bg-[#850000] text-white shadow-lg shadow-[#850000]/20' : 'bg-gray-100 text-gray-500 group-hover:bg-[#850000] group-hover:text-white'}`}>
                                                {booking.guestName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="font-bold text-[#1d0c0c] text-lg truncate">{booking.guestName}</h4>
                                                    {isFirst && <span className="text-[10px] font-bold bg-[#850000] text-white px-2 py-0.5 rounded-full">NEXT</span>}
                                                </div>
                                                <div className="flex items-center gap-4 mt-1.5">
                                                    <span className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
                                                        <span className="material-symbols-outlined text-base text-gray-400">calendar_today</span>
                                                        {day}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
                                                        <span className="material-symbols-outlined text-base text-gray-400">schedule</span>
                                                        {time}
                                                    </span>
                                                </div>
                                            </div>
                                            {isFirst ? (
                                                <Link
                                                    href={`/call/${booking.callRoomId}`}
                                                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1d0c0c] text-white text-sm font-bold shadow-md hover:bg-[#850000] hover:shadow-lg transition-all active:scale-95"
                                                >
                                                    <span className="material-symbols-outlined text-lg">videocam</span>
                                                    Join Call
                                                </Link>
                                            ) : (
                                                <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 group-hover:border-[#850000] group-hover:text-[#850000] transition-colors">
                                                    <span className="material-symbols-outlined">chevron_right</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-20 text-center">
                                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="material-symbols-outlined text-gray-300 text-5xl">event_busy</span>
                                </div>
                                <h4 className="font-bold text-[#1d0c0c] mb-2 text-xl">No upcoming bookings</h4>
                                <p className="text-gray-500 mb-8 max-w-sm mx-auto">Your schedule looks clear. Share your booking link to get started!</p>
                                <button onClick={handleCopyLink} className="px-8 py-3 rounded-xl bg-[#1d0c0c] text-white font-bold text-sm shadow-lg hover:bg-[#333] transition-all flex items-center gap-2 mx-auto">
                                    <span className="material-symbols-outlined">content_copy</span>
                                    Copy Your Link
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Column */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="animate-section bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-[#1d0c0c] mb-6 flex items-center gap-2 text-lg">
                                <span className="material-symbols-outlined text-[#850000]">bolt</span>
                                Quick Actions
                            </h3>
                            <div className="space-y-3">
                                <Link href="/dashboard/availability" className="action-item flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-[#850000]/20 hover:bg-gray-50 transition-all group">
                                    <div className="w-12 h-12 rounded-xl bg-[#850000]/5 flex items-center justify-center group-hover:bg-[#850000] transition-colors">
                                        <span className="material-symbols-outlined text-[#850000] group-hover:text-white transition-colors">schedule</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-[#1d0c0c]">Availability</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Set hours & buffers</p>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-300 group-hover:text-[#1d0c0c] transition-colors">chevron_right</span>
                                </Link>
                                <Link href="/dashboard/settings" className="action-item flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                                        <span className="material-symbols-outlined text-blue-500 group-hover:text-white transition-colors">person</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-[#1d0c0c]">Edit Profile</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Update personal info</p>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-300 group-hover:text-blue-500 transition-colors">chevron_right</span>
                                </Link>
                            </div>
                        </div>

                        {/* Event Types Summary */}
                        <div className="animate-section bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
                                <h3 className="font-bold text-[#1d0c0c]">Event Types</h3>
                                <Link href="/dashboard/event-types" className="text-sm font-bold text-[#850000] hover:underline">Manage All</Link>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {eventTypes.slice(0, 3).map((event) => (
                                    <Link key={event.$id} href="/dashboard/event-types" className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group">
                                        <div className="w-2 h-2 rounded-full bg-[#850000]" style={{ backgroundColor: event.color }} />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-[#1d0c0c] truncate">{event.title}</p>
                                            <p className="text-xs text-gray-500">{event.duration} min • One-on-One</p>
                                        </div>
                                    </Link>
                                ))}
                                {eventTypes.length === 0 && (
                                    <div className="p-6 text-center">
                                        <p className="text-sm text-gray-400 mb-4">No event types yet</p>
                                        <Link href="/dashboard/event-types" className="text-sm font-bold text-[#850000]">Create First Event Type</Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
