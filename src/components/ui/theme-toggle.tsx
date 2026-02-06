'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ThemeToggleProps {
    isDark: boolean;
    toggle: () => void;
    brandingColor?: string;
}

export function ThemeToggle({ isDark, toggle, brandingColor = '#850000' }: ThemeToggleProps) {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggle}
            className="fixed top-6 right-6 z-50 p-2.5 rounded-full shadow-lg backdrop-blur-md border transition-all"
            style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                color: isDark ? '#fff' : '#1d0c0c'
            }}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            {isDark ? (
                <Sun className="w-5 h-5" />
            ) : (
                <Moon className="w-5 h-5" />
            )}
        </motion.button>
    );
}
