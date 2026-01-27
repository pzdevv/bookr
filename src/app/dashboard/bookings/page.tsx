'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/layout';
import { useAuth } from '@/lib/hooks/use-auth';
import { bookingService, eventTypeService, Booking } from '@/lib/appwrite/database';
import { generateBookingConfirmationEmail, generateBookingRejectedEmail, sendEmail } from '@/lib/services/email';

type TabType = 'upcoming' | 'pending' | 'past' | 'cancelled';

export default function BookingsPage() {
    const { userProfile, isLoading: authLoading } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('upcoming');
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    const loadBookings = useCallback(async () => {
        if (!userProfile?.$id) return;
        setIsLoading(true);
        try {
            const data = await bookingService.listByUser(userProfile.$id);
            setBookings(data);
        } catch (error) {
            console.error('Failed to load bookings:', error);
        } finally {
            setIsLoading(false);
        }
    }, [userProfile?.$id]);

    useEffect(() => {
        if (!authLoading && userProfile) {
            loadBookings();
        } else if (!authLoading && !userProfile) {
            setIsLoading(false);
        }
    }, [authLoading, userProfile, loadBookings]);

    const handleConfirm = async (booking: Booking) => {
        setProcessingId(booking.$id);
        setBookings(prev => prev.map(b => b.$id === booking.$id ? { ...b, status: 'confirmed' as const } : b));

        try {
            await bookingService.update(booking.$id, { status: 'confirmed' });

            let eventTitle = 'Meeting';
            if (booking.eventTypeId) {
                const eventType = await eventTypeService.get(booking.eventTypeId);
                if (eventType) eventTitle = eventType.title;
            }

            const email = generateBookingConfirmationEmail({
                guestName: booking.guestName,
                guestEmail: booking.guestEmail,
                hostName: userProfile?.name || 'Host',
                hostEmail: userProfile?.email || '',
                eventTitle,
                slotTime: booking.slotTime,
                duration: 30,
                callLink: `${window.location.origin}/call/${booking.callRoomId}`,
                notes: booking.notes
            });

            // Fire and forget - don't await email sending
            sendEmail(booking.guestEmail, email).catch(err =>
                console.error('Email send failed:', err)
            );
        } catch (error) {
            console.error('Error confirming:', error);
            setBookings(prev => prev.map(b => b.$id === booking.$id ? { ...b, status: 'pending' as const } : b));
            alert('Failed to confirm booking');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDecline = async (booking: Booking) => {
        if (!confirm('Decline this booking?')) return;
        setProcessingId(booking.$id);
        setBookings(prev => prev.map(b => b.$id === booking.$id ? { ...b, status: 'cancelled' as const } : b));

        try {
            await bookingService.update(booking.$id, { status: 'cancelled' });

            let eventTitle = 'Meeting';
            if (booking.eventTypeId) {
                const eventType = await eventTypeService.get(booking.eventTypeId);
                if (eventType) eventTitle = eventType.title;
            }

            const email = generateBookingRejectedEmail({
                guestName: booking.guestName,
                guestEmail: booking.guestEmail,
                hostName: userProfile?.name || 'Host',
                hostEmail: userProfile?.email || '',
                eventTitle,
                slotTime: booking.slotTime,
                duration: 30,
            });
            // Fire and forget - don't await email sending
            sendEmail(booking.guestEmail, email).catch(err =>
                console.error('Email send failed:', err)
            );
        } catch (error) {
            console.error('Error declining:', error);
            setBookings(prev => prev.map(b => b.$id === booking.$id ? { ...b, status: 'pending' as const } : b));
        } finally {
            setProcessingId(null);
        }
    };

    const getJoinState = (booking: Booking) => {
        const diff = (new Date(booking.slotTime).getTime() - now.getTime()) / 60000;
        if (diff <= 15 && diff >= -60) return 'active';
        if (diff < -60) return 'expired';
        return 'too-early';
    };

    const formatTime = (iso: string) => {
        const date = new Date(iso);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let day = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        if (date.toDateString() === today.toDateString()) day = 'Today';
        else if (date.toDateString() === tomorrow.toDateString()) day = 'Tomorrow';

        return { day, time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) };
    };

    // Filtered bookings
    const upcoming = bookings.filter(b => new Date(b.slotTime) >= now && b.status === 'confirmed').sort((a, b) => new Date(a.slotTime).getTime() - new Date(b.slotTime).getTime());
    const pending = bookings.filter(b => new Date(b.slotTime) >= now && b.status === 'pending').sort((a, b) => new Date(a.slotTime).getTime() - new Date(b.slotTime).getTime());
    const past = bookings.filter(b => new Date(b.slotTime) < now && b.status !== 'cancelled').sort((a, b) => new Date(b.slotTime).getTime() - new Date(a.slotTime).getTime());
    const cancelled = bookings.filter(b => b.status === 'cancelled').sort((a, b) => new Date(b.slotTime).getTime() - new Date(a.slotTime).getTime());

    const tabData: Record<TabType, Booking[]> = { upcoming, pending, past, cancelled };
    const currentBookings = tabData[activeTab];

    const tabs = [
        { id: 'upcoming' as TabType, label: 'Upcoming', count: upcoming.length, icon: 'event_upcoming', color: 'text-blue-600' },
        { id: 'pending' as TabType, label: 'Pending', count: pending.length, icon: 'hourglass_empty', color: 'text-orange-600' },
        { id: 'past' as TabType, label: 'Past', count: past.length, icon: 'history', color: 'text-gray-600' },
        { id: 'cancelled' as TabType, label: 'Cancelled', count: cancelled.length, icon: 'cancel', color: 'text-red-600' },
    ];

    if (isLoading || authLoading) {
        return (
            <DashboardLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-[#850000] flex items-center justify-center animate-pulse shadow-lg">
                            <span className="material-symbols-outlined text-white text-3xl">calendar_month</span>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Loading bookings...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bookings</h1>
                        <p className="text-gray-500 text-sm mt-1">Manage all your scheduled meetings</p>
                    </div>
                    <button onClick={loadBookings} className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                        <span className="material-symbols-outlined text-lg">refresh</span>
                        Refresh
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.id
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <span className={`material-symbols-outlined text-lg ${activeTab === tab.id ? tab.color : ''}`}>{tab.icon}</span>
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.id && tab.id === 'pending'
                                    ? 'bg-orange-100 text-orange-700'
                                    : activeTab === tab.id
                                        ? 'bg-[#850000]/10 text-[#850000]'
                                        : 'bg-gray-200 text-gray-600'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Pending Banner */}
                {activeTab === 'pending' && pending.length > 0 && (
                    <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-md animate-pulse">
                                <span className="material-symbols-outlined text-white text-xl">notifications_active</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-orange-900">Action Required</h3>
                                <p className="text-sm text-orange-700">{pending.length} booking{pending.length > 1 ? 's' : ''} waiting for your response</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Booking List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {currentBookings.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-gray-300 text-4xl">
                                    {activeTab === 'upcoming' ? 'event_busy' : activeTab === 'pending' ? 'done_all' : activeTab === 'past' ? 'history' : 'delete_sweep'}
                                </span>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1">No {activeTab} bookings</h3>
                            <p className="text-gray-500 text-sm">
                                {activeTab === 'upcoming' ? 'Share your booking link to get started!' :
                                    activeTab === 'pending' ? 'All caught up! No pending requests.' :
                                        activeTab === 'past' ? 'Your completed meetings will appear here.' :
                                            'No cancelled bookings.'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {currentBookings.map((booking) => {
                                const { day, time } = formatTime(booking.slotTime);
                                const joinState = getJoinState(booking);
                                const isProcessing = processingId === booking.$id;
                                const isPending = booking.status === 'pending';
                                const isConfirmed = booking.status === 'confirmed';
                                const isFuture = new Date(booking.slotTime) >= now;

                                return (
                                    <div key={booking.$id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 sm:px-6 py-5 hover:bg-gray-50/50 transition-colors ${isPending ? 'bg-orange-50/30' : ''}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${isPending ? 'bg-orange-200 text-orange-700' :
                                                isConfirmed ? 'bg-[#850000] text-white' :
                                                    'bg-gray-200 text-gray-500'
                                                }`}>
                                                {booking.guestName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-bold text-gray-900">{booking.guestName}</h3>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPending ? 'bg-orange-100 text-orange-700' :
                                                        isConfirmed ? 'bg-green-100 text-green-700' :
                                                            'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {booking.status.toUpperCase()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 truncate">{booking.guestEmail}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="flex items-center gap-1 text-xs font-medium text-gray-500">
                                                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                                                        {day}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs font-medium text-gray-500">
                                                        <span className="material-symbols-outlined text-sm">schedule</span>
                                                        {time}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                            {isProcessing ? (
                                                <span className="text-xs font-bold text-gray-500 animate-pulse px-3 py-2">Processing...</span>
                                            ) : isPending ? (
                                                <>
                                                    <button onClick={() => handleConfirm(booking)} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-green-700 transition-all active:scale-95">
                                                        <span className="material-symbols-outlined text-lg">check</span>
                                                        Confirm
                                                    </button>
                                                    <button onClick={() => handleDecline(booking)} className="flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-gray-200 text-gray-600 rounded-lg text-sm font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all active:scale-95">
                                                        <span className="material-symbols-outlined text-lg">close</span>
                                                        Decline
                                                    </button>
                                                </>
                                            ) : isConfirmed && isFuture ? (
                                                joinState === 'active' && booking.callRoomId ? (
                                                    <Link href={`/call/${booking.callRoomId}`} className="flex items-center gap-1.5 px-4 py-2 bg-[#850000] text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95">
                                                        <span className="material-symbols-outlined text-lg">videocam</span>
                                                        Join Call
                                                    </Link>
                                                ) : (
                                                    <span className="text-xs font-bold text-gray-400 uppercase px-3 py-2">
                                                        {joinState === 'too-early' ? 'Soon' : 'Expired'}
                                                    </span>
                                                )
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
