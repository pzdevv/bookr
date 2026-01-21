'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/hooks/use-auth';
import { eventTypeService, EventType } from '@/lib/appwrite/database';
import { COLORS, generateSlug } from '@/lib/utils';

const MAX_EVENTS = 3;
const MIN_EVENTS = 1;

export default function EventTypesPage() {
    const { userProfile } = useAuth();
    const [eventTypes, setEventTypes] = useState<EventType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
    const [formData, setFormData] = useState({ title: '', description: '', duration: 30, buffer: 0, color: COLORS[0].value });
    const [error, setError] = useState('');

    useEffect(() => { if (userProfile) loadEventTypes(); }, [userProfile]);

    const loadEventTypes = async () => {
        if (!userProfile) return;
        try { const data = await eventTypeService.listByUser(userProfile.$id); setEventTypes(data); }
        catch (error) { console.error('Error:', error); }
        finally { setIsLoading(false); }
    };

    const handleCreate = async () => {
        if (!userProfile) return;
        if (eventTypes.length >= MAX_EVENTS) {
            setError(`Maximum ${MAX_EVENTS} event types allowed`);
            return;
        }
        try {
            await eventTypeService.create({ ...formData, userId: userProfile.$id, slug: generateSlug(formData.title), isActive: true });
            loadEventTypes();
            setIsCreateDialogOpen(false);
            setFormData({ title: '', description: '', duration: 30, buffer: 0, color: COLORS[0].value });
            setError('');
        } catch (error) { console.error('Error:', error); }
    };

    const handleEdit = async () => {
        if (!selectedEventType) return;
        try {
            await eventTypeService.update(selectedEventType.$id, {
                title: formData.title,
                description: formData.description,
                duration: formData.duration,
                buffer: formData.buffer,
                color: formData.color,
                slug: generateSlug(formData.title)
            });
            loadEventTypes();
            setIsEditDialogOpen(false);
            setSelectedEventType(null);
        } catch (error) { console.error('Error:', error); }
    };

    const handleDelete = async () => {
        if (!selectedEventType) return;
        if (eventTypes.length <= MIN_EVENTS) {
            setError(`You must have at least ${MIN_EVENTS} event type`);
            setIsDeleteDialogOpen(false);
            return;
        }
        try {
            await eventTypeService.delete(selectedEventType.$id);
            loadEventTypes();
            setIsDeleteDialogOpen(false);
            setError('');
        }
        catch (error) { console.error('Error:', error); }
    };

    const handleToggleActive = async (event: EventType) => {
        try {
            await eventTypeService.update(event.$id, { isActive: !event.isActive });
            loadEventTypes();
        } catch (error) { console.error('Error:', error); }
    };

    const openEditDialog = (event: EventType) => {
        setSelectedEventType(event);
        setFormData({
            title: event.title,
            description: event.description || '',
            duration: event.duration,
            buffer: event.buffer,
            color: event.color
        });
        setIsEditDialogOpen(true);
    };

    const copyLink = (slug: string) => {
        const userSlug = userProfile?.username || userProfile?.name?.toLowerCase().replace(/\s+/g, '-');
        const link = `${window.location.origin}/book/${userSlug}/${slug}`;
        navigator.clipboard.writeText(link);
        setCopiedSlug(slug);
        setTimeout(() => setCopiedSlug(null), 2000);
    };

    const canCreate = eventTypes.length < MAX_EVENTS;
    const canDelete = eventTypes.length > MIN_EVENTS;

    return (
        <DashboardLayout>
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#850000]/5 bg-white px-8 py-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-[#1d0c0c]">Event Types</h2>
                    <span className="text-xs font-medium text-[#6b4444] bg-[#850000]/5 px-2 py-1 rounded-md">
                        {eventTypes.length}/{MAX_EVENTS}
                    </span>
                </div>
                <button
                    onClick={() => { setFormData({ title: '', description: '', duration: 30, buffer: 0, color: COLORS[0].value }); setIsCreateDialogOpen(true); setError(''); }}
                    disabled={!canCreate}
                    className="bg-[#850000] hover:bg-[#6b0000] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    <span>New Event Type</span>
                </button>
            </header>

            {/* Error Message */}
            {error && (
                <div className="mx-8 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">error</span>
                    {error}
                    <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
            )}

            {/* Content */}
            <div className="p-8">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-3 border-[#850000]/20 border-t-[#850000] rounded-full animate-spin" />
                    </div>
                ) : eventTypes.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-[#850000]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-[#850000]/40 text-4xl">event</span>
                        </div>
                        <h3 className="text-xl font-bold text-[#1d0c0c] mb-2">No event types yet</h3>
                        <p className="text-[#6b4444] mb-6">Create your first event type to start accepting bookings</p>
                        <button
                            onClick={() => setIsCreateDialogOpen(true)}
                            className="bg-[#850000] text-white px-6 py-3 rounded-lg font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                        >
                            Create Event Type
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence mode="popLayout">
                            {eventTypes.map((event, index) => (
                                <motion.div
                                    key={event.$id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group bg-white border border-[#850000]/5 rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(133,0,0,0.1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                                style={{ backgroundColor: `${event.color}15`, color: event.color }}
                                            >
                                                <span className="material-symbols-outlined">videocam</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleToggleActive(event)}
                                                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase transition-colors ${event.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full ${event.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                    {event.isActive ? 'Active' : 'Draft'}
                                                </button>
                                                <div className="relative group/menu">
                                                    <button className="p-1 text-[#6b4444] hover:text-[#1d0c0c] hover:bg-[#850000]/5 rounded-lg transition-colors">
                                                        <span className="material-symbols-outlined text-[18px]">more_vert</span>
                                                    </button>
                                                    <div className="absolute right-0 top-full mt-1 bg-white border border-[#850000]/10 rounded-lg shadow-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 min-w-[140px]">
                                                        <button
                                                            onClick={() => openEditDialog(event)}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white bg-[#850000] hover:bg-[#6b0000] transition-colors rounded-t-lg"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">edit</span>
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => { setSelectedEventType(event); setIsDeleteDialogOpen(true); }}
                                                            disabled={!canDelete}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">delete</span>
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold text-[#1d0c0c] mb-1 group-hover:text-[#850000] transition-colors">{event.title}</h3>
                                        <p className="text-sm text-[#6b4444] mb-4 line-clamp-2">{event.description || 'No description'}</p>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-xs text-[#6b4444]">
                                                <span className="material-symbols-outlined text-[16px]">schedule</span>
                                                <span>{event.duration} minutes</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-[#6b4444]">
                                                <span className="material-symbols-outlined text-[16px]">videocam</span>
                                                <span>Video Call</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-4 mt-4 border-t border-[#850000]/5 flex items-center justify-between">
                                        <div className="flex items-center gap-1 text-xs text-[#850000] font-semibold">
                                            <span className="material-symbols-outlined text-[16px]">link</span>
                                            <span>/{event.slug}</span>
                                        </div>
                                        <button
                                            onClick={() => copyLink(event.slug)}
                                            className="flex items-center gap-1 text-xs font-bold text-[#1d0c0c] hover:bg-[#850000]/5 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">{copiedSlug === event.slug ? 'check' : 'content_copy'}</span>
                                            <span>{copiedSlug === event.slug ? 'Copied!' : 'Copy Link'}</span>
                                        </button>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Add New Placeholder - only if can create */}
                            {canCreate && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onClick={() => { setFormData({ title: '', description: '', duration: 30, buffer: 0, color: COLORS[0].value }); setIsCreateDialogOpen(true); setError(''); }}
                                    className="border-2 border-dashed border-[#850000]/20 rounded-xl flex flex-col items-center justify-center p-6 bg-transparent hover:bg-[#850000]/5 hover:border-[#850000] transition-all cursor-pointer min-h-[280px]"
                                >
                                    <div className="w-12 h-12 rounded-full bg-[#850000]/10 flex items-center justify-center text-[#850000] mb-4">
                                        <span className="material-symbols-outlined text-[32px]">add</span>
                                    </div>
                                    <p className="text-sm font-bold text-[#1d0c0c]">Add another event type</p>
                                    <p className="text-xs text-[#6b4444] mt-1">{MAX_EVENTS - eventTypes.length} remaining</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create Event Type</DialogTitle>
                        <DialogDescription>Set up a new booking type for your calendar.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="30 Minute Meeting" />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="A quick call to discuss..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Duration (min)</Label>
                                <Input type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Buffer (min)</Label>
                                <Input type="number" value={formData.buffer} onChange={(e) => setFormData({ ...formData, buffer: parseInt(e.target.value) || 0 })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Color</Label>
                            <div className="flex gap-2 flex-wrap">
                                {COLORS.map((c) => (
                                    <button
                                        key={c.value}
                                        className={`w-8 h-8 rounded-full transition-all ${formData.color === c.value ? 'ring-2 ring-offset-2 ring-[#850000] scale-110' : 'hover:scale-105'}`}
                                        style={{ backgroundColor: c.value }}
                                        onClick={() => setFormData({ ...formData, color: c.value })}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={!formData.title} className="bg-[#850000] text-white hover:bg-[#6b0000]">Create Event</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Event Type</DialogTitle>
                        <DialogDescription>Update your event type settings.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="30 Minute Meeting" />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="A quick call to discuss..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Duration (min)</Label>
                                <Input type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Buffer (min)</Label>
                                <Input type="number" value={formData.buffer} onChange={(e) => setFormData({ ...formData, buffer: parseInt(e.target.value) || 0 })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Color</Label>
                            <div className="flex gap-2 flex-wrap">
                                {COLORS.map((c) => (
                                    <button
                                        key={c.value}
                                        className={`w-8 h-8 rounded-full transition-all ${formData.color === c.value ? 'ring-2 ring-offset-2 ring-[#850000] scale-110' : 'hover:scale-105'}`}
                                        style={{ backgroundColor: c.value }}
                                        onClick={() => setFormData({ ...formData, color: c.value })}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleEdit} disabled={!formData.title} className="bg-[#850000] text-white hover:bg-[#6b0000]">Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Event Type</DialogTitle>
                        <DialogDescription>
                            {canDelete
                                ? 'Are you sure? This action cannot be undone.'
                                : `You must have at least ${MIN_EVENTS} event type.`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={!canDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}

