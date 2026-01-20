'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioCall, formatCallDuration } from '@/lib/hooks/use-audio-call';
import { useAuth } from '@/lib/hooks/use-auth';
import { bookingService, userService, eventTypeService, markCallStarted, markCallEnded, isCallExpired, Booking, User, EventType } from '@/lib/appwrite/database';
import { Logo } from '@/components/ui/logo';

export default function CallPage({ params }: { params: Promise<{ roomId: string }> }) {
    const { roomId } = use(params);
    const router = useRouter();
    const { userProfile } = useAuth();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [host, setHost] = useState<User | null>(null);
    const [eventType, setEventType] = useState<EventType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExpired, setIsExpired] = useState(false);
    const [userName, setUserName] = useState('');
    const [hasJoined, setHasJoined] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const hasMarkedStarted = useRef(false);
    const hasMarkedEnded = useRef(false);

    const {
        callState,
        isMuted,
        callDuration,
        error,
        startCall,
        endCall,
        toggleMute,
    } = useAudioCall({
        roomId,
        userName: userName || 'Guest',
        onCallEnded: async () => {
            // Mark call as ended when it terminates
            if (booking && !hasMarkedEnded.current) {
                hasMarkedEnded.current = true;
                try {
                    await markCallEnded(booking.$id);
                } catch (err) {
                    console.error('Failed to mark call as ended:', err);
                }
            }
        },
    });

    useEffect(() => {
        const loadBooking = async () => {
            try {
                const foundBooking = await bookingService.getByRoomId(roomId);
                if (foundBooking) {
                    // Check if call has expired
                    if (isCallExpired(foundBooking)) {
                        setIsExpired(true);
                        setIsLoading(false);
                        return;
                    }

                    setBooking(foundBooking);
                    setUserName(foundBooking.guestName);

                    const [foundHost, foundEventType] = await Promise.all([
                        userService.get(foundBooking.userId),
                        eventTypeService.get(foundBooking.eventTypeId),
                    ]);
                    setHost(foundHost);
                    setEventType(foundEventType);

                    // Check if current user is the host
                    if (userProfile && foundBooking.userId === userProfile.$id) {
                        setIsHost(true);
                    }
                }
            } catch (err) {
                console.error('Error loading booking:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadBooking();
    }, [roomId, userProfile]);

    const handleJoin = async () => {
        setHasJoined(true);

        // Mark call as started (only once)
        if (booking && !hasMarkedStarted.current && !booking.callStartedAt) {
            hasMarkedStarted.current = true;
            try {
                await markCallStarted(booking.$id);
            } catch (err) {
                console.error('Failed to mark call as started:', err);
            }
        }

        await startCall();
    };

    const handleEndCall = async () => {
        endCall();

        // Mark call as ended
        if (booking && !hasMarkedEnded.current) {
            hasMarkedEnded.current = true;
            try {
                await markCallEnded(booking.$id);
            } catch (err) {
                console.error('Failed to mark call as ended:', err);
            }
        }
    };

    // Host redirect after call ends
    const handleHostContinue = () => {
        router.push('/dashboard');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#fbbd23] to-orange-500 flex items-center justify-center animate-pulse shadow-2xl shadow-[#fbbd23]/30">
                        <span className="material-symbols-outlined text-white text-3xl">call</span>
                    </div>
                    <p className="text-gray-500">Loading call...</p>
                </motion.div>
            </div>
        );
    }

    // Show expired state
    if (isExpired) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-12 max-w-md text-center"
                >
                    <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-orange-400 text-5xl">timer_off</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-3">Call Link Expired</h1>
                    <p className="text-gray-400 mb-8">This call has ended and the link is no longer valid.</p>
                    <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#fbbd23] to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all">
                        <span className="material-symbols-outlined">home</span>
                        Go Home
                    </Link>
                </motion.div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-12 max-w-md text-center"
                >
                    <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-red-400 text-5xl">call_end</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-3">Call Not Found</h1>
                    <p className="text-gray-400 mb-8">This call link is invalid or has expired.</p>
                    <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#fbbd23] to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all">
                        <span className="material-symbols-outlined">home</span>
                        Go Home
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] text-white flex flex-col">
            {/* Ambient Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-[#fbbd23]/5 rounded-full blur-[200px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[30vw] h-[30vw] bg-purple-500/5 rounded-full blur-[150px]" />
            </div>

            {/* Header with Branding */}
            <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <Logo size="sm" variant="light" />
                    <span className="text-[10px] font-bold bg-[#fbbd23]/20 text-[#fbbd23] px-2 py-0.5 rounded-full">CALL</span>
                </div>
                {callState === 'connected' && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-green-400 font-medium text-sm">{formatCallDuration(callDuration)}</span>
                    </div>
                )}
                {isHost && (
                    <span className="text-xs font-medium bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full">
                        Host
                    </span>
                )}
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-lg">
                    <AnimatePresence mode="wait">
                        {/* Pre-join screen */}
                        {!hasJoined && (
                            <motion.div
                                key="prejoin"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 text-center"
                            >
                                {/* Branding Badge */}
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#fbbd23]/10 rounded-full mb-6">
                                    <span className="material-symbols-outlined text-[#fbbd23] text-sm">verified</span>
                                    <span className="text-[#fbbd23] text-sm font-medium">Bookr Audio Call</span>
                                </div>

                                {/* Event Info */}
                                <div className="mb-8">
                                    <div className="w-20 h-20 bg-gradient-to-br from-[#fbbd23]/20 to-[#fbbd23]/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <span className="text-[#fbbd23] text-3xl font-bold">{host?.name?.charAt(0) || '?'}</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-1">{eventType?.title || 'Meeting'}</h2>
                                    <p className="text-gray-400">with {host?.name || 'Host'}</p>
                                </div>

                                {/* Call Details */}
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-white/5 rounded-xl p-4">
                                        <span className="material-symbols-outlined text-[#fbbd23] mb-2">schedule</span>
                                        <p className="text-sm text-gray-400">Duration</p>
                                        <p className="font-bold">{eventType?.duration || 30} min</p>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4">
                                        <span className="material-symbols-outlined text-[#fbbd23] mb-2">calendar_today</span>
                                        <p className="text-sm text-gray-400">Scheduled</p>
                                        <p className="font-bold">{new Date(booking.slotTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                    </div>
                                </div>

                                {/* Features */}
                                <div className="flex justify-center gap-6 mb-8 text-sm text-gray-400">
                                    <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-green-400 text-base">lock</span>
                                        Encrypted
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-green-400 text-base">speed</span>
                                        P2P Direct
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-green-400 text-base">record_voice_over</span>
                                        Audio Only
                                    </div>
                                </div>

                                {/* Join Button */}
                                <button
                                    onClick={handleJoin}
                                    className="w-full py-4 bg-gradient-to-r from-[#fbbd23] to-orange-500 text-[#1c180c] rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-[#fbbd23]/30 transition-all hover:scale-[1.02]"
                                >
                                    <span className="material-symbols-outlined">call</span>
                                    Join Audio Call
                                </button>

                                <p className="text-gray-500 text-sm mt-4">
                                    You'll need to allow microphone access
                                </p>
                            </motion.div>
                        )}

                        {/* Call screen */}
                        {hasJoined && (
                            <motion.div
                                key="call"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8"
                            >
                                {/* Avatar & Status */}
                                <div className="text-center mb-8">
                                    <motion.div
                                        className={`w-28 h-28 rounded-full mx-auto mb-4 flex items-center justify-center ${callState === 'connected'
                                            ? 'bg-gradient-to-br from-green-500/20 to-green-600/10 ring-4 ring-green-500/30'
                                            : 'bg-gradient-to-br from-[#fbbd23]/20 to-[#fbbd23]/5'
                                            }`}
                                        animate={callState === 'waiting' || callState === 'connecting' ? { scale: [1, 1.05, 1] } : {}}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                    >
                                        <span className={`text-4xl font-bold ${callState === 'connected' ? 'text-green-400' : 'text-[#fbbd23]'}`}>
                                            {isHost ? booking.guestName.charAt(0) : host?.name?.charAt(0) || '?'}
                                        </span>
                                    </motion.div>
                                    <h2 className="text-xl font-bold text-white mb-1">
                                        {isHost ? booking.guestName : host?.name || 'Host'}
                                    </h2>
                                    <p className={`text-sm font-medium ${callState === 'connected' ? 'text-green-400' :
                                        callState === 'waiting' ? 'text-[#fbbd23]' :
                                            callState === 'connecting' ? 'text-blue-400' :
                                                callState === 'error' ? 'text-red-400' :
                                                    'text-gray-400'
                                        }`}>
                                        {callState === 'connecting' && 'Connecting...'}
                                        {callState === 'waiting' && 'Waiting for others to join...'}
                                        {callState === 'connected' && 'Connected'}
                                        {callState === 'ended' && 'Call ended'}
                                        {callState === 'error' && 'Connection failed'}
                                    </p>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-6 p-4 bg-red-500/10 rounded-xl text-red-400 text-sm text-center"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                {/* Call Duration */}
                                {callState === 'connected' && (
                                    <div className="text-center mb-8">
                                        <p className="text-4xl font-mono font-bold text-white">
                                            {formatCallDuration(callDuration)}
                                        </p>
                                    </div>
                                )}

                                {/* Call Controls */}
                                {(callState === 'connected' || callState === 'waiting' || callState === 'connecting') && (
                                    <div className="flex items-center justify-center gap-4">
                                        {/* Mute Button */}
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={toggleMute}
                                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isMuted
                                                ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/50'
                                                : 'bg-white/10 text-white hover:bg-white/20'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-2xl">
                                                {isMuted ? 'mic_off' : 'mic'}
                                            </span>
                                        </motion.button>

                                        {/* End Call Button */}
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleEndCall}
                                            className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 hover:bg-red-600"
                                        >
                                            <span className="material-symbols-outlined text-2xl">call_end</span>
                                        </motion.button>
                                    </div>
                                )}

                                {/* Ended State - Different for Host vs Guest */}
                                {callState === 'ended' && (
                                    <div className="text-center">
                                        <div className="bg-green-500/10 rounded-xl p-6 mb-6">
                                            <span className="material-symbols-outlined text-green-400 text-4xl mb-2">check_circle</span>
                                            <p className="text-green-400 font-bold text-lg">Call Completed!</p>
                                            <p className="text-gray-400 text-sm mt-1">Duration: {formatCallDuration(callDuration)}</p>
                                        </div>

                                        {isHost ? (
                                            // Host: Go to Dashboard
                                            <div className="space-y-4">
                                                <p className="text-gray-400 text-sm">Great call! Head back to your dashboard.</p>
                                                <button
                                                    onClick={handleHostContinue}
                                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#fbbd23] to-orange-500 text-[#1c180c] font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-[#fbbd23]/30 transition-all"
                                                >
                                                    <span className="material-symbols-outlined">dashboard</span>
                                                    Go to Dashboard
                                                </button>
                                            </div>
                                        ) : (
                                            // Guest: CTA to book their own meetings
                                            <div className="space-y-4">
                                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                                    <p className="text-white font-medium mb-2">Enjoyed the call?</p>
                                                    <p className="text-gray-400 text-sm">Get your own free booking page and start scheduling calls like a pro!</p>
                                                </div>
                                                <Link
                                                    href="/auth/signup"
                                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#fbbd23] to-orange-500 text-[#1c180c] font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-[#fbbd23]/30 transition-all"
                                                >
                                                    <span className="material-symbols-outlined">person_add</span>
                                                    Get Your Free Booking Page
                                                </Link>
                                                <Link
                                                    href="/"
                                                    className="w-full py-3 rounded-xl bg-white/5 text-gray-400 font-medium flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white transition-all"
                                                >
                                                    Maybe Later
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Error Retry */}
                                {callState === 'error' && (
                                    <div className="flex justify-center gap-4">
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="px-6 py-3 bg-[#fbbd23] text-[#1c180c] rounded-xl font-bold flex items-center gap-2 hover:shadow-lg transition-all"
                                        >
                                            <span className="material-symbols-outlined">refresh</span>
                                            Try Again
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* Footer with Branding */}
            <footer className="relative z-10 text-center py-4 border-t border-white/5">
                <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                    <span className="material-symbols-outlined text-[#fbbd23] text-lg">calendar_today</span>
                    <span>Powered by <span className="text-[#fbbd23] font-bold">Bookr</span></span>
                    <span className="mx-2">•</span>
                    <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-green-400 text-sm">lock</span>
                        P2P Encrypted Audio
                    </span>
                </div>
            </footer>
        </div>
    );
}
