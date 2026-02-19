'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { use } from 'react';
import { userService, eventTypeService, User, EventType } from '@/lib/appwrite/database';
import { Logo } from '@/components/ui/logo';
import { UserBookingPageSkeleton } from '@/components/ui/skeleton';
import { TEXTURES } from '@/lib/constants/textures';
import { FONTS } from '@/lib/constants/fonts';
import { appwriteConfig, storage } from '@/lib/appwrite/config';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useBookingTheme } from '@/lib/hooks/use-booking-theme';
import { IframeGuard } from '@/components/booking/iframe-guard';

export default function UserBookingPage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = use(params);
    const [user, setUser] = useState<User | null>(null);
    const [eventTypes, setEventTypes] = useState<EventType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { isDarkMode, toggleTheme, mounted } = useBookingTheme();

    useEffect(() => {
        const loadData = async () => {
            try {
                let foundUser = await userService.getByUsername(username);
                if (!foundUser) {
                    foundUser = await userService.getByNameSlug(username);
                }
                if (foundUser) {
                    setUser(foundUser);
                    const events = await eventTypeService.listByUser(foundUser.$id);
                    setEventTypes(events.filter((e) => e.isActive));
                }
            } catch (err) { console.error('Error:', err); }
            finally { setIsLoading(false); }
        };
        loadData();
    }, [username]);

    if (isLoading) {
        return <UserBookingPageSkeleton />;
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#fcf8f8] flex items-center justify-center p-4">
                <div className="bg-white/80 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-gray-200/50 p-12 max-w-md text-center border border-[#850000]/5">
                    {/* ... (keep existing 404 content, maybe simplistic here) ... */}
                    <h1 className="text-3xl font-bold text-[#1d0c0c] mb-3">User not found</h1>
                    <Link href="/" className="inline-flex items-center gap-2 px-8 py-4 bg-[#850000] text-white font-bold rounded-lg hover:bg-[#6b0000] transition-all">
                        Go to homepage
                    </Link>
                </div>
            </div>
        );
    }

    const branding = {
        color: user?.brandColor || '#850000',
        font: FONTS.find(f => f.name === user?.themeFont) || FONTS[0],
        texture: TEXTURES.find(t => t.id === user?.themeTexture) || TEXTURES[0],
        logo: user?.logo || null,
    };

    const getSocialIcon = (platform: string) => {
        switch (platform.toLowerCase()) {
            case 'instagram': return 'photo_camera';
            case 'twitter': return 'alternate_email';
            case 'linkedin': return 'work';
            case 'youtube': return 'smart_display';
            case 'website': return 'language';
            case 'github': return 'code';
            default: return 'link';
        }
    };

    // Toggle Theme removed, handled by hook

    if (!mounted) return null; // Prevent hydration mismatch

    return (
        <IframeGuard allowEmbedding={user.allowEmbedding} username={user.username}>
            <div
                className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0a0a0a] text-white' : 'bg-[#fcf8f8] text-[#1d0c0c]'}`}
                style={{
                    fontFamily: branding.font.family,
                }}
            >
                <ThemeToggle isDark={isDarkMode} toggle={toggleTheme} brandingColor={branding.color} />

                {/* Load Font */}
                <link rel="stylesheet" href={branding.font.url} />

                {/* Dynamic Background */}
                <div
                    className="fixed inset-0 pointer-events-none opacity-40 transition-opacity"
                    style={{
                        backgroundImage: branding.texture.value,
                        backgroundSize: branding.texture.id === 'clean' ? 'auto' : '20px 20px',
                        filter: isDarkMode ? 'invert(1) opacity(0.3)' : 'none'
                    }}
                />

                {/* Subtle Gradient Spots */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div
                        className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[200px] opacity-10"
                        style={{ backgroundColor: branding.color }}
                    />
                    <div
                        className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] rounded-full blur-[150px] opacity-5"
                        style={{ backgroundColor: branding.color }}
                    />
                </div>

                <main className="relative z-10 max-w-2xl mx-auto py-16 px-4">
                    {/* Branding/Logo Header */}
                    <div className="text-center mb-8">
                        {branding.logo ? (
                            <div className="inline-block w-24 h-24 mb-4">
                                <img src={branding.logo} alt={user.name} className="w-full h-full object-contain" />
                            </div>
                        ) : (
                            <div className="inline-block mb-4">
                                <div
                                    className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg bg-cover bg-center border-4 border-white transition-colors"
                                    style={{
                                        backgroundImage: user.avatar ? `url('${user.avatar}')` : undefined,
                                        backgroundColor: user.avatar ? 'transparent' : `${branding.color}10`,
                                        borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'white'
                                    }}
                                >
                                    {!user.avatar && <span className="text-3xl font-bold" style={{ color: branding.color }}>{user.name?.charAt(0)}</span>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Hero Content */}
                    <div className="text-center mb-12">
                        <h1 className={`text-4xl font-bold mb-4 tracking-tight ${isDarkMode ? 'text-white' : 'text-[#1d0c0c]'}`}>
                            {user.heroTitle || user.name}
                        </h1>
                        <p className={`text-xl mb-4 opacity-90 ${isDarkMode ? 'text-gray-300' : 'text-[#6b4444]'}`} style={{ textShadow: isDarkMode ? `0 0 20px ${branding.color}40` : 'none' }}>
                            {user.heroSubtitle || (user.bio ? user.bio : 'Book a time to connect!')}
                        </p>
                        {user.heroDescription && (
                            <p className={`text-base max-w-lg mx-auto leading-relaxed opacity-80 ${isDarkMode ? 'text-gray-400' : 'text-[#6b4444]'}`}>
                                {user.heroDescription}
                            </p>
                        )}

                        {/* Social Links */}
                        {user.socialLinks && (
                            <div className="flex items-center justify-center gap-4 mt-6">
                                {JSON.parse(user.socialLinks).map((link: { platform: string, url: string }, i: number) => (
                                    <a
                                        key={i}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`w-10 h-10 rounded-full border flex items-center justify-center hover:scale-110 transition-transform shadow-sm hover:shadow-md group ${isDarkMode ? 'bg-white/10 border-white/10' : 'bg-white'}`}
                                        style={{ borderColor: isDarkMode ? '' : `${branding.color}20` }}
                                    >
                                        <span
                                            className="material-symbols-outlined text-lg opacity-70 group-hover:opacity-100 transition-opacity"
                                            style={{
                                                color: isDarkMode ? 'white' : branding.color,
                                                textShadow: isDarkMode ? `0 0 10px ${branding.color}` : 'none'
                                            }}
                                        >
                                            {getSocialIcon(link.platform)}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Event Types */}
                    <div className="space-y-4">
                        {eventTypes.length === 0 ? (
                            <div
                                className={`backdrop-blur-xl rounded-2xl border p-12 text-center shadow-lg transition-colors ${isDarkMode ? 'bg-[#141414]/60 border-white/10' : 'bg-white/80'}`}
                                style={{ borderColor: isDarkMode ? '' : `${branding.color}10` }}
                            >
                                <div
                                    className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4"
                                    style={{ backgroundColor: `${branding.color}10` }}
                                >
                                    <span className="material-symbols-outlined text-3xl" style={{ color: `${branding.color}50` }}>event_busy</span>
                                </div>
                                <p className={isDarkMode ? 'text-gray-400' : 'text-[#6b4444]'}>No event types available yet.</p>
                            </div>
                        ) : (
                            eventTypes.map((event) => (
                                <Link
                                    key={event.$id}
                                    href={`/book/${username}/${event.slug}`}
                                    className={`block backdrop-blur-xl rounded-xl border p-6 hover:shadow-xl transition-all group hover:scale-[1.02] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none ${isDarkMode ? 'bg-[#141414]/80 border-white/10 hover:bg-[#1a1a1a]' : 'bg-white/90 hover:bg-white'}`}
                                    style={{ borderColor: isDarkMode ? '' : `${branding.color}10` }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div
                                                className="w-4 h-4 rounded-full mt-1.5 shadow-lg"
                                                style={{ backgroundColor: event.color || branding.color, boxShadow: `0 0 20px ${event.color || branding.color}40` }}
                                            />
                                            <div>
                                                <h3
                                                    className={`text-xl font-bold transition-colors ${isDarkMode ? 'text-white' : 'text-[#1d0c0c]'}`}
                                                >
                                                    {event.title}
                                                </h3>
                                                <p className={`mt-1 text-sm font-medium opacity-80 ${isDarkMode ? 'text-gray-400' : 'text-[#6b4444]'}`}>{event.description || 'No description'}</p>
                                                <div className="flex items-center gap-6 mt-4">
                                                    <span className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-[#6b4444]'}`}>
                                                        <span className="material-symbols-outlined text-lg" style={{ color: branding.color }}>schedule</span>
                                                        {event.duration} min
                                                    </span>
                                                    <span className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-[#6b4444]'}`}>
                                                        <span className="material-symbols-outlined text-lg" style={{ color: branding.color }}>call</span>
                                                        Audio call
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center transition-all group-hover:text-white"
                                            style={{
                                                backgroundColor: `${branding.color}10`,
                                                color: branding.color
                                            }}
                                        >
                                            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">arrow_forward</span>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>

                    {/* Mandatory Branding Footer */}
                    <footer className="mt-20 text-center flex flex-col items-center gap-3">
                        <Link href="/" className={`inline-flex items-center gap-2 px-3 py-1.5 backdrop-blur-md rounded-full border hover:bg-opacity-80 transition-colors shadow-sm ${isDarkMode ? 'bg-white/10 border-white/10 text-gray-400 hover:bg-white/20' : 'bg-white/50 border-gray-100 hover:bg-white text-gray-500'}`}>
                            <span className="text-[10px] font-semibold uppercase tracking-wider">Made with</span>
                            <div className={`h-3 w-px ${isDarkMode ? 'bg-white/20' : 'bg-gray-200'}`} />
                            <Logo size="sm" href="" className="scale-75 origin-left" />
                        </Link>
                    </footer>
                </main>
            </div>
        </IframeGuard>
    );
}

