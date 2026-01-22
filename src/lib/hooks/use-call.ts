'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { MediaConnection, DataConnection } from 'peerjs';
import { bookingService, Booking } from '../appwrite/database';
import { client, appwriteConfig } from '../appwrite/config';

export type CallState = 'idle' | 'connecting' | 'waiting' | 'connected' | 'ended' | 'error';
export type CallMode = 'audio' | 'video';

export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: number;
    type: 'text' | 'system';
}

interface UseCallOptions {
    roomId: string;
    bookingId?: string;
    userName: string;
    userId: string;
    mode?: CallMode;
    onCallEnded?: () => void;
}

interface UseCallReturn {
    callState: CallState;
    callMode: CallMode;
    isMuted: boolean;
    isVideoOff: boolean;
    callDuration: number;
    error: string | null;
    remotePeerId: string | null;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    messages: ChatMessage[];
    startCall: () => Promise<void>;
    endCall: () => void;
    toggleMute: () => void;
    toggleVideo: () => void;
    switchMode: (mode: CallMode) => Promise<void>;
    sendMessage: (content: string) => void;
}

export function useCall({ roomId, bookingId, userName, userId, isHost, mode = 'video', onCallEnded }: UseCallOptions & { isHost: boolean }): UseCallReturn {
    const [callState, setCallState] = useState<CallState>('idle');
    const [callMode, setCallMode] = useState<CallMode>(mode);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [remotePeerId, setRemotePeerId] = useState<string | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    const peerRef = useRef<Peer | null>(null);
    const callRef = useRef<MediaConnection | null>(null);
    const dataConnRef = useRef<DataConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const callStartTime = useRef<number | null>(null);
    const wasConnectedRef = useRef(false);
    const onCallEndedRef = useRef(onCallEnded);
    const userInfoRef = useRef({ odName: userName, userId });

    // Keep refs updated
    useEffect(() => {
        onCallEndedRef.current = onCallEnded;
        userInfoRef.current = { odName: userName, userId };
    }, [onCallEnded, userName, userId]);

    // Timer functions
    const startTimer = useCallback(() => {
        callStartTime.current = Date.now();
        timerRef.current = setInterval(() => {
            if (callStartTime.current) {
                setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
            }
        }, 1000);
    }, []);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    // End call
    const endCall = useCallback(() => {
        const wasActuallyConnected = wasConnectedRef.current;

        if (dataConnRef.current) {
            dataConnRef.current.close();
            dataConnRef.current = null;
        }

        if (callRef.current) {
            callRef.current.close();
            callRef.current = null;
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }

        stopTimer();
        setCallState('ended');
        setRemotePeerId(null);
        setLocalStream(null);
        setRemoteStream(null);

        if (wasActuallyConnected) {
            wasConnectedRef.current = false;
            onCallEndedRef.current?.();
        }
    }, [stopTimer]);

    // Handle data connection for chat
    const setupDataConnection = useCallback((conn: DataConnection) => {
        dataConnRef.current = conn;

        conn.on('open', () => {
            console.log('Data channel open');
            // Send system message
            const systemMsg: ChatMessage = {
                id: `sys-${Date.now()}`,
                senderId: 'system',
                senderName: 'System',
                content: 'Chat connected (End-to-End Encrypted)',
                timestamp: Date.now(),
                type: 'system',
            };
            setMessages(prev => [...prev, systemMsg]);
        });

        conn.on('data', (data: unknown) => {
            const msg = data as ChatMessage;
            if (msg && msg.content) {
                setMessages(prev => [...prev, msg]);
            }
        });

        conn.on('close', () => {
            console.log('Data channel closed');
        });
    }, []);

    // Handle incoming media call
    const handleIncomingCall = useCallback((call: MediaConnection) => {
        callRef.current = call;
        setRemotePeerId(call.peer);

        call.on('stream', (stream) => {
            console.log('Received remote stream');
            setRemoteStream(stream);
            wasConnectedRef.current = true;
            setCallState('connected');
            startTimer();
        });

        call.on('close', () => {
            console.log('Call closed');
            endCall();
        });

        call.on('error', (err) => {
            console.error('Call error:', err);
            setError('Call connection failed');
            setCallState('error');
        });

        if (localStreamRef.current) {
            call.answer(localStreamRef.current);
        }
    }, [startTimer, endCall]);

    // Send chat message
    const sendMessage = useCallback((content: string) => {
        if (!dataConnRef.current || !content.trim()) return;

        const msg: ChatMessage = {
            id: `${userId}-${Date.now()}`,
            senderId: userId,
            senderName: userName,
            content: content.trim(),
            timestamp: Date.now(),
            type: 'text',
        };

        dataConnRef.current.send(msg);
        setMessages(prev => [...prev, msg]);
    }, [userId, userName]);

    // Start call
    const startCall = useCallback(async () => {
        try {
            if (!window.isSecureContext) {
                const msg = 'Camera access requires a secure context (HTTPS or localhost)';
                console.error(msg);
                setError(msg);
                setCallState('error');
                return;
            }
            setCallState('connecting');
            setError(null);
            setMessages([]);

            // Get media stream
            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: callMode === 'video' ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user',
                } : false,
            };

            // Retry logic for media stream
            let stream: MediaStream;
            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (err) {
                console.warn('High-quality constraints failed, retrying with basic config:', err);
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        audio: true,
                        video: callMode === 'video'
                    });
                } catch (retryErr) {
                    // Propagate the original error or the retry error
                    throw retryErr;
                }
            }

            localStreamRef.current = stream;
            setLocalStream(stream);

            // Use random ID for everyone to prevent "unavailable-id" errors
            // We rely on Database Signaling to exchange IDs
            const peer = new Peer({ debug: 0, secure: true });

            peerRef.current = peer;

            peer.on('error', (err) => {
                console.error('Peer error:', err);
                setError(err.message || 'Connection failed');
                setCallState('error');
            });

            peer.on('open', async (id) => {
                console.log('My Peer ID initialized:', id);

                if (isHost) {
                    console.log('As HOST, updating booking with Peer ID...');
                    setCallState('waiting');
                    if (bookingId) {
                        try {
                            await bookingService.updateHostPeerId(bookingId, id);
                        } catch (e) {
                            console.error('Failed to update host ID:', e);
                            setError('Signal error');
                        }
                    }
                } else {
                    console.log('As GUEST, looking for Host Peer ID...');

                    const connectToHost = (hostId: string) => {
                        console.log('Connecting to Host:', hostId);
                        if (localStreamRef.current) {
                            const call = peer.call(hostId, localStreamRef.current);
                            callRef.current = call;

                            call.on('stream', (remoteStr) => {
                                console.log('Guest received remote stream');
                                setRemoteStream(remoteStr);
                                wasConnectedRef.current = true;
                                setCallState('connected');
                                startTimer();
                            });

                            call.on('close', () => endCall());
                            call.on('error', (e) => console.error('Call error:', e));
                        }

                        const dataConn = peer.connect(hostId, { reliable: true });
                        setupDataConnection(dataConn);
                    };

                    if (bookingId) {
                        // Check if host is already waiting
                        const booking = await bookingService.get(bookingId);
                        if (booking?.hostPeerId) {
                            connectToHost(booking.hostPeerId);
                        } else {
                            console.log('Host not ready, subscribing to updates...');
                            setCallState('waiting'); // Waiting for host
                            const unsubscribe = client.subscribe(
                                `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.collections.bookings}.documents.${bookingId}`,
                                (response) => {
                                    const payload = response.payload as Booking;
                                    if (payload.hostPeerId) {
                                        console.log('Host came online:', payload.hostPeerId);
                                        connectToHost(payload.hostPeerId);
                                        // unsubscribe(); // Kept active for now
                                    }
                                }
                            );
                        }
                    }
                }
            });

            // Host handles incoming
            if (isHost) {
                peer.on('call', handleIncomingCall);
                peer.on('connection', setupDataConnection);
            }

        } catch (err: any) {
            console.error('Failed to start call:', err);
            if (err.name === 'NotAllowedError') {
                setError('Camera/Microphone access denied. Please allow access.');
            } else if (err.name === 'NotFoundError') {
                setError('No camera/microphone found.');
            } else {
                setError(err.message || 'Failed to start call');
            }
            setCallState('error');
        }
    }, [roomId, bookingId, callMode, isHost, handleIncomingCall, setupDataConnection, startTimer, endCall]);

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    }, []);

    // Toggle video
    const toggleVideo = useCallback(() => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    }, []);

    // Switch mode (requires reconnection for proper handling)
    const switchMode = useCallback(async (newMode: CallMode) => {
        setCallMode(newMode);
        // For simplicity, switching mid-call would require renegotiation
        // This is a placeholder for now
    }, []);

    // Cleanup
    useEffect(() => {
        return () => {
            if (dataConnRef.current) dataConnRef.current.close();
            if (callRef.current) callRef.current.close();
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(t => t.stop());
            }
            if (peerRef.current) peerRef.current.destroy();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    return {
        callState,
        callMode,
        isMuted,
        isVideoOff,
        callDuration,
        error,
        remotePeerId,
        localStream,
        remoteStream,
        messages,
        startCall,
        endCall,
        toggleMute,
        toggleVideo,
        switchMode,
        sendMessage,
    };
}

// Format duration
export function formatCallDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
