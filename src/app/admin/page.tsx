'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, TrendingUp, BarChart3, ArrowUpRight, Clock } from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { bookingService, userService, eventTypeService, Booking, User, EventType } from '@/lib/appwrite/database';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: { value: string; positive: boolean };
}

function StatCard({ title, value, subtitle, icon: Icon, trend }: StatCardProps) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-white border-gray-100 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                            <p className="text-3xl font-bold text-gray-900">{value}</p>
                            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-primary/10">
                            <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
                        </div>
                    </div>
                    {trend && (
                        <div className={`mt-3 text-sm font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                            {trend.positive ? '↑' : '↓'} {trend.value}
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({ users: 0, bookings: 0, eventTypes: 0, activeUsers: 0 });
    const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
    const [recentUsers, setRecentUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [users, bookings, eventTypes] = await Promise.all([
                    userService.list(),
                    bookingService.list(),
                    eventTypeService.list(),
                ]);
                setStats({
                    users: users.length,
                    bookings: bookings.length,
                    eventTypes: eventTypes.length,
                    activeUsers: users.length,
                });
                setRecentBookings(bookings.slice(0, 5));
                setRecentUsers(users.slice(0, 5));
            } catch (error) { console.error('Error:', error); }
            finally { setIsLoading(false); }
        };
        loadData();
    }, []);

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
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-500 mt-1">Overview of your platform</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
                <StatCard title="Total Users" value={stats.users} subtitle="Registered accounts" icon={Users} trend={{ value: '+12%', positive: true }} />
                <StatCard title="Total Bookings" value={stats.bookings} subtitle="All time bookings" icon={Calendar} trend={{ value: '+8%', positive: true }} />
                <StatCard title="Event Types" value={stats.eventTypes} subtitle="Active events" icon={Clock} />
                <StatCard title="Active Users" value={stats.activeUsers} subtitle="Last 30 days" icon={TrendingUp} />
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Bookings */}
                <Card className="border-gray-100">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Recent Bookings</CardTitle>
                        <Link href="/admin/bookings" className="text-sm text-primary hover:underline flex items-center gap-1">
                            View All <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                        </Link>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {recentBookings.length === 0 ? (
                            <p className="text-gray-500 text-sm py-4 text-center">No bookings yet</p>
                        ) : (
                            recentBookings.map((booking) => (
                                <div key={booking.$id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                                    <Avatar className="w-10 h-10 border">
                                        <AvatarFallback className="bg-primary/10 text-primary text-sm">{booking.guestName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{booking.guestName}</p>
                                        <p className="text-xs text-gray-500">{new Date(booking.slotTime).toLocaleDateString()}</p>
                                    </div>
                                    <Badge variant={booking.status === 'confirmed' ? 'success' : 'secondary'} className="text-xs">
                                        {booking.status}
                                    </Badge>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Recent Users */}
                <Card className="border-gray-100">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Recent Users</CardTitle>
                        <Link href="/admin/users" className="text-sm text-primary hover:underline flex items-center gap-1">
                            View All <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                        </Link>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {recentUsers.length === 0 ? (
                            <p className="text-gray-500 text-sm py-4 text-center">No users yet</p>
                        ) : (
                            recentUsers.map((user) => (
                                <div key={user.$id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                                    <Avatar className="w-10 h-10 border">
                                        <AvatarImage src={user.avatar} alt={user.name} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-sm">{user.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                    </div>
                                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                                        {user.role}
                                    </Badge>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
