'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { MediaConnection } from 'peerjs';

export type CallState = 'idle' | 'connecting' | 'waiting' | 'connected' | 'ended' | 'error';

interface UseAudioCallOptions {
    roomId: string;
    userName: string;
    onCallEnded?: () => void;
}

interface UseAudioCallReturn {
    callState: CallState;
    isMuted: boolean;
    callDuration: number;
    error: string | null;
    remotePeerId: string | null;
    startCall: () => Promise<void>;
    endCall: () => void;
    toggleMute: () => void;
}

export function useAudioCall({ roomId, userName, onCallEnded }: UseAudioCallOptions): UseAudioCallReturn {
    const [callState, setCallState] = useState<CallState>('idle');
    const [isMuted, setIsMuted] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [remotePeerId, setRemotePeerId] = useState<string | null>(null);

    const peerRef = useRef<Peer | null>(null);
    const callRef = useRef<MediaConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const callStartTime = useRef<number | null>(null);
    const wasConnectedRef = useRef(false);
    const onCallEndedRef = useRef(onCallEnded);

    // Keep callback ref updated
    useEffect(() => {
        onCallEndedRef.current = onCallEnded;
    }, [onCallEnded]);

    // Create audio element for remote stream
    useEffect(() => {
        if (typeof window !== 'undefined') {
            remoteAudioRef.current = new Audio();
            remoteAudioRef.current.autoplay = true;
        }
        return () => {
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = null;
            }
        };
    }, []);

    // Start call duration timer
    const startTimer = useCallback(() => {
        callStartTime.current = Date.now();
        timerRef.current = setInterval(() => {
            if (callStartTime.current) {
                setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
            }
        }, 1000);
    }, []);

    // Stop call duration timer
    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    // End the call
    const endCall = useCallback(() => {
        const wasActuallyConnected = wasConnectedRef.current;

        // Close the call connection
        if (callRef.current) {
            callRef.current.close();
            callRef.current = null;
        }

        // Stop local audio stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        // Destroy peer connection
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }

        // Clear remote audio
        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
        }

        stopTimer();
        setCallState('ended');
        setRemotePeerId(null);

        // Only trigger callback if we were actually connected
        if (wasActuallyConnected) {
            wasConnectedRef.current = false;
            onCallEndedRef.current?.();
        }
    }, [stopTimer]);

    // Handle incoming call
    const handleIncomingCall = useCallback((call: MediaConnection) => {
        callRef.current = call;
        setRemotePeerId(call.peer);


        call.on('stream', (remoteStream) => {
            console.log('Received remote stream');
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = remoteStream;
                remoteAudioRef.current.play().catch(e => console.error('Error playing remote audio:', e));
            }
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

        // Answer with local stream
        if (localStreamRef.current) {
            console.log('Answering call with local stream');
            call.answer(localStreamRef.current);
        } else {
            console.warn('No local stream to answer with');
        }
    }, [startTimer, endCall]);

    // Start the call (initialize peer and wait/connect)
    const startCall = useCallback(async () => {
        try {
            setCallState('connecting');
            setError(null);

            // Get audio stream
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: false
            });
            localStreamRef.current = stream;

            // Create unique peer ID based on room and random suffix
            const peerId = `${roomId}-${Date.now().toString(36)}`;
            const hostPeerId = `${roomId}-host`;

            // Try to be the host first
            const peer = new Peer(hostPeerId, {
                debug: 0,
            });

            peerRef.current = peer;

            peer.on('error', async (err) => {
                // If host ID is taken, we're the guest - connect to host
                if (err.type === 'unavailable-id') {
                    // Destroy current peer and create as guest
                    peer.destroy();

                    const guestPeer = new Peer(peerId, { debug: 0 });
                    peerRef.current = guestPeer;

                    guestPeer.on('open', () => {
                        // Connect to the host
                        if (localStreamRef.current) {
                            const call = guestPeer.call(hostPeerId, localStreamRef.current);
                            callRef.current = call;

                            call.on('stream', (remoteStream) => {
                                console.log('Caller received remote stream');
                                if (remoteAudioRef.current) {
                                    remoteAudioRef.current.srcObject = remoteStream;
                                    remoteAudioRef.current.play().catch(e => console.error('Error playing remote audio:', e));
                                }
                                wasConnectedRef.current = true;
                                setCallState('connected');
                                startTimer();
                            });

                            call.on('close', () => {
                                console.log('Caller connection closed');
                                endCall();
                            });

                            call.on('error', (callErr) => {
                                console.error('Call error:', callErr);
                                setError('Failed to connect to call');
                                setCallState('error');
                            });
                        }
                    });

                    guestPeer.on('error', (guestErr) => {
                        console.error('Guest peer error:', guestErr);
                        setError('Connection failed. Please try again.');
                        setCallState('error');
                    });
                } else {
                    console.error('Peer error:', err);
                    setError(err.message || 'Connection failed');
                    setCallState('error');
                }
            });

            peer.on('open', () => {
                // We're the host, waiting for someone to call
                setCallState('waiting');
            });

            peer.on('call', handleIncomingCall);

        } catch (err: any) {
            console.error('Failed to start call:', err);
            if (err.name === 'NotAllowedError') {
                setError('Microphone access denied. Please allow microphone access.');
            } else if (err.name === 'NotFoundError') {
                setError('No microphone found. Please connect a microphone.');
            } else {
                setError(err.message || 'Failed to start call');
            }
            setCallState('error');
        }
    }, [roomId, handleIncomingCall, startTimer, endCall]);

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

    // Cleanup on unmount - don't trigger callback
    useEffect(() => {
        return () => {
            // Stop everything without triggering callback
            if (callRef.current) {
                callRef.current.close();
            }
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (peerRef.current) {
                peerRef.current.destroy();
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    return {
        callState,
        isMuted,
        callDuration,
        error,
        remotePeerId,
        startCall,
        endCall,
        toggleMute,
    };
}

// Format seconds to mm:ss
export function formatCallDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

