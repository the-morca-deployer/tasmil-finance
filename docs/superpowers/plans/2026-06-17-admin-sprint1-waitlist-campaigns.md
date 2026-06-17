# Admin Panel Sprint 1 — Waitlist Complete + Email Campaigns

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the waitlist admin flow (per-row send access, bulk send, assign code, dispatch history) and enhance the email campaigns page (rename, target filter, campaign detail drawer).

**Architecture:** Two-layer: backend NestJS service methods (TDD first) → controller endpoints → Next.js API proxy routes → React hooks → page components. All new service logic is test-driven — write the failing test, then implement.

**Tech Stack:** NestJS + Prisma (backend), Next.js App Router + TanStack Query + Tailwind (frontend), Jest (both), existing `adminFetch` helper + `useAdminAuthStore` pattern.

---

## File Map

### Backend (`/Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/backend`)
| Action | File |
|--------|------|
| Modify | `src/modules/admin/admin.dto.ts` |
| Modify | `src/modules/admin/admin.service.ts` |
| Modify | `src/modules/admin/admin.service.spec.ts` |
| Modify | `src/modules/admin/admin.controller.ts` |

### Frontend (`/Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/tasmil-finance`)
| Action | File |
|--------|------|
| Create | `src/app/api/admin/waitlist/entries/[id]/dispatches/route.ts` |
| Create | `src/app/api/admin/waitlist/bulk-send-access/route.ts` |
| Modify | `src/features/admin/types.ts` |
| Modify | `src/features/admin/hooks/use-admin-waitlist.ts` |
| Modify | `src/app/admin/(app)/waitlist/page.tsx` |
| Modify | `src/app/admin/(app)/campaigns/page.tsx` |
| Modify | `src/shared/layout/sidebar-data.ts` |

---

## Task 1: Backend DTOs

**Files:**
- Modify: `backend/src/modules/admin/admin.dto.ts`

- [ ] **Step 1: Add `IsArray` to class-validator import** at line 2:
```typescript
import { IsString, IsOptional, IsNumber, Min, Max, IsArray } from 'class-validator';
```

- [ ] **Step 2: Append new DTOs** at end of `admin.dto.ts`:

```typescript
export class BulkSendAccessDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  entryIds: string[];
}

export class BulkSendResultDto {
  @ApiProperty() sent: number;
  @ApiProperty() failed: number;
  @ApiProperty({ type: [Object] }) errors: { id: string; reason: string }[];
}

export class EmailDispatchDto {
  @ApiProperty() id: string;
  @ApiProperty() templateType: string;
  @ApiProperty() status: string;
  @ApiProperty({ nullable: true }) providerMessageId: string | null;
  @ApiProperty({ nullable: true }) errorMessage: string | null;
  @ApiProperty({ nullable: true }) sentAt: Date | null;
  @ApiProperty() createdAt: Date;
}
```

- [ ] **Step 3: Commit**
```bash
cd /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/backend
git add src/modules/admin/admin.dto.ts
git commit -m "feat(admin): add BulkSendAccessDto, BulkSendResultDto, EmailDispatchDto"
```

---

## Task 2: Backend Service — `bulkSendAccess` (TDD)

**Files:**
- Modify: `backend/src/modules/admin/admin.service.spec.ts`
- Modify: `backend/src/modules/admin/admin.service.ts`

- [ ] **Step 1: Write failing tests** — append new `describe('bulkSendAccess')` block before the final `});` in `admin.service.spec.ts`:

```typescript
describe('bulkSendAccess', () => {
  it('should send access to each entry and return sent count', async () => {
    mockPrisma.waitlistEntry.findUnique = jest.fn()
      .mockResolvedValueOnce({ id: 'e1', email: 'a@x.com' })
      .mockResolvedValueOnce({ id: 'e2', email: 'b@x.com' });
    mockPrisma.accessCode.create
      .mockResolvedValueOnce({ id: 'c1', code: 'CODE000001' })
      .mockResolvedValueOnce({ id: 'c2', code: 'CODE000002' });
    mockPrisma.emailDispatch.create
      .mockResolvedValueOnce({ id: 'd1' })
      .mockResolvedValueOnce({ id: 'd2' });
    mockPrisma.emailDispatch.update.mockResolvedValue({} as any);
    mockPrisma.waitlistEntry.update.mockResolvedValue({} as any);
    (emailService as any).sendAccessCode = jest.fn()
      .mockResolvedValue({ success: true, providerMessageId: 'msg-1' });

    const result = await service.bulkSendAccess(['e1', 'e2'], 'admin-1');

    expect(result.sent).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('should record failed entries when no email without throwing', async () => {
    mockPrisma.waitlistEntry.findUnique = jest.fn()
      .mockResolvedValueOnce({ id: 'e1', email: 'a@x.com' })
      .mockResolvedValueOnce({ id: 'e2', email: null });
    mockPrisma.accessCode.create.mockResolvedValue({ id: 'c1', code: 'CODE000001' });
    mockPrisma.emailDispatch.create.mockResolvedValue({ id: 'd1' });
    mockPrisma.emailDispatch.update.mockResolvedValue({} as any);
    mockPrisma.waitlistEntry.update.mockResolvedValue({} as any);
    (emailService as any).sendAccessCode = jest.fn()
      .mockResolvedValue({ success: true });

    const result = await service.bulkSendAccess(['e1', 'e2'], 'admin-1');

    expect(result.sent).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.errors[0]).toMatchObject({ id: 'e2', reason: expect.any(String) });
  });

  it('should return failed when entry not found', async () => {
    mockPrisma.waitlistEntry.findUnique = jest.fn().mockResolvedValue(null);

    const result = await service.bulkSendAccess(['nonexistent'], 'admin-1');

    expect(result.sent).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors[0].reason).toMatch(/not found/i);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**
```bash
cd /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/backend
pnpm test -- --testPathPattern="admin.service.spec" --no-coverage 2>&1 | tail -15
```
Expected: `bulkSendAccess is not a function`.

- [ ] **Step 3: Implement `bulkSendAccess`** — add `BulkSendResultDto` to imports at top of `admin.service.ts`:
```typescript
import {
  CampaignSendDto,
  AdminDashboardDto,
  AccessCodeListItemDto,
  CampaignRunDto,
  QuestStatsDto,
  VolumeByProtocolDto,
  BulkSendResultDto,
  EmailDispatchDto,
} from './admin.dto';
```

Then add method after `updateWaitlistEntry` in `admin.service.ts`:
```typescript
async bulkSendAccess(
  entryIds: string[],
  adminId: string,
): Promise<BulkSendResultDto> {
  let sent = 0;
  let failed = 0;
  const errors: { id: string; reason: string }[] = [];

  for (const id of entryIds) {
    try {
      const entry = await this.prisma.waitlistEntry.findUnique({ where: { id } });
      if (!entry) {
        failed++;
        errors.push({ id, reason: 'Entry not found' });
        continue;
      }
      if (!entry.email) {
        failed++;
        errors.push({ id, reason: 'No email on entry' });
        continue;
      }

      const codeRecord = await this.prisma.accessCode.create({
        data: {
          code: this.generateSecureCode(),
          type: 'EARLY_ACCESS',
          maxActivations: 1,
          status: 'ACTIVE',
          issuedByAdminId: adminId,
          issuedToWaitlistEntryId: id,
        },
      });

      const dispatch = await this.prisma.emailDispatch.create({
        data: { waitlistEntryId: id, templateType: 'ACCESS_RELEASE', status: 'PENDING' },
      });

      const result = await this.emailService.sendAccessCode(entry.email, codeRecord.code);

      await this.prisma.emailDispatch.update({
        where: { id: dispatch.id },
        data: {
          status: result.success ? 'SENT' : 'FAILED',
          providerMessageId: result.providerMessageId ?? null,
          errorMessage: result.error ?? null,
          sentAt: result.success ? new Date() : null,
        },
      });

      if (result.success) {
        await this.prisma.waitlistEntry.update({
          where: { id },
          data: { lastAccessEmailSentAt: new Date(), status: 'ACCESS_SENT' },
        });
        sent++;
      } else {
        failed++;
        errors.push({ id, reason: result.error ?? 'Email send failed' });
      }
    } catch (err: any) {
      failed++;
      errors.push({ id, reason: err?.message ?? 'Unknown error' });
    }
  }

  return { sent, failed, errors };
}
```

- [ ] **Step 4: Run tests to confirm they pass**
```bash
pnpm test -- --testPathPattern="admin.service.spec" --no-coverage 2>&1 | tail -15
```
Expected: all `bulkSendAccess` tests PASS.

- [ ] **Step 5: Commit**
```bash
git add src/modules/admin/admin.service.ts src/modules/admin/admin.service.spec.ts
git commit -m "feat(admin): add bulkSendAccess service method with TDD"
```

---

## Task 3: Backend Service — `getWaitlistEntryDispatches` (TDD)

**Files:**
- Modify: `backend/src/modules/admin/admin.service.spec.ts`
- Modify: `backend/src/modules/admin/admin.service.ts`

- [ ] **Step 1: Add `findMany` to `mockPrisma.emailDispatch`** in the mockPrisma object (around line 16):
```typescript
emailDispatch: {
  count: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  findMany: jest.fn(),
},
```

- [ ] **Step 2: Write failing tests** — append `describe('getWaitlistEntryDispatches')` before final `});`:

```typescript
describe('getWaitlistEntryDispatches', () => {
  it('should return dispatches ordered by createdAt desc', async () => {
    const dispatches = [
      {
        id: 'd2',
        templateType: 'ACCESS_RELEASE',
        status: 'SENT',
        providerMessageId: 'msg-1',
        errorMessage: null,
        sentAt: new Date('2026-06-12T09:00:00Z'),
        createdAt: new Date('2026-06-12T08:59:00Z'),
      },
      {
        id: 'd1',
        templateType: 'WAITLIST_CONFIRMATION',
        status: 'SENT',
        providerMessageId: 'msg-0',
        errorMessage: null,
        sentAt: new Date('2026-06-10T14:32:00Z'),
        createdAt: new Date('2026-06-10T14:31:00Z'),
      },
    ];
    mockPrisma.emailDispatch.findMany.mockResolvedValue(dispatches as any);

    const result = await service.getWaitlistEntryDispatches('entry-1');

    expect(mockPrisma.emailDispatch.findMany).toHaveBeenCalledWith({
      where: { waitlistEntryId: 'entry-1' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        templateType: true,
        status: true,
        providerMessageId: true,
        errorMessage: true,
        sentAt: true,
        createdAt: true,
      },
    });
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('d2');
  });

  it('should return empty array when no dispatches exist', async () => {
    mockPrisma.emailDispatch.findMany.mockResolvedValue([]);

    const result = await service.getWaitlistEntryDispatches('entry-1');

    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 3: Confirm tests fail**
```bash
pnpm test -- --testPathPattern="admin.service.spec" --no-coverage 2>&1 | tail -10
```
Expected: `getWaitlistEntryDispatches is not a function`.

- [ ] **Step 4: Implement** — add after `bulkSendAccess` in `admin.service.ts`:

```typescript
async getWaitlistEntryDispatches(entryId: string): Promise<EmailDispatchDto[]> {
  return this.prisma.emailDispatch.findMany({
    where: { waitlistEntryId: entryId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      templateType: true,
      status: true,
      providerMessageId: true,
      errorMessage: true,
      sentAt: true,
      createdAt: true,
    },
  }) as Promise<EmailDispatchDto[]>;
}
```

- [ ] **Step 5: Run all service tests**
```bash
pnpm test -- --testPathPattern="admin.service.spec" --no-coverage 2>&1 | tail -10
```
Expected: ALL tests PASS.

- [ ] **Step 6: Commit**
```bash
git add src/modules/admin/admin.service.ts src/modules/admin/admin.service.spec.ts
git commit -m "feat(admin): add getWaitlistEntryDispatches with TDD"
```

---

## Task 4: Backend Controller — Wire New Endpoints

**Files:**
- Modify: `backend/src/modules/admin/admin.controller.ts`

- [ ] **Step 1: Add DTOs to imports** at top of `admin.controller.ts`:
```typescript
import {
  // existing ...
  BulkSendAccessDto,
  BulkSendResultDto,
  EmailDispatchDto,
} from './admin.dto';
```

- [ ] **Step 2: Add two endpoints** after the `updateWaitlistEntry` endpoint:

```typescript
@Post('waitlist/bulk-send-access')
@UseGuards(AdminAuthGuard)
@Roles('SUPER_ADMIN', 'CAMPAIGN_ADMIN')
@ApiBearerAuth()
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Bulk send access emails to selected waitlist entries' })
async bulkSendAccess(
  @Body() dto: BulkSendAccessDto,
  @Request() req: any,
): Promise<BulkSendResultDto> {
  return this.adminService.bulkSendAccess(dto.entryIds, req.admin.id);
}

@Get('waitlist/entries/:id/dispatches')
@UseGuards(AdminAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Get email dispatch history for a waitlist entry' })
async getWaitlistEntryDispatches(
  @Param('id') id: string,
): Promise<EmailDispatchDto[]> {
  return this.adminService.getWaitlistEntryDispatches(id);
}
```

- [ ] **Step 3: Verify build**
```bash
pnpm build 2>&1 | tail -10
```
Expected: `Successfully compiled`.

- [ ] **Step 4: Smoke-test**
```bash
TOKEN=$(curl -s -X POST http://localhost:6756/api/admin-auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tunhatphuong2002.work@gmail.com","password":"Phuong123456@"}' \
  | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).data.accessToken))")
curl -s "http://localhost:6756/api/admin/waitlist/entries/test-id/dispatches" \
  -H "Authorization: Bearer $TOKEN"
```
Expected: `[]` (not a 404 route-not-found error).

- [ ] **Step 5: Commit**
```bash
git add src/modules/admin/admin.controller.ts
git commit -m "feat(admin): wire bulk-send-access and dispatch-history controller endpoints"
```

---

## Task 5: Frontend Proxy Routes

**Files:**
- Create: `src/app/api/admin/waitlist/entries/[id]/dispatches/route.ts`
- Create: `src/app/api/admin/waitlist/bulk-send-access/route.ts`

- [ ] **Step 1: Create dispatches route** at `src/app/api/admin/waitlist/entries/[id]/dispatches/route.ts`:

```typescript
import { type NextRequest, NextResponse } from "next/server";
import { getServerBackendBaseUrl } from "@/lib/runtime-urls";

const BACKEND_URL = getServerBackendBaseUrl();

function getAdminToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  return auth?.startsWith("Bearer ") ? auth.slice(7) : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getAdminToken(request);
  if (!token) return NextResponse.json({ message: "No admin token" }, { status: 401 });

  const { id } = await params;
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/admin/waitlist/entries/${id}/dispatches`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "Service unavailable" }, { status: 503 });
  }
}
```

- [ ] **Step 2: Create bulk-send-access route** at `src/app/api/admin/waitlist/bulk-send-access/route.ts`:

```typescript
import { type NextRequest, NextResponse } from "next/server";
import { getServerBackendBaseUrl } from "@/lib/runtime-urls";

const BACKEND_URL = getServerBackendBaseUrl();

function getAdminToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  return auth?.startsWith("Bearer ") ? auth.slice(7) : null;
}

export async function POST(request: NextRequest) {
  const token = getAdminToken(request);
  if (!token) return NextResponse.json({ message: "No admin token" }, { status: 401 });

  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/api/admin/waitlist/bulk-send-access`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "Service unavailable" }, { status: 503 });
  }
}
```

- [ ] **Step 3: Type-check**
```bash
cd /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/tasmil-finance
pnpm type-check 2>&1 | grep -E "^.*error" | head -10
```
Expected: no new errors.

- [ ] **Step 4: Commit**
```bash
git add src/app/api/admin/waitlist/entries/[id]/dispatches/route.ts \
        src/app/api/admin/waitlist/bulk-send-access/route.ts
git commit -m "feat(admin): proxy routes for dispatch history and bulk-send-access"
```

---

## Task 6: Frontend Types & Hooks

**Files:**
- Modify: `src/features/admin/types.ts`
- Modify: `src/features/admin/hooks/use-admin-waitlist.ts`

- [ ] **Step 1: Append to `src/features/admin/types.ts`**:

```typescript
export interface EmailDispatch {
  id: string;
  templateType: string;
  status: string;
  providerMessageId: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface BulkSendResult {
  sent: number;
  failed: number;
  errors: { id: string; reason: string }[];
}
```

- [ ] **Step 2: Update import line** in `use-admin-waitlist.ts` (line 7):
```typescript
import type { WaitlistEntriesResponse, WaitlistStatus, EmailDispatch, BulkSendResult } from "../types";
```

- [ ] **Step 3: Append new hooks** to `use-admin-waitlist.ts` after `useUpdateWaitlistEntry`:

```typescript
export function useWaitlistDispatches(entryId: string | null) {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery<EmailDispatch[]>({
    queryKey: ["admin-waitlist-dispatches", entryId],
    queryFn: () =>
      adminFetch<EmailDispatch[]>(`/api/admin/waitlist/entries/${entryId}/dispatches`),
    enabled: !!token && !!entryId,
  });
}

export function useBulkSendAccess() {
  const queryClient = useQueryClient();
  return useMutation<BulkSendResult, Error, { entryIds: string[] }>({
    mutationFn: ({ entryIds }) =>
      adminFetch<BulkSendResult>("/api/admin/waitlist/bulk-send-access", {
        method: "POST",
        body: { entryIds },
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-waitlist"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success(`Sent ${result.sent} access emails`, {
        description: result.failed > 0 ? `${result.failed} failed` : undefined,
      });
    },
    onError: (error) => {
      toast.error("Bulk send failed", { description: error.message });
    },
  });
}

export function useSendAccessToEntry() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, { entryId: string; email: string }>({
    mutationFn: async ({ entryId, email }) => {
      const codeRes = await adminFetch<{ id: string; code: string }>(
        "/api/admin/access-codes/individual",
        { method: "POST", body: { waitlistEntryId: entryId } }
      );
      return adminFetch("/api/admin/access-codes/send-email", {
        method: "POST",
        body: { email, code: codeRes.code },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-waitlist"] });
      toast.success("Access email sent");
    },
    onError: (error) => {
      toast.error("Failed to send access email", { description: error.message });
    },
  });
}
```

- [ ] **Step 4: Type-check**
```bash
pnpm type-check 2>&1 | grep -E "^.*error" | head -10
```

- [ ] **Step 5: Commit**
```bash
git add src/features/admin/types.ts src/features/admin/hooks/use-admin-waitlist.ts
git commit -m "feat(admin): add EmailDispatch type and waitlist action hooks"
```

---

## Task 7: Waitlist Page — Full Enhancement

**Files:**
- Modify: `src/app/admin/(app)/waitlist/page.tsx`

- [ ] **Step 1: Replace entire file** with:

```tsx
"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Loader2,
  Mail,
  Send,
} from "lucide-react";
import { useEffect, useState } from "react";
import { StatusPill } from "@/features/admin/components/status-pill";
import {
  useBulkSendAccess,
  useSendAccessToEntry,
  useUpdateWaitlistEntry,
  useWaitlistDispatches,
  useWaitlistEntries,
} from "@/features/admin/hooks/use-admin-waitlist";
import {
  WAITLIST_STATUSES,
  type EmailDispatch,
  type WaitlistStatus,
} from "@/features/admin/types";
import { useAdminDashboard } from "@/features/admin-whitelist/hooks/use-admin-dashboard";

const LIMIT = 20;

interface Entry {
  id: string;
  walletAddress: string | null;
  email: string | null;
  status: string;
  successfulReferralCount: number;
  createdAt: string;
}

function StatusCards() {
  const { data } = useAdminDashboard();
  const cards = [
    { label: "Total", value: data?.waitlist?.allTime ?? "—" },
    { label: "Access Sent", value: data?.emailDispatches?.accessSent ?? "—" },
    { label: "Email Confirmed", value: data?.emailDispatches?.confirmationSent ?? "—" },
    { label: "Wallets", value: data?.walletStats?.totalWalletEntries ?? "—" },
    { label: "Referrals", value: data?.walletStats?.totalSuccessfulReferrals ?? "—" },
  ];
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {cards.map((c) => (
        <div
          key={c.label}
          style={{
            flex: "1 1 100px",
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <div style={{ fontSize: 11, color: "rgba(245,248,252,0.4)", marginBottom: 4 }}>
            {c.label}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

function DispatchHistory({ entryId, email }: { entryId: string; email: string | null }) {
  const { data: dispatches, isLoading } = useWaitlistDispatches(entryId);

  if (isLoading) {
    return (
      <tr>
        <td colSpan={7} style={{ padding: "12px 20px" }}>
          <Loader2 size={14} className="animate-spin" />
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td
        colSpan={7}
        style={{
          padding: "12px 20px",
          background: "rgba(255,255,255,0.02)",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 8,
            color: "rgba(245,248,252,0.6)",
          }}
        >
          Email history{email ? ` · ${email}` : ""}
        </div>
        {!dispatches || dispatches.length === 0 ? (
          <div style={{ color: "rgba(245,248,252,0.3)", fontSize: 12 }}>No emails sent yet</div>
        ) : (
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "rgba(245,248,252,0.4)" }}>
                <th style={{ textAlign: "left", padding: "4px 8px" }}>Type</th>
                <th style={{ textAlign: "left", padding: "4px 8px" }}>Status</th>
                <th style={{ textAlign: "left", padding: "4px 8px" }}>Sent At</th>
                <th style={{ textAlign: "left", padding: "4px 8px" }}>Error</th>
              </tr>
            </thead>
            <tbody>
              {dispatches.map((d: EmailDispatch) => (
                <tr key={d.id}>
                  <td style={{ padding: "4px 8px", fontFamily: "monospace" }}>
                    {d.templateType}
                  </td>
                  <td
                    style={{
                      padding: "4px 8px",
                      color:
                        d.status === "SENT"
                          ? "#34D399"
                          : d.status === "FAILED"
                            ? "#FB7185"
                            : "rgba(245,248,252,0.6)",
                    }}
                  >
                    {d.status}
                  </td>
                  <td style={{ padding: "4px 8px", color: "rgba(245,248,252,0.5)" }}>
                    {d.sentAt ? new Date(d.sentAt).toLocaleString() : "—"}
                  </td>
                  <td style={{ padding: "4px 8px", color: "#FB7185" }}>
                    {d.errorMessage ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </td>
    </tr>
  );
}

export default function WaitlistPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError, error, refetch } = useWaitlistEntries({
    page,
    limit: LIMIT,
    status: statusFilter || undefined,
    search: search || undefined,
  });
  const update = useUpdateWaitlistEntry();
  const sendAccess = useSendAccessToEntry();
  const bulkSend = useBulkSendAccess();

  const items = (data?.items ?? []) as Entry[];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((e) => e.id)));
  }

  async function handleBulkSend() {
    setBulkConfirm(false);
    await bulkSend.mutateAsync({ entryIds: Array.from(selected) });
    setSelected(new Set());
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Waitlist</h1>

      <StatusCards />

      {selected.size > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            borderRadius: 10,
            background: "rgba(0,191,255,0.08)",
            border: "1px solid rgba(0,191,255,0.2)",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600 }}>{selected.size} selected</span>
          <button
            type="button"
            onClick={() => setBulkConfirm(true)}
            disabled={bulkSend.isPending}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 8,
              background: "rgba(0,191,255,0.15)",
              border: "1px solid rgba(0,191,255,0.3)",
              color: "#00BFFF",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            <Mail size={14} />
            Send Access Email
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(245,248,252,0.5)",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Clear
          </button>
        </div>
      )}

      {bulkConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "#131720",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14,
              padding: 28,
              width: 360,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Confirm Bulk Send</h3>
            <p style={{ fontSize: 13, color: "rgba(245,248,252,0.6)", marginBottom: 20 }}>
              Send access emails to {selected.size} selected entries?
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setBulkConfirm(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "transparent",
                  color: "rgba(245,248,252,0.7)",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkSend}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "linear-gradient(135deg, #00BFFF, #0080FF)",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Send {selected.size} Emails
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          placeholder="Search wallet or email…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{
            flex: 1,
            minWidth: 220,
            padding: "9px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            color: "#F5F8FC",
          }}
        />
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: "9px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            color: "#F5F8FC",
          }}
        >
          <option value="">All statuses</option>
          {WAITLIST_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Loader2 className="animate-spin" />
        </div>
      ) : isError ? (
        <div style={{ color: "#FB7185" }}>
          Failed to load: {error?.message}{" "}
          <button type="button" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div style={{ color: "rgba(245,248,252,0.4)", padding: 40, textAlign: "center" }}>
          No entries found
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "rgba(245,248,252,0.4)" }}>
              <th style={{ padding: "8px 10px", width: 32 }}>
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={selected.size === items.length && items.length > 0}
                  onChange={toggleAll}
                />
              </th>
              <th style={{ padding: "8px 10px" }}>Wallet</th>
              <th style={{ padding: "8px 10px" }}>Email</th>
              <th style={{ padding: "8px 10px" }}>Status</th>
              <th style={{ padding: "8px 10px" }}>Referrals</th>
              <th style={{ padding: "8px 10px" }}>Joined</th>
              <th style={{ padding: "8px 10px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <>
                <tr key={e.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <td style={{ padding: "10px" }}>
                    <input
                      type="checkbox"
                      aria-label={`Select ${e.id}`}
                      checked={selected.has(e.id)}
                      onChange={() => toggleSelect(e.id)}
                    />
                  </td>
                  <td style={{ padding: "10px", fontFamily: "monospace" }}>
                    {e.walletAddress
                      ? `${e.walletAddress.slice(0, 6)}…${e.walletAddress.slice(-4)}`
                      : "—"}
                  </td>
                  <td style={{ padding: "10px" }}>{e.email ?? "—"}</td>
                  <td style={{ padding: "10px" }}>
                    <StatusPill status={e.status} />
                  </td>
                  <td style={{ padding: "10px" }}>{e.successfulReferralCount}</td>
                  <td style={{ padding: "10px" }}>
                    {new Date(e.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "10px" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <select
                        aria-label={`Status for ${e.id}`}
                        value={e.status}
                        disabled={update.isPending}
                        onChange={(ev) =>
                          update.mutate({ id: e.id, status: ev.target.value as WaitlistStatus })
                        }
                        style={{
                          padding: "5px 8px",
                          borderRadius: 8,
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.04)",
                          color: "#F5F8FC",
                          fontSize: 12,
                        }}
                      >
                        {WAITLIST_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {e.email && (e.status === "PENDING" || e.status === "CONFIRMED") && (
                        <button
                          type="button"
                          title="Send Access Email"
                          disabled={sendAccess.isPending}
                          onClick={() => sendAccess.mutate({ entryId: e.id, email: e.email! })}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "5px 8px",
                            borderRadius: 8,
                            border: "1px solid rgba(0,191,255,0.3)",
                            background: "rgba(0,191,255,0.08)",
                            color: "#00BFFF",
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          <Send size={12} /> Send
                        </button>
                      )}
                      <button
                        type="button"
                        title="Email history"
                        onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "5px 8px",
                          borderRadius: 8,
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.04)",
                          color: "rgba(245,248,252,0.6)",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        {expandedId === e.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedId === e.id && (
                  <DispatchHistory key={`dispatch-${e.id}`} entryId={e.id} email={e.email} />
                )}
              </>
            ))}
          </tbody>
        </table>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 12, color: "rgba(245,248,252,0.4)" }}>
          Page {page} / {totalPages} · {total} total
        </span>
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          <ChevronLeft size={16} />
        </button>
        <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**
```bash
pnpm type-check 2>&1 | grep -E "^.*error" | head -20
```

- [ ] **Step 3: Commit**
```bash
git add src/app/admin/(app)/waitlist/page.tsx
git commit -m "feat(admin): waitlist page with status cards, bulk send, per-row send, dispatch history"
```

---

## Task 8: Campaigns Page Enhancements

**Files:**
- Modify: `src/app/admin/(app)/campaigns/page.tsx`

- [ ] **Step 1: Add `X` to lucide imports** (line 3):
```typescript
import { Loader2, Send, X } from "lucide-react";
```

- [ ] **Step 2: Add drawer state** inside `AdminCampaignsPage` after the `activeCampaign` line:
```tsx
const [drawerCampaign, setDrawerCampaign] = useState<CampaignRun | null>(null);
```

- [ ] **Step 3: Add `CampaignDetailDrawer` component** before `AdminCampaignsPage`:

```tsx
function CampaignDetailDrawer({
  campaign,
  onClose,
}: {
  campaign: CampaignRun;
  onClose: () => void;
}) {
  const { data: live } = useCampaignStatus(campaign.id);
  const c = live ?? campaign;
  const progress =
    c.targetedCount > 0 ? Math.round((c.sentCount / c.targetedCount) * 100) : 0;

  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        bottom: 0,
        width: 360,
        background: "#131720",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
        padding: 24,
        zIndex: 50,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>{c.name}</h2>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "rgba(245,248,252,0.6)",
            cursor: "pointer",
          }}
        >
          <X size={18} />
        </button>
      </div>
      <div style={{ marginBottom: 16 }}>
        <StatusBadge status={c.status} />
      </div>
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 20,
          fontSize: 12,
          color: "rgba(245,248,252,0.5)",
        }}
      >
        {c.startedAt && <span>Started: {new Date(c.startedAt).toLocaleDateString()}</span>}
        {c.completedAt && (
          <span>Completed: {new Date(c.completedAt).toLocaleDateString()}</span>
        )}
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}
      >
        {[
          { label: "Targeted", value: c.targetedCount, color: "#F5F8FC" },
          { label: "Sent", value: c.sentCount, color: "#34D399" },
          { label: "Failed", value: c.failedCount, color: "#FB7185" },
          { label: "Skipped", value: c.skippedCount, color: "rgba(245,248,252,0.4)" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: 12,
              borderRadius: 8,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ fontSize: 10, color: "rgba(245,248,252,0.4)", marginBottom: 4 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 8, fontSize: 12, color: "rgba(245,248,252,0.4)" }}>
        Progress: {progress}%
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 4,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            borderRadius: 4,
            background: "linear-gradient(90deg, #00BFFF, #0080FF)",
            transition: "width 0.3s",
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Replace `NewCampaignForm`** with target filter version:

```tsx
function NewCampaignForm() {
  const [name, setName] = useState("");
  const [sendMode, setSendMode] = useState<"all" | "emails">("all");
  const [emailList, setEmailList] = useState("");
  const sendCampaign = useSendCampaign();

  async function handleSend() {
    if (!name.trim()) return;
    const payload: { name: string; targetEmails?: string } = { name };
    if (sendMode === "emails" && emailList.trim()) {
      payload.targetEmails = emailList
        .split("\n")
        .map((e) => e.trim())
        .filter(Boolean)
        .join(",");
    }
    await sendCampaign.mutateAsync(payload);
    setName("");
    setEmailList("");
  }

  return (
    <div className="space-y-3">
      <div>
        <Typography variant="h3" className="font-semibold text-sm">
          New Campaign
        </Typography>
        <p className="mt-0.5 text-muted-foreground text-xs">Send access codes via email</p>
      </div>
      <Input placeholder="Campaign name" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">Send to:</p>
        {(["all", "emails"] as const).map((mode) => (
          <label key={mode} className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              name="sendMode"
              value={mode}
              checked={sendMode === mode}
              onChange={() => setSendMode(mode)}
            />
            {mode === "all" ? "All CONFIRMED entries" : "Paste emails manually"}
          </label>
        ))}
      </div>
      {sendMode === "emails" && (
        <textarea
          placeholder={"email1@example.com\nemail2@example.com"}
          value={emailList}
          onChange={(e) => setEmailList(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none resize-none"
        />
      )}
      <Button
        variant="gradient"
        onClick={handleSend}
        disabled={sendCampaign.isPending || !name.trim()}
        className="w-full"
      >
        {sendCampaign.isPending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Send Campaign
          </span>
        )}
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: Update table rows to be clickable** — in the `<tr>` inside `campaigns?.map`:
```tsx
<tr
  key={c.id}
  className="hover:bg-muted/30 cursor-pointer"
  onClick={() => setDrawerCampaign(c)}
>
```

- [ ] **Step 6: Add drawer + update title** — at bottom of `AdminCampaignsPage` return, before final closing `</div>`:
```tsx
{drawerCampaign && (
  <CampaignDetailDrawer
    campaign={drawerCampaign}
    onClose={() => setDrawerCampaign(null)}
  />
)}
```
Change title text from `"Campaigns"` to `"Email Campaigns"` in both left and right panel headings.

- [ ] **Step 7: Type-check**
```bash
pnpm type-check 2>&1 | grep -E "^.*error" | head -20
```

- [ ] **Step 8: Commit**
```bash
git add src/app/admin/(app)/campaigns/page.tsx
git commit -m "feat(admin): campaigns page — rename, target filter, detail drawer"
```

---

## Task 9: Sidebar Update

**Files:**
- Modify: `src/shared/layout/sidebar-data.ts`

- [ ] **Step 1: Ensure `Wallet` is in lucide imports** (line 1):
```typescript
import {
  ArrowLeftRight,
  Bot,
  Home,
  KeyRound,
  ListChecks,
  Mail,
  Tractor,
  Trophy,
  Wallet,
} from "lucide-react";
```

- [ ] **Step 2: Replace `adminSidebarData.navGroups`** (lines 137–154 of sidebar-data.ts):
```typescript
navGroups: [
  {
    title: "Overview",
    items: [{ title: "Dashboard", url: "/admin/dashboard", icon: Home }],
  },
  {
    title: "Waitlist",
    items: [
      { title: "Waitlist", url: "/admin/waitlist", icon: ListChecks },
      { title: "Access Codes", url: "/admin/codes", icon: KeyRound },
      { title: "Email Campaigns", url: "/admin/campaigns", icon: Mail },
    ],
  },
  {
    title: "Quest Management",
    items: [
      { title: "Quest Campaigns", url: "/admin/quest-campaigns", icon: Trophy },
      { title: "Quest Wallets", url: "/admin/quests", icon: Wallet },
    ],
  },
  {
    title: "Analytics",
    items: [
      { title: "Analytics", url: "/admin/analytics", icon: ArrowLeftRight },
    ],
  },
],
```

- [ ] **Step 3: Type-check + lint**
```bash
pnpm type-check 2>&1 | grep -E "^.*error" | head -10
pnpm lint 2>&1 | grep -E "error" | head -10
```

- [ ] **Step 4: Commit**
```bash
git add src/shared/layout/sidebar-data.ts
git commit -m "feat(admin): sidebar — rename Campaigns to Email Campaigns, add Quest Management + Analytics"
```

---

## Task 10: Final Verification + Push to Staging

- [ ] **Step 1: Run all backend tests**
```bash
cd /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/backend
pnpm test -- --no-coverage 2>&1 | tail -15
```
Expected: all tests PASS.

- [ ] **Step 2: Frontend type-check + lint**
```bash
cd /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/tasmil-finance
pnpm type-check 2>&1 | tail -5
pnpm lint 2>&1 | tail -5
```
Expected: no errors.

- [ ] **Step 3: Start dev server, verify admin pages load**
```bash
pnpm dev > /tmp/dev.log 2>&1 &
sleep 10
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin/login
```
Expected: `200`.

- [ ] **Step 4: Playwright UI test loop** — run browser tests against admin pages:
```bash
pnpm test:e2e -- --grep "admin" --reporter=line 2>&1 | tail -30
```
Fix any failures before proceeding.

- [ ] **Step 5: Push backend to staging branch**
```bash
cd /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/backend
git log --oneline -5
git push origin deploy/staging
```

- [ ] **Step 6: Push frontend to staging branch**
```bash
cd /Users/admin/Documents/MorcaLabs/tasmil/tasmil-org/tasmil-finance
git log --oneline -8
git push origin deploy/staging
```
