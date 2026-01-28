'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/layout';
import { useAuth } from '@/lib/hooks/use-auth';
import { bookingService, eventTypeService, Booking, EventType } from '@/lib/appwrite/database';
import { generateBookingConfirmationEmail, generateBookingRejectedEmail, sendEmail } from '@/lib/services/email';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const getBookingBaseUrl = () => {
    if (typeof window === 'undefined') return '/book';
    return `${window.location.origin}/book`;
};

export default function DashboardPage() {
    const { userProfile, user, isLoading: authLoading, refreshUser } = useAuth();
    const [allBookings, setAllBookings] = useState<Booking[]>([]);
    const [eventTypes, setEventTypes] = useState<EventType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const linkCardRef = useRef<HTMLDivElement>(null);
    const statsRef = useRef<HTMLDivElement>(null);
    const mainGridRef = useRef<HTMLDivElement>(null);

    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    const getJoinState = (booking: Booking) => {
        const slotTime = new Date(booking.slotTime).getTime();
        const diffMinutes = (slotTime - now.getTime()) / 60000;
        if (diffMinutes <= 15 && diffMinutes >= -60) return 'active';
        if (diffMinutes < -60) return 'expired';
        return 'too-early';
    };

    const loadData = useCallback(async () => {
        if (!userProfile) return;

        try {
            const [bookings, events] = await Promise.all([
                bookingService.listByUser(userProfile.$id),
                eventTypeService.listByUser(userProfile.$id),
            ]);
            setAllBookings(bookings);
            setEventTypes(events);
        } catch (error) {
            console.error('Dashboard load error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [userProfile]);

    useEffect(() => {
        setMounted(true);
        if (authLoading) return;
        if (!user) { setIsLoading(false); return; }

        if (!userProfile) {
            refreshUser().finally(() => setIsLoading(false));
            return;
        }

        loadData();
    }, [userProfile, user, authLoading, refreshUser, loadData]);

    // Derived data
    const upcomingBookings = allBookings
        .filter(b => new Date(b.slotTime) >= now && b.status === 'confirmed')
        .sort((a, b) => new Date(a.slotTime).getTime() - new Date(b.slotTime).getTime());

    const pendingBookings = allBookings.filter(b => new Date(b.slotTime) >= now && b.status === 'pending');

    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    const weekBookings = allBookings.filter(b => {
        const date = new Date(b.slotTime);
        return date >= weekStart && date < weekEnd;
    });

    const stats = {
        total: allBookings.length,
        upcoming: upcomingBookings.length,
        week: weekBookings.length,
        pending: pendingBookings.length
    };

    // GSAP Animations
    useEffect(() => {
        if (isLoading || authLoading) return;

        const ctx = gsap.context(() => {
            if (headerRef.current) {
                gsap.fromTo(headerRef.current, { opacity: 0, y: -50 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power4.out' });
            }
            if (linkCardRef.current) {
                gsap.fromTo(linkCardRef.current, { opacity: 0, y: 60, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power3.out', delay: 0.1 });
            }
            if (statsRef.current) {
                const statCards = statsRef.current.querySelectorAll('.stat-card');
                gsap.fromTo(statCards, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'back.out(1.5)', delay: 0.2 });
            }
            if (mainGridRef.current) {
                const sections = mainGridRef.current.querySelectorAll('.animate-section');
                gsap.fromTo(sections, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out', delay: 0.4 });
            }
        }, containerRef);

        return () => ctx.revert();
    }, [isLoading, authLoading]);

    const getUserSlug = () => userProfile?.username || userProfile?.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || null;
    const getDefaultEventSlug = () => eventTypes[0]?.slug || 'meeting';

    const handleCopyLink = () => {
        const slug = getUserSlug();
        if (!slug) return;
        navigator.clipboard.writeText(`${getBookingBaseUrl()}/${slug}`);
        setCopied(true);
        gsap.fromTo('.copy-btn', { scale: 1 }, { scale: 1.1, duration: 0.1, yoyo: true, repeat: 1 });
        setTimeout(() => setCopied(false), 2000);
    };

    const formatBookingTime = (isoTime: string) => {
        const date = new Date(isoTime);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let dayLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        if (date.toDateString() === today.toDateString()) dayLabel = 'Today';
        else if (date.toDateString() === tomorrow.toDateString()) dayLabel = 'Tomorrow';

        return { day: dayLabel, time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) };
    };

    // ============= CONFIRM BOOKING =============
    const handleConfirm = async (booking: Booking) => {
        setProcessingId(booking.$id);

        // Optimistic update
        setAllBookings(prev => prev.map(b => b.$id === booking.$id ? { ...b, status: 'confirmed' as const } : b));

        try {
            await bookingService.update(booking.$id, { status: 'confirmed' });

            let eventTitle = 'Meeting';
            if (booking.eventTypeId) {
                const eventType = await eventTypeService.get(booking.eventTypeId);
                if (eventType) eventTitle = eventType.title;
            }

            const emailData = {
                guestName: booking.guestName,
                guestEmail: booking.guestEmail,
                hostName: userProfile?.name || 'Host',
                hostEmail: userProfile?.email || '',
                eventTitle,
                slotTime: booking.slotTime,
                duration: 30,
                callLink: `${window.location.origin}/call/${booking.callRoomId}`,
                notes: booking.notes
            };

            const email = generateBookingConfirmationEmail(emailData);
            // Fire and forget - errors handled internally
            sendEmail(booking.guestEmail, email);
        } catch (error) {
            console.error('Error confirming:', error);
            // Rollback
            setAllBookings(prev => prev.map(b => b.$id === booking.$id ? { ...b, status: 'pending' as const } : b));
            alert('Failed to confirm booking');
        } finally {
            setProcessingId(null);
        }
    };

    // ============= DECLINE BOOKING =============
    const handleDecline = async (booking: Booking) => {
        if (!confirm('Decline this booking request?')) return;
        setProcessingId(booking.$id);

        // Optimistic update
        setAllBookings(prev => prev.map(b => b.$id === booking.$id ? { ...b, status: 'cancelled' as const } : b));

        try {
            await bookingService.update(booking.$id, { status: 'cancelled' });

            let eventTitle = 'Meeting';
            if (booking.eventTypeId) {
                const eventType = await eventTypeService.get(booking.eventTypeId);
                if (eventType) eventTitle = eventType.title;
            }

            const emailData = {
                guestName: booking.guestName,
                guestEmail: booking.guestEmail,
                hostName: userProfile?.name || 'Host',
                hostEmail: userProfile?.email || '',
                eventTitle,
                slotTime: booking.slotTime,
                duration: 30,
            };

            const email = generateBookingRejectedEmail(emailData);
            // Fire and forget - errors handled internally
            sendEmail(booking.guestEmail, email);
        } catch (error) {
            console.error('Error declining:', error);
            // Rollback
            setAllBookings(prev => prev.map(b => b.$id === booking.$id ? { ...b, status: 'pending' as const } : b));
        } finally {
            setProcessingId(null);
        }
    };

    if (isLoading || authLoading) {
        return (
            <DashboardLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-14 h-14 rounded-lg bg-[#850000] flex items-center justify-center animate-pulse shadow-lg">
                            <span className="material-symbols-outlined text-white text-3xl">calendar_today</span>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Loading your dashboard...</p>
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
                        <div className="w-16 h-16 rounded-lg bg-[#850000] flex items-center justify-center shadow-lg">
                            <span className="material-symbols-outlined text-white text-3xl">person_add</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Setting up your account...</h2>
                        <p className="text-gray-500 text-sm">This may take a moment for new accounts.</p>
                        <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2.5 rounded-lg bg-[#850000] text-white font-bold text-sm shadow-lg hover:bg-[#6b0000] transition-all">
                            Refresh
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div ref={containerRef} className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
                {/* Welcome Header */}
                <div ref={headerRef} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                            Welcome back, {userProfile?.name?.split(' ')[0]} 👋
                        </h1>
                        <p className="text-gray-500 mt-1 text-sm sm:text-base">Here's what's happening today</p>
                    </div>
                    <Link href="/dashboard/settings" className="self-start md:self-auto flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-[#850000]/20 transition-all text-sm font-medium text-gray-900">
                        <span className="material-symbols-outlined text-lg">settings</span>
                        Settings
                    </Link>
                </div>

                {/* Booking Link Card */}
                <div ref={linkCardRef} className="relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 p-6 sm:p-8 shadow-2xl">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#850000] opacity-20 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />

                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-[#850000] rounded-lg flex items-center justify-center shadow-lg">
                                    <span className="material-symbols-outlined text-white text-2xl">link</span>
                                </div>
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-white">Your Booking Page</h2>
                                    <p className="text-white/60 text-sm">Share this link to let people book time with you</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm p-2 pr-4 rounded-lg border border-white/10 w-fit">
                                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-lg text-[10px] font-bold tracking-wider flex items-center gap-1 border border-green-500/20">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                    LIVE
                                </span>
                                <code className="text-xs sm:text-sm font-mono text-white/90 truncate max-w-[200px] sm:max-w-none">
                                    {mounted && getUserSlug() ? `${window.location.host}/book/${getUserSlug()}` : '...'}
                                </code>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full lg:w-auto">
                            <button onClick={handleCopyLink} disabled={!getUserSlug()} className="copy-btn flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white text-gray-900 font-bold text-sm hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50">
                                <span className="material-symbols-outlined text-lg">{copied ? 'check_circle' : 'content_copy'}</span>
                                {copied ? 'Copied' : 'Copy Link'}
                            </button>
                            <Link href={mounted && getUserSlug() ? `/book/${getUserSlug()}/${getDefaultEventSlug()}` : '#'} target="_blank" className="flex items-center justify-center px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-all">
                                <span className="material-symbols-outlined text-lg">open_in_new</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[
                        { label: 'Total Bookings', value: stats.total, icon: 'confirmation_number', color: 'text-[#850000]', bgColor: 'bg-[#850000]/10', badge: 'ALL TIME', badgeColor: 'text-green-600 bg-green-50' },
                        { label: 'Pending', value: stats.pending, icon: 'hourglass_empty', color: 'text-orange-600', bgColor: 'bg-orange-50', badge: 'ACTION', badgeColor: 'text-orange-600 bg-orange-50' },
                        { label: 'Upcoming', value: stats.upcoming, icon: 'upcoming', color: 'text-blue-600', bgColor: 'bg-blue-50', badge: 'SCHEDULED', badgeColor: 'text-blue-600 bg-blue-50' },
                        { label: 'This Week', value: stats.week, icon: 'date_range', color: 'text-purple-600', bgColor: 'bg-purple-50', badge: 'WEEKLY', badgeColor: 'text-purple-600 bg-purple-50' },
                    ].map((stat) => (
                        <div key={stat.label} className="stat-card bg-white rounded-lg p-4 sm:p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                                    <span className={`material-symbols-outlined ${stat.color} text-xl sm:text-2xl`}>{stat.icon}</span>
                                </div>
                                <span className={`text-[9px] sm:text-[10px] font-bold ${stat.badgeColor} px-2 py-0.5 rounded-full hidden sm:block`}>{stat.badge}</span>
                            </div>
                            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{stat.value}</p>
                            <p className="text-xs sm:text-sm font-medium text-gray-500 mt-0.5">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Main Grid */}
                <div ref={mainGridRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-6 lg:col-span-2">

                        {/* PENDING REQUESTS - HIGHLY VISIBLE */}
                        {pendingBookings.length > 0 && (
                            <div className="animate-section bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg shadow-md border-2 border-orange-200 overflow-hidden">
                                <div className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-orange-200 bg-orange-100/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-md animate-pulse">
                                            <span className="material-symbols-outlined text-white text-xl">notifications_active</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-orange-900">Action Required</h3>
                                            <p className="text-xs text-orange-700 font-semibold">{pendingBookings.length} booking{pendingBookings.length > 1 ? 's' : ''} waiting for your response</p>
                                        </div>
                                    </div>
                                    <Link href="/dashboard/bookings?tab=pending" className="px-3 py-1.5 rounded-full bg-white text-xs font-bold text-orange-600 hover:bg-orange-100 transition-colors flex items-center gap-1 shadow-sm self-start sm:self-auto">
                                        View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </Link>
                                </div>

                                <div className="divide-y divide-orange-100">
                                    {pendingBookings.slice(0, 3).map((booking) => {
                                        const { day, time } = formatBookingTime(booking.slotTime);
                                        const isProcessing = processingId === booking.$id;

                                        return (
                                            <div key={booking.$id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 sm:px-6 py-4 hover:bg-orange-100/30 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-11 w-11 rounded-lg bg-orange-200 text-orange-700 flex items-center justify-center font-bold text-lg">
                                                        {booking.guestName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">{booking.guestName}</h4>
                                                        <p className="text-sm text-gray-600 flex items-center gap-1.5">
                                                            <span className="material-symbols-outlined text-sm">event</span> {day} • {time}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                                    {isProcessing ? (
                                                        <span className="text-xs font-bold text-gray-500 animate-pulse px-3 py-2">Processing...</span>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleConfirm(booking)}
                                                                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-green-700 hover:shadow-lg transition-all active:scale-95"
                                                            >
                                                                <span className="material-symbols-outlined text-lg">check</span>
                                                                Confirm
                                                            </button>
                                                            <button
                                                                onClick={() => handleDecline(booking)}
                                                                className="flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-gray-200 text-gray-600 rounded-lg text-sm font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all active:scale-95"
                                                            >
                                                                <span className="material-symbols-outlined text-lg">close</span>
                                                                Decline
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Upcoming Bookings */}
                        <div className="animate-section bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-5 sm:px-6 py-4 flex items-center justify-between border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[#850000] text-2xl">event_upcoming</span>
                                    <h3 className="text-lg font-bold text-gray-900">Upcoming Bookings</h3>
                                </div>
                                <Link href="/dashboard/bookings" className="px-3 py-1.5 rounded-full bg-gray-50 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1">
                                    View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </Link>
                            </div>

                            {upcomingBookings.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {upcomingBookings.slice(0, 4).map((booking, index) => {
                                        const { day, time } = formatBookingTime(booking.slotTime);
                                        const isFirst = index === 0;
                                        const joinState = getJoinState(booking);

                                        return (
                                            <div key={booking.$id} className={`group flex items-center gap-4 px-5 sm:px-6 py-4 hover:bg-gray-50/50 transition-all ${isFirst ? 'bg-[#850000]/[0.02]' : ''}`}>
                                                <div className={`h-12 w-12 rounded-lg flex items-center justify-center font-bold shrink-0 text-lg transition-all ${isFirst ? 'bg-[#850000] text-white shadow-lg' : 'bg-gray-100 text-gray-500 group-hover:bg-[#850000] group-hover:text-white'}`}>
                                                    {booking.guestName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-gray-900 truncate">{booking.guestName}</h4>
                                                        {isFirst && <span className="text-[9px] font-bold bg-[#850000] text-white px-1.5 py-0.5 rounded-full">NEXT</span>}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="flex items-center gap-1 text-xs font-medium text-gray-500">
                                                            <span className="material-symbols-outlined text-sm text-gray-400">calendar_today</span>
                                                            {day}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-xs font-medium text-gray-500">
                                                            <span className="material-symbols-outlined text-sm text-gray-400">schedule</span>
                                                            {time}
                                                        </span>
                                                    </div>
                                                </div>
                                                {isFirst && joinState === 'active' && booking.callRoomId ? (
                                                    <Link href={`/call/${booking.callRoomId}`} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#850000] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95">
                                                        <span className="material-symbols-outlined text-base">videocam</span>
                                                        Join
                                                    </Link>
                                                ) : isFirst ? (
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                                                        {joinState === 'too-early' ? 'Soon' : 'Expired'}
                                                    </span>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 group-hover:border-[#850000] group-hover:text-[#850000] transition-colors">
                                                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-16 text-center">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="material-symbols-outlined text-gray-300 text-4xl">event_busy</span>
                                    </div>
                                    <h4 className="font-bold text-gray-900 mb-1">No upcoming bookings</h4>
                                    <p className="text-gray-500 text-sm mb-6">Share your booking link to get started!</p>
                                    <button onClick={handleCopyLink} className="px-6 py-2.5 rounded-lg bg-gray-900 text-white font-bold text-sm shadow-lg hover:bg-gray-800 transition-all flex items-center gap-2 mx-auto">
                                        <span className="material-symbols-outlined text-lg">content_copy</span>
                                        Copy Your Link
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Column */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="animate-section bg-white rounded-lg p-5 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#850000]">bolt</span>
                                Quick Actions
                            </h3>
                            <div className="space-y-2">
                                <Link href="/dashboard/availability" className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-[#850000]/20 hover:bg-gray-50 transition-all group">
                                    <div className="w-10 h-10 rounded-lg bg-[#850000]/5 flex items-center justify-center group-hover:bg-[#850000] transition-colors">
                                        <span className="material-symbols-outlined text-[#850000] group-hover:text-white transition-colors text-xl">schedule</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 text-sm">Availability</p>
                                        <p className="text-xs text-gray-500">Set your hours</p>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-300 group-hover:text-gray-900 transition-colors">chevron_right</span>
                                </Link>
                                <Link href="/dashboard/event-types" className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                                        <span className="material-symbols-outlined text-blue-500 group-hover:text-white transition-colors text-xl">event_note</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 text-sm">Event Types</p>
                                        <p className="text-xs text-gray-500">Manage meetings</p>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-300 group-hover:text-blue-500 transition-colors">chevron_right</span>
                                </Link>
                            </div>
                        </div>

                        {/* Event Types Summary */}
                        <div className="animate-section bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
                                <h3 className="font-bold text-gray-900 text-sm">Your Events</h3>
                                <Link href="/dashboard/event-types" className="text-xs font-bold text-[#850000] hover:underline">Manage</Link>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {eventTypes.slice(0, 3).map((event) => (
                                    <Link key={event.$id} href="/dashboard/event-types" className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: event.color || '#850000' }} />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-gray-900 truncate">{event.title}</p>
                                            <p className="text-xs text-gray-500">{event.duration} min</p>
                                        </div>
                                    </Link>
                                ))}
                                {eventTypes.length === 0 && (
                                    <div className="p-5 text-center">
                                        <p className="text-sm text-gray-400 mb-3">No event types yet</p>
                                        <Link href="/dashboard/event-types" className="text-sm font-bold text-[#850000]">Create One</Link>
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



