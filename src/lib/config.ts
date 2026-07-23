// Reads NEXT_PUBLIC_* env (available on both server and client — inlined by Next
// into the client bundle). Every real deploy MUST set the tenant slug.
const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000';

export const API_BASE = RAW_BASE.replace(/\/+$/, '');
export const TENANT_SLUG = process.env.NEXT_PUBLIC_TENANT_SLUG ?? 'demo';

/** Base of all storefront endpoints for the configured farm. */
export const PUBLIC_BASE = `${API_BASE}/public/${TENANT_SLUG}`;

/** Image CDN base for Cloudflare Transformations. Empty → transforms disabled. */
export const CDN_BASE = (process.env.NEXT_PUBLIC_IMG_CDN ?? 'https://cdn.fermeribg.com').replace(/\/+$/, '');

/** ФермериБГ admin panel login (footer link). */
export const ADMIN_LOGIN_URL = `${(process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://app.fermeribg.com').replace(/\/+$/, '')}/login`;

/** Courier (Еконт/Спиди) disabled storefront-wide until fixed — local delivery +
 *  pickup only. Checkout doesn't offer a carrier method at all yet (see
 *  CARRIER_METHODS in src/lib/courier.ts), so this currently only gates the
 *  shop's "С куриер" filter chip (src/components/shop/shop-client.tsx) —
 *  kept true so that chip, and the courier-shipping logic it (and the
 *  checkout N-deliveries notice) depends on, stay dormant until a carrier
 *  method actually exists in checkout. */
export const ONLY_LOCAL_DELIVERY = true;

/** Public origin of this storefront — used for absolute URLs in the sitemap,
 *  robots.txt sitemap pointer, and JSON-LD (canonical `url` fields). Every real
 *  deploy MUST set NEXT_PUBLIC_SITE_URL — the fallback below is a deliberately
 *  invalid placeholder (NOT chaika's real farmmarket.bg domain) so a staging
 *  deploy that forgets to set it advertises an obviously-wrong URL instead of
 *  silently pointing crawlers/structured data at someone else's live site. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://marketplace-next.local.invalid').replace(/\/+$/, '');
