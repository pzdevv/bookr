'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { availabilityService, userService, Availability, User } from '@/lib/appwrite/database';
import { getDayName, formatTime } from '@/lib/utils';

export default function AdminAvailabilityPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [availabilities, setAvailabilities] = useState<{ [userId: string]: Availability[] }>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const usersData = await userService.list();
            setUsers(usersData);
            const availData: { [userId: string]: Availability[] } = {};
            for (const user of usersData) {
                availData[user.$id] = await availabilityService.listByUser(user.$id);
            }
            setAvailabilities(availData);
        } catch (error) { console.error('Error loading data:', error); }
        finally { setIsLoading(false); }
    };

    const toggleAvailability = async (availability: Availability) => {
        try {
            await availabilityService.update(availability.$id, { isEnabled: !availability.isEnabled });
            loadData();
        } catch (error) { console.error('Error toggling:', error); }
    };

    const filteredUsers = users.filter((u) => u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()));

    if (isLoading) return <DashboardLayout isAdmin><div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;

    return (
        <DashboardLayout isAdmin>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div><h1 className="text-3xl font-bold">Availability Management</h1><p className="text-muted-foreground mt-1">View and manage user availability</p></div>

                <Card><CardContent className="p-4">
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
                </CardContent></Card>

                <div className="space-y-6">
                    {filteredUsers.map((user) => (
                        <Card key={user.$id}>
                            <CardHeader><CardTitle className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">{user.name?.charAt(0) || 'U'}</div>
                                <div><p className="font-semibold">{user.name}</p><p className="text-sm text-muted-foreground font-normal">{user.email}</p></div>
                            </CardTitle></CardHeader>
                            <CardContent>
                                {!availabilities[user.$id]?.length ? <p className="text-muted-foreground text-center py-4">No availability set</p> : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                        {availabilities[user.$id].map((avail) => (
                                            <div key={avail.$id} className={`p-3 rounded-xl border ${avail.isEnabled ? 'border-primary/30 bg-primary/5' : 'border-border opacity-60'}`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium">{getDayName(avail.day)}</span>
                                                    <Switch checked={avail.isEnabled} onCheckedChange={() => toggleAvailability(avail)} />
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="w-4 h-4" />{formatTime(avail.startTime)} - {formatTime(avail.endTime)}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </motion.div>
        </DashboardLayout>
    );
}
