'use client';

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { useAuth } from '@/lib/hooks/use-auth';
import { userService } from '@/lib/appwrite/database';
import { sanitizeName, sanitizeSlug, sanitizeMultiline } from '@/lib/utils/sanitize';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function SettingsPage() {
    const { user, userProfile, refreshUser } = useAuth();
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [timezone, setTimezone] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [saveMessage, setSaveMessage] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [notifications, setNotifications] = useState({
        emailBookings: true,
        emailReminders: true,
        emailMarketing: false,
    });

    useEffect(() => {
        if (userProfile) {
            setName(userProfile.name || '');
            setUsername(userProfile.username || userProfile.name?.toLowerCase().replace(/\s+/g, '-') || '');
            setBio(userProfile.bio || '');
            setTimezone(userProfile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
            setAvatarUrl(userProfile.avatar || '');
        }
    }, [userProfile]);

    // GSAP Scroll Animations
    useEffect(() => {
        if (!containerRef.current) return;

        const sections = containerRef.current.querySelectorAll('.settings-section');

        sections.forEach((section, index) => {
            gsap.fromTo(section,
                {
                    opacity: 0,
                    y: 60,
                    scale: 0.95
                },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.8,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 85%',
                        end: 'top 50%',
                        toggleActions: 'play none none reverse'
                    },
                    delay: index * 0.1
                }
            );
        });

        return () => {
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        };
    }, []);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userProfile) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            setSaveMessage('Please select an image file');
            return;
        }
        if (file.size > 1024 * 1024) { // 1MB limit
            setSaveMessage('Image must be under 1MB');
            return;
        }

        setIsUploading(true);
        try {
            const url = await userService.uploadAvatar(file);
            await userService.update(userProfile.$id, { avatar: url });
            setAvatarUrl(url);
            await refreshUser();
            setSaveMessage('Avatar updated!');

            // Animate the avatar
            gsap.fromTo('.avatar-container',
                { scale: 1.2, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
            );
        } catch (error) {
            console.error('Avatar upload error:', error);
            setSaveMessage('Failed to upload avatar');
        } finally {
            setIsUploading(false);
            setTimeout(() => setSaveMessage(''), 3000);
        }
    };

    const handleSave = async () => {
        if (!userProfile) return;
        setIsSaving(true);
        setUsernameError('');

        try {
            // Sanitize inputs
            const cleanName = sanitizeName(name);
            const cleanUsername = sanitizeSlug(username);
            const cleanBio = sanitizeMultiline(bio, 500);

            // Validate
            if (cleanName.length < 2) {
                setUsernameError('Name must be at least 2 characters');
                setIsSaving(false);
                return;
            }
            if (cleanUsername.length < 3) {
                setUsernameError('Username must be at least 3 characters');
                setIsSaving(false);
                return;
            }

            // Check if username is available
            const isAvailable = await userService.isUsernameAvailable(cleanUsername, userProfile.$id);
            if (!isAvailable) {
                setUsernameError('This username is already taken');
                setIsSaving(false);
                return;
            }

            await userService.update(userProfile.$id, {
                name: cleanName,
                username: cleanUsername,
                bio: cleanBio,
                timezone
            });
            await refreshUser();
            setSaveMessage('Settings saved!');

            // Success animation
            gsap.fromTo('.save-btn',
                { scale: 1 },
                { scale: 1.05, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.out' }
            );
        } catch (error) {
            console.error('Error:', error);
            setSaveMessage('Failed to save');
        }
        finally {
            setIsSaving(false);
            setTimeout(() => setSaveMessage(''), 3000);
        }
    };

    return (
        <DashboardLayout>
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-8 py-4 border-b border-[#850000]/5">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight text-[#1d0c0c]">Settings</h2>
                    {saveMessage && (
                        <span className={`ml-4 text-sm font-medium px-3 py-1 rounded-lg ${saveMessage.includes('Failed') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {saveMessage}
                        </span>
                    )}
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="save-btn px-4 py-2 rounded-lg bg-[#850000] text-white text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50"
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </header>

            <div ref={containerRef} className="p-8 max-w-3xl space-y-6">
                {/* Profile Section */}
                <div className="settings-section bg-white rounded-xl border border-[#850000]/5 overflow-hidden shadow-[4px_4px_0px_0px_rgba(133,0,0,0.1)]">
                    <div className="px-6 py-5 border-b border-[#850000]/5">
                        <h3 className="text-lg font-bold text-[#1d0c0c]">Profile</h3>
                        <p className="text-sm text-[#6b4444]">Manage your public profile information.</p>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* Avatar */}
                        <div className="flex items-center gap-6">
                            <div
                                onClick={handleAvatarClick}
                                className="avatar-container w-20 h-20 rounded-xl bg-[#850000] flex items-center justify-center bg-cover bg-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:scale-105 transition-transform relative overflow-hidden group"
                                style={avatarUrl ? { backgroundImage: `url('${avatarUrl}')` } : undefined}
                            >
                                {!avatarUrl && <span className="text-white text-3xl font-bold">{name.charAt(0) || 'U'}</span>}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
                                </div>
                                {isUploading && (
                                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={handleAvatarClick}
                                    disabled={isUploading}
                                    className="px-4 py-2 rounded-lg bg-[#850000]/5 text-[#1d0c0c] text-sm font-medium border border-[#850000]/10 shadow-[2px_2px_0px_0px_rgba(133,0,0,0.1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-50"
                                >
                                    {isUploading ? 'Uploading...' : 'Change avatar'}
                                </button>
                                <p className="text-xs text-[#6b4444]">JPG, GIF or PNG. 1MB max.</p>
                            </div>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-xs font-semibold text-[#1d0c0c] mb-1.5">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full h-11 px-4 rounded-lg border border-[#850000]/10 text-sm focus:ring-2 focus:ring-[#850000]/20 focus:border-[#850000] transition-all bg-white shadow-[2px_2px_0px_0px_rgba(133,0,0,0.05)]"
                                placeholder="Your name"
                            />
                        </div>

                        {/* Username */}
                        <div>
                            <label className="block text-xs font-semibold text-[#1d0c0c] mb-1.5">Booking Link</label>
                            <div className="flex">
                                <span className="h-11 px-4 rounded-l-lg border border-r-0 border-[#850000]/10 bg-[#850000]/5 flex items-center text-sm text-[#6b4444]">
                                    /book/
                                </span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                                        setUsernameError('');
                                    }}
                                    className={`flex-1 h-11 px-4 rounded-r-lg border text-sm focus:ring-2 focus:ring-[#850000]/20 focus:border-[#850000] transition-all bg-white shadow-[2px_2px_0px_0px_rgba(133,0,0,0.05)] ${usernameError ? 'border-red-500' : 'border-[#850000]/10'}`}
                                    placeholder="your-custom-slug"
                                />
                            </div>
                            {usernameError && (
                                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">error</span>
                                    {usernameError}
                                </p>
                            )}
                            <p className="text-xs text-[#6b4444] mt-1">This is your unique booking page URL. Use lowercase letters, numbers, and hyphens.</p>
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-xs font-semibold text-[#1d0c0c] mb-1.5">Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 rounded-lg border border-[#850000]/10 text-sm focus:ring-2 focus:ring-[#850000]/20 focus:border-[#850000] transition-all resize-none bg-white shadow-[2px_2px_0px_0px_rgba(133,0,0,0.05)]"
                                placeholder="A brief description for your profile."
                            />
                        </div>

                        {/* Timezone */}
                        <div>
                            <label className="block text-xs font-semibold text-[#1d0c0c] mb-1.5">Timezone</label>
                            <select
                                value={timezone}
                                onChange={(e) => setTimezone(e.target.value)}
                                className="w-full h-11 px-4 rounded-lg border border-[#850000]/10 text-sm focus:ring-2 focus:ring-[#850000]/20 focus:border-[#850000] transition-all bg-white shadow-[2px_2px_0px_0px_rgba(133,0,0,0.05)]"
                            >
                                <option value="America/New_York">Eastern Time (ET)</option>
                                <option value="America/Chicago">Central Time (CT)</option>
                                <option value="America/Denver">Mountain Time (MT)</option>
                                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                <option value="Europe/London">London (GMT)</option>
                                <option value="Europe/Paris">Paris (CET)</option>
                                <option value="Asia/Tokyo">Tokyo (JST)</option>
                                <option value="Asia/Kathmandu">Kathmandu (NPT)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="settings-section bg-white rounded-xl border border-[#850000]/5 overflow-hidden shadow-[4px_4px_0px_0px_rgba(133,0,0,0.1)]">
                    <div className="px-6 py-5 border-b border-[#850000]/5">
                        <h3 className="text-lg font-bold text-[#1d0c0c]">Notifications</h3>
                        <p className="text-sm text-[#6b4444]">Manage how you receive notifications.</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <p className="text-sm font-medium text-[#1d0c0c]">Booking confirmations</p>
                                <p className="text-xs text-[#6b4444]">Get notified when someone books a meeting.</p>
                            </div>
                            <button
                                onClick={() => setNotifications({ ...notifications, emailBookings: !notifications.emailBookings })}
                                className={`w-10 h-6 rounded-full transition-colors relative ${notifications.emailBookings ? 'bg-[#850000] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]' : 'bg-gray-200'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${notifications.emailBookings ? 'left-5' : 'left-1'}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between py-3 border-t border-[#850000]/5">
                            <div>
                                <p className="text-sm font-medium text-[#1d0c0c]">Reminders</p>
                                <p className="text-xs text-[#6b4444]">Receive reminders before scheduled meetings.</p>
                            </div>
                            <button
                                onClick={() => setNotifications({ ...notifications, emailReminders: !notifications.emailReminders })}
                                className={`w-10 h-6 rounded-full transition-colors relative ${notifications.emailReminders ? 'bg-[#850000] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]' : 'bg-gray-200'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${notifications.emailReminders ? 'left-5' : 'left-1'}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between py-3 border-t border-[#850000]/5">
                            <div>
                                <p className="text-sm font-medium text-[#1d0c0c]">Marketing emails</p>
                                <p className="text-xs text-[#6b4444]">News, updates, and promotional offers.</p>
                            </div>
                            <button
                                onClick={() => setNotifications({ ...notifications, emailMarketing: !notifications.emailMarketing })}
                                className={`w-10 h-6 rounded-full transition-colors relative ${notifications.emailMarketing ? 'bg-[#850000] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]' : 'bg-gray-200'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${notifications.emailMarketing ? 'left-5' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="settings-section bg-white rounded-xl border border-red-200 overflow-hidden shadow-[4px_4px_0px_0px_rgba(220,38,38,0.2)]">
                    <div className="px-6 py-5 border-b border-red-100 bg-red-50/50">
                        <h3 className="text-lg font-bold text-red-700">Danger Zone</h3>
                        <p className="text-sm text-red-600">Irreversible actions for your account.</p>
                    </div>
                    <div className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-[#1d0c0c]">Delete account</p>
                            <p className="text-xs text-[#6b4444]">Permanently delete your account and all data.</p>
                        </div>
                        <button className="px-4 py-2 rounded-lg bg-red-100 text-red-700 text-sm font-bold hover:bg-red-200 transition-colors border border-red-200 shadow-[2px_2px_0px_0px_rgba(220,38,38,0.2)]">
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
