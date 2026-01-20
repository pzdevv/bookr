'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { use } from 'react';
import { userService, eventTypeService, User, EventType } from '@/lib/appwrite/database';

export default function UserBookingPage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = use(params);
    const [user, setUser] = useState<User | null>(null);
    const [eventTypes, setEventTypes] = useState<EventType[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                let foundUser = await userService.getByUsername(username);
                if (!foundUser) {
                    foundUser = await userService.getByNameSlug(username);
                }
                if (foundUser) {
                    setUser(foundUser);
                    const events = await eventTypeService.listByUser(foundUser.$id);
                    setEventTypes(events.filter((e) => e.isActive));
                }
            } catch (err) { console.error('Error:', err); }
            finally { setIsLoading(false); }
        };
        loadData();
    }, [username]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#1d0c0c] via-[#2a1515] to-[#1d0c0c] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#850000] border-t-transparent rounded-full animate-spin" />
                    <p className="text-white/50 animate-pulse">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#1d0c0c] via-[#2a1515] to-[#1d0c0c] flex items-center justify-center p-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-10 max-w-md text-center shadow-2xl">
                    <div className="w-20 h-20 bg-[#850000]/20 rounded-xl flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-[#850000] text-4xl" style={{ filter: 'brightness(2)' }}>person_off</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-3">User not found</h1>
                    <p className="text-white/50 mb-8">This user doesn't exist or may have been removed.</p>
                    <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-[#850000] text-white font-bold rounded-lg hover:bg-[#6b0000] hover:shadow-lg hover:shadow-[#850000]/20 transition-all">
                        <span className="material-symbols-outlined text-xl">home</span>
                        Go to homepage
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1d0c0c] via-[#2a1515] to-[#1d0c0c] text-white font-[Inter,sans-serif]">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#850000]/10 rounded-full blur-[200px]" />
            </div>

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-6 md:px-10 py-4 border-b border-white/5 bg-black/20 backdrop-blur-xl">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-[#850000] rounded-lg flex items-center justify-center shadow-lg shadow-[#850000]/20 group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-white text-xl">calendar_today</span>
                    </div>
                    <span className="text-xl font-bold text-white">Book<span className="text-white/70 italic" style={{ fontFamily: "'Playfair Display', serif" }}>&</span>Call</span>
                </Link>
                <div className="flex gap-3">
                    <Link href="/auth/login" className="px-5 py-2.5 text-sm font-medium text-white/60 hover:text-white transition-colors">
                        Log In
                    </Link>
                    <Link href="/auth/signup" className="px-5 py-2.5 bg-[#850000] text-white text-sm font-bold rounded-lg hover:bg-[#6b0000] hover:shadow-lg hover:shadow-[#850000]/20 transition-all">
                        Sign Up Free
                    </Link>
                </div>
            </header>

            <main className="relative z-10 max-w-2xl mx-auto py-16 px-4">
                {/* Profile Card */}
                <div className="text-center mb-12">
                    <div className="relative inline-block mb-6">
                        <div
                            className="w-32 h-32 rounded-2xl bg-[#850000]/20 flex items-center justify-center shadow-2xl shadow-[#850000]/10 bg-cover bg-center border-4 border-white/10"
                            style={user.avatar ? { backgroundImage: `url('${user.avatar}')` } : undefined}
                        >
                            {!user.avatar && <span className="text-white text-5xl font-bold">{user.name?.charAt(0)}</span>}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center border-4 border-[#1d0c0c] shadow-lg">
                            <span className="material-symbols-outlined text-white">check</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">{user.name}</h1>
                    <p className="text-white/50 text-lg max-w-md mx-auto">{user.bio || 'Book a time to connect!'}</p>
                </div>

                {/* Event Types */}
                <div className="space-y-4">
                    {eventTypes.length === 0 ? (
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center">
                            <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-white/30 text-3xl">event_busy</span>
                            </div>
                            <p className="text-white/50">No event types available yet.</p>
                        </div>
                    ) : (
                        eventTypes.map((event) => (
                            <Link
                                key={event.$id}
                                href={`/book/${username}/${event.slug}`}
                                className="block bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6 hover:bg-white/10 hover:border-[#850000]/30 hover:shadow-xl hover:shadow-[#850000]/5 transition-all group hover:scale-[1.02]"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div
                                            className="w-4 h-4 rounded-full mt-1.5 shadow-lg"
                                            style={{ backgroundColor: event.color || '#850000', boxShadow: `0 0 20px ${event.color || '#850000'}40` }}
                                        />
                                        <div>
                                            <h3 className="text-xl font-bold text-white group-hover:text-white transition-colors">{event.title}</h3>
                                            <p className="text-white/50 mt-1">{event.description || 'No description'}</p>
                                            <div className="flex items-center gap-6 mt-4">
                                                <span className="flex items-center gap-2 text-sm text-white/60">
                                                    <span className="material-symbols-outlined text-[#850000] text-lg" style={{ filter: 'brightness(1.5)' }}>schedule</span>
                                                    {event.duration} min
                                                </span>
                                                <span className="flex items-center gap-2 text-sm text-white/60">
                                                    <span className="material-symbols-outlined text-[#850000] text-lg" style={{ filter: 'brightness(1.5)' }}>videocam</span>
                                                    Video call
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-[#850000] transition-all">
                                        <span className="material-symbols-outlined text-white/40 group-hover:text-white transition-colors">arrow_forward</span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>

                {/* Footer */}
                <footer className="mt-16 text-center">
                    <p className="text-white/30 text-sm flex items-center justify-center gap-2">
                        Powered by
                        <span className="flex items-center gap-1.5 text-[#850000] font-bold" style={{ filter: 'brightness(1.5)' }}>
                            <span className="material-symbols-outlined text-lg">calendar_today</span>
                            Book&Call
                        </span>
                        <span className="ml-2 px-2 py-0.5 text-[10px] bg-green-500/20 text-green-400 rounded-md font-bold">FREE</span>
                    </p>
                </footer>
            </main>
        </div>
    );
}
