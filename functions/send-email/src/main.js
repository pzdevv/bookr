import { Client, Users } from 'node-appwrite';
import { Resend } from 'resend';

// Appwrite Function environment variables
// RESEND_API_KEY: Your Resend API Key

export default async ({ req, res, log, error }) => {
    // 1. Initialize Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
        error('RESEND_API_KEY is missing');
        return res.json({ success: false, error: 'Internal configuration error' }, 500);
    }
    const resend = new Resend(resendApiKey);

    // 2. Parse payload
    let payload;
    try {
        payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (err) {
        error('Invalid JSON payload');
        return res.json({ success: false, error: 'Invalid JSON payload' }, 400);
    }

    const { to, subject, html, text } = payload;

    if (!to || !subject || !html) {
        error('Missing required fields: to, subject, html');
        return res.json({ success: false, error: 'Missing required fields' }, 400);
    }

    try {
        // 3. Send email via Resend
        // Note: 'from' address must be verified in Resend. 
        // We default to a generic one or use an env var if provided.
        const fromAddress = process.env.EMAIL_FROM || 'Book&Call <onboarding@resend.dev>';

        log(`Sending email to ${to} with subject: ${subject}`);

        const data = await resend.emails.send({
            from: fromAddress,
            to,
            subject,
            html,
            text: text || '',
        });

        log(`Email sent successfully: ${data.id}`);
        return res.json({ success: true, data });
    } catch (err) {
        error(`Failed to send email: ${err.message}`);
        return res.json({ success: false, error: err.message }, 500);
    }
};
