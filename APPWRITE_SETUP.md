# Appwrite Email Function Setup (Detailed)

Follow these steps to set up the **Book&Call** email notification system using Appwrite Functions and Resend.

## 1. Prerequisites

1.  **Resend Account**: Sign up at [resend.com](https://resend.com) and get an **API Key**.
2.  **Appwrite Project**: You should have your Appwrite project running.

## 2. Create the Function in Appwrite Console

1.  Login to your **Appwrite Console**.
2.  Navigate to the **Functions** tab in the sidebar.
3.  Click **"Create Function"**.
4.  **Configuration**:
    *   **Name**: `send-email`
    *   **Runtime**: `Node.js 18.0` (or later)
    *   **Entrypoint**: `src/main.js`
    *   **Execute Access**: `Any` (or `Users` if you want to restrict it, but `Any` is easiest for testing. Better security: allow only `users` and specific teams). For now, select **Any** or **Users**.

## 3. Environment Variables

In the Function settings (or during creation):
1.  Go to the **Settings** tab (or "Variables" step).
2.  Add a new variable:
    *   **Key**: `RESEND_API_KEY`
    *   **Value**: `your_resend_api_key_here` (e.g., `re_1234...`)
3.  (Optional) Add `EMAIL_FROM`:
    *   **Key**: `EMAIL_FROM`
    *   **Value**: `Book&Call <onboarding@resend.dev>` (Use your verified domain if you have one).

## 4. Deploy the Code

You can deploy manually via CLI or by uploading a tarball.

### Option A: Manual Upload (Easiest without CLI setup)
1.  Go to the `functions/send-email` folder on your computer.
2.  Select `src/` folder and `package.json`.
3.  Compress them into a `.tar.gz` file (or `.zip`).
    *   *Note*: Ensure `src/main.js` is at the root of the archive or properly referenced. Naming convention usually expects the structure to match.
    *   Structure inside zip:
        ```text
        package.json
        src/
          main.js
        ```
4.  In Appwrite Console > Functions > `send-email` > **Deployment** tab.
5.  Click **"Create Deployment"**.
6.  Upload your `.tar.gz` / `.zip` file.
7.  **Activate** the deployment once build finishes.

### Option B: Appwrite CLI
1.  Initialize function in your root if not already:
    ```bash
    appwrite init function
    ```
    (Select `send-email` if you already created it, or create new).
2.  Deploy:
    ```bash
    appwrite deploy function
    ```

## 5. Get Function ID

1.  Copy the **Function ID** from the Appwrite Console (it usually looks like `65abcdef...` or unique string).
2.  You will need this ID for your frontend configuration.

## 6. Frontend Configuration

1.  Open your project's `src/lib/services/email.ts`.
2.  Locate the `APPWRITE_FUNCTION_ID` constant (or `config` file).
3.  Paste your Function ID there.

```typescript
// src/lib/services/email.ts (Example)
const SEND_EMAIL_FUNCTION_ID = 'your_function_id_here'; 
```
*(We will update the code to use this constant).*

---
**Done!** Your Appwrite function is now ready to send emails via Resend.
