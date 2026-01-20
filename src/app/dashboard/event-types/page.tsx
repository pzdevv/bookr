'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/hooks/use-auth';
import { eventTypeService, EventType } from '@/lib/appwrite/database';
import { COLORS, generateSlug } from '@/lib/utils';

const eventCards = [
    { icon: 'person', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-600', title: '15min Quick Sync', desc: 'A brief catch-up or status update call.', duration: '15 minutes', location: 'Google Meet', locationIcon: 'videocam', slug: '/quick-sync', isActive: true },
    { icon: 'call', iconBg: 'bg-[#fbbd23]/10', iconColor: 'text-[#fbbd23]', title: '30min Discovery Call', desc: 'Introductory call to explore potential partnerships.', duration: '30 minutes', location: 'Phone Call', locationIcon: 'phone', slug: '/discovery', isActive: true },
    { icon: 'psychology', iconBg: 'bg-purple-500/10', iconColor: 'text-purple-600', title: '60min Consultation', desc: 'In-depth technical review and strategic planning session.', duration: '60 minutes', location: 'Zoom', locationIcon: 'videocam', slug: '/strategic-consult', isActive: true },
    { icon: 'terminal', iconBg: 'bg-orange-500/10', iconColor: 'text-orange-600', title: 'Technical Interview', desc: 'Live coding assessment for engineering candidates.', duration: '90 minutes', location: 'Google Meet', locationIcon: 'videocam', slug: '/hiring-interview', isActive: false },
    { icon: 'coffee', iconBg: 'bg-green-500/10', iconColor: 'text-green-600', title: 'Casual Coffee Chat', desc: 'Networking and informal knowledge sharing sessions.', duration: '20 minutes', location: 'Physical Location', locationIcon: 'location_on', slug: '/coffee', isActive: true },
];

export default function EventTypesPage() {
    const { userProfile } = useAuth();
    const [eventTypes, setEventTypes] = useState<EventType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
    const [formData, setFormData] = useState({ title: '', description: '', duration: 30, buffer: 0, color: COLORS[0].value });

    useEffect(() => { if (userProfile) loadEventTypes(); }, [userProfile]);

    const loadEventTypes = async () => {
        if (!userProfile) return;
        try { const data = await eventTypeService.listByUser(userProfile.$id); setEventTypes(data); }
        catch (error) { console.error('Error:', error); }
        finally { setIsLoading(false); }
    };

    const handleCreate = async () => {
        if (!userProfile) return;
        try {
            await eventTypeService.create({ ...formData, userId: userProfile.$id, slug: generateSlug(formData.title), isActive: true });
            loadEventTypes();
            setIsCreateDialogOpen(false);
            setFormData({ title: '', description: '', duration: 30, buffer: 0, color: COLORS[0].value });
        } catch (error) { console.error('Error:', error); }
    };

    const handleDelete = async () => {
        if (!selectedEventType) return;
        try { await eventTypeService.delete(selectedEventType.$id); loadEventTypes(); setIsDeleteDialogOpen(false); }
        catch (error) { console.error('Error:', error); }
    };

    const copyLink = (slug: string) => {
        // Use username if available, otherwise fall back to name-based slug
        const userSlug = userProfile?.username || userProfile?.name?.toLowerCase().replace(/\s+/g, '-');
        const link = `https://bookncall.me/${userSlug}${slug}`;
        navigator.clipboard.writeText(link);
        setCopiedSlug(slug);
        setTimeout(() => setCopiedSlug(null), 2000);
    };

    // Combine real and demo data
    const displayCards = eventTypes.length > 0 ? eventTypes : [];

    return (
        <DashboardLayout>
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white backdrop-blur-md px-8 py-4">
                <div className="flex items-center gap-6">
                    <h2 className="text-xl font-bold text-gray-900">Event Types</h2>
                    <div className="hidden sm:flex items-center">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                <span className="material-symbols-outlined text-[20px]">search</span>
                            </span>
                            <input
                                className="pl-10 pr-4 py-2 text-sm bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-[#fbbd23] w-64 text-gray-900"
                                placeholder="Search events..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg relative">
                        <span className="material-symbols-outlined">notifications</span>
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                    <button
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="bg-[#fbbd23] hover:bg-[#fbbd23]/90 text-[#231d0f] px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        <span>New Event Type</span>
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="px-8 pt-4">
                <div className="flex border-b border-gray-200 gap-8">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 ${activeTab === 'all' ? 'border-[#fbbd23] text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        All Events <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px]">{displayCards.length || eventCards.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('personal')}
                        className={`pb-3 text-sm font-medium border-b-2 ${activeTab === 'personal' ? 'border-[#fbbd23] text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Personal
                    </button>
                    <button
                        onClick={() => setActiveTab('team')}
                        className={`pb-3 text-sm font-medium border-b-2 ${activeTab === 'team' ? 'border-[#fbbd23] text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Team
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-8">
                {/* Event Card Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {/* Show real event types if available, otherwise show demo cards */}
                        {(displayCards.length > 0 ? displayCards : eventCards).map((card, index) => {
                            const isRealEvent = 'userId' in card;
                            const title = isRealEvent ? (card as EventType).title : (card as typeof eventCards[0]).title;
                            const desc = isRealEvent ? ((card as EventType).description || 'No description') : (card as typeof eventCards[0]).desc;
                            const duration = isRealEvent ? `${(card as EventType).duration} minutes` : (card as typeof eventCards[0]).duration;
                            const slug = isRealEvent ? `/${(card as EventType).slug}` : (card as typeof eventCards[0]).slug;
                            const isActive = isRealEvent ? (card as EventType).isActive : (card as typeof eventCards[0]).isActive;
                            const icon = isRealEvent ? 'videocam' : (card as typeof eventCards[0]).icon;
                            const iconBg = isRealEvent ? 'bg-[#fbbd23]/10' : (card as typeof eventCards[0]).iconBg;
                            const iconColor = isRealEvent ? 'text-[#fbbd23]' : (card as typeof eventCards[0]).iconColor;
                            const locationIcon = isRealEvent ? 'videocam' : (card as typeof eventCards[0]).locationIcon;
                            const location = isRealEvent ? 'Video Call' : (card as typeof eventCards[0]).location;

                            return (
                                <motion.div
                                    key={isRealEvent ? (card as EventType).$id : index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center ${iconColor}`}>
                                                <span className="material-symbols-outlined">{icon}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">{isActive ? 'Active' : 'Draft'}</span>
                                                <button className="ml-2 p-1 text-gray-400 hover:text-gray-600">
                                                    <span className="material-symbols-outlined text-[18px]">more_vert</span>
                                                </button>
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-[#fbbd23] transition-colors">{title}</h3>
                                        <p className="text-sm text-gray-500 mb-4">{desc}</p>
                                        <div className="flex flex-col gap-2 mb-6">
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <span className="material-symbols-outlined text-[16px]">schedule</span>
                                                <span>{duration}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <span className="material-symbols-outlined text-[16px]">{locationIcon}</span>
                                                <span>{location}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <div className="flex items-center gap-1 text-xs text-[#fbbd23] font-semibold cursor-pointer hover:underline">
                                            <span className="material-symbols-outlined text-[16px]">link</span>
                                            <span>{slug}</span>
                                        </div>
                                        <button
                                            onClick={() => copyLink(slug)}
                                            className="flex items-center gap-1 text-xs font-bold text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">{copiedSlug === slug ? 'check' : 'content_copy'}</span>
                                            <span>{copiedSlug === slug ? 'Copied!' : 'Copy Link'}</span>
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {/* Add New Placeholder */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => setIsCreateDialogOpen(true)}
                            className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-6 bg-transparent hover:bg-gray-50 hover:border-[#fbbd23] transition-all cursor-pointer min-h-[280px]"
                        >
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                                <span className="material-symbols-outlined text-[32px]">add</span>
                            </div>
                            <p className="text-sm font-bold text-gray-600">Add another event type</p>
                            <p className="text-xs text-gray-400 mt-1">Configure duration and settings</p>
                        </motion.div>
                    </AnimatePresence>
                </div>
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
                                <Input type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Buffer (min)</Label>
                                <Input type="number" value={formData.buffer} onChange={(e) => setFormData({ ...formData, buffer: parseInt(e.target.value) })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Color</Label>
                            <div className="flex gap-2 flex-wrap">
                                {COLORS.map((c) => (
                                    <button
                                        key={c.value}
                                        className={`w-8 h-8 rounded-full transition-all ${formData.color === c.value ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                                        style={{ backgroundColor: c.value }}
                                        onClick={() => setFormData({ ...formData, color: c.value })}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={!formData.title} className="bg-[#fbbd23] text-[#231d0f] hover:bg-[#fbbd23]/90">Create Event</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Event Type</DialogTitle>
                        <DialogDescription>Are you sure? This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
