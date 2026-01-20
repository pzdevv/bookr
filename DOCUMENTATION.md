# Bookr - Complete Documentation

A modern scheduling and booking platform built with Next.js 15, Appwrite, and WebRTC.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication System](#authentication-system)
3. [Database Services](#database-services)
4. [Audio Call System](#audio-call-system)
5. [Utility Functions](#utility-functions)
6. [Rate Limiting](#rate-limiting)
7. [Page Structure](#page-structure)

---

## Architecture Overview

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages (login, signup, verify, reset)
│   ├── book/              # Public booking flow
│   ├── call/              # Audio call pages
│   ├── dashboard/         # User dashboard (bookings, availability, settings)
│   └── admin/             # Admin panel
├── components/            # Reusable UI components
├── lib/
│   ├── appwrite/          # Appwrite SDK configuration & services
│   ├── hooks/             # Custom React hooks
│   ├── security/          # Rate limiting & security utils
│   └── utils.ts           # General utilities
└── middleware.ts          # Route protection
```

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Appwrite (Auth, Database, Storage)
- **Animations**: Framer Motion
- **Audio Calls**: PeerJS (WebRTC)

---

## Authentication System

### `authService` (`/lib/appwrite/auth.ts`)

Handles all authentication operations via Appwrite.

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `hasActiveSession()` | - | `boolean` | Checks if user has an active session |
| `signUp(email, password, name)` | `string, string, string` | `AuthUser` | Creates account, starts session, sends verification email |
| `signIn(email, password)` | `string, string` | `AuthUser` | Signs in user, requires email verification |
| `signInWithGoogle()` | - | `void` | Initiates OAuth2 flow with Google |
| `signOut()` | - | `void` | Destroys current session |
| `getCurrentUser()` | - | `AuthUser \| null` | Gets current authenticated user |
| `verifyEmail(userId, secret)` | `string, string` | `void` | Verifies email with secret from URL |
| `sendVerificationEmail()` | - | `void` | Sends verification email to current user |
| `sendPasswordRecovery(email)` | `string` | `void` | Sends password reset email |
| `resetPassword(userId, secret, password)` | `string, string, string` | `void` | Resets password using recovery secret |

### `useAuth` Hook (`/lib/hooks/use-auth.tsx`)

React context hook providing authentication state and methods.

```typescript
const {
  user,              // AuthUser | null - Appwrite user object
  userProfile,       // User | null - Database profile
  isLoading,         // boolean - Loading state
  signUp,            // (email, password, name) => Promise<void>
  signIn,            // (email, password) => Promise<void>
  signInWithGoogle,  // () => Promise<void>
  signOut,           // () => Promise<void>
  refreshUser,       // () => Promise<void>
  sendPasswordRecovery,
  resetPassword,
} = useAuth();
```

**Auto-Setup for New Users:**
When a new user signs in, the hook automatically:
1. Creates a database profile with unique username
2. Creates a default "Meeting" event type (30 min)
3. Creates default availability (Mon-Fri, 9AM-5PM)

---

## Database Services

### Data Models

```typescript
interface User {
  $id: string;
  name: string;
  email: string;
  username?: string;      // Public URL: /book/{username}
  bio?: string;
  avatar?: string;        // Storage file URL
  role: 'user' | 'admin';
  timezone: string;
}

interface EventType {
  $id: string;
  userId: string;
  title: string;          // e.g., "30 Min Meeting"
  duration: number;       // Minutes
  buffer: number;         // Buffer between meetings (minutes)
  color: string;          // Hex color
  description: string;
  slug: string;           // URL slug
  isActive: boolean;
}

interface Availability {
  $id: string;
  userId: string;
  day: number;            // 0=Sunday, 6=Saturday
  startTime: string;      // "09:00"
  endTime: string;        // "17:00"
  isEnabled: boolean;
}

interface Booking {
  $id: string;
  userId: string;         // Host user ID
  eventTypeId: string;
  guestName: string;
  guestEmail: string;
  slotTime: string;       // ISO datetime
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  callRoomId?: string;    // Unique room ID for audio calls
  callStartedAt?: string; // ISO datetime when call started
  callEndedAt?: string;   // ISO datetime when call ended
  callExpiry?: string;    // ISO datetime when call link expires (1hr after end)
}
```

> **Call Lifecycle**: When a call ends, `callExpiry` is automatically set to 1 hour after. Visiting an expired call link shows "Call Link Expired" screen.

### `userService`

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `create(data)` | `Omit<User, ...>` | `User` | Creates new user profile |
| `get(userId)` | `string` | `User \| null` | Get user by ID |
| `getByEmail(email)` | `string` | `User \| null` | Get user by email |
| `getByUsername(username)` | `string` | `User \| null` | Get user by username |
| `getByNameSlug(slug)` | `string` | `User \| null` | Get user by name-based slug |
| `update(userId, data)` | `string, Partial<User>` | `User` | Update user profile |
| `delete(userId)` | `string` | `void` | Delete user |
| `list(queries)` | `string[]` | `User[]` | List users with queries |
| `uploadAvatar(file)` | `File` | `string` | Upload avatar, returns URL |

### `eventTypeService`

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `create(data)` | `Omit<EventType, ...>` | `EventType` | Create event type |
| `get(eventTypeId)` | `string` | `EventType \| null` | Get by ID |
| `getBySlug(slug)` | `string` | `EventType \| null` | Get by URL slug |
| `update(eventTypeId, data)` | `string, Partial<EventType>` | `EventType` | Update event |
| `delete(eventTypeId)` | `string` | `void` | Delete event |
| `listByUser(userId)` | `string` | `EventType[]` | List user's event types |

### `availabilityService`

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `create(data)` | `Omit<Availability, ...>` | `Availability` | Create availability slot |
| `update(availabilityId, data)` | `string, Partial<Availability>` | `Availability` | Update slot |
| `delete(availabilityId)` | `string` | `void` | Delete slot |
| `listByUser(userId)` | `string` | `Availability[]` | Get user's availability |

### `bookingService`

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `create(data)` | `Omit<Booking, ...>` | `Booking` | Create booking |
| `get(bookingId)` | `string` | `Booking \| null` | Get by ID |
| `getByRoomId(roomId)` | `string` | `Booking \| null` | **Get by call room ID** |
| `update(bookingId, data)` | `string, Partial<Booking>` | `Booking` | Update booking |
| `delete(bookingId)` | `string` | `void` | Delete booking |
| `listByUser(userId)` | `string` | `Booking[]` | List all user's bookings |
| `listUpcoming(userId)` | `string` | `Booking[]` | List upcoming (max 5) |
| `isSlotAvailable(userId, slotTime, duration)` | `string, string, number` | `boolean` | **Check for double booking** |

### `generateCallRoomId()`

Generates a unique call room ID for audio calls.

```typescript
generateCallRoomId(): string
// Returns: "call-abc123xyz456"
```

### Call Lifecycle Functions

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `markCallStarted(bookingId)` | `string` | `Promise<void>` | Records when call started |
| `markCallEnded(bookingId)` | `string` | `Promise<void>` | Records end time, sets expiry (1hr), marks complete |
| `isCallExpired(booking)` | `Booking` | `boolean` | Checks if call link has expired |

---

## Audio Call System

> **Unique Feature**: Peer-to-peer audio calls using WebRTC with no external servers for actual audio transmission.

### How It Works

```
1. Guest books a meeting
   └── System generates unique callRoomId (e.g., "call-abc123xyz")
   
2. Both parties visit /call/{roomId}
   └── First person: Becomes "host" peer, waits
   └── Second person: Connects as "guest" peer
   
3. WebRTC audio stream established
   └── Peer-to-peer, encrypted, no server relay
   └── PeerJS handles signaling
```

### `useAudioCall` Hook (`/lib/hooks/use-audio-call.ts`)

```typescript
const {
  callState,      // 'idle' | 'connecting' | 'waiting' | 'connected' | 'ended' | 'error'
  isMuted,        // boolean
  callDuration,   // number (seconds)
  error,          // string | null
  remotePeerId,   // string | null
  startCall,      // () => Promise<void>
  endCall,        // () => void
  toggleMute,     // () => void
} = useAudioCall({
  roomId: string,
  userName: string,
  onCallEnded?: () => void,
});
```

### Call States

| State | Description |
|-------|-------------|
| `idle` | Initial state, call not started |
| `connecting` | Requesting microphone access |
| `waiting` | First person waiting for other to join |
| `connected` | Both parties connected, audio streaming |
| `ended` | Call ended by either party |
| `error` | Error occurred (mic denied, connection failed) |

### `formatCallDuration(seconds)`

Converts seconds to `MM:SS` format.

```typescript
formatCallDuration(65)  // "01:05"
formatCallDuration(3600) // "60:00"
```

### Call Page (`/call/[roomId]`)

Features:
- **Pre-join screen**: Shows booking details, host name, meeting duration
- **Call controls**: Mute/unmute, end call buttons
- **Status display**: Connection status, call timer
- **Error handling**: Retry button on failures
- **Expiry handling**: Shows "Call Link Expired" if visited after expiry
- **Call tracking**: Automatically marks call start/end times

---

## Utility Functions

### `/lib/utils.ts`

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `cn(...inputs)` | `ClassValue[]` | `string` | Tailwind class merge utility |
| `generateSlug(text)` | `string` | `string` | Converts text to URL slug |
| `formatTime(time)` | `string` | `string` | "14:30" → "2:30 PM" |
| `formatDate(date)` | `Date \| string` | `string` | Full date format |
| `formatDateTime(date)` | `Date \| string` | `string` | Date + time format |
| `getDayName(day)` | `number` | `string` | 0 → "Sunday" |
| `getTimeSlots(start, end, duration, buffer)` | `string, string, number, number` | `string[]` | Generate available time slots |
| `getUserTimezone()` | - | `string` | Browser timezone |

### `getTimeSlots` Example

```typescript
getTimeSlots("09:00", "12:00", 30, 10)
// Returns: ["09:00", "09:40", "10:20", "11:00", "11:40"]
// (30 min slots + 10 min buffer)
```

### Color Palette

```typescript
export const COLORS = [
  { name: 'Yellow', value: '#FBBF24' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Green', value: '#10B981' },
];
```

---

## Rate Limiting

### `/lib/security/rate-limit.ts`

Client-side rate limiting for authentication endpoints.

> ⚠️ **Note**: For production, implement server-side rate limiting with Redis.

### Functions

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `checkRateLimit(key, config)` | `string, RateLimitConfig` | `{ limited, remainingAttempts, resetInMs }` | Check if action is rate limited |
| `resetRateLimit(key)` | `string` | `void` | Clear rate limit for key |
| `formatResetTime(ms)` | `number` | `string` | "45 seconds" or "2 minutes" |

### Pre-configured Limits

```typescript
export const AUTH_RATE_LIMITS = {
  login:              { maxAttempts: 5, windowMs: 60000 },      // 5 per minute
  signup:             { maxAttempts: 3, windowMs: 60000 },      // 3 per minute
  passwordReset:      { maxAttempts: 3, windowMs: 300000 },     // 3 per 5 min
  resendVerification: { maxAttempts: 3, windowMs: 300000 },     // 3 per 5 min
};
```

### Usage Example

```typescript
import { checkRateLimit, AUTH_RATE_LIMITS } from '@/lib/security/rate-limit';

const result = checkRateLimit(`login:${email}`, AUTH_RATE_LIMITS.login);

if (result.limited) {
  throw new Error(`Too many attempts. Try again in ${formatResetTime(result.resetInMs)}`);
}
```

---

## Page Structure

### Public Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with features, pricing, how-it-works |
| `/book/[username]/[eventSlug]` | Public booking page for guests |
| `/book/[username]/[eventSlug]/confirm` | Booking confirmation with calendar export |
| `/call/[roomId]` | Audio call room |

### Auth Pages

| Route | Description |
|-------|-------------|
| `/auth/login` | Login with email/password or Google |
| `/auth/signup` | Create account |
| `/auth/verify` | Email verification callback |
| `/auth/forgot-password` | Request password reset |
| `/auth/reset-password` | Set new password |
| `/auth/callback` | OAuth callback handler |

### Dashboard (Protected)

| Route | Description |
|-------|-------------|
| `/dashboard` | Overview with stats, upcoming bookings, booking link |
| `/dashboard/bookings` | Manage all bookings with tabs (upcoming/past/cancelled) |
| `/dashboard/availability` | Set weekly availability schedule |
| `/dashboard/event-types` | Create/edit meeting types |
| `/dashboard/settings` | Profile settings, avatar upload |

### Admin (Protected, Admin Role)

| Route | Description |
|-------|-------------|
| `/admin` | Admin dashboard |
| `/admin/users` | User management |
| `/admin/bookings` | All bookings management |

---

## Appwrite Database Attributes

Detailed attribute specifications for each collection:

### `users` Collection

| Attribute | Type | Size | Required | Default | Description |
|-----------|------|------|----------|---------|-------------|
| `name` | String | 255 | ✅ | - | User's display name |
| `email` | String | 255 | ✅ | - | User's email (unique) |
| `username` | String | 100 | ❌ | - | Unique URL slug |
| `bio` | String | 500 | ❌ | - | Profile bio |
| `avatar` | String | 500 | ❌ | - | Avatar storage URL |
| `role` | Enum | - | ✅ | `user` | `user` or `admin` |
| `timezone` | String | 100 | ✅ | - | IANA timezone |

### `eventTypes` Collection

| Attribute | Type | Size | Required | Default | Description |
|-----------|------|------|----------|---------|-------------|
| `userId` | String | 36 | ✅ | - | Owner's user ID |
| `title` | String | 100 | ✅ | - | Event name |
| `duration` | Integer | - | ✅ | 30 | Duration in minutes |
| `buffer` | Integer | - | ❌ | 0 | Buffer between meetings |
| `color` | String | 7 | ✅ | - | Hex color |
| `description` | String | 500 | ❌ | - | Event description |
| `slug` | String | 100 | ✅ | - | URL slug |
| `isActive` | Boolean | - | ✅ | true | Is event bookable |

### `availability` Collection

| Attribute | Type | Size | Required | Default | Description |
|-----------|------|------|----------|---------|-------------|
| `userId` | String | 36 | ✅ | - | Owner's user ID |
| `day` | Integer | - | ✅ | - | 0-6 (Sun-Sat) |
| `startTime` | String | 5 | ✅ | - | "HH:MM" format |
| `endTime` | String | 5 | ✅ | - | "HH:MM" format |
| `isEnabled` | Boolean | - | ✅ | true | Is day available |

### `bookings` Collection

| Attribute | Type | Size | Required | Default | Description |
|-----------|------|------|----------|---------|-------------|
| `userId` | String | 36 | ✅ | - | Host user ID |
| `eventTypeId` | String | 36 | ✅ | - | Related event type |
| `guestName` | String | 100 | ✅ | - | Guest's name |
| `guestEmail` | String | 255 | ✅ | - | Guest's email |
| `slotTime` | Datetime | - | ✅ | - | Booking start time |
| `status` | Enum | - | ✅ | `confirmed` | `pending`, `confirmed`, `cancelled`, `completed` |
| `notes` | String | 1000 | ❌ | - | Guest notes |
| `callRoomId` | String | 20 | ❌ | - | Unique call room ID |
| `callStartedAt` | Datetime | - | ❌ | - | When call started |
| `callEndedAt` | Datetime | - | ❌ | - | When call ended |
| `callExpiry` | Datetime | - | ❌ | - | Link expires after this |

> **Note**: `$id`, `$createdAt`, `$updatedAt` are auto-generated by Appwrite.

### Required Permissions

Each collection needs these permissions for `users` role:
- ✅ Create
- ✅ Read
- ✅ Update
- ❌ Delete (optional, for safety)

---

## Environment Variables

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=users
NEXT_PUBLIC_APPWRITE_EVENT_TYPES_COLLECTION_ID=eventTypes
NEXT_PUBLIC_APPWRITE_AVAILABILITY_COLLECTION_ID=availability
NEXT_PUBLIC_APPWRITE_BOOKINGS_COLLECTION_ID=bookings
NEXT_PUBLIC_APPWRITE_AVATARS_BUCKET_ID=avatars
```

---

## Running the App

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

---

*Generated on January 17, 2026*
