import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
    variant?: 'light' | 'dark';
    href?: string;
}

const sizeClasses = {
    sm: { logo: 100, height: 24 },
    md: { logo: 120, height: 32 },
    lg: { logo: 160, height: 44 },
};

export function Logo({ size = 'md', showText = true, variant = 'dark', href = '/' }: LogoProps) {
    const dimensions = sizeClasses[size];

    const content = (
        <div className="flex items-center gap-2">
            <Image
                src="/logo.png"
                alt="Bookr"
                width={dimensions.logo}
                height={dimensions.height}
                className={`h-auto ${variant === 'light' ? 'brightness-0 invert' : ''}`}
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
            alt="Bookr"
            width={size}
            height={size}
            className={`h-auto ${className}`}
            priority
        />
    );
}
