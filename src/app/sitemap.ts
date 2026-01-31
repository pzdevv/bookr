import { MetadataRoute } from 'next'
import { userService } from '@/lib/appwrite/database';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bookncall.me';

    // Fetch all users for dynamic routes
    let userRoutes: MetadataRoute.Sitemap = [];
    try {
        const users = await userService.list();
        userRoutes = users.map(user => ({
            url: `${baseUrl}/book/${user.username || user.$id}`,
            lastModified: new Date(user.$updatedAt || new Date()),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }));
    } catch (error) {
        console.error('Failed to generate user sitemap routes:', error);
    }

    return [
        // Core pages
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },
        // Auth pages (important for SEO)
        {
            url: `${baseUrl}/auth/login`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/auth/register`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.9, // Higher priority for sign-up page
        },
        // Legal pages
        {
            url: `${baseUrl}/privacy-policy`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/terms-of-service`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },

        // Dynamic User Routes
        ...userRoutes,
    ]
}
