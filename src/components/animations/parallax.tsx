'use client';

import { useRef, useEffect, useState, ReactNode } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

interface ParallaxProps {
    children: ReactNode;
    offset?: number;
    className?: string;
}

export function ParallaxSection({ children, offset = 50, className = '' }: ParallaxProps) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start'],
    });

    const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);
    const springY = useSpring(y, { stiffness: 100, damping: 30 });

    return (
        <motion.div ref={ref} style={{ y: springY }} className={className}>
            {children}
        </motion.div>
    );
}

export function ParallaxImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start'],
    });

    const y = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
    const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.05, 1]);

    return (
        <div ref={ref} className={`overflow-hidden ${className}`}>
            <motion.img src={src} alt={alt} style={{ y, scale }} className="w-full h-full object-cover" />
        </div>
    );
}

export function FadeInOnScroll({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay, ease: 'easeOut' }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function ScaleInOnScroll({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay, type: 'spring', stiffness: 100 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function StaggerContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={{
                visible: { transition: { staggerChildren: 0.1 } },
                hidden: {},
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function StaggerItem({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <motion.div
            variants={{
                visible: { opacity: 1, y: 0 },
                hidden: { opacity: 0, y: 20 },
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function MouseParallax({ children, strength = 20, className = '' }: { children: ReactNode; strength?: number; className?: string }) {
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth - 0.5) * strength;
            const y = (e.clientY / window.innerHeight - 0.5) * strength;
            setPosition({ x, y });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [strength]);

    return (
        <motion.div
            animate={{ x: position.x, y: position.y }}
            transition={{ type: 'spring', stiffness: 150, damping: 15 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
