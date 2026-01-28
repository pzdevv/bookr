'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCall, formatCallDuration } from '@/lib/hooks/use-call';
import { useAuth } from '@/lib/hooks/use-auth';
import { bookingService, userService, eventTypeService, markCallStarted, markCallEnded, isCallExpired, isCallTooEarly, callNotesService, callDocumentsService, Booking, User, EventType, CallNotes, CallDocument, ActionItem } from '@/lib/appwrite/database';
import { sanitizeMultiline, sanitizeText } from '@/lib/utils/sanitize';
import { Logo } from '@/components/ui/logo';

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
    const [isTooEarly, setIsTooEarly] = useState(false);
    const [userName, setUserName] = useState('');
    const [hasJoined, setHasJoined] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [guestId, setGuestId] = useState('');

    // Notes state
    const [notes, setNotes] = useState<CallNotes | null>(null);
    const [documents, setDocuments] = useState<CallDocument[]>([]);
    const [summary, setSummary] = useState('');
    const [decisions, setDecisions] = useState('');
    const [actionItems, setActionItems] = useState<ActionItem[]>([]);
    const [newActionText, setNewActionText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [chatMessage, setChatMessage] = useState('');

    const hasMarkedStarted = useRef(false);
    const hasMarkedEnded = useRef(false);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    // Initialize guest ID if not logged in
    useEffect(() => {
        if (!userProfile) {
            const stored = localStorage.getItem('bookr_guest_id');
            if (stored) {
                setGuestId(stored);
            } else {
                const newId = `guest-${Date.now()}`;
                localStorage.setItem('bookr_guest_id', newId);
                setGuestId(newId);
            }
        }
    }, [userProfile]);

    const {
        callState,
        callMode,
        isMuted,
        isVideoOff,
        callDuration,
        error,
        localStream,
        remoteStream,
        messages,
        startCall,
        endCall,
        toggleMute,
        toggleVideo,
        sendMessage,
    } = useCall({
        roomId,
        userName: userName || 'Guest',
        userId: userProfile?.$id || guestId,
        isHost,
        bookingId: booking?.$id,
        mode: 'video',
        onCallEnded: async () => {
            if (booking && !hasMarkedEnded.current) {
                hasMarkedEnded.current = true;
                try {
                    await markCallEnded(booking.$id);
                } catch (err) {
                    console.error('Failed to mark call as ended:', err);
                }
            }
            setCallEnded(true);
        },
    });

    // Attach streams to video elements
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, hasJoined]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Load booking data
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

                    if (isCallTooEarly(foundBooking)) {
                        setIsTooEarly(true);
                        setBooking(foundBooking);
                        // Still load host/event for display
                        const [foundHost, foundEventType] = await Promise.all([
                            userService.get(foundBooking.userId),
                            eventTypeService.get(foundBooking.eventTypeId),
                        ]);
                        setHost(foundHost);
                        setEventType(foundEventType);
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
                        // Load previous calls with this guest
                        if (callNotesService.isConfigured()) {
                            const prevCalls = await callNotesService.getByGuestEmail(
                                foundBooking.userId,
                                foundBooking.guestEmail
                            );
                            setPreviousCalls(prevCalls.filter(c => c.callRoomId !== roomId));
                        }
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

    // Load notes and documents when needed
    useEffect(() => {
        if (!booking || !hasJoined) return;

        const loadNotesAndDocs = async () => {
            try {
                if (callNotesService.isConfigured()) {
                    let notesData;
                    if (isHost) {
                        notesData = await callNotesService.getOrCreate(roomId, booking.userId, booking.guestEmail);
                    } else {
                        notesData = await callNotesService.getByRoomId(roomId);
                    }

                    if (notesData) {
                        setNotes(notesData);
                        setSummary(notesData.summary || '');
                        setDecisions(notesData.decisions || '');
                        setActionItems(notesData.actionItems ? JSON.parse(notesData.actionItems) : []);
                    }
                }

                if (callDocumentsService.isConfigured()) {
                    const docsData = await callDocumentsService.listByRoomId(roomId);
                    setDocuments(docsData);
                }
            } catch (err) {
                console.error('Error loading notes:', err);
            }
        };

        loadNotesAndDocs();
    }, [booking, hasJoined, roomId]);

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
        setCallEnded(true);
    };



    const saveNotes = async () => {
        if (!notes || !isHost) return;
        setIsSaving(true);
        try {
            await callNotesService.update(notes.$id, {
                summary: sanitizeMultiline(summary, 2000),
                decisions: sanitizeMultiline(decisions, 2000),
                actionItems: JSON.stringify(actionItems),
            });
        } catch (err) {
            console.error('Error saving notes:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const addActionItem = () => {
        const cleanText = sanitizeText(newActionText);
        if (!cleanText) return;
        setActionItems([...actionItems, { text: cleanText, assignedTo: 'host', completed: false }]);
        setNewActionText('');
    };

    const toggleActionItem = (index: number) => {
        const updated = [...actionItems];
        updated[index].completed = !updated[index].completed;
        setActionItems(updated);
    };

    const copySummary = () => {
        const text = `Call Summary - ${new Date().toLocaleDateString()}
Duration: ${formatCallDuration(callDuration)}
With: ${booking?.guestName}

Summary: ${summary || 'No summary'}
Decisions: ${decisions || 'None recorded'}
Action Items: ${actionItems.length > 0 ? actionItems.map((item, i) => `\n${i + 1}. [${item.completed ? '✓' : ' '}] ${item.text}`).join('') : 'None'}`;

        navigator.clipboard.writeText(text);
    };

    const handleClose = () => {
        if (isHost) {
            router.push('/dashboard');
        } else {
            router.push('/');
        }
    };

    // Loading State
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#fcf8f8] flex items-center justify-center" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.03) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#850000] to-[#6b0000] flex items-center justify-center mx-auto mb-4 shadow-xl">
                        <span className="material-symbols-outlined text-white text-4xl animate-pulse">call</span>
                    </div>
                    <p className="text-[#6b4444] font-medium">Setting up your call...</p>
                </motion.div>
            </div>
        );
    }

    // Expired State
    if (isExpired) {
        return (
            <div className="min-h-screen bg-[#fcf8f8] flex items-center justify-center p-4" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.03) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-xl border border-[#850000]/10 p-10 max-w-sm text-center"
                >
                    <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-orange-500 text-4xl">schedule</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#1d0c0c] mb-2">Call Expired</h1>
                    <p className="text-[#6b4444] mb-8">This call link is no longer active.</p>
                    <Link href="/" className="inline-flex items-center gap-2 px-8 py-3 bg-[#850000] text-white font-bold rounded-xl hover:bg-[#6b0000] transition-all">
                        <span className="material-symbols-outlined">home</span>
                        Go Home
                    </Link>
                </motion.div>
            </div>
        );
    }

    // Too Early State
    if (isTooEarly && booking) {
        const slotTime = new Date(booking.slotTime);
        const minutesUntil = Math.ceil((slotTime.getTime() - Date.now()) / 60000);
        return (
            <div className="min-h-screen bg-[#fcf8f8] flex items-center justify-center p-4" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.03) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-xl border border-[#850000]/10 p-10 max-w-md text-center"
                >
                    <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-blue-500 text-4xl">hourglass_top</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#1d0c0c] mb-2">Too Early to Join</h1>
                    <p className="text-[#6b4444] mb-4">
                        Your call with <strong>{host?.name || 'Host'}</strong> is scheduled for:
                    </p>
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <p className="text-lg font-bold text-[#1d0c0c]">
                            {slotTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                        <p className="text-[#850000] font-semibold">
                            {slotTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </p>
                    </div>
                    <p className="text-[#6b4444] mb-6">
                        You can join <strong>15 minutes</strong> before your scheduled time.<br />
                        <span className="text-sm">({minutesUntil} minutes remaining)</span>
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-[#850000] text-white font-bold rounded-xl hover:bg-[#6b0000] transition-all"
                    >
                        <span className="material-symbols-outlined">refresh</span>
                        Check Again
                    </button>
                </motion.div>
            </div>
        );
    }

    // Not Found State
    if (!booking) {
        return (
            <div className="min-h-screen bg-[#fcf8f8] flex items-center justify-center p-4" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.03) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-xl border border-[#850000]/10 p-10 max-w-sm text-center"
                >
                    <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-red-500 text-4xl">error</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#1d0c0c] mb-2">Call Not Found</h1>
                    <p className="text-[#6b4444] mb-8">This call link is invalid.</p>
                    <Link href="/" className="inline-flex items-center gap-2 px-8 py-3 bg-[#850000] text-white font-bold rounded-xl hover:bg-[#6b0000] transition-all">
                        <span className="material-symbols-outlined">home</span>
                        Go Home
                    </Link>
                </motion.div>
            </div>
        );
    }

    // Call Ended State
    if (callEnded) {
        return (
            <div className="min-h-screen bg-[#fcf8f8] flex items-center justify-center p-4" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.03) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl shadow-xl border border-[#850000]/10 p-8 max-w-lg w-full"
                >
                    {/* Success Header */}
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
                        </div>
                        <h2 className="text-2xl font-bold text-[#1d0c0c]">Call Complete!</h2>
                        <p className="text-[#6b4444] mt-1">Duration: {formatCallDuration(callDuration)}</p>
                    </div>

                    {/* Notes Section (Host Only) */}
                    {isHost && callNotesService.isConfigured() && (
                        <div className="bg-[#fcf8f8] rounded-2xl p-5 mb-6">
                            <h3 className="font-bold text-[#1d0c0c] mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#850000]">edit_note</span>
                                Quick Notes
                            </h3>

                            <textarea
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                placeholder="What was this call about?"
                                className="w-full p-3 bg-white border border-[#850000]/10 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#850000]/20 mb-3"
                                rows={2}
                            />

                            <div className="flex gap-2">
                                <button
                                    onClick={saveNotes}
                                    disabled={isSaving}
                                    className="flex-1 py-2.5 bg-[#850000]/10 text-[#850000] rounded-xl font-medium text-sm hover:bg-[#850000]/20 transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Save Notes'}
                                </button>
                                <button
                                    onClick={copySummary}
                                    className="py-2.5 px-4 bg-[#850000]/10 text-[#850000] rounded-xl font-medium text-sm hover:bg-[#850000]/20 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">content_copy</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    {isHost ? (
                        <button
                            onClick={handleClose}
                            className="w-full py-4 bg-gradient-to-r from-[#850000] to-[#6b0000] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                        >
                            <span className="material-symbols-outlined">dashboard</span>
                            Back to Dashboard
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <div className="bg-gradient-to-r from-[#850000]/5 to-[#850000]/10 rounded-2xl p-5 text-center">
                                <p className="font-bold text-[#1d0c0c] mb-1">Enjoyed this call?</p>
                                <p className="text-sm text-[#6b4444]">Create your own free booking page!</p>
                            </div>
                            <Link
                                href="/auth/signup"
                                className="w-full py-4 bg-gradient-to-r from-[#850000] to-[#6b0000] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                            >
                                <span className="material-symbols-outlined">rocket_launch</span>
                                Get Started Free
                            </Link>
                            <button
                                onClick={handleClose}
                                className="w-full py-3 text-[#6b4444] font-medium hover:text-[#1d0c0c] transition-colors"
                            >
                                Maybe Later
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fcf8f8] flex flex-col" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.03) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-xl border-b border-[#850000]/5">
                <Logo size="sm" />
                <div className="flex items-center gap-2">
                    {callState === 'connected' && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 rounded-full">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-green-700 font-mono text-sm font-bold">{formatCallDuration(callDuration)}</span>
                        </div>
                    )}
                    {isHost && <span className="text-xs bg-[#850000]/10 text-[#850000] px-2 py-1 rounded-full font-medium">Host</span>}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4">
                <AnimatePresence mode="wait">
                    {/* Pre-Join Screen */}
                    {!hasJoined && (
                        <motion.div
                            key="prejoin"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white rounded-3xl shadow-xl border border-[#850000]/10 p-8 max-w-md w-full text-center"
                        >
                            {/* Host Avatar */}
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#850000] to-[#6b0000] flex items-center justify-center mx-auto mb-6 shadow-lg">
                                <span className="text-white text-4xl font-bold">{host?.name?.charAt(0) || '?'}</span>
                            </div>

                            <h2 className="text-xl font-bold text-[#1d0c0c] mb-1">{eventType?.title || 'Meeting'}</h2>
                            <p className="text-[#6b4444] mb-6">with {host?.name || 'Host'}</p>

                            {/* Previous Calls Badge */}
                            {isHost && previousCalls.length > 0 && (
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm mb-6">
                                    <span className="material-symbols-outlined text-lg">history</span>
                                    {previousCalls.length} previous call{previousCalls.length > 1 ? 's' : ''} with {booking.guestName}
                                </div>
                            )}

                            {/* Call Info */}
                            <div className="flex justify-center gap-6 mb-8">
                                <div className="text-center">
                                    <span className="material-symbols-outlined text-[#850000] text-2xl mb-1">schedule</span>
                                    <p className="text-sm font-bold text-[#1d0c0c]">{eventType?.duration || 30} min</p>
                                </div>
                                <div className="text-center">
                                    <span className="material-symbols-outlined text-[#850000] text-2xl mb-1">calendar_today</span>
                                    <p className="text-sm font-bold text-[#1d0c0c]">
                                        {new Date(booking.slotTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <span className="material-symbols-outlined text-green-600 text-2xl mb-1">lock</span>
                                    <p className="text-sm font-bold text-[#1d0c0c]">Encrypted</p>
                                </div>
                            </div>

                            <button
                                onClick={handleJoin}
                                className="w-full py-4 bg-gradient-to-r from-[#850000] to-[#6b0000] text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-[#850000]/20 transition-all"
                            >
                                <span className="material-symbols-outlined text-2xl">call</span>
                                Join Call
                            </button>

                            <p className="text-xs text-[#6b4444] mt-4">Microphone access required</p>
                        </motion.div>
                    )}

                    {/* In Call Screen */}
                    {hasJoined && !callEnded && (
                        <div className="fixed inset-0 bg-[#1d0c0c] text-white flex z-50">
                            {/* Main Display (Remote Video) */}
                            {/* Main Display (Remote Audio) */}
                            <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">
                                <div className="text-center">
                                    <div className="w-32 h-32 rounded-full bg-[#850000] flex items-center justify-center mx-auto mb-4 text-4xl font-bold animate-pulse shadow-2xl border-4 border-[#850000]/30">
                                        {isHost ? booking.guestName.charAt(0) : host?.name?.charAt(0) || '?'}
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2">{isHost ? booking.guestName : host?.name}</h2>
                                    <p className="text-xl font-medium text-white/70">{callState === 'connected' ? 'Audio Connected' : 'Connecting...'}</p>
                                </div>

                                {/* Hidden Video Element for Audio Playback */}
                                {remoteStream && (
                                    <video
                                        ref={remoteVideoRef}
                                        autoPlay
                                        playsInline
                                        className="hidden"
                                    />
                                )}



                                {/* Call Controls (Floating Bottom) */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 z-50">
                                    <button
                                        onClick={toggleMute}
                                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white/10 hover:bg-white/20'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-2xl">{isMuted ? 'mic_off' : 'mic'}</span>
                                    </button>

                                    <button
                                        onClick={() => setShowChat(!showChat)}
                                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors relative ${showChat ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-2xl">chat</span>
                                        {messages.length > 0 && !showChat && (
                                            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#1d0c0c]" />
                                        )}
                                    </button>
                                    {isHost && (
                                        <button
                                            onClick={() => setShowNotes(!showNotes)}
                                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${showNotes ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-2xl">edit_note</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={handleEndCall}
                                        className="w-14 h-14 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 transition-colors ml-2"
                                    >
                                        <span className="material-symbols-outlined text-2xl">call_end</span>
                                    </button>
                                </div>
                            </div>

                            {/* Side Panel (Chat or Notes) */}
                            <AnimatePresence>
                                {(showChat || (showNotes && isHost)) && (
                                    <motion.div
                                        initial={{ x: '100%' }}
                                        animate={{ x: 0 }}
                                        exit={{ x: '100%' }}
                                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                                        className="absolute inset-y-0 right-0 w-full md:w-[360px] border-l border-white/10 bg-[#1d0c0c] z-[60] shadow-2xl flex flex-col"
                                    >
                                        {/* Header */}
                                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                            <h3 className="font-bold text-lg">
                                                {showChat ? 'Chat' : 'Notes'}
                                            </h3>
                                            <button
                                                onClick={() => { setShowChat(false); setShowNotes(false); }}
                                                className="text-white/40 hover:text-white transition-colors"
                                            >
                                                <span className="material-symbols-outlined">close</span>
                                            </button>
                                        </div>

                                        {/* Chat Content */}
                                        {showChat && (
                                            <>
                                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                                    {messages.map((msg) => (
                                                        <div
                                                            key={msg.id}
                                                            className={`flex flex-col ${msg.type === 'system' ? 'items-center' :
                                                                msg.senderId === (userProfile?.$id || guestId) ? 'items-end' : 'items-start'
                                                                }`}
                                                        >
                                                            {msg.type === 'system' ? (
                                                                <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full">
                                                                    {msg.content}
                                                                </span>
                                                            ) : (
                                                                <>
                                                                    <div className={`max-w-[85%] p-3 rounded-2xl ${msg.senderId === (userProfile?.$id || guestId)
                                                                        ? 'bg-[#850000] text-white rounded-tr-sm'
                                                                        : 'bg-white/10 text-white rounded-tl-sm'
                                                                        }`}>
                                                                        {msg.content}
                                                                    </div>
                                                                    <span className="text-[10px] text-white/40 mt-1 px-1">
                                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="p-4 border-t border-white/10">
                                                    <div className="flex items-center gap-2 bg-white/5 rounded-xl p-2 border border-white/10 focus-within:border-[#850000] transition-colors">
                                                        <input
                                                            type="text"
                                                            value={chatMessage}
                                                            onChange={(e) => setChatMessage(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    sendMessage(chatMessage);
                                                                    setChatMessage('');
                                                                }
                                                            }}
                                                            placeholder="Type a message..."
                                                            className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/40 text-sm px-2"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                sendMessage(chatMessage);
                                                                setChatMessage('');
                                                            }}
                                                            disabled={!chatMessage.trim()}
                                                            className="text-[#850000] disabled:text-gray-500 hover:text-[#6b0000] transition-colors p-2"
                                                        >
                                                            <span className="material-symbols-outlined text-xl">send</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {/* Notes Content */}
                                        {showNotes && isHost && (
                                            <div className="flex-1 overflow-y-auto p-4 text-black">
                                                <div className="bg-white rounded-xl p-4">
                                                    {/* Notes functionality adapted for side panel */}
                                                    <textarea
                                                        value={summary}
                                                        onChange={(e) => setSummary(e.target.value)}
                                                        onBlur={saveNotes}
                                                        placeholder="Quick summary..."
                                                        className="w-full p-3 bg-[#fcf8f8] border border-[#850000]/10 rounded-xl text-sm h-32 mb-4"
                                                    />
                                                    <div className="space-y-2">
                                                        {actionItems.map((item, index) => (
                                                            <div key={index} className="flex items-center gap-2 text-sm">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={item.completed}
                                                                    onChange={() => { toggleActionItem(index); saveNotes(); }}
                                                                    className="accent-[#850000]"
                                                                />
                                                                <span className={item.completed ? 'line-through text-gray-400' : ''}>{item.text}</span>
                                                            </div>
                                                        ))}
                                                        <div className="flex gap-2 mt-2">
                                                            <input
                                                                type="text"
                                                                value={newActionText}
                                                                onChange={(e) => setNewActionText(e.target.value)}
                                                                onKeyDown={(e) => { if (e.key === 'Enter') { addActionItem(); saveNotes(); } }}
                                                                placeholder="New item..."
                                                                className="flex-1 p-2 border rounded-lg text-sm"
                                                            />
                                                            <button onClick={() => { addActionItem(); saveNotes(); }} className="px-3 bg-[#850000]/10 text-[#850000] rounded-lg text-xs font-bold">Add</button>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 flex justify-between text-xs text-gray-500">
                                                        <span>{isSaving ? 'Saving...' : 'Auto-saved'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </AnimatePresence>
            </main>

            {/* Footer */}
            <footer className="text-center py-3 text-xs text-[#6b4444]">
                <span className="flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-green-600 text-sm">lock</span>
                    P2P Encrypted Audio • Book&Call
                </span>
            </footer>
        </div>
    );
}
