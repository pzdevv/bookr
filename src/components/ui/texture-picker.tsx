'use client';

import { TEXTURES } from '@/lib/constants/textures';
import { cn } from '@/lib/utils';
import { Label } from './label';

interface TexturePickerProps {
    value: string;
    onChange: (value: string) => void;
    // For manual uploads (future)
    onUpload?: (file: File) => void;
}

export function TexturePicker({ value, onChange, onUpload }: TexturePickerProps) {
    return (
        <div className="space-y-4">
            <Label>Background Texture</Label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {TEXTURES.map((texture) => (
                    <button
                        key={texture.id}
                        type="button"
                        onClick={() => onChange(texture.id)}
                        className={cn(
                            "relative aspect-square rounded-lg border-2 overflow-hidden transition-all hover:scale-105",
                            value === texture.id ? "border-[#850000] ring-2 ring-[#850000]/20" : "border-gray-200 hover:border-[#850000]/50"
                        )}
                    >
                        <div
                            className="absolute inset-0 bg-white"
                            style={{
                                backgroundImage: texture.value,
                                backgroundSize: texture.id === 'clean' ? 'auto' : '20px 20px'
                            }}
                        />
                        <span className="absolute bottom-1 left-0 right-0 text-[10px] font-medium text-center bg-white/90 py-0.5">
                            {texture.name}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
