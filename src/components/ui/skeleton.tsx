'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-lg bg-gray-200",
                className
            )}
        />
    );
}

// Dashboard Stats Skeleton
export function DashboardStatsSkeleton() {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-3 w-24" />
                </div>
            ))}
        </div>
    );
}

// Booking Card Skeleton
export function BookingCardSkeleton() {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 sm:px-6 py-5 border-b border-gray-50">
            <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-40" />
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-12" />
                    </div>
                </div>
            </div>
            <div className="flex gap-2 self-end sm:self-auto">
                <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
        </div>
    );
}

// Booking List Skeleton
export function BookingListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {[...Array(count)].map((_, i) => (
                <BookingCardSkeleton key={i} />
            ))}
        </div>
    );
}

// Dashboard Main Page Skeleton
export function DashboardPageSkeleton() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
            </div>

            {/* Share Link Card */}
            <div className="bg-gradient-to-r from-[#850000]/5 to-[#850000]/10 rounded-xl p-5 border border-[#850000]/10">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        <Skeleton className="w-10 h-10 rounded-lg bg-[#850000]/20" />
                        <div className="flex-1">
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-5 w-64" />
                        </div>
                    </div>
                    <Skeleton className="h-10 w-24 rounded-lg" />
                </div>
            </div>

            {/* Stats */}
            <DashboardStatsSkeleton />

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Pending Requests */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-5 w-8 rounded-full" />
                    </div>
                    <div className="divide-y divide-gray-50">
                        {[...Array(3)].map((_, i) => (
                            <BookingCardSkeleton key={i} />
                        ))}
                    </div>
                </div>

                {/* Upcoming Calls */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                        <Skeleton className="h-6 w-36" />
                        <Skeleton className="h-5 w-8 rounded-full" />
                    </div>
                    <div className="divide-y divide-gray-50">
                        {[...Array(3)].map((_, i) => (
                            <BookingCardSkeleton key={i} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Bookings Page Skeleton
export function BookingsPageSkeleton() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <Skeleton className="h-8 w-36 mb-2" />
                    <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-10 w-24 rounded-lg" />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl overflow-x-auto">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-28 rounded-lg" />
                ))}
            </div>

            {/* Booking List */}
            <BookingListSkeleton count={5} />
        </div>
    );
}

// Event Types Page Skeleton
export function EventTypesPageSkeleton() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <Skeleton className="h-8 w-40 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-36 rounded-lg" />
            </div>

            {/* Event Type Cards */}
            <div className="grid gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1">
                                <Skeleton className="w-4 h-4 rounded-full mt-1" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-6 w-48" />
                                    <Skeleton className="h-4 w-full max-w-md" />
                                    <div className="flex items-center gap-4 pt-2">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="w-9 h-9 rounded-lg" />
                                <Skeleton className="w-9 h-9 rounded-lg" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Call History Page Skeleton
export function CallHistoryPageSkeleton() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <Skeleton className="h-8 w-36 mb-2" />
                    <Skeleton className="h-4 w-56" />
                </div>
            </div>

            {/* Call History Cards */}
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Skeleton className="w-12 h-12 rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-36" />
                                    <Skeleton className="h-4 w-48" />
                                </div>
                            </div>
                            <div className="text-right space-y-2">
                                <Skeleton className="h-4 w-20 ml-auto" />
                                <Skeleton className="h-4 w-16 ml-auto" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Availability Page Skeleton
export function AvailabilityPageSkeleton() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <Skeleton className="h-8 w-36 mb-2" />
                    <Skeleton className="h-4 w-56" />
                </div>
            </div>

            {/* Days Grid */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, i) => (
                    <div key={day} className={`flex items-center justify-between p-4 ${i < 6 ? 'border-b border-gray-50' : ''}`}>
                        <div className="flex items-center gap-4">
                            <Skeleton className="w-10 h-5 rounded-full" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-9 w-24 rounded-lg" />
                            <Skeleton className="h-5 w-4" />
                            <Skeleton className="h-9 w-24 rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// User Booking Page Skeleton
export function UserBookingPageSkeleton() {
    return (
        <div className="min-h-screen bg-[#fcf8f8]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.02) 1px, transparent 0)', backgroundSize: '32px 32px' }}>
            {/* Header */}
            <header className="flex items-center justify-between px-6 md:px-10 py-5 bg-white/60 backdrop-blur-xl border-b border-[#850000]/5">
                <Skeleton className="h-8 w-28" />
                <div className="flex gap-3">
                    <Skeleton className="h-10 w-20 rounded-lg" />
                    <Skeleton className="h-10 w-28 rounded-lg" />
                </div>
            </header>

            <main className="max-w-2xl mx-auto py-16 px-4">
                {/* Profile */}
                <div className="text-center mb-12">
                    <Skeleton className="w-32 h-32 rounded-2xl mx-auto mb-6" />
                    <Skeleton className="h-8 w-48 mx-auto mb-2" />
                    <Skeleton className="h-5 w-64 mx-auto" />
                </div>

                {/* Event Types */}
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white/80 backdrop-blur-xl rounded-xl border border-[#850000]/5 p-6 shadow-lg">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4 flex-1">
                                    <Skeleton className="w-4 h-4 rounded-full mt-1.5" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-6 w-48" />
                                        <Skeleton className="h-4 w-full max-w-sm" />
                                        <div className="flex items-center gap-6 mt-4">
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-4 w-24" />
                                        </div>
                                    </div>
                                </div>
                                <Skeleton className="w-10 h-10 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}

// Settings Page Skeleton
export function SettingsPageSkeleton() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-56" />
            </div>

            {/* Profile Section */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
                <Skeleton className="h-6 w-40 mb-6" />
                <div className="flex items-start gap-6 mb-6">
                    <Skeleton className="w-24 h-24 rounded-xl" />
                    <div className="flex-1 space-y-4">
                        <div>
                            <Skeleton className="h-4 w-16 mb-2" />
                            <Skeleton className="h-10 w-full rounded-lg" />
                        </div>
                        <div>
                            <Skeleton className="h-4 w-16 mb-2" />
                            <Skeleton className="h-10 w-full rounded-lg" />
                        </div>
                    </div>
                </div>
                <div>
                    <Skeleton className="h-4 w-12 mb-2" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                </div>
            </div>

            {/* Timezone Section */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-10 w-full rounded-lg" />
            </div>
        </div>
    );
}
