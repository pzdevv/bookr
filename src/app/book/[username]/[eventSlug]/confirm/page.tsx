'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ConfirmContent() {
    const searchParams = useSearchParams();
    const date = searchParams.get('date');
    const name = searchParams.get('name');
    const duration = parseInt(searchParams.get('duration') || '30');
    const roomId = searchParams.get('room');
    const [copied, setCopied] = useState(false);

    const bookingDate = date ? new Date(date) : new Date();
    const endDate = new Date(bookingDate.getTime() + duration * 60 * 1000);

    // Generate Google Calendar link
    const formatGoogleDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const handleAddToCalendar = () => {
        const title = encodeURIComponent('Meeting with Bookr');
        const details = encodeURIComponent(`Meeting booked by ${name || 'Guest'} via Bookr${roomId ? `\n\nJoin call: ${window.location.origin}/call/${roomId}` : ''}`);
        const startTime = formatGoogleDate(bookingDate);
        const endTime = formatGoogleDate(endDate);

        const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}`;
        window.open(googleUrl, '_blank');
    };

    // Generate ICS file download
    const handleDownloadICS = () => {
        const formatICSDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Bookr//Meeting//EN
BEGIN:VEVENT
UID:${Date.now()}@bookr.app
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(bookingDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:Meeting with Bookr
DESCRIPTION:Meeting booked by ${name || 'Guest'} via Bookr${roomId ? `\\n\\nJoin call: ${typeof window !== 'undefined' ? window.location.origin : ''}/call/${roomId}` : ''}
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#fdfcfa] via-white to-[#f5f3f0] flex items-center justify-center p-4 font-[Inter,sans-serif]">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-[200px]" />
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#fbbd23]/5 rounded-full blur-[150px]" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Success Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 p-10 text-center shadow-2xl shadow-gray-200/50">
                    {/* Animated Success Icon */}
                    <div className="relative w-24 h-24 mx-auto mb-8">
                        <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-xl shadow-green-500/30">
                            <span className="material-symbols-outlined text-white text-5xl">check</span>
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-[#1c180c] mb-3">Booking Confirmed!</h1>
                    <p className="text-gray-500 mb-8">Your meeting has been successfully scheduled.</p>

                    {/* Booking Details */}
                    <div className="bg-gray-50 rounded-2xl p-6 mb-6 text-left border border-gray-100">
                        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#fbbd23]/20 to-[#fbbd23]/10 flex items-center justify-center">
                                <span className="text-[#fbbd23] font-bold text-xl">{name?.charAt(0) || 'G'}</span>
                            </div>
                            <div>
                                <p className="font-bold text-[#1c180c] text-lg">{name || 'Guest'}</p>
                                <p className="text-sm text-gray-400">Meeting booked</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <span className="material-symbols-outlined text-[#fbbd23]">calendar_today</span>
                                </div>
                                <span className="text-[#1c180c] font-medium">{bookingDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <span className="material-symbols-outlined text-[#fbbd23]">schedule</span>
                                </div>
                                <span className="text-[#1c180c] font-medium">{bookingDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <span className="material-symbols-outlined text-[#fbbd23]">call</span>
                                </div>
                                <span className="text-[#1c180c] font-medium">Audio Call</span>
                            </div>
                        </div>
                    </div>

                    {/* Call Link */}
                    {roomId && (
                        <div className="bg-gradient-to-r from-[#fbbd23]/10 to-orange-500/5 rounded-2xl p-5 mb-6 border border-[#fbbd23]/20">
                            <p className="text-sm text-gray-500 mb-3">Your call link (save this!):</p>
                            <div className="flex items-center gap-2 bg-white rounded-xl p-3 shadow-sm">
                                <span className="material-symbols-outlined text-[#fbbd23]">link</span>
                                <code className="text-sm text-[#1c180c] flex-1 truncate">/call/{roomId}</code>
                                <button
                                    onClick={handleCopyLink}
                                    className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium text-[#1c180c] hover:bg-gray-200 transition-all"
                                >
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            <Link
                                href={`/call/${roomId}`}
                                className="mt-4 w-full py-3.5 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-green-500/30 transition-all hover:scale-[1.02]"
                            >
                                <span className="material-symbols-outlined">call</span>
                                Join Audio Call
                            </Link>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={handleAddToCalendar}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#fbbd23] to-[#f59e0b] text-[#1c180c] font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-[#fbbd23]/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <span className="material-symbols-outlined text-xl">calendar_add_on</span>
                            Add to Google Calendar
                        </button>
                        <button
                            onClick={handleDownloadICS}
                            className="w-full py-4 rounded-xl bg-gray-100 border border-gray-200 text-[#1c180c] font-medium flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                        >
                            <span className="material-symbols-outlined text-xl">download</span>
                            Download .ics File
                        </button>
                        <Link
                            href="/"
                            className="w-full py-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 font-medium flex items-center justify-center gap-2 hover:bg-gray-100 hover:text-[#1c180c] transition-all"
                        >
                            Back to Home
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <p className="mt-8 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
                    Powered by
                    <span className="flex items-center gap-1.5 text-[#fbbd23] font-bold">
                        <span className="material-symbols-outlined text-lg">calendar_today</span>
                        Bookr
                    </span>
                    <span className="ml-2 px-2 py-0.5 text-[10px] bg-green-100 text-green-600 rounded-full font-bold">FREE</span>
                </p>
            </div>
        </div>
    );
}

export default function ConfirmPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-[#fdfcfa] via-white to-[#f5f3f0] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#fbbd23] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ConfirmContent />
        </Suspense>
    );
}
