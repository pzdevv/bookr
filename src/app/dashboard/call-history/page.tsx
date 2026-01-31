'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/dashboard/layout';
import { CallHistoryPageSkeleton } from '@/components/ui/skeleton';
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
    const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

                setCallRecords(records);
            } catch (err) {
                console.error('Error loading call history:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadCallHistory();
    }, [userProfile?.$id]);

    // Sorting and Filtering
    const processedRecords = callRecords
        .filter(record => {
            if (filter === 'with_notes') return record.notes?.summary || record.notes?.decisions;
            if (filter === 'with_docs') return record.documents.length > 0;
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'date') {
                const dateA = new Date(a.booking.slotTime).getTime();
                const dateB = new Date(b.booking.slotTime).getTime();
                return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
            } else {
                const nameA = a.booking.guestName.toLowerCase();
                const nameB = b.booking.guestName.toLowerCase();
                return sortOrder === 'asc'
                    ? nameA.localeCompare(nameB)
                    : nameB.localeCompare(nameA);
            }
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

    const toggleSort = (key: 'date' | 'name') => {
        if (sortBy === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            setSortOrder('desc');
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <CallHistoryPageSkeleton />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto min-h-screen">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#850000] to-[#6b0000] flex items-center justify-center shadow-lg shadow-[#850000]/20">
                            <span className="material-symbols-outlined text-white text-2xl">history</span>
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-[#1d0c0c]">Call History</h1>
                            <p className="text-[#6b4444] text-sm md:text-base">Review past calls, notes & shared documents</p>
                        </div>
                    </div>
                </motion.div>

                {/* Controls */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-start md:items-center"
                >
                    {/* Filters */}
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                        {[
                            { key: 'all' as const, label: `All Calls`, count: callRecords.length, icon: 'call' },
                            { key: 'with_notes' as const, label: 'With Notes', icon: 'notes' },
                            { key: 'with_docs' as const, label: 'With Docs', icon: 'folder' },
                        ].map((f) => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                className={`group px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 cursor-pointer ${filter === f.key
                                    ? 'bg-gradient-to-r from-[#850000] to-[#6b0000] text-white shadow-lg shadow-[#850000]/25'
                                    : 'bg-white text-[#6b4444] hover:bg-[#850000]/5 hover:text-[#850000]'
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-lg transition-transform duration-200 ${filter === f.key ? '' : 'group-hover:scale-110'}`}>
                                    {f.icon}
                                </span>
                                {f.label}
                                {f.count !== undefined && (
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === f.key ? 'bg-white/20' : 'bg-[#850000]/10 text-[#850000]'
                                        }`}>
                                        {f.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Sorting */}
                    <div className="flex gap-2">
                        {[
                            { key: 'date' as const, label: 'Date' },
                            { key: 'name' as const, label: 'Name' },
                        ].map((s) => (
                            <button
                                key={s.key}
                                onClick={() => toggleSort(s.key)}
                                className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${sortBy === s.key
                                    ? 'bg-[#850000]/10 text-[#850000]'
                                    : 'bg-white text-[#6b4444] hover:bg-gray-50'
                                    }`}
                            >
                                {s.label}
                                {sortBy === s.key && (
                                    <motion.span
                                        initial={{ rotate: 0 }}
                                        animate={{ rotate: sortOrder === 'asc' ? 180 : 0 }}
                                        className="material-symbols-outlined text-sm"
                                    >
                                        arrow_downward
                                    </motion.span>
                                )}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Empty State */}
                {processedRecords.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="bg-white rounded-3xl p-12 md:p-16 text-center shadow-xl shadow-black/5"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                            className="w-24 h-24 bg-gradient-to-br from-[#850000]/10 to-[#850000]/5 rounded-3xl flex items-center justify-center mx-auto mb-6"
                        >
                            <motion.span
                                animate={{ rotate: [0, -10, 10, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                                className="material-symbols-outlined text-[#850000] text-5xl"
                            >
                                history
                            </motion.span>
                        </motion.div>
                        <h3 className="text-2xl font-bold text-[#1d0c0c] mb-3">No calls yet</h3>
                        <p className="text-[#6b4444] mb-8 max-w-sm mx-auto">
                            Your completed calls will appear here with notes and documents.
                        </p>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#850000] to-[#6b0000] text-white font-bold rounded-xl hover:shadow-xl hover:shadow-[#850000]/25 transition-all duration-300 hover:-translate-y-0.5"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                            Back to Dashboard
                        </Link>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {processedRecords.map((record, index) => {
                            const isExpanded = expandedId === record.booking.$id;
                            const duration = calculateDuration(record.booking.callStartedAt, record.booking.callEndedAt);
                            const actionItems = parseActionItems(record.notes?.actionItems);

                            return (
                                <motion.div
                                    key={record.booking.$id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all duration-300"
                                >
                                    {/* Header Row - Always Visible */}
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : record.booking.$id)}
                                        className="w-full p-5 md:p-6 flex items-center gap-4 text-left hover:bg-[#850000]/[0.02] transition-colors cursor-pointer"
                                    >
                                        {/* Avatar */}
                                        <div className="relative">
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#850000] to-[#6b0000] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#850000]/20">
                                                <span className="text-white font-bold text-xl">{record.booking.guestName.charAt(0)}</span>
                                            </div>
                                            {duration > 0 && (
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-white text-xs">check</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-[#1d0c0c] truncate text-lg">{record.booking.guestName}</h3>
                                            <p className="text-sm text-[#6b4444] truncate">{record.booking.guestEmail}</p>
                                        </div>

                                        {/* Meta */}
                                        <div className="text-right flex-shrink-0 hidden sm:block">
                                            <p className="text-sm font-semibold text-[#1d0c0c]">{formatDate(record.booking.slotTime)}</p>
                                            <p className="text-xs text-[#6b4444] flex items-center gap-1 justify-end">
                                                <span className="material-symbols-outlined text-sm">timer</span>
                                                {formatCallDuration(duration)}
                                            </p>
                                        </div>

                                        {/* Badges */}
                                        <div className="flex gap-2 flex-shrink-0">
                                            {record.notes?.summary && (
                                                <motion.span
                                                    whileHover={{ scale: 1.1 }}
                                                    className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center"
                                                    title="Has notes"
                                                >
                                                    <span className="material-symbols-outlined text-blue-600 text-lg">notes</span>
                                                </motion.span>
                                            )}
                                            {record.documents.length > 0 && (
                                                <motion.span
                                                    whileHover={{ scale: 1.1 }}
                                                    className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center"
                                                    title={`${record.documents.length} documents`}
                                                >
                                                    <span className="material-symbols-outlined text-green-600 text-lg">folder</span>
                                                </motion.span>
                                            )}
                                            {actionItems.length > 0 && (
                                                <motion.span
                                                    whileHover={{ scale: 1.1 }}
                                                    className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center"
                                                    title={`${actionItems.length} action items`}
                                                >
                                                    <span className="material-symbols-outlined text-orange-600 text-lg">checklist</span>
                                                </motion.span>
                                            )}
                                        </div>

                                        {/* Expand Arrow */}
                                        <motion.span
                                            animate={{ rotate: isExpanded ? 180 : 0 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                            className="material-symbols-outlined text-[#6b4444]"
                                        >
                                            expand_more
                                        </motion.span>
                                    </button>

                                    {/* Expanded Content */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-5 md:px-6 pb-6 pt-2 border-t border-[#850000]/5">
                                                    {/* Mobile Date */}
                                                    <div className="sm:hidden mb-4 text-sm text-[#6b4444] flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-lg">calendar_today</span>
                                                        {formatDate(record.booking.slotTime)} • {formatCallDuration(duration)}
                                                    </div>

                                                    <div className="grid md:grid-cols-2 gap-6">
                                                        {/* Notes Section */}
                                                        <div className="space-y-4">
                                                            <h4 className="font-bold text-[#1d0c0c] flex items-center gap-2">
                                                                <span className="w-8 h-8 rounded-lg bg-[#850000]/10 flex items-center justify-center">
                                                                    <span className="material-symbols-outlined text-[#850000] text-lg">edit_note</span>
                                                                </span>
                                                                Notes
                                                            </h4>

                                                            {record.notes?.summary ? (
                                                                <motion.div
                                                                    initial={{ opacity: 0, x: -10 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    className="bg-gradient-to-br from-[#fcf8f8] to-white rounded-xl p-4 border border-[#850000]/5"
                                                                >
                                                                    <p className="text-xs font-bold text-[#850000] uppercase tracking-wider mb-2">Summary</p>
                                                                    <p className="text-sm text-[#1d0c0c] whitespace-pre-wrap leading-relaxed">{record.notes.summary}</p>
                                                                </motion.div>
                                                            ) : (
                                                                <p className="text-sm text-[#6b4444] italic py-4">No summary recorded</p>
                                                            )}

                                                            {record.notes?.decisions && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, x: -10 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    transition={{ delay: 0.1 }}
                                                                    className="bg-gradient-to-br from-[#fcf8f8] to-white rounded-xl p-4 border border-[#850000]/5"
                                                                >
                                                                    <p className="text-xs font-bold text-[#850000] uppercase tracking-wider mb-2">Decisions</p>
                                                                    <p className="text-sm text-[#1d0c0c] whitespace-pre-wrap leading-relaxed">{record.notes.decisions}</p>
                                                                </motion.div>
                                                            )}

                                                            {actionItems.length > 0 && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, x: -10 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    transition={{ delay: 0.2 }}
                                                                    className="bg-gradient-to-br from-[#fcf8f8] to-white rounded-xl p-4 border border-[#850000]/5"
                                                                >
                                                                    <p className="text-xs font-bold text-[#850000] uppercase tracking-wider mb-3">Action Items</p>
                                                                    <ul className="space-y-2">
                                                                        {actionItems.map((item, i) => (
                                                                            <motion.li
                                                                                key={i}
                                                                                initial={{ opacity: 0, x: -5 }}
                                                                                animate={{ opacity: 1, x: 0 }}
                                                                                transition={{ delay: 0.1 * i }}
                                                                                className="flex items-start gap-3 text-sm"
                                                                            >
                                                                                <span className={`material-symbols-outlined text-lg mt-0.5 ${item.completed ? 'text-green-600' : 'text-[#6b4444]'}`}>
                                                                                    {item.completed ? 'check_circle' : 'radio_button_unchecked'}
                                                                                </span>
                                                                                <span className={item.completed ? 'line-through text-[#6b4444]' : 'text-[#1d0c0c]'}>
                                                                                    {item.text}
                                                                                </span>
                                                                            </motion.li>
                                                                        ))}
                                                                    </ul>
                                                                </motion.div>
                                                            )}
                                                        </div>

                                                        {/* Documents Section */}
                                                        <div>
                                                            <h4 className="font-bold text-[#1d0c0c] flex items-center gap-2 mb-4">
                                                                <span className="w-8 h-8 rounded-lg bg-[#850000]/10 flex items-center justify-center">
                                                                    <span className="material-symbols-outlined text-[#850000] text-lg">folder</span>
                                                                </span>
                                                                Documents
                                                            </h4>

                                                            {record.documents.length > 0 ? (
                                                                <div className="space-y-2">
                                                                    {record.documents.map((doc, i) => (
                                                                        <motion.div
                                                                            key={doc.$id}
                                                                            initial={{ opacity: 0, y: 10 }}
                                                                            animate={{ opacity: 1, y: 0 }}
                                                                            transition={{ delay: 0.1 * i }}
                                                                            className="flex items-center gap-3 p-4 bg-gradient-to-br from-[#fcf8f8] to-white rounded-xl group hover:shadow-md transition-all duration-200 border border-[#850000]/5"
                                                                        >
                                                                            <div className="w-10 h-10 rounded-lg bg-[#850000]/10 flex items-center justify-center">
                                                                                <span className="material-symbols-outlined text-[#850000]">{getFileIcon(doc.fileType)}</span>
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-sm font-medium text-[#1d0c0c] truncate">{doc.fileName}</p>
                                                                                <p className="text-xs text-[#6b4444]">
                                                                                    {(doc.fileSize / 1024).toFixed(1)} KB
                                                                                </p>
                                                                            </div>
                                                                            {callDocumentsService.isConfigured() && (
                                                                                <a
                                                                                    href={callDocumentsService.getFileDownloadUrl(doc.fileId)}
                                                                                    className="w-10 h-10 rounded-xl bg-white flex items-center justify-center hover:bg-[#850000] hover:text-white text-[#6b4444] transition-all duration-200 shadow-sm group-hover:shadow-md"
                                                                                    title="Download"
                                                                                >
                                                                                    <span className="material-symbols-outlined text-lg">download</span>
                                                                                </a>
                                                                            )}
                                                                        </motion.div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-[#6b4444] italic py-4">No documents shared</p>
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
        </DashboardLayout>
    );
}
