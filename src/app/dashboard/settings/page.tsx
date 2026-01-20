'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { useAuth } from '@/lib/hooks/use-auth';
import { userService } from '@/lib/appwrite/database';

export default function SettingsPage() {
    const { user, userProfile, signOut } = useAuth();
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [timezone, setTimezone] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [notifications, setNotifications] = useState({
        emailBookings: true,
        emailReminders: true,
        emailMarketing: false,
    });

    useEffect(() => {
        if (userProfile) {
            setName(userProfile.name || '');
            // Use saved username or generate from name
            setUsername(userProfile.username || userProfile.name?.toLowerCase().replace(/\s+/g, '-') || '');
            setBio(userProfile.bio || '');
            setTimezone(userProfile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
        }
    }, [userProfile]);

    const handleSave = async () => {
        if (!userProfile) return;
        setIsSaving(true);
        try {
            await userService.update(userProfile.$id, {
                name,
                timezone
            });
        } catch (error) { console.error('Error:', error); }
        finally { setIsSaving(false); }
    };

    return (
        <DashboardLayout>
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center justify-between bg-white/80 backdrop-blur-md px-8 py-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight">Settings</h2>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl bg-[#fbbd23] text-[#1c180c] text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </header>

            <div className="p-8 max-w-3xl space-y-6">
                {/* Profile Section */}
                <div className="bg-white rounded-2xl border border-[#e9e1cd] overflow-hidden">
                    <div className="px-6 py-5 border-b border-[#e9e1cd]">
                        <h3 className="text-lg font-bold">Profile</h3>
                        <p className="text-sm text-gray-500">Manage your public profile information.</p>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* Avatar */}
                        <div className="flex items-center gap-6">
                            <div
                                className="w-20 h-20 rounded-full bg-[#fbbd23]/20 flex items-center justify-center bg-cover bg-center"
                                style={userProfile?.avatar ? { backgroundImage: `url('${userProfile.avatar}')` } : undefined}
                            >
                                {!userProfile?.avatar && <span className="text-[#fbbd23] text-3xl font-bold">{name.charAt(0) || 'U'}</span>}
                            </div>
                            <div className="flex flex-col gap-2">
                                <button className="px-4 py-2 rounded-xl bg-[#f4f0e6] text-[#1c180c] text-sm font-medium hover:bg-[#e9e1cd] transition-colors">
                                    Change avatar
                                </button>
                                <p className="text-xs text-gray-400">JPG, GIF or PNG. 1MB max.</p>
                            </div>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#fbbd23]/20 focus:border-[#fbbd23] transition-all"
                                placeholder="Your name"
                            />
                        </div>

                        {/* Username */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Username</label>
                            <div className="flex">
                                <span className="h-11 px-4 rounded-l-xl border border-r-0 border-gray-200 bg-[#f4f0e6] flex items-center text-sm text-gray-500">
                                    bookr.com/
                                </span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                    className="flex-1 h-11 px-4 rounded-r-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#fbbd23]/20 focus:border-[#fbbd23] transition-all"
                                    placeholder="username"
                                />
                            </div>
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#fbbd23]/20 focus:border-[#fbbd23] transition-all resize-none"
                                placeholder="A brief description for your profile."
                            />
                        </div>

                        {/* Timezone */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Timezone</label>
                            <select
                                value={timezone}
                                onChange={(e) => setTimezone(e.target.value)}
                                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#fbbd23]/20 focus:border-[#fbbd23] transition-all"
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
                <div className="bg-white rounded-2xl border border-[#e9e1cd] overflow-hidden">
                    <div className="px-6 py-5 border-b border-[#e9e1cd]">
                        <h3 className="text-lg font-bold">Notifications</h3>
                        <p className="text-sm text-gray-500">Manage how you receive notifications.</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <p className="text-sm font-medium text-[#1c180c]">Booking confirmations</p>
                                <p className="text-xs text-gray-500">Get notified when someone books a meeting.</p>
                            </div>
                            <button
                                onClick={() => setNotifications({ ...notifications, emailBookings: !notifications.emailBookings })}
                                className={`w-10 h-6 rounded-full transition-colors relative ${notifications.emailBookings ? 'bg-[#fbbd23]' : 'bg-gray-200'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${notifications.emailBookings ? 'left-5' : 'left-1'}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between py-3 border-t border-gray-100">
                            <div>
                                <p className="text-sm font-medium text-[#1c180c]">Reminders</p>
                                <p className="text-xs text-gray-500">Receive reminders before scheduled meetings.</p>
                            </div>
                            <button
                                onClick={() => setNotifications({ ...notifications, emailReminders: !notifications.emailReminders })}
                                className={`w-10 h-6 rounded-full transition-colors relative ${notifications.emailReminders ? 'bg-[#fbbd23]' : 'bg-gray-200'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${notifications.emailReminders ? 'left-5' : 'left-1'}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between py-3 border-t border-gray-100">
                            <div>
                                <p className="text-sm font-medium text-[#1c180c]">Marketing emails</p>
                                <p className="text-xs text-gray-500">News, updates, and promotional offers.</p>
                            </div>
                            <button
                                onClick={() => setNotifications({ ...notifications, emailMarketing: !notifications.emailMarketing })}
                                className={`w-10 h-6 rounded-full transition-colors relative ${notifications.emailMarketing ? 'bg-[#fbbd23]' : 'bg-gray-200'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${notifications.emailMarketing ? 'left-5' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-white rounded-2xl border border-red-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-red-100 bg-red-50">
                        <h3 className="text-lg font-bold text-red-700">Danger Zone</h3>
                        <p className="text-sm text-red-600">Irreversible actions for your account.</p>
                    </div>
                    <div className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-[#1c180c]">Delete account</p>
                            <p className="text-xs text-gray-500">Permanently delete your account and all data.</p>
                        </div>
                        <button className="px-4 py-2 rounded-xl bg-red-100 text-red-700 text-sm font-bold hover:bg-red-200 transition-colors">
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
