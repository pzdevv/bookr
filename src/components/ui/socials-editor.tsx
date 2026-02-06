'use client';

import { useState, useEffect } from 'react';
import { Label } from './label';
import { Button } from './button';
import { Input } from './input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Instagram, Twitter, Linkedin, Youtube, Globe, Github, Link as LinkIcon, Trash2, Plus } from 'lucide-react';

interface SocialLink {
    platform: string;
    url: string;
}

interface SocialsEditorProps {
    value: string; // JSON string
    onChange: (value: string) => void;
}

const PLATFORMS = [
    { value: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50' },
    { value: 'twitter', label: 'Twitter / X', icon: Twitter, color: 'text-blue-400', bg: 'bg-blue-50' },
    { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700', bg: 'bg-blue-50' },
    { value: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-600', bg: 'bg-red-50' },
    { value: 'website', label: 'Website', icon: Globe, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { value: 'github', label: 'GitHub', icon: Github, color: 'text-gray-900', bg: 'bg-gray-50' },
];

export function SocialsEditor({ value, onChange }: SocialsEditorProps) {
    const [links, setLinks] = useState<SocialLink[]>([]);

    // Sync state with prop
    useEffect(() => {
        try {
            if (value) {
                setLinks(JSON.parse(value));
            }
        } catch {
            setLinks([]);
        }
    }, [value]);

    const [newPlatform, setNewPlatform] = useState(PLATFORMS[0].value);
    const [newUrl, setNewUrl] = useState('');

    const updateLinks = (newLinks: SocialLink[]) => {
        setLinks(newLinks);
        onChange(JSON.stringify(newLinks));
    };

    const addLink = () => {
        if (!newUrl) return;
        const updated = [...links, { platform: newPlatform, url: newUrl }];
        updateLinks(updated);
        setNewUrl('');
    };

    const removeLink = (index: number) => {
        const updated = links.filter((_, i) => i !== index);
        updateLinks(updated);
    };

    const getPlatformConfig = (p: string) => PLATFORMS.find(pl => pl.value === p) || { icon: LinkIcon, color: 'text-gray-500', bg: 'bg-gray-100' };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label>Social Profiles</Label>
                <span className="text-xs text-muted-foreground">{links.length} added</span>
            </div>

            <div className="grid gap-3">
                {links.map((link, idx) => {
                    const config = getPlatformConfig(link.platform);
                    const Icon = config.icon;
                    return (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl group hover:border-[#850000]/10 hover:shadow-sm transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.02)]">
                            <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                <Icon className={`w-5 h-5 ${config.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[#1d0c0c] capitalize mb-0.5">{link.platform}</p>
                                <p className="text-xs text-gray-500 truncate font-mono bg-gray-50 px-1.5 py-0.5 rounded w-fit max-w-full">{link.url}</p>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                onClick={() => removeLink(idx)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    );
                })}

                {links.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 text-sm bg-gray-50/50">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                            <LinkIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        No social links added yet
                    </div>
                )}
            </div>

            <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 space-y-3">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Add New Link</Label>
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="md:w-[160px]">
                        <Select value={newPlatform} onValueChange={setNewPlatform}>
                            <SelectTrigger className="bg-white border-gray-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PLATFORMS.map(p => {
                                    const Icon = p.icon;
                                    return (
                                        <SelectItem key={p.value} value={p.value}>
                                            <div className="flex items-center gap-2">
                                                <Icon className={`w-4 h-4 ${p.color}`} />
                                                <span>{p.label}</span>
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 relative">
                        <Input
                            placeholder="Paste URL here..."
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
                            className="bg-white border-gray-200 pr-10"
                        />
                        {newUrl && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <span className={`block w-2 h-2 rounded-full ${newUrl.startsWith('http') ? 'bg-green-500' : 'bg-orange-300'}`} />
                            </div>
                        )}
                    </div>
                    <Button type="button" onClick={addLink} disabled={!newUrl} className="bg-[#1d0c0c] hover:bg-black text-white shrink-0">
                        <Plus className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">Add Link</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
