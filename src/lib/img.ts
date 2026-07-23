// Cloudflare image-transformation URL builders. One web-sized master per image
// in R2; the edge resizes + re-encodes (AVIF/WebP) on demand. Empty CDN → raw URL.
import { CDN_BASE } from './config';

const TRANSFORMABLE = /\.(jpe?g|webp|gif)$/i;
const MASTER_MAX = 2560;

function keyOf(url: string): string | null {
  try {
    return new URL(url).pathname.replace(/^\/+/, '') || null;
  } catch {
    return null;
  }
}

function transformable(url: string | null | undefined): string | null {
  if (!url || !CDN_BASE) return null;
  const key = keyOf(url);
  return key && TRANSFORMABLE.test(key) ? key : null;
}

/** One transformed URL at `width` px (format negotiated from Accept). Falls back
 *  to the original URL when transforms don't apply. */
export function cfImage(url: string | null | undefined, width: number): string | undefined {
  const key = transformable(url);
  if (!key) return url ?? undefined;
  const w = Math.min(MASTER_MAX, Math.round(width));
  return `${CDN_BASE}/cdn-cgi/image/width=${w},format=auto,fit=scale-down/${key}`;
}

/** A `srcset` string across the given widths so the browser picks the right size for
 *  the viewport/DPR (paired with a `sizes` attribute). Returns undefined when the URL
 *  can't be transformed (raw/non-CDN) — the caller then falls back to the single src. */
export function cfSrcset(url: string | null | undefined, widths: number[]): string | undefined {
  const key = transformable(url);
  if (!key) return undefined;
  return widths
    .map((width) => {
      const w = Math.min(MASTER_MAX, Math.round(width));
      return `${CDN_BASE}/cdn-cgi/image/width=${w},format=auto,fit=scale-down/${key} ${w}w`;
    })
    .join(", ");
}
