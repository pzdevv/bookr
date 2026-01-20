'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, MoreHorizontal, Pencil, Trash2, Calendar, ExternalLink } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { eventTypeService, EventType } from '@/lib/appwrite/database';
import { COLORS, generateSlug } from '@/lib/utils';

export default function AdminEventTypesPage() {
    const [eventTypes, setEventTypes] = useState<EventType[]>([]);
    const [filteredEventTypes, setFilteredEventTypes] = useState<EventType[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [formData, setFormData] = useState({ title: '', description: '', duration: 30, buffer: 0, color: COLORS[0].value, isActive: true, userId: '' });

    useEffect(() => { loadEventTypes(); }, []);
    useEffect(() => { filterEventTypes(); }, [eventTypes, searchQuery, statusFilter]);

    const loadEventTypes = async () => {
        try {
            const data = await eventTypeService.list();
            setEventTypes(data);
        } catch (error) { console.error('Error loading event types:', error); }
        finally { setIsLoading(false); }
    };

    const filterEventTypes = () => {
        let filtered = [...eventTypes];
        if (searchQuery) filtered = filtered.filter((et) => et.title.toLowerCase().includes(searchQuery.toLowerCase()));
        if (statusFilter !== 'all') filtered = filtered.filter((et) => et.isActive === (statusFilter === 'active'));
        setFilteredEventTypes(filtered);
    };

    const handleUpdate = async () => {
        if (!selectedEventType) return;
        try {
            await eventTypeService.update(selectedEventType.$id, { ...formData, slug: generateSlug(formData.title) });
            loadEventTypes();
            setIsEditDialogOpen(false);
        } catch (error) { console.error('Error updating:', error); }
    };

    const handleDelete = async () => {
        if (!selectedEventType) return;
        try { await eventTypeService.delete(selectedEventType.$id); loadEventTypes(); setIsDeleteDialogOpen(false); }
        catch (error) { console.error('Error deleting:', error); }
    };

    const handleToggleActive = async (eventType: EventType) => {
        try { await eventTypeService.update(eventType.$id, { isActive: !eventType.isActive }); loadEventTypes(); }
        catch (error) { console.error('Error toggling:', error); }
    };

    const openEditDialog = (eventType: EventType) => {
        setSelectedEventType(eventType);
        setFormData({ title: eventType.title, description: eventType.description, duration: eventType.duration, buffer: eventType.buffer, color: eventType.color, isActive: eventType.isActive, userId: eventType.userId });
        setIsEditDialogOpen(true);
    };

    if (isLoading) return <DashboardLayout isAdmin><div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;

    return (
        <DashboardLayout isAdmin>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div><h1 className="text-3xl font-bold">Event Types Management</h1><p className="text-muted-foreground mt-1">Manage all event types</p></div>
                </div>
                <Card><CardContent className="p-4"><div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select>
                </div></CardContent></Card>

                <Card><CardHeader><CardTitle>All Event Types ({filteredEventTypes.length})</CardTitle></CardHeader><CardContent>
                    {filteredEventTypes.length === 0 ? <div className="text-center py-12 text-muted-foreground"><Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No event types found</p></div> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <AnimatePresence>{filteredEventTypes.map((eventType, index) => (
                                <motion.div key={eventType.$id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.03 }} className="relative p-4 rounded-xl border border-border hover:border-primary/30">
                                    <div className="absolute top-0 left-0 right-0 h-2 rounded-t-xl" style={{ backgroundColor: eventType.color }} />
                                    <div className="pt-2 flex items-start justify-between mb-3">
                                        <div><h3 className="font-semibold">{eventType.title}</h3><p className="text-sm text-muted-foreground line-clamp-2">{eventType.description || 'No description'}</p></div>
                                        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => openEditDialog(eventType)}><Pencil className="w-4 h-4 mr-2" />Edit</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-destructive" onClick={() => { setSelectedEventType(eventType); setIsDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem></DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3"><span>{eventType.duration} min</span>{eventType.buffer > 0 && <><span>•</span><span>{eventType.buffer} min buffer</span></>}</div>
                                    <div className="flex items-center justify-between"><Badge variant={eventType.isActive ? 'default' : 'secondary'}>{eventType.isActive ? 'Active' : 'Inactive'}</Badge><Switch checked={eventType.isActive} onCheckedChange={() => handleToggleActive(eventType)} /></div>
                                </motion.div>
                            ))}</AnimatePresence>
                        </div>
                    )}
                </CardContent></Card>

                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}><DialogContent><DialogHeader><DialogTitle>Edit Event Type</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2"><Label>Title</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Description</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Duration (min)</Label><Input type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })} /></div><div className="space-y-2"><Label>Buffer (min)</Label><Input type="number" value={formData.buffer} onChange={(e) => setFormData({ ...formData, buffer: parseInt(e.target.value) })} /></div></div>
                        <div className="space-y-2"><Label>Color</Label><div className="flex gap-2">{COLORS.map((color) => (<button key={color.value} className={`w-8 h-8 rounded-full ${formData.color === color.value ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`} style={{ backgroundColor: color.value }} onClick={() => setFormData({ ...formData, color: color.value })} />))}</div></div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button><Button onClick={handleUpdate}>Save</Button></DialogFooter>
                </DialogContent></Dialog>

                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}><DialogContent><DialogHeader><DialogTitle>Delete Event Type</DialogTitle><DialogDescription>Are you sure? This cannot be undone.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter></DialogContent></Dialog>
            </motion.div>
        </DashboardLayout>
    );
}
