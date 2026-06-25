# Landing → Tailwind + shadcn Migration — Design Spec

- **Ngày:** 2026-06-25
- **Repo:** `tasmil-finance`
- **Phạm vi:** Toàn bộ route `src/app/(landing-page)` + feature `src/features/landing/`
- **Loại công việc:** Refactor kỹ thuật thuần — **giữ look y hệt**, đổi nền tảng styling.

---

## 1. Mục tiêu & ràng buộc

### Mục tiêu
Chuyển toàn bộ landing page từ một stylesheet custom (`landing.css`, ~7.669 dòng, class semantic tự đặt) sang **chuẩn styling của app**: Tailwind v4 class + design token + component shadcn ở `src/shared/ui/`.

### Ràng buộc đã chốt với chủ dự án
1. **Giữ look y hệt** — đây là refactor, không phải redesign. Giao diện trước/sau phải khớp về thị giác.
2. **Xóa sạch 100% `landing.css`** — cuối dự án file này không còn được import và bị xóa khỏi bundle. Keyframe/effect dời sang `globals.css` (nơi-chuẩn của app), không còn stylesheet riêng cho landing.
3. **Phạm vi đầy đủ** — gồm cả trang marketing chính, `/waitlist`, `/access`, và các phần khung (Nav, Sidebar, Preloader, Backdrop).
4. **Giữ một bản CSS để revert** — archive nguyên `landing.css` thành bản không-import trước khi bắt đầu.

### Ngoài phạm vi (YAGNI)
- Không đổi nội dung copy, asset, thông điệp marketing.
- Không thêm tính năng mới, không đổi hành vi tương tác.
- Không refactor các feature khác ngoài `landing/`.

---

## 2. Hiện trạng (kết quả khảo sát)

**Cấu trúc:**
- `src/app/(landing-page)/`: `layout.tsx` (chỉ import `landing.css` + metadata), `page.tsx` (dynamic-import `LandingClient`, `ssr:false`), `loading.tsx`, `waitlist/page.tsx`, `access/page.tsx`.
- `src/features/landing/landing.css`: **7.669 dòng**, scoped dưới `.landing-page` (và `.wl-page` cho waitlist/access).
- `src/features/landing/components/`: 13 section component + `LandingClient.tsx`, `useLandingScripts.ts` (**817 dòng, `@ts-nocheck`**), thư mục `wl/` (`shared.tsx` 894, `landing.tsx` 417, `access.tsx` 421), `ui/stepper.tsx` (55), `animations/svg-anims.tsx` (231).

**Mức độ phức tạp của CSS:**
| Hạng mục | Số lượng |
|---|---|
| `@keyframes` | 35 |
| Rule dùng `::before` / `::after` | 68 |
| `@media` breakpoint | 50 |
| Rule khóa theo state-class do JS bật/tắt | 64 |

**Ràng buộc CSS ↔ JS (rủi ro chính):**
`useLandingScripts.ts` là một engine animation/tương tác imperative: **148 thao tác DOM** (`querySelector`/`getElementById`/`classList`/`style`) bám vào ~40+ id/class, toggle các state-class (`.reveal.in`, `.nav.scrolled`, `.sidebar.open`...) mà CSS khóa theo, đồng thời điều khiển các widget demo trong Features (farm simulator, portfolio chart, chat thread, swap pad tính USD trực tiếp, ticker, position deck/pager). → Không thể xóa CSS mà không đồng thời viết lại phần JS này.

**Chuẩn của app (đích đến):**
- Tailwind v4, cấu hình `@theme` inline trong `src/app/globals.css`; token màu HSL (`--primary`, `--background`, `--foreground`, `--card`, `--border`...), font `--font-outfit`.
- `globals.css` đã có sẵn pattern keyframe (`@keyframes float/wave` + `.animate-float`) → nơi-chuẩn để dời keyframe của landing về.
- Primitive shadcn ở `src/shared/ui/`: `Button` (CVA; có variant `gradient`/`brand` dùng `.brand-gradient-interactive` cho CTA, `ghost`, `outline`, size `lg`...), `Badge` (rounded-full, variant `outline`/`secondary`...), `Card`, `Collapsible`, `Dialog`, `Tabs`, `Typography`, `Separator`...; helper `cn` từ `@/lib/utils`.
- Convention Biome: 2-space indent, line width 100, double quote, `import type`, **không `any`**, **không `console.log`**, alias `@/*`, import qua feature barrel.

---

## 3. Chiến lược chuyển đổi

### 3.1. Nguyên tắc map primitive
Giải quyết mâu thuẫn "dùng shadcn" vs "giữ look y hệt": **dùng component shadcn làm primitive cấu trúc/hành vi, override bằng Tailwind className để giữ đúng look cũ.** Không ép look về default của shadcn; nơi nào default đã khớp thì dùng thẳng variant.

| Element landing | Chuyển thành |
|---|---|
| `.btn.btn-primary` (CTA chính) | `<Button asChild variant="gradient">…</Button>` (bọc `<a>`/`<Link>`); override className nếu lệch look |
| `.btn.btn-ghost` | `<Button asChild variant="ghost"` hoặc `"outline">` + override |
| `.hero-pill`, `.eyebrow`, `.overline` | `<Badge variant="outline">` + override, hoặc `<span>` + utility khi quá khác |
| Card/panel (`.sec-card`, `.fa-*`...) | `<Card>` + override; hoặc `<div>` + utility nếu Card không khớp cấu trúc |
| FAQ accordion | `Collapsible` (giữ hành vi mở/đóng), look override bằng utility |
| `.wrap`, `.mono`, layout/spacing/màu/typography | Tailwind utility thuần, ưu tiên token |

**Quy tắc utility:**
- Ưu tiên **token** (`text-primary`, `bg-card`, `border-border`, `text-muted-foreground`) hơn giá trị hardcode.
- Chỉ dùng arbitrary value (`[…]`) khi token/utility không biểu đạt được giá trị gốc.
- Mỗi component: bỏ `// @ts-nocheck`, gõ type đúng, theo Biome (double quote, `import type`, không `any`/`console.log`), import primitive qua barrel `@/shared/ui` (hoặc path chuẩn của repo).

### 3.2. Dời keyframe & hiệu ứng vào `globals.css`
Keyframe và effect tái dùng **không inline rải rác** mà gom về `src/app/globals.css`, đúng pattern sẵn có:
- 35 `@keyframes` → khai báo trong `globals.css`, expose qua `@theme { --animate-<name>: <name> <duration> <easing> … }` để dùng class `animate-<name>`.
- Hiệu ứng phức tạp lặp lại (gradient amb, stars field, hero skyline, beams, 3D transform) → `@utility <name> { … }` trong `globals.css`, gọi như class Tailwind.
- Pseudo-element đơn giản → Tailwind `before:`/`after:` variant inline tại component.

Kết quả: hiệu ứng vẫn "Tailwind/chuẩn app", và `landing.css` rỗng hoàn toàn ở cuối.

### 3.3. State class → `data-*` attribute + viết lại JS
Phần rủi ro nhất (64 rule + 817 dòng JS). Quy ước mới:
- `useLandingScripts.ts` thôi toggle class trạng thái; thay bằng **`el.dataset.*`**:
  - `nav.dataset.scrolled = "true"` ↔ markup `data-[scrolled=true]:…`
  - `sidebar.dataset.state = "open"` ↔ `data-[state=open]:…`
  - `reveal.dataset.inview = "true"` ↔ `group-data-[inview=true]:…` (giữ IntersectionObserver, chỉ đổi output)
- Widget demo trong Features (farm/portfolio/chat/swap, ticker, position deck): **giữ nguyên logic số liệu**, chỉ đổi cách bám DOM (id/`data-*` ổn định) và cách áp style → ưu tiên set `dataset`/CSS custom property thay vì class.
- Gõ type lại `useLandingScripts.ts` ở mức hợp lý (bỏ `@ts-nocheck`). Nếu một số nhánh DOM API quá động, khoanh vùng type cục bộ thay vì nocheck cả file.

### 3.4. Các cách đã loại
- **Big-bang** (viết lại tất cả + xóa CSS một phát): diff khổng lồ, rủi ro lệch look cao, khó bisect. Loại.
- **Cầu nối `@apply`** (giữ class semantic qua `@apply` rồi inline dần): bước trung gian busywork. Loại.

---

## 4. Kiểm chứng "look y hệt"

- **Baseline (Phase 0):** chụp screenshot landing **hiện tại** qua MCP (chrome-devtools/playwright) trên dev `:3000`, ở **3 breakpoint** (~1440 / 768 / 390) + các **trạng thái tương tác**: nav scrolled, sidebar mở, FAQ mở, hover CTA, một vài state của demo trong Features. Lưu trong scratchpad của session.
- **Sau mỗi section:** chụp lại đúng khung/trạng thái đó, so trước/sau, sửa tới khi khớp thị giác rồi mới xóa phần CSS tương ứng.
- **Diff toàn trang** ở phase cuối sau khi xóa `landing.css`.

**Cổng chất lượng mỗi PR:** `pnpm type-check`, `pnpm lint`, `pnpm build` đều xanh.

---

## 5. Backup & revert

- **Phase 0:** archive nguyên `src/features/landing/landing.css` → `src/features/landing/landing.legacy.css.bak` (**không import** ở bất kỳ đâu — chỉ để diff/khôi phục), cộng git history.
- **Cách revert nhanh:** khôi phục component từ git + import lại bản backup trong `layout.tsx`.
- File `.bak` được giữ tới khi toàn bộ dự án nghiệm thu xong; xóa ở một dọn-dẹp riêng nếu chủ dự án đồng ý.

---

## 6. Phân kỳ & deliverable

Mỗi phase = **1 PR** vào nhánh feature → `deploy/prod` (theo quy trình repo). Mỗi PR tự chứa, review được độc lập, và teo dần `landing.css`.

| # | Phase | Nội dung |
|---|---|---|
| 0 | **Foundation** | Dời 35 keyframe + utility hiệu ứng vào `globals.css` (`@theme`/`@utility`); định nghĩa quy ước `data-*` + Tailwind data-variant; lập baseline screenshot harness; tài liệu hóa pattern "shadcn primitive + override className"; archive `landing.legacy.css.bak`. |
| 1 | **Khung xuyên suốt** | Nav, Sidebar, Backdrop, Preloader, thanh progress, **engine reveal/scroll** (viết lại phần JS toggle class → `data-*`). |
| 2 | Hero | |
| 3 | Partners | |
| 4 | StellarReel | |
| 5 | Statement | |
| 6 | **Features** (nặng nhất, 632 dòng) | Có các demo farm/portfolio/chat/swap do JS điều khiển — tách nhỏ nếu cần. |
| 7 | Convergence | |
| 8 | Security | |
| 9 | Fees | |
| 10 | FAQ | Dùng `Collapsible`. |
| 11 | CTA | |
| 12 | Footer | |
| 13 | **wl/** | `/access` + `/waitlist`: `wl/shared.tsx`, `wl/landing.tsx`, `wl/access.tsx`, `ui/stepper.tsx`, `animations/svg-anims.tsx`. |
| 14 | **Dọn dẹp** | Bỏ import `landing.css` trong `layout.tsx`, xóa `landing.css`; diff toàn trang ở 3 breakpoint; type-check/lint/build cuối. |

**Thứ tự ưu tiên:** Phase 1 (khung + reveal engine) làm trước các section vì nav-scroll và reveal-on-scroll là cross-cutting; các section sau bám vào quy ước `data-*` đã thiết lập.

---

## 7. Rủi ro & giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| Lệch look ở hiệu ứng 3D/keyframe phức tạp | Baseline screenshot + so từng section; giữ giá trị gốc qua `@utility`/arbitrary value khi cần. |
| JS rewrite làm vỡ tương tác (nav scroll, reveal, demo) | Đổi class→`data-*` từng phần, test thủ công từng trạng thái; engine reveal/scroll làm sớm ở Phase 1. |
| Widget demo trong Features bám DOM động, dễ gãy | Giữ nguyên logic số liệu, chỉ đổi tầng bám DOM; có thể tách Features thành nhiều PR con. |
| `wl/` là thế giới scope riêng (`.wl-page`), lớn | Để cuối (Phase 13), sau khi pattern đã ổn định ở các phase trước. |
| Mất khả năng khôi phục | `landing.legacy.css.bak` + git history. |

---

## 8. Định nghĩa "Hoàn thành"

- `src/features/landing/landing.css` đã bị xóa và không còn được import ở bất kỳ đâu.
- Mọi component landing (gồm `wl/`) không còn `// @ts-nocheck`, dùng Tailwind token + shadcn primitive, đạt Biome lint.
- Keyframe/effect nằm trong `globals.css` theo pattern `@theme`/`@utility`.
- Trạng thái tương tác (nav scroll, sidebar, reveal, FAQ, demo Features, stepper waitlist) hoạt động y như trước.
- Screenshot trước/sau khớp thị giác ở 3 breakpoint.
- `pnpm type-check`, `pnpm lint`, `pnpm build` xanh.
- `landing.legacy.css.bak` còn trong repo để revert.
