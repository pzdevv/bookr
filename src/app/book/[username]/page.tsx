'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { use } from 'react';
import { userService, eventTypeService, User, EventType } from '@/lib/appwrite/database';
import { Logo } from '@/components/ui/logo';

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
            <div className="min-h-screen bg-[#fcf8f8] flex items-center justify-center" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.02) 1px, transparent 0)', backgroundSize: '32px 32px' }}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-[#850000] flex items-center justify-center animate-pulse shadow-2xl shadow-[#850000]/30">
                        <span className="material-symbols-outlined text-white text-3xl">calendar_today</span>
                    </div>
                    <p className="text-[#6b4444] font-medium">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#fcf8f8] flex items-center justify-center p-4" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.02) 1px, transparent 0)', backgroundSize: '32px 32px' }}>
                <div className="bg-white/80 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-gray-200/50 p-12 max-w-md text-center border border-[#850000]/5">
                    <div className="w-24 h-24 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-red-400 text-5xl">person_off</span>
                    </div>
                    <h1 className="text-3xl font-bold text-[#1d0c0c] mb-3">User not found</h1>
                    <p className="text-[#6b4444] mb-8">This user doesn't exist or may have been removed.</p>
                    <Link href="/" className="inline-flex items-center gap-2 px-8 py-4 bg-[#850000] text-white font-bold rounded-lg hover:bg-[#6b0000] hover:shadow-2xl hover:shadow-[#850000]/30 transition-all">
                        <span className="material-symbols-outlined">home</span>
                        Go to homepage
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fcf8f8] text-[#1d0c0c] font-[Inter,sans-serif]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.02) 1px, transparent 0)', backgroundSize: '32px 32px' }}>
            {/* Subtle Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-[#850000]/5 rounded-full blur-[200px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] bg-[#850000]/3 rounded-full blur-[150px]" />
            </div>

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5 bg-white/60 backdrop-blur-xl border-b border-[#850000]/5">
                <Logo size="sm" href="/" />
                <div className="flex gap-3">
                    <Link href="/auth/login" className="px-5 py-2.5 text-sm font-medium text-[#6b4444] hover:text-[#1d0c0c] transition-colors">
                        Log In
                    </Link>
                    <Link href="/auth/signup" className="px-6 py-2.5 bg-[#850000] text-white text-sm font-bold rounded-lg hover:bg-[#6b0000] hover:shadow-lg hover:shadow-[#850000]/30 transition-all">
                        Sign Up Free
                    </Link>
                </div>
            </header>

            <main className="relative z-10 max-w-2xl mx-auto py-16 px-4">
                {/* Profile Card */}
                <div className="text-center mb-12">
                    <div className="relative inline-block mb-6">
                        <div
                            className="w-32 h-32 rounded-2xl bg-[#850000]/10 flex items-center justify-center shadow-xl bg-cover bg-center border-4 border-white"
                            style={user.avatar ? { backgroundImage: `url('${user.avatar}')` } : undefined}
                        >
                            {!user.avatar && <span className="text-[#850000] text-5xl font-bold">{user.name?.charAt(0)}</span>}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center border-4 border-[#fcf8f8] shadow-lg">
                            <span className="material-symbols-outlined text-white">check</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-[#1d0c0c] mb-2">{user.name}</h1>
                    <p className="text-[#6b4444] text-lg max-w-md mx-auto">{user.bio || 'Book a time to connect!'}</p>
                </div>

                {/* Event Types */}
                <div className="space-y-4">
                    {eventTypes.length === 0 ? (
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-[#850000]/5 p-12 text-center shadow-lg">
                            <div className="w-16 h-16 bg-[#850000]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-[#850000]/30 text-3xl">event_busy</span>
                            </div>
                            <p className="text-[#6b4444]">No event types available yet.</p>
                        </div>
                    ) : (
                        eventTypes.map((event) => (
                            <Link
                                key={event.$id}
                                href={`/book/${username}/${event.slug}`}
                                className="block bg-white/80 backdrop-blur-xl rounded-xl border border-[#850000]/5 p-6 hover:bg-white hover:border-[#850000]/20 hover:shadow-xl hover:shadow-[#850000]/5 transition-all group hover:scale-[1.02] shadow-[4px_4px_0px_0px_rgba(133,0,0,0.1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div
                                            className="w-4 h-4 rounded-full mt-1.5 shadow-lg"
                                            style={{ backgroundColor: event.color || '#850000', boxShadow: `0 0 20px ${event.color || '#850000'}40` }}
                                        />
                                        <div>
                                            <h3 className="text-xl font-bold text-[#1d0c0c] group-hover:text-[#850000] transition-colors">{event.title}</h3>
                                            <p className="text-[#6b4444] mt-1">{event.description || 'No description'}</p>
                                            <div className="flex items-center gap-6 mt-4">
                                                <span className="flex items-center gap-2 text-sm text-[#6b4444]">
                                                    <span className="material-symbols-outlined text-[#850000] text-lg">schedule</span>
                                                    {event.duration} min
                                                </span>
                                                <span className="flex items-center gap-2 text-sm text-[#6b4444]">
                                                    <span className="material-symbols-outlined text-[#850000] text-lg">videocam</span>
                                                    Video call
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 bg-[#850000]/10 rounded-lg flex items-center justify-center group-hover:bg-[#850000] transition-all">
                                        <span className="material-symbols-outlined text-[#850000] group-hover:text-white transition-colors">arrow_forward</span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>

                {/* Footer */}
                <footer className="mt-16 text-center flex flex-col items-center gap-2">
                    <p className="text-[#6b4444] text-sm">Powered by</p>
                    <Logo size="sm" href="/" />
                </footer>
            </main>
        </div>
    );
}

