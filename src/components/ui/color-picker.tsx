'use client';

import { Label } from './label';
import { cn } from '@/lib/utils';
import { Input } from './input';

interface ColorPickerProps {
    value?: string;
    onChange: (value: string) => void;
}

const PRESET_COLORS = [
    '#850000', // Brand Red
    '#000000', // Black
    '#1d4ed8', // Blue
    '#047857', // Emerald
    '#7c3aed', // Violet
    '#be123c', // Rose
    '#c2410c', // Orange
    '#0e7490', // Cyan
];

export function ColorPicker({ value = '#850000', onChange }: ColorPickerProps) {
    return (
        <div className="space-y-4">
            <Label>Brand Color</Label>
            <div className="flex flex-wrap gap-3">
                {PRESET_COLORS.map((color) => (
                    <button
                        key={color}
                        type="button"
                        onClick={() => onChange(color)}
                        className={cn(
                            "w-10 h-10 rounded-full border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2",
                            value === color ? "border-gray-900 ring-gray-900" : "border-transparent hover:shadow-lg"
                        )}
                        style={{ backgroundColor: color }}
                        aria-label={`Select color ${color}`}
                    />
                ))}
                <div className="relative flex items-center">
                    <div
                        className="w-10 h-10 rounded-full border-2 border-gray-200 overflow-hidden"
                        style={{ backgroundColor: value }}
                    >
                        <input
                            type="color"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                    </div>
                </div>
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-28 font-mono text-sm uppercase"
                    maxLength={7}
                />
            </div>
        </div>
    );
}
