'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioCall, formatCallDuration } from '@/lib/hooks/use-audio-call';
import { useAuth } from '@/lib/hooks/use-auth';
import { bookingService, userService, eventTypeService, markCallStarted, markCallEnded, isCallExpired, callNotesService, callDocumentsService, Booking, User, EventType, CallNotes, CallDocument, ActionItem } from '@/lib/appwrite/database';
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
    const [userName, setUserName] = useState('');
    const [hasJoined, setHasJoined] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [speakerMode, setSpeakerMode] = useState(true); // true = speaker, false = earpiece
    const [showNotes, setShowNotes] = useState(false);
    const [callEnded, setCallEnded] = useState(false);

    // Notes state
    const [notes, setNotes] = useState<CallNotes | null>(null);
    const [documents, setDocuments] = useState<CallDocument[]>([]);
    const [summary, setSummary] = useState('');
    const [decisions, setDecisions] = useState('');
    const [actionItems, setActionItems] = useState<ActionItem[]>([]);
    const [newActionText, setNewActionText] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const hasMarkedStarted = useRef(false);
    const hasMarkedEnded = useRef(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

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
            setCallEnded(true);
        },
    });

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
                    const notesData = await callNotesService.getOrCreate(roomId, booking.userId, booking.guestEmail);
                    setNotes(notesData);
                    setSummary(notesData.summary || '');
                    setDecisions(notesData.decisions || '');
                    setActionItems(notesData.actionItems ? JSON.parse(notesData.actionItems) : []);
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

    const toggleSpeakerMode = () => {
        setSpeakerMode(!speakerMode);
        // Note: Actual speaker/earpiece switching requires native app capabilities
        // This is a visual toggle for web - actual audio routing is browser-controlled
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
                        <motion.div
                            key="incall"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md"
                        >
                            {/* Call Card */}
                            <div className="bg-white rounded-3xl shadow-xl border border-[#850000]/10 p-8 text-center">
                                {/* Avatar with Status Ring */}
                                <motion.div
                                    className={`w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center ${callState === 'connected'
                                        ? 'bg-gradient-to-br from-green-400 to-green-500 ring-4 ring-green-200'
                                        : 'bg-gradient-to-br from-[#850000] to-[#6b0000]'
                                        }`}
                                    animate={callState === 'waiting' ? { scale: [1, 1.05, 1] } : {}}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                >
                                    <span className="text-white text-5xl font-bold">
                                        {isHost ? booking.guestName.charAt(0) : host?.name?.charAt(0) || '?'}
                                    </span>
                                </motion.div>

                                <h2 className="text-xl font-bold text-[#1d0c0c] mb-1">
                                    {isHost ? booking.guestName : host?.name || 'Host'}
                                </h2>

                                <p className={`text-sm font-medium mb-8 ${callState === 'connected' ? 'text-green-600' :
                                    callState === 'waiting' ? 'text-[#850000]' :
                                        callState === 'error' ? 'text-red-600' : 'text-[#6b4444]'
                                    }`}>
                                    {callState === 'connecting' && 'Connecting...'}
                                    {callState === 'waiting' && 'Waiting for others...'}
                                    {callState === 'connected' && 'Connected'}
                                    {callState === 'error' && 'Connection failed'}
                                </p>

                                {/* Error Message */}
                                {error && (
                                    <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Call Duration */}
                                {callState === 'connected' && (
                                    <div className="text-5xl font-mono font-bold text-[#1d0c0c] mb-8">
                                        {formatCallDuration(callDuration)}
                                    </div>
                                )}

                                {/* Controls */}
                                <div className="flex items-center justify-center gap-4">
                                    {/* Mute Button */}
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={toggleMute}
                                        className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${isMuted
                                            ? 'bg-red-100 text-red-600'
                                            : 'bg-[#850000]/10 text-[#850000] hover:bg-[#850000]/20'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-2xl">
                                            {isMuted ? 'mic_off' : 'mic'}
                                        </span>
                                    </motion.button>

                                    {/* End Call Button */}
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={handleEndCall}
                                        className="w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 hover:bg-red-600 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-3xl">call_end</span>
                                    </motion.button>

                                    {/* Speaker/Earpiece Toggle */}
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={toggleSpeakerMode}
                                        className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${speakerMode
                                            ? 'bg-[#850000] text-white'
                                            : 'bg-[#850000]/10 text-[#850000] hover:bg-[#850000]/20'
                                            }`}
                                        title={speakerMode ? 'Speaker On' : 'Earpiece Mode'}
                                    >
                                        <span className="material-symbols-outlined text-2xl">
                                            {speakerMode ? 'volume_up' : 'phone_in_talk'}
                                        </span>
                                    </motion.button>
                                </div>

                                {/* Notes Toggle (Host Only) */}
                                {isHost && callNotesService.isConfigured() && (
                                    <button
                                        onClick={() => setShowNotes(!showNotes)}
                                        className="mt-6 text-sm text-[#6b4444] hover:text-[#850000] transition-colors flex items-center gap-1 mx-auto"
                                    >
                                        <span className="material-symbols-outlined text-lg">edit_note</span>
                                        {showNotes ? 'Hide Notes' : 'Take Notes'}
                                    </button>
                                )}

                                {/* Retry Button on Error */}
                                {callState === 'error' && (
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="mt-6 px-6 py-2 bg-[#850000] text-white rounded-xl font-medium"
                                    >
                                        Retry
                                    </button>
                                )}
                            </div>

                            {/* Notes Panel */}
                            <AnimatePresence>
                                {showNotes && isHost && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-white rounded-3xl shadow-xl border border-[#850000]/10 p-6 mt-4"
                                    >
                                        <h3 className="font-bold text-[#1d0c0c] mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[#850000]">edit_note</span>
                                            Call Notes
                                            {isSaving && <span className="text-xs text-[#6b4444] ml-auto">Saving...</span>}
                                        </h3>

                                        {/* Summary */}
                                        <div className="mb-4">
                                            <label className="text-xs font-bold text-[#6b4444] uppercase tracking-wide">Summary</label>
                                            <textarea
                                                value={summary}
                                                onChange={(e) => setSummary(e.target.value)}
                                                onBlur={saveNotes}
                                                placeholder="Key points discussed..."
                                                className="w-full mt-1 p-3 bg-[#fcf8f8] border border-[#850000]/10 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#850000]/20"
                                                rows={2}
                                            />
                                        </div>

                                        {/* Action Items */}
                                        <div>
                                            <label className="text-xs font-bold text-[#6b4444] uppercase tracking-wide">Action Items</label>
                                            <div className="mt-2 space-y-2">
                                                {actionItems.map((item, index) => (
                                                    <div key={index} className="flex items-center gap-2 p-2 bg-[#fcf8f8] rounded-lg">
                                                        <button
                                                            onClick={() => { toggleActionItem(index); saveNotes(); }}
                                                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${item.completed ? 'bg-green-500 border-green-500 text-white' : 'border-[#850000]/30'
                                                                }`}
                                                        >
                                                            {item.completed && <span className="material-symbols-outlined text-xs">check</span>}
                                                        </button>
                                                        <span className={`text-sm flex-1 ${item.completed ? 'line-through text-[#6b4444]' : 'text-[#1d0c0c]'}`}>
                                                            {item.text}
                                                        </span>
                                                    </div>
                                                ))}
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={newActionText}
                                                        onChange={(e) => setNewActionText(e.target.value)}
                                                        onKeyDown={(e) => { if (e.key === 'Enter') { addActionItem(); saveNotes(); } }}
                                                        placeholder="Add action item..."
                                                        className="flex-1 p-2 bg-white border border-[#850000]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#850000]/20"
                                                    />
                                                    <button
                                                        onClick={() => { addActionItem(); saveNotes(); }}
                                                        className="px-3 py-2 bg-[#850000] text-white rounded-lg text-sm font-medium"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
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
