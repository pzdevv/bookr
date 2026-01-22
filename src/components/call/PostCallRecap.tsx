'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CallNotes, CallDocument, ActionItem, callNotesService, callDocumentsService } from '@/lib/appwrite/database';
import { formatCallDuration } from '@/lib/hooks/use-audio-call';

interface PostCallRecapProps {
    callRoomId: string;
    hostId: string;
    guestName: string;
    guestEmail: string;
    hostName: string;
    callDuration: number;
    isHost: boolean;
    onClose: () => void;
}

export function PostCallRecap({
    callRoomId,
    hostId,
    guestName,
    guestEmail,
    hostName,
    callDuration,
    isHost,
    onClose,
}: PostCallRecapProps) {
    const [notes, setNotes] = useState<CallNotes | null>(null);
    const [documents, setDocuments] = useState<CallDocument[]>([]);
    const [summary, setSummary] = useState('');
    const [decisions, setDecisions] = useState('');
    const [actionItems, setActionItems] = useState<ActionItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [notesData, docsData] = await Promise.all([
                    callNotesService.getByRoomId(callRoomId),
                    callDocumentsService.listByRoomId(callRoomId),
                ]);
                if (notesData) {
                    setNotes(notesData);
                    setSummary(notesData.summary || '');
                    setDecisions(notesData.decisions || '');
                    setActionItems(notesData.actionItems ? JSON.parse(notesData.actionItems) : []);
                }
                setDocuments(docsData);
            } catch (err) {
                console.error('Error loading recap data:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [callRoomId]);

    const handleSave = async () => {
        if (!notes || !isHost) return;
        setIsSaving(true);
        try {
            await callNotesService.update(notes.$id, {
                summary,
                decisions,
                actionItems: JSON.stringify(actionItems),
            });
        } catch (err) {
            console.error('Error saving notes:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleActionItem = (index: number) => {
        const updated = [...actionItems];
        updated[index].completed = !updated[index].completed;
        setActionItems(updated);
    };

    const copySummary = () => {
        const text = `
Call Summary - ${new Date().toLocaleDateString()}
Duration: ${formatCallDuration(callDuration)}
Participants: ${hostName}, ${guestName}

Summary:
${summary || 'No summary'}

Decisions:
${decisions || 'No decisions recorded'}

Action Items:
${actionItems.length > 0 ? actionItems.map((item, i) => `${i + 1}. [${item.completed ? '✓' : ' '}] ${item.text}`).join('\n') : 'No action items'}
        `.trim();

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getFileIcon = (fileType: string) => {
        if (fileType.includes('pdf')) return 'picture_as_pdf';
        if (fileType.includes('word') || fileType.includes('document')) return 'description';
        if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'table_chart';
        if (fileType.includes('text')) return 'article';
        return 'insert_drive_file';
    };

    if (isLoading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center p-8"
            >
                <div className="w-8 h-8 border-3 border-[#850000] border-t-transparent rounded-full animate-spin" />
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-[6px_6px_0px_0px_rgba(133,0,0,0.15)] border border-[#850000]/10 p-6 max-w-2xl w-full mx-auto"
        >
            {/* Header */}
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-green-600 text-3xl">check_circle</span>
                </div>
                <h2 className="text-2xl font-bold text-[#1d0c0c]">Call Completed!</h2>
                <p className="text-[#6b4444] mt-1">Duration: {formatCallDuration(callDuration)}</p>
            </div>

            {/* Participants */}
            <div className="flex items-center justify-center gap-4 mb-6 p-4 bg-[#850000]/5 rounded-xl">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-[#850000]/20 flex items-center justify-center">
                        <span className="text-[#850000] font-bold">{hostName.charAt(0)}</span>
                    </div>
                    <span className="text-sm font-medium text-[#1d0c0c]">{hostName}</span>
                </div>
                <span className="material-symbols-outlined text-[#6b4444]">sync_alt</span>
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-[#850000]/20 flex items-center justify-center">
                        <span className="text-[#850000] font-bold">{guestName.charAt(0)}</span>
                    </div>
                    <span className="text-sm font-medium text-[#1d0c0c]">{guestName}</span>
                </div>
            </div>

            {/* Notes Section (Host Only) */}
            {isHost && (
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="text-xs font-bold text-[#1d0c0c] uppercase tracking-wide">Summary</label>
                        <textarea
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="Key points from the call..."
                            className="w-full mt-1 p-3 bg-[#850000]/5 border border-[#850000]/10 rounded-lg text-sm text-[#1d0c0c] placeholder:text-[#6b4444]/50 resize-none focus:outline-none focus:ring-2 focus:ring-[#850000]/20"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-[#1d0c0c] uppercase tracking-wide">Decisions</label>
                        <textarea
                            value={decisions}
                            onChange={(e) => setDecisions(e.target.value)}
                            placeholder="What was decided..."
                            className="w-full mt-1 p-3 bg-[#850000]/5 border border-[#850000]/10 rounded-lg text-sm text-[#1d0c0c] placeholder:text-[#6b4444]/50 resize-none focus:outline-none focus:ring-2 focus:ring-[#850000]/20"
                            rows={2}
                        />
                    </div>

                    {actionItems.length > 0 && (
                        <div>
                            <label className="text-xs font-bold text-[#1d0c0c] uppercase tracking-wide">Action Items</label>
                            <div className="mt-2 space-y-2">
                                {actionItems.map((item, index) => (
                                    <div key={index} className="flex items-center gap-2 p-2 bg-[#850000]/5 rounded-lg">
                                        <button
                                            onClick={() => toggleActionItem(index)}
                                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${item.completed ? 'bg-green-500 border-green-500 text-white' : 'border-[#850000]/30'}`}
                                        >
                                            {item.completed && <span className="material-symbols-outlined text-sm">check</span>}
                                        </button>
                                        <span className={`text-sm ${item.completed ? 'line-through text-[#6b4444]' : 'text-[#1d0c0c]'}`}>
                                            {item.text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Documents */}
            {documents.length > 0 && (
                <div className="mb-6">
                    <label className="text-xs font-bold text-[#1d0c0c] uppercase tracking-wide">Shared Documents</label>
                    <div className="mt-2 space-y-2">
                        {documents.map((doc) => (
                            <div key={doc.$id} className="p-3 bg-[#850000]/5 rounded-lg flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#850000]">{getFileIcon(doc.fileType)}</span>
                                <span className="flex-1 text-sm font-medium text-[#1d0c0c] truncate">{doc.fileName}</span>
                                <a
                                    href={callDocumentsService.getFileDownloadUrl(doc.fileId)}
                                    className="p-1.5 hover:bg-white rounded-lg transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[#6b4444] text-lg">download</span>
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
                {isHost ? (
                    <>
                        <div className="flex gap-3">
                            <button
                                onClick={copySummary}
                                className="flex-1 py-3 px-4 bg-[#850000]/10 text-[#850000] rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#850000]/20 transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">{copied ? 'check' : 'content_copy'}</span>
                                {copied ? 'Copied!' : 'Copy Summary'}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 py-3 px-4 bg-[#850000] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#6b0000] transition-colors disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-lg">{isSaving ? 'hourglass_empty' : 'save'}</span>
                                {isSaving ? 'Saving...' : 'Save Notes'}
                            </button>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-full py-3 px-4 bg-gradient-to-r from-[#850000] to-[#6b0000] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                        >
                            <span className="material-symbols-outlined">dashboard</span>
                            Go to Dashboard
                        </button>
                    </>
                ) : (
                    <>
                        <div className="p-4 bg-[#850000]/5 rounded-xl border border-[#850000]/10 text-center">
                            <p className="font-medium text-[#1d0c0c] mb-1">Enjoyed the call?</p>
                            <p className="text-sm text-[#6b4444]">Get your own free booking page!</p>
                        </div>
                        <Link
                            href="/auth/signup"
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#850000] to-[#6b0000] text-white font-bold flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                        >
                            <span className="material-symbols-outlined">person_add</span>
                            Get Your Free Booking Page
                        </Link>
                        <Link
                            href="/"
                            className="w-full py-3 rounded-xl bg-[#850000]/5 text-[#6b4444] font-medium flex items-center justify-center gap-2 hover:bg-[#850000]/10 transition-all"
                        >
                            Maybe Later
                        </Link>
                    </>
                )}
            </div>
        </motion.div>
    );
}
