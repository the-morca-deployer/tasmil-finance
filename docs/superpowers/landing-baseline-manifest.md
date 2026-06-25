# Landing Page Visual Baseline — MANIFEST

Captured: 2026-06-25T09:03:19.508Z
Base URL: http://localhost:3000
Branch: feat/landing-tailwind-shadcn-migration

## Shot List

| name | route | viewport | state steps |
|---|---|---|---|
| `home-1440` | `/` | 1440x900 | Navigate to route, no interaction |
| `home-768` | `/` | 768x900 | Navigate to route, no interaction |
| `home-390` | `/` | 390x900 | Navigate to route, no interaction |
| `home-1440-scrolled` | `/` | 1440x900 | window.scrollTo(0, 600) — nav enters scrolled state |
| `home-390-sidebar` | `/` | 390x900 | Clicked .nav-burger — sidebar opened |
| `home-1440-faq-open` | `/` | 1440x900 | Scrolled to FAQ section; clicked first FAQ question — expanded |
| `home-1440-cta-hover` | `/` | 1440x900 | Scrolled to CTA section; hovered primary CTA button |
| `home-1440-features` | `/` | 1440x900 | Scrolled to Features section; waited 2s for demos to settle |
| `waitlist-1440` | `/waitlist` | 1440x900 | Navigate to route, no interaction |
| `waitlist-390` | `/waitlist` | 390x900 | Navigate to route, no interaction |
| `access-1440` | `/access` | 1440x900 | Navigate to route, no interaction |
| `access-390` | `/access` | 390x900 | Navigate to route, no interaction |

## Concerns

None — all states driven successfully.

## Files

All PNGs saved to scratchpad (not committed).
Manifest committed to repo at `docs/superpowers/landing-baseline-manifest.md`.
