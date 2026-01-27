'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Search, Filter, MoreVertical, Check, X, Phone } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { bookingService, Booking } from '@/lib/appwrite/database';

export default function AdminBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

    useEffect(() => { loadBookings(); }, []);

    useEffect(() => {
        let result = bookings;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter((b) =>
                b.guestName.toLowerCase().includes(query) ||
                b.guestEmail.toLowerCase().includes(query)
            );
        }
        if (statusFilter !== 'all') {
            result = result.filter((b) => b.status === statusFilter);
        }
        setFilteredBookings(result);
    }, [bookings, searchQuery, statusFilter]);

    const loadBookings = async () => {
        try { const data = await bookingService.list(); setBookings(data); setFilteredBookings(data); }
        catch (error) { console.error('Error:', error); }
        finally { setIsLoading(false); }
    };

    const updateStatus = async (bookingId: string, status: Booking['status']) => {
        try { await bookingService.update(bookingId, { status }); loadBookings(); setIsCancelDialogOpen(false); }
        catch (error) { console.error('Error:', error); }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed': return <Badge variant="success" className="gap-1 bg-green-100 text-green-700 hover:bg-green-200 border-green-200"><Check className="w-3 h-3" />Confirmed</Badge>;
            case 'completed': return <Badge variant="secondary" className="gap-1 bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200"><Check className="w-3 h-3" />Completed</Badge>;
            case 'cancelled': return <Badge variant="destructive" className="gap-1 bg-red-100 text-red-700 hover:bg-red-200 border-red-200"><X className="w-3 h-3" />Cancelled</Badge>;
            default: return <Badge variant="outline" className="gap-1 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200"><Clock className="w-3 h-3" />Pending</Badge>;
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout isAdmin>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" role="status" aria-label="Loading" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout isAdmin>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bookings</h1>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
                    <Input
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        aria-label="Search bookings"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px]">
                        <Filter className="w-4 h-4 mr-2" aria-hidden="true" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Bookings List */}
            {filteredBookings.length === 0 ? (
                <Card className="border-gray-100">
                    <CardContent className="py-16 text-center">
                        <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" aria-hidden="true" />
                        <p className="text-gray-500">{searchQuery || statusFilter !== 'all' ? 'No bookings match your filters' : 'No bookings yet'}</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {filteredBookings.map((booking, index) => {
                            const date = new Date(booking.slotTime);
                            return (
                                <motion.div
                                    key={booking.$id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-[#850000]/20 hover:shadow-sm transition-all"
                                >
                                    <Avatar className="w-12 h-12 border-2 border-gray-100 flex-shrink-0">
                                        <AvatarFallback className="bg-gradient-to-br from-[#850000]/10 to-[#850000]/20 text-[#850000] font-bold">{booking.guestName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900">{booking.guestName}</p>
                                        <p className="text-sm text-gray-500 truncate">{booking.guestEmail}</p>
                                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                                                {date.toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                                                {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        {/* Quick Actions for Pending */}
                                        {booking.status === 'pending' && (
                                            <div className="flex items-center gap-2 mr-2">
                                                <button
                                                    onClick={() => updateStatus(booking.$id, 'confirmed')}
                                                    className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors"
                                                    title="Confirm Booking"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedBooking(booking); setIsCancelDialogOpen(true); }}
                                                    className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors"
                                                    title="Reject Booking"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}

                                        {getStatusBadge(booking.status)}

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400" aria-label="Actions">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {booking.status === 'pending' && (
                                                    <DropdownMenuItem onClick={() => updateStatus(booking.$id, 'confirmed')}>
                                                        <Check className="w-4 h-4 mr-2 text-green-500" aria-hidden="true" />
                                                        Confirm Booking
                                                    </DropdownMenuItem>
                                                )}
                                                {booking.status === 'confirmed' && (
                                                    <DropdownMenuItem onClick={() => updateStatus(booking.$id, 'completed')}>
                                                        <Check className="w-4 h-4 mr-2 text-green-500" aria-hidden="true" />
                                                        Mark Complete
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => { setSelectedBooking(booking); setIsCancelDialogOpen(true); }}
                                                >
                                                    <X className="w-4 h-4 mr-2" aria-hidden="true" />
                                                    {booking.status === 'pending' ? 'Reject Booking' : 'Cancel Booking'}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Cancel/Reject Dialog */}
            <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedBooking?.status === 'pending' ? 'Reject Booking' : 'Cancel Booking'}</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to {selectedBooking?.status === 'pending' ? 'reject' : 'cancel'} the booking with {selectedBooking?.guestName}?
                            They will be notified via email.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)} className="rounded-full">
                            Keep Booking
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => selectedBooking && updateStatus(selectedBooking.$id, 'cancelled')}
                            className="rounded-full"
                        >
                            {selectedBooking?.status === 'pending' ? 'Reject Booking' : 'Cancel Booking'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
