# Bookr - Appointment Scheduling Platform

A modern, production-ready scheduling platform with Three.js animations and parallax effects.

## � Quick Setup

### 1. Install Dependencies

```bash
npm install
```

**Additional TypeScript types (optional but recommended):**
```bash
npm install -D @types/three
```

### 2. Environment Variables

Your `.env.local` should have:
```env
NEXT_PUBLIC_APPWRITE_PROJECT_ID=bookr-niv
NEXT_PUBLIC_APPWRITE_PROJECT_NAME=bookr
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_DATABASE_ID=bookr-db
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=users
NEXT_PUBLIC_APPWRITE_EVENT_TYPES_COLLECTION_ID=event_types
NEXT_PUBLIC_APPWRITE_AVAILABILITY_COLLECTION_ID=availability
NEXT_PUBLIC_APPWRITE_BOOKINGS_COLLECTION_ID=bookings
NEXT_PUBLIC_APPWRITE_AVATARS_BUCKET_ID=avatars
```

### 3. Appwrite Setup

Use the `appwrite.config.json` file in your project root to create collections. This file contains all the schema definitions.

**Required Collections:**
- `users` - User profiles
- `event_types` - Meeting types (30min, 60min, etc.)
- `availability` - Weekly schedules
- `bookings` - Guest reservations

**Required Bucket:**
- `avatars` - User profile pictures

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ✨ Features

- 🎨 **Three.js Animation** - Floating particles background
- 📜 **Parallax Scrolling** - Smooth scroll effects
- 📱 **Fully Responsive** - Mobile-first design
- 🗓️ **Event Types** - Create custom meeting types
- ⏰ **Availability** - Weekly schedule editor
- 📅 **Public Booking** - Share booking links
- 👥 **Admin Dashboard** - Full CRUD management

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing (Three.js + Parallax)
│   ├── auth/                 # Login, Signup
│   ├── dashboard/            # User dashboard
│   ├── admin/                # Admin dashboard
│   └── book/[username]/      # Public booking
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── dashboard/            # Sidebar, Layout
│   ├── three/                # Three.js background
│   └── animations/           # Parallax components
└── lib/
    ├── appwrite/             # Backend services
    └── hooks/                # Auth context
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 16 | App Router |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Three.js | 3D animations |
| @react-three/fiber | React Three.js |
| Framer Motion | Animations |
| Radix UI | UI primitives |
| Appwrite | Backend |

---

## 📝 Key Pages

| Route | Description |
|-------|-------------|
| `/` | Marketing landing page |
| `/auth/login` | User login |
| `/auth/signup` | User registration |
| `/dashboard` | User dashboard home |
| `/dashboard/event-types` | Manage event types |
| `/dashboard/availability` | Weekly schedule |
| `/dashboard/bookings` | View bookings |
| `/dashboard/settings` | Profile settings |
| `/admin` | Admin overview |
| `/book/[username]` | Public booking page |

---

## 🎯 Design Reference

The UI matches the Schedulr Pro design with:
- Cream background (#FAFAF8)
- Yellow primary color (#FBBF24)
- Rounded cards with subtle shadows
- Clean sidebar navigation
- Status badges with dot indicators

---

## 📄 License

MIT
