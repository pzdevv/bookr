'use client';

import { useState, useEffect } from 'react';

export function useBookingTheme() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Check session storage first
        const stored = sessionStorage.getItem('bookr_theme_preference');
        if (stored) {
            setIsDarkMode(stored === 'dark');
        } else {
            // Check system preference
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDarkMode(systemPrefersDark);
        }
    }, []);

    const toggleTheme = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        sessionStorage.setItem('bookr_theme_preference', newMode ? 'dark' : 'light');
    };

    return { isDarkMode, toggleTheme, mounted };
}
