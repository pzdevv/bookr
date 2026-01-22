'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CallNotes, CallDocument, ActionItem, callNotesService, callDocumentsService } from '@/lib/appwrite/database';

interface NotesPanelProps {
    callRoomId: string;
    hostId: string;
    guestEmail: string;
    isHost: boolean;
    isExpanded: boolean;
    onToggle: () => void;
}

export function NotesPanel({ callRoomId, hostId, guestEmail, isHost, isExpanded, onToggle }: NotesPanelProps) {
    const [notes, setNotes] = useState<CallNotes | null>(null);
    const [documents, setDocuments] = useState<CallDocument[]>([]);
    const [summary, setSummary] = useState('');
    const [decisions, setDecisions] = useState('');
    const [actionItems, setActionItems] = useState<ActionItem[]>([]);
    const [newActionText, setNewActionText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [activeTab, setActiveTab] = useState<'notes' | 'docs'>('notes');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load notes and documents
    useEffect(() => {
        const loadData = async () => {
            try {
                const [notesData, docsData] = await Promise.all([
                    callNotesService.getOrCreate(callRoomId, hostId, guestEmail),
                    callDocumentsService.listByRoomId(callRoomId),
                ]);
                setNotes(notesData);
                setSummary(notesData.summary || '');
                setDecisions(notesData.decisions || '');
                setActionItems(notesData.actionItems ? JSON.parse(notesData.actionItems) : []);
                setDocuments(docsData);
            } catch (err) {
                console.error('Error loading notes:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [callRoomId, hostId, guestEmail]);

    // Auto-save notes with debounce
    const saveNotes = async () => {
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

    // Debounced save
    useEffect(() => {
        if (!notes || !isHost) return;

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            saveNotes();
        }, 3000);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [summary, decisions, actionItems]);

    const addActionItem = () => {
        if (!newActionText.trim()) return;
        setActionItems([...actionItems, { text: newActionText.trim(), assignedTo: 'host', completed: false }]);
        setNewActionText('');
    };

    const toggleActionItem = (index: number) => {
        const updated = [...actionItems];
        updated[index].completed = !updated[index].completed;
        setActionItems(updated);
    };

    const removeActionItem = (index: number) => {
        setActionItems(actionItems.filter((_, i) => i !== index));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadError('');

        try {
            const newDoc = await callDocumentsService.upload(
                file,
                callRoomId,
                hostId,
                guestEmail,
                isHost ? 'host' : 'guest'
            );
            setDocuments([newDoc, ...documents]);
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const getFileIcon = (fileType: string) => {
        if (fileType.includes('pdf')) return 'picture_as_pdf';
        if (fileType.includes('word') || fileType.includes('document')) return 'description';
        if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'table_chart';
        if (fileType.includes('text')) return 'article';
        return 'insert_drive_file';
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        return `${(bytes / 1024).toFixed(1)} KB`;
    };

    if (!isHost) {
        // Guests can only view documents
        return (
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ x: 320, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 320, opacity: 0 }}
                        className="fixed right-0 top-16 bottom-16 w-80 bg-white border-l border-[#850000]/10 shadow-[-4px_0_20px_rgba(133,0,0,0.1)] z-40 flex flex-col"
                    >
                        <div className="p-4 border-b border-[#850000]/10 flex items-center justify-between">
                            <h3 className="font-bold text-[#1d0c0c] flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#850000]">folder</span>
                                Shared Documents
                            </h3>
                            <button onClick={onToggle} className="p-1 hover:bg-[#850000]/5 rounded-lg transition-colors">
                                <span className="material-symbols-outlined text-[#6b4444]">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="w-6 h-6 border-2 border-[#850000] border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : documents.length === 0 ? (
                                <div className="text-center py-8 text-[#6b4444]">
                                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">folder_off</span>
                                    <p className="text-sm">No documents shared yet</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {documents.map((doc) => (
                                        <div key={doc.$id} className="p-3 bg-[#850000]/5 rounded-lg flex items-center gap-3">
                                            <span className="material-symbols-outlined text-[#850000]">{getFileIcon(doc.fileType)}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-[#1d0c0c] truncate">{doc.fileName}</p>
                                                <p className="text-xs text-[#6b4444]">{formatFileSize(doc.fileSize)}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <a
                                                    href={callDocumentsService.getFileViewUrl(doc.fileId)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 hover:bg-white rounded-lg transition-colors"
                                                    title="View"
                                                >
                                                    <span className="material-symbols-outlined text-[#6b4444] text-lg">visibility</span>
                                                </a>
                                                <a
                                                    href={callDocumentsService.getFileDownloadUrl(doc.fileId)}
                                                    className="p-1.5 hover:bg-white rounded-lg transition-colors"
                                                    title="Download"
                                                >
                                                    <span className="material-symbols-outlined text-[#6b4444] text-lg">download</span>
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence>
            {isExpanded && (
                <motion.div
                    initial={{ x: 320, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 320, opacity: 0 }}
                    className="fixed right-0 top-16 bottom-16 w-80 bg-white border-l border-[#850000]/10 shadow-[-4px_0_20px_rgba(133,0,0,0.1)] z-40 flex flex-col"
                >
                    {/* Header */}
                    <div className="p-3 border-b border-[#850000]/10 flex items-center justify-between">
                        <div className="flex gap-1">
                            <button
                                onClick={() => setActiveTab('notes')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notes' ? 'bg-[#850000] text-white' : 'text-[#6b4444] hover:bg-[#850000]/5'}`}
                            >
                                Notes
                            </button>
                            <button
                                onClick={() => setActiveTab('docs')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'docs' ? 'bg-[#850000] text-white' : 'text-[#6b4444] hover:bg-[#850000]/5'}`}
                            >
                                Docs ({documents.length})
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            {isSaving && (
                                <span className="text-xs text-[#6b4444]">Saving...</span>
                            )}
                            <button onClick={onToggle} className="p-1 hover:bg-[#850000]/5 rounded-lg transition-colors">
                                <span className="material-symbols-outlined text-[#6b4444]">close</span>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="w-6 h-6 border-2 border-[#850000] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : activeTab === 'notes' ? (
                            <div className="space-y-4">
                                {/* Summary */}
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

                                {/* Decisions */}
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

                                {/* Action Items */}
                                <div>
                                    <label className="text-xs font-bold text-[#1d0c0c] uppercase tracking-wide">Action Items</label>
                                    <div className="mt-2 space-y-2">
                                        {actionItems.map((item, index) => (
                                            <div key={index} className="flex items-start gap-2 p-2 bg-[#850000]/5 rounded-lg group">
                                                <button
                                                    onClick={() => toggleActionItem(index)}
                                                    className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${item.completed ? 'bg-green-500 border-green-500 text-white' : 'border-[#850000]/30 hover:border-[#850000]'}`}
                                                >
                                                    {item.completed && <span className="material-symbols-outlined text-sm">check</span>}
                                                </button>
                                                <span className={`flex-1 text-sm ${item.completed ? 'line-through text-[#6b4444]' : 'text-[#1d0c0c]'}`}>
                                                    {item.text}
                                                </span>
                                                <button
                                                    onClick={() => removeActionItem(index)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-red-500 text-sm">close</span>
                                                </button>
                                            </div>
                                        ))}
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newActionText}
                                                onChange={(e) => setNewActionText(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && addActionItem()}
                                                placeholder="Add action item..."
                                                className="flex-1 p-2 bg-white border border-[#850000]/10 rounded-lg text-sm text-[#1d0c0c] placeholder:text-[#6b4444]/50 focus:outline-none focus:ring-2 focus:ring-[#850000]/20"
                                            />
                                            <button
                                                onClick={addActionItem}
                                                disabled={!newActionText.trim()}
                                                className="px-3 py-2 bg-[#850000] text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#6b0000] transition-colors"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Upload Button */}
                                <div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="w-full p-4 border-2 border-dashed border-[#850000]/20 rounded-xl flex flex-col items-center gap-2 hover:bg-[#850000]/5 hover:border-[#850000] transition-all disabled:opacity-50"
                                    >
                                        {isUploading ? (
                                            <div className="w-6 h-6 border-2 border-[#850000] border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <span className="material-symbols-outlined text-[#850000] text-2xl">upload_file</span>
                                        )}
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-[#1d0c0c]">
                                                {isUploading ? 'Uploading...' : 'Upload Document'}
                                            </p>
                                            <p className="text-xs text-[#6b4444]">PDF, DOC, TXT, XLS • Max 500KB</p>
                                        </div>
                                    </button>
                                    {uploadError && (
                                        <p className="mt-2 text-xs text-red-600">{uploadError}</p>
                                    )}
                                </div>

                                {/* Documents List */}
                                {documents.length > 0 ? (
                                    <div className="space-y-2">
                                        {documents.map((doc) => (
                                            <div key={doc.$id} className="p-3 bg-[#850000]/5 rounded-lg flex items-center gap-3 group">
                                                <span className="material-symbols-outlined text-[#850000]">{getFileIcon(doc.fileType)}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-[#1d0c0c] truncate">{doc.fileName}</p>
                                                    <p className="text-xs text-[#6b4444]">
                                                        {formatFileSize(doc.fileSize)} • {doc.uploadedBy === 'host' ? 'You' : 'Guest'}
                                                    </p>
                                                </div>
                                                <div className="flex gap-1">
                                                    <a
                                                        href={callDocumentsService.getFileViewUrl(doc.fileId)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 hover:bg-white rounded-lg transition-colors"
                                                        title="View"
                                                    >
                                                        <span className="material-symbols-outlined text-[#6b4444] text-lg">visibility</span>
                                                    </a>
                                                    <a
                                                        href={callDocumentsService.getFileDownloadUrl(doc.fileId)}
                                                        className="p-1.5 hover:bg-white rounded-lg transition-colors"
                                                        title="Download"
                                                    >
                                                        <span className="material-symbols-outlined text-[#6b4444] text-lg">download</span>
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-[#6b4444]">
                                        <span className="material-symbols-outlined text-4xl mb-2 opacity-50">folder_off</span>
                                        <p className="text-sm">No documents shared yet</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
