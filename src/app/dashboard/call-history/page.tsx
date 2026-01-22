'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
    const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
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
                        const [notes, documents] = await Promise.all([
                            callNotesService.getByRoomId(booking.callRoomId!),
                            callDocumentsService.listByRoomId(booking.callRoomId!),
                        ]);
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
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const calculateDuration = (startedAt?: string, endedAt?: string): number => {
        if (!startedAt || !endedAt) return 0;
        return Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000);
    };

    if (isLoading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-3 border-[#850000] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[#6b4444]">Loading call history...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#1d0c0c]">Call History</h1>
                    <p className="text-[#6b4444]">Review your past calls, notes, and shared documents</p>
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-[#850000] text-white' : 'bg-[#850000]/5 text-[#850000] hover:bg-[#850000]/10'}`}
                    >
                        All ({callRecords.length})
                    </button>
                    <button
                        onClick={() => setFilter('with_notes')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'with_notes' ? 'bg-[#850000] text-white' : 'bg-[#850000]/5 text-[#850000] hover:bg-[#850000]/10'}`}
                    >
                        With Notes
                    </button>
                    <button
                        onClick={() => setFilter('with_docs')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'with_docs' ? 'bg-[#850000] text-white' : 'bg-[#850000]/5 text-[#850000] hover:bg-[#850000]/10'}`}
                    >
                        With Docs
                    </button>
                </div>
            </div>

            {filteredRecords.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-[6px_6px_0px_0px_rgba(133,0,0,0.1)] border border-[#850000]/10 p-12 text-center"
                >
                    <div className="w-20 h-20 bg-[#850000]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
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
                <div className="grid gap-4">
                    {filteredRecords.map((record, index) => (
                        <motion.div
                            key={record.booking.$id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white rounded-xl shadow-[4px_4px_0px_0px_rgba(133,0,0,0.1)] border border-[#850000]/10 p-5 hover:shadow-[6px_6px_0px_0px_rgba(133,0,0,0.15)] transition-all cursor-pointer"
                            onClick={() => setSelectedCall(selectedCall?.booking.$id === record.booking.$id ? null : record)}
                        >
                            <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#850000]/20 to-[#850000]/5 flex items-center justify-center flex-shrink-0">
                                    <span className="text-[#850000] font-bold text-lg">{record.booking.guestName.charAt(0)}</span>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-bold text-[#1d0c0c]">{record.booking.guestName}</h3>
                                            <p className="text-sm text-[#6b4444]">{record.booking.guestEmail}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-[#1d0c0c]">{formatDate(record.booking.slotTime)}</p>
                                            <p className="text-xs text-[#6b4444]">
                                                {formatCallDuration(calculateDuration(record.booking.callStartedAt, record.booking.callEndedAt))}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Badges */}
                                    <div className="flex gap-2 mt-3">
                                        {record.notes?.summary && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                                                <span className="material-symbols-outlined text-sm">notes</span>
                                                Notes
                                            </span>
                                        )}
                                        {record.documents.length > 0 && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">
                                                <span className="material-symbols-outlined text-sm">folder</span>
                                                {record.documents.length} doc{record.documents.length > 1 ? 's' : ''}
                                            </span>
                                        )}
                                        {record.notes?.actionItems && JSON.parse(record.notes.actionItems).length > 0 && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-xs font-medium">
                                                <span className="material-symbols-outlined text-sm">checklist</span>
                                                Actions
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Expand Arrow */}
                                <span className={`material-symbols-outlined text-[#6b4444] transition-transform ${selectedCall?.booking.$id === record.booking.$id ? 'rotate-180' : ''}`}>
                                    expand_more
                                </span>
                            </div>

                            {/* Expanded Content */}
                            {selectedCall?.booking.$id === record.booking.$id && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-4 pt-4 border-t border-[#850000]/10"
                                >
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {/* Notes */}
                                        <div className="space-y-3">
                                            {record.notes?.summary && (
                                                <div>
                                                    <h4 className="text-xs font-bold text-[#1d0c0c] uppercase tracking-wide mb-1">Summary</h4>
                                                    <p className="text-sm text-[#6b4444] bg-[#850000]/5 rounded-lg p-3">{record.notes.summary}</p>
                                                </div>
                                            )}
                                            {record.notes?.decisions && (
                                                <div>
                                                    <h4 className="text-xs font-bold text-[#1d0c0c] uppercase tracking-wide mb-1">Decisions</h4>
                                                    <p className="text-sm text-[#6b4444] bg-[#850000]/5 rounded-lg p-3">{record.notes.decisions}</p>
                                                </div>
                                            )}
                                            {record.notes?.actionItems && JSON.parse(record.notes.actionItems).length > 0 && (
                                                <div>
                                                    <h4 className="text-xs font-bold text-[#1d0c0c] uppercase tracking-wide mb-1">Action Items</h4>
                                                    <ul className="space-y-1">
                                                        {JSON.parse(record.notes.actionItems).map((item: { text: string; completed: boolean }, i: number) => (
                                                            <li key={i} className="flex items-center gap-2 text-sm">
                                                                <span className={`material-symbols-outlined text-base ${item.completed ? 'text-green-600' : 'text-[#6b4444]'}`}>
                                                                    {item.completed ? 'check_circle' : 'radio_button_unchecked'}
                                                                </span>
                                                                <span className={item.completed ? 'line-through text-[#6b4444]' : 'text-[#1d0c0c]'}>{item.text}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {!record.notes?.summary && !record.notes?.decisions && (
                                                <p className="text-sm text-[#6b4444] italic">No notes recorded for this call.</p>
                                            )}
                                        </div>

                                        {/* Documents */}
                                        <div>
                                            <h4 className="text-xs font-bold text-[#1d0c0c] uppercase tracking-wide mb-2">Documents</h4>
                                            {record.documents.length > 0 ? (
                                                <div className="space-y-2">
                                                    {record.documents.map((doc) => (
                                                        <div key={doc.$id} className="flex items-center gap-3 p-3 bg-[#850000]/5 rounded-lg">
                                                            <span className="material-symbols-outlined text-[#850000]">{getFileIcon(doc.fileType)}</span>
                                                            <span className="flex-1 text-sm font-medium text-[#1d0c0c] truncate">{doc.fileName}</span>
                                                            <a
                                                                href={callDocumentsService.getFileDownloadUrl(doc.fileId)}
                                                                className="p-1.5 hover:bg-white rounded-lg transition-colors"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <span className="material-symbols-outlined text-[#6b4444] text-lg">download</span>
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-[#6b4444] italic">No documents shared in this call.</p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
