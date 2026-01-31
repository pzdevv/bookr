'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AvatarCropperProps {
    file: File;
    onCrop: (croppedBlob: Blob) => void;
    onCancel: () => void;
}

export function AvatarCropper({ file, onCrop, onCancel }: AvatarCropperProps) {
    const [imageSrc, setImageSrc] = useState<string>('');
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const CROP_SIZE = 256;

    // Load image from file
    useEffect(() => {
        const reader = new FileReader();
        reader.onload = () => {
            setImageSrc(reader.result as string);
        };
        reader.readAsDataURL(file);
    }, [file]);

    // Get natural image dimensions when loaded
    const handleImageLoad = useCallback(() => {
        if (imageRef.current) {
            setImageSize({
                width: imageRef.current.naturalWidth,
                height: imageRef.current.naturalHeight
            });
        }
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    }, [isDragging, dragStart]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Attach global mouse events
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // Handle touch events for mobile
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            setIsDragging(true);
            setDragStart({
                x: touch.clientX - position.x,
                y: touch.clientY - position.y
            });
        }
    };

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isDragging || e.touches.length !== 1) return;
        const touch = e.touches[0];
        setPosition({
            x: touch.clientX - dragStart.x,
            y: touch.clientY - dragStart.y
        });
    }, [isDragging, dragStart]);

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleTouchEnd);
        }
        return () => {
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isDragging, handleTouchMove, handleTouchEnd]);

    const handleCrop = () => {
        if (!canvasRef.current || !imageRef.current || !containerRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = CROP_SIZE;
        canvas.height = CROP_SIZE;

        const containerRect = containerRef.current.getBoundingClientRect();
        const cropAreaLeft = (containerRect.width - CROP_SIZE) / 2;
        const cropAreaTop = (containerRect.height - CROP_SIZE) / 2;

        // Calculate the source area from the original image
        const displayedWidth = imageSize.width * scale;
        const displayedHeight = imageSize.height * scale;

        const imageLeft = (containerRect.width - displayedWidth) / 2 + position.x;
        const imageTop = (containerRect.height - displayedHeight) / 2 + position.y;

        const srcX = ((cropAreaLeft - imageLeft) / scale) * (imageRef.current.naturalWidth / imageSize.width);
        const srcY = ((cropAreaTop - imageTop) / scale) * (imageRef.current.naturalHeight / imageSize.height);
        const srcSize = (CROP_SIZE / scale) * (imageRef.current.naturalWidth / imageSize.width);

        ctx.drawImage(
            imageRef.current,
            srcX,
            srcY,
            srcSize,
            srcSize,
            0,
            0,
            CROP_SIZE,
            CROP_SIZE
        );

        canvas.toBlob((blob) => {
            if (blob) onCrop(blob);
        }, 'image/jpeg', 0.9);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                onClick={(e) => e.target === e.currentTarget && onCancel()}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-[#850000]/10 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-[#1d0c0c]">Crop Avatar</h3>
                        <button
                            onClick={onCancel}
                            className="w-8 h-8 rounded-lg bg-[#850000]/5 flex items-center justify-center text-[#6b4444] hover:bg-[#850000]/10 transition-colors cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>

                    {/* Crop Area */}
                    <div
                        ref={containerRef}
                        className="relative w-full aspect-square bg-[#1a1a1a] overflow-hidden cursor-move select-none"
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                    >
                        {/* Image */}
                        {imageSrc && (
                            <img
                                ref={imageRef}
                                src={imageSrc}
                                alt="Crop preview"
                                onLoad={handleImageLoad}
                                className="absolute top-1/2 left-1/2 max-w-none pointer-events-none"
                                style={{
                                    transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                    transformOrigin: 'center'
                                }}
                                draggable={false}
                            />
                        )}

                        {/* Crop Overlay */}
                        <div className="absolute inset-0 pointer-events-none">
                            {/* Dark overlay with circular cutout */}
                            <div className="absolute inset-0 bg-black/60" style={{
                                clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, 
                                    calc(50% - 128px) calc(50% - 128px), 
                                    calc(50% - 128px) calc(50% + 128px), 
                                    calc(50% + 128px) calc(50% + 128px), 
                                    calc(50% + 128px) calc(50% - 128px), 
                                    calc(50% - 128px) calc(50% - 128px))`
                            }} />

                            {/* Circular border */}
                            <div
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-white/80"
                                style={{ width: CROP_SIZE, height: CROP_SIZE }}
                            />
                        </div>

                        {/* Instructions */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs text-center bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                            Drag to reposition
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="p-6 space-y-4">
                        {/* Zoom Slider */}
                        <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-[#6b4444] text-lg">zoom_out</span>
                            <input
                                type="range"
                                min="0.5"
                                max="3"
                                step="0.05"
                                value={scale}
                                onChange={(e) => setScale(parseFloat(e.target.value))}
                                className="flex-1 h-2 bg-[#850000]/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#850000] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
                            />
                            <span className="material-symbols-outlined text-[#6b4444] text-lg">zoom_in</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={onCancel}
                                className="flex-1 py-3 rounded-xl border border-[#850000]/20 text-[#6b4444] font-medium hover:bg-[#850000]/5 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    // Use original file without cropping
                                    file.arrayBuffer().then(buffer => {
                                        const blob = new Blob([buffer], { type: file.type });
                                        onCrop(blob);
                                    });
                                }}
                                className="flex-1 py-3 rounded-xl border border-[#850000]/20 text-[#850000] font-medium hover:bg-[#850000]/5 transition-colors cursor-pointer"
                            >
                                Use Original
                            </button>
                            <button
                                onClick={handleCrop}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#850000] to-[#6b0000] text-white font-bold hover:shadow-lg hover:shadow-[#850000]/20 transition-all cursor-pointer"
                            >
                                Apply Crop
                            </button>
                        </div>
                    </div>

                    {/* Hidden canvas for cropping */}
                    <canvas ref={canvasRef} className="hidden" />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
