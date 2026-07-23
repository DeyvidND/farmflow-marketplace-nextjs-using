import type { CSSProperties } from "react";
import { cfImage, cfSrcset } from "@/lib/img";

/**
 * The one optimized <img> for the whole marketplace. Serves Cloudflare-resized,
 * format-negotiated (AVIF/WebP) images and — when a `sizes` is given — a `srcset`
 * so a phone never downloads a desktop-width photo. Below-the-fold by default
 * (loading="lazy" + decoding="async"); pass `priority` for the LCP image (eager +
 * high fetch priority). Fixed-size slots (avatars, thumbnails) omit `sizes` and get
 * a single right-sized src. Renders null when there's no src, so callers keep their
 * own placeholder branch.
 */

// DPR-aware srcset ladder; only widths up to ~2.2× the slot are emitted.
const LADDER = [160, 240, 360, 480, 640, 800, 1000, 1200, 1400, 1800];

export function CfImg({
  src,
  width,
  sizes,
  alt = "",
  className,
  style,
  priority = false,
  widths,
}: {
  /** Original CDN URL. */
  src: string | null | undefined;
  /** 1× display width in px — the single-src fallback and the srcset ceiling. */
  width: number;
  /** Slot sizing (e.g. "(min-width:1024px) 270px, 50vw"). Omit for fixed slots. */
  sizes?: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  /** LCP image: load eagerly at high priority instead of lazily. */
  priority?: boolean;
  /** Override the srcset widths; defaults to the ladder up to ~2.2× width. */
  widths?: number[];
}) {
  if (!src) return null;
  const set = sizes ? (widths ?? LADDER.filter((w) => w <= width * 2.2)) : null;
  const srcSet = set && set.length ? cfSrcset(src, set) : undefined;
  return (
    // CF already resizes/re-encodes at the edge; next/image would double-optimize.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cfImage(src, width)}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      className={className}
      style={style}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      {...(priority ? { fetchPriority: "high" as const } : {})}
    />
  );
}
