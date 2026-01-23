# Bookr Setup Instructions

## Prerequisites

- **Node.js**: Version 18.17 or later (LTS recommended)
- **npm**: Comes with Node.js
- **Appwrite Account**: You need an active Appwrite project (Cloud or Self-hosted)

## Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/bookr.git
    cd bookr
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    # or
    bun install
    ```

## Configuration

1.  **Environment Variables:**

    Copy the example environment file to create your local configuration:

    ```bash
    cp .env.local.example .env.local
    ```

2.  **Update `.env.local`:**

    Open `.env.local` and fill in your Appwrite credentials:

    ```env
    NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
    NEXT_PUBLIC_APPWRITE_PROJECT_NAME=Bookr
    NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1 # or your self-hosted endpoint
    NEXT_PUBLIC_APPWRITE_DATABASE_ID=bookr-db
    NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=users
    NEXT_PUBLIC_APPWRITE_EVENT_TYPES_COLLECTION_ID=event_types
    NEXT_PUBLIC_APPWRITE_AVAILABILITY_COLLECTION_ID=availability
    NEXT_PUBLIC_APPWRITE_BOOKINGS_COLLECTION_ID=bookings
    NEXT_PUBLIC_APPWRITE_AVATARS_BUCKET_ID=avatars
    ```

3.  **Appwrite Setup:**

    Ensure your Appwrite project has the specific database, collections, and storage bucket created with the IDs matching your environment variables.
    
    *Required Collections:*
    - `users`
    - `event_types`
    - `availability`
    - `bookings`
    
    *Required Storage Bucket:*
    - `avatars`

## Running the Application

### Development Server

To start the development server with hot-reload:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Production Build

To build the application for production:

```bash
npm run build
```

To start the production server:

```bash
npm start
```

## Additional Commands

- `npm run lint`: Run ESLint to check for code quality issues.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
