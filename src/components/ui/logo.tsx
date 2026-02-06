import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
    variant?: 'light' | 'dark';
    href?: string;
    className?: string; // Added className prop
}

const sizeClasses = {
    sm: { width: 160, height: 56 },
    md: { width: 200, height: 64 },
    lg: { width: 240, height: 80 },
};

export function Logo({ size = 'md', showText = true, variant = 'dark', href = '/', className = '' }: LogoProps) {
    const dimensions = sizeClasses[size];

    const content = (
        <div className={`flex items-center gap-2 ${className}`}>
            <Image
                src="/logo.png"
                alt="Book&Call"
                width={dimensions.width}
                height={dimensions.height}
                className={`object-contain ${variant === 'light' ? 'brightness-0 invert' : ''}`}
                style={{ maxHeight: dimensions.height, width: 'auto' }}
                priority
            />
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="flex items-center">
                {content}
            </Link>
        );
    }

    return content;
}

export function LogoIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
    return (
        <Image
            src="/favicon.png"
            alt="Booker"
            width={size}
            height={size}
            className={`h-auto ${className}`}
            priority
        />
    );
}
