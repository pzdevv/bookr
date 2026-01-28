/**
 * Email Service for Booking Notifications
 * Uses Appwrite's messaging service or can be replaced with external providers
 */
import { functions } from '@/lib/appwrite/config';
import { ExecutionMethod } from 'appwrite';

export interface BookingEmailData {
    guestName: string;
    guestEmail: string;
    hostName: string;
    hostEmail: string;
    eventTitle: string;
    slotTime: string;
    duration: number;
    callLink?: string;
    notes?: string;
}

export interface EmailTemplate {
    subject: string;
    html: string;
    text: string;
}

// Format date for email display
function formatDateTime(isoTime: string): { date: string; time: string; timezone: string } {
    const date = new Date(isoTime);
    return {
        date: date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }),
        time: date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
}

// Generate booking confirmation email for guest
export function generateBookingConfirmationEmail(data: BookingEmailData): EmailTemplate {
    const { date, time, timezone } = formatDateTime(data.slotTime);

    const subject = `✅ Booking Confirmed: ${data.eventTitle} with ${data.hostName}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #fcf8f8;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px;">
            <img src="https://bookncall.me/logo.png" alt="Book&Call" style="height: 48px; width: auto;" />
        </div>
        
        <!-- Main Card -->
        <div style="background: white; border-radius: 24px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid rgba(133,0,0,0.1);">
            <!-- Success Badge -->
            <div style="text-align: center; margin-bottom: 24px;">
                <span style="display: inline-block; background: #dcfce7; color: #166534; padding: 8px 16px; border-radius: 999px; font-size: 14px; font-weight: 600;">
                    ✓ Booking Confirmed
                </span>
            </div>
            
            <h1 style="color: #1d0c0c; font-size: 28px; margin: 0 0 8px; text-align: center; font-weight: 700;">
                You're all set, ${data.guestName}!
            </h1>
            <p style="color: #6b4444; text-align: center; margin: 0 0 32px; font-size: 16px;">
                Your meeting has been confirmed.
            </p>
            
            <!-- Meeting Details Card -->
            <div style="background: #fdf2f2; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
                <h2 style="color: #850000; font-size: 18px; margin: 0 0 16px; font-weight: 600;">
                    📋 Meeting Details
                </h2>
                
                <div style="margin-bottom: 12px;">
                    <span style="color: #6b4444; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Event</span>
                    <p style="color: #1d0c0c; font-size: 16px; font-weight: 600; margin: 4px 0 0;">${data.eventTitle}</p>
                </div>
                
                <div style="margin-bottom: 12px;">
                    <span style="color: #6b4444; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Host</span>
                    <p style="color: #1d0c0c; font-size: 16px; font-weight: 600; margin: 4px 0 0;">${data.hostName}</p>
                </div>
                
                <div style="margin-bottom: 12px;">
                    <span style="color: #6b4444; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Date & Time</span>
                    <p style="color: #1d0c0c; font-size: 16px; font-weight: 600; margin: 4px 0 0;">
                        ${date}<br>
                        ${time} (${timezone})
                    </p>
                </div>
                
                <div>
                    <span style="color: #6b4444; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Duration</span>
                    <p style="color: #1d0c0c; font-size: 16px; font-weight: 600; margin: 4px 0 0;">${data.duration} minutes</p>
                </div>
            </div>
            
            ${data.callLink ? `
            <!-- Join Call Button -->
            <div style="text-align: center; margin-bottom: 24px;">
                <a href="${data.callLink}" style="display: inline-block; background: linear-gradient(135deg, #850000, #6b0000); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px;">
                    🎙️ Join Audio Call
                </a>
                <p style="color: #6b4444; font-size: 12px; margin-top: 12px;">
                    This link will be active at your scheduled time
                </p>
            </div>
            ` : ''}
            
            ${data.notes ? `
            <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <span style="color: #6b4444; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Notes</span>
                <p style="color: #1d0c0c; font-size: 14px; margin: 8px 0 0;">${data.notes}</p>
            </div>
            ` : ''}
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px;">
                Book&Call — Professional Scheduling
            </p>
            <p style="color: #9ca3af; font-size: 11px; margin: 0 0 8px;">
                Questions? Contact us at <a href="mailto:contact@bookncall.me" style="color: #850000; text-decoration: none;">contact@bookncall.me</a>
            </p>
            <p style="color: #9ca3af; font-size: 10px; margin: 0;">
                You're receiving this because you booked a meeting via Book&Call.
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();

    const text = `
Booking Confirmed!

Hi ${data.guestName},

Your meeting "${data.eventTitle}" with ${data.hostName} has been confirmed.

📅 Date: ${date}
🕐 Time: ${time} (${timezone})
⏱️ Duration: ${data.duration} minutes

${data.callLink ? `🔗 Join Call: ${data.callLink}` : ''}
${data.notes ? `📝 Notes: ${data.notes}` : ''}

See you there!

- Book&Call
    `.trim();

    return { subject, html, text };
}

// Generate booking rejection email for guest
export function generateBookingRejectedEmail(data: BookingEmailData, reason?: string): EmailTemplate {
    const { date, time } = formatDateTime(data.slotTime);

    const subject = `❌ Booking Declined: ${data.eventTitle} with ${data.hostName}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #fcf8f8;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px;">
            <img src="https://bookncall.me/logo.png" alt="Book&Call" style="height: 48px; width: auto;" />
        </div>
        
        <!-- Main Card -->
        <div style="background: white; border-radius: 24px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid rgba(133,0,0,0.1);">
            <!-- Status Badge -->
            <div style="text-align: center; margin-bottom: 24px;">
                <span style="display: inline-block; background: #fef2f2; color: #dc2626; padding: 8px 16px; border-radius: 999px; font-size: 14px; font-weight: 600;">
                    ✗ Booking Declined
                </span>
            </div>
            
            <h1 style="color: #1d0c0c; font-size: 28px; margin: 0 0 8px; text-align: center; font-weight: 700;">
                Booking Request Declined
            </h1>
            <p style="color: #6b4444; text-align: center; margin: 0 0 32px; font-size: 16px;">
                Unfortunately, ${data.hostName} wasn't able to accept this booking.
            </p>
            
            <!-- Declined Meeting Details -->
            <div style="background: #fef2f2; border-radius: 16px; padding: 24px; margin-bottom: 24px; opacity: 0.8;">
                <div style="margin-bottom: 12px;">
                    <span style="color: #6b4444; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Requested Event</span>
                    <p style="color: #1d0c0c; font-size: 16px; font-weight: 600; margin: 4px 0 0; text-decoration: line-through;">${data.eventTitle}</p>
                </div>
                
                <div>
                    <span style="color: #6b4444; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Requested Time</span>
                    <p style="color: #1d0c0c; font-size: 16px; font-weight: 600; margin: 4px 0 0; text-decoration: line-through;">${date} at ${time}</p>
                </div>
            </div>
            
            ${reason ? `
            <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <span style="color: #6b4444; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Reason</span>
                <p style="color: #1d0c0c; font-size: 14px; margin: 8px 0 0;">${reason}</p>
            </div>
            ` : ''}
            
            <p style="color: #6b4444; text-align: center; font-size: 14px;">
                Feel free to book another time that works for both of you.
            </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px;">
                Book&Call — Professional Scheduling
            </p>
            <p style="color: #9ca3af; font-size: 11px; margin: 0 0 8px;">
                Questions? Contact us at <a href="mailto:contact@bookncall.me" style="color: #850000; text-decoration: none;">contact@bookncall.me</a>
            </p>
            <p style="color: #9ca3af; font-size: 10px; margin: 0;">
                You're receiving this because you booked a meeting via Book&Call.
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();

    const text = `
Booking Declined

Hi ${data.guestName},

Unfortunately, ${data.hostName} wasn't able to accept your booking request for "${data.eventTitle}" on ${date} at ${time}.

${reason ? `Reason: ${reason}` : ''}

Feel free to book another time that works for both of you.

- Book&Call
    `.trim();

    return { subject, html, text };
}

// Generate booking notification email for host (new booking)
export function generateNewBookingNotificationEmail(data: BookingEmailData): EmailTemplate {
    const { date, time, timezone } = formatDateTime(data.slotTime);

    const subject = `🔔 New Booking Request: ${data.guestName} for ${data.eventTitle}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #fcf8f8;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px;">
            <img src="https://bookncall.me/logo.png" alt="Book&Call" style="height: 48px; width: auto;" />
        </div>
        
        <!-- Main Card -->
        <div style="background: white; border-radius: 24px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid rgba(133,0,0,0.1);">
            <!-- New Booking Badge -->
            <div style="text-align: center; margin-bottom: 24px;">
                <span style="display: inline-block; background: #fef3c7; color: #b45309; padding: 8px 16px; border-radius: 999px; font-size: 14px; font-weight: 600;">
                    🔔 New Booking Request
                </span>
            </div>
            
            <h1 style="color: #1d0c0c; font-size: 28px; margin: 0 0 8px; text-align: center; font-weight: 700;">
                Someone wants to meet!
            </h1>
            <p style="color: #6b4444; text-align: center; margin: 0 0 32px; font-size: 16px;">
                You have a new booking request that needs your attention.
            </p>
            
            <!-- Guest Info -->
            <div style="background: #f0fdf4; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
                <h2 style="color: #166534; font-size: 18px; margin: 0 0 16px; font-weight: 600;">
                    👤 Guest Information
                </h2>
                
                <div style="margin-bottom: 12px;">
                    <span style="color: #6b4444; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Name</span>
                    <p style="color: #1d0c0c; font-size: 16px; font-weight: 600; margin: 4px 0 0;">${data.guestName}</p>
                </div>
                
                <div>
                    <span style="color: #6b4444; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Email</span>
                    <p style="color: #1d0c0c; font-size: 16px; font-weight: 600; margin: 4px 0 0;">${data.guestEmail}</p>
                </div>
            </div>
            
            <!-- Meeting Details -->
            <div style="background: #fdf2f2; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
                <h2 style="color: #850000; font-size: 18px; margin: 0 0 16px; font-weight: 600;">
                    📋 Requested Meeting
                </h2>
                
                <div style="margin-bottom: 12px;">
                    <span style="color: #6b4444; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Event Type</span>
                    <p style="color: #1d0c0c; font-size: 16px; font-weight: 600; margin: 4px 0 0;">${data.eventTitle}</p>
                </div>
                
                <div style="margin-bottom: 12px;">
                    <span style="color: #6b4444; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Requested Time</span>
                    <p style="color: #1d0c0c; font-size: 16px; font-weight: 600; margin: 4px 0 0;">
                        ${date}<br>
                        ${time} (${timezone})
                    </p>
                </div>
                
                <div>
                    <span style="color: #6b4444; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Duration</span>
                    <p style="color: #1d0c0c; font-size: 16px; font-weight: 600; margin: 4px 0 0;">${data.duration} minutes</p>
                </div>
            </div>
            
            ${data.notes ? `
            <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <span style="color: #6b4444; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Guest Notes</span>
                <p style="color: #1d0c0c; font-size: 14px; margin: 8px 0 0;">${data.notes}</p>
            </div>
            ` : ''}
            
            <!-- Action Buttons -->
            <p style="color: #6b4444; text-align: center; font-size: 14px; margin-bottom: 16px;">
                Please log in to your dashboard to confirm or decline this booking.
            </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px;">
                Book&Call — Professional Scheduling
            </p>
            <p style="color: #9ca3af; font-size: 11px; margin: 0 0 8px;">
                Questions? Contact us at <a href="mailto:contact@bookncall.me" style="color: #850000; text-decoration: none;">contact@bookncall.me</a>
            </p>
            <p style="color: #9ca3af; font-size: 10px; margin: 0;">
                You're receiving this because someone requested a meeting on your Book&Call page.
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();

    const text = `
New Booking Request!

Hi ${data.hostName},

You have a new booking request:

👤 Guest: ${data.guestName} (${data.guestEmail})
📅 Event: ${data.eventTitle}
🕐 Requested Time: ${date} at ${time} (${timezone})
⏱️ Duration: ${data.duration} minutes

${data.notes ? `📝 Guest Notes: ${data.notes}` : ''}

Please log in to your dashboard to confirm or decline this booking.

- Book&Call
    `.trim();

    return { subject, html, text };
}

// Generate 15-minute reminder email
export function generateReminderEmail(data: BookingEmailData): EmailTemplate {
    const { time } = formatDateTime(data.slotTime);

    const subject = `⏰ Starting in 15 min: ${data.eventTitle}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #fcf8f8;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px;">
            <img src="https://bookncall.me/logo.png" alt="Book&Call" style="height: 48px; width: auto;" />
        </div>
        
        <!-- Main Card -->
        <div style="background: white; border-radius: 24px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid rgba(133,0,0,0.1);">
            <!-- Reminder Badge -->
            <div style="text-align: center; margin-bottom: 24px;">
                <span style="display: inline-block; background: #fef3c7; color: #b45309; padding: 8px 16px; border-radius: 999px; font-size: 14px; font-weight: 600;">
                    ⏰ Starting Soon
                </span>
            </div>
            
            <h1 style="color: #1d0c0c; font-size: 28px; margin: 0 0 8px; text-align: center; font-weight: 700;">
                Your meeting starts in 15 minutes!
            </h1>
            <p style="color: #6b4444; text-align: center; margin: 0 0 32px; font-size: 16px;">
                Get ready for your call with ${data.hostName}.
            </p>
            
            <!-- Quick Info -->
            <div style="background: #fdf2f2; border-radius: 16px; padding: 24px; margin-bottom: 24px; text-align: center;">
                <p style="color: #850000; font-size: 32px; font-weight: 800; margin: 0;">${time}</p>
                <p style="color: #6b4444; font-size: 14px; margin: 8px 0 0;">${data.eventTitle} • ${data.duration} min</p>
            </div>
            
            ${data.callLink ? `
            <!-- Join Call Button -->
            <div style="text-align: center;">
                <a href="${data.callLink}" style="display: inline-block; background: linear-gradient(135deg, #850000, #6b0000); color: white; padding: 20px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 18px;">
                    🎙️ Join Audio Call Now
                </a>
            </div>
            ` : ''}
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px;">
                Book&Call — Professional Scheduling
            </p>
            <p style="color: #9ca3af; font-size: 11px; margin: 0 0 8px;">
                Questions? Contact us at <a href="mailto:contact@bookncall.me" style="color: #850000; text-decoration: none;">contact@bookncall.me</a>
            </p>
            <p style="color: #9ca3af; font-size: 10px; margin: 0;">
                You're receiving this because you have an upcoming meeting.
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();

    const text = `
⏰ Your meeting starts in 15 minutes!

${data.eventTitle} with ${data.hostName}
Time: ${time}
Duration: ${data.duration} minutes

${data.callLink ? `Join Call: ${data.callLink}` : ''}

See you there!

- Book&Call
    `.trim();

    return { subject, html, text };
}

// Email sending function via Appwrite Functions
// Uses FIRE-AND-FORGET pattern - does NOT wait for execution to complete
export function sendEmail(to: string, template: EmailTemplate): boolean {
    const FUNCTION_ID = process.env.NEXT_PUBLIC_APPWRITE_SEND_EMAIL_FUNCTION_ID || 'send-email';

    console.log(`[Email Service] Queuing email to: ${to}`);

    const payload = JSON.stringify({
        to,
        subject: template.subject,
        html: template.html,
        text: template.text
    });

    // Fire-and-forget: Start the execution but don't await it
    // This completely avoids the 30-second timeout issue
    functions.createExecution(
        FUNCTION_ID,
        payload,
        true,  // async - execute in background
        '/',   // path
        ExecutionMethod.POST // method
    ).then((execution) => {
        // Log result asynchronously (doesn't block main thread)
        if (execution.status === 'failed') {
            console.error('[Email Service] Background execution failed:', execution.responseBody || execution.errors);
        } else {
            console.log('[Email Service] Email execution started (status:', execution.status, ')');
        }
    }).catch((error) => {
        // Log error asynchronously (doesn't block main thread)  
        console.error('[Email Service] Background error:', error?.message || error);
        if (error?.code === 404) {
            console.warn('[Email Service] Function not found. Deploy it per APPWRITE_SETUP.md');
        }
    });

    // Return immediately - email is being sent in background
    console.log('[Email Service] Email queued for background delivery');
    return true;
}

// Async version if you need to wait for the result (not recommended for UI flows)
export async function sendEmailAsync(to: string, template: EmailTemplate): Promise<boolean> {
    const FUNCTION_ID = process.env.NEXT_PUBLIC_APPWRITE_SEND_EMAIL_FUNCTION_ID || 'send-email';

    try {
        console.log(`[Email Service Async] Invoking function for: ${to}`);

        const payload = JSON.stringify({
            to,
            subject: template.subject,
            html: template.html,
            text: template.text
        });

        const execution = await functions.createExecution(
            FUNCTION_ID,
            payload,
            true,  // async
            '/',
            ExecutionMethod.POST
        );

        console.log('[Email Service Async] Execution status:', execution.status);
        return execution.status !== 'failed';
    } catch (error: any) {
        console.error('[Email Service Async] Error:', error?.message || error);
        return false;
    }
}
