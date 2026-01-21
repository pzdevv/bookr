'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventTypeService, availabilityService, bookingService, userService, generateCallRoomId, EventType, Availability, User } from '@/lib/appwrite/database';
import { formatTime, getTimeSlots, getUserTimezone } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';

export default function BookEventPage({ params }: { params: Promise<{ username: string; eventSlug: string }> }) {
    const { username, eventSlug } = use(params);
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [eventType, setEventType] = useState<EventType | null>(null);
    const [availability, setAvailability] = useState<Availability[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', notes: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<1 | 2>(1);
    const guestTimezone = getUserTimezone();

    useEffect(() => {
        const loadData = async () => {
            try {
                let foundUser = await userService.getByUsername(username);
                if (!foundUser) foundUser = await userService.getByNameSlug(username);
                if (foundUser) {
                    setUser(foundUser);
                    const eventTypes = await eventTypeService.listByUser(foundUser.$id);
                    const activeEvents = eventTypes.filter(e => e.isActive);
                    let foundEvent = activeEvents.find((e) => e.slug === eventSlug);
                    if (!foundEvent && activeEvents.length > 0) foundEvent = activeEvents[0];
                    if (foundEvent) {
                        setEventType(foundEvent);
                        const avail = await availabilityService.listByUser(foundUser.$id);
                        setAvailability(avail.filter((a) => a.isEnabled));
                    }
                }
            } catch (err) { console.error('Error:', err); }
            finally { setIsLoading(false); }
        };
        loadData();
    }, [username, eventSlug]);

    useEffect(() => {
        if (selectedDate && eventType) {
            const dayOfWeek = selectedDate.getDay();
            const dayAvail = availability.find((a) => a.day === dayOfWeek);
            if (dayAvail) {
                const slots = getTimeSlots(dayAvail.startTime, dayAvail.endTime, eventType.duration, eventType.buffer);
                setAvailableSlots(slots);
            } else {
                setAvailableSlots([]);
            }
            setSelectedTime(null);
        }
    }, [selectedDate, eventType, availability]);

    const days = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const result: (Date | null)[] = [];
        for (let i = 0; i < firstDay.getDay(); i++) result.push(null);
        for (let i = 1; i <= lastDay.getDate(); i++) result.push(new Date(year, month, i));
        return result;
    }, [currentMonth]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isDayAvailable = (date: Date) => {
        if (date < today) return false;
        return availability.some((a) => a.day === date.getDay());
    };

    const handleTimeSelect = (slot: string) => {
        setSelectedTime(slot);
        setStep(2);
    };

    const handleSubmit = async () => {
        if (!user || !eventType || !selectedDate || !selectedTime) return;
        if (!formData.name.trim() || !formData.email.trim()) {
            setError('Please fill in all required fields');
            return;
        }
        setIsSubmitting(true);
        setError('');
        try {
            const slotDateTime = new Date(selectedDate);
            const [hours, mins] = selectedTime.split(':').map(Number);
            slotDateTime.setHours(hours, mins, 0, 0);

            const isAvailable = await bookingService.isSlotAvailable(user.$id, slotDateTime.toISOString(), eventType.duration);
            if (!isAvailable) {
                setError('Sorry, this time slot is no longer available. Please select another time.');
                setIsSubmitting(false);
                return;
            }

            const callRoomId = generateCallRoomId();
            await bookingService.create({
                userId: user.$id,
                eventTypeId: eventType.$id,
                guestName: formData.name.trim(),
                guestEmail: formData.email.trim().toLowerCase(),
                slotTime: slotDateTime.toISOString(),
                status: 'confirmed',
                notes: formData.notes.trim(),
                callRoomId,
            });
            router.push(`/book/${username}/${eventSlug}/confirm?date=${slotDateTime.toISOString()}&name=${encodeURIComponent(formData.name)}&duration=${eventType.duration}&room=${callRoomId}`);
        } catch (err) {
            console.error('Error booking:', err);
            setError('Failed to create booking. Please try again.');
        }
        finally { setIsSubmitting(false); }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#fcf8f8] flex items-center justify-center" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.02) 1px, transparent 0)', backgroundSize: '32px 32px' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="w-16 h-16 rounded-xl bg-[#850000] flex items-center justify-center animate-pulse shadow-2xl shadow-[#850000]/30">
                        <span className="material-symbols-outlined text-white text-3xl">calendar_today</span>
                    </div>
                    <p className="text-[#6b4444] font-medium">Loading booking...</p>
                </motion.div>
            </div>
        );
    }

    if (!eventType || !user) {
        return (
            <div className="min-h-screen bg-[#fcf8f8] flex items-center justify-center p-4" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.02) 1px, transparent 0)', backgroundSize: '32px 32px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-gray-200/50 p-12 max-w-md text-center border border-[#850000]/5"
                >
                    <div className="w-24 h-24 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-red-400 text-5xl">event_busy</span>
                    </div>
                    <h1 className="text-3xl font-bold text-[#1d0c0c] mb-3">Not Found</h1>
                    <p className="text-[#6b4444] mb-8">This event doesn't exist or has been removed.</p>
                    <Link href="/" className="inline-flex items-center gap-2 px-8 py-4 bg-[#850000] text-white font-bold rounded-lg hover:bg-[#6b0000] hover:shadow-2xl hover:shadow-[#850000]/30 transition-all">
                        <span className="material-symbols-outlined">home</span>
                        Back to Home
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fcf8f8] text-[#1d0c0c] font-[Inter,sans-serif]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.02) 1px, transparent 0)', backgroundSize: '32px 32px' }}>
            {/* Subtle Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-[#850000]/5 rounded-full blur-[200px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] bg-[#850000]/3 rounded-full blur-[150px]" />
            </div>

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5 bg-white/60 backdrop-blur-xl border-b border-[#850000]/5">
                <Logo size="sm" href="/" />
                <div className="flex gap-3">
                    <Link href="/auth/login" className="px-5 py-2.5 text-sm font-medium text-[#6b4444] hover:text-[#1d0c0c] transition-colors">
                        Log In
                    </Link>
                    <Link href="/auth/signup" className="px-6 py-2.5 bg-[#850000] text-white text-sm font-bold rounded-lg hover:bg-[#6b0000] hover:shadow-lg hover:shadow-[#850000]/30 transition-all">
                        Sign Up Free
                    </Link>
                </div>
            </header>

            <main className="relative z-10 max-w-5xl mx-auto py-6 px-4 md:px-6">
                {/* Progress Indicator */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <motion.div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= 1 ? 'bg-[#850000] text-white shadow-lg shadow-[#850000]/30' : 'bg-gray-100 text-gray-400'}`}
                            animate={{ scale: step === 1 ? [1, 1.1, 1] : 1 }}
                            transition={{ repeat: step === 1 ? Infinity : 0, duration: 2 }}
                        >
                            1
                        </motion.div>
                        <span className={`font-semibold ${step >= 1 ? 'text-[#1d0c0c]' : 'text-gray-400'}`}>Select Time</span>
                    </div>
                    <div className={`w-20 h-1 rounded-full transition-all ${step >= 2 ? 'bg-[#850000]' : 'bg-gray-200'}`} />
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= 2 ? 'bg-[#850000] text-white shadow-lg shadow-[#850000]/30' : 'bg-gray-100 text-gray-400'}`}>
                            2
                        </div>
                        <span className={`font-semibold ${step >= 2 ? 'text-[#1d0c0c]' : 'text-gray-400'}`}>Your Details</span>
                    </div>
                </div>

                {/* Main Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-gray-200/50 overflow-hidden border border-[#850000]/5"
                >
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex flex-col lg:flex-row"
                            >
                                {/* Left: Profile */}
                                <aside className="lg:w-[300px] p-8 border-b lg:border-b-0 lg:border-r border-[#850000]/5 bg-gradient-to-br from-[#850000]/[0.02] to-white">
                                    <div className="flex flex-col gap-5">
                                        <div className="relative w-fit">
                                            <div
                                                className="w-20 h-20 rounded-xl bg-[#850000]/10 flex items-center justify-center shadow-xl relative overflow-hidden"
                                                style={user.avatar ? { backgroundImage: `url("${user.avatar}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                                            >
                                                {!user.avatar && <span className="text-[#850000] text-3xl font-bold">{user.name?.charAt(0)}</span>}
                                            </div>
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-[3px] border-white shadow-md"
                                            >
                                                <span className="material-symbols-outlined text-white text-sm">check</span>
                                            </motion.div>
                                        </div>
                                        <div>
                                            <p className="text-[#6b4444] text-xs font-bold uppercase tracking-widest mb-1">{user.name}</p>
                                            <h1 className="text-2xl font-bold text-[#1d0c0c]">{eventType.title}</h1>
                                        </div>
                                        <div className="space-y-2.5">
                                            {[
                                                { icon: 'schedule', label: `${eventType.duration} min`, color: 'text-[#850000]', bg: 'bg-[#850000]/10' },
                                                { icon: 'videocam', label: 'Video Call', color: 'text-blue-600', bg: 'bg-blue-50' },
                                                { icon: 'public', label: guestTimezone.split('/').pop()?.replace('_', ' ') || guestTimezone, color: 'text-green-600', bg: 'bg-green-50' },
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 ${item.bg} rounded-lg flex items-center justify-center`}>
                                                        <span className={`material-symbols-outlined ${item.color} text-lg`}>{item.icon}</span>
                                                    </div>
                                                    <span className="text-[#6b4444] text-sm font-medium">{item.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {eventType.description && (
                                            <p className="text-[#6b4444] text-sm leading-relaxed pt-4 border-t border-[#850000]/5">
                                                {eventType.description}
                                            </p>
                                        )}
                                    </div>
                                </aside>

                                {/* Center: Calendar */}
                                <section className="flex-1 p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-[#850000]/10 rounded-lg flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[#850000]">calendar_month</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-[#1d0c0c]">Select a Date</h3>
                                    </div>

                                    <div className="max-w-sm mx-auto">
                                        <div className="flex items-center justify-between mb-5">
                                            <button
                                                className="w-11 h-11 rounded-lg bg-[#850000]/5 hover:bg-[#850000]/10 flex items-center justify-center transition-all hover:scale-110"
                                                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                                            >
                                                <span className="material-symbols-outlined text-[#6b4444]">chevron_left</span>
                                            </button>
                                            <h4 className="text-xl font-bold text-[#1d0c0c]">
                                                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                            </h4>
                                            <button
                                                className="w-11 h-11 rounded-lg bg-[#850000]/5 hover:bg-[#850000]/10 flex items-center justify-center transition-all hover:scale-110"
                                                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                                            >
                                                <span className="material-symbols-outlined text-[#6b4444]">chevron_right</span>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-7 gap-1 mb-3">
                                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                                                <div key={i} className="text-[#6b4444] text-[11px] font-bold uppercase text-center py-2">{d}</div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-7 gap-1.5">
                                            {days.map((day, i) => {
                                                const isAvailable = day && isDayAvailable(day);
                                                const isSelected = day && selectedDate?.toDateString() === day.toDateString();
                                                const isToday = day?.toDateString() === new Date().toDateString();

                                                return (
                                                    <motion.button
                                                        key={i}
                                                        disabled={!isAvailable}
                                                        onClick={() => day && setSelectedDate(day)}
                                                        whileHover={isAvailable ? { scale: 1.1 } : {}}
                                                        whileTap={isAvailable ? { scale: 0.95 } : {}}
                                                        className={`aspect-square rounded-lg text-sm font-semibold transition-all relative ${!day ? '' :
                                                            !isAvailable ? 'text-gray-300 cursor-not-allowed' :
                                                                isSelected ? 'bg-[#850000] text-white shadow-lg shadow-[#850000]/30 z-10' :
                                                                    'text-[#1d0c0c] hover:bg-[#850000]/10'
                                                            }`}
                                                    >
                                                        {day?.getDate()}
                                                        {isToday && !isSelected && (
                                                            <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#850000] rounded-full" />
                                                        )}
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </section>

                                {/* Right: Time Slots */}
                                <section className="lg:w-[320px] p-8 border-t lg:border-t-0 lg:border-l border-[#850000]/5 bg-gradient-to-b from-white to-[#fcf8f8]">
                                    {selectedDate ? (
                                        <>
                                            <div className="flex items-center gap-3 mb-5">
                                                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-green-600">event_available</span>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-[#1d0c0c]">
                                                        {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </h3>
                                                    <p className="text-xs text-[#6b4444]">{availableSlots.length} available</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                                {availableSlots.length === 0 ? (
                                                    <div className="text-center py-10">
                                                        <span className="material-symbols-outlined text-[#850000]/30 text-4xl mb-3 block">event_busy</span>
                                                        <p className="text-[#6b4444]">No times available</p>
                                                    </div>
                                                ) : (
                                                    availableSlots.map((slot, index) => (
                                                        <motion.button
                                                            key={slot}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: index * 0.03 }}
                                                            onClick={() => handleTimeSelect(slot)}
                                                            className="w-full py-4 rounded-lg font-bold text-center bg-[#850000]/5 hover:bg-[#850000]/15 text-[#1d0c0c] transition-all hover:scale-[1.02] hover:shadow-md"
                                                        >
                                                            {formatTime(slot)}
                                                        </motion.button>
                                                    ))
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="h-full flex items-center justify-center min-h-[300px]">
                                            <div className="text-center">
                                                <motion.div
                                                    animate={{ y: [0, -5, 0] }}
                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                    className="w-16 h-16 bg-[#850000]/10 rounded-xl flex items-center justify-center mx-auto mb-4"
                                                >
                                                    <span className="material-symbols-outlined text-[#850000]/40 text-3xl">touch_app</span>
                                                </motion.div>
                                                <p className="text-[#6b4444] font-medium">Select a date to see times</p>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="p-8 md:p-12 max-w-2xl mx-auto"
                            >
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex items-center gap-2 text-[#6b4444] hover:text-[#1d0c0c] mb-8 transition-colors"
                                >
                                    <span className="material-symbols-outlined">arrow_back</span>
                                    Change time
                                </button>

                                {/* Booking Summary */}
                                <div className="bg-[#850000]/5 rounded-xl p-5 mb-8 border border-[#850000]/10">
                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-[#850000] rounded-lg flex items-center justify-center shadow-lg shadow-[#850000]/30">
                                                <span className="material-symbols-outlined text-white text-2xl">event</span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-[#1d0c0c] text-lg">{eventType.title}</h3>
                                                <p className="text-[#6b4444] text-sm">with {user.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-[#1d0c0c] font-bold">
                                                    {selectedDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </p>
                                                <p className="text-[#850000] font-bold">{selectedTime && formatTime(selectedTime)}</p>
                                            </div>
                                            <div className="w-12 h-12 bg-[#850000]/10 rounded-lg flex items-center justify-center">
                                                <span className="material-symbols-outlined text-[#850000]">schedule</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Form */}
                                <h2 className="text-2xl font-bold text-[#1d0c0c] mb-6">Your Details</h2>
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-[#1d0c0c] mb-2">Your Name *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Enter your full name"
                                            className="w-full px-5 py-4 rounded-lg bg-[#850000]/5 text-[#1d0c0c] placeholder:text-[#6b4444]/50 focus:ring-2 focus:ring-[#850000]/30 focus:bg-white transition-all text-lg border border-[#850000]/10"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-[#1d0c0c] mb-2">Email Address *</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="you@example.com"
                                            className="w-full px-5 py-4 rounded-lg bg-[#850000]/5 text-[#1d0c0c] placeholder:text-[#6b4444]/50 focus:ring-2 focus:ring-[#850000]/30 focus:bg-white transition-all text-lg border border-[#850000]/10"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-[#1d0c0c] mb-2">Additional Notes <span className="text-[#6b4444] font-normal">(Optional)</span></label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            placeholder="Anything you'd like to discuss..."
                                            rows={3}
                                            className="w-full px-5 py-4 rounded-lg bg-[#850000]/5 text-[#1d0c0c] placeholder:text-[#6b4444]/50 focus:ring-2 focus:ring-[#850000]/30 focus:bg-white transition-all resize-none border border-[#850000]/10"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-5 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-3"
                                        role="alert"
                                    >
                                        <span className="material-symbols-outlined">error</span>
                                        {error}
                                    </motion.div>
                                )}

                                <motion.button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !formData.name.trim() || !formData.email.trim()}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="mt-8 w-full py-5 bg-[#850000] text-white rounded-lg font-bold text-lg shadow-xl shadow-[#850000]/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#6b0000]"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                            Confirming...
                                        </>
                                    ) : (
                                        <>
                                            Confirm Booking
                                            <span className="material-symbols-outlined">check_circle</span>
                                        </>
                                    )}
                                </motion.button>

                                <p className="text-center text-[#6b4444] text-sm mt-4">
                                    You'll receive a confirmation email at <span className="text-[#1d0c0c]">{formData.email || 'your email'}</span>
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Footer */}
                <footer className="mt-10 text-center flex flex-col items-center gap-2">
                    <p className="text-[#6b4444] text-sm">Powered by</p>
                    <Logo size="sm" href="/" />
                </footer>
            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f5f5f5; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(133,0,0,0.2); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(133,0,0,0.3); }
            `}</style>
        </div>
    );
}
