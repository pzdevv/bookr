'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService, Booking, eventTypeService } from '@/lib/appwrite/database';
import { useAuth } from '@/lib/hooks/use-auth';
import { generateBookingConfirmationEmail, generateBookingRejectedEmail, sendEmail } from '@/lib/services/email';

// Query Keys
export const bookingKeys = {
    all: ['bookings'] as const,
    byUser: (userId: string) => [...bookingKeys.all, 'user', userId] as const,
};

export function useBookings() {
    const { userProfile } = useAuth();

    return useQuery({
        queryKey: bookingKeys.byUser(userProfile?.$id || ''),
        queryFn: async () => {
            if (!userProfile?.$id) return [];
            return bookingService.listByUser(userProfile.$id);
        },
        enabled: !!userProfile?.$id,
        staleTime: 30 * 1000, // 30 seconds
    });
}

export function useConfirmBooking() {
    const queryClient = useQueryClient();
    const { userProfile } = useAuth();

    return useMutation({
        mutationFn: async (booking: Booking) => {
            // 1. Update database
            await bookingService.update(booking.$id, { status: 'confirmed' });

            // 2. Get event title for email
            let eventTitle = 'Meeting';
            if (booking.eventTypeId) {
                const eventType = await eventTypeService.get(booking.eventTypeId);
                if (eventType) eventTitle = eventType.title;
            }

            // 3. Send email
            const emailData = {
                guestName: booking.guestName,
                guestEmail: booking.guestEmail,
                hostName: userProfile?.name || 'Host',
                hostEmail: userProfile?.email || '',
                eventTitle,
                slotTime: booking.slotTime,
                duration: 30,
                callLink: typeof window !== 'undefined'
                    ? `${window.location.origin}/call/${booking.callRoomId}`
                    : undefined,
                notes: booking.notes
            };

            const email = generateBookingConfirmationEmail(emailData);
            // Fire and forget - don't await email sending
            sendEmail(booking.guestEmail, email).catch(err =>
                console.error('Email send failed:', err)
            );

            return { booking, emailSent: true };
        },
        // Optimistic Update
        onMutate: async (booking) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: bookingKeys.byUser(userProfile?.$id || '') });

            // Snapshot the previous value
            const previousBookings = queryClient.getQueryData<Booking[]>(
                bookingKeys.byUser(userProfile?.$id || '')
            );

            // Optimistically update to the new value
            if (previousBookings) {
                queryClient.setQueryData<Booking[]>(
                    bookingKeys.byUser(userProfile?.$id || ''),
                    previousBookings.map(b =>
                        b.$id === booking.$id ? { ...b, status: 'confirmed' } : b
                    )
                );
            }

            return { previousBookings };
        },
        onError: (_err, _booking, context) => {
            // Rollback on error
            if (context?.previousBookings) {
                queryClient.setQueryData(
                    bookingKeys.byUser(userProfile?.$id || ''),
                    context.previousBookings
                );
            }
        },
        onSettled: () => {
            // Refetch after mutation
            queryClient.invalidateQueries({ queryKey: bookingKeys.byUser(userProfile?.$id || '') });
        },
    });
}

export function useDeclineBooking() {
    const queryClient = useQueryClient();
    const { userProfile } = useAuth();

    return useMutation({
        mutationFn: async (booking: Booking) => {
            // 1. Update database
            await bookingService.update(booking.$id, { status: 'cancelled' });

            // 2. Get event title for email
            let eventTitle = 'Meeting';
            if (booking.eventTypeId) {
                const eventType = await eventTypeService.get(booking.eventTypeId);
                if (eventType) eventTitle = eventType.title;
            }

            // 3. Send email
            const emailData = {
                guestName: booking.guestName,
                guestEmail: booking.guestEmail,
                hostName: userProfile?.name || 'Host',
                hostEmail: userProfile?.email || '',
                eventTitle,
                slotTime: booking.slotTime,
                duration: 30,
            };

            const email = generateBookingRejectedEmail(emailData);
            // Fire and forget - don't await email sending
            sendEmail(booking.guestEmail, email).catch(err =>
                console.error('Email send failed:', err)
            );

            return booking;
        },
        // Optimistic Update
        onMutate: async (booking) => {
            await queryClient.cancelQueries({ queryKey: bookingKeys.byUser(userProfile?.$id || '') });

            const previousBookings = queryClient.getQueryData<Booking[]>(
                bookingKeys.byUser(userProfile?.$id || '')
            );

            if (previousBookings) {
                queryClient.setQueryData<Booking[]>(
                    bookingKeys.byUser(userProfile?.$id || ''),
                    previousBookings.map(b =>
                        b.$id === booking.$id ? { ...b, status: 'cancelled' } : b
                    )
                );
            }

            return { previousBookings };
        },
        onError: (_err, _booking, context) => {
            if (context?.previousBookings) {
                queryClient.setQueryData(
                    bookingKeys.byUser(userProfile?.$id || ''),
                    context.previousBookings
                );
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: bookingKeys.byUser(userProfile?.$id || '') });
        },
    });
}
