'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioCall, formatCallDuration } from '@/lib/hooks/use-audio-call';
import { useAuth } from '@/lib/hooks/use-auth';
import { bookingService, userService, eventTypeService, markCallStarted, markCallEnded, isCallExpired, callNotesService, Booking, User, EventType, CallNotes } from '@/lib/appwrite/database';
import { Logo } from '@/components/ui/logo';
import { NotesPanel } from '@/components/call/NotesPanel';
import { PostCallRecap } from '@/components/call/PostCallRecap';

export default function CallPage({ params }: { params: Promise<{ roomId: string }> }) {
    const { roomId } = use(params);
    const router = useRouter();
    const { userProfile } = useAuth();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [host, setHost] = useState<User | null>(null);
    const [eventType, setEventType] = useState<EventType | null>(null);
    const [previousCalls, setPreviousCalls] = useState<CallNotes[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExpired, setIsExpired] = useState(false);
    const [userName, setUserName] = useState('');
    const [hasJoined, setHasJoined] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [showNotesPanel, setShowNotesPanel] = useState(false);
    const [showPostCallRecap, setShowPostCallRecap] = useState(false);
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
            if (booking && !hasMarkedEnded.current) {
                hasMarkedEnded.current = true;
                try {
                    await markCallEnded(booking.$id);
                } catch (err) {
                    console.error('Failed to mark call as ended:', err);
                }
            }
            setShowPostCallRecap(true);
        },
    });

    useEffect(() => {
        const loadBooking = async () => {
            try {
                const foundBooking = await bookingService.getByRoomId(roomId);
                if (foundBooking) {
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

                    if (userProfile && foundBooking.userId === userProfile.$id) {
                        setIsHost(true);
                        // Load previous calls with this guest for context
                        const prevCalls = await callNotesService.getByGuestEmail(
                            foundBooking.userId,
                            foundBooking.guestEmail
                        );
                        setPreviousCalls(prevCalls.filter(c => c.callRoomId !== roomId));
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
        if (booking && !hasMarkedEnded.current) {
            hasMarkedEnded.current = true;
            try {
                await markCallEnded(booking.$id);
            } catch (err) {
                console.error('Failed to mark call as ended:', err);
            }
        }
        setShowPostCallRecap(true);
    };

    const handlePostCallClose = () => {
        if (isHost) {
            router.push('/dashboard');
        } else {
            router.push('/');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#fcf8f8] flex items-center justify-center" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.02) 1px, transparent 0)', backgroundSize: '32px 32px' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#850000] to-[#6b0000] flex items-center justify-center animate-pulse shadow-2xl shadow-[#850000]/30">
                        <span className="material-symbols-outlined text-white text-3xl">call</span>
                    </div>
                    <p className="text-[#6b4444] font-medium">Loading call...</p>
                </motion.div>
            </div>
        );
    }

    if (isExpired) {
        return (
            <div className="min-h-screen bg-[#fcf8f8] flex items-center justify-center p-4" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.02) 1px, transparent 0)', backgroundSize: '32px 32px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-[6px_6px_0px_0px_rgba(133,0,0,0.15)] border border-[#850000]/10 p-12 max-w-md text-center"
                >
                    <div className="w-24 h-24 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-orange-500 text-5xl">timer_off</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#1d0c0c] mb-3">Call Link Expired</h1>
                    <p className="text-[#6b4444] mb-8">This call has ended and the link is no longer valid.</p>
                    <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#850000] to-[#6b0000] text-white font-bold rounded-xl hover:shadow-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                        <span className="material-symbols-outlined">home</span>
                        Go Home
                    </Link>
                </motion.div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-[#fcf8f8] flex items-center justify-center p-4" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.02) 1px, transparent 0)', backgroundSize: '32px 32px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-[6px_6px_0px_0px_rgba(133,0,0,0.15)] border border-[#850000]/10 p-12 max-w-md text-center"
                >
                    <div className="w-24 h-24 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-red-500 text-5xl">call_end</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#1d0c0c] mb-3">Call Not Found</h1>
                    <p className="text-[#6b4444] mb-8">This call link is invalid or has expired.</p>
                    <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#850000] to-[#6b0000] text-white font-bold rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                        <span className="material-symbols-outlined">home</span>
                        Go Home
                    </Link>
                </motion.div>
            </div>
        );
    }

    // Show post-call recap
    if (showPostCallRecap && (callState === 'ended' || !hasJoined)) {
        return (
            <div className="min-h-screen bg-[#fcf8f8] flex items-center justify-center p-4" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.02) 1px, transparent 0)', backgroundSize: '32px 32px' }}>
                <PostCallRecap
                    callRoomId={roomId}
                    hostId={booking.userId}
                    guestName={booking.guestName}
                    guestEmail={booking.guestEmail}
                    hostName={host?.name || 'Host'}
                    callDuration={callDuration}
                    isHost={isHost}
                    onClose={handlePostCallClose}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fcf8f8] text-[#1d0c0c] flex flex-col" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.02) 1px, transparent 0)', backgroundSize: '32px 32px' }}>
            {/* Ambient Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-[#850000]/5 rounded-full blur-[200px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] bg-[#850000]/3 rounded-full blur-[150px]" />
            </div>

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-6 py-4 bg-white/60 backdrop-blur-xl border-b border-[#850000]/5">
                <div className="flex items-center gap-3">
                    <Logo size="sm" />
                    <span className="text-[10px] font-bold bg-[#850000]/10 text-[#850000] px-2 py-0.5 rounded-full">CALL</span>
                </div>
                <div className="flex items-center gap-3">
                    {callState === 'connected' && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-green-700 font-medium text-sm">{formatCallDuration(callDuration)}</span>
                        </div>
                    )}
                    {isHost && (
                        <span className="text-xs font-medium bg-[#850000]/10 text-[#850000] px-3 py-1 rounded-full">
                            Host
                        </span>
                    )}
                    {/* Notes Panel Toggle */}
                    {hasJoined && (
                        <button
                            onClick={() => setShowNotesPanel(!showNotesPanel)}
                            className={`p-2 rounded-lg transition-colors ${showNotesPanel ? 'bg-[#850000] text-white' : 'bg-[#850000]/10 text-[#850000] hover:bg-[#850000]/20'}`}
                            title={isHost ? 'Notes & Documents' : 'Documents'}
                        >
                            <span className="material-symbols-outlined">{isHost ? 'edit_note' : 'folder'}</span>
                        </button>
                    )}
                </div>
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
                                className="bg-white rounded-2xl shadow-[6px_6px_0px_0px_rgba(133,0,0,0.15)] border border-[#850000]/10 p-8 text-center"
                            >
                                {/* Branding Badge */}
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#850000]/5 rounded-full mb-6">
                                    <span className="material-symbols-outlined text-[#850000] text-sm">verified</span>
                                    <span className="text-[#850000] text-sm font-medium">Book&Call Audio</span>
                                </div>

                                {/* Previous Calls Context (Host Only) */}
                                {isHost && previousCalls.length > 0 && (
                                    <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                        <div className="flex items-center gap-2 justify-center">
                                            <span className="material-symbols-outlined text-blue-600 text-sm">history</span>
                                            <span className="text-sm text-blue-700 font-medium">
                                                {previousCalls.length} previous call{previousCalls.length > 1 ? 's' : ''} with {booking.guestName}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Event Info */}
                                <div className="mb-8">
                                    <div className="w-20 h-20 bg-gradient-to-br from-[#850000]/20 to-[#850000]/5 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[3px_3px_0px_0px_rgba(133,0,0,0.2)]">
                                        <span className="text-[#850000] text-3xl font-bold">{host?.name?.charAt(0) || '?'}</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-[#1d0c0c] mb-1">{eventType?.title || 'Meeting'}</h2>
                                    <p className="text-[#6b4444]">with {host?.name || 'Host'}</p>
                                </div>

                                {/* Call Purpose (if set) */}
                                {booking.callPurpose && (
                                    <div className="mb-6 p-4 bg-[#850000]/5 rounded-xl text-left">
                                        <p className="text-xs font-bold text-[#850000] uppercase tracking-wide mb-1">Call Purpose</p>
                                        <p className="text-sm text-[#1d0c0c]">{booking.callPurpose}</p>
                                        {booking.expectedOutcome && (
                                            <>
                                                <p className="text-xs font-bold text-[#850000] uppercase tracking-wide mt-3 mb-1">Expected Outcome</p>
                                                <p className="text-sm text-[#1d0c0c]">{booking.expectedOutcome}</p>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Call Details */}
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-[#850000]/5 rounded-xl p-4">
                                        <span className="material-symbols-outlined text-[#850000] mb-2">schedule</span>
                                        <p className="text-sm text-[#6b4444]">Duration</p>
                                        <p className="font-bold text-[#1d0c0c]">{eventType?.duration || 30} min</p>
                                    </div>
                                    <div className="bg-[#850000]/5 rounded-xl p-4">
                                        <span className="material-symbols-outlined text-[#850000] mb-2">calendar_today</span>
                                        <p className="text-sm text-[#6b4444]">Scheduled</p>
                                        <p className="font-bold text-[#1d0c0c]">{new Date(booking.slotTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                    </div>
                                </div>

                                {/* Features */}
                                <div className="flex justify-center gap-6 mb-8 text-sm text-[#6b4444]">
                                    <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-green-600 text-base">lock</span>
                                        Encrypted
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-green-600 text-base">speed</span>
                                        P2P Direct
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-green-600 text-base">record_voice_over</span>
                                        Audio Only
                                    </div>
                                </div>

                                {/* Join Button */}
                                <button
                                    onClick={handleJoin}
                                    className="w-full py-4 bg-gradient-to-r from-[#850000] to-[#6b0000] text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                                >
                                    <span className="material-symbols-outlined">call</span>
                                    Join Audio Call
                                </button>

                                <p className="text-[#6b4444] text-sm mt-4">
                                    You'll need to allow microphone access
                                </p>
                            </motion.div>
                        )}

                        {/* Call screen */}
                        {hasJoined && !showPostCallRecap && (
                            <motion.div
                                key="call"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-2xl shadow-[6px_6px_0px_0px_rgba(133,0,0,0.15)] border border-[#850000]/10 p-8"
                            >
                                {/* Avatar & Status */}
                                <div className="text-center mb-8">
                                    <motion.div
                                        className={`w-28 h-28 rounded-full mx-auto mb-4 flex items-center justify-center ${callState === 'connected'
                                            ? 'bg-gradient-to-br from-green-200 to-green-100 ring-4 ring-green-400/30'
                                            : 'bg-gradient-to-br from-[#850000]/20 to-[#850000]/5'
                                            }`}
                                        animate={callState === 'waiting' || callState === 'connecting' ? { scale: [1, 1.05, 1] } : {}}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                    >
                                        <span className={`text-4xl font-bold ${callState === 'connected' ? 'text-green-600' : 'text-[#850000]'}`}>
                                            {isHost ? booking.guestName.charAt(0) : host?.name?.charAt(0) || '?'}
                                        </span>
                                    </motion.div>
                                    <h2 className="text-xl font-bold text-[#1d0c0c] mb-1">
                                        {isHost ? booking.guestName : host?.name || 'Host'}
                                    </h2>
                                    <p className={`text-sm font-medium ${callState === 'connected' ? 'text-green-600' :
                                        callState === 'waiting' ? 'text-[#850000]' :
                                            callState === 'connecting' ? 'text-blue-600' :
                                                callState === 'error' ? 'text-red-600' :
                                                    'text-[#6b4444]'
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
                                        className="mb-6 p-4 bg-red-100 rounded-xl text-red-700 text-sm text-center"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                {/* Call Duration */}
                                {callState === 'connected' && (
                                    <div className="text-center mb-8">
                                        <p className="text-4xl font-mono font-bold text-[#1d0c0c]">
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
                                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] ${isMuted
                                                ? 'bg-red-100 text-red-600 ring-2 ring-red-400'
                                                : 'bg-[#850000]/10 text-[#850000] hover:bg-[#850000]/20'
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
                                            className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-red-600"
                                        >
                                            <span className="material-symbols-outlined text-2xl">call_end</span>
                                        </motion.button>

                                        {/* Notes Toggle (Mobile) */}
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setShowNotesPanel(!showNotesPanel)}
                                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] ${showNotesPanel
                                                ? 'bg-[#850000] text-white'
                                                : 'bg-[#850000]/10 text-[#850000] hover:bg-[#850000]/20'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-2xl">{isHost ? 'edit_note' : 'folder'}</span>
                                        </motion.button>
                                    </div>
                                )}

                                {/* Error Retry */}
                                {callState === 'error' && (
                                    <div className="flex justify-center gap-4">
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="px-6 py-3 bg-gradient-to-r from-[#850000] to-[#6b0000] text-white rounded-xl font-bold flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
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

            {/* Notes Panel */}
            {hasJoined && booking && (
                <NotesPanel
                    callRoomId={roomId}
                    hostId={booking.userId}
                    guestEmail={booking.guestEmail}
                    isHost={isHost}
                    isExpanded={showNotesPanel}
                    onToggle={() => setShowNotesPanel(!showNotesPanel)}
                />
            )}

            {/* Footer */}
            <footer className="relative z-10 text-center py-4 bg-white/60 backdrop-blur-xl border-t border-[#850000]/5">
                <div className="flex items-center justify-center gap-2 text-[#6b4444] text-sm">
                    <Logo size="sm" />
                    <span className="mx-2">•</span>
                    <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-green-600 text-sm">lock</span>
                        P2P Encrypted Audio
                    </span>
                </div>
            </footer>
        </div>
    );
}
