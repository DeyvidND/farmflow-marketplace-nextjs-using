# Chaika → marketplace-next Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Feature-parity port of the 33 post-2026-07-11 chaika commits into farmflow-marketplace-next, plus prod-readiness fixes (SEO, error pages, tests), keeping monetization surfaces super-admin-only.

**Architecture:** All data already arrives in `GET /public/:slug/bootstrap` (legal, lat/lng, bundleProducts, companion fields) — the port is types + client logic + UI only; zero backend changes. Pure logic (companion rule, sellers, catalog bundling, map points) lives in `src/lib/*` with vitest TDD; UI consumes it through the existing React cart context (no event bus needed — context re-renders replace chaika's `cart:changed` CustomEvent).

**Tech Stack:** Next.js 16.2.10 App Router, React 19, Tailwind v4, shadcn/ui, vitest, OpenNext → Cloudflare Workers.

## Global Constraints

- Money math in **integer stotinki**; cart lines store EUR floats → convert per-line with `Math.round(price * 100)` BEFORE summing (chaika 9b626cd).
- Bundles identified by `product.category === 'bundle'`; members arrive inline as `bundleProducts` — there is NO `bundleParentId`.
- Bulgarian copy strings verbatim from the port spec (chaika scout report) — do not paraphrase.
- `ONLY_LOCAL_DELIVERY = true` stays true; carrier-dependent features ship dormant-but-wired.
- Monetization writes stay super-admin-only; no farmer-panel control, no payment code.
- Checkout submit is never tested against prod (real orders); use local backend (`[::1]:3001`).
- All images through `cfImage`/`cfSrcset` — no raw URLs.
- Design tokens: use -next palette (`--primary #33603e`, cream `#faf6ec`, honey `#b5793b`), NOT chaika's hex values.
- Commit per task, message style `feat(scope): …` matching repo history.

---

### Task 1: Test infra + payload types

**Files:**
- Modify: `package.json` (scripts)
- Modify: `src/lib/types.ts`

**Interfaces:**
- Produces: `FarmerLegal { kind?, name?, eik?, vatNumber?, address?, regNo?, confirmedAt? }` (all `string | null | undefined`); `Farmer.legal?: FarmerLegal | null`, `Farmer.story?: string | null`, `Farmer.lat?: number | null`, `Farmer.lng?: number | null`; `PublicBundleItem { productId: string; name: string; slug: string | null; image: string | null; quantity: number; priceStotinki: number }`; `Product.bundleItems?: string[]`, `Product.bundleProducts?: PublicBundleItem[]`, `Product.requiresCompanion?: boolean`, `Product.companionMinPriceStotinki?: number | null`, `Product.courierShippable?: boolean`; `Bootstrap.homeReviews?: unknown[]`.

- [ ] **Step 1:** Add `"test": "vitest run"` to package.json scripts.
- [ ] **Step 2:** Run `npm test` → existing `catalog.test.ts` passes (5 tests).
- [ ] **Step 3:** Add the type fields above to `src/lib/types.ts` (mirror backend `PublicFarmer`/`PublicProduct` in FarmFlow `packages/types`).
- [ ] **Step 4:** `npx tsc --noEmit` clean.
- [ ] **Step 5:** Commit `feat(types): surface legal, coords, bundle + companion payload fields`.

### Task 2: Cart stamping + companion/sellers libs (TDD)

**Files:**
- Modify: `src/components/cart/cart-provider.tsx`
- Create: `src/lib/companion.ts`, `src/lib/companion.test.ts`
- Create: `src/lib/sellers.ts`, `src/lib/sellers.test.ts`
- Modify: `src/components/product-card.tsx`, `src/components/product/product-detail.tsx` (stamp on add)

**Interfaces:**
- Produces: `CartItem` gains `farmerId?: string; farmerName?: string; requiresCompanion?: boolean; companionMinStotinki?: number | null`.
- Produces (companion.ts, all pure over `CartItem[]`):
  - `otherProductsStotinki(items, excludeId): number` — Σ `Math.round(o.price*100)*o.qty` over lines with `o.id.split(':')[0] !== excludeId` (variant lines of the flagged product are excluded by base product id).
  - `unsatisfiedCompanions(items): CartItem[]`
  - `companionSatisfied(productId, minStotinki, items): boolean` (min>0 → other ≥ min; else ≥1 other-id line)
  - `companionShortfall(productId, minStotinki, items): number` (euros, 0 when satisfied)
  - `companionMessage(item): string` — threshold: `„{name}“ не се продава самостоятелно — добавете други продукти на обща стойност поне {X,XX} €.`; else `„{name}“ не се продава самостоятелно — добавете още един продукт по избор.`
- Produces (sellers.ts): `distinctSellers(items): { id: string; name: string }[]` — dedup by `farmerId`, unstamped lines ignored.

- [ ] **Step 1:** Write failing tests: float-rounding regression (0.01+4.02+0.47 vs min 450 → satisfied), same-product variant exclusion, min null/0 → any other line, shortfall math, distinctSellers dedup + unstamped skip.
- [ ] **Step 2:** `npm test` → FAIL (modules missing).
- [ ] **Step 3:** Implement both libs.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Extend `CartItem`; stamp `farmerId/farmerName/requiresCompanion/companionMinStotinki` at every `add()` call site (product-card `onAdd` from `CardData`; product-detail from its farmer props).
- [ ] **Step 6:** `npx tsc --noEmit` clean; commit `feat(cart): stamp seller + companion data on cart lines`.

### Task 3: Shop UX — pagination, reset, hash, a11y

**Files:**
- Modify: `src/components/shop/shop-client.tsx`, `src/app/shop/page.tsx`

**Interfaces:**
- Consumes: existing `CardData[]`, `Category[]`.
- Behavior contract: `PAGE = 24`; every filter change resets `shown = PAGE`; „Зареди още" button + IntersectionObserver (`rootMargin: '400px 0px'`) both advance; button label `Зареди още (още {remaining})`; result bar `Показани {visible} от {matched}` / `Няма резултати`; reset control `Изчисти филтрите` visible iff any filter active; empty states `Няма намерени продукти за „{q}“` / `Няма продукти за този филтър`; `location.hash` selects initial category (fixes dead home-page `/shop#cat` links); chips get `role="group" aria-label="Категории"` + `aria-pressed`; mobile chips ≥44px tap target; right-edge fade mask while `scrollLeft + clientWidth < scrollWidth - 2`.

- [ ] Implement in `shop-client.tsx` (client state; slice matched cards, don't hide via display — React re-render replaces chaika's DOM toggling).
- [ ] Browser-verify: hash deep-link, pagination, reset, fade.
- [ ] Commit `feat(shop): 24-per-page pagination, reset control, hash deep-link, chip a11y`.

### Task 4: Кошници — catalog, cards, PDP (TDD on catalog)

**Files:**
- Modify: `src/lib/catalog.ts`, `src/lib/catalog.test.ts`
- Modify: `src/components/product-card.tsx`, `src/components/product/product-detail.tsx`, `src/app/product/[slug]/page.tsx`

**Interfaces:**
- Produces: `BUNDLE_LABEL = 'Кошници'` (replaces „Сезонни пакети"); `catIdOf` returns `'bundle'` for `category==='bundle'` in BOTH taxonomy modes; `categoriesFrom` multiSubcat branch excludes bundles from subcategory counts and appends synthetic `{ id:'bundle', name:'Кошници', desc:'Готови кошници с продукти от няколко фермери, на обща цена.' }` only when count>0; icon regex `/кошниц|пакет|basket/` → basket glyph.
- Card: badge `🧺 Кошница`; tile grid when `!p.imageUrl && memberPhotos.length ≥ 2` — 2 cols; >2 tiles → 2 rows; exactly 3 → first tile `row-span-2`; `cfImage(src, 360)`.
- PDP: contents card `🧺 Тази кошница съдържа` (44px thumbs, `/product/{slug}` links, `× {qty}`, footer `Кошницата се купува като едно цяло на обявената цена.`); gallery tiles same rule at `cfImage(src, 600)`; og:image falls back to first member photo when product has no own images; legacy `bundleItems` string checklist.

- [ ] Failing tests for `catIdOf` + `categoriesFrom` bundle behavior → implement → pass.
- [ ] Card + PDP UI; og fallback in `generateMetadata`.
- [ ] Commit `feat(baskets): Кошници category, 2×2 member-photo grids, bundle PDP`.

### Task 5: Seller disclosure (КЗП) + farmer address

**Files:**
- Modify: `src/app/farmer/[slug]/page.tsx`, `src/components/farmer/branded-farmer.tsx` (both farmer layouts)
- Modify: `src/components/product/product-detail.tsx` (or product page)
- Modify: `src/components/checkout/checkout-view.tsx`

**Interfaces:**
- Consumes: `farmer.legal`, `distinctSellers(items)` from Task 2.
- Farmer page block (render iff `legal?.name`): label `Продавач`; bold name; id line `ЕИК/БУЛСТАТ {eik}` else `Рег. № зем. производител {regNo}`, optional ` · ДДС № {vatNumber}`, ` · {address}`; footnote `Продавач по договора за поръчката е този производител. Пазарът предоставя онлайн мястото за търговия като посредник.`
- Product page block: header `Продавач на този продукт`; footnote `Договорът за покупка се сключва с този производител. Пазарът е посредник (онлайн място за търговия).`
- Address: `legal.address` joins the farmer contact row (pin icon), independent of `legal.name`.
- Checkout notice (iff distinct sellers ≥ 2), in summary aside above submit: `Поръчка от {N} производители. Договорът за всеки продукт се сключва със съответния производител — пазарът е посредник (онлайн място за търговия). Продавачи: {names}.`

- [ ] Implement all four surfaces; inert-by-default (no legal data live yet).
- [ ] Commit `feat(marketplace): КЗП seller disclosure on farmer/product/checkout + farmer address`.

### Task 6: Loss-leader companion lock UI

**Files:**
- Modify: `src/components/product-card.tsx`, `src/components/product/product-detail.tsx`, `src/components/cart/cart-view.tsx`, `src/components/checkout/checkout-view.tsx`

**Interfaces:**
- Consumes: `companionSatisfied/companionShortfall/companionMessage/unsatisfiedCompanions` (Task 2), live `useCart().items`.
- Card (iff `requiresCompanion && !soldOut && !hasVariants`): hint `🧺 Промо цена — добавя се към поръчка с други продукти за поне {X} €` / `…добавя се заедно с още поне един продукт` (cream box, hidden once satisfied); locked button `🔒 Още {X,XX} € други продукти` / `🔒 Добави с друг продукт` + `title` tooltip `„{name}“ се добавя само с други продукти на обща стойност поне {min} €.` / `„{name}“ се добавя само заедно с друг продукт.`
- PDP notice: `**Промо цена — върви с поръчката.** Този продукт е на специална цена, затова се добавя заедно с други продукти на обща стойност поне {X}. Щом количката ги достигне, бутонът се отключва автоматично.` (no-threshold variant per spec).
- Cart: unmet → warning box `companionMessage(unmet[0])`, „Към касата" disabled.
- Checkout submit guard: unmet → sonner error toast `companionMessage(unmet[0])` + route to `/cart`.

- [ ] Implement; sold-out buttons never companion-managed.
- [ ] Commit `feat(storefront): loss-leader companion lock with explanations`.

### Task 7: Карта

**Files:**
- Create: `src/app/karta/page.tsx`, `src/components/karta/farmer-map.tsx` (client), `src/lib/farmer-map.ts`, `src/lib/farmer-map.test.ts`
- Modify: `src/components/site-header.tsx` (nav `Карта` iff multiFarmer)

**Interfaces:**
- Produces: `resolveMapPoints(farmers, slugs): { name, village, lat, lng, slug }[]` — pure filter on `lat != null && lng != null`, `village = city ?? ''`, `slug` from `farmerSlugMap` (null-safe). TDD.
- Page: h1 `Карта на фермерите`, eyebrow `Откъде идва храната`, lead `Нашите фермери и стопанства из България — по адреса на стопанството, където е известен.`; meta description `Виж на картата откъде идват фермерите и стопанствата зад продуктите на {sf.name}.`; SSR fallback `<ul>` of village+name cards (links when slug) shown when map can't run; map hidden until JS boots it.
- Client map: Google Maps JS (`language=bg&region=BG`, no places lib), key `process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY` — empty key → fallback list is the page; controls: zoomControl only, `clickableIcons:false`; branded teardrop pin 30×40 data-URI SVG in -next tokens (fill `#33603e`, ring `#faf6ec`, dot `#b5793b`); custom `OverlayView` popup card (bg cream, Lora name, village line, `Виж профил →` iff slug, close `×` aria-label `Затвори`), one at a time, map-click closes; `POPUP_TOP_CLEARANCE = 210`: `fitBounds` padding `{top:210, right:64, bottom:64, left:64}`, on-click `panBy` when `y < 210`; initial zoom clamp `> 11 → 11` once on `idle`.

- [ ] TDD `resolveMapPoints` → implement → pass.
- [ ] Page + client map + nav link.
- [ ] Commit `feat(karta): farmer map with branded pins + popup, no-JS fallback`.

### Task 8: Dormant courier logic + config wiring

**Files:**
- Create: `src/lib/courier.ts`, `src/lib/courier.test.ts`
- Modify: `src/components/checkout/checkout-view.tsx`, `src/components/shop/shop-client.tsx`, `src/lib/config.ts` (comment truth)

**Interfaces:**
- Produces: `courierBlockers(items, productById): { fragileNames: string[]; hasBasket: boolean }` (basket: `category==='bundle'`; fragile: `courierDisabled===true`; unknown ids ignored). `CARRIER_METHODS = new Set(['econt','econt_address','courier'])`.
- Checkout N-deliveries notice (amber box, under method chooser): render iff `distinctSellers ≥ 2 && CARRIER_METHODS.has(method)` — dormant today (methods are pickup/address only): `Продуктите ти са от {N} различни производители. Ще се създадат {N} отделни доставки — по една от всеки фермер, всяка със собствен наложен платеж при получаване.`
- Shop „С куриер" chip: rendered iff `!ONLY_LOCAL_DELIVERY && ≥1` active product with `farmer.courierReady && !courierDisabled` — dormant while flag true.

- [ ] TDD courierBlockers → implement → pass; wire notice + chip; fix `config.ts` comment to describe real usage.
- [ ] Commit `feat(checkout): dormant N-deliveries notice + courier blockers behind ONLY_LOCAL_DELIVERY`.

### Task 9: SEO + robustness (prod-readiness)

**Files:**
- Create: `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/not-found.tsx`, `src/app/error.tsx`
- Modify: `src/app/product/[slug]/page.tsx`, `src/app/farmer/[slug]/page.tsx`, `src/app/shop/page.tsx` (JSON-LD), page `description` metadata.

**Interfaces:**
- sitemap: home, /shop, /farmers, /karta, product + farmer detail pages (slugs), static pages; base from `NEXT_PUBLIC_SITE_URL` (add to config with sane default).
- robots: allow all, sitemap pointer; JSON-LD: `Product` + `Offer` (EUR, availability) on PDP, `ItemList` on shop, `LocalBusiness`-ish farmer page.
- error.tsx: friendly BG copy + retry; not-found: BG 404 + links.

- [ ] Implement; `npm run build` green.
- [ ] Commit `feat(seo): sitemap, robots, JSON-LD, error + 404 pages`.

### Task 10: Verification gates (W2 + W3)

- [ ] `npm test`, `npx tsc --noEmit`, `npm run build`, `npx opennextjs-cloudflare build` all green.
- [ ] Dev server against prod public API (`fermeski-pazar-chayka`): browser-verify each cluster + tier rail order, ФнС hero, Хит badges (W2).
- [ ] Checkout submit E2E against local backend only.
- [ ] Fix everything found; commit fixes.

### Task 11: Staging deploy (owner-gated)

- [ ] Build with staging env (`NEXT_PUBLIC_API_BASE=https://api.fermeribg.com`, `NEXT_PUBLIC_TENANT_SLUG=fermeski-pazar-chayka`, CDN, Maps key incl. workers.dev referrer).
- [ ] **Ask owner**, then `npx opennextjs-cloudflare deploy` → verify workers.dev URL live.
