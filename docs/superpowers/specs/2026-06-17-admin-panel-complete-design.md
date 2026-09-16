# Admin Panel - Complete Design Spec
**Date:** 2026-06-17  
**Scope:** Waitlist flow completion + Quest Campaign/Task management + Analytics  
**Approach:** Phased - Sprint 1 (Waitlist + Email Campaigns), Sprint 2 (Quest Management + Analytics)

---

## 1. Navigation & Page Structure

### Sidebar changes (`src/features/admin/components/admin-sidebar.tsx`)

```
Dashboard
Waitlist                    ← existing, enhanced
-------------------------
Email Campaigns             ← existing /admin/campaigns, renamed
Quest Management            ← new section header
  + Campaigns               ← new /admin/quest-campaigns
  + (Tasks live inside campaign detail, no top-level route)
-------------------------
Quest Wallets               ← existing /admin/quests, renamed
Analytics                   ← new /admin/analytics
-------------------------
Access Codes                ← existing /admin/codes
Topups                      ← existing /admin/topups
```

### New routes

| Route | Purpose |
|-------|---------|
| `/admin/quest-campaigns` | List + create quest campaigns (both backends) |
| `/admin/quest-campaigns/[id]` | Campaign detail + edit + task CRUD |
| `/admin/analytics` | Unified analytics page |

### Unchanged routes
- `/admin/waitlist` - same URL, enhanced UI
- `/admin/campaigns` - same URL, renamed "Email Campaigns"
- `/admin/quests` - same URL, renamed "Quest Wallets"

---

## 2. Waitlist Enhancements (Sprint 1)

### 2a. Send Access Email (per row)
- Each row gets a "Send Access" action button
- Only shown when: entry has email AND status is `PENDING` or `CONFIRMED`
- On click: calls `POST /admin/access-codes/individual` (create code) → `POST /admin/access-codes/send-email` (send email) - both endpoints already exist in backend
- On success: update row status to `ACCESS_SENT` optimistically

### 2b. Bulk Select + Send Access
- Checkbox at start of each row
- When ≥1 entries selected → floating toolbar appears above table:
  ```
  [✓ N selected]  [Send Access Email]  [Change Status ▼]  [Clear]
  ```
- "Send Access Email" → confirmation modal showing count → triggers batch
- **New backend endpoint required:** `POST /admin/waitlist/bulk-send-access`
  - Body: `{ entryIds: string[] }`
  - Iterates each entry: creates individual code + sends email
  - Returns: `{ sent: number, failed: number, errors: { id, reason }[] }`
- "Change Status" dropdown: PENDING | CONFIRMED | ACCESS_SENT | UNSUBSCRIBED

### 2c. Assign Code Manually
- Row action "Assign Code" opens modal:
  ```
  Select Code:   [dropdown - list ACTIVE access codes]
                 OR [Generate New Code]  
  [Assign & Send Email]  [Assign Only]
  ```
- On assign: `POST /admin/access-codes/individual` with `waitlistEntryId`, optionally send email
- Updates entry status to `ACCESS_SENT`

### 2d. Email Dispatch History (per entry)
- Clicking a row expands an inline panel (or side drawer) beneath the row:
  ```
  Email History for 0xABC...
  -------------------------------------------------
  Type                    | Status  | Sent At            | Action
  WAITLIST_CONFIRMATION   | SENT    | 2026-06-10 14:32   |
  ACCESS_RELEASE          | FAILED  | 2026-06-12 09:11   | [Retry]
  ```
- "Retry" re-triggers the send for FAILED dispatches
- **New backend endpoint required:** `GET /admin/waitlist/entries/:id/dispatches`
  - Returns: `EmailDispatch[]` for that entry

### 2e. Inline status summary (header cards)
- Above the table, 5 stat cards:
  ```
  Total | Pending | Confirmed | Access Sent | Bounced
  ```
- Data from existing `/api/admin/dashboard` endpoint

---

## 3. Email Campaigns Enhancements (Sprint 1)

### 3a. Rename
- Page title: "Email Campaigns"
- Sidebar label: "Email Campaigns"

### 3b. Target filter in campaign form
```
Send to:  ◉ All CONFIRMED entries
          ○ Filter by status  [PENDING | CONFIRMED | ACCESS_SENT]
          ○ Paste emails manually  [textarea]
```
- Backend `sendCampaign` already accepts `targetEmails?: string[]` - frontend wires the UI

### 3c. Campaign detail drawer
- Click any row in history table → side drawer opens:
  ```
  Campaign: "Wave 3 Access"
  Status: COMPLETED  |  Started: 2026-06-10  |  Completed: 2026-06-10

  Targeted: 150  |  Sent: 143  |  Failed: 5  |  Skipped: 2
  [Progress bar]
  ```
- Data from existing `GET /admin/campaign/:id`

---

## 4. Quest Campaign Management (Sprint 2)

### Architecture: Two-backend approach

| Backend | Port | Admin access method |
|---------|------|---------------------|
| Main backend | 6756 | Extend existing admin controller with new CRUD endpoints |
| Quest backend | 5555 | New Next.js proxy routes `/api/quest-admin/*` using `QUEST_ADMIN_TOKEN` env var |

### 4a. New backend endpoints (Main backend)
Add to `backend/src/modules/admin/admin.controller.ts`:
```
GET    /admin/quest-campaigns
POST   /admin/quest-campaigns
GET    /admin/quest-campaigns/:id
PUT    /admin/quest-campaigns/:id
DELETE /admin/quest-campaigns/:id          (soft: isActive=false)

POST   /admin/quest-campaigns/:id/tasks
PUT    /admin/quest-campaigns/:id/tasks/:taskId
DELETE /admin/quest-campaigns/:id/tasks/:taskId  (soft: isActive=false)
```

### 4b. New Next.js proxy routes (Quest backend)
New files under `src/app/api/quest-admin/`:
```
/api/quest-admin/campaigns
/api/quest-admin/campaigns/[id]
/api/quest-admin/campaigns/[id]/tasks
/api/quest-admin/campaigns/[id]/tasks/[taskId]
/api/quest-admin/analytics
/api/quest-admin/analytics/tasks
```
Auth: `Authorization: Bearer ${process.env.QUEST_ADMIN_TOKEN}` forwarded to quest backend.

### 4c. `/admin/quest-campaigns` - List page
```
Quest Campaigns                              [+ New Campaign ▼]
                                              + Main System
                                              + Quest System

[Filter: All | Main | Quest]  [Search by name]

Name          | Backend | Status  | Tasks | Participants | Period
-----------------------------------------------------------------
Blend Week 1  | MAIN    | Active  |  5    |  234         | Jun-Jul
Soroswap Q2   | QUEST   | Active  |  3    |  891         | Jun
```

### 4d. `/admin/quest-campaigns/[id]` - Detail + Task CRUD
Two-panel layout:

**Left panel - Campaign info (editable form):**
- Title, Description, Protocol, Category (select)
- Logo URL, Start Date, End Date
- Max Participants, isActive toggle
- `[Save Changes]` `[Delete Campaign]`

**Right panel - Tasks:**
```
Tasks                                    [+ Add Task]
-----------------------------------------------------
1. Connect Wallet    100pts  ACTIVE  [Edit] [↑↓] [Delete]
2. Deposit $10       200pts  ACTIVE  [Edit] [↑↓] [Delete]
```
Inline task form on Add/Edit:
```
Title *, Description, Type [ONCHAIN|SOCIAL|REFERRAL|OTHER]
Point Reward *, Order, isActive toggle
Metadata: [JSON editor - collapsible]
[Save]  [Cancel]
```

---

## 5. Analytics (Sprint 2)

### 5a. `/admin/analytics` - Standalone page

**Row 1 - KPI cards:**
```
Total Wallets | Active Campaigns | Total Participants | Tasks Completed | Total Volume (USD)
```

**Row 2 - Charts:**
- Line chart: "Wallets Over Time" - toggle 7d / 30d / 90d
- Bar chart: "Campaign Participation" - top 10 campaigns by participant count

**Row 3 - Tables (side by side):**
```
Task Completion Rates                    Top Wallets by Volume
-------------------------               ----------------------
Task | Campaign | Completed | Rate       Wallet | Protocol | Vol
```

### 5b. Inline stats additions

| Page | Addition |
|------|---------|
| `/admin/waitlist` | 5 status cards above table |
| `/admin/quest-campaigns` list | Participants + Completion % columns |
| `/admin/quest-campaigns/[id]` | Per-task `Completed / Total` count |
| `/admin/quests` (Quest Wallets) | Cards: Avg Volume, Median Volume, Wallets > $1k |

---

## 6. New Backend Endpoints Summary

### Main backend

| Method | Path | Description |
|--------|------|-------------|
| POST | `/admin/waitlist/bulk-send-access` | Bulk send access to selected entry IDs |
| GET | `/admin/waitlist/entries/:id/dispatches` | Email dispatch history for one entry |
| GET | `/admin/quest-campaigns` | List QuestCampaigns |
| POST | `/admin/quest-campaigns` | Create QuestCampaign |
| GET | `/admin/quest-campaigns/:id` | Get one with tasks |
| PUT | `/admin/quest-campaigns/:id` | Update |
| DELETE | `/admin/quest-campaigns/:id` | Soft-delete |
| POST | `/admin/quest-campaigns/:id/tasks` | Add task |
| PUT | `/admin/quest-campaigns/:id/tasks/:taskId` | Update task |
| DELETE | `/admin/quest-campaigns/:id/tasks/:taskId` | Soft-delete task |

### Next.js proxy routes for quest backend

| Route | Forwards to |
|-------|------------|
| `/api/quest-admin/campaigns` | Quest backend `/admin/campaigns` |
| `/api/quest-admin/campaigns/[id]` | Quest backend `/admin/campaigns/:id` |
| `/api/quest-admin/campaigns/[id]/tasks` | Quest backend task endpoints |
| `/api/quest-admin/analytics` | Quest backend analytics |

---

## 7. Sprint Plan

### Sprint 1 - Waitlist + Email Campaigns
1. Backend: `POST /admin/waitlist/bulk-send-access`
2. Backend: `GET /admin/waitlist/entries/:id/dispatches`
3. Frontend: enhance `/admin/waitlist` - per-row Send Access, bulk toolbar, Assign Code modal, dispatch history, status cards
4. Frontend: enhance `/admin/campaigns` - rename, target filter, campaign detail drawer

### Sprint 2 - Quest Management + Analytics
1. Backend: 10 new quest CRUD endpoints on main backend
2. Frontend: Next.js proxy routes `/api/quest-admin/*`
3. Frontend: `/admin/quest-campaigns` list page
4. Frontend: `/admin/quest-campaigns/[id]` detail + task CRUD
5. Frontend: `/admin/analytics` page
6. Frontend: inline stats on existing pages
7. Frontend: update sidebar navigation

---

## 8. Conventions

- **Framework:** Next.js App Router, Server Components by default, `"use client"` only when needed
- **Data fetching:** TanStack Query hooks in `src/features/admin/` following `use-admin-*.ts` pattern
- **Auth:** Bearer JWT from `useAdminAuthStore`, forwarded via `admin-fetch.ts`
- **Styling:** Tailwind CSS, follow existing admin component patterns
- **No new npm dependencies** unless strictly necessary
