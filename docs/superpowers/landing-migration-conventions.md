# Landing → Tailwind + shadcn Migration — Conversion Conventions Playbook

**Created:** 2026-06-25
**Branch:** `feat/landing-tailwind-shadcn-migration`
**Scope:** All Phases 1–14 PRs under `src/app/(landing-page)/` + `src/features/landing/`

Every section PR (Phases 1–14) follows the rules in this document. Later plans reference this
file by path (`docs/superpowers/landing-migration-conventions.md`) instead of repeating the
rules inline.

---

## 1. Primitive Mapping Table

Use the shadcn component as the structural/behavioral primitive. Pass Tailwind utilities via
`className` to preserve the exact legacy look. Use a variant's default look only where it
already matches the original.

| Landing CSS element | Shadcn primitive | Usage notes |
|---|---|---|
| `.btn.btn-primary` (hero CTA, section CTAs) | `<Button asChild variant="gradient">` | Wrap `<Link>` or `<a>` as the child; add `size="lg"` for large CTA buttons. `.brand-gradient-interactive` is already applied by the variant — do not add it again in `className`. Override `className` only when padding / border-radius / font-size diverges from the default `h-10 px-4 py-2 text-sm`. |
| `.btn.btn-ghost` | `<Button asChild variant="ghost">` or `variant="outline"` | Use `ghost` when the button sits on a dark/semi-transparent surface; `outline` when a visible border is intentional. Override `className` for any extra padding or colour tweaks. |
| `.hero-pill`, `.eyebrow`, `.overline` | `<Badge variant="outline">` | The base class already applies `rounded-full border px-2.5 py-0.5 text-xs font-semibold`. Override `className` for letter-spacing, colour, or size when the original differs. Fall back to a plain `<span>` + utility classes only when the markup structure is too different from a `<div>` wrapper. |
| Card / panel (`.sec-card`, `.fa-card`, `.feature-card`, `.info-panel`, etc.) | `<Card>` from `@/shared/ui/card` | Use `Card`, `CardHeader`, `CardContent`, `CardFooter` when the DOM structure maps cleanly. Fall back to `<div>` + utility classes (`bg-card border border-border rounded-xl p-6`) when Card's default slot structure would require excessive override work. |
| FAQ accordion / collapsible sections | `Collapsible` from `@/shared/ui/collapsible` | `CollapsibleTrigger` drives open/close; look is overridden via `className`. Pair with `data-[state=open]:` Tailwind variants (see §4). |
| Layout wrappers (`.wrap`, `.container`, `.section`) | `<div>` + Tailwind layout utilities | `max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8` or token equivalents. Never introduce a wrapper component just for layout. |
| Spacing, margin, gap | Tailwind spacing scale | Prefer `gap-4`, `mt-8`, `py-16`, etc. Use arbitrary `[…]` only when the original pixel value has no Tailwind equivalent (see §3). |
| Colour fills and text | Tailwind token utilities (see §3) | `text-primary`, `bg-card`, `text-muted-foreground`, etc. |
| Typography (`.mono`, `.heading`, `.label-sm`) | Tailwind type utilities | `font-mono`, `font-bold`, `text-sm/6`, `tracking-widest`. Import `@/shared/ui/typography` helpers when they exist. |

Import all primitives via the shared barrel:

```ts
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Card, CardHeader, CardContent } from "@/shared/ui/card";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/shared/ui/collapsible";
import { cn } from "@/lib/utils";
```

---

## 2. Override Rule

> **Use the shadcn component as the structural/behavioral primitive; pass Tailwind utilities via
> `className` to preserve the exact legacy look. Use a variant's default look only where it
> already matches.**

Concretely:

1. **Start with the primitive and its closest variant** — e.g. `<Button variant="gradient">`.
2. **Diff visually** against the landing baseline screenshot for this element.
3. **Pass only the differing utilities via `className`** using `cn()`:

   ```tsx
   // Original .btn-primary had extra top padding and a larger font
   <Button
     asChild
     variant="gradient"
     size="lg"
     className={cn("px-10 py-5 text-base")}
   >
     <Link href="/waitlist">Get Early Access</Link>
   </Button>
   ```

4. **Never fight the variant** — do not re-declare properties the variant already sets
   (`background-image`, `color`, `transition`). Only add what is genuinely different.
5. **Never remove the shadcn base class** to style from scratch. If the primitive truly
   cannot support the required look, use a plain `<div>` or `<span>` with utilities instead.
6. **Do not use `@apply`** to bridge old class names. That approach was explicitly rejected
   in the design spec (§3.4).

---

## 3. Token-First Rule

> **Prefer token utilities over hardcoded values. Use `[…]` only when no token expresses the
> original.**

Priority order when choosing a CSS value:

| Priority | Form | Example |
|---|---|---|
| 1 (best) | Tailwind token utility | `text-primary`, `bg-card`, `border-border`, `text-muted-foreground`, `bg-background`, `text-foreground`, `text-secondary-foreground`, `ring-ring` |
| 2 | Tailwind scale utility | `text-sm`, `px-4`, `rounded-md`, `shadow-lg` |
| 3 (last resort) | Arbitrary value | `text-[13px]`, `bg-[#0ea5e9]`, `mt-[72px]` |

**Token reference** (all defined in `src/app/globals.css` under `@theme`):

| Token | Use for |
|---|---|
| `text-primary` / `bg-primary` | Brand primary colour |
| `bg-card` / `text-card-foreground` | Card surfaces |
| `bg-background` / `text-foreground` | Page background and default text |
| `border-border` | Default border colour |
| `text-muted-foreground` | Secondary / subdued text |
| `bg-accent` / `text-accent-foreground` | Hover accent surfaces |
| `text-destructive` | Error / destructive states |
| `bg-secondary` / `text-secondary-foreground` | Secondary surfaces |

Brand gradient surfaces use the `.brand-gradient-interactive` utility class (defined in
`globals.css`), exposed through `variant="gradient"` / `variant="brand"` on `Button`. Do not
copy the `background-image` value inline; use the variant.

---

## 4. State → `data-*` Convention

> **`useLandingScripts.ts` sets `el.dataset.<key>` instead of toggling legacy state classes.
> Markup reads state via Tailwind `data-[…]:` variants.**

This replaces every pattern of the form `el.classList.toggle("scrolled")` → CSS `.nav.scrolled { … }`.

### How to convert a state-driven CSS rule

**Before (legacy):**

```ts
// useLandingScripts.ts
nav.classList.add("scrolled");
```

```css
/* landing.css */
.nav.scrolled { background: rgba(0,0,0,0.8); }
```

**After (new convention):**

```ts
// useLandingScripts.ts
nav.dataset.scrolled = "true";
// clear: delete nav.dataset.scrolled  (or set to "false")
```

```tsx
// Nav component
<nav
  ref={navRef}
  className="... data-[scrolled=true]:bg-black/80"
/>
```

### Concrete attribute/variant pairs

| Legacy class toggle | New `dataset` assignment | Tailwind data-variant on element |
|---|---|---|
| `nav.classList.add("scrolled")` | `nav.dataset.scrolled = "true"` | `data-[scrolled=true]:bg-black/80 data-[scrolled=true]:shadow-md` |
| `sidebar.classList.add("open")` | `sidebar.dataset.state = "open"` | `data-[state=open]:translate-x-0 data-[state=open]:opacity-100` |
| `el.classList.add("in")` (reveal on scroll) | `el.dataset.inview = "true"` | `group-data-[inview=true]:opacity-100 group-data-[inview=true]:translate-y-0` |
| `faq.classList.toggle("active")` | `faq.dataset.state = "open"` (or use Collapsible) | `data-[state=open]:rotate-180` (icon), `data-[state=open]:block` (content) |
| `body.classList.add("sidebar-open")` | `body.dataset.sidebarOpen = "true"` | `data-[sidebar-open=true]:overflow-hidden` (on `<body>` or backdrop) |

### Rules for `data-*` usage

- **Always use string `"true"` / `"false"` or named states** (`"open"` / `"closed"`) — never
  rely on attribute presence/absence alone, as Tailwind data-variants require an explicit value.
- **For group-descendant rules:** add `group` class to the ancestor element that holds the
  `data-*` attribute; descendants use `group-data-[key=value]:` utilities.
- **Delete (not set to `"false"`) only when** the CSS variant exclusively checks for the
  presence of a truthy value. Prefer explicit `"false"` for boolean states so the DOM is
  always queryable.
- **Stable `id` / `data-*` selectors for JS:** `useLandingScripts.ts` must continue to
  locate elements by stable `id` attributes or semantic `data-landing-*` selectors (not
  generated class names). Keep any existing `id` attributes intact.

---

## 5. Animation Rule

> **Keyframes live in `globals.css`. Expose as `--animate-<name>` tokens. Complex repeated
> effects → `@utility`. Simple pseudo-elements → `before:`/`after:` variants inline.**

### Where each animation type lives

| Animation type | Where to define | How to use |
|---|---|---|
| Named keyframe (reused across elements) | `@keyframes` block in `globals.css` (top-level or inside an `@layer`) | Expose via `@theme inline { --animate-<name>: <name> <dur> <easing> … }` → use class `animate-<name>` |
| Complex multi-property effect reused in many elements (e.g. hero skyline glow, ambient gradient, stars field) | `@utility <name> { … }` in `globals.css` | Call like a Tailwind class directly: `className="hero-skyline-glow"` |
| Simple single-element pseudo-element effect | `before:` / `after:` Tailwind variants inline in the component | `className="before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent"` |
| One-off inline keyframe used in only one place | Define in a `<style>` tag inside the component as a last resort | Only when the keyframe cannot be expressed with existing tokens and extracting it to `globals.css` would pollute global scope unnecessarily |

### Pattern: exposing a landing keyframe

The 35 `@keyframes` blocks being migrated from `landing.css` follow this exact pattern:

```css
/* globals.css — add inside or after existing @keyframes blocks */
@keyframes rise {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

@theme inline {
  --animate-rise: rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}
```

Then in the component:

```tsx
<div className="animate-rise">…</div>
```

### Pattern: `@utility` for complex reusable effects

```css
/* globals.css */
@utility hero-ambient-glow {
  position: relative;
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(103,232,249,0.15), transparent);
    pointer-events: none;
  }
}
```

### Existing globals.css animation tokens (already present — do not redefine)

| Class | Keyframe | Usage |
|---|---|---|
| `animate-float` | `float` (3s ease-in-out infinite) | Floating hero tokens |
| `animate-wave` | `wave` (1.2s ease-in-out infinite) | Wave effects |
| `animate-twinkle` | `twinkle` | Star/particle effects |
| `animate-shimmer-text` | `shimmer-text` (3s linear infinite) | Sidebar shimmer |
| `animate-shimmer` | `shimmer` | General shimmer |
| `animate-pulse-slow` | — | Slow pulse |
| `animate-bounce-slow` | — | Slow bounce |
| `animate-stepper-pop` | `stepper-pop` | Stepper UI |
| `animate-fade-slide-out` | `fade-slide-out` | Exit transitions |
| `animate-banner-fade-in` | `banner-fade-in` | Banner entrance |
| `animate-shake` | `shake` | Error shake |

Before defining a new keyframe, verify it is not already in the list above.

---

## 6. Per-Section Definition of Done (Checklist for a Section PR)

Every section PR (Phases 1–14) is complete when **all** of the following pass:

- [ ] **Primitives and tokens:** All components in this section use shadcn primitives (where
      applicable per §1) and Tailwind token utilities (per §3). No raw hex values or `px`
      lengths that could be expressed as token utilities.
- [ ] **No `@ts-nocheck`:** The section's component files do not contain `// @ts-nocheck`.
      Type each remaining `any` explicitly; use localized `as <Type>` casts only when the DOM
      API is genuinely dynamic.
- [ ] **Biome clean:** **`pnpm lint` introduces no NEW errors in files this section touches** —
      the repo has pre-existing lint debt in `loop-config/scenarios/generate-tool-scenarios.ts`,
      `src/app/(quest)/loading.tsx`, `src/shared/utils/date-group.ts` which are out of scope.
      Verify with `pnpm lint <changed-files>` or by confirming the error count/locations are
      unchanged from before your change.
      Convention: 2-space indent, line width 100, double quotes, `import type` for type-only
      imports, no `any`, no `console.log` (use `console.warn` / `console.error`).
- [ ] **State via `data-*` only:** No legacy state classes remain for this section. Every
      interactive state (scroll, open/close, in-view, hover active) is driven by `data-*`
      attributes per §4. The corresponding CSS rules in `landing.css` for this section's state
      classes are removed.
- [ ] **`landing.css` trimmed:** All CSS rules that belong exclusively to this section are
      removed from `src/features/landing/landing.css`. The file should be measurably shorter
      after each PR.
- [ ] **After-screenshots captured and matched:** Re-run the capture script for the shots
      relevant to this section, compare against baseline:

      ```bash
      # dev server must be running on :3000
      node scripts/landing-visual-capture.mjs <afterDir>
      ```

      Baseline manifest: `docs/superpowers/landing-baseline-manifest.md` (12 shots across 3
      breakpoints + interaction states). Relevant shots for each section:

      | Phase | Shots to re-check |
      |---|---|
      | 1 — Nav/Sidebar/Backdrop/Preloader | `home-1440-scrolled`, `home-390-sidebar`, `home-1440`, `home-390` |
      | 2 — Hero | `home-1440`, `home-768`, `home-390` |
      | 3 — Partners | `home-1440` |
      | 4 — StellarReel | `home-1440` |
      | 5 — Statement | `home-1440` |
      | 6 — Features | `home-1440-features` |
      | 7 — Convergence | `home-1440` |
      | 8 — Security | `home-1440` |
      | 9 — Fees | `home-1440` |
      | 10 — FAQ | `home-1440-faq-open`, `home-1440` |
      | 11 — CTA | `home-1440-cta-hover`, `home-1440` |
      | 12 — Footer | `home-1440` |
      | 13 — wl/ | `waitlist-1440`, `waitlist-390`, `access-1440`, `access-390` |
      | 14 — Cleanup | All 12 shots |

      Visual match means: no new layout shifts, no colour drift, no missing elements at any
      relevant breakpoint. Pixel-perfect is not required; perceptual match is.

- [ ] **Quality gate — all three pass:**

      ```bash
      pnpm type-check   # tsc --noEmit
      pnpm lint         # Biome
      pnpm build        # Next.js production build
      ```

      All three must exit `0` before the PR is opened for review.
