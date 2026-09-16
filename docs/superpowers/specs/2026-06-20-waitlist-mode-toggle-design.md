# Waitlist Mode Toggle - Design

Date: 2026-06-20
Branch: `feat/merge-landing-quest` (frontend repo `tasmil-finance`)
Status: Approved (design)

## Problem

The app should run in two modes, switched by a single env flag:

- **Waitlist ON** (current behaviour): `/waitlist` and `/access` exist, an access
  code is required to enter the app, and unauthenticated visitors are gated back
  to `/`.
- **Waitlist OFF**: no `/waitlist`, no `/access`, no access code. Users go
  straight to the app routes (`/chat`, `/farming`, ...) and connect a wallet
  in-app.

Today `WAITLIST_MODE=true` exists in `.env.local` but nothing in `src` reads it -
the toggle is not wired up. It is also server-only (`WAITLIST_MODE`), while the
gating needs to run on both the server (proxy) and the client (auth bootstrap,
landing CTAs).

Two pre-existing bugs are exposed when not authenticated and should be fixed as
part of this work (they live in the same gate/auth-bootstrap code):

- `/waitlist` (a public route) is redirected to `/` by `AuthBootstrap` on a 401,
  because it treats every non-`/`, non-`/admin` path as protected.
- Public static assets (`/protocols/*`, `/partners/*`, `/tokens/*`, `/tasmil-*`)
  are 307-redirected to `/` by the proxy gate because they are not whitelisted.

## Goal

One flag, `NEXT_PUBLIC_WAITLIST_MODE` (true/false), controls everything:

- ON → `/waitlist` + `/access` live, access code required, gate redirects
  unauthenticated users to `/`.
- OFF → `/waitlist` + `/access` redirect to the app entry, no access code, app
  routes open, wallet connect happens in-app.

## Approach (chosen: A)

A single `NEXT_PUBLIC_WAITLIST_MODE` flag, read server-side (proxy) and
client-side (auth bootstrap, CTAs), with shared helper + public-path list so the
two layers never disagree.

## Components

### `src/lib/waitlist-mode.ts` (new - single source of truth)
- `WAITLIST_MODE = process.env.NEXT_PUBLIC_WAITLIST_MODE === "true"`
- `PUBLIC_PATHS` - the canonical public-route list (shared by proxy + auth-bootstrap)
- `APP_ENTRY = "/chat"`
- `isPublicPath(pathname): boolean`
- `isStaticAsset(pathname): boolean` - paths under public asset folders / with a
  file extension, so the gate never touches them

### `src/proxy.ts`
- Always let static assets and `/api`, `/_next`, `/admin`, `/`, `/quest` through.
- ON: keep the current gate - require the `tasmil_auth` cookie for protected
  routes; redirect to `/` when missing. `/waitlist` + `/access` are public.
- OFF: redirect `/waitlist` and `/access` → `APP_ENTRY` (`/chat`); do NOT gate
  the app routes (open; connect in-app).

### `src/shared/context/auth-bootstrap.tsx`
- Replace the ad-hoc `onProtectedPage` check with `!isPublicPath(path)` so public
  routes (e.g. `/waitlist`) are never redirected on 401 (bug fix).
- OFF: never redirect on 401 (routes are open).

### Landing CTAs (`src/features/landing/components/Nav.tsx`, `Hero.tsx`)
- ON: "Join Waitlist" → `/waitlist`, "Have a code?" → `/access` (current).
- OFF: a single "Launch App" → `/chat`; hide the waitlist/access buttons.

## Data flow

Build/runtime reads `NEXT_PUBLIC_WAITLIST_MODE`. The proxy gates server-side; the
client reads the same flag for CTAs and the auth-bootstrap redirect decision.
Because `NEXT_PUBLIC_*` is inlined at build, flipping the flag requires a dev
server restart / redeploy.

## Edge cases & error handling

- `/admin`, `/api`, `/quest` keep their own auth and are unaffected by the flag.
- App routes when OFF still show the existing "connect wallet" screens when no
  wallet is connected (e.g. chat-page-wrapper) - viewing is open, actions need a
  wallet.
- Static assets pass the gate in both modes (fixes the 307→`/` bug).
- Flipping the flag without a restart leaves stale inlined values - documented.

## Verification (Playwright, both modes)

- ON: `/waitlist` loads (no longer bounced to `/`); `/chat` while unauthenticated
  redirects to `/`; landing assets (logos/partners) load (no 307).
- OFF: `/waitlist` and `/access` redirect to `/chat`; `/chat` loads directly
  while unauthenticated (in-app connect); no access-code step anywhere.

## Out of scope

- Backend `WAITLIST_MODE` behaviour (separate service; unchanged).
- The cross-domain prod redirect in `access.tsx` (`app.tasmil-finance.xyz`).
- Multi-tab or runtime (non-rebuild) flag flipping.
