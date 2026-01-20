'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/layout';
import { useAuth } from '@/lib/hooks/use-auth';
import { bookingService, eventTypeService, Booking, EventType } from '@/lib/appwrite/database';

export default function DashboardPage() {
    const { userProfile, user, isLoading: authLoading, refreshUser } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [eventTypes, setEventTypes] = useState<EventType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, upcoming: 0, week: 0 });
    const [copied, setCopied] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setMounted(true);

        // If auth is still loading, wait
        if (authLoading) return;

        // If no user at all, the layout will redirect
        if (!user) {
            setIsLoading(false);
            return;
        }

        const loadData = async () => {
            // If userProfile is not ready yet, try to refresh
            if (!userProfile) {
                try {
                    await refreshUser();
                } catch (e) {
                    console.log('Failed to refresh user:', e);
                }
                // Give it a moment then continue with what we have
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

    const getUserSlug = () => {
        if (userProfile?.username) return userProfile.username;
        if (userProfile?.name) return userProfile.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        return null;
    };

    const getDefaultEventSlug = () => eventTypes.length > 0 ? eventTypes[0].slug : 'meeting';

    const handleCopyLink = () => {
        const slug = getUserSlug();
        if (!slug) return;
        navigator.clipboard.writeText(`${window.location.origin}/book/${slug}/${getDefaultEventSlug()}`);
        setCopied(true);
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
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#fbbd23] to-orange-500 flex items-center justify-center animate-pulse">
                            <span className="material-symbols-outlined text-white text-3xl">calendar_today</span>
                        </div>
                        <p className="text-gray-400 text-sm font-medium">Loading your dashboard...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // If user is logged in but userProfile is not ready yet
    if (user && !userProfile) {
        return (
            <DashboardLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 text-center max-w-md p-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#fbbd23] to-orange-500 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-3xl">person_add</span>
                        </div>
                        <h2 className="text-xl font-bold text-[#1c180c]">Setting up your account...</h2>
                        <p className="text-gray-500 text-sm">This may take a moment for new accounts.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#fbbd23] to-orange-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
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
            <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
                {/* Welcome Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-[#1c180c]">
                            Welcome back, {userProfile?.name?.split(' ')[0]} 👋
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Here's what's happening with your bookings</p>
                    </div>
                    <Link href="/dashboard/settings" className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/60 backdrop-blur border border-white/50 shadow-sm hover:bg-white/80 transition-all text-sm font-medium text-gray-700">
                        <span className="material-symbols-outlined text-lg">settings</span>
                        Settings
                    </Link>
                </div>

                {/* Booking Link Card - Glassmorphic */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1c180c] via-[#2a2517] to-[#1c180c] p-6 lg:p-8 shadow-2xl">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-[#fbbd23] opacity-20 blur-[120px] rounded-full" />
                    <div className="absolute bottom-0 left-0 w-60 h-60 bg-orange-500 opacity-15 blur-[100px] rounded-full" />

                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center border border-white/20">
                                    <span className="material-symbols-outlined text-[#fbbd23] text-2xl">link</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Your Booking Link</h2>
                                    <p className="text-white/50 text-xs">Share to get bookings</p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2 bg-white/5 backdrop-blur-xl p-2 pr-4 rounded-xl border border-white/10 w-fit">
                                <span className="bg-green-500 text-white px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                    LIVE
                                </span>
                                <code className="text-sm font-mono text-white/70 truncate max-w-[250px] lg:max-w-none">
                                    {mounted && getUserSlug() ? `${window.location.host}/book/${getUserSlug()}/${getDefaultEventSlug()}` : '...'}
                                </code>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleCopyLink} disabled={!getUserSlug()} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#fbbd23] to-orange-500 text-white font-bold shadow-lg shadow-[#fbbd23]/30 hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50">
                                <span className="material-symbols-outlined">{copied ? 'check_circle' : 'content_copy'}</span>
                                {copied ? 'Copied!' : 'Copy Link'}
                            </button>
                            <Link href={mounted && getUserSlug() ? `/book/${getUserSlug()}/${getDefaultEventSlug()}` : '#'} target="_blank" className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-white font-medium hover:bg-white/20 transition-all">
                                <span className="material-symbols-outlined">open_in_new</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Grid - Glassmorphic Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 shadow-lg shadow-black/5 border border-white/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#fbbd23]/20 to-orange-400/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-[#fbbd23] text-xl">confirmation_number</span>
                            </div>
                            <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2.5 py-1 rounded-full">ALL TIME</span>
                        </div>
                        <p className="text-3xl font-black text-[#1c180c]">{stats.total}</p>
                        <p className="text-sm text-gray-500 mt-0.5">Total Bookings</p>
                    </div>

                    <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 shadow-lg shadow-black/5 border border-white/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400/20 to-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-blue-500 text-xl">upcoming</span>
                            </div>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2.5 py-1 rounded-full">SCHEDULED</span>
                        </div>
                        <p className="text-3xl font-black text-[#1c180c]">{stats.upcoming}</p>
                        <p className="text-sm text-gray-500 mt-0.5">Upcoming</p>
                    </div>

                    <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 shadow-lg shadow-black/5 border border-white/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-400/20 to-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-purple-500 text-xl">date_range</span>
                            </div>
                            <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2.5 py-1 rounded-full">THIS WEEK</span>
                        </div>
                        <p className="text-3xl font-black text-[#1c180c]">{stats.week}</p>
                        <p className="text-sm text-gray-500 mt-0.5">This Week</p>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Upcoming Bookings */}
                    <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/5 border border-white/50 overflow-hidden">
                        <div className="px-6 py-4 flex items-center justify-between bg-gradient-to-r from-white/80 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fbbd23] to-orange-500 flex items-center justify-center shadow-md shadow-[#fbbd23]/30">
                                    <span className="material-symbols-outlined text-white">event</span>
                                </div>
                                <h3 className="text-lg font-bold text-[#1c180c]">Upcoming Bookings</h3>
                            </div>
                            <Link href="/dashboard/bookings" className="text-sm font-bold text-[#fbbd23] hover:underline flex items-center gap-1">
                                View All
                                <span className="material-symbols-outlined text-base">chevron_right</span>
                            </Link>
                        </div>

                        {bookings.length > 0 ? (
                            <div className="divide-y divide-gray-100/50">
                                {bookings.slice(0, 4).map((booking, index) => {
                                    const { day, time } = formatBookingTime(booking.slotTime);
                                    const isFirst = index === 0;
                                    return (
                                        <div key={booking.$id} className={`flex items-center gap-4 px-6 py-4 hover:bg-white/50 transition-colors ${isFirst ? 'bg-gradient-to-r from-[#fbbd23]/5 to-transparent' : ''}`}>
                                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold shrink-0 ${isFirst ? 'bg-gradient-to-br from-[#fbbd23] to-orange-500 text-white shadow-md shadow-[#fbbd23]/30' : 'bg-gray-100 text-gray-600'}`}>
                                                {booking.guestName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-[#1c180c] truncate">{booking.guestName}</h4>
                                                    {isFirst && <span className="text-[9px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">NEXT</span>}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                                                        {day}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                                        <span className="material-symbols-outlined text-sm">schedule</span>
                                                        {time}
                                                    </span>
                                                </div>
                                            </div>
                                            {isFirst && (
                                                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#fbbd23] to-orange-500 text-white text-sm font-bold shadow-md shadow-[#fbbd23]/20 hover:shadow-lg transition-all">
                                                    <span className="material-symbols-outlined text-lg">videocam</span>
                                                    Join
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-12 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-gray-400 text-3xl">event_busy</span>
                                </div>
                                <h4 className="font-bold text-[#1c180c] mb-1">No upcoming bookings</h4>
                                <p className="text-gray-500 text-sm mb-4">Share your link to get started!</p>
                                <button onClick={handleCopyLink} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#fbbd23] to-orange-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all">
                                    Copy Your Link
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions Sidebar */}
                    <div className="space-y-4">
                        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 shadow-lg shadow-black/5 border border-white/50">
                            <h3 className="font-bold text-[#1c180c] mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#fbbd23]">bolt</span>
                                Quick Actions
                            </h3>
                            <div className="space-y-2">
                                <Link href="/dashboard/availability" className="flex items-center gap-3 p-3 rounded-xl bg-white/50 hover:bg-white/80 transition-all group">
                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#fbbd23]/20 to-orange-400/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-[#fbbd23] text-lg">schedule</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm text-[#1c180c]">Set Availability</p>
                                        <p className="text-[11px] text-gray-400">Define working hours</p>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-300 group-hover:text-gray-500 transition-colors">chevron_right</span>
                                </Link>
                                <Link href="/dashboard/settings" className="flex items-center gap-3 p-3 rounded-xl bg-white/50 hover:bg-white/80 transition-all group">
                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-400/20 to-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-blue-500 text-lg">person</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm text-[#1c180c]">Edit Profile</p>
                                        <p className="text-[11px] text-gray-400">Update your info</p>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-300 group-hover:text-gray-500 transition-colors">chevron_right</span>
                                </Link>
                            </div>
                        </div>

                        {/* Voice Call Promo */}
                        <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-2xl p-5 text-white relative overflow-hidden shadow-xl">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-xl">call</span>
                                    <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">COMING SOON</span>
                                </div>
                                <h3 className="font-bold mb-1">Voice Calling</h3>
                                <p className="text-white/70 text-xs mb-3">Let guests call you directly from bookings.</p>
                                <button className="w-full py-2.5 rounded-xl bg-white text-purple-700 font-bold text-sm hover:shadow-lg transition-all">
                                    Get Notified
                                </button>
                            </div>
                        </div>

                        {eventTypes.length > 0 && (
                            <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 shadow-lg shadow-black/5 border border-white/50">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Active Event Type</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: (eventTypes[0].color || '#fbbd23') + '15' }}>
                                        <span className="material-symbols-outlined text-xl" style={{ color: eventTypes[0].color || '#fbbd23' }}>event</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#1c180c]">{eventTypes[0].title}</p>
                                        <p className="text-xs text-gray-500">{eventTypes[0].duration} min</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
