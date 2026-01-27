# Project Reboot: Premium UI, Critical Fixes & Performance

- [ ] **Phase 1: Planning & Setup**
    - [x] Create comprehensive `implementation_plan.md`
    - [x] Create detailed `APPWRITE_SETUP.md` (Function deployment & Database Indexes)
    - [ ] Get User Approval on Plan `<!-- id: 0 -->`

- [x] **Phase 2: Critical Logic (The "Brain")**
    - [x] Fix Email Sending Logic (Client-side integration) `<!-- id: 1 -->`
        - [x] Create temporary `/test-email` page for isolation testing
        - [x] Verified email sending works
    - [x] Verify `confirm`/`decline` state updates in real-time (Optimistic UI) `<!-- id: 2 -->`
    - [x] Implement error handling for failed email calls `<!-- id: 3 -->`

- [ ] **Phase 3: Premium UI Overhaul (The "Look")**
    - [ ] **Design System**: Define specific font (Inter/Playfair), color palette (#850000 primary), and spacing variables `<!-- id: 4 -->`
    - [ ] **Dashboard**: Redesign Home & Bookings table with "Glassmorphism" & refined typography `<!-- id: 5 -->`
    - [ ] **Booking Page**: Polish the public public booking flow (smooth transitions, professional layout) `<!-- id: 6 -->`
    - [ ] **Sign In/Up**: Fix viewport issues and enhance visual appeal `<!-- id: 7 -->`

- [x] **Phase 4: Performance & Caching (The "Speed")**
    - [x] Implement `TanStack Query` (React Query) for data fetching & caching `<!-- id: 8 -->`
    - [x] Implement Optimistic UI updates (instant "Check" mark action before server response) `<!-- id: 9 -->`
    - [x] optimizing `useAuth` logic for faster session checks `<!-- id: 10 -->`

- [ ] **Phase 5: Verification**
    - [ ] Full walkthrough of Booking Flow -> Admin Confirm -> Email Received `<!-- id: 11 -->`
    - [ ] Performance audit (Lighthouse/Network waterfall) `<!-- id: 12 -->`
