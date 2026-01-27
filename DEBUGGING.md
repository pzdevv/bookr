# Debugging Guide: Email & Functions

## 1. Testing Mail Functionality
Since the mail logic resides in an Appwrite Function (`send-email`), you cannot test it directly from the Next.js frontend console. You must use the Appwrite Console.

### Method A: Manual Execution (Recommended for verification)
1. Go to your **Appwrite Console**.
2. Navigate to **Functions** > **send-email**.
3. Click the **Execute** (or "Create Execution") button.
4. In the **Body** (JSON) field, enter a test payload:
   ```json
   {
     "to": "your-email@example.com",
     "subject": "Test Email from Bookr",
     "html": "<h1>It Works!</h1><p>This is a test email.</p>"
   }
   ```
5. Click **Execute**.
6. Check the **response status** (should be 200) and the **Response Body**.

### Method B: Real End-to-End Test
1. Go to your dashboard as a user.
2. Copy your Booking Link.
3. Open it in an Incognito window.
4. Book a slot.
5. Check your email (and the guest email).

## 2. Debugging Failures
If emails are not arriving:

1. **Check Logs**:
   - Go to **Functions** > **send-email** > **Executions** tab.
   - Click on the failed execution (labeled with a red status or non-200 code).
   - Look at the **Output** and **Errors** tabs.
   - Requires `RESEND_API_KEY` to be set in the Function's **Settings** > **Environment Variables**.

2. **Common Errors**:
   - **"RESEND_API_KEY is missing"**: You forgot to add the variable in Appwrite.
   - **"from address not verified"**: The email in logic (`onboarding@resend.dev` or your custom domain) must be allowed by Resend. If you are on the Resend free tier, you can ONLY send emails to the email address you signed up with, unless you verify a domain.
   - **Network errors**: The function assumes internet access.

## 3. Verify Frontend "Check/Cross" Icons
If icons are still broken (showing text like "check" instead of the symbol):
- We have installed the `material-symbols` package to ensure reliable loading.
- Ensure your network is not blocking Google Fonts (if we fallback to CDN).
- Clear your browser cache or try Incognito.
