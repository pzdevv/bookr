'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/dashboard/layout';
import { useAuth } from '@/lib/hooks/use-auth';
import { bookingService, Booking } from '@/lib/appwrite/database';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function BookingsPage() {
    const { userProfile } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    // GSAP refs
    const headerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadBookings = async () => {
            if (!userProfile) return;
            try {
                const data = await bookingService.listByUser(userProfile.$id);
                setBookings(data);
            } catch (error) { console.error('Error loading bookings:', error); }
            finally { setIsLoading(false); }
        };
        if (userProfile) loadBookings();
    }, [userProfile]);

    // GSAP Animations
    useEffect(() => {
        if (isLoading) return;

        const ctx = gsap.context(() => {
            // Header animation
            if (headerRef.current) {
                gsap.fromTo(headerRef.current,
                    { opacity: 0, y: -40 },
                    { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
                );

                // Tabs stagger
                const tabs = headerRef.current.querySelectorAll('.tab-btn');
                gsap.fromTo(tabs,
                    { opacity: 0, y: 20, scale: 0.9 },
                    {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        duration: 0.5,
                        stagger: 0.1,
                        ease: 'back.out(1.7)',
                        delay: 0.3
                    }
                );
            }

            // Content cards
            if (contentRef.current) {
                const cards = contentRef.current.querySelectorAll('.booking-card');
                gsap.fromTo(cards,
                    {
                        opacity: 0,
                        y: 60,
                        scale: 0.95,
                        rotateX: 5
                    },
                    {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        rotateX: 0,
                        duration: 0.7,
                        stagger: 0.08,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: contentRef.current,
                            start: 'top 80%',
                            toggleActions: 'play none none reverse'
                        }
                    }
                );
            }
        });

        return () => ctx.revert();
    }, [isLoading, activeTab, searchQuery]);

    const now = new Date();

    const filteredBookings = bookings.filter(b => {
        const bookingDate = new Date(b.slotTime);
        const matchesSearch = !searchQuery ||
            b.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.guestEmail.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        switch (activeTab) {
            case 'upcoming':
                return bookingDate >= now && b.status !== 'cancelled';
            case 'past':
                return bookingDate < now && b.status !== 'cancelled';
            case 'cancelled':
                return b.status === 'cancelled';
            default:
                return true;
        }
    });

    const counts = {
        upcoming: bookings.filter(b => new Date(b.slotTime) >= now && b.status !== 'cancelled').length,
        past: bookings.filter(b => new Date(b.slotTime) < now && b.status !== 'cancelled').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
    };

    const handleCancel = async (bookingId: string) => {
        setIsActionLoading(true);
        try {
            await bookingService.update(bookingId, { status: 'cancelled' });
            setBookings(prev => prev.map(b => b.$id === bookingId ? { ...b, status: 'cancelled' as const } : b));
            setSelectedBooking(null);

            // Success animation
            gsap.fromTo('.booking-card',
                { scale: 1 },
                { scale: 0.98, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.out' }
            );
        } catch (error) { console.error('Error cancelling:', error); }
        finally { setIsActionLoading(false); }
    };

    const formatDate = (isoTime: string) => {
        const date = new Date(isoTime);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const formatTime = (isoTime: string) => {
        return new Date(isoTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    const getRelativeTime = (isoTime: string) => {
        const date = new Date(isoTime);
        const diffMs = date.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 0) return 'Past';
        if (diffMins < 60) return `In ${diffMins} min`;
        if (diffHours < 24) return `In ${diffHours}h`;
        if (diffDays === 1) return 'Tomorrow';
        return `In ${diffDays} days`;
    };

    const handleTabChange = (tab: 'upcoming' | 'past' | 'cancelled') => {
        // Animate out current cards
        gsap.to('.booking-card', {
            opacity: 0,
            y: 20,
            duration: 0.2,
            stagger: 0.03,
            onComplete: () => {
                setActiveTab(tab);
            }
        });
    };

    return (
        <DashboardLayout>
            {/* Hero Header */}
            <div ref={headerRef} className="relative overflow-hidden bg-gradient-to-br from-[#1d0c0c] via-[#2a1515] to-[#1d0c0c] px-6 lg:px-8 py-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#850000] opacity-15 blur-[150px] rounded-full" />
                <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-[#850000] opacity-10 blur-[100px] rounded-full" />

                <div className="relative z-10 max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]">
                                    <span className="material-symbols-outlined text-white">calendar_month</span>
                                </div>
                                Bookings
                            </h1>
                            <p className="text-white/50 text-sm mt-1.5">Manage and track all your appointments</p>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-lg">search</span>
                            <input
                                className="w-full md:w-72 pl-11 pr-4 py-3 bg-white/10 backdrop-blur-xl rounded-lg text-sm text-white placeholder:text-white/40 focus:bg-white/15 focus:ring-2 focus:ring-[#850000]/30 transition-all border border-white/10"
                                placeholder="Search by name or email..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-6">
                        {(['upcoming', 'past', 'cancelled'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabChange(tab)}
                                className={`tab-btn px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab
                                    ? 'bg-white text-[#1d0c0c] shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]'
                                    : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                <span className={`ml-2 text-xs px-2 py-0.5 rounded-md ${activeTab === tab
                                    ? 'bg-[#850000]/10 text-[#850000]'
                                    : 'bg-white/10'}`}>
                                    {counts[tab]}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div ref={contentRef} className="p-6 lg:p-8 max-w-6xl mx-auto" style={{ perspective: '1000px' }}>
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-[#850000] flex items-center justify-center animate-pulse shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <span className="material-symbols-outlined text-white text-2xl">calendar_month</span>
                            </div>
                            <p className="text-[#6b4444] text-sm">Loading bookings...</p>
                        </div>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="booking-card bg-white rounded-xl shadow-[6px_6px_0px_0px_rgba(133,0,0,0.1)] py-16 text-center border border-[#850000]/5"
                    >
                        <div className="w-20 h-20 bg-[#850000]/10 rounded-xl flex items-center justify-center mx-auto mb-5 shadow-[2px_2px_0px_0px_rgba(133,0,0,0.1)]">
                            <span className="material-symbols-outlined text-[#850000]/40 text-4xl">
                                {activeTab === 'cancelled' ? 'event_busy' : activeTab === 'past' ? 'history' : 'event_available'}
                            </span>
                        </div>
                        <h3 className="font-bold text-[#1d0c0c] text-xl mb-2">
                            {searchQuery ? 'No matching bookings' : `No ${activeTab} bookings`}
                        </h3>
                        <p className="text-[#6b4444] text-sm mb-6 max-w-sm mx-auto">
                            {searchQuery
                                ? 'Try a different search term'
                                : activeTab === 'upcoming'
                                    ? 'Share your booking link to get started!'
                                    : 'Your bookings will appear here'}
                        </p>
                        {!searchQuery && activeTab === 'upcoming' && (
                            <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#850000] text-white font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                                <span className="material-symbols-outlined text-lg">link</span>
                                Get Your Booking Link
                            </Link>
                        )}
                    </motion.div>
                ) : (
                    <div className="grid gap-4">
                        <AnimatePresence mode="popLayout">
                            {filteredBookings.map((booking, index) => {
                                const isUpcoming = new Date(booking.slotTime) >= now;
                                const isNext = index === 0 && activeTab === 'upcoming';
                                const isSoon = isUpcoming && (new Date(booking.slotTime).getTime() - now.getTime()) < 60 * 60 * 1000;

                                return (
                                    <motion.div
                                        key={booking.$id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => setSelectedBooking(booking)}
                                        className={`booking-card relative bg-white rounded-xl shadow-[4px_4px_0px_0px_rgba(133,0,0,0.1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer group overflow-hidden border border-[#850000]/5 ${isNext ? 'ring-2 ring-[#850000]/30' : ''}`}
                                        style={{ transformStyle: 'preserve-3d' }}
                                    >
                                        {/* Urgency indicator */}
                                        {isSoon && activeTab === 'upcoming' && (
                                            <div className="absolute top-0 left-0 right-0 h-1 bg-[#850000]" />
                                        )}

                                        <div className="flex flex-col md:flex-row md:items-center gap-4 p-5">
                                            {/* Avatar */}
                                            <div className={`h-14 w-14 rounded-lg flex items-center justify-center font-bold text-lg shrink-0 ${isNext
                                                ? 'bg-[#850000] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                                : booking.status === 'cancelled'
                                                    ? 'bg-red-100 text-red-400'
                                                    : !isUpcoming
                                                        ? 'bg-gray-100 text-gray-400'
                                                        : 'bg-[#850000]/10 text-[#850000]'
                                                }`}>
                                                {booking.guestName.charAt(0).toUpperCase()}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="font-bold text-[#1d0c0c] text-lg">{booking.guestName}</h4>
                                                    {isNext && (
                                                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-md flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                            NEXT UP
                                                        </span>
                                                    )}
                                                    {booking.status === 'cancelled' && (
                                                        <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2.5 py-1 rounded-md">
                                                            CANCELLED
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[#6b4444] text-sm truncate">{booking.guestEmail}</p>

                                                <div className="flex items-center gap-4 mt-2.5">
                                                    <span className="flex items-center gap-1.5 text-sm font-medium text-[#1d0c0c] bg-[#850000]/5 px-3 py-1.5 rounded-md">
                                                        <span className="material-symbols-outlined text-base text-[#850000]">calendar_today</span>
                                                        {formatDate(booking.slotTime)}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-sm font-medium text-[#1d0c0c] bg-[#850000]/5 px-3 py-1.5 rounded-md">
                                                        <span className="material-symbols-outlined text-base text-[#850000]">schedule</span>
                                                        {formatTime(booking.slotTime)}
                                                    </span>
                                                    {isUpcoming && booking.status !== 'cancelled' && (
                                                        <span className={`text-xs font-bold px-3 py-1.5 rounded-md ${isSoon ? 'bg-[#850000]/10 text-[#850000]' : 'bg-blue-50 text-blue-600'}`}>
                                                            {getRelativeTime(booking.slotTime)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 md:ml-auto">
                                                {isUpcoming && booking.status !== 'cancelled' && (
                                                    <>
                                                        {isNext && booking.callRoomId && (
                                                            <Link href={`/call/${booking.callRoomId}`} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#850000] text-white text-sm font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                                                                <span className="material-symbols-outlined text-lg">call</span>
                                                                Join Call
                                                            </Link>
                                                        )}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setSelectedBooking(booking); }}
                                                            className="p-2.5 rounded-lg bg-[#850000]/5 text-[#6b4444] hover:bg-[#850000]/10 hover:text-[#850000] transition-all"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">more_horiz</span>
                                                        </button>
                                                    </>
                                                )}
                                                {!isUpcoming && booking.status !== 'cancelled' && (
                                                    <span className="flex items-center gap-1.5 text-sm text-[#6b4444] bg-[#850000]/5 px-4 py-2 rounded-lg">
                                                        <span className="material-symbols-outlined text-base">check_circle</span>
                                                        Completed
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Notes preview if any */}
                                        {booking.notes && (
                                            <div className="px-5 pb-4 -mt-1">
                                                <p className="text-sm text-[#6b4444] bg-[#850000]/5 rounded-lg px-3 py-2 line-clamp-1">
                                                    <span className="text-[#850000]">Note:</span> {booking.notes}
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Booking Detail Modal */}
            <AnimatePresence>
                {selectedBooking && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedBooking(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
                            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                            exit={{ opacity: 0, scale: 0.9, rotateX: -10 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-white rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                            style={{ transformStyle: 'preserve-3d' }}
                        >
                            {/* Modal Header */}
                            <div className="bg-gradient-to-br from-[#1d0c0c] to-[#2a1515] p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#850000] opacity-20 blur-[60px] rounded-full" />
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center text-white font-bold text-2xl shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]">
                                        {selectedBooking.guestName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">{selectedBooking.guestName}</h2>
                                        <p className="text-white/60 text-sm">{selectedBooking.guestEmail}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedBooking(null)}
                                    className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-all"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-[#850000]/5 rounded-lg p-4 border border-[#850000]/10">
                                        <p className="text-xs text-[#6b4444] mb-1">Date</p>
                                        <p className="font-semibold text-[#1d0c0c] flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[#850000] text-lg">calendar_today</span>
                                            {formatDate(selectedBooking.slotTime)}
                                        </p>
                                    </div>
                                    <div className="bg-[#850000]/5 rounded-lg p-4 border border-[#850000]/10">
                                        <p className="text-xs text-[#6b4444] mb-1">Time</p>
                                        <p className="font-semibold text-[#1d0c0c] flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[#850000] text-lg">schedule</span>
                                            {formatTime(selectedBooking.slotTime)}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-[#850000]/5 rounded-lg p-4 border border-[#850000]/10">
                                    <p className="text-xs text-[#6b4444] mb-1">Status</p>
                                    <p className={`font-semibold flex items-center gap-2 ${selectedBooking.status === 'cancelled' ? 'text-red-600' :
                                        new Date(selectedBooking.slotTime) < now ? 'text-[#6b4444]' :
                                            'text-green-600'
                                        }`}>
                                        <span className="material-symbols-outlined text-lg">
                                            {selectedBooking.status === 'cancelled' ? 'cancel' :
                                                new Date(selectedBooking.slotTime) < now ? 'check_circle' :
                                                    'schedule'}
                                        </span>
                                        {selectedBooking.status === 'cancelled' ? 'Cancelled' :
                                            new Date(selectedBooking.slotTime) < now ? 'Completed' :
                                                'Upcoming'}
                                    </p>
                                </div>

                                {selectedBooking.notes && (
                                    <div className="bg-[#850000]/5 rounded-lg p-4 border border-[#850000]/10">
                                        <p className="text-xs text-[#6b4444] mb-1">Notes</p>
                                        <p className="text-[#1d0c0c] text-sm">{selectedBooking.notes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Modal Actions */}
                            <div className="p-6 pt-0 space-y-3">
                                {new Date(selectedBooking.slotTime) >= now && selectedBooking.status !== 'cancelled' && (
                                    <>
                                        {selectedBooking.callRoomId ? (
                                            <Link href={`/call/${selectedBooking.callRoomId}`} className="w-full py-3.5 rounded-lg bg-[#850000] text-white font-bold flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                                                <span className="material-symbols-outlined">call</span>
                                                Join Audio Call
                                            </Link>
                                        ) : (
                                            <div className="w-full py-3.5 rounded-lg bg-[#850000]/10 text-[#6b4444] font-bold flex items-center justify-center gap-2">
                                                <span className="material-symbols-outlined">link_off</span>
                                                No call link available
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-3">
                                            <button className="py-3 rounded-lg bg-[#850000]/5 text-[#1d0c0c] font-medium flex items-center justify-center gap-2 hover:bg-[#850000]/10 transition-all border border-[#850000]/10">
                                                <span className="material-symbols-outlined text-lg">edit_calendar</span>
                                                Reschedule
                                            </button>
                                            <button
                                                onClick={() => handleCancel(selectedBooking.$id)}
                                                disabled={isActionLoading}
                                                className="py-3 rounded-lg bg-red-50 text-red-600 font-medium flex items-center justify-center gap-2 hover:bg-red-100 transition-all disabled:opacity-50 border border-red-100"
                                            >
                                                {isActionLoading ? (
                                                    <div className="w-5 h-5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <span className="material-symbols-outlined text-lg">cancel</span>
                                                        Cancel
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </>
                                )}
                                {(new Date(selectedBooking.slotTime) < now || selectedBooking.status === 'cancelled') && (
                                    <button
                                        onClick={() => setSelectedBooking(null)}
                                        className="w-full py-3.5 rounded-lg bg-[#850000]/5 text-[#1d0c0c] font-bold hover:bg-[#850000]/10 transition-all border border-[#850000]/10"
                                    >
                                        Close
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
