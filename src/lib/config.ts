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
 *  pickup only. Gates every courier badge so a card never promises shipping
 *  checkout won't offer. */
export const ONLY_LOCAL_DELIVERY = true;
