'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/hooks/use-auth';
import { bookingService, callNotesService, callDocumentsService, Booking, CallNotes, CallDocument } from '@/lib/appwrite/database';
import { formatCallDuration } from '@/lib/hooks/use-audio-call';

interface CallRecord {
    booking: Booking;
    notes: CallNotes | null;
    documents: CallDocument[];
}

export default function CallHistoryPage() {
    const { userProfile } = useAuth();
    const [callRecords, setCallRecords] = useState<CallRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'with_notes' | 'with_docs'>('all');

    useEffect(() => {
        const loadCallHistory = async () => {
            if (!userProfile?.$id) return;

            try {
                // Get all completed bookings
                const bookings = await bookingService.listByUser(userProfile.$id);
                const completedBookings = bookings.filter(b => b.status === 'completed' && b.callRoomId);

                // Load notes and documents for each
                const records: CallRecord[] = await Promise.all(
                    completedBookings.map(async (booking) => {
                        let notes: CallNotes | null = null;
                        let documents: CallDocument[] = [];

                        if (callNotesService.isConfigured()) {
                            try {
                                notes = await callNotesService.getByRoomId(booking.callRoomId!);
                            } catch { /* ignore */ }
                        }

                        if (callDocumentsService.isConfigured()) {
                            try {
                                documents = await callDocumentsService.listByRoomId(booking.callRoomId!);
                            } catch { /* ignore */ }
                        }

                        return { booking, notes, documents };
                    })
                );

                // Sort by date descending
                records.sort((a, b) =>
                    new Date(b.booking.slotTime).getTime() - new Date(a.booking.slotTime).getTime()
                );

                setCallRecords(records);
            } catch (err) {
                console.error('Error loading call history:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadCallHistory();
    }, [userProfile?.$id]);

    const filteredRecords = callRecords.filter(record => {
        if (filter === 'with_notes') return record.notes?.summary || record.notes?.decisions;
        if (filter === 'with_docs') return record.documents.length > 0;
        return true;
    });

    const getFileIcon = (fileType: string) => {
        if (fileType.includes('pdf')) return 'picture_as_pdf';
        if (fileType.includes('word') || fileType.includes('document')) return 'description';
        if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'table_chart';
        if (fileType.includes('text')) return 'article';
        return 'insert_drive_file';
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const calculateDuration = (startedAt?: string, endedAt?: string): number => {
        if (!startedAt || !endedAt) return 0;
        return Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000);
    };

    const parseActionItems = (actionItemsStr?: string) => {
        if (!actionItemsStr) return [];
        try {
            return JSON.parse(actionItemsStr) as { text: string; completed: boolean }[];
        } catch {
            return [];
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-3 border-[#850000] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[#6b4444]">Loading call history...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#1d0c0c] mb-2">Call History</h1>
                <p className="text-[#6b4444]">Review your past calls, notes, and shared documents</p>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filter === 'all'
                            ? 'bg-[#850000] text-white shadow-lg'
                            : 'bg-white text-[#6b4444] border border-[#850000]/10 hover:border-[#850000]/30'
                        }`}
                >
                    All Calls ({callRecords.length})
                </button>
                <button
                    onClick={() => setFilter('with_notes')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filter === 'with_notes'
                            ? 'bg-[#850000] text-white shadow-lg'
                            : 'bg-white text-[#6b4444] border border-[#850000]/10 hover:border-[#850000]/30'
                        }`}
                >
                    <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">notes</span>
                        With Notes
                    </span>
                </button>
                <button
                    onClick={() => setFilter('with_docs')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filter === 'with_docs'
                            ? 'bg-[#850000] text-white shadow-lg'
                            : 'bg-white text-[#6b4444] border border-[#850000]/10 hover:border-[#850000]/30'
                        }`}
                >
                    <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">folder</span>
                        With Documents
                    </span>
                </button>
            </div>

            {/* Empty State */}
            {filteredRecords.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-[#850000]/10 p-12 text-center"
                >
                    <div className="w-20 h-20 bg-[#850000]/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-[#850000] text-4xl">history</span>
                    </div>
                    <h3 className="text-xl font-bold text-[#1d0c0c] mb-2">No calls yet</h3>
                    <p className="text-[#6b4444] mb-6">Your completed calls will appear here with notes and documents.</p>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#850000] text-white font-bold rounded-xl hover:bg-[#6b0000] transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back to Dashboard
                    </Link>
                </motion.div>
            ) : (
                <div className="space-y-4">
                    {filteredRecords.map((record, index) => {
                        const isExpanded = expandedId === record.booking.$id;
                        const duration = calculateDuration(record.booking.callStartedAt, record.booking.callEndedAt);
                        const actionItems = parseActionItems(record.notes?.actionItems);

                        return (
                            <motion.div
                                key={record.booking.$id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className="bg-white rounded-2xl border border-[#850000]/10 overflow-hidden hover:shadow-lg transition-all"
                            >
                                {/* Header Row - Always Visible */}
                                <button
                                    onClick={() => setExpandedId(isExpanded ? null : record.booking.$id)}
                                    className="w-full p-5 flex items-center gap-4 text-left hover:bg-[#850000]/[0.02] transition-colors"
                                >
                                    {/* Avatar */}
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#850000] to-[#6b0000] flex items-center justify-center flex-shrink-0">
                                        <span className="text-white font-bold text-xl">{record.booking.guestName.charAt(0)}</span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-[#1d0c0c] truncate">{record.booking.guestName}</h3>
                                        <p className="text-sm text-[#6b4444] truncate">{record.booking.guestEmail}</p>
                                    </div>

                                    {/* Meta */}
                                    <div className="text-right flex-shrink-0 hidden sm:block">
                                        <p className="text-sm font-medium text-[#1d0c0c]">{formatDate(record.booking.slotTime)}</p>
                                        <p className="text-xs text-[#6b4444]">{formatCallDuration(duration)}</p>
                                    </div>

                                    {/* Badges */}
                                    <div className="flex gap-1.5 flex-shrink-0">
                                        {record.notes?.summary && (
                                            <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center" title="Has notes">
                                                <span className="material-symbols-outlined text-blue-600 text-lg">notes</span>
                                            </span>
                                        )}
                                        {record.documents.length > 0 && (
                                            <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center" title={`${record.documents.length} documents`}>
                                                <span className="material-symbols-outlined text-green-600 text-lg">folder</span>
                                            </span>
                                        )}
                                        {actionItems.length > 0 && (
                                            <span className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center" title={`${actionItems.length} action items`}>
                                                <span className="material-symbols-outlined text-orange-600 text-lg">checklist</span>
                                            </span>
                                        )}
                                    </div>

                                    {/* Expand Arrow */}
                                    <span className={`material-symbols-outlined text-[#6b4444] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                        expand_more
                                    </span>
                                </button>

                                {/* Expanded Content */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-5 pb-5 pt-2 border-t border-[#850000]/5">
                                                {/* Mobile Date */}
                                                <div className="sm:hidden mb-4 text-sm text-[#6b4444]">
                                                    {formatDate(record.booking.slotTime)} • {formatCallDuration(duration)}
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-6">
                                                    {/* Notes Section */}
                                                    <div className="space-y-4">
                                                        <h4 className="font-bold text-[#1d0c0c] flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-[#850000]">edit_note</span>
                                                            Notes
                                                        </h4>

                                                        {record.notes?.summary ? (
                                                            <div className="bg-[#fcf8f8] rounded-xl p-4">
                                                                <p className="text-xs font-bold text-[#850000] uppercase tracking-wide mb-1">Summary</p>
                                                                <p className="text-sm text-[#1d0c0c] whitespace-pre-wrap">{record.notes.summary}</p>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-[#6b4444] italic">No summary recorded</p>
                                                        )}

                                                        {record.notes?.decisions && (
                                                            <div className="bg-[#fcf8f8] rounded-xl p-4">
                                                                <p className="text-xs font-bold text-[#850000] uppercase tracking-wide mb-1">Decisions</p>
                                                                <p className="text-sm text-[#1d0c0c] whitespace-pre-wrap">{record.notes.decisions}</p>
                                                            </div>
                                                        )}

                                                        {actionItems.length > 0 && (
                                                            <div className="bg-[#fcf8f8] rounded-xl p-4">
                                                                <p className="text-xs font-bold text-[#850000] uppercase tracking-wide mb-2">Action Items</p>
                                                                <ul className="space-y-2">
                                                                    {actionItems.map((item, i) => (
                                                                        <li key={i} className="flex items-start gap-2 text-sm">
                                                                            <span className={`material-symbols-outlined text-base mt-0.5 ${item.completed ? 'text-green-600' : 'text-[#6b4444]'}`}>
                                                                                {item.completed ? 'check_circle' : 'radio_button_unchecked'}
                                                                            </span>
                                                                            <span className={item.completed ? 'line-through text-[#6b4444]' : 'text-[#1d0c0c]'}>
                                                                                {item.text}
                                                                            </span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Documents Section */}
                                                    <div>
                                                        <h4 className="font-bold text-[#1d0c0c] flex items-center gap-2 mb-4">
                                                            <span className="material-symbols-outlined text-[#850000]">folder</span>
                                                            Documents
                                                        </h4>

                                                        {record.documents.length > 0 ? (
                                                            <div className="space-y-2">
                                                                {record.documents.map((doc) => (
                                                                    <div key={doc.$id} className="flex items-center gap-3 p-3 bg-[#fcf8f8] rounded-xl group">
                                                                        <span className="material-symbols-outlined text-[#850000]">{getFileIcon(doc.fileType)}</span>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm font-medium text-[#1d0c0c] truncate">{doc.fileName}</p>
                                                                            <p className="text-xs text-[#6b4444]">
                                                                                {(doc.fileSize / 1024).toFixed(1)} KB
                                                                            </p>
                                                                        </div>
                                                                        {callDocumentsService.isConfigured() && (
                                                                            <a
                                                                                href={callDocumentsService.getFileDownloadUrl(doc.fileId)}
                                                                                className="w-9 h-9 rounded-lg bg-white flex items-center justify-center hover:bg-[#850000] hover:text-white text-[#6b4444] transition-colors"
                                                                                title="Download"
                                                                            >
                                                                                <span className="material-symbols-outlined text-lg">download</span>
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-[#6b4444] italic">No documents shared</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
