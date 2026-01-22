'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { MediaConnection, DataConnection } from 'peerjs';

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

export function useCall({ roomId, userName, userId, mode = 'video', onCallEnded }: UseCallOptions): UseCallReturn {
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

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            localStreamRef.current = stream;
            setLocalStream(stream);

            const peerId = `${roomId}-${Date.now().toString(36)}`;
            const hostPeerId = `${roomId}-host`;

            // Try to be host
            const peer = new Peer(hostPeerId, {
                debug: 0,
                secure: true,
            });

            peerRef.current = peer;

            peer.on('error', async (err) => {
                if (err.type === 'unavailable-id') {
                    // We are guest
                    peer.destroy();

                    const guestPeer = new Peer(peerId, { debug: 0, secure: true });
                    peerRef.current = guestPeer;

                    guestPeer.on('open', () => {
                        // Connect media
                        if (localStreamRef.current) {
                            const call = guestPeer.call(hostPeerId, localStreamRef.current);
                            callRef.current = call;

                            call.on('stream', (remoteStr) => {
                                console.log('Guest received remote stream');
                                setRemoteStream(remoteStr);
                                wasConnectedRef.current = true;
                                setCallState('connected');
                                startTimer();
                            });

                            call.on('close', () => endCall());
                            call.on('error', (e) => {
                                console.error('Call error:', e);
                                setError('Failed to connect');
                                setCallState('error');
                            });
                        }

                        // Connect data channel
                        const dataConn = guestPeer.connect(hostPeerId, { reliable: true });
                        setupDataConnection(dataConn);
                    });

                    guestPeer.on('error', (e) => {
                        console.error('Guest peer error:', e);
                        setError('Connection failed');
                        setCallState('error');
                    });
                } else {
                    console.error('Peer error:', err);
                    setError(err.message || 'Connection failed');
                    setCallState('error');
                }
            });

            peer.on('open', () => {
                setCallState('waiting');
            });

            peer.on('call', handleIncomingCall);
            peer.on('connection', setupDataConnection);

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
    }, [roomId, callMode, handleIncomingCall, setupDataConnection, startTimer, endCall]);

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
