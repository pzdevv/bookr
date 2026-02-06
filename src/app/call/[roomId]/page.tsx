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
    const [brandColor, setBrandColor] = useState('#850000'); // Default maroon
    const [hostAvatar, setHostAvatar] = useState<string | null>(null);
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
    const chatFileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingFile, setIsUploadingFile] = useState(false);

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

                    // Set branding from host
                    if (foundHost) {
                        if (foundHost.brandColor) setBrandColor(foundHost.brandColor);
                        if (foundHost.avatar) setHostAvatar(foundHost.avatar);
                    }

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
            <div className="min-h-screen bg-gradient-to-br from-[#fcf8f8] via-white to-[#fcf8f8] flex items-center justify-center" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.03) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#850000] to-[#6b0000] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[#850000]/20"
                    >
                        <span className="material-symbols-outlined text-white text-4xl">call</span>
                    </motion.div>
                    <p className="text-[#6b4444] font-medium">Setting up your call...</p>
                </motion.div>
            </div>
        );
    }

    // Expired State
    if (isExpired) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#fcf8f8] via-white to-[#fcf8f8] flex items-center justify-center p-4" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.03) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 p-10 max-w-sm text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                        className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    >
                        <span className="material-symbols-outlined text-orange-500 text-4xl">schedule</span>
                    </motion.div>
                    <h1 className="text-2xl font-bold text-[#1d0c0c] mb-2">Call Expired</h1>
                    <p className="text-[#6b4444] mb-8">This call link is no longer active.</p>
                    <Link href="/" className="inline-flex items-center gap-2 px-8 py-4 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                        style={{ background: `linear-gradient(to right, ${brandColor}, ${brandColor})` }}>
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
            <div className="min-h-screen bg-gradient-to-br from-[#fcf8f8] via-white to-[#fcf8f8] flex items-center justify-center p-4" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.03) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 p-10 max-w-md text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                        className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    >
                        <motion.span
                            animate={{ rotate: [0, 180, 360] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                            className="material-symbols-outlined text-blue-500 text-4xl"
                        >
                            hourglass_top
                        </motion.span>
                    </motion.div>
                    <h1 className="text-2xl font-bold text-[#1d0c0c] mb-2">Too Early to Join</h1>
                    <p className="text-[#6b4444] mb-4">
                        Your call with <strong className="text-[#1d0c0c]">{host?.name || 'Host'}</strong> is scheduled for:
                    </p>
                    <div className="bg-gradient-to-br from-[#fcf8f8] to-white rounded-2xl p-5 mb-6 border border-[#850000]/5">
                        <p className="text-lg font-bold text-[#1d0c0c]">
                            {slotTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                        <p className="text-[#850000] font-semibold text-xl">
                            {slotTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </p>
                    </div>
                    <p className="text-[#6b4444] mb-6">
                        You can join <strong>15 minutes</strong> before your scheduled time.<br />
                        <span className="text-sm text-[#850000]">({minutesUntil} minutes remaining)</span>
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#850000] to-[#6b0000] text-white font-bold rounded-xl hover:shadow-xl hover:shadow-[#850000]/20 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
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
            <div className="min-h-screen bg-gradient-to-br from-[#fcf8f8] via-white to-[#fcf8f8] flex items-center justify-center p-4" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.03) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 p-10 max-w-sm text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                        className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    >
                        <span className="material-symbols-outlined text-red-500 text-4xl">error</span>
                    </motion.div>
                    <h1 className="text-2xl font-bold text-[#1d0c0c] mb-2">Call Not Found</h1>
                    <p className="text-[#6b4444] mb-8">This call link is invalid.</p>
                    <Link href="/" className="inline-flex items-center gap-2 px-8 py-4 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                        style={{ background: `linear-gradient(to right, ${brandColor}, ${brandColor})` }}>
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
            <div className="min-h-screen bg-gradient-to-br from-[#fcf8f8] via-white to-[#fcf8f8] flex items-center justify-center p-4" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.03) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 p-8 max-w-lg w-full"
                >
                    {/* Success Header */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                            className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        >
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.4 }}
                                className="material-symbols-outlined text-green-600 text-4xl"
                            >
                                check_circle
                            </motion.span>
                        </motion.div>
                        <h2 className="text-2xl font-bold text-[#1d0c0c]">Call Complete!</h2>
                        <p className="text-[#6b4444] mt-1 flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-lg">timer</span>
                            {formatCallDuration(callDuration)}
                        </p>
                    </div>

                    {/* Notes Section (Host Only) */}
                    {isHost && callNotesService.isConfigured() && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-gradient-to-br from-[#fcf8f8] to-white rounded-2xl p-5 mb-6 border border-[#850000]/5"
                        >
                            <h3 className="font-bold text-[#1d0c0c] mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-[#850000]/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[#850000] text-lg">edit_note</span>
                                </span>
                                Quick Notes
                            </h3>

                            <textarea
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                placeholder="What was this call about?"
                                className="w-full p-4 bg-white border border-[#850000]/10 rounded-xl text-sm resize-none focus:ring-2 focus:ring-[#850000]/20 transition-all mb-3"
                                rows={3}
                            />

                            <div className="flex gap-2">
                                <button
                                    onClick={saveNotes}
                                    disabled={isSaving}
                                    className="flex-1 py-3 bg-[#850000]/10 text-[#850000] rounded-xl font-medium text-sm hover:bg-[#850000]/20 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    {isSaving ? 'Saving...' : 'Save Notes'}
                                </button>
                                <button
                                    onClick={copySummary}
                                    className="py-3 px-4 bg-[#850000]/10 text-[#850000] rounded-xl font-medium text-sm hover:bg-[#850000]/20 transition-colors cursor-pointer"
                                    title="Copy to clipboard"
                                >
                                    <span className="material-symbols-outlined text-lg">content_copy</span>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Actions */}
                    {isHost ? (
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            onClick={handleClose}
                            className="w-full py-4 bg-gradient-to-r from-[#850000] to-[#6b0000] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-[#850000]/20 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
                        >
                            <span className="material-symbols-outlined">dashboard</span>
                            Back to Dashboard
                        </motion.button>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="space-y-3"
                        >
                            <div className="bg-gradient-to-r from-[#850000]/5 to-[#850000]/10 rounded-2xl p-5 text-center">
                                <p className="font-bold text-[#1d0c0c] mb-1">Enjoyed this call?</p>
                                <p className="text-sm text-[#6b4444]">Create your own free booking page!</p>
                            </div>
                            <Link
                                href="/auth/signup"
                                className="w-full py-4 bg-gradient-to-r from-[#850000] to-[#6b0000] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-[#850000]/20 transition-all duration-300 hover:-translate-y-0.5"
                            >
                                <span className="material-symbols-outlined">rocket_launch</span>
                                Get Started Free
                            </Link>
                            <button
                                onClick={handleClose}
                                className="w-full py-3 text-[#6b4444] font-medium hover:text-[#1d0c0c] transition-colors cursor-pointer"
                            >
                                Maybe Later
                            </button>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#fcf8f8] via-white to-[#fcf8f8] flex flex-col" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.03) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-xl border-b border-[#850000]/5">
                <Logo size="sm" />
                <div className="flex items-center gap-3">
                    {callState === 'connected' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full"
                        >
                            <motion.span
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="w-2.5 h-2.5 bg-green-500 rounded-full"
                            />
                            <span className="text-green-700 font-mono text-sm font-bold">{formatCallDuration(callDuration)}</span>
                        </motion.div>
                    )}
                    {isHost && (
                        <span className="text-xs bg-gradient-to-r from-[#850000] to-[#6b0000] text-white px-3 py-1.5 rounded-full font-medium">
                            Host
                        </span>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4">
                <AnimatePresence mode="wait">
                    {/* Pre-Join Screen */}
                    {!hasJoined && (
                        <motion.div
                            key="prejoin"
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            className="relative bg-white/60 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-[#850000]/10 p-8 max-w-md w-full text-center overflow-hidden border border-white/40"
                        >
                            {/* Soft decorative blur */}
                            <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-br from-[#850000]/10 via-transparent to-[#850000]/5 blur-sm pointer-events-none" />

                            {/* Host Avatar */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.2 }}
                                className="relative w-28 h-28 mx-auto mb-6"
                            >
                                <div className="absolute inset-0 rounded-2xl animate-pulse opacity-30 blur-lg" style={{ background: `linear-gradient(to bottom right, ${brandColor}, ${brandColor})` }} />
                                <div className="relative w-28 h-28 rounded-2xl flex items-center justify-center shadow-xl overflow-hidden"
                                    style={{ background: `linear-gradient(to bottom right, ${brandColor}, ${brandColor})`, boxShadow: `0 20px 25px -5px ${brandColor}40` }}>
                                    {hostAvatar ? (
                                        <img src={hostAvatar} alt={host?.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-white text-5xl font-bold">{host?.name?.charAt(0) || '?'}</span>
                                    )}
                                </div>
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-4 border-white"
                                >
                                    <span className="w-2 h-2 bg-white rounded-full" />
                                </motion.div>
                            </motion.div>

                            <h2 className="text-2xl font-bold text-[#1d0c0c] mb-1">{eventType?.title || 'Meeting'}</h2>
                            <p className="text-[#6b4444] mb-6">with <span className="text-[#1d0c0c] font-medium">{host?.name || 'Host'}</span></p>

                            {/* Previous Calls Badge */}
                            {isHost && previousCalls.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm mb-6"
                                >
                                    <span className="material-symbols-outlined text-lg">history</span>
                                    {previousCalls.length} previous call{previousCalls.length > 1 ? 's' : ''} with {booking.guestName}
                                </motion.div>
                            )}

                            {/* Call Info */}
                            <div className="flex justify-center gap-6 mb-8">
                                {[
                                    { icon: 'schedule', label: `${eventType?.duration || 30} min`, color: `text-[${brandColor}]` },
                                    { icon: 'calendar_today', label: new Date(booking.slotTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: `text-[${brandColor}]` },
                                    { icon: 'lock', label: 'Encrypted', color: 'text-green-600' },
                                ].map((item, i) => (
                                    <motion.div
                                        key={item.icon}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 + i * 0.1 }}
                                        className="text-center"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-[#fcf8f8] flex items-center justify-center mx-auto mb-2">
                                            <span className={`material-symbols-outlined ${item.color} text-xl`}>{item.icon}</span>
                                        </div>
                                        <p className="text-xs font-semibold text-[#1d0c0c]">{item.label}</p>
                                    </motion.div>
                                ))}
                            </div>

                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleJoin}
                                className="relative w-full py-4 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl overflow-hidden cursor-pointer group"
                                style={{ background: `linear-gradient(to right, ${brandColor}, ${brandColor})`, boxShadow: `0 20px 25px -5px ${brandColor}40` }}
                            >
                                {/* Shine effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                <span className="material-symbols-outlined text-2xl">call</span>
                                Join Call
                            </motion.button>

                            <p className="text-xs text-[#6b4444] mt-4 flex items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-sm">mic</span>
                                Microphone access required
                            </p>
                        </motion.div>
                    )}

                    {/* In Call Screen */}
                    {hasJoined && !callEnded && (
                        <div className="fixed inset-0 bg-gradient-to-b from-[#fcf8f8] to-[#f5f0f0] text-[#1d0c0c] flex z-50">
                            {/* Main Display */}
                            <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">
                                {/* Animated Background */}
                                <div className="absolute inset-0 opacity-20">
                                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#850000]/20 rounded-full blur-3xl animate-pulse" />
                                    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#850000]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                                </div>

                                <div className="text-center relative z-10">
                                    {/* Avatar with animated ring */}
                                    <div className="relative w-36 h-36 mx-auto mb-6">
                                        <motion.div
                                            animate={{ scale: [1, 1.05, 1] }}
                                            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                                            className="absolute inset-0 rounded-full bg-[#850000]/30 blur-md"
                                        />
                                        <div className="relative w-36 h-36 rounded-full flex items-center justify-center text-5xl font-bold shadow-2xl border-4"
                                            style={{ backgroundColor: brandColor, borderColor: `${brandColor}50`, boxShadow: `0 25px 50px -12px ${brandColor}60` }}>
                                            {hostAvatar && !isHost ? (
                                                <img src={hostAvatar} alt={host?.name} className="w-full h-full object-cover rounded-full" />
                                            ) : (
                                                <span className="text-white">{isHost ? booking.guestName.charAt(0) : host?.name?.charAt(0) || '?'}</span>
                                            )}
                                        </div>
                                        {callState === 'connected' && (
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                                                transition={{ repeat: Infinity, duration: 1.5 }}
                                                className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-[#fcf8f8]"
                                            />
                                        )}
                                    </div>
                                    <h2 className="text-3xl font-bold mb-2 text-[#1d0c0c]">{isHost ? booking.guestName : host?.name}</h2>
                                    <p className="text-xl font-medium text-[#6b4444]">
                                        {callState === 'connected' ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                                Audio Connected
                                            </span>
                                        ) : 'Connecting...'}
                                    </p>
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
                                <motion.div
                                    initial={{ y: 100, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-4 bg-white/80 backdrop-blur-2xl rounded-2xl border border-[#850000]/10 shadow-xl z-50"
                                >
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={toggleMute}
                                        className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all cursor-pointer ${isMuted ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#850000]/10 text-[#850000] hover:bg-[#850000]/20'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-2xl">{isMuted ? 'mic_off' : 'mic'}</span>
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setShowChat(!showChat)}
                                        className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all relative cursor-pointer ${showChat ? 'bg-[#850000] text-white' : 'bg-[#850000]/10 text-[#850000] hover:bg-[#850000]/20'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-2xl">chat</span>
                                        {messages.length > 0 && !showChat && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
                                            />
                                        )}
                                    </motion.button>

                                    {isHost && (
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setShowNotes(!showNotes)}
                                            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all cursor-pointer ${showNotes ? 'bg-[#850000] text-white' : 'bg-[#850000]/10 text-[#850000] hover:bg-[#850000]/20'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-2xl">edit_note</span>
                                        </motion.button>
                                    )}

                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleEndCall}
                                        className="w-14 h-14 rounded-xl flex items-center justify-center bg-red-600 hover:bg-red-700 transition-colors ml-2 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-2xl">call_end</span>
                                    </motion.button>
                                </motion.div>
                            </div>

                            {/* Side Panel (Chat or Notes) */}
                            <AnimatePresence>
                                {(showChat || (showNotes && isHost)) && (
                                    <motion.div
                                        initial={{ x: '100%' }}
                                        animate={{ x: 0 }}
                                        exit={{ x: '100%' }}
                                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                                        className="fixed inset-y-0 right-0 w-full md:w-[400px] border-l border-[#850000]/10 bg-white z-[100] shadow-2xl flex flex-col"
                                    >

                                        {/* Header */}
                                        <div className="p-5 border-b border-[#850000]/10 flex items-center justify-between">
                                            <h3 className="font-bold text-xl flex items-center gap-2 text-[#1d0c0c]">
                                                <span className="w-8 h-8 rounded-lg bg-[#850000]/10 flex items-center justify-center text-[#850000]">
                                                    <span className="material-symbols-outlined text-lg">{showChat ? 'chat' : 'edit_note'}</span>
                                                </span>
                                                {showChat ? 'Chat' : 'Notes'}
                                            </h3>
                                            <button
                                                onClick={() => { setShowChat(false); setShowNotes(false); }}
                                                className="w-8 h-8 rounded-lg bg-[#850000]/5 flex items-center justify-center text-[#6b4444] hover:text-[#850000] hover:bg-[#850000]/10 transition-colors cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined">close</span>
                                            </button>
                                        </div>

                                        {/* Chat Content */}
                                        {showChat && (
                                            <>
                                                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#fcf8f8]">
                                                    {messages.map((msg) => (
                                                        <motion.div
                                                            key={msg.id}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className={`flex flex-col ${msg.type === 'system' ? 'items-center' :
                                                                msg.senderId === (userProfile?.$id || guestId) ? 'items-end' : 'items-start'
                                                                }`}
                                                        >
                                                            {msg.type === 'system' ? (
                                                                <span className="text-xs text-[#6b4444] bg-[#850000]/5 px-3 py-1.5 rounded-full">
                                                                    {msg.content}
                                                                </span>
                                                            ) : (
                                                                <>
                                                                    <div className={`max-w-[85%] p-4 rounded-2xl ${msg.senderId === (userProfile?.$id || guestId)
                                                                        ? 'bg-gradient-to-r from-[#850000] to-[#6b0000] text-white rounded-br-sm'
                                                                        : 'bg-white text-[#1d0c0c] border border-[#850000]/10 rounded-bl-sm shadow-sm'
                                                                        }`}>
                                                                        {msg.content}
                                                                    </div>
                                                                    <span className="text-[10px] text-[#6b4444] mt-1.5 px-1">
                                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </motion.div>
                                                    ))}
                                                </div>
                                                <div className="p-5 border-t border-[#850000]/10 bg-white">
                                                    {/* Hidden file input */}
                                                    <input
                                                        ref={chatFileInputRef}
                                                        type="file"
                                                        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                                                        className="hidden"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file || !booking) return;

                                                            setIsUploadingFile(true);
                                                            try {
                                                                const doc = await callDocumentsService.upload(
                                                                    file,
                                                                    roomId,
                                                                    booking.userId,
                                                                    booking.guestEmail,
                                                                    isHost ? 'host' : 'guests'
                                                                );
                                                                // Add to documents list
                                                                setDocuments(prev => [doc, ...prev]);
                                                                // Send file message to chat
                                                                sendMessage(`📎 Shared file: ${file.name}`);
                                                            } catch (err: unknown) {
                                                                const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
                                                                sendMessage(`⚠️ ${errorMessage}`);
                                                            } finally {
                                                                setIsUploadingFile(false);
                                                                if (chatFileInputRef.current) {
                                                                    chatFileInputRef.current.value = '';
                                                                }
                                                            }
                                                        }}
                                                    />
                                                    <div className="flex items-center gap-2 bg-[#fcf8f8] rounded-xl p-3 border border-[#850000]/10 focus-within:border-[#850000]/30 transition-colors">
                                                        <button
                                                            onClick={() => chatFileInputRef.current?.click()}
                                                            disabled={isUploadingFile || !callDocumentsService.isConfigured()}
                                                            className="p-2 text-[#6b4444] hover:text-[#850000] hover:bg-[#850000]/10 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title={callDocumentsService.isConfigured() ? 'Attach file (PDF, DOC, TXT, XLS - max 500KB)' : 'File sharing not configured'}
                                                        >
                                                            {isUploadingFile ? (
                                                                <div className="w-5 h-5 border-2 border-[#850000]/30 border-t-[#850000] rounded-full animate-spin" />
                                                            ) : (
                                                                <span className="material-symbols-outlined text-xl">attach_file</span>
                                                            )}
                                                        </button>
                                                        <input
                                                            type="text"
                                                            value={chatMessage}
                                                            onChange={(e) => setChatMessage(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && chatMessage.trim()) {
                                                                    sendMessage(chatMessage);
                                                                    setChatMessage('');
                                                                }
                                                            }}
                                                            placeholder="Type a message..."
                                                            className="flex-1 bg-transparent border-none outline-none text-[#1d0c0c] placeholder-[#6b4444]/60 text-sm"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                if (chatMessage.trim()) {
                                                                    sendMessage(chatMessage);
                                                                    setChatMessage('');
                                                                }
                                                            }}
                                                            disabled={!chatMessage.trim()}
                                                            className="p-2 text-[#850000] disabled:text-[#6b4444]/30 hover:bg-[#850000]/10 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <span className="material-symbols-outlined text-xl">send</span>
                                                        </button>
                                                    </div>
                                                    {/* File type hint */}
                                                    {callDocumentsService.isConfigured() && (
                                                        <p className="text-[10px] text-[#6b4444]/60 mt-2 text-center">
                                                            PDF, DOC, TXT, XLS • Max 500KB
                                                        </p>
                                                    )}
                                                </div>
                                            </>
                                        )}

                                        {/* Notes Content */}
                                        {showNotes && isHost && (
                                            <div className="flex-1 overflow-y-auto p-5 text-black bg-[#fcf8f8]">
                                                <div className="bg-white rounded-lg p-5 border border-[#850000]/10 shadow-sm">
                                                    <textarea
                                                        value={summary}
                                                        onChange={(e) => setSummary(e.target.value)}
                                                        onBlur={saveNotes}
                                                        placeholder="Quick summary..."
                                                        className="w-full p-4 bg-[#fcf8f8] border border-[#850000]/10 rounded-xl text-sm h-32 mb-4 focus:ring-2 focus:ring-[#850000]/20 resize-none"
                                                    />
                                                    <div className="space-y-2">
                                                        {actionItems.map((item, index) => (
                                                            <motion.div
                                                                key={index}
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-[#fcf8f8] transition-colors"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={item.completed}
                                                                    onChange={() => { toggleActionItem(index); saveNotes(); }}
                                                                    className="w-4 h-4 accent-[#850000] cursor-pointer"
                                                                />
                                                                <span className={item.completed ? 'line-through text-gray-400' : ''}>{item.text}</span>
                                                            </motion.div>
                                                        ))}
                                                        <div className="flex gap-2 mt-3">
                                                            <input
                                                                type="text"
                                                                value={newActionText}
                                                                onChange={(e) => setNewActionText(e.target.value)}
                                                                onKeyDown={(e) => { if (e.key === 'Enter') { addActionItem(); saveNotes(); } }}
                                                                placeholder="New action item..."
                                                                className="flex-1 p-3 border border-[#850000]/10 rounded-xl text-sm focus:ring-2 focus:ring-[#850000]/20"
                                                            />
                                                            <button
                                                                onClick={() => { addActionItem(); saveNotes(); }}
                                                                className="px-4 bg-[#850000]/10 text-[#850000] rounded-xl text-sm font-bold hover:bg-[#850000]/20 transition-colors cursor-pointer"
                                                            >
                                                                Add
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            {isSaving ? (
                                                                <>
                                                                    <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                                                                    Saving...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                                                                    Auto-saved
                                                                </>
                                                            )}
                                                        </span>
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
            <footer className="text-center py-4 text-xs text-[#6b4444]">
                <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-green-600 text-sm">lock</span>
                    P2P Encrypted Audio • Book&Call
                </span>
            </footer>
        </div >
    );
}
