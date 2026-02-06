'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventTypeService, availabilityService, bookingService, userService, generateCallRoomId, EventType, Availability, User, Booking } from '@/lib/appwrite/database';
import { formatTime, getTimeSlots, getUserTimezone } from '@/lib/utils';
import { sanitizeName, sanitizeEmail, sanitizeMultiline } from '@/lib/utils/sanitize';
import { Logo } from '@/components/ui/logo';
import confetti from 'canvas-confetti';
import { sendEmail, generateNewBookingNotificationEmail } from '@/lib/services/email';
import { TEXTURES } from '@/lib/constants/textures';
import { FONTS } from '@/lib/constants/fonts';
import { appwriteConfig, storage } from '@/lib/appwrite/config';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function BookEventPage({ params }: { params: Promise<{ username: string; eventSlug: string }> }) {
    const { username, eventSlug } = use(params);
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [eventType, setEventType] = useState<EventType | null>(null);
    const [availability, setAvailability] = useState<Availability[]>([]);
    const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', notes: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<1 | 2>(1);
    const [isDarkMode, setIsDarkMode] = useState(false);
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
                        const [avail, bookings] = await Promise.all([
                            availabilityService.listByUser(foundUser.$id),
                            bookingService.listByUser(foundUser.$id)
                        ]);
                        setAvailability(avail.filter((a) => a.isEnabled));
                        // Only keep confirmed/pending bookings for slot blocking
                        setExistingBookings(bookings.filter(b => b.status === 'confirmed' || b.status === 'pending'));
                    }
                }
            } catch (err) { console.error('Error:', err); }
            finally { setIsLoading(false); }
        };
        loadData();
    }, [username, eventSlug]);

    // Branding derivation
    const branding = useMemo(() => {
        if (!user) return null;
        return {
            color: user.brandColor || '#850000',
            font: FONTS.find(f => f.name === user.themeFont) || FONTS[0],
            texture: TEXTURES.find(t => t.id === user.themeTexture) || TEXTURES[0],
            logo: user.logo || null,
        };
    }, [user]);

    // Calculate available slots
    useEffect(() => {
        if (selectedDate && eventType) {
            const dayOfWeek = selectedDate.getDay();
            const dayAvail = availability.find((a) => a.day === dayOfWeek);
            if (dayAvail) {
                let slots = getTimeSlots(dayAvail.startTime, dayAvail.endTime, eventType.duration, eventType.buffer);

                // Filter out past times if selected date is today
                const now = new Date();
                const isToday = selectedDate.toDateString() === now.toDateString();
                if (isToday) {
                    slots = slots.filter(slot => {
                        const [hours, mins] = slot.split(':').map(Number);
                        const slotTime = new Date(selectedDate);
                        slotTime.setHours(hours, mins, 0, 0);
                        return slotTime > now;
                    });
                }

                // Filter out already-booked slots
                slots = slots.filter(slot => {
                    const [hours, mins] = slot.split(':').map(Number);
                    const slotStart = new Date(selectedDate);
                    slotStart.setHours(hours, mins, 0, 0);
                    const slotEnd = new Date(slotStart.getTime() + eventType.duration * 60000);

                    // Check if this slot overlaps with any existing booking
                    return !existingBookings.some(booking => {
                        const bookingStart = new Date(booking.slotTime);
                        const bookingEnd = new Date(bookingStart.getTime() + eventType.duration * 60000);
                        // Overlap: slot starts before booking ends AND slot ends after booking starts
                        return slotStart < bookingEnd && slotEnd > bookingStart;
                    });
                });

                setAvailableSlots(slots);
            } else {
                setAvailableSlots([]);
            }
            setSelectedTime(null);
        }
    }, [selectedDate, eventType, availability, existingBookings]);

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

            // Sanitize inputs
            const cleanName = sanitizeName(formData.name);
            const cleanEmail = sanitizeEmail(formData.email);
            const cleanNotes = sanitizeMultiline(formData.notes, 1000);

            await bookingService.create({
                userId: user.$id,
                eventTypeId: eventType.$id,
                guestName: cleanName,
                guestEmail: cleanEmail,
                slotTime: slotDateTime.toISOString(),
                status: 'pending',
                notes: cleanNotes,
                callRoomId,
            });

            // Notify host about new booking request (async, don't block)
            const hostNotification = generateNewBookingNotificationEmail({
                guestName: cleanName,
                guestEmail: cleanEmail,
                hostName: user.name || 'Host',
                hostEmail: user.email,
                eventTitle: eventType.title,
                slotTime: slotDateTime.toISOString(),
                duration: eventType.duration,
                notes: cleanNotes
            });
            sendEmail(user.email, hostNotification);

            // Trigger confetti celebration
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#850000', '#ffffff', '#ff0000']
            });

            router.push(`/book/${username}/${eventSlug}/confirm?date=${slotDateTime.toISOString()}&name=${encodeURIComponent(cleanName)}&duration=${eventType.duration}&room=${callRoomId}`);
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

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    return (
        <div
            className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0a0a0a] text-white' : 'bg-[#fcf8f8] text-[#1d0c0c]'}`}
            style={{
                fontFamily: branding?.font.family,
            }}
        >
            <ThemeToggle isDark={isDarkMode} toggle={toggleTheme} brandingColor={branding?.color} />

            {branding && <link rel="stylesheet" href={branding.font.url} />}

            {/* Dynamic Background */}
            {branding && (
                <div
                    className="fixed inset-0 pointer-events-none opacity-40 transition-opacity"
                    style={{
                        backgroundImage: branding.texture.value,
                        backgroundSize: branding.texture.id === 'clean' ? 'auto' : '20px 20px',
                        filter: isDarkMode ? 'invert(1) opacity(0.1)' : 'none'
                    }}
                />
            )}

            {/* Subtle Gradient Spots using Brand Color */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[200px] opacity-10"
                    style={{ backgroundColor: branding?.color }}
                />
                <div
                    className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] rounded-full blur-[150px] opacity-5"
                    style={{ backgroundColor: branding?.color }}
                />
            </div>

            {/* Custom Header (Simple) */}
            <header className={`relative z-10 flex items-center justify-between px-6 md:px-10 py-5 backdrop-blur-xl border-b transition-colors ${isDarkMode ? 'bg-[#141414]/60 border-white/10' : 'bg-white/60'}`} style={{ borderColor: isDarkMode ? '' : `${branding?.color}10` }}>
                <div className="flex items-center gap-3">
                    {branding?.logo ? (
                        <Link href={`/book/${username}`}>
                            <img src={branding.logo} alt="Logo" className="h-8 object-contain" />
                        </Link>
                    ) : (
                        <Link href={`/book/${username}`} className="font-bold text-xl" style={{ color: branding?.color }}>
                            {user.name}
                        </Link>
                    )}
                </div>
            </header>

            <main className="relative z-10 max-w-5xl mx-auto py-6 px-4 md:px-6">
                {/* Progress Indicator */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <motion.div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all`}
                            style={step >= 1 ? { backgroundColor: branding?.color, color: 'white', boxShadow: `0 10px 15px -3px ${branding?.color}30` } : { backgroundColor: isDarkMode ? '#333' : '#f3f4f6', color: isDarkMode ? '#888' : '#9ca3af' }}
                            animate={{ scale: step === 1 ? [1, 1.1, 1] : 1 }}
                            transition={{ repeat: step === 1 ? Infinity : 0, duration: 2 }}
                        >
                            1
                        </motion.div>
                        <span className={`font-semibold ${step >= 1 ? (isDarkMode ? 'text-white' : 'text-[#1d0c0c]') : (isDarkMode ? 'text-gray-600' : 'text-gray-400')}`}>Select Time</span>
                    </div>
                    <div
                        className={`w-20 h-1 rounded-full transition-all`}
                        style={{ backgroundColor: step >= 2 ? branding?.color : (isDarkMode ? '#333' : '#e5e7eb') }}
                    />
                    <div className="flex items-center gap-3">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all`}
                            style={step >= 2 ? { backgroundColor: branding?.color, color: 'white', boxShadow: `0 10px 15px -3px ${branding?.color}30` } : { backgroundColor: isDarkMode ? '#333' : '#f3f4f6', color: isDarkMode ? '#888' : '#9ca3af' }}
                        >
                            2
                        </div>
                        <span className={`font-semibold ${step >= 2 ? (isDarkMode ? 'text-white' : 'text-[#1d0c0c]') : (isDarkMode ? 'text-gray-600' : 'text-gray-400')}`}>Your Details</span>
                    </div>
                </div>

                {/* Main Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden border transition-colors ${isDarkMode ? 'bg-[#141414]/90 border-white/10' : 'bg-white/90'}`}
                    style={{ borderColor: isDarkMode ? '' : `${branding?.color}10`, boxShadow: `0 25px 50px -12px ${branding?.color}10` }}
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
                                <aside className={`lg:w-[300px] p-8 border-b lg:border-b-0 lg:border-r transition-colors ${isDarkMode ? 'bg-gradient-to-br from-[#1a1a1a] to-[#141414] border-white/10' : 'bg-gradient-to-br from-white to-gray-50/50'}`} style={{ borderColor: isDarkMode ? '' : `${branding?.color}10` }}>
                                    <div className="flex flex-col gap-5">
                                        <div className="relative w-fit">
                                            <div
                                                className="w-20 h-20 rounded-xl flex items-center justify-center shadow-xl relative overflow-hidden transition-colors"
                                                style={{
                                                    backgroundImage: user.avatar ? `url("${user.avatar}")` : undefined,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    backgroundColor: `${branding?.color}10`
                                                }}
                                            >
                                                {!user.avatar && <span className="text-3xl font-bold" style={{ color: branding?.color }}>{user.name?.charAt(0)}</span>}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-60" style={{ color: branding?.color }}>{user.name}</p>
                                            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-[#1d0c0c]'}`}>{eventType.title}</h1>
                                        </div>
                                        <div className="space-y-2.5">
                                            {[
                                                { icon: 'schedule', label: `${eventType.duration} min`, color: branding?.color, bg: `${branding?.color}10` },
                                                { icon: 'call', label: 'Audio Call', color: '#3b82f6', bg: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff' },
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: item.bg }}>
                                                        <span className="material-symbols-outlined text-lg" style={{ color: item.color }}>{item.icon}</span>
                                                    </div>
                                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-[#6b4444]'}`}>{item.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {eventType.description && (
                                            <p className={`text-sm leading-relaxed pt-4 border-t ${isDarkMode ? 'text-gray-400 border-white/10' : 'text-[#6b4444]'}`} style={{ borderColor: isDarkMode ? '' : `${branding?.color}10` }}>
                                                {eventType.description}
                                            </p>
                                        )}
                                    </div>
                                </aside>

                                {/* Center: Calendar */}
                                <section className="flex-1 p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${branding?.color}10` }}>
                                            <span className="material-symbols-outlined" style={{ color: branding?.color }}>calendar_month</span>
                                        </div>
                                        <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#1d0c0c]'}`}>Select a Date</h3>
                                    </div>

                                    {/* Calendar Implementation */}
                                    <div className="max-w-sm mx-auto">
                                        <div className="flex items-center justify-between mb-5">
                                            <button
                                                className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all hover:scale-110 ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : ''}`}
                                                style={{ backgroundColor: isDarkMode ? '' : `${branding?.color}05` }}
                                                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                                            >
                                                <span className={`material-symbols-outlined ${isDarkMode ? 'text-gray-400' : 'text-[#6b4444]'}`}>chevron_left</span>
                                            </button>
                                            <h4 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[#1d0c0c]'}`}>
                                                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                            </h4>
                                            <button
                                                className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all hover:scale-110 ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : ''}`}
                                                style={{ backgroundColor: isDarkMode ? '' : `${branding?.color}05` }}
                                                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                                            >
                                                <span className={`material-symbols-outlined ${isDarkMode ? 'text-gray-400' : 'text-[#6b4444]'}`}>chevron_right</span>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-7 gap-1.5">
                                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                                                <div key={i} className={`text-[11px] font-bold uppercase text-center py-2 ${isDarkMode ? 'text-gray-500' : 'text-[#6b4444]'}`}>{d}</div>
                                            ))}
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
                                                        className={`aspect-square rounded-lg text-sm font-semibold transition-all relative ${!day ? '' : !isAvailable ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed' : ''}`}
                                                        style={
                                                            day && isAvailable ? (
                                                                isSelected ? { backgroundColor: branding?.color, color: 'white', boxShadow: `0 10px 15px -3px ${branding?.color}30` } : { color: isDarkMode ? '#fff' : '#1d0c0c' }
                                                            ) : {}
                                                        }
                                                    >
                                                        {day?.getDate()}
                                                        {isToday && !isSelected && (
                                                            <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ backgroundColor: branding?.color }} />
                                                        )}
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </section>

                                {/* Right: Time Slots */}
                                <section className={`lg:w-[320px] p-8 border-t lg:border-t-0 lg:border-l transition-colors ${isDarkMode ? 'bg-gradient-to-b from-[#141414] to-[#0f0f0f] border-white/10' : 'bg-gradient-to-b from-white to-[#fcf8f8]'}`} style={{ borderColor: isDarkMode ? '' : `${branding?.color}10` }}>
                                    {selectedDate ? (
                                        <>
                                            <div className="flex items-center gap-3 mb-5">
                                                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4' }}>
                                                    <span className="material-symbols-outlined text-green-600">event_available</span>
                                                </div>
                                                <div>
                                                    <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-[#1d0c0c]'}`}>
                                                        {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </h3>
                                                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-[#6b4444]'}`}>{availableSlots.length} available</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                                {availableSlots.length === 0 ? (
                                                    <div className="text-center py-10">
                                                        <span className="material-symbols-outlined text-4xl mb-3 block opacity-30" style={{ color: branding?.color }}>event_busy</span>
                                                        <p className={isDarkMode ? 'text-gray-400' : 'text-[#6b4444]'}>No times available</p>
                                                    </div>
                                                ) : (
                                                    availableSlots.map((slot, index) => (
                                                        <motion.button
                                                            key={slot}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: index * 0.03 }}
                                                            onClick={() => handleTimeSelect(slot)}
                                                            className={`w-full py-4 rounded-lg font-bold text-center transition-all hover:scale-[1.02] hover:shadow-md ${isDarkMode ? 'hover:bg-white/10' : ''}`}
                                                            style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : `${branding?.color}08`, color: isDarkMode ? 'white' : '#1d0c0c' }}
                                                            whileHover={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : `${branding?.color}15` }}
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
                                                    className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4"
                                                    style={{ backgroundColor: `${branding?.color}10` }}
                                                >
                                                    <span className="material-symbols-outlined text-3xl opacity-40" style={{ color: branding?.color }}>touch_app</span>
                                                </motion.div>
                                                <p className={`${isDarkMode ? 'text-gray-400' : 'text-[#6b4444]'} font-medium state-instruction`}>Select a date to see times</p>
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
                                    className={`flex items-center gap-2 mb-8 transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-[#6b4444] hover:text-[#1d0c0c]'}`}
                                >
                                    <span className="material-symbols-outlined">arrow_back</span>
                                    Change time
                                </button>

                                {/* Booking Summary */}
                                <div className={`rounded-xl p-5 mb-8 border ${isDarkMode ? 'bg-white/5 border-white/10' : ''}`} style={{ backgroundColor: isDarkMode ? '' : `${branding?.color}05`, borderColor: isDarkMode ? '' : `${branding?.color}10` }}>
                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-lg flex items-center justify-center shadow-lg" style={{ backgroundColor: branding?.color, boxShadow: `0 10px 15px -3px ${branding?.color}40` }}>
                                                <span className="material-symbols-outlined text-white text-2xl">event</span>
                                            </div>
                                            <div>
                                                <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-[#1d0c0c]'}`}>{eventType.title}</h3>
                                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-[#6b4444]'}`}>with {user.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className={`${isDarkMode ? 'text-white' : 'text-[#1d0c0c]'} font-bold`}>
                                                    {selectedDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </p>
                                                <p className="font-bold" style={{ color: branding?.color }}>{selectedTime && formatTime(selectedTime)}</p>
                                            </div>
                                            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${branding?.color}10` }}>
                                                <span className="material-symbols-outlined" style={{ color: branding?.color }}>schedule</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Form */}
                                <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-[#1d0c0c]'}`}>Your Details</h2>
                                <div className="space-y-5">
                                    {['name', 'email'].map((field) => (
                                        <div key={field}>
                                            <label className={`block text-sm font-semibold mb-2 capitalise ${isDarkMode ? 'text-gray-300' : 'text-[#1d0c0c]'}`}>{field === 'name' ? 'Your Name' : 'Email Address'} *</label>
                                            <input
                                                type={field === 'email' ? 'email' : 'text'}
                                                value={formData[field as keyof typeof formData]}
                                                onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                                                placeholder={field === 'name' ? "Enter your full name" : "you@example.com"}
                                                className={`w-full px-5 py-4 rounded-lg transition-all text-lg border ${isDarkMode ? 'bg-white/5 border-white/10 text-white placeholder-gray-600 focus:bg-white/10' : 'text-[#1d0c0c] placeholder:text-[#6b4444]/50 focus:bg-white'}`}
                                                style={{
                                                    borderColor: isDarkMode ? '' : `${branding?.color}10`,
                                                    backgroundColor: isDarkMode ? '' : `${branding?.color}05`,
                                                }}
                                            />
                                        </div>
                                    ))}
                                    <div>
                                        <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-[#1d0c0c]'}`}>Additional Notes <span className={`${isDarkMode ? 'text-gray-500' : 'text-[#6b4444]'} font-normal`}>(Optional)</span></label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            placeholder="Anything you'd like to discuss..."
                                            rows={3}
                                            className={`w-full px-5 py-4 rounded-lg transition-all resize-none border ${isDarkMode ? 'bg-white/5 border-white/10 text-white placeholder-gray-600 focus:bg-white/10' : 'bg-[#850000]/5 text-[#1d0c0c] placeholder:text-[#6b4444]/50'}`}
                                            style={{ borderColor: isDarkMode ? '' : `${branding?.color}10`, backgroundColor: isDarkMode ? '' : `${branding?.color}05` }}
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
                                    className="mt-8 w-full py-5 text-white rounded-lg font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ backgroundColor: branding?.color, boxShadow: `0 10px 15px -3px ${branding?.color}30` }}
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
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Mandatory Branding Footer */}
                <footer className="mt-20 text-center flex flex-col items-center gap-3">
                    <Link href="/" className={`inline-flex items-center gap-2 px-4 py-2 backdrop-blur-md rounded-full border hover:bg-opacity-80 transition-colors shadow-sm ${isDarkMode ? 'bg-white/10 border-white/10 text-gray-400 hover:bg-white/20' : 'bg-white/50 border-gray-100 hover:bg-white text-gray-500'}`}>
                        <span className="text-xs font-semibold uppercase tracking-wider">Made with</span>
                        <div className={`h-4 w-px ${isDarkMode ? 'bg-white/20' : 'bg-gray-200'}`} />
                        <Logo size="sm" href="" className="scale-75 origin-left" />
                    </Link>
                </footer>
            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: ${isDarkMode ? '#1a1a1a' : '#f5f5f5'}; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}; border-radius: 4px; }
            `}</style>
        </div>
    );
}

