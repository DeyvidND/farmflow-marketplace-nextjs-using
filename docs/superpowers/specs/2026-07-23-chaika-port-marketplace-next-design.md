# Chaika → marketplace-next: full feature port + monetization verify + prod-readiness

Date: 2026-07-23 · Owner: DNDonchev · Status: approved (design), implementation pending

## Goal

Bring `farmflow-marketplace-next` (the redesigned Next.js marketplace shell for
farmmarket.bg) up to feature parity with everything `fermerski-pazar-chaika`
shipped after 2026-07-11 (33 commits), verify the super-admin-controlled
monetization surfaces (tiers, фермер на седмицата, Хит badges), audit the app
for production readiness, and stand up a staging deploy on its own Cloudflare
worker. Monetization stays **admin-controls-only** — money changes hands
offline; zero payment code in this phase.

## Context

- `fermerski-pazar-chaika` (Astro, CF Workers) **is** farmmarket.bg live today.
- `farmflow-marketplace-next` (Next.js 15 + shadcn, OpenNext → CF) is the
  redesigned marketplace shell. Frozen at 2026-07-11; consumes backend
  `farmers[].tier` + `farmerOfWeek` from the public bootstrap. Almost the whole
  tree is uncommitted; no git remote.
- Backend curation is live in FarmFlow `main`: `PATCH /platform/products/:id/featured`
  („Хит", reuses `products.featured`), `PATCH /platform/farmers/:id/tier` (1–3),
  farmer-of-week — all super-admin (`platform` module) only. Farmer panel has no
  write path to any of these (its „продукт на седмицата" is a separate
  tenant-level concept and stays).
- `farmflow-marketplace` (Astro de-brand fork) is **out of scope** — the Next
  app is the marketplace going forward.

## Decisions (owner, 2026-07-23)

1. Target repo = `farmflow-marketplace-next`.
2. Deploy = separate staging CF worker first; farmmarket.bg swap is a later call.
3. Monetization = super-admin controls only, billing handled offline.

## Workstreams

### W0 — Baseline

Commit the owner's uncommitted tree as a baseline commit before any port work.
Add `.open-next/` and `.wrangler/` to `.gitignore`.

### W1 — Port the 33 chaika commits (7 clusters, small → large)

Native Next/React re-implementation in the -next design system — no mechanical
Astro translation. Pure logic is TDD'd in vitest.

1. **Shop UX** — mobile filter row scrolls instead of wrapping, reset-filters
   control, scrollable-chip fade, chip-group a11y, „Зареди още" pagination.
2. **Seller disclosure (КЗП)** — „Продавач" block on farmer + product pages
   (renders only when `farmer.legal.name` set — inert until data exists);
   multi-seller notice at checkout. Cart lines are stamped with
   `farmerId`/`farmerName` at add-time (chaika lesson: never derive sellers via
   network at checkout).
3. **Farmer address** on the profile page.
4. **Кошници (baskets)** — bundle category renamed to Кошници with its own chip
   (incl. multiSubcat tenants), basket cards drawn as 2×2 grid of member photos,
   пакет→кошница copy, checkout courier methods gated on baskets, og:image /
   JSON-LD falls back to a member photo.
5. **Loss-leader companion lock** — companion rule counts OTHER products' total,
   compares in integer stotinki (never float euros), add-to-cart locked until
   the basket qualifies with an explanation (not just a gate), checkout guard.
6. **Карта** — `/karta` page with Google Maps markers from real farmer
   coordinates, branded pin + popup card (no top-edge clipping), nav link +
   sitemap entry, no-JS fallback. Maps key resolved via wrangler vars at
   runtime, not hardcoded.
7. **Checkout N-deliveries notice** — pre-submit notice that a multi-farmer
   carrier order ships as N separate deliveries. Ported but dormant:
   `ONLY_LOCAL_DELIVERY` stays `true`.

### W2 — Monetization surfaces verify (no new money code)

- Tier-sorted farmer rail, фермер-на-седмицата hero, Хит badges render from the
  bootstrap payload.
- Confirm write paths remain super-admin-only (platform controller). No farmer
  panel control.

### W3 — Prod-readiness audit

- `npm run build`, `tsc`, vitest, OpenNext build all green.
- SEO: per-page metadata, JSON-LD, sitemap, robots.
- Error handling: API-down fallback, empty catalog, 404s.
- ISR/caching behavior sane (60s ISR + Redis-cached public API upstream).
- a11y basics.
- Checkout submit tested against a **local** FarmFlow backend only — never POST
  real orders to prod.

### W4 — Staging deploy

Unique worker name (`farmflow-marketplace-next`) — must never touch the chaika
farmmarket.bg worker. Env: `NEXT_PUBLIC_API_BASE=https://api.fermeribg.com`,
`NEXT_PUBLIC_TENANT_SLUG=fermeski-pazar-chayka`, image CDN, Maps key. Owner
confirms before the actual `wrangler deploy`.

### W5 — Monetization ideas doc

Short doc: pricing/packaging ideas for бутане напред + категоризиране (tier
ladder pricing, ФнС slot, Хит fee, sponsored category placement, home-rail
slots, etc.). Ideas only — no implementation.

## Non-goals

- No Stripe/billing automation.
- No changes to chaika (farmmarket.bg keeps running as-is).
- No backend schema changes expected; if a gap appears (e.g. bootstrap missing
  a field), smallest additive fix in FarmFlow with its own tests.
- No farmmarket.bg domain swap.

## Testing

- vitest for pure logic (companion rule, basket grouping, seller stamping,
  catalog helpers).
- Browser-pane verification per cluster on local dev against the read-only prod
  public API (`fermeski-pazar-chayka`).
- Full-suite + build gates before staging deploy.

## Risks

- Framework mismatch: chaika logic lives in Astro islands + `ui.ts` global
  handlers; -next uses a React cart context. Port behavior, not code.
- Checkout POST against prod creates real orders — guard: local backend for
  order-flow tests (NB local Nest binds IPv6 → `[::1]:3001`).
- Google Maps key restriction must include the staging worker origin.
- Bootstrap payload differences between what chaika reads and what -next types
  expect (e.g. `legal`, bundle fields) — verify `src/lib/types.ts` against the
  live payload early.
