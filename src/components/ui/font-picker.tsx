'use client';

import { FONTS } from '@/lib/constants/fonts';
import { cn } from '@/lib/utils';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { useEffect } from 'react';

interface FontPickerProps {
    value: string;
    onChange: (value: string) => void;
}

export function FontPicker({ value, onChange }: FontPickerProps) {
    // Basic font loading mechanism for preview
    useEffect(() => {
        const linkId = 'bookr-font-preview';
        let link = document.getElementById(linkId) as HTMLLinkElement;

        if (!link) {
            link = document.createElement('link');
            link.id = linkId;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }

        // Load all fonts for preview (optimize in prod to load only selected?)
        // For now, load all to show checking
        const allFontsUrl = FONTS.map(f => f.url).join('|'); // Ensure valid URL concatenation or load individually
        // Actually, Google Fonts API allows multiple families in one URL: family=A&family=B
        // Let's just load the currently selected one to be safe and efficient

        const selectedFont = FONTS.find(f => f.name === value);
        if (selectedFont) {
            const fontLink = document.createElement('link');
            fontLink.href = selectedFont.url;
            fontLink.rel = 'stylesheet';
            document.head.appendChild(fontLink);
            return () => {
                document.head.removeChild(fontLink);
            };
        }
    }, [value]);

    return (
        <div className="space-y-4">
            <Label>Typography</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FONTS.map((font) => (
                    <button
                        key={font.name}
                        type="button"
                        onClick={() => onChange(font.name)}
                        className={cn(
                            "group relative flex items-center justify-between p-3 rounded-lg border-2 text-left transition-all hover:bg-gray-50",
                            value === font.name ? "border-[#850000] bg-[#850000]/5" : "border-gray-100 hover:border-gray-200"
                        )}
                    >
                        <span
                            className="text-lg text-[#1d0c0c]"
                            style={{ fontFamily: font.family }}
                        >
                            Ag
                        </span>
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-medium text-gray-900 group-hover:text-[#850000] transition-colors">
                                {font.name}
                            </span>
                        </div>
                        {value === font.name && (
                            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#850000]" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
