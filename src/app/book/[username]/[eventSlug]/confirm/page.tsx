'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { sanitizeName } from '@/lib/utils/sanitize';
import confetti from 'canvas-confetti';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useBookingTheme } from '@/lib/hooks/use-booking-theme';

function ConfirmContent() {
    const searchParams = useSearchParams();
    const date = searchParams.get('date');
    const rawName = searchParams.get('name');
    const name = sanitizeName(rawName);
    const duration = parseInt(searchParams.get('duration') || '30');
    const roomId = searchParams.get('room');
    const [copied, setCopied] = useState(false);
    const { isDarkMode, toggleTheme, mounted } = useBookingTheme();

    const bookingDate = date ? new Date(date) : new Date();
    const endDate = new Date(bookingDate.getTime() + duration * 60 * 1000);

    // Note: Confetti removed as bookings are now pending until host confirms

    const formatGoogleDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const handleAddToCalendar = () => {
        const title = encodeURIComponent('Meeting with Book&Call');
        const details = encodeURIComponent(`Meeting booked by ${name || 'Guest'} via Book&Call${roomId ? `\n\nJoin call: ${window.location.origin}/call/${roomId}` : ''}`);
        const startTime = formatGoogleDate(bookingDate);
        const endTime = formatGoogleDate(endDate);
        const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}`;
        window.open(googleUrl, '_blank');
    };

    const handleDownloadICS = () => {
        const formatICSDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Book&Call//Meeting//EN
BEGIN:VEVENT
UID:${Date.now()}@bookcall.app
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(bookingDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:Meeting with Book&Call
DESCRIPTION:Meeting booked by ${name || 'Guest'} via Book&Call${roomId ? `\\n\\nJoin call: ${typeof window !== 'undefined' ? window.location.origin : ''}/call/${roomId}` : ''}
END:VEVENT
END:VCALENDAR`;
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'meeting.ics';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleCopyLink = () => {
        if (roomId) {
            navigator.clipboard.writeText(`${window.location.origin}/call/${roomId}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // toggleTheme removed, handled by hook

    if (!mounted) return null;

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 font-[Inter,sans-serif] relative overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-[#0a0a0a]' : 'bg-[#fcf8f8]'}`}
            style={{
                backgroundImage: isDarkMode
                    ? 'radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.3) 1px, transparent 0)'
                    : 'radial-gradient(circle at 2px 2px, rgba(133, 0, 0, 0.02) 1px, transparent 0)',
                backgroundSize: '32px 32px'
            }}>

            <ThemeToggle isDark={isDarkMode} toggle={toggleTheme} brandingColor="#850000" />

            {/* Ambient Background Effects */}
            <div className={`absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none transition-colors ${isDarkMode ? 'bg-[#850000]/10' : 'bg-[#850000]/5'}`} />
            <div className={`absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none transition-colors ${isDarkMode ? 'bg-amber-500/10' : 'bg-amber-500/5'}`} />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-lg relative z-10"
            >
                <div className={`backdrop-blur-2xl rounded-3xl border p-8 md:p-10 text-center shadow-xl transition-colors ${isDarkMode ? 'bg-[#141414]/80 border-white/10' : 'bg-white/70 border-white/50'}`}>

                    {/* Success Icon */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                        className="relative w-20 h-20 mx-auto mb-6"
                    >
                        <div className="absolute inset-0 bg-green-500 rounded-2xl rotate-3 opacity-20" />
                        <div className="absolute inset-0 bg-green-500 rounded-2xl -rotate-3 opacity-20" />
                        <div className="relative w-full h-full bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                            <span className="material-symbols-outlined text-white text-4xl">check_circle</span>
                        </div>
                    </motion.div>

                    <h1 className={`text-3xl font-extrabold mb-2 tracking-tight ${isDarkMode ? 'text-white' : 'text-[#1d0c0c]'}`}>Booking Confirmed!</h1>
                    <p className={`font-medium mb-8 ${isDarkMode ? 'text-gray-400' : 'text-[#6b4444]'}`}>You're all set. A calendar invite has been sent to your email.</p>

                    {/* Booking Ticket Card */}
                    <div className={`rounded-2xl p-6 mb-8 text-left border shadow-sm relative overflow-hidden group transition-colors ${isDarkMode ? 'bg-white/5 border-white/10 hover:border-[#850000]/40' : 'bg-white border-gray-100 hover:border-[#850000]/20'}`}>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#850000]/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />

                        <div className="flex items-start gap-4 mb-6 relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#850000] to-[#6b0000] text-white flex items-center justify-center font-bold text-lg shadow-md shadow-[#850000]/20">
                                {name?.charAt(0) || 'G'}
                            </div>
                            <div>
                                <h3 className={`font-bold text-lg leading-tight ${isDarkMode ? 'text-white' : 'text-[#1d0c0c]'}`}>{name || 'Guest'}</h3>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-[#6b4444]'}`}>Meeting Attendee</p>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div className={`flex items-center gap-3.5 p-3 rounded-xl transition-colors ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50/80 hover:bg-gray-50'}`}>
                                <span className="material-symbols-outlined text-[#850000] bg-white p-1.5 rounded-lg shadow-sm text-xl">calendar_month</span>
                                <div>
                                    <p className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-[#6b4444]'}`}>Date</p>
                                    <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#1d0c0c]'}`}>{bookingDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className={`flex-1 flex items-center gap-3.5 p-3 rounded-xl transition-colors ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50/80 hover:bg-gray-50'}`}>
                                    <span className="material-symbols-outlined text-[#850000] bg-white p-1.5 rounded-lg shadow-sm text-xl">schedule</span>
                                    <div>
                                        <p className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-[#6b4444]'}`}>Time</p>
                                        <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#1d0c0c]'}`}>{bookingDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                                <div className={`flex-1 flex items-center gap-3.5 p-3 rounded-xl transition-colors ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50/80 hover:bg-gray-50'}`}>
                                    <span className="material-symbols-outlined text-[#850000] bg-white p-1.5 rounded-lg shadow-sm text-xl">timelapse</span>
                                    <div>
                                        <p className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-[#6b4444]'}`}>Duration</p>
                                        <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#1d0c0c]'}`}>{duration} min</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Copy Link */}
                    {roomId && (
                        <div className="mb-8">
                            <div
                                onClick={handleCopyLink}
                                className={`group relative rounded-xl p-4 cursor-pointer transition-all active:scale-[0.98] shadow-lg hover:shadow-xl ${isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#1d0c0c] hover:bg-black text-white'}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-black/10' : 'bg-white/10'}`}>
                                            <span className="material-symbols-outlined text-xl">videocam</span>
                                        </div>
                                        <div className="text-left overflow-hidden">
                                            <p className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-black/60' : 'text-white/60'}`}>Meeting Link</p>
                                            <p className={`font-mono text-sm truncate ${isDarkMode ? 'text-black/90' : 'text-white/90'}`}>bookcall.com/call/{roomId}</p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isDarkMode ? 'bg-black/10 group-hover:bg-black group-hover:text-white' : 'bg-white/10 group-hover:bg-white group-hover:text-black'}`}>
                                        {copied ? 'COPIED' : 'COPY'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleAddToCalendar}
                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all group ${isDarkMode ? 'border-white/10 hover:border-[#850000] hover:bg-[#850000]/10 text-gray-400 hover:text-[#850000]' : 'border-gray-200 hover:border-[#850000] hover:bg-[#850000]/5 text-[#6b4444] hover:text-[#850000]'}`}
                        >
                            <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">calendar_add_on</span>
                            <span className="text-xs font-bold">Google Cal</span>
                        </button>
                        <button
                            onClick={handleDownloadICS}
                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all group ${isDarkMode ? 'border-white/10 hover:border-[#850000] hover:bg-[#850000]/10 text-gray-400 hover:text-[#850000]' : 'border-gray-200 hover:border-[#850000] hover:bg-[#850000]/5 text-[#6b4444] hover:text-[#850000]'}`}
                        >
                            <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">download</span>
                            <span className="text-xs font-bold">Outlook / Apple</span>
                        </button>
                    </div>

                    <Link href="/" className="inline-block mt-8 text-sm font-bold text-[#850000] hover:text-[#6b0000] hover:underline transition-all">
                        Return to Home
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}

export default function ConfirmPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#fcf8f8] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#850000] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ConfirmContent />
        </Suspense>
    );
}
