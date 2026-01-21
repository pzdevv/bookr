import { databases, storage, appwriteConfig } from './config';
import { ID, Query } from 'appwrite';

const { databaseId, collections, buckets } = appwriteConfig;

// Types
export interface User {
    $id: string;
    name: string;
    email: string;
    username?: string; // URL-friendly slug for booking pages
    bio?: string; // Profile description
    avatar?: string;
    role: 'user' | 'admin';
    timezone: string;
    $createdAt: string;
    $updatedAt: string;
}

export interface EventType {
    $id: string;
    userId: string;
    title: string;
    duration: number;
    buffer: number;
    color: string;
    description: string;
    slug: string;
    isActive: boolean;
    $createdAt: string;
    $updatedAt: string;
}

export interface Availability {
    $id: string;
    userId: string;
    day: number; // 0-6 (Sunday-Saturday)
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    isEnabled: boolean;
}

export interface Booking {
    $id: string;
    userId: string;
    eventTypeId: string;
    guestName: string;
    guestEmail: string;
    slotTime: string; // ISO datetime
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    notes?: string;
    callRoomId?: string; // Unique room ID for audio calls
    callStartedAt?: string; // ISO datetime when call started
    callEndedAt?: string; // ISO datetime when call ended
    callExpiry?: string; // ISO datetime when call link expires
    $createdAt: string;
    $updatedAt: string;
}

// User Database Service
export const userService = {
    async create(data: Omit<User, '$id' | '$createdAt' | '$updatedAt'>): Promise<User> {
        const user = await databases.createDocument(
            databaseId,
            collections.users,
            ID.unique(),
            data
        );
        return user as unknown as User;
    },

    async get(userId: string): Promise<User | null> {
        try {
            const user = await databases.getDocument(databaseId, collections.users, userId);
            return user as unknown as User;
        } catch {
            return null;
        }
    },

    async getByEmail(email: string): Promise<User | null> {
        try {
            const users = await databases.listDocuments(databaseId, collections.users, [
                Query.equal('email', email),
            ]);
            if (users.documents.length === 0) return null;
            return users.documents[0] as unknown as User;
        } catch (error: any) {
            console.error('getByEmail error:', error.message, error.code);
            // If it's a permission error, throw it so it can be handled
            if (error.code === 401 || error.code === 403) {
                throw error;
            }
            return null;
        }
    },

    async update(userId: string, data: Partial<User>): Promise<User> {
        const user = await databases.updateDocument(
            databaseId,
            collections.users,
            userId,
            data
        );
        return user as unknown as User;
    },

    async delete(userId: string): Promise<void> {
        await databases.deleteDocument(databaseId, collections.users, userId);
    },

    async list(queries: string[] = []): Promise<User[]> {
        const users = await databases.listDocuments(databaseId, collections.users, queries);
        return users.documents as unknown as User[];
    },

    async getByUsername(username: string): Promise<User | null> {
        try {
            const users = await databases.listDocuments(databaseId, collections.users, [
                Query.equal('username', username),
            ]);
            return users.documents[0] as unknown as User || null;
        } catch {
            return null;
        }
    },

    async getByNameSlug(slug: string): Promise<User | null> {
        try {
            // Get all users and filter by name-to-slug match (avoids fulltext index requirement)
            const users = await databases.listDocuments(databaseId, collections.users, [Query.limit(100)]);
            const nameToSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const found = users.documents.find(u => nameToSlug(u.name as string) === slug);
            return found as unknown as User || null;
        } catch {
            return null;
        }
    },

    async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
        try {
            const users = await databases.listDocuments(databaseId, collections.users, [
                Query.equal('username', username),
            ]);
            if (users.documents.length === 0) return true;
            // If excluding a user (for updates), check if the match is that user
            if (excludeUserId && users.documents.length === 1 && users.documents[0].$id === excludeUserId) {
                return true;
            }
            return false;
        } catch {
            return true; // Assume available on error
        }
    },

    async uploadAvatar(file: File): Promise<string> {
        const uploaded = await storage.createFile(buckets.avatars, ID.unique(), file);
        const url = storage.getFileView(buckets.avatars, uploaded.$id);
        return url.toString();
    },
};

// Event Type Database Service
export const eventTypeService = {
    async create(data: Omit<EventType, '$id' | '$createdAt' | '$updatedAt'>): Promise<EventType> {
        const eventType = await databases.createDocument(
            databaseId,
            collections.eventTypes,
            ID.unique(),
            data
        );
        return eventType as unknown as EventType;
    },

    async get(eventTypeId: string): Promise<EventType | null> {
        try {
            const eventType = await databases.getDocument(
                databaseId,
                collections.eventTypes,
                eventTypeId
            );
            return eventType as unknown as EventType;
        } catch {
            return null;
        }
    },

    async getBySlug(slug: string): Promise<EventType | null> {
        try {
            const eventTypes = await databases.listDocuments(
                databaseId,
                collections.eventTypes,
                [Query.equal('slug', slug)]
            );
            return eventTypes.documents[0] as unknown as EventType || null;
        } catch {
            return null;
        }
    },

    async update(eventTypeId: string, data: Partial<EventType>): Promise<EventType> {
        const eventType = await databases.updateDocument(
            databaseId,
            collections.eventTypes,
            eventTypeId,
            data
        );
        return eventType as unknown as EventType;
    },

    async delete(eventTypeId: string): Promise<void> {
        await databases.deleteDocument(databaseId, collections.eventTypes, eventTypeId);
    },

    async listByUser(userId: string): Promise<EventType[]> {
        const eventTypes = await databases.listDocuments(
            databaseId,
            collections.eventTypes,
            [Query.equal('userId', userId)]
        );
        return eventTypes.documents as unknown as EventType[];
    },

    async list(queries: string[] = []): Promise<EventType[]> {
        const eventTypes = await databases.listDocuments(
            databaseId,
            collections.eventTypes,
            queries
        );
        return eventTypes.documents as unknown as EventType[];
    },
};

// Availability Database Service
export const availabilityService = {
    async create(data: Omit<Availability, '$id'>): Promise<Availability> {
        const availability = await databases.createDocument(
            databaseId,
            collections.availability,
            ID.unique(),
            data
        );
        return availability as unknown as Availability;
    },

    async update(availabilityId: string, data: Partial<Availability>): Promise<Availability> {
        const availability = await databases.updateDocument(
            databaseId,
            collections.availability,
            availabilityId,
            data
        );
        return availability as unknown as Availability;
    },

    async delete(availabilityId: string): Promise<void> {
        await databases.deleteDocument(databaseId, collections.availability, availabilityId);
    },

    async listByUser(userId: string): Promise<Availability[]> {
        const availability = await databases.listDocuments(
            databaseId,
            collections.availability,
            [Query.equal('userId', userId), Query.orderAsc('day')]
        );
        return availability.documents as unknown as Availability[];
    },

    async list(queries: string[] = []): Promise<Availability[]> {
        const availability = await databases.listDocuments(
            databaseId,
            collections.availability,
            queries
        );
        return availability.documents as unknown as Availability[];
    },
};

// Booking Database Service
export const bookingService = {
    async create(data: Omit<Booking, '$id' | '$createdAt' | '$updatedAt'>): Promise<Booking> {
        const booking = await databases.createDocument(
            databaseId,
            collections.bookings,
            ID.unique(),
            data
        );
        return booking as unknown as Booking;
    },

    async get(bookingId: string): Promise<Booking | null> {
        try {
            const booking = await databases.getDocument(
                databaseId,
                collections.bookings,
                bookingId
            );
            return booking as unknown as Booking;
        } catch {
            return null;
        }
    },

    async update(bookingId: string, data: Partial<Booking>): Promise<Booking> {
        const booking = await databases.updateDocument(
            databaseId,
            collections.bookings,
            bookingId,
            data
        );
        return booking as unknown as Booking;
    },

    async delete(bookingId: string): Promise<void> {
        await databases.deleteDocument(databaseId, collections.bookings, bookingId);
    },

    async listByUser(userId: string): Promise<Booking[]> {
        const bookings = await databases.listDocuments(databaseId, collections.bookings, [
            Query.equal('userId', userId),
            Query.orderDesc('slotTime'),
        ]);
        return bookings.documents as unknown as Booking[];
    },

    async listUpcoming(userId: string): Promise<Booking[]> {
        const now = new Date().toISOString();
        const bookings = await databases.listDocuments(databaseId, collections.bookings, [
            Query.equal('userId', userId),
            Query.greaterThan('slotTime', now),
            Query.equal('status', 'confirmed'),
            Query.orderAsc('slotTime'),
            Query.limit(5),
        ]);
        return bookings.documents as unknown as Booking[];
    },

    async list(queries: string[] = []): Promise<Booking[]> {
        const bookings = await databases.listDocuments(
            databaseId,
            collections.bookings,
            queries
        );
        return bookings.documents as unknown as Booking[];
    },

    // Check if a slot is available (no double booking)
    async isSlotAvailable(
        userId: string,
        slotTime: string,
        duration: number
    ): Promise<boolean> {
        const slotStart = new Date(slotTime);
        const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

        const bookings = await databases.listDocuments(databaseId, collections.bookings, [
            Query.equal('userId', userId),
            Query.equal('status', 'confirmed'),
        ]);

        for (const booking of bookings.documents) {
            const bookingStart = new Date(booking.slotTime);
            // Get event type to determine duration
            const eventType = await eventTypeService.get(booking.eventTypeId);
            if (!eventType) continue;

            const bookingEnd = new Date(
                bookingStart.getTime() + eventType.duration * 60 * 1000
            );

            // Check for overlap
            if (slotStart < bookingEnd && slotEnd > bookingStart) {
                return false;
            }
        }

        return true;
    },

    // Get booking by call room ID
    async getByRoomId(roomId: string): Promise<Booking | null> {
        try {
            const bookings = await databases.listDocuments(databaseId, collections.bookings, [
                Query.equal('callRoomId', roomId),
                Query.limit(1),
            ]);
            if (bookings.documents.length === 0) return null;
            return bookings.documents[0] as unknown as Booking;
        } catch {
            return null;
        }
    },
};

// Generate unique call room ID
export function generateCallRoomId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let roomId = 'call-';
    for (let i = 0; i < 12; i++) {
        roomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return roomId;
}

// Mark a call as started
export async function markCallStarted(bookingId: string): Promise<void> {
    await bookingService.update(bookingId, {
        callStartedAt: new Date().toISOString(),
    });
}

// Mark a call as ended and set expiry (1 hour after end)
export async function markCallEnded(bookingId: string): Promise<void> {
    const now = new Date();
    const expiry = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour after call ends

    await bookingService.update(bookingId, {
        callEndedAt: now.toISOString(),
        callExpiry: expiry.toISOString(),
        status: 'completed',
    });
}

// Check if a call link has expired
export function isCallExpired(booking: Booking): boolean {
    if (!booking.callExpiry) return false;
    return new Date(booking.callExpiry) < new Date();
}
