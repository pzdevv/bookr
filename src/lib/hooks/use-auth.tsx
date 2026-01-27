'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, AuthUser } from '@/lib/appwrite/auth';
import { userService, User } from '@/lib/appwrite/database';
import { getUserTimezone } from '@/lib/utils';

interface AuthContextType {
    user: AuthUser | null;
    userProfile: User | null;
    isLoading: boolean;
    signUp: (email: string, password: string, name: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
    sendPasswordRecovery: (email: string) => Promise<void>;
    resetPassword: (userId: string, secret: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [userProfile, setUserProfile] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = async () => {
        try {
            // SPEED OPTIMIZATION: Check local cache first for instant UI
            const cached = localStorage.getItem('user_profile_cache');
            if (cached && isLoading) {
                try {
                    const parsed = JSON.parse(cached);
                    // Only use cache if it matches current signed-in user (simple check, or clearing cache on logout)
                    setUserProfile(parsed);
                } catch (e) { localStorage.removeItem('user_profile_cache'); }
            }

            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);


            if (currentUser) {
                // Try to get user profile from database
                let profile: User | null = null;

                try {
                    profile = await userService.getByEmail(currentUser.email);
                    console.log('Profile lookup result:', profile ? 'found' : 'not found');
                } catch (lookupError: any) {
                    console.error('Profile lookup failed (permission issue?):', lookupError.message);
                    // Continue - we'll try to create the profile
                }

                // If no profile exists, create one
                if (!profile) {
                    console.log('Creating new user profile...');
                    try {
                        const userName = currentUser.name || currentUser.email.split('@')[0];
                        const baseUsername = userName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                        const uniqueUsername = `${baseUsername}-${Date.now().toString(36).slice(-4)}`;

                        profile = await userService.create({
                            name: userName,
                            email: currentUser.email,
                            username: uniqueUsername,
                            role: 'user',
                            timezone: getUserTimezone(),
                        });
                        console.log('Successfully created user profile:', profile.$id);
                    } catch (createError: any) {
                        console.error('Failed to create profile:', createError.message, createError.code);
                        // If it's a duplicate error, try to fetch again
                        if (createError.code === 409) {
                            console.log('Profile might already exist, trying to fetch again...');
                            try {
                                profile = await userService.getByEmail(currentUser.email);
                            } catch (e) {
                                console.error('Retry fetch also failed:', e);
                            }
                        }
                    }
                }

                // Ensure user has at least one event type and availability
                if (profile) {
                    try {
                        const { eventTypeService, availabilityService } = await import('@/lib/appwrite/database');

                        // Check and create event type if missing
                        const existingEvents = await eventTypeService.listByUser(profile.$id);
                        if (existingEvents.length === 0) {
                            await eventTypeService.create({
                                userId: profile.$id,
                                title: 'Meeting',
                                duration: 30,
                                buffer: 0,
                                color: '#fbbd23',
                                description: '30 minute meeting',
                                slug: 'meeting',
                                isActive: true,
                            });
                            console.log('Created default event type for user');
                        }

                        // Check and create availability if missing
                        const existingAvailability = await availabilityService.listByUser(profile.$id);
                        if (existingAvailability.length === 0) {
                            const defaultDays = [1, 2, 3, 4, 5]; // Mon-Fri
                            await Promise.all(
                                defaultDays.map(day =>
                                    availabilityService.create({
                                        userId: profile!.$id,
                                        day,
                                        startTime: '09:00',
                                        endTime: '17:00',
                                        isEnabled: true,
                                    })
                                )
                            );
                            console.log('Created default availability for user');
                        }
                    } catch (setupError) {
                        console.log('Could not ensure user setup:', setupError);
                    }
                }

                setUserProfile(profile);
                if (profile) {
                    localStorage.setItem('user_profile_cache', JSON.stringify(profile));
                }
            } else {
                setUserProfile(null);
            }
        } catch (error) {
            console.error('Error refreshing user:', error);
            setUser(null);
            setUserProfile(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const signUp = async (email: string, password: string, name: string) => {
        await authService.signUp(email, password, name);
        await refreshUser();
    };

    const signIn = async (email: string, password: string) => {
        await authService.signIn(email, password);
        await refreshUser();
    };

    const signInWithGoogle = async () => {
        await authService.signInWithGoogle();
    };

    const signOut = async () => {
        await authService.signOut();
        setUser(null);
        setUserProfile(null);
        localStorage.removeItem('user_profile_cache');
    };

    const sendPasswordRecovery = async (email: string) => {
        await authService.sendPasswordRecovery(email);
    };

    const resetPassword = async (userId: string, secret: string, password: string) => {
        await authService.resetPassword(userId, secret, password);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                userProfile,
                isLoading,
                signUp,
                signIn,
                signInWithGoogle,
                signOut,
                refreshUser,
                sendPasswordRecovery,
                resetPassword,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
