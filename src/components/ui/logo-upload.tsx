'use client';

import { useState, useRef } from 'react';
import { Label } from './label';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { AvatarCropper } from './avatar-cropper';
import { databases, storage, appwriteConfig } from '@/lib/appwrite/config';
import { ID } from 'appwrite';

interface LogoUploadProps {
    value?: string; // URL of current logo
    onChange: (url: string) => void;
    bucketId: string;
}

export function LogoUpload({ value, onChange, bucketId }: LogoUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [logoUrl, setLogoUrl] = useState(value);
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setIsCropperOpen(true);
        }
    };

    const handleCroppedImage = async (blob: Blob) => {
        setIsUploading(true);
        setIsCropperOpen(false);
        try {
            const file = new File([blob], 'logo.png', { type: 'image/png' });
            // Upload to Bucket
            const uploaded = await storage.createFile(bucketId, ID.unique(), file);
            const viewUrl = storage.getFileView(bucketId, uploaded.$id);
            const url = viewUrl.toString();

            setLogoUrl(url);
            onChange(url);
        } catch (error) {
            console.error('Error uploading logo:', error);
            alert('Failed to upload logo.');
        } finally {
            setIsUploading(false);
            setSelectedFile(null);
        }
    };

    return (
        <div className="space-y-4">
            <Label>Brand Logo</Label>
            <div className="flex items-center gap-6">
                <div
                    className={cn(
                        "w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden relative group",
                        logoUrl ? "border-solid border-gray-200" : ""
                    )}
                >
                    {logoUrl ? (
                        <img src={logoUrl} alt="Brand Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                        <span className="material-symbols-outlined text-gray-400 text-3xl">image</span>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:text-white"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Change
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? 'Uploading...' : 'Upload Logo'}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                        Recommended: 512x512px PNG or JPG.<br />Max 2MB.
                    </p>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                />
            </div>

            {isCropperOpen && selectedFile && (
                <AvatarCropper
                    file={selectedFile}
                    onCrop={handleCroppedImage}
                    onCancel={() => {
                        setIsCropperOpen(false);
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                />
            )}
        </div>
    );
}
