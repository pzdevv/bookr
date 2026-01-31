'use client';

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { AvailabilityPageSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/hooks/use-auth';
import { availabilityService, Availability } from '@/lib/appwrite/database';
import { getDayName } from '@/lib/utils';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const DAYS = [1, 2, 3, 4, 5, 6, 0]; // Monday to Sunday

export default function AvailabilityPage() {
    const { userProfile } = useAuth();
    const [availability, setAvailability] = useState<Availability[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // GSAP refs
    const containerRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLElement>(null);

    useEffect(() => { if (userProfile) loadAvailability(); }, [userProfile]);

    // GSAP Animations
    useEffect(() => {
        if (isLoading) return;

        const ctx = gsap.context(() => {
            // Header animation
            if (headerRef.current) {
                gsap.fromTo(headerRef.current,
                    { opacity: 0, y: -30 },
                    { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }
                );
            }

            // Container sections
            if (containerRef.current) {
                const sections = containerRef.current.querySelectorAll('.animate-section');

                sections.forEach((section, index) => {
                    gsap.fromTo(section,
                        {
                            opacity: 0,
                            y: 50,
                            scale: 0.95
                        },
                        {
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            duration: 0.7,
                            ease: 'power3.out',
                            delay: index * 0.15
                        }
                    );
                });

                // Day rows - staggered entrance
                const dayRows = containerRef.current.querySelectorAll('.day-row');
                gsap.fromTo(dayRows,
                    {
                        opacity: 0,
                        x: -40,
                        rotateY: -10
                    },
                    {
                        opacity: 1,
                        x: 0,
                        rotateY: 0,
                        duration: 0.6,
                        stagger: 0.08,
                        ease: 'power2.out',
                        delay: 0.3
                    }
                );

                // Quick settings cards
                const quickCards = containerRef.current.querySelectorAll('.quick-card');
                gsap.fromTo(quickCards,
                    {
                        opacity: 0,
                        y: 60,
                        scale: 0.9
                    },
                    {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        duration: 0.7,
                        stagger: 0.15,
                        ease: 'back.out(1.4)',
                        scrollTrigger: {
                            trigger: quickCards[0]?.parentElement,
                            start: 'top 85%',
                            toggleActions: 'play none none reverse'
                        }
                    }
                );
            }
        }, containerRef);

        return () => ctx.revert();
    }, [isLoading]);

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

        // Animate toggle
        gsap.to(`.toggle-${day}`, {
            scale: 1.2,
            duration: 0.15,
            yoyo: true,
            repeat: 1,
            ease: 'power2.out'
        });

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

        // Animate copy action
        gsap.to('.copy-btn', {
            scale: 1.1,
            duration: 0.15,
            yoyo: true,
            repeat: 1,
            ease: 'power2.out'
        });

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

            // Success animation - highlight copied rows
            gsap.fromTo('.day-row',
                { backgroundColor: 'rgba(133, 0, 0, 0.1)' },
                { backgroundColor: 'transparent', duration: 1, ease: 'power2.out' }
            );
        } catch (error) { console.error('Error:', error); }
        finally { setIsSaving(false); }
    };

    const timezone = userProfile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    return (
        <DashboardLayout>
            {/* Header */}
            <header ref={headerRef} className="sticky top-0 z-10 px-6 lg:px-8 py-5 bg-white border-b border-[#850000]/5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1d0c0c]">Availability</h1>
                        <p className="text-[#6b4444] text-sm mt-0.5">Set when you're available for bookings</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={copyToWeekdays} disabled={isSaving} className="copy-btn flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-[#850000]/10 text-sm font-medium text-[#6b4444] shadow-[3px_3px_0px_0px_rgba(133,0,0,0.1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-50">
                            <span className="material-symbols-outlined text-lg">content_copy</span>
                            Copy to Weekdays
                        </button>
                        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${isSaving ? 'bg-[#850000]/10 text-[#850000]' : 'bg-green-100 text-green-700'}`}>
                            <span className="material-symbols-outlined text-lg">{isSaving ? 'sync' : 'check_circle'}</span>
                            {isSaving ? 'Saving...' : 'Saved'}
                        </div>
                    </div>
                </div>
            </header>

            {isLoading ? (
                <AvailabilityPageSkeleton />
            ) : (
                <div ref={containerRef} className="p-6 lg:p-8 max-w-4xl space-y-5" style={{ perspective: '1000px' }}>
                    {/* Timezone Card */}
                    <div className="animate-section bg-white rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(133,0,0,0.1)] border border-[#850000]/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-[#6b4444] uppercase tracking-wider mb-2">Timezone</p>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-[#850000]/5 rounded-lg border border-[#850000]/10">
                                        <span className="material-symbols-outlined text-[#850000] text-lg">public</span>
                                        <span className="font-semibold text-[#1d0c0c]">{timezone}</span>
                                    </div>
                                    <span className="text-xs text-[#6b4444] hidden sm:block">All times are displayed in this timezone</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-[#850000]/10 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(133,0,0,0.1)]">
                                <span className="text-2xl">🌍</span>
                            </div>
                        </div>
                    </div>

                    {/* Weekly Schedule */}
                    <div className="animate-section bg-white rounded-xl shadow-[4px_4px_0px_0px_rgba(133,0,0,0.1)] border border-[#850000]/5 overflow-hidden" style={{ transformStyle: 'preserve-3d' }}>
                        {DAYS.map((day, index) => {
                            const dayAvail = getDayAvailability(day);
                            const isEnabled = dayAvail?.isEnabled ?? false;
                            const isWeekend = day === 0 || day === 6;

                            return (
                                <div key={day} className={`day-row flex items-center gap-4 px-5 py-4 ${index !== DAYS.length - 1 ? 'border-b border-[#850000]/5' : ''} ${isWeekend && !isEnabled ? 'bg-[#850000]/[0.02]' : ''}`}>
                                    {/* Toggle */}
                                    <button
                                        onClick={() => toggleDay(day)}
                                        disabled={isSaving}
                                        className={`toggle-${day} w-12 h-7 rounded-full transition-all relative flex-shrink-0 ${isEnabled ? 'bg-[#850000] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]' : 'bg-gray-200'}`}
                                    >
                                        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${isEnabled ? 'left-6' : 'left-1'}`} />
                                    </button>

                                    {/* Day Name */}
                                    <span className={`font-semibold w-28 ${isEnabled ? 'text-[#1d0c0c]' : 'text-[#6b4444]'}`}>
                                        {getDayName(day)}
                                    </span>

                                    {/* Time Inputs */}
                                    {isEnabled && dayAvail ? (
                                        <div className="flex items-center gap-3 flex-1">
                                            <input
                                                type="time"
                                                value={dayAvail.startTime}
                                                onChange={(e) => updateTime(day, 'startTime', e.target.value)}
                                                className="px-4 py-2.5 rounded-lg bg-white border border-[#850000]/10 shadow-[2px_2px_0px_0px_rgba(133,0,0,0.05)] text-sm font-medium w-32 focus:ring-2 focus:ring-[#850000]/20 focus:border-[#850000] transition-all"
                                                disabled={isSaving}
                                            />
                                            <span className="text-[#6b4444]/30">—</span>
                                            <input
                                                type="time"
                                                value={dayAvail.endTime}
                                                onChange={(e) => updateTime(day, 'endTime', e.target.value)}
                                                className="px-4 py-2.5 rounded-lg bg-white border border-[#850000]/10 shadow-[2px_2px_0px_0px_rgba(133,0,0,0.05)] text-sm font-medium w-32 focus:ring-2 focus:ring-[#850000]/20 focus:border-[#850000] transition-all"
                                                disabled={isSaving}
                                            />
                                            <button
                                                className="ml-auto p-2 text-[#6b4444]/30 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                onClick={() => toggleDay(day)}
                                                title="Remove"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-[#6b4444] text-sm italic">Unavailable</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Quick Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="quick-card bg-white rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(133,0,0,0.1)] border border-[#850000]/5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-[#850000] flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                                    <span className="material-symbols-outlined text-white text-xl">event_note</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#1d0c0c]">Date Overrides</h3>
                                    <p className="text-xs text-[#6b4444]">Set specific dates with different hours</p>
                                </div>
                            </div>
                            <button className="w-full p-4 border-2 border-dashed border-[#850000]/20 rounded-lg text-sm text-[#6b4444] hover:border-[#850000] hover:text-[#850000] hover:bg-[#850000]/5 transition-colors">
                                + Add an override
                            </button>
                        </div>

                        <div className="quick-card bg-white rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(133,0,0,0.1)] border border-[#850000]/5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-[#6b0000] flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                                    <span className="material-symbols-outlined text-white text-xl">timer</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#1d0c0c]">Buffer Time</h3>
                                    <p className="text-xs text-[#6b4444]">Add time between meetings</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-[#6b4444] mb-1.5 block">Before</label>
                                    <select className="w-full px-4 py-2.5 rounded-lg bg-white border border-[#850000]/10 shadow-[2px_2px_0px_0px_rgba(133,0,0,0.05)] text-sm font-medium focus:ring-2 focus:ring-[#850000]/20 focus:border-[#850000] transition-all">
                                        <option value="0">0 mins</option>
                                        <option value="5">5 mins</option>
                                        <option value="10">10 mins</option>
                                        <option value="15">15 mins</option>
                                        <option value="30">30 mins</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-[#6b4444] mb-1.5 block">After</label>
                                    <select className="w-full px-4 py-2.5 rounded-lg bg-white border border-[#850000]/10 shadow-[2px_2px_0px_0px_rgba(133,0,0,0.05)] text-sm font-medium focus:ring-2 focus:ring-[#850000]/20 focus:border-[#850000] transition-all">
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
