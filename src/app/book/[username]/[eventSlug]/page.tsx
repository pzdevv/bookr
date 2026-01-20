'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventTypeService, availabilityService, bookingService, userService, generateCallRoomId, EventType, Availability, User } from '@/lib/appwrite/database';
import { formatTime, getTimeSlots, getUserTimezone } from '@/lib/utils';

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
            <div className="min-h-screen bg-gradient-to-br from-[#fdfcfa] via-white to-[#faf8f5] flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#fbbd23] to-orange-500 flex items-center justify-center animate-pulse shadow-2xl shadow-[#fbbd23]/30">
                        <span className="material-symbols-outlined text-white text-3xl">calendar_today</span>
                    </div>
                    <p className="text-gray-400 font-medium">Loading booking...</p>
                </motion.div>
            </div>
        );
    }

    if (!eventType || !user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#fdfcfa] via-white to-[#faf8f5] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-gray-200/50 p-12 max-w-md text-center"
                >
                    <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-red-400 text-5xl">event_busy</span>
                    </div>
                    <h1 className="text-3xl font-bold text-[#1c180c] mb-3">Not Found</h1>
                    <p className="text-gray-500 mb-8">This event doesn't exist or has been removed.</p>
                    <Link href="/" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#fbbd23] to-orange-500 text-white font-bold rounded-2xl hover:shadow-2xl hover:shadow-[#fbbd23]/30 transition-all hover:scale-105">
                        <span className="material-symbols-outlined">home</span>
                        Back to Home
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#fdfcfa] via-white to-[#faf8f5] text-[#1c180c] font-[Inter,sans-serif]">
            {/* Subtle Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-[#fbbd23]/5 rounded-full blur-[200px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] bg-orange-300/5 rounded-full blur-[150px]" />
            </div>

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5 bg-white/60 backdrop-blur-xl">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-11 h-11 bg-gradient-to-br from-[#fbbd23] to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-[#fbbd23]/20 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-white text-xl">calendar_today</span>
                    </div>
                    <span className="text-xl font-bold text-[#1c180c] hidden sm:block">Bookr</span>
                </Link>
                <div className="flex gap-3">
                    <Link href="/auth/login" className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-[#1c180c] transition-colors">
                        Log In
                    </Link>
                    <Link href="/auth/signup" className="px-6 py-2.5 bg-gradient-to-r from-[#fbbd23] to-orange-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-[#fbbd23]/30 transition-all hover:scale-105">
                        Sign Up Free
                    </Link>
                </div>
            </header>

            <main className="relative z-10 max-w-5xl mx-auto py-6 px-4 md:px-6">
                {/* Progress Indicator */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <motion.div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= 1 ? 'bg-gradient-to-br from-[#fbbd23] to-orange-500 text-white shadow-lg shadow-[#fbbd23]/30' : 'bg-gray-100 text-gray-400'}`}
                            animate={{ scale: step === 1 ? [1, 1.1, 1] : 1 }}
                            transition={{ repeat: step === 1 ? Infinity : 0, duration: 2 }}
                        >
                            1
                        </motion.div>
                        <span className={`font-semibold ${step >= 1 ? 'text-[#1c180c]' : 'text-gray-400'}`}>Select Time</span>
                    </div>
                    <div className={`w-20 h-1 rounded-full transition-all ${step >= 2 ? 'bg-gradient-to-r from-[#fbbd23] to-orange-500' : 'bg-gray-200'}`} />
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= 2 ? 'bg-gradient-to-br from-[#fbbd23] to-orange-500 text-white shadow-lg shadow-[#fbbd23]/30' : 'bg-gray-100 text-gray-400'}`}>
                            2
                        </div>
                        <span className={`font-semibold ${step >= 2 ? 'text-[#1c180c]' : 'text-gray-400'}`}>Your Details</span>
                    </div>
                </div>

                {/* Main Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl shadow-gray-200/50 overflow-hidden"
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
                                <aside className="lg:w-[300px] p-8 border-b lg:border-b-0 lg:border-r border-gray-100 bg-gradient-to-br from-[#faf8f5] to-white">
                                    <div className="flex flex-col gap-5">
                                        <div className="relative w-fit">
                                            <div
                                                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#fbbd23]/20 to-[#fbbd23]/5 flex items-center justify-center shadow-xl relative overflow-hidden"
                                                style={user.avatar ? { backgroundImage: `url("${user.avatar}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                                            >
                                                {!user.avatar && <span className="text-[#fbbd23] text-3xl font-bold">{user.name?.charAt(0)}</span>}
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
                                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{user.name}</p>
                                            <h1 className="text-2xl font-bold text-[#1c180c]">{eventType.title}</h1>
                                        </div>
                                        <div className="space-y-2.5">
                                            {[
                                                { icon: 'schedule', label: `${eventType.duration} min`, color: 'text-[#fbbd23]', bg: 'bg-[#fbbd23]/10' },
                                                { icon: 'videocam', label: 'Video Call', color: 'text-blue-500', bg: 'bg-blue-50' },
                                                { icon: 'public', label: guestTimezone.split('/').pop()?.replace('_', ' ') || guestTimezone, color: 'text-green-500', bg: 'bg-green-50' },
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 ${item.bg} rounded-xl flex items-center justify-center`}>
                                                        <span className={`material-symbols-outlined ${item.color} text-lg`}>{item.icon}</span>
                                                    </div>
                                                    <span className="text-gray-600 text-sm font-medium">{item.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {eventType.description && (
                                            <p className="text-gray-400 text-sm leading-relaxed pt-4 border-t border-gray-100">
                                                {eventType.description}
                                            </p>
                                        )}
                                    </div>
                                </aside>

                                {/* Center: Calendar */}
                                <section className="flex-1 p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-[#fbbd23]/10 rounded-xl flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[#fbbd23]">calendar_month</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-[#1c180c]">Select a Date</h3>
                                    </div>

                                    <div className="max-w-sm mx-auto">
                                        <div className="flex items-center justify-between mb-5">
                                            <button
                                                className="w-11 h-11 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-all hover:scale-110"
                                                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                                            >
                                                <span className="material-symbols-outlined text-gray-400">chevron_left</span>
                                            </button>
                                            <h4 className="text-xl font-bold text-[#1c180c]">
                                                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                            </h4>
                                            <button
                                                className="w-11 h-11 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-all hover:scale-110"
                                                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                                            >
                                                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-7 gap-1 mb-3">
                                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                                                <div key={i} className="text-gray-400 text-[11px] font-bold uppercase text-center py-2">{d}</div>
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
                                                        className={`aspect-square rounded-xl text-sm font-semibold transition-all relative ${!day ? '' :
                                                            !isAvailable ? 'text-gray-300 cursor-not-allowed' :
                                                                isSelected ? 'bg-gradient-to-br from-[#fbbd23] to-orange-500 text-white shadow-lg shadow-[#fbbd23]/30 z-10' :
                                                                    'text-[#1c180c] hover:bg-[#fbbd23]/10'
                                                            }`}
                                                    >
                                                        {day?.getDate()}
                                                        {isToday && !isSelected && (
                                                            <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#fbbd23] rounded-full" />
                                                        )}
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </section>

                                {/* Right: Time Slots */}
                                <section className="lg:w-[320px] p-8 border-t lg:border-t-0 lg:border-l border-gray-100 bg-gradient-to-b from-white to-[#fdfcfb]">
                                    {selectedDate ? (
                                        <>
                                            <div className="flex items-center gap-3 mb-5">
                                                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-green-500">event_available</span>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-[#1c180c]">
                                                        {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </h3>
                                                    <p className="text-xs text-gray-400">{availableSlots.length} available</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                                {availableSlots.length === 0 ? (
                                                    <div className="text-center py-10">
                                                        <span className="material-symbols-outlined text-gray-300 text-4xl mb-3 block">event_busy</span>
                                                        <p className="text-gray-400">No times available</p>
                                                    </div>
                                                ) : (
                                                    availableSlots.map((slot, index) => (
                                                        <motion.button
                                                            key={slot}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: index * 0.03 }}
                                                            onClick={() => handleTimeSelect(slot)}
                                                            className="w-full py-4 rounded-xl font-bold text-center bg-[#fbbd23]/5 hover:bg-[#fbbd23]/20 text-[#1c180c] hover:text-[#1c180c] transition-all hover:scale-[1.02] hover:shadow-md"
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
                                                    className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                                >
                                                    <span className="material-symbols-outlined text-gray-300 text-3xl">touch_app</span>
                                                </motion.div>
                                                <p className="text-gray-400 font-medium">Select a date to see times</p>
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
                                    className="flex items-center gap-2 text-gray-400 hover:text-[#1c180c] mb-8 transition-colors"
                                >
                                    <span className="material-symbols-outlined">arrow_back</span>
                                    Change time
                                </button>

                                {/* Booking Summary */}
                                <div className="bg-gradient-to-r from-[#fbbd23]/10 to-orange-100/50 rounded-2xl p-5 mb-8">
                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gradient-to-br from-[#fbbd23] to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-[#fbbd23]/30">
                                                <span className="material-symbols-outlined text-white text-2xl">event</span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-[#1c180c] text-lg">{eventType.title}</h3>
                                                <p className="text-gray-500 text-sm">with {user.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-[#1c180c] font-bold">
                                                    {selectedDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </p>
                                                <p className="text-[#fbbd23] font-bold">{selectedTime && formatTime(selectedTime)}</p>
                                            </div>
                                            <div className="w-12 h-12 bg-[#fbbd23]/10 rounded-xl flex items-center justify-center">
                                                <span className="material-symbols-outlined text-[#fbbd23]">schedule</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Form */}
                                <h2 className="text-2xl font-bold text-[#1c180c] mb-6">Your Details</h2>
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-2">Your Name *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Enter your full name"
                                            className="w-full px-5 py-4 rounded-xl bg-gray-50 text-[#1c180c] placeholder:text-gray-400 focus:ring-2 focus:ring-[#fbbd23]/50 focus:bg-white transition-all text-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-2">Email Address *</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="you@example.com"
                                            className="w-full px-5 py-4 rounded-xl bg-gray-50 text-[#1c180c] placeholder:text-gray-400 focus:ring-2 focus:ring-[#fbbd23]/50 focus:bg-white transition-all text-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-2">Additional Notes <span className="text-gray-400 font-normal">(Optional)</span></label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            placeholder="Anything you'd like to discuss..."
                                            rows={3}
                                            className="w-full px-5 py-4 rounded-xl bg-gray-50 text-[#1c180c] placeholder:text-gray-400 focus:ring-2 focus:ring-[#fbbd23]/50 focus:bg-white transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-5 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3"
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
                                    className="mt-8 w-full py-5 bg-gradient-to-r from-[#fbbd23] to-orange-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-[#fbbd23]/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
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

                                <p className="text-center text-gray-400 text-sm mt-4">
                                    You'll receive a confirmation email at <span className="text-gray-600">{formData.email || 'your email'}</span>
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Footer */}
                <footer className="mt-10 text-center">
                    <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
                        Powered by
                        <span className="flex items-center gap-1.5 text-[#fbbd23] font-bold">
                            <span className="material-symbols-outlined text-lg">calendar_today</span>
                            Bookr
                        </span>
                    </p>
                </footer>
            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f5f5f5; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(251,189,35,0.3); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(251,189,35,0.5); }
            `}</style>
        </div>
    );
}
