# Book&Call Professional Call Experience - Implementation Plan

## Overview
Transform audio calls into structured professional meetings with intent, notes, documents, and follow-ups.

---

## Phase 1: Database Schema & Storage Setup

### New Collection: `callNotes`

| Attribute | Type | Size | Required | Description |
|-----------|------|------|----------|-------------|
| `callRoomId` | String | 36 | ✅ | Links to booking's callRoomId |
| `hostId` | String | 36 | ✅ | Host user ID |
| `guestEmail` | String | 255 | ✅ | Guest email for context |
| `summary` | String | 2000 | ❌ | Call summary text |
| `decisions` | String | 2000  | ❌ | Key decisions made |
| `actionItems` | String | 4000 | ❌ | JSON array of action items |
| `callPurpose` | String | 500 | ❌ | Pre-defined call intent |
| `expectedOutcome` | String | 500 | ❌ | Expected call outcome |

### New Collection: `callDocuments`

| Attribute | Type | Size | Required | Description |
|-----------|------|------|----------|-------------|
| `callRoomId` | String | 36 | ✅ | Links to booking's callRoomId |
| `hostId` | String | 36 | ✅ | Host user ID |
| `guestEmail` | String | 255 | ✅ | Guest email |
| `fileName` | String | 255 | ✅ | Original file name |
| `fileId` | String | 36 | ✅ | Appwrite storage file ID |
| `fileSize` | Integer | - | ✅ | File size in bytes |
| `fileType` | String | 50 | ✅ | MIME type |
| `uploadedBy` | Enum | - | ✅ | "host" or "guest" |
| `uploadedAt` | Datetime | - | ✅ | Upload timestamp |

### New Storage Bucket: `call-documents`
- Max file size: 500KB (512000 bytes)
- Allowed types: PDF, DOC, DOCX, TXT, XLS, XLSX
- Permissions: Users role (create, read)

### Update: `bookings` Collection
Add new attributes:
- `callPurpose` (String, 500)
- `expectedOutcome` (String, 500)

---

## Phase 2: Service Layer

### [MODIFY] `src/lib/appwrite/database.ts`

```typescript
// Add to existing file:

interface CallNotes {
  $id: string;
  callRoomId: string;
  hostId: string;
  guestEmail: string;
  summary?: string;
  decisions?: string;
  actionItems?: string; // JSON stringified array
  callPurpose?: string;
  expectedOutcome?: string;
  $createdAt: string;
  $updatedAt: string;
}

interface CallDocument {
  $id: string;
  callRoomId: string;
  hostId: string;
  guestEmail: string;
  fileName: string;
  fileId: string;
  fileSize: number;
  fileType: string;
  uploadedBy: 'host' | 'guest';
  uploadedAt: string;
}

// callNotesService
export const callNotesService = {
  create(data): Promise<CallNotes>,
  getByRoomId(roomId): Promise<CallNotes | null>,
  getByGuestEmail(hostId, guestEmail): Promise<CallNotes[]>,
  update(noteId, data): Promise<CallNotes>,
}

// callDocumentsService
export const callDocumentsService = {
  upload(file, roomId, hostId, guestEmail, uploadedBy): Promise<CallDocument>,
  listByRoomId(roomId): Promise<CallDocument[]>,
  listByGuestEmail(hostId, guestEmail): Promise<CallDocument[]>,
  getFileUrl(fileId): string,
  getFileDownloadUrl(fileId): string,
  delete(docId): Promise<void>,
}
```

---

## Phase 3: UI Components

### Pre-Join Screen Enhancements
- Show **Call Purpose** card
- Show **Expected Outcome** badge  
- Show **Previous Calls** count for repeat guests
- Show **Shared Documents** count from previous calls

### In-Call Panel (Collapsible Sidebar)

```
┌─────────────────────────────┐
│ 📝 Notes           [−] [×] │
├─────────────────────────────┤
│ Summary                     │
│ ┌─────────────────────────┐ │
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│ Decisions                   │
│ ┌─────────────────────────┐ │
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│ Action Items                │
│ ☐ Follow up on proposal    │
│ ☐ Send contract draft      │
│ [+ Add item]                │
├─────────────────────────────┤
│ 📎 Documents                │
├─────────────────────────────┤
│ 📄 proposal.pdf      [👁️📥] │
│ 📄 contract.docx     [👁️📥] │
│ [+ Upload Document]         │
│ (Max 500KB • PDF, DOC, TXT) │
└─────────────────────────────┘
```

### Document Viewer Modal
- PDF: Inline preview using `<iframe>` or `<embed>`
- DOC/DOCX: Download prompt (can't preview natively)
- TXT: Inline text display

### Post-Call Screen
- **Call Recap Card**: Duration, timestamp, participants
- **Notes Summary**: Editable before closing
- **Documents Shared**: List with download links
- **Actions**:
  - "Copy Summary" button
  - "Download All Docs" 
  - "Schedule Follow-up"

### Call History Page (Dashboard)
New page: `/dashboard/call-history`
- List of all past calls
- Filter by guest
- View notes & documents per call

---

## Phase 4: Implementation Files

| File | Action | Description |
|------|--------|-------------|
| `src/lib/appwrite/database.ts` | MODIFY | Add interfaces & services |
| `src/app/call/[roomId]/page.tsx` | MODIFY | Integrate notes panel, docs |
| `src/components/call/NotesPanel.tsx` | CREATE | Side panel for notes & docs |
| `src/components/call/DocumentUpload.tsx` | CREATE | Upload component |
| `src/components/call/DocumentViewer.tsx` | CREATE | Preview/download modal |
| `src/components/call/PostCallRecap.tsx` | CREATE | Post-call summary screen |
| `src/app/dashboard/call-history/page.tsx` | CREATE | Call history page |

---

## Phase 5: Implementation Order

### Step 1: Appwrite Setup (User does this)
1. Create `callNotes` collection with attributes
2. Create `callDocuments` collection with attributes
3. Create `call-documents` storage bucket (500KB limit)
4. Set permissions (users role: create, read, update)

### Step 2: Service Layer
1. Add interfaces to database.ts
2. Implement callNotesService
3. Implement callDocumentsService

### Step 3: UI - Notes Panel
1. Create NotesPanel component
2. Integrate into call page
3. Auto-save functionality

### Step 4: UI - Documents
1. Create DocumentUpload component
2. Create DocumentViewer component
3. Integrate into NotesPanel

### Step 5: UI - Post-Call
1. Create PostCallRecap component
2. Replace current ended state

### Step 6: Call History
1. Create call-history page
2. Add to sidebar navigation

---

## Environment Variables Needed

Add these to your `.env.local` file:

```env
# Existing variables...

# NEW - Call Notes & Documents
NEXT_PUBLIC_APPWRITE_CALL_NOTES_COLLECTION_ID=your_call_notes_collection_id
NEXT_PUBLIC_APPWRITE_CALL_DOCUMENTS_COLLECTION_ID=your_call_documents_collection_id
NEXT_PUBLIC_APPWRITE_CALL_DOCUMENTS_BUCKET_ID=your_call_documents_bucket_id
```

---

## Appwrite Console Setup

### 1. Create `callNotes` Collection

**Attributes:**
| Name | Type | Size | Required |
|------|------|------|----------|
| `callRoomId` | String | 36 | ✅ |
| `hostId` | String | 36 | ✅ |
| `guestEmail` | String | 255 | ✅ |
| `summary` | String | 2000 | ❌ |
| `decisions` | String | 2000 | ❌ |
| `actionItems` | String | 4000 | ❌ |
| `callPurpose` | String | 500 | ❌ |
| `expectedOutcome` | String | 500 | ❌ |

**Indexes (individual, ASC):**
- `callRoomId`
- `hostId`
- `guestEmail`

**Permissions:**
- Users role: Create, Read, Update

### 2. Create `callDocuments` Collection

**Attributes:**
| Name | Type | Size | Required |
|------|------|------|----------|
| `callRoomId` | String | 36 | ✅ |
| `hostId` | String | 36 | ✅ |
| `guestEmail` | String | 255 | ✅ |
| `fileName` | String | 255 | ✅ |
| `fileId` | String | 36 | ✅ |
| `fileSize` | Integer | - | ✅ |
| `fileType` | String | 100 | ✅ |
| `uploadedBy` | Enum | - | ✅ | Values: `host`, `guest`

**Indexes (individual, ASC):**
- `callRoomId`
- `hostId`
- `guestEmail`

**Permissions:**
- Users role: Create, Read

### 3. Create `call-documents` Storage Bucket

**Settings:**
- **Max File Size**: 512000 bytes (500KB)
- **Allowed Extensions**: pdf, doc, docx, txt, xls, xlsx
- **Encryption**: Enabled
- **Antivirus**: Enabled (if available)

**Permissions:**
- Users role: Create, Read

### 4. Update `bookings` Collection

**Add new attributes:**
| Name | Type | Size | Required |
|------|------|------|----------|
| `callPurpose` | String | 500 | ❌ |
| `expectedOutcome` | String | 500 | ❌ |

---

## File Size & Type Restrictions

- **Max Size**: 500KB (512,000 bytes)
- **Allowed Types**:
  - `application/pdf`
  - `application/msword`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - `text/plain`
  - `application/vnd.ms-excel`
  - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

---

## Non-Goals
- ❌ Video calls
- ❌ Audio recording
- ❌ AI transcription
- ❌ Real-time collaborative notes
- ❌ Files larger than 500KB
- ❌ Image/video file sharing
