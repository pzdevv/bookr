'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { useAuth } from '@/lib/hooks/use-auth';
import { availabilityService, Availability } from '@/lib/appwrite/database';
import { getDayName } from '@/lib/utils';

const DAYS = [1, 2, 3, 4, 5, 6, 0]; // Monday to Sunday

export default function AvailabilityPage() {
    const { userProfile } = useAuth();
    const [availability, setAvailability] = useState<Availability[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => { if (userProfile) loadAvailability(); }, [userProfile]);

    const loadAvailability = async () => {
        if (!userProfile) return;
        try { const data = await availabilityService.listByUser(userProfile.$id); setAvailability(data); }
        catch (error) { console.error('Error:', error); }
        finally { setIsLoading(false); }
    };

    const getDayAvailability = (day: number) => availability.find((a) => a.day === day);

    const toggleDay = async (day: number) => {
        if (!userProfile) return;
        const existing = getDayAvailability(day);
        setIsSaving(true);
        try {
            if (existing) { await availabilityService.update(existing.$id, { isEnabled: !existing.isEnabled }); }
            else { await availabilityService.create({ userId: userProfile.$id, day, startTime: '09:00', endTime: '17:00', isEnabled: true }); }
            loadAvailability();
        } catch (error) { console.error('Error:', error); }
        finally { setIsSaving(false); }
    };

    const updateTime = async (day: number, field: 'startTime' | 'endTime', value: string) => {
        const existing = getDayAvailability(day);
        if (!existing) return;
        setIsSaving(true);
        try { await availabilityService.update(existing.$id, { [field]: value }); loadAvailability(); }
        catch (error) { console.error('Error:', error); }
        finally { setIsSaving(false); }
    };

    const copyToWeekdays = async () => {
        if (!userProfile) return;
        const monday = getDayAvailability(1);
        if (!monday) return;
        setIsSaving(true);
        try {
            for (const day of [2, 3, 4, 5]) {
                const existing = getDayAvailability(day);
                if (existing) {
                    await availabilityService.update(existing.$id, { startTime: monday.startTime, endTime: monday.endTime, isEnabled: true });
                } else {
                    await availabilityService.create({ userId: userProfile.$id, day, startTime: monday.startTime, endTime: monday.endTime, isEnabled: true });
                }
            }
            loadAvailability();
        } catch (error) { console.error('Error:', error); }
        finally { setIsSaving(false); }
    };

    const timezone = userProfile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    return (
        <DashboardLayout>
            {/* Header */}
            <header className="sticky top-0 z-10 px-6 lg:px-8 py-5 bg-white/60 backdrop-blur-xl border-b border-white/30">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1c180c]">Availability</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Set when you're available for bookings</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={copyToWeekdays} disabled={isSaving} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/60 backdrop-blur border border-white/50 text-sm font-medium text-gray-600 hover:bg-white/80 transition-all disabled:opacity-50">
                            <span className="material-symbols-outlined text-lg">content_copy</span>
                            Copy to Weekdays
                        </button>
                        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium ${isSaving ? 'bg-[#fbbd23]/20 text-[#1c180c]' : 'bg-green-100 text-green-700'}`}>
                            <span className="material-symbols-outlined text-lg">{isSaving ? 'sync' : 'check_circle'}</span>
                            {isSaving ? 'Saving...' : 'Saved'}
                        </div>
                    </div>
                </div>
            </header>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#fbbd23] to-orange-500 flex items-center justify-center animate-pulse">
                            <span className="material-symbols-outlined text-white text-2xl">schedule</span>
                        </div>
                        <p className="text-gray-400 text-sm">Loading availability...</p>
                    </div>
                </div>
            ) : (
                <div className="p-6 lg:p-8 max-w-4xl space-y-5">
                    {/* Timezone Card */}
                    <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 shadow-lg shadow-black/5 border border-white/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Timezone</p>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-white/80 rounded-xl shadow-sm">
                                        <span className="material-symbols-outlined text-gray-500 text-lg">public</span>
                                        <span className="font-semibold text-[#1c180c]">{timezone}</span>
                                    </div>
                                    <span className="text-xs text-gray-400 hidden sm:block">All times are displayed in this timezone</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400/20 to-blue-500/10 flex items-center justify-center">
                                <span className="text-2xl">🌍</span>
                            </div>
                        </div>
                    </div>

                    {/* Weekly Schedule */}
                    <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/5 border border-white/50 overflow-hidden">
                        {DAYS.map((day, index) => {
                            const dayAvail = getDayAvailability(day);
                            const isEnabled = dayAvail?.isEnabled ?? false;
                            const isWeekend = day === 0 || day === 6;

                            return (
                                <div key={day} className={`flex items-center gap-4 px-5 py-4 ${index !== DAYS.length - 1 ? 'border-b border-gray-100/50' : ''} ${isWeekend && !isEnabled ? 'bg-gray-50/50' : ''}`}>
                                    {/* Toggle */}
                                    <button
                                        onClick={() => toggleDay(day)}
                                        disabled={isSaving}
                                        className={`w-12 h-7 rounded-full transition-all relative flex-shrink-0 ${isEnabled ? 'bg-gradient-to-r from-[#fbbd23] to-orange-500 shadow-md shadow-[#fbbd23]/30' : 'bg-gray-200'}`}
                                    >
                                        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${isEnabled ? 'left-6' : 'left-1'}`} />
                                    </button>

                                    {/* Day Name */}
                                    <span className={`font-semibold w-28 ${isEnabled ? 'text-[#1c180c]' : 'text-gray-400'}`}>
                                        {getDayName(day)}
                                    </span>

                                    {/* Time Inputs */}
                                    {isEnabled && dayAvail ? (
                                        <div className="flex items-center gap-3 flex-1">
                                            <input
                                                type="time"
                                                value={dayAvail.startTime}
                                                onChange={(e) => updateTime(day, 'startTime', e.target.value)}
                                                className="px-4 py-2.5 rounded-xl bg-white/80 border border-white/50 shadow-sm text-sm font-medium w-32 focus:ring-2 focus:ring-[#fbbd23]/30"
                                                disabled={isSaving}
                                            />
                                            <span className="text-gray-300">—</span>
                                            <input
                                                type="time"
                                                value={dayAvail.endTime}
                                                onChange={(e) => updateTime(day, 'endTime', e.target.value)}
                                                className="px-4 py-2.5 rounded-xl bg-white/80 border border-white/50 shadow-sm text-sm font-medium w-32 focus:ring-2 focus:ring-[#fbbd23]/30"
                                                disabled={isSaving}
                                            />
                                            <button
                                                className="ml-auto p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                onClick={() => toggleDay(day)}
                                                title="Remove"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-sm italic">Unavailable</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Quick Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 shadow-lg shadow-black/5 border border-white/50">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400/20 to-purple-500/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-purple-500 text-xl">event_note</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#1c180c]">Date Overrides</h3>
                                    <p className="text-xs text-gray-400">Set specific dates with different hours</p>
                                </div>
                            </div>
                            <button className="w-full p-4 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-[#fbbd23] hover:text-[#fbbd23] transition-colors">
                                + Add an override
                            </button>
                        </div>

                        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 shadow-lg shadow-black/5 border border-white/50">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400/20 to-green-500/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-green-500 text-xl">timer</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#1c180c]">Buffer Time</h3>
                                    <p className="text-xs text-gray-400">Add time between meetings</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-400 mb-1.5 block">Before</label>
                                    <select className="w-full px-4 py-2.5 rounded-xl bg-white/80 border border-white/50 shadow-sm text-sm font-medium">
                                        <option value="0">0 mins</option>
                                        <option value="5">5 mins</option>
                                        <option value="10">10 mins</option>
                                        <option value="15">15 mins</option>
                                        <option value="30">30 mins</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1.5 block">After</label>
                                    <select className="w-full px-4 py-2.5 rounded-xl bg-white/80 border border-white/50 shadow-sm text-sm font-medium">
                                        <option value="0">0 mins</option>
                                        <option value="5">5 mins</option>
                                        <option value="10">10 mins</option>
                                        <option value="15">15 mins</option>
                                        <option value="30">30 mins</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
