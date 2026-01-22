/**
 * Input Sanitization Utilities
 * Prevents XSS attacks, SQL injection, and other malicious input
 */

// Remove HTML tags and encode special characters
export function sanitizeText(input: string | undefined | null): string {
    if (!input) return '';

    return input
        .trim()
        // Remove HTML tags
        .replace(/<[^>]*>/g, '')
        // Encode special HTML characters
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        // Remove null bytes
        .replace(/\0/g, '')
        // Normalize whitespace
        .replace(/\s+/g, ' ');
}

// Sanitize for plain text display (less aggressive)
export function sanitizeDisplay(input: string | undefined | null): string {
    if (!input) return '';

    return input
        .trim()
        // Remove HTML tags
        .replace(/<[^>]*>/g, '')
        // Remove null bytes
        .replace(/\0/g, '');
}

// Sanitize email - only allow valid email characters
export function sanitizeEmail(input: string | undefined | null): string {
    if (!input) return '';

    return input
        .trim()
        .toLowerCase()
        // Only allow email-safe characters
        .replace(/[^a-z0-9@._+-]/gi, '')
        // Limit length
        .slice(0, 254);
}

// Sanitize username/slug - only alphanumeric, underscore, hyphen
export function sanitizeSlug(input: string | undefined | null): string {
    if (!input) return '';

    return input
        .trim()
        .toLowerCase()
        // Replace spaces with hyphens
        .replace(/\s+/g, '-')
        // Only allow alphanumeric, underscore, hyphen
        .replace(/[^a-z0-9_-]/g, '')
        // Remove multiple consecutive hyphens
        .replace(/-+/g, '-')
        // Remove leading/trailing hyphens
        .replace(/^-+|-+$/g, '')
        // Limit length
        .slice(0, 50);
}

// Sanitize name - allow letters, spaces, hyphens, apostrophes
export function sanitizeName(input: string | undefined | null): string {
    if (!input) return '';

    return input
        .trim()
        // Only allow letters (including unicode), spaces, hyphens, apostrophes
        .replace(/[^a-zA-ZÀ-ÿ\s'-]/g, '')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        // Limit length
        .slice(0, 100);
}

// Sanitize URL
export function sanitizeUrl(input: string | undefined | null): string {
    if (!input) return '';

    const trimmed = input.trim();

    // Only allow http/https URLs
    if (!trimmed.match(/^https?:\/\//i)) {
        return '';
    }

    try {
        const url = new URL(trimmed);
        // Only allow http/https protocols
        if (!['http:', 'https:'].includes(url.protocol)) {
            return '';
        }
        return url.toString();
    } catch {
        return '';
    }
}

// Sanitize number input
export function sanitizeNumber(input: string | number | undefined | null, min?: number, max?: number): number {
    if (input === undefined || input === null || input === '') return min ?? 0;

    const num = typeof input === 'string' ? parseInt(input, 10) : input;

    if (isNaN(num)) return min ?? 0;

    let result = num;
    if (min !== undefined) result = Math.max(result, min);
    if (max !== undefined) result = Math.min(result, max);

    return result;
}

// Sanitize phone number
export function sanitizePhone(input: string | undefined | null): string {
    if (!input) return '';

    return input
        .trim()
        // Only allow digits, plus, hyphens, parentheses, spaces
        .replace(/[^0-9+\-\s()]/g, '')
        // Limit length
        .slice(0, 20);
}

// Sanitize multi-line text (for bio, notes, etc.)
export function sanitizeMultiline(input: string | undefined | null, maxLength: number = 2000): string {
    if (!input) return '';

    return input
        .trim()
        // Remove HTML tags
        .replace(/<[^>]*>/g, '')
        // Remove null bytes
        .replace(/\0/g, '')
        // Normalize line endings
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        // Limit consecutive newlines to 2
        .replace(/\n{3,}/g, '\n\n')
        // Limit length
        .slice(0, maxLength);
}

// Validate and sanitize time string (HH:mm format)
export function sanitizeTime(input: string | undefined | null): string {
    if (!input) return '';

    const match = input.trim().match(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/);
    if (!match) return '';

    const hours = match[1].padStart(2, '0');
    const minutes = match[2];

    return `${hours}:${minutes}`;
}

// Sanitize color hex code
export function sanitizeColor(input: string | undefined | null): string {
    if (!input) return '#850000'; // Default to brand color

    const match = input.trim().match(/^#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/);
    if (!match) return '#850000';

    return `#${match[1]}`;
}

// Sanitize file name
export function sanitizeFileName(input: string | undefined | null): string {
    if (!input) return '';

    return input
        .trim()
        // Remove path separators
        .replace(/[/\\]/g, '')
        // Remove special characters except dots, underscores, hyphens
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        // Remove multiple consecutive underscores
        .replace(/_+/g, '_')
        // Limit length while preserving extension
        .slice(0, 100);
}

// Generic object sanitizer - sanitizes string properties
export function sanitizeObject<T extends Record<string, unknown>>(
    obj: T,
    fieldConfig: Partial<Record<keyof T, 'text' | 'email' | 'slug' | 'name' | 'multiline' | 'number' | 'url' | 'phone' | 'time' | 'color'>>
): T {
    const result = { ...obj };

    for (const [key, type] of Object.entries(fieldConfig)) {
        const value = result[key as keyof T];

        switch (type) {
            case 'text':
                (result as Record<string, unknown>)[key] = sanitizeText(value as string);
                break;
            case 'email':
                (result as Record<string, unknown>)[key] = sanitizeEmail(value as string);
                break;
            case 'slug':
                (result as Record<string, unknown>)[key] = sanitizeSlug(value as string);
                break;
            case 'name':
                (result as Record<string, unknown>)[key] = sanitizeName(value as string);
                break;
            case 'multiline':
                (result as Record<string, unknown>)[key] = sanitizeMultiline(value as string);
                break;
            case 'url':
                (result as Record<string, unknown>)[key] = sanitizeUrl(value as string);
                break;
            case 'phone':
                (result as Record<string, unknown>)[key] = sanitizePhone(value as string);
                break;
            case 'time':
                (result as Record<string, unknown>)[key] = sanitizeTime(value as string);
                break;
            case 'color':
                (result as Record<string, unknown>)[key] = sanitizeColor(value as string);
                break;
            case 'number':
                (result as Record<string, unknown>)[key] = sanitizeNumber(value as string | number);
                break;
        }
    }

    return result;
}
