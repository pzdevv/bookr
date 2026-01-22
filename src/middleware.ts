import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// NOTE: Appwrite stores sessions in localStorage, not cookies.
// This means we can't verify sessions server-side in middleware.
// Auth protection is handled client-side in DashboardLayout instead.

export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // Security Headers for Production
    const headers = response.headers;

    // Prevent clickjacking
    headers.set('X-Frame-Options', 'DENY');

    // XSS Protection
    headers.set('X-XSS-Protection', '1; mode=block');

    // Prevent MIME type sniffing
    headers.set('X-Content-Type-Options', 'nosniff');

    // Referrer Policy
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy (restrict access to sensitive browser features)
    headers.set('Permissions-Policy', 'camera=*, microphone=*, geolocation=*');

    // HSTS - Force HTTPS (enabled for production)
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    // Prevent downloads from opening automatically
    headers.set('X-Download-Options', 'noopen');

    // Cross-Origin policies for enhanced security
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    headers.set('Cross-Origin-Resource-Policy', 'same-origin');

    // Content Security Policy (relaxed for development, tighten for production)
    headers.set(
        'Content-Security-Policy',
        [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob: https: http:",
            "connect-src 'self' https://cloud.appwrite.io https://*.cloud.appwrite.io wss://*.peerjs.com https://*.peerjs.com https://0.peerjs.com",
            "media-src 'self' blob:",
            "frame-ancestors 'none'",
        ].join('; ')
    );

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, favicon.png (favicon files)
         * - public files (logo.png, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|favicon.png|logo.png|manifest.json).*)',
    ],
};
